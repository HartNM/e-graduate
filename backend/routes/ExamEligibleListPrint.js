const express = require("express");
const router = express.Router();
const authenticateToken = require("../middleware/authenticateToken");
const { poolPromise } = require("../db");
/* const axios = require("axios");
const BASE_URL = process.env.VITE_API_URL; */
const { getStudentData } = require("../externalApi/studentService");

const statusMap = {
	0: "ยกเลิก",
	1: "รออาจารย์ที่ปรึกษาอนุญาต",
	2: "รอประธานกรรมการปะจำสาขาวิชาอนุญาต",
	3: "รอเจ้าหน้าที่ทะเบียนตรวจสอบ",
	4: "รอการชำระค่าธรรมเนียม",
	5: "อนุญาต",
	6: "ไม่อนุญาต",
	7: "ขอยกเลิก",
	8: "ขอยกเลิก",
	9: "ขอยกเลิก",
};

router.post("/allExamEligibleListPrint", authenticateToken, async (req, res) => {
	const { user_id, major_ids } = req.user;
	const { term } = req.body;

	try {
		const pool = await poolPromise;
		const request = pool.request().input("user_id", user_id).input("term", term).input("major_ids_str", major_ids.join(","));
		let query = `
			SELECT study_group_id, student_id, exam_results, term, request_type, status
			FROM request_exam 
			WHERE major_id IN ((SELECT value FROM STRING_SPLIT(@major_ids_str, ','))) AND term = @term
		`;
		/* let query = `
			SELECT study_group_id, student_id, exam_results, term, request_type, status
			FROM request_exam 
			WHERE major_id IN ((SELECT value FROM STRING_SPLIT(@major_ids_str, ','))) AND status = 5
		`; */
		const result = await request.query(query);
		const output = {};
		result.recordset.forEach((row) => {
			if (!output[row.study_group_id]) output[row.study_group_id] = [];
			output[row.study_group_id].push({
				student_id: row.student_id,
				exam_results: row.exam_results,
				term: row.term,
				request_type: row.request_type,
				status: row.status,
			});
		});
		const allStudentIds = Object.values(output).flatMap((group) => group.map((s) => s.student_id));
		/* const promises = allStudentIds.map((studentId) => axios.get(`${BASE_URL}/api/student/${studentId}`)); */
		const { getStudentData } = require('../externalApi/studentService');
		const promises = allStudentIds.map((studentId) => getStudentData(studentId));
		
		const studentResults = await Promise.all(promises);
		const studentMap = {};
		studentResults.forEach((res) => {
			const student = res.data;
			studentMap[student.student_id] = student;
		});
		const finalOutput = {};
		Object.entries(output).forEach(([groupId, students]) => {
			finalOutput[groupId] = students.map(({ student_id, exam_results, term, request_type, status }) => ({
				id: student_id,
				name: studentMap[student_id]?.student_name || "",
				exam_results,
				term,
				request_type,
				status,
				major_name: studentMap[student_id]?.major_name,
				status_text: statusMap[status.toString()],
			}));
		});
		res.status(200).json(finalOutput);
	} catch (err) {
		console.error("requestExamInfoAll:", err);
		res.status(500).json({ message: "เกิดข้อผิดพลาดในการดึงข้อมูล" });
	}
});

module.exports = router;
