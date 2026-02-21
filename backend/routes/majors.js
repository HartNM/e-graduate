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

router.post("/getMajor_name", authenticateToken, async (req, res) => {
	const { major_ids } = req.user;
	try {
		const pool = await poolPromise;
		const major_name = await pool.request().input("major_id", major_ids[0]).query(`SELECT * FROM majors WHERE major_id = @major_id`);
		res.status(200).json(major_name.recordset[0]);
	} catch (err) {
		console.error("getMajor_name:", err);
		res.status(500).json({ message: "เกิดข้อผิดพลาดในการบันทึกข้อมูล" });
	}
});
module.exports = router;
