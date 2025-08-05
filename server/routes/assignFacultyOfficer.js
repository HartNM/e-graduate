const express = require("express");
const router = express.Router();
const authenticateToken = require("../middleware/authenticateToken");
const { poolPromise } = require("../db");
const axios = require("axios");

router.post("/editAssignFacultyOfficer", authenticateToken, async (req, res) => {
	const { faculty_name, officer_faculty_id, officer_faculty_name } = req.body;
	try {
		const pool = await poolPromise;
		await pool.request().input("officer_faculty_name", officer_faculty_name).input("faculty_name", faculty_name).input("officer_faculty_id", officer_faculty_id).query(`
			UPDATE officer_faculty 
			SET officer_faculty_name = @officer_faculty_name, 
				faculty_name = @faculty_name
			WHERE officer_faculty_id = @officer_faculty_id`);
		res.status(200).json({ message: "บันทึกข้อมูลเรียบร้อยแล้ว" });
	} catch (err) {
		console.error("requestExamInfoAll:", err);
		res.status(500).json({ error: "เกิดข้อผิดพลาดในการดึงข้อมูล" });
	}
});

router.post("/allAssignFacultyOfficer", authenticateToken, async (req, res) => {
	try {
		const pool = await poolPromise;
		const result = await pool.request().query(`SELECT * FROM officer_faculty`);
		res.status(200).json(result.recordset);
	} catch (err) {
		console.error("requestExamInfoAll:", err);
		res.status(500).json({ error: "เกิดข้อผิดพลาดในการดึงข้อมูล" });
	}
});

router.post("/addAssignFacultyOfficer", authenticateToken, async (req, res) => {
	const { faculty_name, officer_faculty_id, officer_faculty_name, password } = req.body;
	try {
		const pool = await poolPromise;
        const checkResult = await pool.request()
            .input("officer_faculty_id", officer_faculty_id)
            .query("SELECT * FROM officer_faculty WHERE officer_faculty_id = @officer_faculty_id");
        if (checkResult.recordset.length > 0) {
            return res.status(400).json({ error: "รหัสเจ้าหน้าที่นี้มีอยู่แล้วในระบบ" });
        }
		const query = await poolPromise;
		await query.request().input("faculty_name", faculty_name).input("officer_faculty_id", officer_faculty_id).input("officer_faculty_name", officer_faculty_name).query(`
        INSERT INTO officer_faculty ( 
            officer_faculty_id, 
            officer_faculty_name, 
            faculty_name
        ) VALUES ( 
            @officer_faculty_id, 
            @officer_faculty_name, 
            @faculty_name
        )`);
		await query.request().input("reference_id", officer_faculty_id).input("password", password).input("role", "officer_faculty").query(`
        INSERT INTO user_account ( 
            reference_id, 
            username, 
            password,
            role
        ) VALUES ( 
            @reference_id, 
            @reference_id, 
            @password,
            @role
        )`);
		res.status(201).json({ message: "บันทึกข้อมูลเรียบร้อยแล้ว" });
	} catch (err) {
		console.error("addRequestExamInfo:", err);
		res.status(500).json({ error: "เกิดข้อผิดพลาดในการบันทึกข้อมูล" });
	}
});

module.exports = router;
