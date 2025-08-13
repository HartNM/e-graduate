const express = require("express");
const router = express.Router();
const authenticateToken = require("../middleware/authenticateToken");
const { poolPromise } = require("../db");
const bcrypt = require("bcrypt");

router.post("/deleteAssignMajorOfficer", authenticateToken, async (req, res) => {
	const { officer_major_id } = req.body;
	try {
		const pool = await poolPromise;
		await pool.request().input("reference_id", officer_major_id).query("DELETE FROM user_account WHERE reference_id = @reference_id");
		await pool.request().input("officer_major_id", officer_major_id).query("DELETE FROM officer_major WHERE officer_major_id = @officer_major_id");
		res.status(200).json({ message: "ลบข้อมูลเรียบร้อยแล้ว" });
	} catch (err) {
		console.error("deleteAssignChairpersons:", err);
		res.status(500).json({ message: "เกิดข้อผิดพลาดในการลบข้อมูล" });
	}
});

router.post("/editAssignMajorOfficer", authenticateToken, async (req, res) => {
	const { major_name, officer_major_id, officer_major_name } = req.body;
	try {
		const pool = await poolPromise;
		await pool.request().input("officer_major_name", officer_major_name).input("major_name", major_name).input("officer_major_id", officer_major_id).query(`
				UPDATE officer_major 
				SET officer_major_name = @officer_major_name, 
					major_name = @major_name
				WHERE officer_major_id = @officer_major_id`);
		res.status(200).json({ message: "แก้ไขข้อมูลเรียบร้อยแล้ว" });
	} catch (err) {
		console.error("editAssignMajorOfficer:", err);
		res.status(500).json({ message: "เกิดข้อผิดพลาดในการแก้ไขข้อมูล" });
	}
});

router.post("/allAssignMajorOfficer", authenticateToken, async (req, res) => {
	try {
		const pool = await poolPromise;
		const result = await pool.request().query(`SELECT * FROM officer_major`);
		res.status(200).json(result.recordset);
	} catch (err) {
		console.error("allAssignMajorOfficer:", err);
		res.status(500).json({ message: "เกิดข้อผิดพลาดในการดึงข้อมูล" });
	}
});

router.post("/addAssignMajorOfficer", authenticateToken, async (req, res) => {
	const { major_name, officer_major_id, officer_major_name, password } = req.body;
	try {
		const pool = await poolPromise;
		const checkResult = await pool.request().input("officer_major_id", officer_major_id).query("SELECT * FROM officer_major WHERE officer_major_id = @officer_major_id");
		if (checkResult.recordset.length > 0) {
			return res.status(409).json({ message: "รหัสเจ้าหน้าที่นี้มีอยู่แล้วในระบบ" });
		}
		const saltRounds = 10;
		const hashedPassword = await bcrypt.hash(password, saltRounds);
		await pool.request().input("major_name", major_name).input("officer_major_id", officer_major_id).input("officer_major_name", officer_major_name).query(`
				INSERT INTO officer_major (
					officer_major_id,
					officer_major_name,
					major_name
				) VALUES (
					@officer_major_id,
					@officer_major_name,
					@major_name
				)`);
		await pool.request().input("reference_id", officer_major_id).input("password", hashedPassword).input("role", "officer_major").query(`
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
		console.error("addAssignMajorOfficer:", err);
		res.status(500).json({ message: "เกิดข้อผิดพลาดในการบันทึกข้อมูล" });
	}
});

module.exports = router;
