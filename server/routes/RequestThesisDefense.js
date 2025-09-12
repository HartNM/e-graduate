const express = require("express");
const router = express.Router();
const authenticateToken = require("../middleware/authenticateToken");
const { poolPromise } = require("../db");
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
	0: "ยกเลิก",
	1: "รออาจารย์ที่ปรึกษาอนุมัติ",
	2: "รอประธานหลักสูตรอนุมัติ",
	3: "รอเจ้าหน้าที่ทะเบียนตรวจสอบ",
	4: "รอการชำระค่าธรรมเนียม",
	5: "อนุมัติ",
	6: "ไม่อนุมัติ",
	7: "ขอยกเลิก",
	8: "ขอยกเลิก",
	9: "ขอยกเลิก",
};

// ดึงรายชื่ออาจารย์
router.post("/getAdvisors", authenticateToken, async (req, res) => {
	try {
		const pool = await poolPromise;
		const result = await pool.request().query(`SELECT user_id, name FROM users WHERE role = 'advisor'`);
		res.status(200).json(result.recordset);
	} catch (e) {
		console.error("getAdvisors:", e);
		res.status(500).json({ message: "เกิดข้อผิดพลาดในการดึงข้อมูล" });
	}
});

// ดึงคำร้องทั้งหมด
router.post("/allRequestThesisDefense", authenticateToken, async (req, res) => {
	const { lastRequest } = req.body;
	const { user_id, role } = req.user;
	try {
		const pool = await poolPromise;
		const request = pool.request().input("user_id", user_id);
		let query = "SELECT * FROM request_thesis_defense";
		if (role === "student") {
			if (lastRequest) query = "SELECT TOP 1 * FROM request_thesis_defense";
			query += " WHERE student_id = @user_id";
		} else if (role === "advisor") {
			query += " WHERE thesis_advisor_id = @user_id";
		} else if (role === "chairpersons") {
			query += ` WHERE major_id IN (SELECT major_id FROM chairpersonsMajor_id WHERE user_id = @user_id) AND (status IN (0, 2, 3, 4, 5, 7, 8, 9) OR (status = 6 AND advisor_approvals_id IS NOT NULL AND chairpersons_approvals_id IS NOT NULL))`;
		} else if (role === "officer_registrar") {
			query += ` WHERE (status IN (0, 3, 4, 5, 7, 8, 9) OR (status = 6 AND advisor_approvals_id IS NOT NULL AND chairpersons_approvals_id IS NOT NULL AND registrar_approvals_id IS NOT NULL))`;
		}
		query += " ORDER BY request_thesis_defense_id DESC";
		const result = await request.query(query);
		const enrichedData = await Promise.all(
			result.recordset.map(async (item) => {
				let studentInfo = null;
				try {
					const studentRes = await axios.get(`http://localhost:8080/externalApi/student/${item.student_id}`);
					studentInfo = studentRes.data;
				} catch {
					console.warn(`ไม่สามารถดึงข้อมูลนักศึกษา ${item.student_id}`);
				}
				return {
					...item,
					...studentInfo,
					thesis_exam_date: formatDateThaiBE(item.thesis_exam_date),
					request_date: formatDateThaiBE(item.request_date),
					advisor_approvals_date: formatDateThaiBE(item.advisor_approvals_date),
					chairpersons_approvals_date: formatDateThaiBE(item.chairpersons_approvals_date),
					registrar_approvals_date: formatDateThaiBE(item.registrar_approvals_date),
					receipt_pay_date: formatDateThaiBE(item.receipt_pay_date),
					status_text: statusMap[item.status?.toString()],
					request_type: item.request_type,
				};
			})
		);

		res.status(200).json(enrichedData);
	} catch (err) {
		console.error("allRequestThesisDefense:", err);
		res.status(500).json({ message: "เกิดข้อผิดพลาดในการดึงข้อมูลคำร้อง" });
	}
});

