const express = require("express");
const router = express.Router();
const authenticateToken = require("../middleware/authenticateToken");
const { poolPromise } = require("../db");
const axios = require("axios");

router.post("/AllExamResults", authenticateToken, async (req, res) => {
	console.log(req.body);
	const { id } = req.body;
	try {
		const pool = await poolPromise;
		const request = pool.request().input("id", id);
		let query = "SELECT study_group_id, STRING_AGG(CAST(student_id AS VARCHAR), ',') AS student_ids FROM request_exam WHERE major_id = @id AND status = 5 GROUP BY study_group_id";
		const result = await request.query(query);

		const output = {};
		result.recordset.forEach((row) => {
			output[row.study_group_id] = row.student_ids.split(",");
		});

		const allStudentIds = Object.values(output).flat();
		async function callApiForStudents() {
			const promises = allStudentIds.map((studentId) => {
				return axios.get(`http://localhost:8080/externalApi/student/${studentId}`);
			});
			try {
				const results = await Promise.all(promises);
				// results[i].data คือ response ของแต่ละ student
				console.log(results.map((r) => r.data));
			} catch (err) {
				console.error(err);
			}
		}
		callApiForStudents();
        
		res.status(200).json(output);
	} catch (err) {
		console.error("requestExamInfoAll:", err);
		res.status(500).json({ message: "เกิดข้อผิดพลาดในการดึงข้อมูล" });
	}
});

module.exports = router;
