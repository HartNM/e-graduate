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

function formatDateThaiBE(date) {
	if (!date) return null;
	const d = dayjs(date).tz("Asia/Bangkok");
	const buddhistYear = d.year() + 543;
	return `${buddhistYear}-${(d.month() + 1).toString().padStart(2, "0")}-${d.date().toString().padStart(2, "0")}`;
}

function formatDateForDB(date = new Date()) {
	return dayjs(date).tz("Asia/Bangkok").format("YYYY-MM-DD HH:mm:ss");
}

const statusMap = {
	5: "อนุมัติ",
	6: "ไม่อนุมัติ",
	7: "รออาจารย์ที่ปรึกษาอนุญาต",
	8: "รอประธานกรรมการปะจำสาขาวิชาอนุญาต",
};

router.post("/allPostponeDefenseExam", authenticateToken, async (req, res) => {
	const { lastRequest } = req.body;
	const { user_id, role } = req.user;
	try {
		const pool = await poolPromise;
		const request = pool.request().input("user_id", user_id);
		let query = `
			SELECT rqc.*,
       			rq.student_id,
       			rq.thesis_advisor_id,	
      		 	rq.major_id,
       			rq.faculty_name
			FROM postpone_defense_exam rqc
			LEFT JOIN request_thesis_defense rq
				ON rqc.request_thesis_defense_id = rq.request_thesis_defense_id
			`;
		if (role === "student") {
			if (lastRequest) {
				query = `
					SELECT TOP 1 rqc.*,
						rq.student_id,
						rq.thesis_advisor_id,	
						rq.major_id,
						rq.faculty_name
					FROM postpone_defense_exam rqc
					LEFT JOIN request_thesis_defense rq
						ON rqc.request_thesis_defense_id = rq.request_thesis_defense_id
					WHERE rq.student_id = @user_id
        		`;
			} else {
				query += " WHERE rq.student_id = @user_id";
			}
		} else if (role === "advisor") {
			query += " WHERE rq.thesis_advisor_id = @user_id";
		} else if (role === "chairpersons") {
			query += ` 
				WHERE rq.major_id IN (
						SELECT major_id 
						FROM users 
						WHERE user_id = @user_id
					)
				AND (
					rqc.status IN (0, 2, 3, 4, 5, 7, 8, 9)
					OR (
						rqc.status = 6
						AND rqc.advisor_approvals_id IS NOT NULL
						AND rqc.chairpersons_approvals_id IS NOT NULL
					)
				)
			`;
		} else if (role === "officer_registrar") {
			query += `
				WHERE (
					rqc.status IN (0, 3, 4, 5, 7, 8, 9)
					OR (
						rqc.status = 6
						AND rqc.advisor_approvals_id IS NOT NULL
						AND rqc.chairpersons_approvals_id IS NOT NULL
						AND rqc.registrar_approvals_id IS NOT NULL
					)
				)
			`;
		}
		query += " ORDER BY rqc.postpone_defense_exam_id DESC";
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
					thesis_exam_date: item.thesis_exam_date,
					request_date: item.request_date,
					advisor_approvals_date: item.advisor_approvals_date,
					chairpersons_approvals_date: item.chairpersons_approvals_date,
					registrar_approvals_date: item.registrar_approvals_date,
					receipt_pay_date: item.receipt_pay_date,
					status_text: statusMap[item.status?.toString()],
					request_type: item.request_type,
				};
			})
		);
		res.status(200).json(enrichedData);
	} catch (err) {
		console.error("requestExamAll:", err);
		res.status(500).json({ message: "เกิดข้อผิดพลาดในการดึงข้อมูลคำร้อง" });
	}
});

