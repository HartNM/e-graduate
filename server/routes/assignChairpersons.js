const express = require("express");
const router = express.Router();
const authenticateToken = require("../middleware/authenticateToken");
const { poolPromise } = require("../db");
const axios = require("axios");

router.post("/editAssignChairpersons", authenticateToken, async (req, res) => {
	const { chairpersons_id, chairpersons_name, major_id } = req.body;
	try {
		const pool = await poolPromise;
		await pool.request().input("chairpersons_id", chairpersons_id).input("chairpersons_name", chairpersons_name).input("major_id", major_id).query(`
			UPDATE chairpersons 
			SET chairpersons_name = @chairpersons_name, 
				major_id = @major_id
			WHERE chairpersons_id = @chairpersons_id`);
		res.status(200).json({ message: "บันทึกข้อมูลเรียบร้อยแล้ว" });
	} catch (err) {
		console.error("requestExamInfoAll:", err);
		res.status(500).json({ error: "เกิดข้อผิดพลาดในการดึงข้อมูล" });
	}
});

router.post("/allAssignChairpersons", authenticateToken, async (req, res) => {
	try {
		const pool = await poolPromise;
		const result = await pool.request().query(`SELECT * FROM chairpersons`);
		res.status(200).json(result.recordset);
	} catch (err) {
		console.error("requestExamInfoAll:", err);
		res.status(500).json({ error: "เกิดข้อผิดพลาดในการดึงข้อมูล" });
	}
});

router.post("/addAssignChairpersons", authenticateToken, async (req, res) => {
	const { chairpersons_id, chairpersons_name, major_id, password } = req.body;
	try {
		const pool = await poolPromise;
		const checkResult = await pool.request().input("chairpersons_id", chairpersons_id).query("SELECT * FROM chairpersons WHERE chairpersons_id = @chairpersons_id");
		if (checkResult.recordset.length > 0) {
			return res.status(400).json({ error: "รหัสเจ้าหน้าที่นี้มีอยู่แล้วในระบบ" });
		}
		const query = await poolPromise;
		await query.request().input("chairpersons_id", chairpersons_id).input("chairpersons_name", chairpersons_name).input("major_id", major_id).query(`
        INSERT INTO chairpersons ( 
            chairpersons_id, 
            chairpersons_name, 
            major_id
        ) VALUES ( 
            @chairpersons_id, 
            @chairpersons_name, 
            @major_id
        )`);
		await query.request().input("reference_id", chairpersons_id).input("password", password).input("role", "chairpersons").query(`
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
