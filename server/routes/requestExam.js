const express = require("express");
const router = express.Router();
const authenticateToken = require("../middleware/authenticateToken");
const { poolPromise } = require("../db");
const axios = require("axios");

const fs = require("fs");
const { PDFDocument } = require("pdf-lib");
const fontkit = require("@pdf-lib/fontkit");

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

router.post("/cancelApproveRequestExam", authenticateToken, async (req, res) => {
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
		const request = pool.request();
		const roleFields = {
			advisor: `
				advisor_cancel_name = @name,
				advisor_cancel = @approve,
				advisor_cancel_date = @date
			`,
			chairpersons: `
				chairpersons_cancel_name = @name,
				chairpersons_cancel = @approve,
				chairpersons_cancel_date = @date
			`,
			dean: `
				dean_cancel_name = @name,
				dean_cancel = @approve,
				dean_cancel_date = @date
			`,
		};
		await request
			.input("request_cancel_exam_id", request_cancel_exam_id)
			.input("name", name)
			.input("approve", selected === "approve" ? 1 : 0)
			.input("date", formatThaiBuddhistDate())
			.input("comment", comment_cancel).query(`
				UPDATE request_cancel_exam
				SET ${roleFields[role]}
					${selected !== "approve" ? ", comment = @comment" : ""}
				WHERE request_cancel_exam_id = @request_cancel_exam_id
			`);
		await request.input("request_exam_id", request_exam_id).input("status", statusValue).query(`
			UPDATE request_exam
			SET status = @status
			WHERE request_exam_id = @request_exam_id
		`);
		res.status(200).json({ message: "บันทึกผลการอนุมัติคำร้องขอยกเลิกเรียบร้อยแล้ว" });
	} catch (err) {
		console.error("cancelApproveRequestExam:", err);
		res.status(500).json({ message: "เกิดข้อผิดพลาดในการประมวลผล" });
	}
});

router.post("/cancelRequestExam", authenticateToken, async (req, res) => {
	const { request_exam_id, reason } = req.body;
	try {
		const pool = await poolPromise;
		const request = pool.request();
		await request.input("request_exam_id", request_exam_id).input("reason", reason).input("request_cancel_exam_date", formatThaiBuddhistDate()).query(`
			INSERT INTO request_cancel_exam (
			request_exam_id,
			reason,
			request_cancel_exam_date
			)
			VALUES (
			@request_exam_id,
			@reason,
			@request_cancel_exam_date
			)
		`);
		await request.input("status", "7").input("ever_cancel", 1).query(`
			UPDATE request_exam
			SET status = @status,
				ever_cancel = @ever_cancel
			WHERE request_exam_id = @request_exam_id
		`);

		res.status(200).json({ message: "บันทึกคำร้องขอยกเลิกการสอบเรียบร้อยแล้ว" });
	} catch (err) {
		console.error("SQL Error:", err);
		res.status(500).json({ message: "เกิดข้อผิดพลาดในการบันทึกคำร้อง" });
	}
});

router.post("/payRequestExam", authenticateToken, async (req, res) => {
	const { request_exam_id, receipt_vol_No } = req.body;
	try {
		const pool = await poolPromise;
		await pool.request().input("request_exam_id", request_exam_id).input("receipt_vol_No", receipt_vol_No).input("receipt_pay_date", formatThaiBuddhistDate()).input("status", "5").query(`
      UPDATE request_exam
      SET receipt_vol_No = @receipt_vol_No ,
          receipt_pay_date = @receipt_pay_date,
          status = @status
      WHERE request_exam_id = @request_exam_id
      `);
		res.status(200).json({ message: "บันทึกข้อมูลการชำระเงินเรียบร้อยแล้ว" });
	} catch (err) {
		console.error("SQL Error:", err);
		res.status(500).json({ message: "เกิดข้อผิดพลาดในการบันทึกการชำระเงิน" });
	}
});

router.post("/approveRequestExam", authenticateToken, async (req, res) => {
	const { request_exam_id, name, role, selected, comment } = req.body;
	if (!["advisor", "chairpersons", "officer_registrar"].includes(role)) {
		return res.status(400).json({ message: "สิทธิ์ในการเข้าถึงไม่ถูกต้อง" });
	}
	try {
		let statusValue = "";
		if (selected === "approve") {
			if (role === "advisor") {
				statusValue = "2";
			} else if (role === "chairpersons") {
				statusValue = "3";
			} else if (role === "officer_registrar") {
				statusValue = "4";
			}
		} else {
			statusValue = "6";
		}
		const pool = await poolPromise;
		const request = pool
			.request()
			.input("request_exam_id", request_exam_id)
			.input("status", statusValue)
			.input("name", name)
			.input("approve", selected === "approve" ? 1 : 0)
			.input("date", formatThaiBuddhistDate())
			.input("comment", comment);
		// สร้าง query ตาม role
		const roleFields = {
			advisor: `
        advisor_approvals_name = @name,
        advisor_approvals = @approve,
        advisor_approvals_date = @date
      `,
			chairpersons: `
        chairpersons_approvals_name = @name,
        chairpersons_approvals = @approve,
        chairpersons_approvals_date = @date
      `,
			officer_registrar: `
        registrar_approvals_name = @name,
        registrar_approvals = @approve,
        registrar_approvals_date = @date
      `,
		};
		const query = `
      UPDATE request_exam
      SET ${roleFields[role]},
          status = @status
          ${selected !== "approve" ? ", comment = @comment" : ""}
      WHERE request_exam_id = @request_exam_id
    `;
		await request.query(query);
		res.status(200).json({ message: "บันทึกผลการอนุมัติคำร้องขอสอบเรียบร้อยแล้ว" });
	} catch (err) {
		console.error("Error approving request:", err);
		res.status(500).json({ message: "เกิดข้อผิดพลาดในการประมวลผลการอนุมัติ" });
	}
});

