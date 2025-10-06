const express = require("express");
const router = express.Router();
const authenticateToken = require("../middleware/authenticateToken");
const { poolPromise } = require("../db");
const axios = require("axios");

router.post("/allExamResultsPrint", authenticateToken, async (req, res) => {
	try {
		const { recordset: exams } = await (await poolPromise).request().query(`
			SELECT study_group_id, student_id, exam_results, term, request_type
			FROM request_exam 
			WHERE status = 5
		`);
		const examsWithStudentData = await Promise.all(
			exams.map(async ({ student_id, ...rest }) => {
				const { NAME, major_name } = (await axios.get(`http://localhost:8080/externalApi/student/${student_id}`)).data;
				return { ...rest, student_id, name: NAME, major_name };
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
