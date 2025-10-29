const express = require("express");
const router = express.Router();
const authenticateToken = require("../middleware/authenticateToken");
const { sql, poolPromise } = require("../db");
const axios = require("axios");

const statusMap = {
	0: "อนุมัติ",
	5: "ไม่อนุมัติ",
	7: "รออาจารย์ที่ปรึกษาอนุญาต",
	8: "รอประธานกรรมการปะจำสาขาวิชาอนุญาต",
	9: "รอคณบดีอนุญาต",
};

router.post("/CheckOpenREC", authenticateToken, async (req, res) => {
	try {
		const pool = await poolPromise;
		const result = await pool.query(`
			SELECT *
			FROM request_exam_info
			WHERE CAST(GETDATE() AS DATE) BETWEEN term_open_date AND term_close_date
		`);

		console.log(result.recordset[0].KQ_exam_date);

		const examDate = new Date(result.recordset[0].KQ_exam_date);
		const today = new Date();
		// คำนวณต่าง 3 วัน (หน่วยเป็น milliseconds)
		const diffTime = examDate - today;
		const diffDays = diffTime / (1000 * 60 * 60 * 24);

		if (diffDays <= 3) {
			// ทำงานถ้าเหลือ <= 3 วัน
			console.log("เหลือก่อนวันสอบไม่เกิน 3 วัน");
			res.status(401).json({ message: "เกินกำหนดการขอยกเลิกแล้ว" });
		} else {
			console.log("ยังไม่ถึงช่วง 3 วันก่อนสอบ");
			res.status(200).json(result.recordset);
		}
	} catch (err) {
		console.error("CheckOpenREC:", err);
		res.status(500).json({ message: "เกิดข้อผิดพลาด" });
	}
});

router.post("/AllRequestExamCancel", authenticateToken, async (req, res) => {
	const { term } = req.body;
	const { user_id, role } = req.user;
	try {
		const pool = await poolPromise;
		const request = pool.request().input("user_id", user_id).input("term", term);
		let query = `
			SELECT rce.request_cancel_exam_id,
					rce.request_exam_id,
					re.student_id,
					re.study_group_id,
					re.major_id,
					re.faculty_name,
					re.term,
					rce.request_type,
					rce.status,
					rce.reason,
					rce.request_date,
					rce.advisor_approvals_id,
					rce.advisor_approvals,
					rce.advisor_approvals_date,
					rce.chairpersons_approvals_id,
					rce.chairpersons_approvals,
					rce.chairpersons_approvals_date,
					rce.dean_approvals_id,
					rce.dean_approvals,
					rce.dean_approvals_date,
					rce.comment
			FROM [request_submission].[dbo].[request_exam_cancel] rce
			INNER JOIN [request_submission].[dbo].[request_exam] re
					ON rce.request_exam_id = re.request_exam_id
			`;
		if (role === "student") {
			query += " WHERE re.student_id = @user_id";
		} else if (role === "advisor") {
			query += " WHERE re.study_group_id IN (SELECT group_no FROM advisorGroup_no WHERE user_id = @user_id) AND re.term = @term";
		} else if (role === "chairpersons") {
			query +=
				" WHERE re.major_id IN (SELECT major_id FROM users WHERE user_id = @user_id) AND (rce.status IN (0, 8, 9) OR (rce.status = 5 AND rce.advisor_approvals_id IS NOT NULL AND rce.chairpersons_approvals_id IS NOT NULL)) AND re.term = @term";
		} else if (role === "dean") {
			query +=
				" WHERE re.faculty_name IN (SELECT faculty_name FROM users WHERE user_id = @user_id) AND (rce.status IN (0, 9) OR (rce.status = 5 AND rce.advisor_approvals_id IS NOT NULL AND rce.chairpersons_approvals_id IS NOT NULL AND rce.dean_approvals_id IS NOT NULL)) AND re.term = @term";
		}
		query += " ORDER BY request_cancel_exam_id DESC";
		const result = await request.query(query);
		const enrichedData = await Promise.all(
			result.recordset.map(async (item) => {
				let studentInfo = null;
				try {
					const studentRes = await axios.get(`http://localhost:8080/externalApi/student/${item.student_id}`);
					studentInfo = studentRes.data;
				} catch (err) {
					console.warn(`ไม่สามารถดึงข้อมูลนักศึกษา ${item.student_id}`);
				}
				return {
					...item,
					...studentInfo,
					status_text: statusMap[item.status?.toString()] || null,
					advisor_approvals: item.advisor_approvals === null ? null : item.advisor_approvals === "1",
					chairpersons_approvals: item.chairpersons_approvals === null ? null : item.chairpersons_approvals === "1",
					registrar_approvals: item.registrar_approvals === null ? null : item.registrar_approvals === "1",
				};
			})
		);
		res.status(200).json(enrichedData);
	} catch (err) {
		console.error("AllRequestExamCancel:", err);
		res.status(500).json({ message: "เกิดข้อผิดพลาดในการดึงข้อมูลคำร้อง" });
	}
});

