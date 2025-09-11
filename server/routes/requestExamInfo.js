const express = require("express");
const router = express.Router();
const authenticateToken = require("../middleware/authenticateToken");
const { poolPromise } = require("../db");

const formatDate = (date) => {
	if (!date) return null;
	return new Date(date).toISOString().split("T")[0];
};

router.post("/allRequestExamInfo", authenticateToken, async (req, res) => {
	try {
		const { term } = req.body;
		const pool = await poolPromise;
		const request = await pool.request();
		let query = "SELECT * FROM request_exam_info";
		if (term) {
			query += " WHERE term = @term";
			request.input("term", term);
		}
		query += " ORDER BY request_exam_info_id DESC";
		const result = await request.query(query);

		const data = result.recordset.map((row) => {
			return {
				...row,
				open_date: formatDate(row.open_date),
				close_date: formatDate(row.close_date),
				exam_date: formatDate(row.exam_date),
			};
		});

		res.status(200).json(data);
	} catch (err) {
		console.error("requestExamInfoAll:", err);
		res.status(500).json({ message: "เกิดข้อผิดพลาดในการดึงข้อมูลช่วงเวลาการยื่นคำร้อง" });
	}
});

router.post("/addRequestExamInfo", authenticateToken, async (req, res) => {
	const { open_date, close_date, exam_date, term } = req.body;
	const { user_id } = req.user;
	try {
		const pool = await poolPromise;
		await pool
			.request()
			.input("term", term)
			.input("open_date", open_date) // ค.ศ. → พ.ศ.
			.input("close_date", close_date)
			.input("exam_date", exam_date)
			.input("officer_registrar_id", user_id)
			.input("info_exam_date", new Date()).query(`
				INSERT INTO request_exam_info (
				term,
				open_date, 
				close_date, 
				exam_date, 
				officer_registrar_id, 
				info_exam_date 
				)
				VALUES ( 
				@term,
				@open_date, 
				@close_date, 
				@exam_date, 
				@officer_registrar_id, 
				@info_exam_date 
				)
			`);
		res.status(200).json({ message: "เพิ่มข้อมูลช่วงเวลาการยื่นคำร้องสอบเรียบร้อยแล้ว" });
	} catch (err) {
		console.error("addRequestExamInfo:", err);
		res.status(500).json({ message: "เกิดข้อผิดพลาดในการเพิ่มข้อมูล" });
	}
});

router.post("/editRequestExamInfo", authenticateToken, async (req, res) => {
	const { exam_date, open_date, close_date, request_exam_info_id, term } = req.body;
	try {
		const pool = await poolPromise;
		await pool
			.request()
			.input("term", term)
			.input("exam_date", toBuddhistYear(exam_date))
			.input("open_date", toBuddhistYear(open_date))
			.input("close_date", toBuddhistYear(close_date))
			.input("request_exam_info_id", request_exam_info_id).query(`
        UPDATE request_exam_info 
        SET term = @term,
            exam_date = @exam_date, 
            open_date = @open_date, 
            close_date = @close_date 
        WHERE request_exam_info_id = @request_exam_info_id
      `);

		res.status(200).json({ message: "แก้ไขข้อมูลเรียบร้อยแล้ว" });
	} catch (err) {
		console.error("requestExamInfoEdit:", err);
		res.status(500).json({ message: "เกิดข้อผิดพลาดระหว่างการแก้ไขข้อมูล" });
	}
});

router.post("/deleteRequestExamInfo", authenticateToken, async (req, res) => {
	const { request_exam_info_id } = req.body;
	try {
		const pool = await poolPromise;
		await pool.request().input("request_exam_info_id", request_exam_info_id).query(`DELETE FROM request_exam_info WHERE request_exam_info_id = @request_exam_info_id`);
		res.status(200).json({ message: "ลบข้อมูลเรียบร้อยแล้ว" });
	} catch (err) {
		console.error("requestExamInfoEdit:", err);
		res.status(500).json({ message: "เกิดข้อผิดพลาดในการลบข้อมูล" });
	}
});

module.exports = router;
