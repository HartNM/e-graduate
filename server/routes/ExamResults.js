const express = require("express");
const router = express.Router();
const authenticateToken = require("../middleware/authenticateToken");
const { poolPromise } = require("../db");
const axios = require("axios");
const BASE_URL = process.env.VITE_API_URL;

router.post("/AddExamResults", authenticateToken, async (req, res) => {
	const { term, ...studentIdsObj } = req.body;
	try {
		const pool = await poolPromise;
		for (const [id, examResult] of Object.entries(studentIdsObj)) {
			const request = pool.request();
			await request
				.input("id", id)
				.input("term", term)
				.input("exam_result", examResult)
				.query("UPDATE request_exam SET exam_results = @exam_result WHERE student_id = @id AND status = 5 AND term = @term");
		}
		res.status(200).json({ message: "บันทึกผลสอบเรียบร้อยแล้ว" });
	} catch (err) {
		console.error("AddExamResults:", err);
		res.status(500).json({ message: "เกิดข้อผิดพลาดในการบันทึกผลสอบ" });
	}
});

router.post("/AllExamResults", authenticateToken, async (req, res) => {
	const { user_id } = req.user;
	try {
		const { recordset: exams } = await (await poolPromise).request().input("user_id", user_id).query(`
			SELECT study_group_id, student_id, exam_results, term, request_type
			FROM request_exam 
			WHERE major_id IN (SELECT major_id FROM users WHERE user_id = @user_id) AND status = 5
    	`);
		const examsWithStudentData = await Promise.all(
			exams.map(async ({ student_id, ...rest }) => {
				const { student_name, major_name } = (await axios.get(`${BASE_URL}/externalApi/student/${student_id}`)).data;
				return { ...rest, student_id, name: student_name, major_name };
			})
		);
		res.status(200).json(examsWithStudentData);
	} catch (err) {
		console.error("requestExamInfoAll:", err);
		res.status(500).json({ message: "เกิดข้อผิดพลาดในการดึงข้อมูล" });
	}
});

router.post("/allExamResultsPrint", authenticateToken, async (req, res) => {
	try {
		const { recordset: exams } = await (await poolPromise).request().query(`
			SELECT study_group_id, student_id, exam_results, term, request_type
			FROM request_exam 
			WHERE status = 5
		`);
		const examsWithStudentData = await Promise.all(
			exams.map(async ({ student_id, ...rest }) => {
				const { student_name, major_name } = (await axios.get(`${BASE_URL}/externalApi/student/${student_id}`)).data;
				return { ...rest, student_id, name: student_name, major_name };
			})
		);
		/* console.log(examsWithStudentData); */
		res.status(200).json(examsWithStudentData);
	} catch (err) {
		console.error("requestExamInfoAll:", err);
		res.status(500).json({ message: "เกิดข้อผิดพลาดในการดึงข้อมูล" });
	}
});

module.exports = router;