router.post("/addRequestThesisDefense", authenticateToken, async (req, res) => {
	const { student_id, study_group_id, major_id, faculty_name, thesis_advisor_id, thesis_exam_date, request_type } = req.body;
	try {
		const pool = await poolPromise;
		const infoRes = await pool.request().query(`SELECT term FROM request_exam_info ORDER BY request_exam_info_id DESC`);
		const infoProposal = await pool
			.request()
			.input("student_id", student_id)
			.query(`SELECT thesis_advisor_id, request_type FROM request_thesis_proposal WHERE student_id = @student_id ORDER BY thesis_advisor_id DESC`);
		const result = await pool
			.request()
			.input("student_id", student_id)
			.input("study_group_id", study_group_id)
			.input("thesis_advisor_id", infoProposal.recordset[0].thesis_advisor_id)
			.input("thesis_exam_date", thesis_exam_date)
			.input("major_id", major_id)
			.input("faculty_name", faculty_name)
			.input("request_type", infoProposal.recordset[0].request_type.replace("โครงร่าง", ""))
			.input("term", infoRes.recordset[0].term)
			.input("request_date", formatDateForDB())
			.input("status", "1").query(`
				INSERT INTO request_thesis_defense (
					student_id,
					study_group_id,
					thesis_advisor_id,
					thesis_exam_date,
					major_id,
					faculty_name,
					request_type,
					term,
					request_date,
					status
				) OUTPUT INSERTED.* VALUES (
					@student_id,
					@study_group_id,
					@thesis_advisor_id,
					@thesis_exam_date,
					@major_id,
					@faculty_name,
					@request_type,
					@term,
					@request_date,
					@status
				)
			`);
		res.status(200).json({
			message: "บันทึกคำร้องขอสอบเรียบร้อยแล้ว",
			data: {
				...result.recordset[0],
				status_text: statusMap[result.recordset[0].status?.toString()],
				thesis_exam_date: formatDateThaiBE(result.recordset[0].thesis_exam_date),
				request_date: formatDateThaiBE(result.recordset[0].request_date),
				advisor_approvals_date: formatDateThaiBE(result.recordset[0].advisor_approvals_date),
				chairpersons_approvals_date: formatDateThaiBE(result.recordset[0].chairpersons_approvals_date),
				registrar_approvals_date: formatDateThaiBE(result.recordset[0].registrar_approvals_date),
				receipt_pay_date: formatDateThaiBE(result.recordset[0].receipt_pay_date),
			},
		});
	} catch (err) {
		console.error("addRequestThesisDefense:", err);
		res.status(500).json({ message: "เกิดข้อผิดพลาดในการบันทึกคำร้องขอสอบ" });
	}
});

router.post("/approveRequestThesisDefense", authenticateToken, async (req, res) => {
	const { request_thesis_defense_id, name, role, selected, comment } = req.body;
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
			.input("request_thesis_defense_id", request_thesis_defense_id)
			.input("status", statusValue)
			.input("name", name)
			.input("approve", selected === "approve" ? 1 : 0)
			.input("date", formatDateForDB())
			.input("comment", comment);

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
			officer_registrar: `
				registrar_approvals_id = @name,
				registrar_approvals = @approve,
				registrar_approvals_date = @date
			`,
		};

		const query = `
			UPDATE request_thesis_defense
			SET ${roleFields[role]},
				status = @status
				${selected !== "approve" ? ", comment = @comment" : ""}
			OUTPUT INSERTED.*
			WHERE request_thesis_defense_id = @request_thesis_defense_id
		`;
		const result = await request.query(query);

		res.status(200).json({
			message: "บันทึกผลการอนุมัติคำร้องขอสอบเรียบร้อยแล้ว",
			data: {
				...result.recordset[0],
				status_text: statusMap[result.recordset[0].status?.toString()],
				thesis_exam_date: formatDateThaiBE(result.recordset[0].thesis_exam_date),
				request_date: formatDateThaiBE(result.recordset[0].request_date),
				advisor_approvals_date: formatDateThaiBE(result.recordset[0].advisor_approvals_date),
				chairpersons_approvals_date: formatDateThaiBE(result.recordset[0].chairpersons_approvals_date),
				registrar_approvals_date: formatDateThaiBE(result.recordset[0].registrar_approvals_date),
				receipt_pay_date: formatDateThaiBE(result.recordset[0].receipt_pay_date),
			},
		});
	} catch (err) {
		console.error("approveRequestThesisDefense:", err);
		res.status(500).json({ message: "เกิดข้อผิดพลาดในการประมวลผลการอนุมัติ" });
	}
});

// ชำระเงิน
router.post("/payRequestThesisDefense", authenticateToken, async (req, res) => {
	const { request_thesis_defense_id, receipt_vol_No } = req.body;
	try {
		const pool = await poolPromise;
		const result = await pool
			.request()
			.input("request_thesis_defense_id", request_thesis_defense_id)
			.input("receipt_vol_No", receipt_vol_No)
			.input("receipt_pay_date", formatDateForDB())
			.input("status", "5").query(`
				UPDATE request_thesis_defense
				SET receipt_vol_No = @receipt_vol_No,
					receipt_pay_date = @receipt_pay_date,
					status = @status
				OUTPUT INSERTED.*
				WHERE request_thesis_defense_id = @request_thesis_defense_id
			`);

		const row = result.recordset[0];
		res.status(200).json({
			message: "บันทึกข้อมูลการชำระเงินเรียบร้อยแล้ว",
			data: {
				...row,
				status_text: statusMap[row.status?.toString()],
				thesis_exam_date: formatDateThaiBE(row.thesis_exam_date),
				request_date: formatDateThaiBE(row.request_date),
				advisor_approvals_date: formatDateThaiBE(row.advisor_approvals_date),
				chairpersons_approvals_date: formatDateThaiBE(row.chairpersons_approvals_date),
				registrar_approvals_date: formatDateThaiBE(row.registrar_approvals_date),
				receipt_pay_date: formatDateThaiBE(row.receipt_pay_date),
			},
		});
	} catch (err) {
		console.error("payRequestThesisDefense:", err);
		res.status(500).json({ message: "เกิดข้อผิดพลาดในการบันทึกการชำระเงิน" });
	}
});

module.exports = router;
