const express = require("express");
const router = express.Router();
const authenticateToken = require("../middleware/authenticateToken");
const { sql, poolPromise } = require("../db");
const axios = require("axios");

const dayjs = require("dayjs");
const utc = require("dayjs/plugin/utc");
const timezone = require("dayjs/plugin/timezone");
dayjs.extend(utc);
dayjs.extend(timezone);

// คืนค่าแบบ YYYY-MM-DD (พ.ศ.) สำหรับส่ง response
const formatDateThaiBE = (date) => {
	if (!date) return null;
	const d = dayjs(date).tz("Asia/Bangkok");
	const buddhistYear = d.year() + 543;
	return `${buddhistYear}-${(d.month() + 1).toString().padStart(2, "0")}-${d.date().toString().padStart(2, "0")}`;
};

// คืนค่าแบบ YYYY-MM-DD HH:mm:ss (พ.ศ.) สำหรับบันทึก DB
function formatDateForDB(date = new Date()) {
	return dayjs(date).tz("Asia/Bangkok").format("YYYY-MM-DD HH:mm:ss");
}
const statusMap = {
	0: "อนุมัติ",
	5: "ไม่อนุมัติ",
	7: "รออาจารย์ที่ปรึกษาอนุญาต",
	8: "รอประธานกรรมการปะจำสาขาวิชาอนุญาต",
	9: "รอคณบดีอนุญาต",
};

router.post("/AllRequestExamCancel", authenticateToken, async (req, res) => {
	const { user_id, role } = req.user;
	try {
		const pool = await poolPromise;
		const request = pool.request().input("user_id", user_id);
		let query = `
			SELECT rce.request_cancel_exam_id,
					rce.request_exam_id,
					re.student_id,
					re.study_group_id,
					re.major_id,
					re.faculty_name,
					rce.request_type,
					rce.status,
					rce.reason,
					rce.request_date,
					rce.advisor_cancel_id,
					rce.advisor_cancel,
					rce.advisor_cancel_date,
					rce.chairpersons_cancel_id,
					rce.chairpersons_cancel,
					rce.chairpersons_cancel_date,
					rce.dean_cancel_id,
					rce.dean_cancel,
					rce.dean_cancel_date,
					rce.comment
			FROM [request_submission].[dbo].[request_exam_cancel] rce
			INNER JOIN [request_submission].[dbo].[request_exam] re
					ON rce.request_exam_id = re.request_exam_id
			`;
		if (role === "student") {
			query += " WHERE re.student_id = @user_id";
		} else if (role === "advisor") {
			query += " WHERE re.study_group_id IN (SELECT group_no FROM advisorGroup_no WHERE user_id = @user_id)";
		} else if (role === "chairpersons") {
			query +=
				" WHERE re.major_id IN (SELECT major_id FROM users WHERE user_id = @user_id) AND (rce.status IN (0, 8, 9) OR (rce.status = 5 AND rce.advisor_cancel_id IS NOT NULL AND rce.chairpersons_cancel_id IS NOT NULL))";
		} else if (role === "dean") {
			query +=
				" WHERE re.faculty_name IN (SELECT faculty_name FROM users WHERE user_id = @user_id) AND (rce.status IN (0, 9) OR (rce.status = 5 AND rce.advisor_cancel_id IS NOT NULL AND rce.chairpersons_cancel_id IS NOT NULL AND rce.dean_cancel_id IS NOT NULL))";
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
					request_date: item.request_date || null,
					advisor_cancel_date: item.advisor_cancel_date || null,
					chairpersons_cancel_date: item.chairpersons_cancel_date || null,
					dean_cancel_date: item.dean_cancel_date || null,
					status_text: statusMap[item.status?.toString()] || null,
				};
			})
		);
		res.status(200).json(enrichedData);
	} catch (err) {
		console.error("requestExamAll:", err);
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
			await request.input("request_exam_id", request_exam_id).input("status", "7").input("reason", reason).input("request_type", request_type).query(`
				INSERT INTO request_exam_cancel (
					request_exam_id, 
					reason, 
					request_type,
					request_date, 
					status
				) VALUES (
					@request_exam_id, 
					@reason, 
					@request_type, 
					GETDATE(), 
				 	@status
				)`);
			await request.query(`UPDATE request_exam SET status = @status WHERE request_exam_id = @request_exam_id`);
			await transaction.commit();
			res.status(200).json({
				message: "บันทึกคำร้องขอยกเลิกการสอบเรียบร้อยแล้ว",
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
	const { request_cancel_exam_id, request_exam_id, name, selected, comment_cancel } = req.body;
	const { user_id, role } = req.user;

	if (!["advisor", "chairpersons", "dean"].includes(role)) {
		return res.status(400).json({ message: "สิทธิ์ในการเข้าถึงไม่ถูกต้อง" });
	}
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
				.query("SELECT advisor_approvals, chairpersons_approvals,registrar_approvals,receipt_vol_No FROM request_exam WHERE request_exam_id = @request_exam_id");
			if (checkStatus.recordset[0].advisor_approvals === null) status = "1";
			else if (checkStatus.recordset[0].chairpersons_approvals === null) status = "2";
			else if (checkStatus.recordset[0].registrar_approvals === null) status = "3";
			else if (checkStatus.recordset[0].receipt_vol_No === null) status = "4";
			else status = "5";
			statusCancel = "5";
		}
		const roleFields = {
			advisor: `
				advisor_cancel_id = @user_id,
				advisor_cancel = @approve,
				advisor_cancel_date = @date,
				status = @statusCancel
			`,
			chairpersons: `
				chairpersons_cancel_id = @user_id,
				chairpersons_cancel = @approve,
				chairpersons_cancel_date = @date,
				status = @statusCancel
			`,
			dean: `
				dean_cancel_id = @user_id,
				dean_cancel = @approve,
				dean_cancel_date = @date,
				status = @statusCancel
			`,
		};
		const transaction = new sql.Transaction(pool);
		await transaction.begin();
		try {
			const request = new sql.Request(transaction);
			const request_exam_cancel = await request
				.input("request_cancel_exam_id", request_cancel_exam_id)
				.input("user_id", name)
				.input("approve", selected === "approve" ? 1 : 0)
				.input("date", formatDateForDB())
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
					request_date: request_exam_cancel.recordset[0].request_date || null,
					request_cancel_exam_date: request_exam_cancel.recordset[0].request_cancel_exam_date || null,
					advisor_cancel_date: request_exam_cancel.recordset[0].advisor_cancel_date || null,
					chairpersons_cancel_date: request_exam_cancel.recordset[0].chairpersons_cancel_date || null,
					dean_cancel_date: request_exam_cancel.recordset[0].dean_cancel_date || null,
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
