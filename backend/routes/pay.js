const express = require("express");
const router = express.Router();
const { poolPromise } = require("../db");
/* const axios = require("axios");
const BASE_URL = process.env.VITE_API_URL; */
const { getStudentData } = require("../externalApi/studentService");

router.get("/getPayData", async (req, res) => {
	const student_id = req.query.student_id;
	const tables = ["request_exam", "request_eng_test", "request_thesis_proposal", "request_thesis_defense"];
	try {
		const pool = await poolPromise;
		const request = pool.request().input("id", student_id);
		const queries = tables.map(async (tbl) => {
			//status = 5 AND
			const sql = `SELECT TOP 1 *, '${tbl}' as src FROM ${tbl} WHERE student_id = @id ORDER BY request_date DESC`;
			const { recordset } = await request.query(sql);
			return recordset[0];
		});
		const results = await Promise.all(queries);
		const candidates = results.filter((item) => item);

		if (candidates.length === 0) {
			return res.status(200).json({ message: "ไม่พบข้อมูลรายการที่ค้นหา" });
		}
		candidates.sort((a, b) => new Date(b.request_date) - new Date(a.request_date));
		const winner = candidates[0];
		let student = {};
		try {
			/* const { data } = await axios.get(`${BASE_URL}/api/student/${student_id}`);
			student = data; */
			const result = await getStudentData(student_id);
			student = result;
		} catch (e) {
			student = {};
		}
		const paymentObj = {
			center: winner.src.replace("request_", ""),
			citizent: student.citizen_id,
			orderRef1: winner.student_id,
			name: student.fname,
			lname: student.lname,
			amount: winner.receipt_pay,
			add1: "-",
			add2: "-",
			add3: "-",
			NameOther1: `ชำระค่า${winner.request_type}`,
			NameOther1_2: `ค่า${winner.request_type} ${winner.receipt_pay} บาท`,
		};
		for (let i = 3; i <= 16; i++) {
			paymentObj[`NameOther1_${i}`] = null;
		}
		return res.status(200).json([paymentObj]);
	} catch (error) {
		console.error("Error:", error);
		res.status(500).json({ message: "Error processing data." });
	}
});

module.exports = router;
