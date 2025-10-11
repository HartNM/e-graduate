const express = require("express");
const router = express.Router();
const authenticateToken = require("../middleware/authenticateToken");
const { poolPromise } = require("../db");
const axios = require("axios");

const statusMap = {
	0: "ยกเลิก",
	1: "รออาจารย์ที่ปรึกษาอนุญาต",
	2: "รอประธานกรรมการปะจำสาขาวิชาอนุญาต",
	3: "รอเจ้าหน้าที่ทะเบียนตรวจสอบ",
	4: "รอการชำระค่าธรรมเนียม",
	5: "อนุญาต",
	6: "ไม่อนุญาต",
	7: "ขอยกเลิก",
	8: "ขอยกเลิก",
	9: "ขอยกเลิก",
};

router.post("/checkOpenKQ", authenticateToken, async (req, res) => {
	try {
		const pool = await poolPromise;
		const result = await pool.query(`
			SELECT TOP 1 *
			FROM request_exam_info
			WHERE CAST(GETDATE() AS DATE) BETWEEN KQ_open_date AND KQ_close_date
			ORDER BY request_exam_info_id DESC
		`);
		if (result.recordset.length === 0) {
			return res.status(200).json({ message: "ระบบคำร้องขอสอบประมวลความรู้/สอบวัดคุณสมบัติยังไม่เปิด" });
		}
		res.status(200).json(result.recordset[0]);
	} catch (err) {
		console.error("check_openKQ:", err);
		res.status(500).json({ message: "เกิดข้อผิดพลาด" });
	}
});

router.post("/requestExamAll", authenticateToken, async (req, res) => {
	const { lastRequest, term } = req.body;
	const { user_id, role } = req.user;
	try {
		const pool = await poolPromise;
		const request = pool.request().input("user_id", user_id).input("term", term);
		let query = "SELECT * FROM request_exam";
		if (role === "student") {
			if (lastRequest) {
				query = "SELECT TOP 1 * FROM request_exam";
			}
			query += " WHERE student_id = @user_id";
		} else if (role === "advisor") {
			query += ` WHERE study_group_id IN (SELECT group_no FROM advisorGroup_no WHERE user_id = @user_id) AND term = @term`;
		} else if (role === "chairpersons") {
			query +=
				" WHERE major_id IN (SELECT major_id FROM users WHERE user_id = @user_id) AND (status IN (0, 2, 3, 4, 5, 7, 8, 9) OR (status = 6 AND advisor_approvals_id IS NOT NULL AND chairpersons_approvals_id IS NOT NULL) AND term = @term)";
		} else if (role === "officer_registrar") {
			query +=
				" WHERE (status IN (0, 3, 4, 5, 7, 8, 9) OR (status = 6 AND advisor_approvals_id IS NOT NULL AND chairpersons_approvals_id IS NOT NULL AND registrar_approvals_id IS NOT NULL)) AND term = @term";
		}
		query += " ORDER BY request_exam_id DESC";
		const result = await request.query(query);
		const enrichedData = await Promise.all(
			result.recordset.map(async (item) => {
				let student;
				try {
					const studentRes = await axios.get(`http://localhost:8080/externalApi/student/${item.student_id}`);
					student = studentRes.data;
				} catch (err) {
					console.warn(`ไม่สามารถดึงข้อมูลนักศึกษา ${item.student_id}`);
				}
				return {
					...item,
					...student,
					status_text: statusMap[item.status?.toString()],
				};
			})
		);
		res.status(200).json(enrichedData);
	} catch (err) {
		console.error("requestExamAll:", err);
		res.status(500).json({ message: "เกิดข้อผิดพลาดในการดึงข้อมูลคำร้อง" });
	}
});

router.post("/addRequestExam", authenticateToken, async (req, res) => {
	const { student_id, study_group_id, major_id, major_name, faculty_name, education_level } = req.body;
	try {
		const pool = await poolPromise;

		const infoRes = await pool.request().query(`SELECT TOP 1 *
			FROM request_exam_info
			WHERE CAST(GETDATE() AS DATE) BETWEEN KQ_open_date AND KQ_close_date
			ORDER BY request_exam_info_id DESC`);
		console.log();

		const result = await pool
			.request()
			.input("student_id", student_id)
			.input("study_group_id", study_group_id)
			.input("major_id", major_id)
			.input("faculty_name", faculty_name)
			.input("request_type", `ขอสอบ${education_level === "ปริญญาโท" ? "ประมวลความรู้" : "วัดคุณสมบัติ"}`)
			.input("term", infoRes.recordset[0].term)
			.input("status", "1").query(`
				INSERT INTO request_exam (
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
				)
			`);

		res.status(200).json({
			message: "บันทึกคำร้องขอสอบเรียบร้อยแล้ว",
			data: {
				...result.recordset[0],
				major_name: major_name,
				status_text: statusMap[result.recordset[0].status?.toString()],
			},
		});
	} catch (err) {
		console.error("addRequestExam:", err);
		res.status(500).json({ message: "เกิดข้อผิดพลาดในการบันทึกคำร้องขอสอบ" });
	}
});

router.post("/approveRequestExam", authenticateToken, async (req, res) => {
	const { request_exam_id, selected, comment } = req.body;
	const { role, user_id } = req.user;
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
			UPDATE request_exam
			SET ${roleFields[role]},
				status = @status
				${selected !== "approve" ? ", comment = @comment" : ""}
			OUTPUT INSERTED.*
			WHERE request_exam_id = @request_exam_id
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

router.post("/payRequestExam", authenticateToken, async (req, res) => {
	const { request_exam_id, receipt_vol_No } = req.body;
	try {
		const pool = await poolPromise;
		const result = await pool.request().input("request_exam_id", request_exam_id).input("receipt_vol_No", receipt_vol_No).input("status", "5").query(`
			UPDATE request_exam
			SET receipt_vol_No = @receipt_vol_No ,
				receipt_pay_date = GETDATE(),
				status = @status
			OUTPUT INSERTED.*
			WHERE request_exam_id = @request_exam_id
		`);
		const row = result.recordset[0];
		res.status(200).json({
			message: "บันทึกข้อมูลการชำระเงินเรียบร้อยแล้ว",
			data: {
				...row,
				status_text: statusMap[row.status?.toString()],
			},
		});
	} catch (err) {
		console.error("SQL Error:", err);
		res.status(500).json({ message: "เกิดข้อผิดพลาดในการบันทึกการชำระเงิน" });
	}
});

module.exports = router;
