const express = require("express");
const router = express.Router();
const authenticateToken = require("../middleware/authenticateToken");
const { poolPromise } = require("../db");
const axios = require("axios");
const { getStudentData } = require("../services/studentService");

const dayjs = require("dayjs");
const utc = require("dayjs/plugin/utc");
const timezone = require("dayjs/plugin/timezone");
dayjs.extend(utc);
dayjs.extend(timezone);

const statusMap = {
	1: "รออาจารย์ที่ปรึกษาอนุมัติ",
	2: "รอประธานหลักสูตรอนุมัติ",
	3: "รอเจ้าหน้าที่ทะเบียนตรวจสอบ",
	4: "รอการชำระค่าธรรมเนียม",
	5: "อนุมัติ",
	6: "ไม่อนุมัติ",
};

router.post("/allRequestThesisProposal", authenticateToken, async (req, res) => {
	const { lastRequest, term } = req.body;
	const { user_id, role, major_ids } = req.user;

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
			request.input("major_ids_str", major_ids.join(","));
			query += ` WHERE major_id IN ((SELECT value FROM STRING_SPLIT(@major_ids_str, ','))) AND (status IN (0, 2, 3, 4, 5, 7, 8, 9) OR (status = 6 AND advisor_approvals_id IS NOT NULL AND chairpersons_approvals_id IS NOT NULL)) AND term = @term`; //product
		} else if (role === "officer_registrar") {
			query += ` WHERE (status IN (0, 3, 4, 5, 7, 8, 9) OR (status = 6 AND advisor_approvals_id IS NOT NULL AND chairpersons_approvals_id IS NOT NULL AND registrar_approvals_id IS NOT NULL)) AND term = @term`;
		} else if (role === "officer_major") {
			request.input("major_ids_str", major_ids.join(","));
			query += " WHERE major_id IN ((SELECT value FROM STRING_SPLIT(@major_ids_str, ','))) AND term = @term";
		}
		query += " ORDER BY request_thesis_proposal_id DESC";
		const result = await request.query(query);
		const enrichedData = await Promise.all(
			result.recordset.map(async (item) => {
				//---------------------------------------------------------------receipt--------------------------------------------------------------------------
				if (item.status === "4" && role === "student") {
					try {
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
								await pool.request().input("status", "5").input("vol", payInfo.receipt_book).input("no", payInfo.receipt_no).input("date", dateForSQL).input("id", item.request_exam_id).query(updateQuery);

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
					}
				}
				//---------------------------------------------------------------receipt--------------------------------------------------------------------------
				let studentInfo = null;
				try {
					const data = await getStudentData(item.student_id);
					if (data) {
						studentInfo = data;
					} else {
						console.warn(`ไม่พบข้อมูลนักศึกษา ${item.student_id}`);
						studentInfo = {};
					}
				} catch (err) {
					console.warn(`เกิดข้อผิดพลาดในการดึงข้อมูล ${item.student_id}`);
					studentInfo = {};
				}
				return {
					...item,
					...studentInfo,
					status_text: statusMap[item.status?.toString()],
					advisor_approvals: item.advisor_approvals === null ? null : item.advisor_approvals === "1",
					advisor_approvals_second: item.advisor_approvals_second === null ? null : item.advisor_approvals_second === "1",
					chairpersons_approvals: item.chairpersons_approvals === null ? null : item.chairpersons_approvals === "1",
					registrar_approvals: item.registrar_approvals === null ? null : item.registrar_approvals === "1",
				};
			}),
		);
		res.status(200).json(enrichedData);
	} catch (err) {
		console.error("allRequestThesisProposal:", err);
		res.status(500).json({ message: "เกิดข้อผิดพลาดในการดึงข้อมูลคำร้อง" });
	}
});

