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

function formatThaiBuddhistDate() {
	const d = dayjs().tz("Asia/Bangkok");
	const buddhistYear = d.year() + 543;
	return `${buddhistYear}-${d.month() + 1}-${d.date()} ${d.format("HH:mm:ss")}`;
}

const statusMap = {
	1: "รออาจารย์ที่ปรึกษาอนุมัติ",
	2: "รอประธานหลักสูตรอนุมัติ",
	3: "รอเจ้าหน้าที่ทะเบียนตรวจสอบ",
	4: "รอการชำระค่าธรรมเนียม",
	5: "อนุมัติ",
	6: "ไม่อนุมัติ",
};

const formatDate = (date) => {
	if (!date) return null;
	return new Date(date).toISOString().split("T")[0];
};

router.post("/allRequestEngTest", authenticateToken, async (req, res) => {
	const { role, user_id } = req.user;
	try {
		const pool = await poolPromise;
		const request = pool.request().input("user_id", user_id);
		let query = "SELECT * FROM request_eng_test";
		if (role === "student") {
			query += " WHERE student_id = @user_id";
		} else if (role === "advisor") {
			query += " WHERE study_group_id IN (SELECT group_no FROM advisorGroup_no WHERE user_id = @user_id)";
		} else if (role === "chairpersons") {
			query += " WHERE major_id IN (SELECT major_id FROM users WHERE user_id = @user_id) OR (status = 6 AND advisor_approvals_id IS NOT NULL AND chairpersons_approvals_id IS NOT NULL)";
		} else if (role === "officer_registrar") {
			query += " WHERE (status IN (0, 3, 4, 5) OR (status = 6 AND advisor_approvals_id IS NOT NULL AND chairpersons_approvals_id IS NOT NULL AND registrar_approvals_id IS NOT NULL))";
		}
		query += " ORDER BY request_eng_test_id DESC";
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
					advisor_approvals_date: item.advisor_approvals_date || null,
					chairpersons_approvals_date: item.chairpersons_approvals_date || null,
					registrar_approvals_date: item.registrar_approvals_date || null,
					receipt_pay_date: item.receipt_pay_date || null,
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

router.post("/addRequestEngTest", authenticateToken, async (req, res) => {
	const { student_id, study_group_id, major_id, faculty_name } = req.body;
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
			.input("major_id", major_id)
			.input("faculty_name", faculty_name)
			.input("request_type", "คำร้องขอทดสอบความรู้ทางภาษาอังกฤษ")
			.input("term", infoRes.recordset[0].term)
			.input("status", "1").query(`
			INSERT INTO request_eng_test (
				student_id,
				study_group_id,
				major_id,
				faculty_name,
				request_type,
				term,
				request_date,
				status
			) OUTPUT INSERTED.* VALUES (
				@student_id,
				@study_group_id,
				@major_id,
				@faculty_name,
				@request_type,
				@term,
				GETDATE(),
				@status
			)`);

		res.status(200).json({
			message: "บันทึกคำร้องขอสอบเรียบร้อยแล้ว",
			data: {
				...result.recordset[0],
				status_text: statusMap[result.recordset[0].status?.toString()] || null,
				request_date: result.recordset[0].request_date || null,
				advisor_approvals_date: result.recordset[0].advisor_approvals_date || null,
				chairpersons_approvals_date: result.recordset[0].chairpersons_approvals_date || null,
				registrar_approvals_date: result.recordset[0].registrar_approvals_date || null,
				receipt_pay_date: result.recordset[0].receipt_pay_date || null,
			},
		});
	} catch (err) {
		console.error("addRequestExam:", err);
		res.status(500).json({ message: "เกิดข้อผิดพลาดในการบันทึกคำร้องขอสอบ" });
	}
});

router.post("/approveRequestEngTest", authenticateToken, async (req, res) => {
	const { request_eng_test_id, name, role, selected, comment } = req.body;
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
			.input("request_eng_test_id", request_eng_test_id)
			.input("status", statusValue)
			.input("name", name)
			.input("approve", selected === "approve" ? 1 : 0)
			.input("comment", comment);
		// สร้าง query ตาม role
		const roleFields = {
			advisor: `
				advisor_approvals_id = @name,
				advisor_approvals = @approve,
				advisor_approvals_date = GETDATE()
			`,
			chairpersons: `
				chairpersons_approvals_id = @name,
				chairpersons_approvals = @approve,
				chairpersons_approvals_date = GETDATE()
			`,
			officer_registrar: `
				registrar_approvals_id = @name,
				registrar_approvals = @approve,
				registrar_approvals_date = GETDATE()
			`,
		};
		const query = `
			UPDATE request_eng_test
			SET ${roleFields[role]},
				status = @status
				${selected !== "approve" ? ", comment = @comment" : ""}
			OUTPUT INSERTED.* 
			WHERE request_eng_test_id = @request_eng_test_id
		`;
		const result = await request.query(query);
		res.status(200).json({
			message: "บันทึกผลการอนุมัติคำร้องขอสอบเรียบร้อยแล้ว",
			data: {
				...result.recordset[0],
				status_text: statusMap[result.recordset[0].status?.toString()] || null,
				request_date: result.recordset[0].request_date || null,
				advisor_approvals_date: result.recordset[0].advisor_approvals_date || null,
				chairpersons_approvals_date: result.recordset[0].chairpersons_approvals_date || null,
				registrar_approvals_date: result.recordset[0].registrar_approvals_date || null,
				receipt_pay_date: result.recordset[0].receipt_pay_date || null,
			},
		});
	} catch (err) {
		console.error("Error approving request:", err);
		res.status(500).json({ message: "เกิดข้อผิดพลาดในการประมวลผลการอนุมัติ" });
	}
});

router.post("/payRequestEngTest", authenticateToken, async (req, res) => {
	const { request_eng_test_id, receipt_vol_No } = req.body;
	try {
		const pool = await poolPromise;
		const result = await pool
			.request()
			.input("request_eng_test_id", request_eng_test_id)
			.input("receipt_vol_No", receipt_vol_No)

			.input("status", "5").query(`
			UPDATE request_eng_test
			SET receipt_vol_No = @receipt_vol_No ,
				receipt_pay_date = GETDATE(),
				status = @status
			OUTPUT INSERTED.* 
			WHERE request_eng_test_id = @request_eng_test_id
		`);
		res.status(200).json({
			message: "บันทึกข้อมูลการชำระเงินเรียบร้อยแล้ว",
			data: {
				...result.recordset[0],
				status_text: statusMap[result.recordset[0].status?.toString()] || null,
				request_date: result.recordset[0].request_date || null,
				advisor_approvals_date: result.recordset[0].advisor_approvals_date || null,
				chairpersons_approvals_date: result.recordset[0].chairpersons_approvals_date || null,
				registrar_approvals_date: result.recordset[0].registrar_approvals_date || null,
				receipt_pay_date: result.recordset[0].receipt_pay_date || null,
			},
		});
	} catch (err) {
		console.error("SQL Error:", err);
		res.status(500).json({ message: "เกิดข้อผิดพลาดในการบันทึกการชำระเงิน" });
	}
});

module.exports = router;
