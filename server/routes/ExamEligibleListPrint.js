const express = require("express");
const router = express.Router();
const authenticateToken = require("../middleware/authenticateToken");
const { poolPromise } = require("../db");
const axios = require("axios");

router.post("/allExamEligibleListPrint", authenticateToken, async (req, res) => {
	const { user_id } = req.user;
	try {
		const pool = await poolPromise;
		const request = pool.request().input("user_id", user_id);
		let query = `
			SELECT study_group_id, student_id, exam_results, term, request_type
			FROM request_exam 
			WHERE major_id IN (SELECT major_id FROM users WHERE user_id = @user_id) AND status = 5
		`;
		const result = await request.query(query);
		const output = {};
		result.recordset.forEach((row) => {
			if (!output[row.study_group_id]) output[row.study_group_id] = [];
			output[row.study_group_id].push({
				student_id: row.student_id,
				exam_results: row.exam_results,
				term: row.term,
				request_type: row.request_type,
			});
		});
		const allStudentIds = Object.values(output).flatMap((group) => group.map((s) => s.student_id));
		const promises = allStudentIds.map((studentId) => axios.get(`http://localhost:8080/externalApi/student/${studentId}`));
		const studentResults = await Promise.all(promises);
		const studentMap = {};
		studentResults.forEach((res) => {
			const student = res.data;
			studentMap[student.student_id] = student;
		});
		const finalOutput = {};
		Object.entries(output).forEach(([groupId, students]) => {
			finalOutput[groupId] = students.map(({ student_id, exam_results, term, request_type }) => ({
				id: student_id,
				name: studentMap[student_id]?.student_name || "",
				exam_results,
				term,
				request_type,
				major_name: studentMap[student_id]?.major_name,
			}));
		});
		res.status(200).json(finalOutput);
	} catch (err) {
		console.error("requestExamInfoAll:", err);
		res.status(500).json({ message: "เกิดข้อผิดพลาดในการดึงข้อมูล" });
	}
});

module.exports = router;
