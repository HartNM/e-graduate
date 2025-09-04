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
	/* 7: "รออาจารย์ที่ปรึกษาอนุมัติ",
	8: "รอประธานหลักสูตรอนุมัติ",
	9: "รอคณบดีอนุมัติ", */
};

const formatDate = (date) => {
	if (!date) return null;
	return new Date(date).toISOString().split("T")[0];
};

router.post("/allRequestThesisDefense", authenticateToken, async (req, res) => {
	const { role, id, lastRequest } = req.body;

	try {
		const pool = await poolPromise;
		const request = pool.request().input("id", id);
		let query = "SELECT * FROM request_thesis_defense";
		if (role === "student") {
			if (lastRequest) {
				query = "SELECT TOP 1 * FROM request_thesis_defense";
			}
			query += " WHERE student_id = @id";
		} else if (role === "advisor") {
			query += " WHERE study_group_id IN (SELECT value FROM STRING_SPLIT(@id, ','))";
		} else if (role === "chairpersons") {
			query += " WHERE major_name = @id AND (status IN (0, 2, 3, 4, 5, 7, 8, 9) OR (status = 6 AND advisor_approvals_id IS NOT NULL AND chairpersons_approvals_id IS NOT NULL))";
		} else if (role === "officer_registrar") {
			query += " WHERE (status IN (0, 3, 4, 5, 7, 8, 9) OR (status = 6 AND advisor_approvals_id IS NOT NULL AND chairpersons_approvals_id IS NOT NULL AND registrar_approvals_id IS NOT NULL))";
		}
		query += " ORDER BY request_thesis_defense_id DESC";
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
					request_date: formatDate(item.request_date) || null,
					advisor_approvals_date: formatDate(item.advisor_approvals_date) || null,
					chairpersons_approvals_date: formatDate(item.chairpersons_approvals_date) || null,
					registrar_approvals_date: formatDate(item.registrar_approvals_date) || null,
					receipt_pay_date: formatDate(item.receipt_pay_date) || null,
					status_text: statusMap[item.status?.toString()] || null,
					request_type: item.request_type || null,
				};
			})
		);
		res.status(200).json(enrichedData);
	} catch (err) {
		console.error("requestExamAll:", err);
		res.status(500).json({ message: "เกิดข้อผิดพลาดในการดึงข้อมูลคำร้อง" });
	}
});

router.post("/addRequestThesisDefense", authenticateToken, async (req, res) => {
	const { student_id, study_group_id, major_name, faculty_name, education_level } = req.body;
	try {
		const pool = await poolPromise;
		const infoRes = await pool.request().query(`SELECT TOP 1 term FROM request_exam_info ORDER BY request_exam_info_id DESC`);
		const result = await pool
			.request()
			.input("student_id", student_id)
			.input("study_group_id", study_group_id)
			.input("major_name", major_name)
			.input("faculty_name", faculty_name)
			.input("request_type", `ขอลงทะเบียนสอบ${education_level === "ปริญญาโท" ? "วิทยานิพนธ์" : "การค้นคว้าอิสระ"}`)
			.input("term", infoRes.recordset[0].term)
			.input("request_date", formatThaiBuddhistDate())
			.input("status", "1").query(`
				INSERT INTO request_thesis_defense (
					student_id,
					study_group_id,
					major_name,
					faculty_name,
					request_type,
					term,
					request_date,
					status
				) OUTPUT INSERTED.* VALUES (
					@student_id,
					@study_group_id,
					@major_name,
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
				status_text: statusMap[result.recordset[0].status?.toString()] || null,
				request_date: formatDate(result.recordset[0].request_date) || null,
				advisor_approvals_date: formatDate(result.recordset[0].advisor_approvals_date) || null,
				chairpersons_approvals_date: formatDate(result.recordset[0].chairpersons_approvals_date) || null,
				registrar_approvals_date: formatDate(result.recordset[0].registrar_approvals_date) || null,
				receipt_pay_date: formatDate(result.recordset[0].receipt_pay_date) || null,
			},
		});
	} catch (err) {
		console.error("addRequestExam:", err);
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
			.input("date", formatThaiBuddhistDate())
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
				status_text: statusMap[result.recordset[0].status?.toString()] || null,
				request_date: formatDate(result.recordset[0].request_date) || null,
				advisor_approvals_date: formatDate(result.recordset[0].advisor_approvals_date) || null,
				chairpersons_approvals_date: formatDate(result.recordset[0].chairpersons_approvals_date) || null,
				registrar_approvals_date: formatDate(result.recordset[0].registrar_approvals_date) || null,
				receipt_pay_date: formatDate(result.recordset[0].receipt_pay_date) || null,
			},
		});
	} catch (err) {
		console.error("Error approving request:", err);
		res.status(500).json({ message: "เกิดข้อผิดพลาดในการประมวลผลการอนุมัติ" });
	}
});

router.post("/payRequestThesisDefense", authenticateToken, async (req, res) => {
	const { request_thesis_defense_id, receipt_vol_No } = req.body;
	try {
		const pool = await poolPromise;
		const result = await pool.request().input("request_thesis_defense_id", request_thesis_defense_id).input("receipt_vol_No", receipt_vol_No).input("receipt_pay_date", formatThaiBuddhistDate()).input("status", "5")
			.query(`
			UPDATE request_thesis_defense
			SET receipt_vol_No = @receipt_vol_No ,
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
				status_text: statusMap[row.status?.toString()] || null,
				request_date: formatDate(row.request_date),
				advisor_approvals_date: formatDate(row.advisor_approvals_date),
				chairpersons_approvals_date: formatDate(row.chairpersons_approvals_date),
				registrar_approvals_date: formatDate(row.registrar_approvals_date),
				receipt_pay_date: formatDate(row.receipt_pay_date),
			},
		});
	} catch (err) {
		console.error("SQL Error:", err);
		res.status(500).json({ message: "เกิดข้อผิดพลาดในการบันทึกการชำระเงิน" });
	}
});

module.exports = router;