router.post("/addPostponeDefenseExam", authenticateToken, async (req, res) => {
	const { request_thesis_defense_id, reason, request_type, thesis_exam_date } = req.body;
	const pool = await poolPromise;
	const transaction = new sql.Transaction(pool);
	await transaction.begin();
	try {
		const request = new sql.Request(transaction);
		const result = await request
			.input("request_thesis_defense_id", request_thesis_defense_id)
			.input("reason", reason)
			.input("request_type", request_type.replace("สอบ", "เลื่อนสอบ"))
			.input("request_date", formatDateForDB())
			.input("thesis_exam_date", formatDateForDB(thesis_exam_date))
			.input("status", "7").query(`
				INSERT INTO postpone_defense_exam (
					request_thesis_defense_id,
					reason,
					request_type,
					request_date,
					thesis_exam_date,
					status
				) OUTPUT INSERTED.* VALUES (
					@request_thesis_defense_id,
					@reason,
					@request_type,
					@request_date,
					@thesis_exam_date,
					@status
				)
			`);
		await request.query(`UPDATE request_thesis_defense SET status = @status WHERE request_thesis_defense_id = @request_thesis_defense_id`);
		await transaction.commit();
		res.status(200).json({
			message: "บันทึกคำร้องขอสอบเรียบร้อยแล้ว",
			data: {
				...result.recordset[0],
				status_text: statusMap[result.recordset[0].status?.toString()],
				thesis_exam_date: result.recordset[0].thesis_exam_date,
				request_date: result.recordset[0].request_date,
				advisor_approvals_date: result.recordset[0].advisor_approvals_date,
				chairpersons_approvals_date: result.recordset[0].chairpersons_approvals_date,
			},
		});
	} catch (err) {
		await transaction.rollback();
		console.error("addPostponeProposalExam:", err);
		res.status(500).json({ message: "เกิดข้อผิดพลาดในการบันทึกคำร้องขอสอบ" });
	}
});

router.post("/approvePostponeDefenseExam", authenticateToken, async (req, res) => {
	const { postpone_defense_exam_id, request_thesis_defense_id, name, selected, comment, thesis_exam_date } = req.body;
	const { role } = req.user;
	console.log(thesis_exam_date);

	const pool = await poolPromise;
	let statusCancel;
	let status;
	if (selected === "approve") {
		if (role === "advisor") {
			status = "8";
			statusCancel = "8";
		} else if (role === "chairpersons") {
			status = "5";
			statusCancel = "5";
		}
	} else {
		status = "5";
		statusCancel = "6";
	}
	const roleFields = {
		advisor: `
				advisor_approvals_id = @name,
				advisor_approvals = @approve,
				advisor_approvals_date = @date
			`,
		chairpersons: `
				chairpersons_approvals_id = @name,
				chairpersons_approvals = @approve,
				chairpersons_approvals_date = @date
			`,
	};
	const transaction = new sql.Transaction(pool);
	await transaction.begin();
	try {
		const request = new sql.Request(transaction);
		const result = await request
			.input("postpone_defense_exam_id", postpone_defense_exam_id)
			.input("statusCancel", statusCancel)
			.input("name", name)
			.input("approve", selected === "approve" ? 1 : 0)
			.input("date", formatDateForDB())
			.input("comment", comment).query(`
				UPDATE postpone_defense_exam
				SET ${roleFields[role]},
					status = @statusCancel
					${selected !== "approve" ? ", comment = @comment" : ""}
				OUTPUT INSERTED.* WHERE postpone_defense_exam_id = @postpone_defense_exam_id
			`);
			
		if (role === "chairpersons" && selected === "approve") {
			console.log(1);
			console.log(status);
			console.log(request_thesis_defense_id);
			
			await request.input("request_thesis_defense_id", request_thesis_defense_id).input("thesis_exam_date", thesis_exam_date).input("status", status).query(`
				UPDATE request_thesis_defense
				SET status = @status, thesis_exam_date = @thesis_exam_date
				OUTPUT INSERTED.* WHERE request_thesis_defense_id = @request_thesis_defense_id`);
		} else {
			console.log(2);
			console.log(status);
			await request.input("request_thesis_defense_id", request_thesis_defense_id).input("status", status).query(`
				UPDATE request_thesis_defense
				SET status = @status
				OUTPUT INSERTED.* WHERE request_thesis_defense_id = @request_thesis_defense_id`);
		}

		await transaction.commit();

		res.status(200).json({
			message: "บันทึกผลการอนุมัติคำร้องขอสอบเรียบร้อยแล้ว",
			data: {
				...result.recordset[0],
				status_text: statusMap[result.recordset[0].status?.toString()],
				thesis_exam_date: result.recordset[0].thesis_exam_date,
				request_date: result.recordset[0].request_date,
				advisor_approvals_date: result.recordset[0].advisor_approvals_date,
				chairpersons_approvals_date: result.recordset[0].chairpersons_approvals_date,
			},
		});
	} catch (err) {
		await transaction.rollback();
		console.error("Error approving request:", err);
		res.status(500).json({ message: "เกิดข้อผิดพลาดในการประมวลผลการอนุมัติ" });
	}
});

module.exports = router;
