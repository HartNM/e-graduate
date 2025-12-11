const express = require("express");
const router = express.Router();
const authenticateToken = require("../middleware/authenticateToken");
const { poolPromise } = require("../db");
const axios = require("axios");
const BASE_URL = process.env.VITE_API_URL;

const dayjs = require("dayjs");
const utc = require("dayjs/plugin/utc");
const timezone = require("dayjs/plugin/timezone");
dayjs.extend(utc);
dayjs.extend(timezone);

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

/* router.post("/getAdvisors", authenticateToken, async (req, res) => {
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
}); */

router.post("/allRequestThesisProposal", authenticateToken, async (req, res) => {
	const { lastRequest, term } = req.body;
	const { user_id, role, employee_id, major_ids } = req.user;
	console.log(lastRequest, user_id, role);

	try {
		const pool = await poolPromise;
		const request = pool.request().input("user_id", user_id).input("term", term);
		let query = "SELECT * FROM request_thesis_proposal";
		if (role === "student") {
			if (lastRequest) query = "SELECT TOP 1 * FROM request_thesis_proposal";
			query += " WHERE student_id = @user_id";
		} else if (role === "advisor") {
			query += " WHERE thesis_advisor_id = @user_id AND term = @term";
		} else if (role === "chairpersons") {
			// query += ` WHERE major_id IN (SELECT major_id FROM users WHERE user_id = @user_id) AND (status IN (0, 2, 3, 4, 5, 7, 8, 9) OR (status = 6 AND advisor_approvals_id IS NOT NULL AND chairpersons_approvals_id IS NOT NULL)) AND term = @term`; //test

			request.input("major_ids_str", major_ids.join(","));
			query += ` WHERE major_id IN ((SELECT value FROM STRING_SPLIT(@major_ids_str, ','))) AND (status IN (0, 2, 3, 4, 5, 7, 8, 9) OR (status = 6 AND advisor_approvals_id IS NOT NULL AND chairpersons_approvals_id IS NOT NULL)) AND term = @term`; //product
		} else if (role === "officer_registrar") {
			query += ` WHERE (status IN (0, 3, 4, 5, 7, 8, 9) OR (status = 6 AND advisor_approvals_id IS NOT NULL AND chairpersons_approvals_id IS NOT NULL AND registrar_approvals_id IS NOT NULL)) AND term = @term`;
		} else if (role === "officer_major") {
			// query += " WHERE major_id IN (SELECT major_id FROM users WHERE user_id = @user_id) AND term = @term"; //test

			request.input("major_ids_str", major_ids.join(","));
			query += " WHERE major_id IN ((SELECT value FROM STRING_SPLIT(@major_ids_str, ','))) AND term = @term"; //product
		}
		query += " ORDER BY request_thesis_proposal_id DESC";
		const result = await request.query(query);
		const enrichedData = await Promise.all(
			result.recordset.map(async (item) => {
				//---------------------------------------------------------------receipt--------------------------------------------------------------------------
				if (item.status === "4") {
					try {
						// เรียก API e-payment
						const paymentUrl = `https://e-payment.kpru.ac.th/pay/api/showlistcustomer/${item.student_id}/81914`;
						const paymentRes = await axios.get(paymentUrl);
						const paymentData = paymentRes.data;

						if (Array.isArray(paymentData) && paymentData.length > 0) {
							const payInfo = paymentData[0];
							if (payInfo.success == 1) {
								let dateForSQL = null;
								if (payInfo.payment_create) {
									const [day, month, thaiYear] = payInfo.payment_create.split("/");
									const engYear = parseInt(thaiYear) - 543;
									dateForSQL = `${engYear}-${month}-${day} 00:00:00`;
								}

								const updateQuery = `
									UPDATE request_thesis_proposal 
									SET status = @status, 
										receipt_vol = @vol, 
										receipt_No = @no, 
										receipt_pay_date = @date 
									WHERE request_exam_id = @id
								`;
								await pool
									.request()
									.input("status", "5")
									.input("vol", payInfo.receipt_book)
									.input("no", payInfo.receipt_no)
									.input("date", dateForSQL)
									.input("id", item.request_exam_id)
									.query(updateQuery);

								item.status = 5;
								item.receipt_vol = payInfo.receipt_book;
								item.receipt_No = payInfo.receipt_no;
								item.receipt_pay_date = dateForSQL;
							} else {
								console.log("ไม่มีข้อมูล ", item.student_id);
							}
						}
					} catch (err) {
						console.error(`Error checking payment for student ${item.student_id}:`, err.message);
						// ไม่ throw error เพื่อให้ Loop ทำงานต่อได้กับ item อื่นๆ
					}
				}
				//---------------------------------------------------------------receipt--------------------------------------------------------------------------
				let studentInfo = null;
				try {
					const studentRes = await axios.get(`${BASE_URL}/api/student/${item.student_id}`);
					studentInfo = studentRes.data;
				} catch (err) {
					console.warn(`ไม่สามารถดึงข้อมูลนักศึกษา ${item.student_id}`);
				}
				return {
					...item,
					...studentInfo,
					status_text: statusMap[item.status?.toString()],
					advisor_approvals: item.advisor_approvals === null ? null : item.advisor_approvals === "1",
					chairpersons_approvals: item.chairpersons_approvals === null ? null : item.chairpersons_approvals === "1",
					registrar_approvals: item.registrar_approvals === null ? null : item.registrar_approvals === "1",
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
	const { student_id, study_group_id, major_id, faculty_name, research_name, thesis_advisor_id, thesis_exam_date, request_type, education_level } = req.body;
	try {
		const pool = await poolPromise;
		const infoRes = await pool.request().query(`SELECT TOP 1 *
			FROM request_exam_info
			WHERE CAST(GETDATE() AS DATE) BETWEEN term_open_date AND term_close_date
			ORDER BY request_exam_info_id DESC`);
		const receipt_pay = education_level === "ปริญญาโท" ? 2000 : 5000;
		const result = await pool
			.request()
			.input("student_id", student_id)
			.input("study_group_id", study_group_id)
			.input("thesis_advisor_id", thesis_advisor_id)
			.input("major_id", major_id)
			.input("faculty_name", faculty_name)
			.input("research_name", research_name)
			.input("request_type", `ขอสอบโครงร่าง${request_type}`)
			.input("term", infoRes.recordset[0].term)
			.input("status", "1")
			//receipt_pay
			.input("receipt_pay", receipt_pay).query(`
				INSERT INTO request_thesis_proposal (
					student_id,
					study_group_id,
					thesis_advisor_id,
					major_id,
					faculty_name,
					research_name,
					request_type,
					term,
					request_date,
					status,
					receipt_pay
				) OUTPUT INSERTED.* VALUES (
					@student_id,
					@study_group_id,
					@thesis_advisor_id,
					@major_id,
					@faculty_name,
					@research_name,
					@request_type,
					@term,
					GETDATE(),
					@status,
					@receipt_pay
				)
			`);

		res.status(200).json({
			message: "บันทึกคำร้องขอสอบเรียบร้อยแล้ว",
			data: {
				...result.recordset[0],
				status_text: statusMap[result.recordset[0].status?.toString()],
				advisor_approvals: result.recordset[0].advisor_approvals === null ? null : result.recordset[0].advisor_approvals === "1",
				chairpersons_approvals: result.recordset[0].chairpersons_approvals === null ? null : result.recordset[0].chairpersons_approvals === "1",
				registrar_approvals: result.recordset[0].registrar_approvals === null ? null : result.recordset[0].registrar_approvals === "1",
			},
		});
	} catch (err) {
		console.error("addRequestThesisProposal:", err);
		res.status(500).json({ message: "เกิดข้อผิดพลาดในการบันทึกคำร้องขอสอบ" });
	}
});

router.post("/approveRequestThesisProposal", authenticateToken, async (req, res) => {
	const { request_thesis_proposal_id, role, selected, comment } = req.body;
	const { user_id } = req.user;
	try {
		let statusValue = "";
		if (selected === "approve") {
			if (role === "research_advisor") {
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
			research_advisor: `
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
				advisor_approvals: result.recordset[0].advisor_approvals === null ? null : result.recordset[0].advisor_approvals === "1",
				chairpersons_approvals: result.recordset[0].chairpersons_approvals === null ? null : result.recordset[0].chairpersons_approvals === "1",
				registrar_approvals: result.recordset[0].registrar_approvals === null ? null : result.recordset[0].registrar_approvals === "1",
			},
		});
	} catch (err) {
		console.error("Error approving request:", err);
		res.status(500).json({ message: "เกิดข้อผิดพลาดในการประมวลผลการอนุมัติ" });
	}
});

router.post("/payRequestThesisProposal", authenticateToken, async (req, res) => {
	const { request_thesis_proposal_id, receipt_vol, receipt_No, receipt_pay } = req.body;
	try {
		const pool = await poolPromise;
		const result = await pool
			.request()
			.input("request_thesis_proposal_id", request_thesis_proposal_id)
			.input("receipt_vol", receipt_vol)
			.input("receipt_No", receipt_No)
			.input("receipt_pay", receipt_pay)
			.input("status", "5").query(`
			UPDATE request_thesis_proposal
			SET receipt_vol = @receipt_vol ,
				receipt_No = @receipt_No ,
				receipt_pay = @receipt_pay ,
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
				advisor_approvals: result.recordset[0].advisor_approvals === null ? null : result.recordset[0].advisor_approvals === "1",
				chairpersons_approvals: result.recordset[0].chairpersons_approvals === null ? null : result.recordset[0].chairpersons_approvals === "1",
				registrar_approvals: result.recordset[0].registrar_approvals === null ? null : result.recordset[0].registrar_approvals === "1",
			},
		});
	} catch (err) {
		console.error("SQL Error:", err);
		res.status(500).json({ message: "เกิดข้อผิดพลาดในการบันทึกการชำระเงิน" });
	}
});

module.exports = router;
