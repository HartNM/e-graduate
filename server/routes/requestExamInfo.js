const express = require("express");
const router = express.Router();
const authenticateToken = require("../middleware/authenticateToken");
const { poolPromise } = require("../db");

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
		res.status(200).json(result.recordset);
	} catch (err) {
		console.error("requestExamInfoAll:", err);
		res.status(500).json({ message: "เกิดข้อผิดพลาดในการดึงข้อมูลช่วงเวลาการยื่นคำร้อง" });
	}
});

router.post("/addRequestExamInfo", authenticateToken, async (req, res) => {
	try {
		const { term, term_open_date, term_close_date, KQ_open_date, KQ_close_date, KQ_exam_date, KQ_exam_end_date, ET_exam_date } = req.body;
		const { user_id } = req.user;
		const pool = await poolPromise;
		await pool
			.request()
			.input("term", term)
			.input("term_open_date", term_open_date)
			.input("term_close_date", term_close_date)
			.input("KQ_open_date", KQ_open_date)
			.input("KQ_close_date", KQ_close_date)
			.input("KQ_exam_date", KQ_exam_date)
			.input("KQ_exam_end_date", KQ_exam_end_date)
			.input("ET_exam_date", ET_exam_date)
			.input("officer_registrar_id", user_id).query(`
				INSERT INTO request_exam_info (
				term,
				term_open_date,
				term_close_date,
				KQ_open_date, 
				KQ_close_date, 
				KQ_exam_date, 
				ET_exam_date,
				KQ_exam_end_date,
				officer_registrar_id, 
				info_exam_date 
				) VALUES ( 
				@term,
				@term_open_date,
				@term_close_date,
				@KQ_open_date, 
				@KQ_close_date, 
				@KQ_exam_date,
				@KQ_exam_end_date,
				@ET_exam_date,
				@officer_registrar_id, 
				GETDATE() 
			)`);
		res.status(200).json({ message: "เพิ่มข้อมูลช่วงเวลาการยื่นคำร้องสอบเรียบร้อยแล้ว" });
	} catch (err) {
		console.error("addRequestExamInfo:", err);
		res.status(500).json({ message: "เกิดข้อผิดพลาดในการเพิ่มข้อมูล" });
	}
});

router.post("/editRequestExamInfo", authenticateToken, async (req, res) => {
	try {
		const { request_exam_info_id, term, term_open_date, term_close_date, KQ_open_date, KQ_close_date, KQ_exam_date, KQ_exam_end_date, ET_exam_date } = req.body;
		const pool = await poolPromise;
		await pool
			.request()
			.input("request_exam_info_id", request_exam_info_id)
			.input("term", term)
			.input("term_open_date", term_open_date)
			.input("term_close_date", term_close_date)
			.input("KQ_open_date", KQ_open_date)
			.input("KQ_close_date", KQ_close_date)
			.input("KQ_exam_date", KQ_exam_date)
			.input("KQ_exam_end_date", KQ_exam_end_date)
			.input("ET_exam_date", ET_exam_date).query(`
                UPDATE request_exam_info 
                SET term = @term,
                    term_open_date = @term_open_date,
                    term_close_date = @term_close_date,
                    KQ_open_date = @KQ_open_date, 
                    KQ_close_date = @KQ_close_date, 
                    KQ_exam_date = @KQ_exam_date, 
                    KQ_exam_end_date = @KQ_exam_end_date,
                    ET_exam_date = @ET_exam_date
                WHERE request_exam_info_id = @request_exam_info_id
            `);
		res.status(200).json({ message: "แก้ไขข้อมูลเรียบร้อยแล้ว" });
	} catch (err) {
		console.error("requestExamInfoEdit:", err);
		res.status(500).json({ message: "เกิดข้อผิดพลาดระหว่างการแก้ไขข้อมูล" });
	}
});

router.post("/deleteRequestExamInfo", authenticateToken, async (req, res) => {
	try {
		const { request_exam_info_id } = req.body;
		const pool = await poolPromise;
		await pool.request().input("request_exam_info_id", request_exam_info_id).query(`DELETE FROM request_exam_info WHERE request_exam_info_id = @request_exam_info_id`);
		res.status(200).json({ message: "ลบข้อมูลเรียบร้อยแล้ว" });
	} catch (err) {
		console.error("requestExamInfoEdit:", err);
		res.status(500).json({ message: "เกิดข้อผิดพลาดในการลบข้อมูล" });
	}
});

router.get("/checkOpenRequests", async (req, res) => {
	try {
		const { CheckKQ, CheckTerm } = req.body;

		let status = 0;

		const pool = await poolPromise;
		const request = pool.request();
		const result = await request.query(`SELECT * FROM request_exam_info`);

		console.log(result);

		if (CheckKQ) {
		}
		if (CheckTerm) {
		}

		res.status(200).json({ status: status });
	} catch (err) {
		console.error("CheckOpenRequests:", err);
		res.status(500).json({ message: "เกิดข้อผิดพลาดในการดึงข้อมูล" });
	}
});

module.exports = router;
