const express = require("express");
const router = express.Router();
const authenticateToken = require("../middleware/authenticateToken");
const { poolPromise } = require("../db");
const bcrypt = require("bcrypt");

router.post("/majors", authenticateToken, async (req, res) => {
	try {
		const pool = await poolPromise;
		const majors = await pool.request().query("SELECT * FROM majors");
		res.status(200).json(majors.recordset);
	} catch (e) {
		console.error(e);
		res.status(500).json({ message: "เกิดข้อผิดพลาดในการดึงข้อมูล" });
	}
});

/* router.post("/addAssignMajorOfficer", authenticateToken, async (req, res) => {
	const { user_id, name, major_id, password } = req.body;
	try {
		const pool = await poolPromise;
		const checkResult = await pool.request().input("user_id", user_id).query("SELECT * FROM users WHERE user_id = @user_id AND role = 'officer_major'");
		if (checkResult.recordset.length > 0) {
			return res.status(409).json({ message: "รหัสเจ้าหน้าที่นี้มีอยู่แล้วในระบบ" });
		}
		const saltRounds = 10;
		const hashedPassword = await bcrypt.hash(password, saltRounds);
		await pool.request().input("user_id", user_id).input("password", hashedPassword).input("name", name).input("major_id", major_id).query(`
			INSERT INTO users (
				user_id,
				username,
				password,
				name,
				role,
				major_id
			) VALUES (
				@user_id,
				@user_id,
				@password,
				@name,
				'officer_major',
				@major_id
			)`);
		res.status(200).json({ message: "บันทึกข้อมูลเรียบร้อยแล้ว" });
	} catch (err) {
		console.error("addAssignMajorOfficer:", err);
		res.status(500).json({ message: "เกิดข้อผิดพลาดในการบันทึกข้อมูล" });
	}
});

router.post("/deleteAssignMajorOfficer", authenticateToken, async (req, res) => {
	const { user_id } = req.body;
	try {
		const pool = await poolPromise;
		await pool.request().input("user_id", user_id).query("DELETE FROM users WHERE user_id = @user_id");
		res.status(200).json({ message: "ลบข้อมูลเรียบร้อยแล้ว" });
	} catch (err) {
		console.error("deleteAssignChairpersons:", err);
		res.status(500).json({ message: "เกิดข้อผิดพลาดในการลบข้อมูล" });
	}
});

router.post("/allAssignMajorOfficer", authenticateToken, async (req, res) => {
	try {
		const pool = await poolPromise;
		const MajorOfficerResult = await pool.request().query(`SELECT * FROM users WHERE role = 'officer_major'`);
		console.log(MajorOfficerResult.recordset);

		res.status(200).json(MajorOfficerResult.recordset);
	} catch (err) {
		console.error("allAssignMajorOfficer:", err);
		res.status(500).json({ message: "เกิดข้อผิดพลาดในการดึงข้อมูล" });
	}
}); */

router.post("/allAssignMajorOfficer", authenticateToken, async (req, res) => {
	try {
		const pool = await poolPromise;
		const MajorOfficerResult = await pool.request().query(`SELECT * FROM roles WHERE role = 'officer_major'`);
		/* console.log(MajorOfficerResult.recordset); */
		res.status(200).json(MajorOfficerResult.recordset);
	} catch (err) {
		console.error("allAssignMajorOfficer:", err);
		res.status(500).json({ message: "เกิดข้อผิดพลาดในการดึงข้อมูล" });
	}
});

router.post("/addAssignMajorOfficer", authenticateToken, async (req, res) => {
	const { user_id, name, major_id } = req.body;
	try {
		const pool = await poolPromise;
		const checkResult = await pool.request().input("user_id", user_id).query("SELECT * FROM roles WHERE user_id = @user_id AND role = 'officer_major'");
		if (checkResult.recordset.length > 0) {
			return res.status(409).json({ message: "รหัสเจ้าหน้าที่นี้มีอยู่แล้วในระบบ" });
		}
		await pool.request().input("user_id", user_id).input("name", name).input("major_id", major_id).query(`
		INSERT INTO roles (user_id, name, role, major_id
		) VALUES (
		@user_id, @name, 'officer_major', @major_id )`);
		res.status(201).json({ message: "บันทึกข้อมูลเรียบร้อยแล้ว" });
	} catch (err) {
		console.error("addAssignMajorOfficer:", err);
		res.status(500).json({ message: "เกิดข้อผิดพลาดในการบันทึกข้อมูล" });
	}
});

router.post("/deleteAssignMajorOfficer", authenticateToken, async (req, res) => {
	const { user_id } = req.body;
	try {
		const pool = await poolPromise;
		await pool.request().input("user_id", user_id).query("DELETE FROM roles WHERE user_id = @user_id AND role = 'officer_major'");
		res.status(200).json({ message: "ลบข้อมูลเรียบร้อยแล้ว" });
	} catch (err) {
		console.error("deleteAssignMajorOfficer:", err);
		res.status(500).json({ message: "เกิดข้อผิดพลาดในการลบข้อมูล" });
	}
});

module.exports = router;
