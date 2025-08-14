const express = require("express");
const router = express.Router();
const authenticateToken = require("../middleware/authenticateToken");
const { poolPromise } = require("../db");
const bcrypt = require("bcrypt");

router.post("/deleteAssignChairpersons", authenticateToken, async (req, res) => {
	const { chairpersons_id } = req.body;
	try {
		const pool = await poolPromise;
		// ลบข้อมูลจาก user_account ก่อน (เพราะมี foreign key ผูกกันหรือความสัมพันธ์ทางตรรกะ)
		await pool.request().input("reference_id", chairpersons_id).query("DELETE FROM user_account WHERE reference_id = @reference_id");
		// ลบข้อมูลจาก chairpersons
		await pool.request().input("chairpersons_id", chairpersons_id).query("DELETE FROM chairpersons WHERE chairpersons_id = @chairpersons_id");
		res.status(200).json({ message: "ลบข้อมูลเรียบร้อยแล้ว" });
	} catch (err) {
		console.error("deleteAssignChairpersons:", err);
		res.status(500).json({ message: "เกิดข้อผิดพลาดในการลบข้อมูล" });
	}
});

router.post("/editAssignChairpersons", authenticateToken, async (req, res) => {
	const { chairpersons_id, chairpersons_name, major_id } = req.body;
	try {
		const pool = await poolPromise;
		await pool.request().input("chairpersons_id", chairpersons_id).input("chairpersons_name", chairpersons_name).input("major_id", major_id).query(`
			UPDATE chairpersons 
			SET chairpersons_name = @chairpersons_name, 
				major_id = @major_id
			WHERE chairpersons_id = @chairpersons_id`);
		res.status(200).json({ message: "แก้ไขข้อมูลเรียบร้อยแล้ว" });
	} catch (err) {
		console.error("requestExamInfoAll:", err);
		res.status(500).json({ message: "เกิดข้อผิดพลาดในการแก้ไขข้อมูล" });
	}
});

router.post("/allAssignChairpersons", authenticateToken, async (req, res) => {
	const {id} = req.body
	try {
		const pool = await poolPromise;
		const request = pool.request().input("id", id);
		let query = "SELECT * FROM chairpersons WHERE major_id = @id";
		const result = await request.query(query);

		res.status(200).json(result.recordset);
	} catch (err) {
		console.error("requestExamInfoAll:", err);
		res.status(500).json({ message: "เกิดข้อผิดพลาดในการดึงข้อมูล" });
	}
});

router.post("/addAssignChairpersons", authenticateToken, async (req, res) => {
	const { chairpersons_id, chairpersons_name, major_id, password } = req.body;
	try {
		const pool = await poolPromise;
		const checkResult = await pool.request().input("chairpersons_id", chairpersons_id).query("SELECT * FROM chairpersons WHERE chairpersons_id = @chairpersons_id");
		if (checkResult.recordset.length > 0) {
			return res.status(409).json({ message: "รหัสเจ้าหน้าที่นี้มีอยู่แล้วในระบบ" });
		}
		const saltRounds = 10;
		const hashedPassword = await bcrypt.hash(password, saltRounds);
		await pool.request().input("chairpersons_id", chairpersons_id).input("chairpersons_name", chairpersons_name).input("major_id", major_id).query(`
        INSERT INTO chairpersons ( 
            chairpersons_id, 
            chairpersons_name, 
            major_id
        ) VALUES ( 
            @chairpersons_id, 
            @chairpersons_name, 
            @major_id
        )`);
		await pool.request().input("reference_id", chairpersons_id).input("password", hashedPassword).input("role", "chairpersons").query(`
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
		res.status(500).json({ message: "เกิดข้อผิดพลาดในการบันทึกข้อมูล" });
	}
});

module.exports = router;