router.post("/requestExamAll", authenticateToken, async (req, res) => {
	const { role, id } = req.body;
	console.log(role, id);

	const statusMap = {
		0: "ยกเลิก",
		1: "รออาจารย์อนุมัติ",
		2: "รอประธานหลักสูตรอนุมัติ",
		3: "รอเจ้าหน้าที่ทะเบียนตรวจสอบ",
		4: "รอการชำระค่าธรรมเนียม",
		5: "อนุมัติ",
		6: "ไม่อนุมัติ",
		7: "รออาจารย์อนุมัติ",
		8: "รอประธานหลักสูตรอนุมัติ",
		9: "รอคณบดีอนุมัติ",
	};
	const formatDate = (date) => {
		if (!date) return null;
		return new Date(date).toISOString().split("T")[0];
	};
	try {
		// 1. ดึงข้อมูลทั้งหมดจาก request_exam
		const pool = await poolPromise;
		const request = pool.request().input("id", id).input("ever_cancel", 1);
		let query = "SELECT * FROM request_exam";
		if (role === "student") {
			query += " WHERE student_id = @id";
		} else if (role === "advisor") {
			query += " WHERE study_group_id = @id ORDER BY CASE WHEN status IN (1, 7) THEN 0 ELSE 1 END, status";
		} else if (role === "chairpersons") {
			query += " WHERE major_id = @id ORDER BY CASE WHEN status IN (2, 8) THEN 0 ELSE 1 END, status";
		} else if (role === "dean") {
			query += " WHERE faculty_name = @id AND ever_cancel = @ever_cancel ORDER BY CASE WHEN status = 9 THEN 0 ELSE 1 END, status";
		} else if (role === "officer_registrar") {
			query += " ORDER BY CASE WHEN status = 3 THEN 0 ELSE 1 END, status";
		}
		const result = await request.query(query);
		// 2. ดึงข้อมูลนักศึกษาจาก API ทีละคน
		const enrichedData = await Promise.all(
			result.recordset.map(async (item) => {
				let studentInfo = null;
				try {
					const studentRes = await axios.get(`http://localhost:8080/externalApi/student/${item.student_id}`);
					studentInfo = studentRes.data;
				} catch (err) {
					console.warn(`ไม่สามารถดึงข้อมูลนักศึกษา ${item.student_id}`);
				}
				if (item.ever_cancel) {
					try {
						const cancelRes = await pool.request().query(`
							SELECT * FROM request_cancel_exam 
							WHERE request_exam_id = '${item.request_exam_id}'
							ORDER BY request_cancel_exam_date DESC
						`);
						cancelInfo = cancelRes.recordset;
					} catch (err) {
						console.warn(`ไม่สามารถดึงข้อมูลการยกเลิกของ request_exam_id ${item.request_exam_id}`);
					}
				}
				return {
					...item,
					...studentInfo,
					advisor_approvals_date: formatDate(item.advisor_approvals_date) || null,
					chairpersons_approvals_date: formatDate(item.chairpersons_approvals_date) || null,
					registrar_approvals_date: formatDate(item.registrar_approvals_date) || null,
					request_exam_date: formatDate(item.request_exam_date) || null,
					request_date: formatDate(item.status > 6 ? cancelInfo[0]?.request_cancel_exam_date : item.request_exam_date) || null,
					status_text: statusMap[item.status?.toString()] || null,
					receipt_pay_date: formatDate(item.receipt_pay_date) || null,
					request_type: item.status > 6 ? `ขอยกเลิกการเข้าสอบ${studentInfo?.request_type}` : `ขอสอบ${studentInfo?.request_type}` || null,
					...(item.ever_cancel && {
						cancel_list: cancelInfo || [],
					}),
				};
			})
		);
		res.status(200).json(enrichedData);
		/* const sortedData = enrichedData.sort((a, b) => {
			const dateA = new Date(a.request_date || a.request_date);
			const dateB = new Date(b.request_date || b.request_date);
			return dateB - dateA;
		});
		res.status(200).json(sortedData); */
	} catch (err) {
		console.error("requestExamAll:", err);
		res.status(500).json({ message: "เกิดข้อผิดพลาดในการดึงข้อมูลคำร้อง" });
	}
});

router.post("/addRequestExam", authenticateToken, async (req, res) => {
	const { student_id, study_group_id, major_name, faculty_name } = req.body;
	console.log(formatThaiBuddhistDate());

	try {
		const pool = await poolPromise;
		await pool
			.request()
			.input("student_id", student_id)
			.input("study_group_id", study_group_id)
			.input("major_id", major_name)
			.input("faculty_name", faculty_name)
			.input("request_exam_date", formatThaiBuddhistDate())
			.input("status", "1").query(`
			INSERT INTO request_exam (
				student_id,
				study_group_id,
				major_id,
				faculty_name,
				request_exam_date,
				status
			) VALUES (
				@student_id,
				@study_group_id,
				@major_id,
				@faculty_name,
				@request_exam_date,
				@status
			)`);
		res.status(200).json({ message: "บันทึกคำร้องขอสอบเรียบร้อยแล้ว" });
	} catch (err) {
		console.error("addRequestExam:", err);
		res.status(500).json({ message: "เกิดข้อผิดพลาดในการบันทึกคำร้องขอสอบ" });
	}
});

module.exports = router;
