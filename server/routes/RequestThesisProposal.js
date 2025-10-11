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
	7: "ขอเลื่อน",
	8: "ขอเลื่อน",
	9: "ขอเลื่อน",
};

router.post("/getAdvisors", authenticateToken, async (req, res) => {
	try {
		const pool = await poolPromise;
		const result = await pool.request().query(`SELECT user_id, name 
              FROM users 
              WHERE role = 'advisor'`);
		res.status(200).json(result.recordset);
	} catch (e) {
		console.error("getAdvisors:", e);
		res.status(500).json({ message: "เกิดข้อผิดพลาดในการดึงข้อมูล" });
	}
});

router.post("/allRequestThesisProposal", authenticateToken, async (req, res) => {
	const { lastRequest } = req.body;
	const { user_id, role } = req.user;
	console.log(lastRequest, user_id, role);

	try {
		const pool = await poolPromise;
		const request = pool.request().input("user_id", user_id);
		let query = "SELECT * FROM request_thesis_proposal";
		if (role === "student") {
			if (lastRequest) query = "SELECT TOP 1 * FROM request_thesis_proposal";
			query += " WHERE student_id = @user_id";
		} else if (role === "advisor") {
			query += " WHERE thesis_advisor_id = @user_id";
		} else if (role === "chairpersons") {
			query += ` WHERE major_id IN (SELECT major_id FROM users WHERE user_id = @user_id) AND (status IN (0, 2, 3, 4, 5, 7, 8, 9) OR (status = 6 AND advisor_approvals_id IS NOT NULL AND chairpersons_approvals_id IS NOT NULL))`;
		} else if (role === "officer_registrar") {
			query += ` WHERE (status IN (0, 3, 4, 5, 7, 8, 9) OR (status = 6 AND advisor_approvals_id IS NOT NULL AND chairpersons_approvals_id IS NOT NULL AND registrar_approvals_id IS NOT NULL))`;
		}
		query += " ORDER BY request_thesis_proposal_id DESC";
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
				let advisorInfo = null;
				try {
					const advisorRes = await axios.get(`http://localhost:8080/externalApi/user_idGetUser_name/${item.thesis_advisor_id}`);
					advisorInfo = advisorRes.data;
				} catch (e) {
					console.warn(item.thesis_advisor_id, e);
				}
				return {
					...item,
					...studentInfo,
					thesis_advisor_name: advisorInfo.name,
					status_text: statusMap[item.status?.toString()],
				};
			})
		);
		res.status(200).json(enrichedData);
	} catch (err) {
		console.error("allRequestThesisProposal:", err);
		res.status(500).json({ message: "เกิดข้อผิดพลาดในการดึงข้อมูลคำร้อง" });
	}
});

router.post("/addRequestThesisProposal", authenticateToken, async (req, res) => {
	const { student_id, study_group_id, major_id, faculty_name, research_name, thesis_advisor_id, thesis_exam_date, request_type } = req.body;
	try {
		const pool = await poolPromise;
		const infoRes = await pool.request().query(`SELECT TOP 1 *
			FROM request_exam_info
			WHERE CAST(GETDATE() AS DATE) BETWEEN term_open_date AND term_close_date
			ORDER BY request_exam_info_id DESC`);
		const result = await pool
			.request()
			.input("student_id", student_id)
			.input("study_group_id", study_group_id)
			.input("thesis_advisor_id", thesis_advisor_id)
			.input("thesis_exam_date", thesis_exam_date)
			.input("major_id", major_id)
			.input("faculty_name", faculty_name)
			.input("research_name", research_name)
			.input("request_type", `ขอสอบโครงร่าง${request_type}`)
			.input("term", infoRes.recordset[0].term)
			.input("status", "1").query(`
				INSERT INTO request_thesis_proposal (
					student_id,
					study_group_id,
					thesis_advisor_id,
					thesis_exam_date,
					major_id,
					faculty_name,
					research_name,
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
					@research_name,
					@request_type,
					@term,
					GETDATE(),
					@status
				)
			`);

		res.status(200).json({
			message: "บันทึกคำร้องขอสอบเรียบร้อยแล้ว",
			data: {
				...result.recordset[0],
				status_text: statusMap[result.recordset[0].status?.toString()],
			},
		});
	} catch (err) {
		console.error("addRequestExam:", err);
		res.status(500).json({ message: "เกิดข้อผิดพลาดในการบันทึกคำร้องขอสอบ" });
	}
});

router.post("/approveRequestThesisProposal", authenticateToken, async (req, res) => {
	const { request_thesis_proposal_id, role, selected, comment } = req.body;
	const { user_id } = req.user;

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
			.input("request_thesis_proposal_id", request_thesis_proposal_id)
			.input("status", statusValue)
			.input("user_id", user_id)
			.input("approve", selected === "approve" ? 1 : 0)
			.input("comment", comment);
		const roleFields = {
			advisor: `
				advisor_approvals_id = @user_id,
				advisor_approvals = @approve,
				advisor_approvals_date = GETDATE()
			`,
			chairpersons: `
				chairpersons_approvals_id = @user_id,
				chairpersons_approvals = @approve,
				chairpersons_approvals_date = GETDATE()
			`,
			officer_registrar: `
				registrar_approvals_id = @user_id,
				registrar_approvals = @approve,
				registrar_approvals_date = GETDATE()
			`,
		};
		const query = `
			UPDATE request_thesis_proposal
			SET ${roleFields[role]},
				status = @status
				${selected !== "approve" ? ", comment = @comment" : ""}
			OUTPUT INSERTED.*
			WHERE request_thesis_proposal_id = @request_thesis_proposal_id
			`;
		const result = await request.query(query);
		res.status(200).json({
			message: "บันทึกผลการอนุมัติคำร้องขอสอบเรียบร้อยแล้ว",
			data: {
				...result.recordset[0],
				status_text: statusMap[result.recordset[0].status?.toString()],
			},
		});
	} catch (err) {
		console.error("Error approving request:", err);
		res.status(500).json({ message: "เกิดข้อผิดพลาดในการประมวลผลการอนุมัติ" });
	}
});

router.post("/payRequestThesisProposal", authenticateToken, async (req, res) => {
	const { request_thesis_proposal_id, receipt_vol_No } = req.body;
	try {
		const pool = await poolPromise;
		const result = await pool.request().input("request_thesis_proposal_id", request_thesis_proposal_id).input("receipt_vol_No", receipt_vol_No).input("status", "5").query(`
			UPDATE request_thesis_proposal
			SET receipt_vol_No = @receipt_vol_No ,
				receipt_pay_date = GETDATE(),
				status = @status
			OUTPUT INSERTED.*
			WHERE request_thesis_proposal_id = @request_thesis_proposal_id
		`);
		const row = result.recordset[0];
		res.status(200).json({
			message: "บันทึกข้อมูลการชำระเงินเรียบร้อยแล้ว",
			data: {
				...row,
				status_text: statusMap[row.status?.toString()],
				thesis_exam_date: row.thesis_exam_date,
				request_date: row.request_date,
				advisor_approvals_date: row.advisor_approvals_date,
				chairpersons_approvals_date: row.chairpersons_approvals_date,
				registrar_approvals_date: row.registrar_approvals_date,
				receipt_pay_date: row.receipt_pay_date,
			},
		});
	} catch (err) {
		console.error("SQL Error:", err);
		res.status(500).json({ message: "เกิดข้อผิดพลาดในการบันทึกการชำระเงิน" });
	}
});

module.exports = router;
