const express = require("express");
const router = express.Router();
const authenticateToken = require("../middleware/authenticateToken");
const { poolPromise } = require("../db");

router.post("/requestExamInfoEdit", authenticateToken, async (req, res) => {
	const { exam_date, open_date, close_date, request_exam_info_id } = req.body;
	try {
		const pool = await poolPromise;
		const result = await pool.request().input("exam_date", exam_date).input("open_date", open_date).input("close_date", close_date).input("request_exam_info_id", request_exam_info_id).query(`
			UPDATE request_exam_info 
			SET exam_date = @exam_date, 
				open_date = @open_date, 
				close_date = @close_date 
			WHERE request_exam_info_id = @request_exam_info_id`);
		res.status(200).json("a");
	} catch (err) {
		console.error("requestExamInfoAll:", err);
		res.status(500).json({ error: "เกิดข้อผิดพลาดในการดึงข้อมูล" });
	}
}); 

router.post("/requestExamInfoAll", authenticateToken, async (req, res) => {
	const formatDate = (date) => {
		if (!date) return null;
		return new Date(date).toISOString().split("T")[0];
	};
	try {
		const pool = await poolPromise;
		const result = await pool.request().query(`SELECT * FROM request_exam_info`);
		const formattedData = result.recordset.map((item) => ({
			...item,
			open_date: formatDate(item.open_date),
			close_date: formatDate(item.close_date),
			exam_date: formatDate(item.exam_date),
		}));
		res.status(200).json(formattedData);
	} catch (err) {
		console.error("requestExamInfoAll:", err);
		res.status(500).json({ error: "เกิดข้อผิดพลาดในการดึงข้อมูล" });
	}
});

router.post("/addRequestExamInfo", authenticateToken, async (req, res) => {
	const { open_date, close_date, exam_date } = req.body;
	const { reference_id } = req.user;
	try {
		const pool = await poolPromise;
		await pool.request().input("open_date", open_date).input("close_date", close_date).input("exam_date", exam_date).input("officer_registrar_id", reference_id).input("info_exam_date", new Date())
			.query(`
            INSERT INTO request_exam_info ( 
                open_date, 
                close_date, 
                exam_date, 
                officer_registrar_id, 
                info_exam_date )
            VALUES ( 
                @open_date, 
                @close_date, 
                @exam_date, 
                @officer_registrar_id, 
                @info_exam_date 
        )`);
		res.status(201).json({ message: "บันทึกข้อมูลเรียบร้อยแล้ว" });
	} catch (err) {
		console.error("addRequestExamInfo:", err);
		res.status(500).json({ error: "เกิดข้อผิดพลาดในการบันทึกข้อมูล" });
	}
});

module.exports = router;
