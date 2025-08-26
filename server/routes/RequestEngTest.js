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

router.post("/payRequestEngTest", authenticateToken, async (req, res) => {
	const { request_eng_test_id, receipt_vol_No } = req.body;
	try {
		const pool = await poolPromise;
		await pool.request().input("request_eng_test_id", request_eng_test_id).input("receipt_vol_No", receipt_vol_No).input("receipt_pay_date", formatThaiBuddhistDate()).input("status", "5").query(`
			UPDATE request_eng_test
			SET receipt_vol_No = @receipt_vol_No ,
				receipt_pay_date = @receipt_pay_date,
				status = @status
			WHERE request_eng_test_id = @request_eng_test_id
		`);
		res.status(200).json({ message: "บันทึกข้อมูลการชำระเงินเรียบร้อยแล้ว" });
	} catch (err) {
		console.error("SQL Error:", err);
		res.status(500).json({ message: "เกิดข้อผิดพลาดในการบันทึกการชำระเงิน" });
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
			.input("date", formatThaiBuddhistDate())
			.input("comment", comment);
		// สร้าง query ตาม role
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
			UPDATE request_eng_test
			SET ${roleFields[role]},
				status = @status
				${selected !== "approve" ? ", comment = @comment" : ""}
			WHERE request_eng_test_id = @request_eng_test_id
		`;
		await request.query(query);
		res.status(200).json({ message: "บันทึกผลการอนุมัติคำร้องขอสอบเรียบร้อยแล้ว" });
	} catch (err) {
		console.error("Error approving request:", err);
		res.status(500).json({ message: "เกิดข้อผิดพลาดในการประมวลผลการอนุมัติ" });
	}
});

router.post("/allRequestEngTest", authenticateToken, async (req, res) => {
	const { role, id } = req.body;
	console.log(role, id);

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

	try {
		const pool = await poolPromise;
		const request = pool.request().input("id", id);

		// สร้าง query พื้นฐาน
		let query = "SELECT * FROM request_eng_test";

		// กำหนดเงื่อนไข WHERE ตาม role
		if (role === "student") {
			query += " WHERE student_id = @id";
		} else if (role === "advisor") {
			// เฉพาะคำร้องที่ถึง advisor 1 2 3 4 5 6 7 8 9 0 AND status IN >= 1
			query += " WHERE study_group_id = @id ORDER BY CASE WHEN status IN (1, 7) THEN 0 WHEN status = 0 THEN 2 ELSE 1 END, status";
		} else if (role === "chairpersons") {
			// เฉพาะคำร้องที่ถึง chairpersons 2 3 4 5 6   8 9 0 >= 2
			query += " WHERE major_name = @id AND status IN (2, 3, 4, 5, 6, 8, 9, 0) ORDER BY CASE WHEN status IN (2, 8) THEN 0 WHEN status = 0 THEN 2 ELSE 1 END, status";
		} else if (role === "dean") {
			// เฉพาะคำร้องที่ถึง dean 9 0
			query += " WHERE faculty_name = @id AND status IN (9, 0) ORDER BY CASE WHEN status = 9 THEN 0 WHEN status = 0 THEN 2 ELSE 1 END, status";
		} else if (role === "officer_registrar") {
			// เฉพาะคำร้องที่ถึงเจ้าหน้าที่ทะเบียน 3 4 5 6 >= 3
			query += " WHERE status IN (3, 4, 5, 6) ORDER BY CASE WHEN status = 3 THEN 0 ELSE 1 END, status";
		}

		const result = await request.query(query);

		// ดึงข้อมูลนักศึกษาและประมวลผล
		const enrichedData = await Promise.all(
			result.recordset.map(async (item) => {
				let studentInfo = null;
				let cancelInfo = [];

				try {
					const studentRes = await axios.get(`http://localhost:8080/externalApi/student/${item.student_id}`);
					studentInfo = studentRes.data;
				} catch (err) {
					console.warn(`ไม่สามารถดึงข้อมูลนักศึกษา ${item.student_id}`);
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
					request_type: item.status > 6 ? `ขอยกเลิกการเข้าสอบ${studentInfo?.request_type}` : item.request_type || null,
				};
			})
		);

		res.status(200).json(enrichedData);
	} catch (err) {
		console.error("requestExamAll:", err);
		res.status(500).json({ message: "เกิดข้อผิดพลาดในการดึงข้อมูลคำร้อง" });
	}
}); /*  */

router.post("/addRequestEngTest", authenticateToken, async (req, res) => {
	const { student_id, study_group_id, major_name, faculty_name, request_type } = req.body;
	/* console.log(student_id, study_group_id, major_name, faculty_name ,`ขอสอบ${request_type}`); */

	try {
		const pool = await poolPromise;
		const infoRes = await pool.request().query(`SELECT TOP 1 term FROM request_exam_info ORDER BY request_exam_info_id DESC`);

		await pool
			.request()
			.input("student_id", student_id)
			.input("study_group_id", study_group_id)
			.input("major_name", major_name)
			.input("faculty_name", faculty_name)
			.input("request_type", `ขอทดสอบความรู้ทางภาษาอังกฤษ`)
			.input("term", infoRes.recordset[0].term)
			.input("request_exam_date", formatThaiBuddhistDate())
			.input("status", "1").query(`
			INSERT INTO request_eng_test (
				student_id,
				study_group_id,
				major_name,
				faculty_name,
				term,
				request_exam_date,
				status
			) VALUES (
				@student_id,
				@study_group_id,
				@major_name,
				@faculty_name,
				@term,
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
