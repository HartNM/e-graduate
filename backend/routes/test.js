const express = require("express");
const router = express.Router();
const { sql, poolPromise } = require("../db");

router.get("/test", async (req, res) => {
	res.status(200).json("test");
});

router.get("/testdb", async (req, res) => {
	const pool = await poolPromise;
	const request = pool.request();
	const request_exam = await request.query(`SELECT * FROM request_exam`);
	const request_exam_cancel = await request.query(`SELECT * FROM request_exam_cancel`);
	const request_eng_test = await request.query(`SELECT * FROM request_eng_test`);
	const request_thesis_proposal = await request.query(`SELECT * FROM request_thesis_proposal`);
	const request_thesis_defense = await request.query(`SELECT * FROM request_thesis_proposal`);

	const result = (request_exam.recordset, request_exam_cancel.recordset, request_eng_test.recordset, request_thesis_proposal.recordset, request_thesis_defense.recordset)
	res.status(200).json(result);
});
module.exports = router;