router.post("/AddRequestExamCancel", authenticateToken, async (req, res) => {
	const { reason, request_type } = req.body;
	const { user_id } = req.user;
	try {
		const pool = await poolPromise;

		const result = await pool.request().input("student_id", user_id).query(`SELECT TOP 1 request_exam_id FROM request_exam WHERE student_id = @student_id 
			ORDER BY request_exam_id DESC`);
		if (result.recordset.length === 0) {
			return res.status(404).json({ message: "ไม่พบคำร้องสอบของนักศึกษา" });
		}

		const request_exam_id = result.recordset[0].request_exam_id;
		const transaction = new sql.Transaction(pool);
		await transaction.begin();
		try {
			const request = new sql.Request(transaction);
			const request_exam_cancel = await request.input("request_exam_id", request_exam_id).input("status", "7").input("reason", reason).input("request_type", request_type).query(`
				INSERT INTO request_exam_cancel (
					request_exam_id, 
					reason, 
					request_type,
					request_date, 
					status
				) OUTPUT INSERTED.* VALUES (
					@request_exam_id, 
					@reason, 
					@request_type, 
					GETDATE(), 
				 	@status
				)`);
			const request_exam = await request.query(`UPDATE request_exam SET status = @status OUTPUT INSERTED.* WHERE request_exam_id = @request_exam_id`);
			await transaction.commit();
			res.status(200).json({
				message: "บันทึกคำร้องขอยกเลิกการสอบเรียบร้อยแล้ว",
				data: {
					...request_exam.recordset[0],
					...request_exam_cancel.recordset[0],
					status_text: statusMap[request_exam_cancel.recordset[0].status?.toString()] || null,
					advisor_approvals: request_exam.recordset[0].advisor_approvals === null ? null : request_exam.recordset[0].advisor_approvals === "1",
					chairpersons_approvals: request_exam.recordset[0].chairpersons_approvals === null ? null : request_exam.recordset[0].chairpersons_approvals === "1",
					registrar_approvals: request_exam.recordset[0].registrar_approvals === null ? null : request_exam.recordset[0].registrar_approvals === "1",
				},
			});
		} catch (err) {
			await transaction.rollback();
			throw err;
		}
	} catch (err) {
		console.error("AddRequestExamCancel:", err);
		res.status(500).json({ message: "เกิดข้อผิดพลาดในการบันทึกคำร้อง" });
	}
});

router.post("/ApproveRequestExamCancel", authenticateToken, async (req, res) => {
	const { request_cancel_exam_id, request_exam_id, selected, comment_cancel } = req.body;
	const { user_id, role } = req.user;

	try {
		const pool = await poolPromise;
		let statusCancel;
		let status;
		if (selected === "approve") {
			if (role === "advisor") {
				statusCancel = "8";
			} else if (role === "chairpersons") {
				statusCancel = "9";
			} else if (role === "dean") {
				statusCancel = "0";
			}
			status = statusCancel;
		} else {
			const checkStatus = await pool
				.request()
				.input("request_exam_id", request_exam_id)
				.query("SELECT advisor_approvals, chairpersons_approvals,registrar_approvals,receipt_vol FROM request_exam WHERE request_exam_id = @request_exam_id");
			if (checkStatus.recordset[0].advisor_approvals === null) status = "1";
			else if (checkStatus.recordset[0].chairpersons_approvals === null) status = "2";
			else if (checkStatus.recordset[0].registrar_approvals === null) status = "3";
			else if (checkStatus.recordset[0].receipt_vol === null) status = "4";
			else status = "5";
			statusCancel = "5";
		}
		const roleFields = {
			advisor: `
				advisor_approvals_id = @user_id,
				advisor_approvals = @approve,
				advisor_approvals_date = GETDATE(),
				status = @statusCancel
			`,
			chairpersons: `
				chairpersons_approvals_id = @user_id,
				chairpersons_approvals = @approve,
				chairpersons_approvals_date = GETDATE(),
				status = @statusCancel
			`,
			dean: `
				dean_approvals_id = @user_id,
				dean_approvals = @approve,
				dean_approvals_date = GETDATE(),
				status = @statusCancel
			`,
		};
		const transaction = new sql.Transaction(pool);
		await transaction.begin();
		try {
			const request = new sql.Request(transaction);
			const request_exam_cancel = await request
				.input("request_cancel_exam_id", request_cancel_exam_id)
				.input("user_id", user_id)
				.input("approve", selected === "approve" ? 1 : 0)
				.input("statusCancel", statusCancel)
				.input("comment", comment_cancel).query(`
				UPDATE request_exam_cancel
				SET ${roleFields[role]}
					${selected !== "approve" ? ", comment = @comment" : ""}
				OUTPUT INSERTED.* WHERE request_cancel_exam_id = @request_cancel_exam_id
			`);
			const request_exam = await request.input("request_exam_id", request_exam_id).input("status", status).query(`
				UPDATE request_exam
				SET status = @status
				OUTPUT INSERTED.* WHERE request_exam_id = @request_exam_id`);
			await transaction.commit();
			res.status(200).json({
				message: "บันทึกคำร้องขอยกเลิกการสอบเรียบร้อยแล้ว",
				data: {
					...request_exam.recordset[0],
					...request_exam_cancel.recordset[0],
					status_text: statusMap[request_exam_cancel.recordset[0].status?.toString()] || null,
					advisor_approvals: request_exam.recordset[0].advisor_approvals === null ? null : request_exam.recordset[0].advisor_approvals === "1",
					chairpersons_approvals: request_exam.recordset[0].chairpersons_approvals === null ? null : request_exam.recordset[0].chairpersons_approvals === "1",
					registrar_approvals: request_exam.recordset[0].registrar_approvals === null ? null : request_exam.recordset[0].registrar_approvals === "1",
				},
			});
		} catch (err) {
			await transaction.rollback();
			throw err;
		}
	} catch (err) {
		console.error("cancelApproveRequestExam:", err);
		res.status(500).json({ message: "เกิดข้อผิดพลาดในการประมวลผล" });
	}
});

module.exports = router;
