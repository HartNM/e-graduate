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
	1: "รออาจารย์ที่ปรึกษาอนุญาต",
	2: "รอประธานกรรมการปะจำสาขาวิชาอนุญาต",
	4: "รอการชำระค่าธรรมเนียม",
	5: "อนุญาต",
	6: "ไม่อนุญาต",
};

router.post("/allRequestGraduation", authenticateToken, async (req, res) => {
	const { lastRequest } = req.body;
	const { user_id, role } = req.user;
	try {
		const pool = await poolPromise;
		const request = pool.request().input("user_id", user_id);
		let query = "SELECT * FROM request_graduation";
		if (role === "student") {
			if (lastRequest) {
				query = "SELECT TOP 1 * FROM request_graduation";
			}
			query += " WHERE student_id = @user_id";
		} else if (role === "advisor") {
			query += ` WHERE study_group_id IN (SELECT group_no FROM advisorGroup_no WHERE user_id = @user_id)`;
		} else if (role === "chairpersons") {
			query +=
				" WHERE major_id IN (SELECT major_id FROM users WHERE user_id = @user_id) AND (status IN (0, 2, 3, 4, 5, 7, 8, 9) OR (status = 6 AND advisor_approvals_id IS NOT NULL AND chairpersons_approvals_id IS NOT NULL))";
		}
		query += " ORDER BY request_graduation_id DESC";
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
					request_date: item.request_date,
					advisor_approvals_date: item.advisor_approvals_date,
					chairpersons_approvals_date: item.chairpersons_approvals_date,
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

router.post("/addRequestGraduation", authenticateToken, async (req, res) => {
	const {
		student_id,
		study_group_id,
		major_id,
		major_name,
		faculty_name,
		bachelor_major,
		bachelor_university,
		master_major,
		master_university,
		contact_house_no,
		contact_moo,
		contact_road,
		contact_subdistrict,
		contact_district,
		contact_province,
		contact_zipcode,
		contact_phone,
		work_name,
		work_moo,
		work_road,
		work_subdistrict,
		work_district,
		work_province,
		work_zipcode,
		work_phone,
		work_department,
	} = req.body;

	try {
		const pool = await poolPromise;
		const infoRes = await pool.request().query(`SELECT TOP 1 *
			FROM request_exam_info
			WHERE CAST(GETDATE() AS DATE) BETWEEN term_open_date AND term_close_date
			ORDER BY request_exam_info_id DESC`);

		console.log(infoRes);

		const insertData = {
			student_id,
			study_group_id,
			major_id,
			faculty_name,
			request_type: "ขอสำเร็จการศึกษาระดับบัณฑิตศึกษา",
			term: infoRes.recordset[0].term,
			request_date: formatDateForDB(),
			status: "1",
			bachelor_major,
			bachelor_university,
			master_major,
			master_university,
			contact_house_no,
			contact_moo,
			contact_road,
			contact_subdistrict,
			contact_district,
			contact_province,
			contact_zipcode,
			contact_phone,
			work_name,
			work_moo,
			work_road,
			work_subdistrict,
			work_district,
			work_province,
			work_zipcode,
			work_phone,
			work_department,
		};

		let requestBuilder = pool.request();
		for (const [key, value] of Object.entries(insertData)) {
			requestBuilder = requestBuilder.input(key, value);
		}

		const result = await requestBuilder.query(`
			INSERT INTO request_graduation (${Object.keys(insertData).join(", ")})
			OUTPUT INSERTED.*
			VALUES (${Object.keys(insertData)
				.map((k) => `@${k}`)
				.join(", ")})
		`);

		res.status(200).json({
			message: "บันทึกคำร้องขอสอบเรียบร้อยแล้ว",
			data: {
				...result.recordset[0],
				major_name,
				status_text: statusMap[result.recordset[0].status?.toString()],
				request_date: result.recordset[0].request_date,
				advisor_approvals_date: result.recordset[0].advisor_approvals_date,
				chairpersons_approvals_date: result.recordset[0].chairpersons_approvals_date,
				receipt_pay_date: result.recordset[0].receipt_pay_date,
			},
		});
	} catch (err) {
		console.error("addRequestExam:", err);
		res.status(500).json({ message: "เกิดข้อผิดพลาดในการบันทึกคำร้องขอสอบ" });
	}
});

router.post("/approveRequestGraduation", authenticateToken, async (req, res) => {
	const { request_graduation_id, name, selected, comment } = req.body;
	const { role } = req.user;
	if (!["advisor", "chairpersons"].includes(role)) {
		return res.status(400).json({ message: "สิทธิ์ในการเข้าถึงไม่ถูกต้อง" });
	}
	try {
		let statusValue = "";
		if (selected === "approve") {
			if (role === "advisor") {
				statusValue = "2";
			} else if (role === "chairpersons") {
				statusValue = "4";
			}
		} else {
			statusValue = "6";
		}
		const pool = await poolPromise;
		const request = pool
			.request()
			.input("request_graduation_id", request_graduation_id)
			.input("status", statusValue)
			.input("user_id", name)
			.input("approve", selected === "approve" ? 1 : 0)
			.input("date", formatDateForDB())
			.input("comment", comment);
		const roleFields = {
			advisor: `
				advisor_approvals_id = @user_id,
				advisor_approvals = @approve,
				advisor_approvals_date = @date
			`,
			chairpersons: `
				chairpersons_approvals_id = @user_id,
				chairpersons_approvals = @approve,
				chairpersons_approvals_date = @date
			`,
		};
		const query = `
			UPDATE request_graduation
			SET ${roleFields[role]},
				status = @status
				${selected !== "approve" ? ", comment = @comment" : ""}
			OUTPUT INSERTED.*
			WHERE request_graduation_id = @request_graduation_id
			`;
		const result = await request.query(query);
		res.status(200).json({
			message: "บันทึกผลการอนุมัติคำร้องขอสอบเรียบร้อยแล้ว",
			data: {
				...result.recordset[0],
				status_text: statusMap[result.recordset[0].status?.toString()],
				request_date: result.recordset[0].request_date,
				advisor_approvals_date: result.recordset[0].advisor_approvals_date,
				chairpersons_approvals_date: result.recordset[0].chairpersons_approvals_date,
				receipt_pay_date: result.recordset[0].receipt_pay_date,
			},
		});
	} catch (err) {
		console.error("Error approving request:", err);
		res.status(500).json({ message: "เกิดข้อผิดพลาดในการประมวลผลการอนุมัติ" });
	}
});

router.post("/payRequestGraduation", authenticateToken, async (req, res) => {
	const { request_graduation_id, receipt_vol_No } = req.body;
	try {
		const pool = await poolPromise;
		const result = await pool.request().input("request_graduation_id", request_graduation_id).input("receipt_vol_No", receipt_vol_No).input("receipt_pay_date", formatDateForDB()).input("status", "5")
			.query(`
			UPDATE request_graduation
			SET receipt_vol_No = @receipt_vol_No ,
				receipt_pay_date = @receipt_pay_date,
				status = @status
			OUTPUT INSERTED.*
			WHERE request_graduation_id = @request_graduation_id
		`);
		const row = result.recordset[0];
		res.status(200).json({
			message: "บันทึกข้อมูลการชำระเงินเรียบร้อยแล้ว",
			data: {
				...row,
				status_text: statusMap[row.status?.toString()],
				request_date: row.request_date,
				advisor_approvals_date: row.advisor_approvals_date,
				chairpersons_approvals_date: row.chairpersons_approvals_date,
				receipt_pay_date: row.receipt_pay_date,
			},
		});
	} catch (err) {
		console.error("SQL Error:", err);
		res.status(500).json({ message: "เกิดข้อผิดพลาดในการบันทึกการชำระเงิน" });
	}
});

module.exports = router;
