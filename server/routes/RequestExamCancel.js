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

function formatThaiBuddhistDate() {
	const d = dayjs().tz("Asia/Bangkok");
	const buddhistYear = d.year() + 543;
	return `${buddhistYear}-${d.month() + 1}-${d.date()} ${d.format("HH:mm:ss")}`;
}

const statusMap = {
	0: "อนุมัติ",
	5: "ไม่อนุมัติ",
	7: "รออาจารย์ที่ปรึกษาอนุมัติ",
	8: "รอประธานหลักสูตรอนุมัติ",
	9: "รอคณบดีอนุมัติ",
};

const formatDate = (date) => {
	if (!date) return null;
	return new Date(date).toISOString().split("T")[0];
};

router.post("/AllRequestExamCancel", authenticateToken, async (req, res) => {
	const { role, id } = req.body;
	try {
		const pool = await poolPromise;
		const request = pool.request().input("id", id);
		let query = `
			SELECT rce.request_cancel_exam_id,
					rce.request_exam_id,
					re.student_id,
					re.study_group_id,
					re.major_name,
					re.faculty_name,
					re.request_type,
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
			query += " WHERE re.student_id = @id";
		} else if (role === "advisor") {
			query += " WHERE re.study_group_id IN (SELECT value FROM STRING_SPLIT(@id, ','))";
		} else if (role === "chairpersons") {
			query += " WHERE re.major_name = @id AND (rce.status IN (0, 8, 9) OR (rce.status = 5 AND rce.advisor_cancel_id IS NOT NULL AND rce.chairpersons_cancel_id IS NOT NULL))";
		} else if (role === "dean") {
			query +=
				" WHERE re.faculty_name = @id AND (rce.status IN (0, 9) OR (rce.status = 5 AND rce.advisor_cancel_id IS NOT NULL AND rce.chairpersons_cancel_id IS NOT NULL AND rce.dean_cancel_id IS NOT NULL))";
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
					advisor_cancel_date: formatDate(item.advisor_cancel_date) || null,
					chairpersons_cancel_date: formatDate(item.chairpersons_cancel_date) || null,
					dean_cancel_date: formatDate(item.dean_cancel_date) || null,
					request_date: formatDate(item.request_date) || null,
					status_text: statusMap[item.status?.toString()] || null,
					request_type: `ขอยกเลิกการเข้า${item.request_type.replace(/^ขอ/, "")}` || null,
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
	const { reference_id } = req.user;

	try {
		const pool = await poolPromise;
		const result = await pool.request().input("student_id", reference_id).query(`SELECT TOP 1 request_exam_id FROM request_exam WHERE student_id = @student_id 
			ORDER BY request_exam_id DESC`);
		if (result.recordset.length === 0) {
			return res.status(404).json({ message: "ไม่พบคำร้องสอบของนักศึกษา" });
		}

		const request_exam_id = result.recordset[0].request_exam_id;
		const transaction = new sql.Transaction(pool);
		await transaction.begin();
		try {
			const request = new sql.Request(transaction);
			/* const request_exam_cancel =  */ await request
				.input("request_exam_id", request_exam_id)
				.input("status", "7")
				.input("reason", reason)
				.input("request_type", request_type)
				.input("request_date", formatThaiBuddhistDate()).query(`
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
					@request_date, 
				 	@status
				)`);
			/* OUTPUT INSERTED.* */
			/* const request_exam =  */ await request.query(`UPDATE request_exam SET status = @status WHERE request_exam_id = @request_exam_id`);
			await transaction.commit();
			res.status(200).json({
				message: "บันทึกคำร้องขอยกเลิกการสอบเรียบร้อยแล้ว",
				/* data: {
					...request_exam.recordset[0],
					...request_exam_cancel.recordset[0],
					request_type: request_exam_cancel.recordset[0].request_type || null,
					status_text: statusMap[request_exam_cancel.recordset[0].status?.toString()] || null,
					request_date: formatDate(request_exam_cancel.recordset[0].request_cancel_exam_date) || null,
					advisor_cancel_date: formatDate(request_exam_cancel.recordset[0].advisor_cancel_date) || null,
					chairpersons_cancel_date: formatDate(request_exam_cancel.recordset[0].chairpersons_cancel_date) || null,
					dean_cancel_date: formatDate(request_exam_cancel.recordset[0].dean_cancel_date) || null,
				}, */
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
	const { request_cancel_exam_id, request_exam_id, name, role, selected, comment_cancel } = req.body;
	if (!["advisor", "chairpersons", "dean"].includes(role)) {
		return res.status(400).json({ message: "สิทธิ์ในการเข้าถึงไม่ถูกต้อง" });
	}
	try {
		let statusValue = "";
		if (selected === "approve") {
			if (role === "advisor") {
				statusValue = "8";
			} else if (role === "chairpersons") {
				statusValue = "9";
			} else if (role === "dean") {
				statusValue = "0";
			}
		} else {
			statusValue = "5";
		}
		const pool = await poolPromise;
		const roleFields = {
			advisor: `
				advisor_cancel_id = @id,
				advisor_cancel = @approve,
				advisor_cancel_date = @date,
				status = @status
			`,
			chairpersons: `
				chairpersons_cancel_id = @id,
				chairpersons_cancel = @approve,
				chairpersons_cancel_date = @date,
				status = @status
			`,
			dean: `
				dean_cancel_id = @id,
				dean_cancel = @approve,
				dean_cancel_date = @date,
				status = @status
			`,
		};
		const transaction = new sql.Transaction(pool);
		await transaction.begin();
		try {
			const request = new sql.Request(transaction);
			const request_exam_cancel = await request
				.input("request_cancel_exam_id", request_cancel_exam_id)
				.input("id", name)
				.input("approve", selected === "approve" ? 1 : 0)
				.input("date", formatThaiBuddhistDate())
				.input("status", statusValue)
				.input("comment", comment_cancel).query(`
				UPDATE request_exam_cancel
				SET ${roleFields[role]}
					${selected !== "approve" ? ", comment = @comment" : ""}
				OUTPUT INSERTED.* WHERE request_cancel_exam_id = @request_cancel_exam_id
			`);
			const request_exam = await request.input("request_exam_id", request_exam_id).query(`
				UPDATE request_exam
				SET status = @status
				OUTPUT INSERTED.* WHERE request_exam_id = @request_exam_id`);
			await transaction.commit();
			res.status(200).json({
				message: "บันทึกคำร้องขอยกเลิกการสอบเรียบร้อยแล้ว",
				data: {
					...request_exam.recordset[0],
					...request_exam_cancel.recordset[0],
					request_type: "ขอยกเลิกการเข้าสอบประมวลความรู้" || null,
					status_text: statusMap[request_exam_cancel.recordset[0].status?.toString()] || null,
					request_cancel_exam_date: formatDate(request_exam_cancel.recordset[0].request_cancel_exam_date) || null,
					advisor_cancel_date: formatDate(request_exam_cancel.recordset[0].advisor_cancel_date) || null,
					chairpersons_cancel_date: formatDate(request_exam_cancel.recordset[0].chairpersons_cancel_date) || null,
					dean_cancel_date: formatDate(request_exam_cancel.recordset[0].dean_cancel_date) || null,
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
