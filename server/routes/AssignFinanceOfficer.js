const express = require("express");
const router = express.Router();
const authenticateToken = require("../middleware/authenticateToken");
const { poolPromise } = require("../db");
const bcrypt = require("bcrypt");

router.post("/addAssignFinanceOfficer", authenticateToken, async (req, res) => {
	const { user_id, name, password } = req.body;
	try {
		const pool = await poolPromise;
		const checkResult = await pool.request().input("user_id", user_id).query("SELECT * FROM users WHERE user_id = @user_id AND role = 'officer_finance'");
		if (checkResult.recordset.length > 0) {
			return res.status(409).json({ message: "รหัสเจ้าหน้าที่นี้มีอยู่แล้วในระบบ" });
		}
		const saltRounds = 10;
		const hashedPassword = await bcrypt.hash(password, saltRounds);
		await pool.request().input("user_id", user_id).input("password", hashedPassword).input("name", name).query(`
			INSERT INTO users (
				user_id,
				username,
				password,
				name,
				role
			) VALUES (
				@user_id,
				@user_id,
				@password,
				@name,
				'officer_finance'
			)`);
		res.status(200).json({ message: "บันทึกข้อมูลเรียบร้อยแล้ว" });
	} catch (err) {
		console.error("addAssignFinanceOfficer:", err);
		res.status(500).json({ message: "เกิดข้อผิดพลาดในการบันทึกข้อมูล" });
	}
});

router.post("/deleteAssignFinanceOfficer", authenticateToken, async (req, res) => {
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

router.post("/allAssignFinanceOfficer", authenticateToken, async (req, res) => {
	try {
		const pool = await poolPromise;
		const FinanceOfficerResult = await pool.request().query(`SELECT * FROM users WHERE role = 'officer_finance'`);
		console.log(FinanceOfficerResult.recordset);

		res.status(200).json(FinanceOfficerResult.recordset);
	} catch (err) {
		console.error("allAssignChairpersons:", err);
		res.status(500).json({ message: "เกิดข้อผิดพลาดในการดึงข้อมูล" });
	}
});

/* router.post("/allAssignFinanceOfficer", authenticateToken, async (req, res) => {
	try {
		const pool = await poolPromise;
		const FinanceOfficerResult = await pool.request().query(`SELECT * FROM roles WHERE role = 'officer_finance'`);
		console.log(FinanceOfficerResult.recordset);

		res.status(200).json(FinanceOfficerResult.recordset);
	} catch (err) {
		console.error("allAssignFinanceOfficer:", err);
		res.status(500).json({ message: "เกิดข้อผิดพลาดในการดึงข้อมูล" });
	}
});

router.post("/addAssignFinanceOfficer", authenticateToken, async (req, res) => {
	const { user_id, name } = req.body;
	console.log(req.body);

	try {
		const pool = await poolPromise;
		const checkResult = await pool.request().input("user_id", user_id).query("SELECT * FROM roles WHERE user_id = @user_id AND role = 'officer_finance'");
		if (checkResult.recordset.length > 0) {
			return res.status(409).json({ message: "รหัสเจ้าหน้าที่นี้มีอยู่แล้วในระบบ" });
		}
		await pool.request().input("user_id", user_id).input("name", name).query(`
		INSERT INTO roles (user_id, name, role
		) VALUES (
		@user_id, @name, 'officer_finance' )`);
		res.status(201).json({ message: "บันทึกข้อมูลเรียบร้อยแล้ว" });
	} catch (err) {
		console.error("addAssignFinanceOfficer:", err);
		res.status(500).json({ message: "เกิดข้อผิดพลาดในการบันทึกข้อมูล" });
	}
}); 

router.post("/deleteAssignFinanceOfficer", authenticateToken, async (req, res) => {
	const { user_id } = req.body;
	try {
		const pool = await poolPromise;
		await pool.request().input("user_id", user_id).query("DELETE FROM roles WHERE user_id = @user_id AND role = 'officer_finance'");
		res.status(200).json({ message: "ลบข้อมูลเรียบร้อยแล้ว" });
	} catch (err) {
		console.error("deleteAssignFinanceOfficer:", err);
		res.status(500).json({ message: "เกิดข้อผิดพลาดในการลบข้อมูล" });
	}
}); */

module.exports = router;
