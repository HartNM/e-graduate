const express = require("express");
const router = express.Router();
const authenticateToken = require("../middleware/authenticateToken");
const { poolPromise } = require("../db");
const { getStudentData } = require("../services/studentService");

router.post("/AddExamResults", authenticateToken, async (req, res) => {
	const { term, ...studentIdsObj } = req.body;
	try {
		const pool = await poolPromise;
		for (const [id, examResult] of Object.entries(studentIdsObj)) {
			const request = pool.request();
			await request.input("id", id).input("term", term).input("exam_result", examResult).query("UPDATE request_exam SET exam_results = @exam_result WHERE student_id = @id AND status = 5 AND term = @term");
		}
		res.status(200).json({ message: "บันทึกผลสอบเรียบร้อยแล้ว" });
	} catch (err) {
		console.error("AddExamResults:", err);
		res.status(500).json({ message: "เกิดข้อผิดพลาดในการบันทึกผลสอบ" });
	}
});

/* router.post("/AllExamResults", authenticateToken, async (req, res) => {
	const { user_id, major_ids, role } = req.user;
	try {
		const { recordset: exams } = await (await poolPromise).request().input("user_id", user_id).input("major_ids_str", major_ids.join(",")).query(`
			SELECT study_group_id, student_id, exam_results, term, request_type
			FROM request_exam 
			WHERE major_id IN ((SELECT value FROM STRING_SPLIT(@major_ids_str, ','))) AND status = 5
    	`);
		const examsWithStudentData = await Promise.all(
			exams.map(async ({ student_id, ...rest }) => {
				const { student_name, major_name } = await getStudentData(student_id);
				return { ...rest, student_id, name: student_name, major_name };
			}),
		);
		res.status(200).json(examsWithStudentData);
	} catch (err) {
		console.error("requestExamInfoAll:", err);
		res.status(500).json({ message: "เกิดข้อผิดพลาดในการดึงข้อมูล" });
	}
}); */

router.post("/AllExamResults", authenticateToken, async (req, res) => {
	const { major_ids, role } = req.user;
	const { term } = req.body;
	try {
		const pool = await poolPromise;
		const request = pool.request();

		request.input("major_ids_str", major_ids ? major_ids.join(",") : "");
		request.input("role", role);
		request.input("term", term);

		const query = `
            SELECT study_group_id, student_id, exam_results, term, request_type
            FROM request_exam 
            WHERE status = 5
            AND (
                @role = 'officer_registrar' 
                OR major_id IN (SELECT value FROM STRING_SPLIT(@major_ids_str, ','))
            )
			AND (@term IS NULL OR @term = '' OR term = @term)
        `;

		const { recordset: exams } = await request.query(query);

		const examsWithStudentData = await Promise.all(
			exams.map(async ({ student_id, ...rest }) => {
				const { student_name, major_name } = await getStudentData(student_id);
				return { ...rest, student_id, name: student_name, major_name };
			}),
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
				const { student_name, major_name } = await getStudentData(student_id);
				return { ...rest, student_id, name: student_name, major_name };
			}),
		);
		res.status(200).json(examsWithStudentData);
	} catch (err) {
		console.error("requestExamInfoAll:", err);
		res.status(500).json({ message: "เกิดข้อผิดพลาดในการดึงข้อมูล" });
	}
});

module.exports = router;
