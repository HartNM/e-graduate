const express = require("express");
const router = express.Router();
const authenticateToken = require("../middleware/authenticateToken");
const { poolPromise } = require("../db");
const bcrypt = require("bcrypt");

router.post("/deleteAssignChairpersons", authenticateToken, async (req, res) => {
	const { user_id } = req.body;
	try {
		const pool = await poolPromise;
		await pool.request().input("user_id", user_id).query("DELETE FROM users WHERE user_id = @user_id AND role = 'chairpersons'");
		res.status(200).json({ message: "ลบข้อมูลเรียบร้อยแล้ว" });
	} catch (err) {
		console.error("deleteAssignChairpersons:", err);
		res.status(500).json({ message: "เกิดข้อผิดพลาดในการลบข้อมูล" });
	}
});

router.post("/allAssignChairpersons", authenticateToken, async (req, res) => {
	try {
		const { user_id } = req.user;
		const pool = await poolPromise;
		const officerResult = await pool.request().input("user_id", user_id).query(`SELECT * FROM users WHERE user_id = @user_id`);

		const chairpersonsResult = await pool.request().input("major_id", officerResult.recordset[0].major_id).query(`SELECT * FROM users WHERE major_id = @major_id AND role = 'chairpersons'`);

		const chairMajorIds = chairpersonsResult.recordset.map((c) => c.major_id).filter((id) => id !== null);
		let majorsResult = { recordset: [] };
		if (chairMajorIds.length > 0) {
			const placeholders = chairMajorIds.map((_, i) => `@id${i}`).join(", ");
			const majorsReq = pool.request();
			chairMajorIds.forEach((id, i) => majorsReq.input(`id${i}`, id));
			majorsResult = await majorsReq.query(`SELECT major_id, major_name FROM majors WHERE major_id IN (${placeholders})`);
		}
		const majorsMap = Object.fromEntries(majorsResult.recordset.map((m) => [m.major_id, m.major_name]));

		res.status(200).json(
			chairpersonsResult.recordset.map((item) => ({
				...item,
			}))
		);
	} catch (err) {
		console.error("requestExamInfoAll:", err);
		res.status(500).json({ message: "เกิดข้อผิดพลาดในการดึงข้อมูล" });
	}
});

router.post("/getMajor_name", authenticateToken, async (req, res) => {
	const { user_id } = req.user;
	try {
		const pool = await poolPromise;
		const officerResult = await pool.request().input("user_id", user_id).query(`SELECT * FROM users WHERE user_id = @user_id`);
		const major_name = await pool.request().input("major_id", officerResult.recordset[0].major_id).query(`SELECT * FROM majors WHERE major_id = @major_id`);
		res.status(200).json(major_name.recordset[0]);
	} catch (err) {
		console.error("addRequestExamInfo:", err);
		res.status(500).json({ message: "เกิดข้อผิดพลาดในการบันทึกข้อมูล" });
	}
});
router.post("/addAssignChairpersons", authenticateToken, async (req, res) => {
	const { user_id, name, major_id, password } = req.body;
	console.log(req.body);

	try {
		const pool = await poolPromise;
		const checkResult = await pool.request().input("user_id", user_id).query("SELECT * FROM users WHERE user_id = @user_id");
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
			'chairpersons',
			@major_id
		)`);
		res.status(201).json({ message: "บันทึกข้อมูลเรียบร้อยแล้ว" });
	} catch (err) {
		console.error("addRequestExamInfo:", err);
		res.status(500).json({ message: "เกิดข้อผิดพลาดในการบันทึกข้อมูล" });
	}
});

module.exports = router;
