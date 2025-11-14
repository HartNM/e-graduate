const express = require("express");
const router = express.Router();
const authenticateToken = require("../middleware/authenticateToken");
const { poolPromise } = require("../db");
const axios = require("axios");
const BASE_URL = process.env.VITE_API_URL;

router.post("/allPrintExam", authenticateToken, async (req, res) => {
	const { user_id } = req.user;
	const { term } = req.body;
	try {
		const pool = await poolPromise;
		const request = pool.request().input("user_id", user_id).input("term", term);
		let query = `
			SELECT * FROM request_exam 
			WHERE major_id IN (SELECT major_id FROM users WHERE user_id = @user_id) AND term = @term AND status = 5
		`;
		const result = await request.query(query);
		const enrichedData = await Promise.all(
			result.recordset.map(async (item) => {
				let student;
				try {
					const studentRes = await axios.get(`${BASE_URL}/externalApi/student/${item.student_id}`);
					student = studentRes.data;
				} catch (err) {
					console.warn(`ไม่สามารถดึงข้อมูลนักศึกษา ${item.student_id}`);
				}
				return { ...item, ...student };
			})
		);
		console.log(enrichedData);
		res.status(200).json(enrichedData);
	} catch (err) {
		console.error("requestExamInfoAll:", err);
		res.status(500).json({ message: "เกิดข้อผิดพลาดในการดึงข้อมูล" });
	}
});

module.exports = router;
