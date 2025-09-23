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
	const { chairpersons_id, chairpersons_name, major_name } = req.body;
	try {
		const pool = await poolPromise;
		await pool.request().input("chairpersons_id", chairpersons_id).input("chairpersons_name", chairpersons_name).input("major_name", major_name).query(`
			UPDATE chairpersons 
			SET chairpersons_name = @chairpersons_name, 
				major_name = @major_name
			WHERE chairpersons_id = @chairpersons_id`);
		res.status(200).json({ message: "แก้ไขข้อมูลเรียบร้อยแล้ว" });
	} catch (err) {
		console.error("requestExamInfoAll:", err);
		res.status(500).json({ message: "เกิดข้อผิดพลาดในการแก้ไขข้อมูล" });
	}
});

router.post("/allAssignChairpersons", authenticateToken, async (req, res) => {
	try {
		const { user_id } = req.user;
		const pool = await poolPromise;
		const major_id = await pool.request().input("user_id", user_id).query(`SELECT * FROM officerMajor_id WHERE user_id = @user_id`);

		const major_name = await pool.request().input("major_id", major_id.recordset[0].major_id).query(`SELECT * FROM majors WHERE major_id = @major_id`);

		const chairpersons_id = await pool.request().input("major_id", major_id.recordset[0].major_id).query(`SELECT * FROM chairpersonsMajor_id WHERE major_id = @major_id`);
		const userIds = chairpersons_id.recordset.map((c) => c.user_id); // [id1, id2, id3]
		const placeholders = userIds.map((_, i) => `@id${i}`).join(", "); // "@id0, @id1, @id2"

		const request = pool.request();
		userIds.forEach((id, i) => request.input(`id${i}`, id));
		const chairpersons = await request.query(`SELECT user_id, name FROM users WHERE user_id IN (${placeholders})`);

		res.status(200).json(
			chairpersons.recordset.map((person) => ({
				...person,
				major_name: major_name.recordset[0].major_name,
			}))
		);
	} catch (err) {
		console.error("requestExamInfoAll:", err);
		res.status(500).json({ message: "เกิดข้อผิดพลาดในการดึงข้อมูล" });
	}
});

router.post("/addAssignChairpersons", authenticateToken, async (req, res) => {
	const { chairpersons_id, chairpersons_name, major_name, password } = req.body;
	try {
		const pool = await poolPromise;
		const checkResult = await pool.request().input("chairpersons_id", chairpersons_id).query("SELECT * FROM chairpersons WHERE chairpersons_id = @chairpersons_id");
		if (checkResult.recordset.length > 0) {
			return res.status(409).json({ message: "รหัสเจ้าหน้าที่นี้มีอยู่แล้วในระบบ" });
		}
		const saltRounds = 10;
		const hashedPassword = await bcrypt.hash(password, saltRounds);
		await pool.request().input("chairpersons_id", chairpersons_id).input("chairpersons_name", chairpersons_name).input("major_name", major_name).query(`
        INSERT INTO chairpersons ( 
            chairpersons_id, 
            chairpersons_name, 
            major_name
        ) VALUES ( 
            @chairpersons_id, 
            @chairpersons_name, 
            @major_name
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
