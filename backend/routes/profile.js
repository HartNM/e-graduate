const express = require("express");
const router = express.Router();
const authenticateToken = require("../middleware/authenticateToken");
const { poolPromise } = require("../db");
/* const axios = require("axios");
const BASE_URL = process.env.VITE_API_URL; */
const { getStudentData } = require("../externalApi/studentService");

/* router.get("/profile", authenticateToken, async (req, res) => {
	const { reference_id, role } = req.user;
	if (reference_id.length == 9) {
		// นักศึกษา
		try {
			const studentRes = await axios.get(`${BASE_URL}/api/student/${reference_id}`);
			const studentInfo = studentRes.data;
			return res.status(200).json({
				name: studentInfo.student_name,
				role: "student",
				id: studentInfo.student_id,
				education_level: studentInfo.education_level,
			});
		} catch (err) {
			console.warn(`ดึงข้อมูลนักเรียนไม่สำเร็จ: ${reference_id}`);
			return res.status(502).json({ message: "ไม่สามารถเชื่อมต่อกับระบบภายนอกได้" }); // Bad Gateway
		}
	} else {
		// บุคลากร
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
				idSea: "major_name",
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
			officer_major: {
				table: "officer_major",
				idCol: "officer_major_id",
				nameCol: "officer_major_name",
				idSea: "major_name",
			},
		};
		const roleInfo = tableMap[role];
		if (!roleInfo) {
			return res.status(400).json({ message: "บทบาทผู้ใช้งานไม่ถูกต้อง" });
		}
		try {
			let selectCols = `${roleInfo.nameCol} AS name`;
			if (roleInfo.idSea) {
				selectCols += `, ${roleInfo.idSea} AS id`;
			}
			const pool = await poolPromise;
			const result = await pool.request().input("id", reference_id).query(`SELECT ${selectCols} FROM ${roleInfo.table} WHERE ${roleInfo.idCol} = @id`);
			if (result.recordset.length === 0) {
				return res.status(404).json({ message: "ไม่พบข้อมูลผู้ใช้งาน" });
			}
			return res.status(200).json({
				name: result.recordset[0].name,
				role: role,
				id: result.recordset[0].id,
			});
		} catch (err) {
			console.error("เกิดข้อผิดพลาดระหว่างดึงข้อมูลบุคลากร:", err);
			return res.status(500).json({ message: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์" });
		}
	}
});
*/

/* router.get("/profile", authenticateToken, async (req, res) => {
	const { user_id } = req.user;
	if (user_id.length == 9) {
		try {
			const studentRes = await axios.get(`${BASE_URL}/api/student/${user_id}`);
			const studentInfo = studentRes.data;
			return res.status(200).json({
				name: studentInfo.student_name,
				education_level: studentInfo.education_level,
			});
		} catch (err) {
			console.warn(`ดึงข้อมูลนักเรียนไม่สำเร็จ: ${user_id}`);
			return res.status(502).json({ message: "ไม่สามารถเชื่อมต่อกับระบบภายนอกได้" }); // Bad Gateway
		}
	} else {
		try {
			const pool = await poolPromise;
			const result = await pool.request().input("user_id", user_id).query(`SELECT * FROM users WHERE user_id = @user_id`);
			if (result.recordset.length === 0) {
				return res.status(404).json({ message: "ไม่พบข้อมูลผู้ใช้งาน" });
			}
			return res.status(200).json({
				name: result.recordset[0].name,
			});
		} catch (err) {
			console.error("เกิดข้อผิดพลาดระหว่างดึงข้อมูลบุคลากร:", err);
			return res.status(500).json({ message: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์" });
		}
	}
}); */

router.get("/studentInfo", authenticateToken, async (req, res) => {
	const { user_id } = req.user;
	try {
		/* const response = await axios.get(`${BASE_URL}/api/student/${user_id}`);
		return res.status(200).json(response.data); */
		const studentData = await getStudentData(user_id);
		if (!studentData) {
			return res.status(404).json({ message: "ไม่พบข้อมูลนักศึกษา" });
		}
		return res.status(200).json(studentData);
	} catch (err) {
		console.error("เกิดข้อผิดพลาดระหว่างเรียกข้อมูลนักศึกษา:", err);
		return res.status(502).json({ message: "ไม่สามารถเชื่อมต่อกับระบบภายนอกได้" });
	}
});

/* router.post("/personnelInfo", authenticateToken, async (req, res) => {
	const { user_id } = req.body;
	console.log(user_id);
	
	try {
		const pool = await poolPromise;
		const result = await pool.request().input("user_id", user_id).query(`SELECT * FROM users WHERE user_id = @user_id`);
		const user = result.recordset[0];		
		if (!user) return res.status(200).json(null);
		const { password, ...userWithoutPassword } = user;

		return res.status(200).json(userWithoutPassword);
	} catch (err) {
		console.error("เกิดข้อผิดพลาด:", err);
		return res.status(502).json({ message: "ไม่สามารถเชื่อมต่อกับระบบภายนอกได้" });
	}
}); */

module.exports = router;
