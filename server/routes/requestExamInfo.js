const express = require("express");
const router = express.Router();
const authenticateToken = require("../middleware/authenticateToken");
const { poolPromise } = require("../db");

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

router.post("/editRequestExamInfo", authenticateToken, async (req, res) => {
	const { exam_date, open_date, close_date, request_exam_info_id, term } = req.body;
	try {
		const pool = await poolPromise;
		await pool.request().input("term", term).input("exam_date", exam_date).input("open_date", open_date).input("close_date", close_date).input("request_exam_info_id", request_exam_info_id)
			.query(`
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

router.post("/allRequestExamInfo", authenticateToken, async (req, res) => {
	const formatDate = (date) => {
		if (!date) return null;
		return new Date(date).toISOString().split("T")[0];
	};
	try {
		const pool = await poolPromise;
		const result = await pool.request().query("SELECT TOP 1 * FROM request_exam_info ORDER BY request_exam_info_id DESC");
		const formattedData = result.recordset.map((item) => ({
			...item,
			open_date: formatDate(item.open_date),
			close_date: formatDate(item.close_date),
			exam_date: formatDate(item.exam_date),
		}));
		res.status(200).json(formattedData);
	} catch (err) {
		console.error("requestExamInfoAll:", err);
		res.status(500).json({ message: "เกิดข้อผิดพลาดในการดึงข้อมูลช่วงเวลาการยื่นคำร้อง" });
	}
});

router.post("/addRequestExamInfo", authenticateToken, async (req, res) => {
	const { open_date, close_date, exam_date, term } = req.body;
	const { reference_id } = req.user;
	try {
		const pool = await poolPromise;
		await pool
			.request()
			.input("term", term)
			.input("open_date", open_date)
			.input("close_date", close_date)
			.input("exam_date", exam_date)
			.input("officer_registrar_id", reference_id)
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

module.exports = router;
