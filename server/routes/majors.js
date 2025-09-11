const express = require("express");
const router = express.Router();
const authenticateToken = require("../middleware/authenticateToken");
const { poolPromise } = require("../db");

router.post("/getMajor_name", authenticateToken, async (req, res) => {
	const { major_id } = req.user;
	try {
		const pool = await poolPromise;
		const res = await pool.request().input("major_id", major_id).query(`SELECT major_name FROM majors WHERE major_id = @major_id`);
		console.log(res);
		res.status(201).json("บันทึกข้อมูลเรียบร้อยแล้ว");
	} catch (e) {
		console.error("addCourseRegistration:", e);
		res.status(500).json({ message: "เกิดข้อผิดพลาดในการบันทึกข้อมูล" });
	}
});

module.exports = router;