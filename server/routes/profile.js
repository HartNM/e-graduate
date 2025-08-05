const express = require("express");
const router = express.Router();
const authenticateToken = require("../middleware/authenticateToken");
const { poolPromise } = require("../db");
const axios = require("axios");

router.get("/profile", authenticateToken, async (req, res) => {
	const { reference_id, role } = req.user;
	if (reference_id.length == 9) {
		try {
			const studentRes = await axios.get(`http://localhost:8080/externalApi/student/${reference_id}`);
			studentInfo = studentRes.data;
			res.status(200).json({ name: studentInfo.student_name, role: "student", id: studentInfo.student_id, education_level: studentInfo.request_type });
		} catch (err) {
			console.warn(`unsuccessful ${reference_id}`);
			res.status(500).json({ message: "Internal Server Error" });
		}
	} else {
		// กำหนดตารางและคอลัมน์ตาม role
		const tableMap = {
			advisor: {
				table: "advisor",
				idCol: "advisor_id",
				nameCol: "advisor_name",
				idSea: "study_group_id",
			},
			chairpersons: {
				table: "chairpersons",
				idCol: "chairpersons_id",
				nameCol: "chairpersons_name",
				idSea: "major_id",
			},
			dean: {
				table: "dean",
				idCol: "dean_id",
				nameCol: "dean_name",
				idSea: "faculty_name",
			},
			officer_registrar: {
				table: "officer_registrar",
				idCol: "officer_registrar_id",
				nameCol: "officer_registrar_name",
			},
			officer_faculty: {
				table: "officer_faculty",
				idCol: "officer_faculty_id",
				nameCol: "officer_faculty_name",
			},
		};
		const roleInfo = tableMap[role];
		if (!roleInfo) {
			return res.status(400).json({ message: "Invalid role" });
		}
		try {
			let selectCols = `${roleInfo.nameCol} AS name`;
			if (roleInfo.idSea) {
				selectCols += `, ${roleInfo.idSea} AS id`;
			}
			const pool = await poolPromise;
			const result = await pool.request().input("id", reference_id).query(`SELECT ${selectCols} FROM ${roleInfo.table} WHERE ${roleInfo.idCol} = @id`);
			if (result.recordset.length === 0) {
				return res.status(404).json({ message: "User not found" });
			}
			res.status(200).json({ name: result.recordset[0].name, role: role, id: result.recordset[0].id });
		} catch (err) {
			console.error("Profile query error:", err);
			res.status(500).json({ message: "Internal Server Error" });
		}
	}
});

router.get("/studentInfo", authenticateToken, async (req, res) => {
	const student_id = req.user.reference_id;
	try {
		const response = await axios.get(`http://localhost:8080/externalApi/student/${student_id}`);
		res.status(200).json(response.data);
	} catch (err) {
		console.error("API call error:", err);
		res.status(500).json({ message: "Internal Server Error" });
	}
});

module.exports = router;
