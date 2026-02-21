const express = require("express");
const router = express.Router();
const authenticateToken = require("../middleware/authenticateToken");
const { poolPromise } = require("../db");
const bcrypt = require("bcrypt");

router.post("/allAssignChairpersons", authenticateToken, async (req, res) => {
	try {
		const pool = await poolPromise;
		const chairpersonsResult = await pool.request().query(`SELECT * FROM roles WHERE role = 'chairpersons'`);
		res.status(200).json(chairpersonsResult.recordset);
	} catch (err) {
		console.error("allAssignChairpersons:", err);
		res.status(500).json({ message: "เกิดข้อผิดพลาดในการดึงข้อมูล" });
	}
});

router.post("/addAssignChairpersons", authenticateToken, async (req, res) => {
	const { user_id, name, major_id } = req.body;

	try {
		const pool = await poolPromise;
		await pool.request().input("user_id", user_id).input("name", name).input("major_id", major_id).query(`
		INSERT INTO roles (user_id, name, role, major_id
		) VALUES (
		@user_id, @name, 'chairpersons', @major_id )`);
		res.status(201).json({ message: "บันทึกข้อมูลเรียบร้อยแล้ว" });
	} catch (err) {
		console.error("addAssignChairpersons:", err);
		res.status(500).json({ message: "เกิดข้อผิดพลาดในการบันทึกข้อมูล" });
	}
});

router.post("/deleteAssignChairpersons", authenticateToken, async (req, res) => {
	const { user_id } = req.body;
	try {
		const pool = await poolPromise;
		await pool.request().input("user_id", user_id).query("DELETE FROM roles WHERE user_id = @user_id AND role = 'chairpersons'");
		res.status(200).json({ message: "ลบข้อมูลเรียบร้อยแล้ว" });
	} catch (err) {
		console.error("deleteAssignChairpersons:", err);
		res.status(500).json({ message: "เกิดข้อผิดพลาดในการลบข้อมูล" });
	}
});

module.exports = router;