router.post("/addRequestThesisProposal", authenticateToken, async (req, res) => {
	const { student_id, study_group_id, major_id, faculty_name, research_name, thesis_advisor_id, thesis_advisor_id_second, request_type, education_level, term } = req.body;
	try {
		const receipt_pay = education_level === "ปริญญาโท" ? 2000 : 5000;

		const pool = await poolPromise;
		const result = await pool
			.request()
			.input("student_id", student_id)
			.input("study_group_id", study_group_id)
			.input("thesis_advisor_id", thesis_advisor_id)
			.input("thesis_advisor_id_second", thesis_advisor_id_second || null)
			.input("major_id", major_id)
			.input("faculty_name", faculty_name)
			.input("research_name", research_name)
			.input("request_type", `ขอสอบโครงร่าง${request_type}`)
			.input("term", term)
			.input("status", "1")
			.input("receipt_pay", receipt_pay).query(`
				INSERT INTO request_thesis_proposal (
					student_id,
					study_group_id,
					thesis_advisor_id,
					thesis_advisor_id_second,
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
					@thesis_advisor_id_second,
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

		const row = result.recordset[0];
		res.status(200).json({
			message: "บันทึกคำร้องขอสอบเรียบร้อยแล้ว",
			data: {
				...row,
				status_text: statusMap[row.status?.toString()],
				advisor_approvals: row.advisor_approvals === null ? null : row.advisor_approvals === "1",
				advisor_approvals_second: row.advisor_approvals_second === null ? null : row.advisor_approvals_second === "1",
				chairpersons_approvals: row.chairpersons_approvals === null ? null : row.chairpersons_approvals === "1",
				registrar_approvals: row.registrar_approvals === null ? null : row.registrar_approvals === "1",
			},
		});
	} catch (err) {
		console.error("addRequestThesisProposal:", err);
		res.status(500).json({ message: "เกิดข้อผิดพลาดในการบันทึกคำร้องขอสอบ" });
	}
});

router.post("/approveRequestThesisProposal", authenticateToken, async (req, res) => {
	const { request_thesis_proposal_id, role, selected, comment } = req.body;
	const { user_id, employee_id } = req.user;

	try {
		const pool = await poolPromise;

		// 1. ดึงข้อมูลปัจจุบันออกมาก่อน เพื่อเช็คว่ามีที่ปรึกษากี่คน และใครอนุมัติไปแล้วบ้าง
		const currentDataResult = await pool.request().input("id", request_thesis_proposal_id).query(`
                SELECT thesis_advisor_id, thesis_advisor_id_second, 
                       advisor_approvals, advisor_approvals_second 
                FROM request_thesis_proposal 
                WHERE request_thesis_proposal_id = @id
            `);

		if (currentDataResult.recordset.length === 0) {
			return res.status(404).json({ message: "ไม่พบข้อมูลคำร้อง" });
		}

		const currentData = currentDataResult.recordset[0];
		let statusValue = "1"; // Default เริ่มต้น
		let updateField = ""; // เก็บว่าจะอัปเดตคอลัมน์ไหน

		// 2. กำหนด Logic ตาม Role
		if (selected === "approve") {
			if (role === "research_advisor") {
				// --- ส่วนจัดการ Logic ที่ปรึกษา 2 คน ---

				let isMainAdvisor = String(currentData.thesis_advisor_id) === String(employee_id);
				let isSecondAdvisor = String(currentData.thesis_advisor_id_second) === String(employee_id);

				// ตรวจสอบว่า User นี้เป็นใครในใบคำร้องนี้
				if (isMainAdvisor) {
					updateField = "advisor_approvals = 1, advisor_approvals_date = GETDATE()";
					// เช็คว่าต้องรอรองหรือไม่ (ถ้าไม่มีรอง หรือ รองอนุมัติแล้ว -> ไปขั้นต่อไปได้)
					const secondAdvisorApproved = !currentData.thesis_advisor_id_second || currentData.advisor_approvals_second === "1";

					if (secondAdvisorApproved) {
						statusValue = "2"; // ไปหาประธาน
					} else {
						statusValue = "1"; // รออีกคน
					}
				} else if (isSecondAdvisor) {
					updateField = "advisor_approvals_second = 1, advisor_approvals_date_second = GETDATE()";
					// เช็คว่าหลักอนุมัติหรือยัง
					const mainAdvisorApproved = currentData.advisor_approvals === "1";

					if (mainAdvisorApproved) {
						statusValue = "2"; // ไปหาประธาน
					} else {
						statusValue = "1"; // รออีกคน
					}
				} else {
					return res.status(403).json({ message: "คุณไม่ใช่ที่ปรึกษาของคำร้องฉบับนี้" });
				}
			} else if (role === "chairpersons") {
				updateField = "chairpersons_approvals = 1, chairpersons_approvals_date = GETDATE()";
				statusValue = "3"; // ไปทะเบียน
			} else if (role === "officer_registrar") {
				updateField = "registrar_approvals = 1, registrar_approvals_date = GETDATE()";
				statusValue = "4"; // ไปการเงิน/จบ
			}
		} else {
			// กรณี "ไม่อนุมัติ" (Reject)
			statusValue = "6";

			// update field ตาม role เพื่อบันทึกว่าใครเป็นคน reject
			if (role === "research_advisor") {
				// เช็คว่าเป็นหลักหรือรอง เพื่อ update ให้ถูกช่อง
				if (String(currentData.thesis_advisor_id) === String(employee_id)) {
					updateField = "advisor_approvals = 0, advisor_approvals_date = GETDATE()";
				} else {
					updateField = "advisor_approvals_second = 0, advisor_approvals_date_second = GETDATE()";
				}
			} else if (role === "chairpersons") {
				updateField = "chairpersons_approvals = 0, chairpersons_approvals_date = GETDATE()";
			} else if (role === "officer_registrar") {
				updateField = "registrar_approvals = 0, registrar_approvals_date = GETDATE()";
			}
		}

		// 3. ทำการ Update
		// สร้าง Query String แบบ Dynamic
		const query = `
            UPDATE request_thesis_proposal
            SET ${updateField},
                status = @status,
                advisor_approvals_id = CASE WHEN @role = 'research_advisor' AND thesis_advisor_id = @employee_id THEN @user_id ELSE advisor_approvals_id END,
                advisor_approvals_id_second = CASE WHEN @role = 'research_advisor' AND thesis_advisor_id_second = @employee_id THEN @user_id ELSE advisor_approvals_id_second END,
                chairpersons_approvals_id = CASE WHEN @role = 'chairpersons' THEN @user_id ELSE chairpersons_approvals_id END,
                registrar_approvals_id = CASE WHEN @role = 'officer_registrar' THEN @user_id ELSE registrar_approvals_id END
                ${selected !== "approve" ? ", comment = @comment" : ""} 
            OUTPUT INSERTED.*
            WHERE request_thesis_proposal_id = @request_thesis_proposal_id
        `;

		const request = pool.request().input("request_thesis_proposal_id", request_thesis_proposal_id).input("status", statusValue).input("user_id", user_id).input("employee_id", employee_id).input("role", role).input("comment", comment);

		const result = await request.query(query);

		res.status(200).json({
			message: "บันทึกผลการอนุมัติคำร้องขอสอบเรียบร้อยแล้ว",
			data: {
				...result.recordset[0],
				status_text: statusMap[result.recordset[0].status?.toString()],
				advisor_approvals: result.recordset[0].advisor_approvals === null ? null : result.recordset[0].advisor_approvals === "1",
				advisor_approvals_second: result.recordset[0].advisor_approvals_second === null ? null : result.recordset[0].advisor_approvals_second === "1",
				chairpersons_approvals: result.recordset[0].chairpersons_approvals === null ? null : result.recordset[0].chairpersons_approvals === "1",
				registrar_approvals: result.recordset[0].registrar_approvals === null ? null : result.recordset[0].registrar_approvals === "1",
			},
		});
	} catch (err) {
		console.error("Error approving request:", err);
		res.status(500).json({ message: "เกิดข้อผิดพลาดในการประมวลผลการอนุมัติ" });
	}
});

/* router.post("/approveRequestThesisProposal", authenticateToken, async (req, res) => {
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
}); */

router.post("/payRequestThesisProposal", authenticateToken, async (req, res) => {
	const { request_thesis_proposal_id, receipt_vol, receipt_No, receipt_pay } = req.body;
	try {
		const pool = await poolPromise;
		const result = await pool.request().input("request_thesis_proposal_id", request_thesis_proposal_id).input("receipt_vol", receipt_vol).input("receipt_No", receipt_No).input("receipt_pay", receipt_pay).input("status", "5").query(`
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
				advisor_approvals_second: result.recordset[0].advisor_approvals_second === null ? null : result.recordset[0].advisor_approvals_second === "1",
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
