const express = require("express");
const router = express.Router();
const authenticateToken = require("../middleware/authenticateToken");
const { poolPromise } = require("../db");
const axios = require("axios");
const BASE_URL = process.env.VITE_API_URL;

router.post("/AddExamDefenseResults", authenticateToken, async (req, res) => {
	const { term, ...studentIdsObj } = req.body;
	console.log(req.body); // สำหรับ Debug

	try {
		const pool = await poolPromise;

		// *** UPDATED HERE ***
		// 1. เปลี่ยน 'examResult' เป็น 'data'
		for (const [id, data] of Object.entries(studentIdsObj)) {
			// 2. แยก result และ date ออกจาก object
			const { result, date } = data;

			const request = pool.request();
			await // 5. อัปเดต query ให้บันทึกทั้ง 2 fields
			request
				.input("id", id)
				.input("term", term)
				// 3. ใช้ 'result'
				.input("exam_result", result)
				// 4. เพิ่ม 'date'
				.input("exam_date", date).query(`
                    UPDATE request_thesis_defense 
                    SET 
                        exam_results = @exam_result,
                        thesis_exam_date = @exam_date
                    WHERE 
                        student_id = @id AND status = 5 AND term = @term
                `);
		}
		res.status(200).json({ message: "บันทึกผลสอบเรียบร้อยแล้ว" });
	} catch (err) {
		console.error("AddExamResults:", err);
		res.status(500).json({ message: "เกิดข้อผิดพลาดในการบันทึกผลสอบ" });
	}
});

router.post("/AllExamDefenseResults", authenticateToken, async (req, res) => {
	const { user_id , major_ids} = req.user;
	try {
		const { recordset: exams } = await (await poolPromise).request().input("user_id", user_id).input("major_ids_str", major_ids.join(",")).query(`
            SELECT 
                study_group_id, student_id, exam_results, term, request_type,
                thesis_exam_date -- *** UPDATED HERE: เพิ่ม field นี้
            FROM request_thesis_defense 
            WHERE major_id IN ((SELECT value FROM STRING_SPLIT(@major_ids_str, ','))) AND status = 5
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

router.post("/allExamDefenseResultsPrint", authenticateToken, async (req, res) => {
	try {
		const { recordset: exams } = await (await poolPromise).request().query(`
            SELECT 
                study_group_id, student_id, exam_results, term, request_type,
                thesis_exam_date -- *** UPDATED HERE: เพิ่ม field นี้
            FROM request_thesis_defense 
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
