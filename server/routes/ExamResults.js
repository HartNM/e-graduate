const express = require("express");
const router = express.Router();
const authenticateToken = require("../middleware/authenticateToken");
const { poolPromise } = require("../db");
const axios = require("axios");

router.post("/AddExamResults", authenticateToken, async (req, res) => {
	const studentIdsObj = req.body;

	try {
		const pool = await poolPromise;

		for (const [id, examResult] of Object.entries(studentIdsObj)) {
			const request = pool.request();
			await request
				.input("id", id)
				.input("exam_result", examResult ? 1 : 0)
				.query("UPDATE request_exam SET exam_results = @exam_result WHERE student_id = @id AND status = 5");
		}

		res.status(200).json({ success: true, updated: Object.keys(studentIdsObj).length });
	} catch (err) {
		console.error("AddExamResults:", err);
		res.status(500).json({ message: "เกิดข้อผิดพลาดในการดึงข้อมูล" });
	}
});

router.post("/AllExamResults", authenticateToken, async (req, res) => {
	console.log(req.body);
	const { id } = req.body;
	try {
		const pool = await poolPromise;
		const request = pool.request().input("id", id);
		let query = `
			SELECT study_group_id, student_id, exam_results, term 
			FROM request_exam 
			WHERE major_id = @id AND status = 5
		`;
		const result = await request.query(query);

		const output = {};
		result.recordset.forEach((row) => {
			if (!output[row.study_group_id]) output[row.study_group_id] = [];
			output[row.study_group_id].push({
				student_id: row.student_id,
				exam_results: row.exam_results,
				term: row.term,
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
			finalOutput[groupId] = students.map(({ student_id, exam_results, term }) => ({
				id: student_id,
				name: studentMap[student_id]?.student_name || "",
				exam_results,
				term,
			}));
		});

		res.status(200).json(finalOutput);
	} catch (err) {
		console.error("requestExamInfoAll:", err);
		res.status(500).json({ message: "เกิดข้อผิดพลาดในการดึงข้อมูล" });
	}
});

module.exports = router;
