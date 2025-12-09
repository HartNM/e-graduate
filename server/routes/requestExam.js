const express = require("express");
const router = express.Router();
const authenticateToken = require("../middleware/authenticateToken");
const { sql, poolPromise } = require("../db");
const axios = require("axios");
const BASE_URL = process.env.VITE_API_URL;

const convertToBool = (val) => {
	if (val === null || val === undefined) return null;
	return val === "1" || val === 1 || val === true;
};

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
		const { type } = req.body;
		const pool = await poolPromise;
		const result = await pool.query(`
			SELECT TOP 1 *
			FROM request_exam_info
			WHERE CAST(GETDATE() AS DATE) BETWEEN KQ_open_date AND KQ_close_date
			ORDER BY request_exam_info_id DESC
		`);
		if (result.recordset.length === 0) {
			return res.status(403).json({ status: false, message: `ระบบ${type}ยังไม่เปิด` });
		}
		res.status(200).json({ status: true });
	} catch (err) {
		console.error("checkOpenKQ:", err);
		res.status(500).json({ message: "เกิดข้อผิดพลาด" });
	}
});

router.post("/requestExamAll", authenticateToken, async (req, res) => {
	const { lastRequest, term } = req.body;
	const { user_id, role, employee_id, major_ids } = req.user;

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
			// query += ` WHERE study_group_id IN (SELECT group_no FROM advisorGroup_no WHERE user_id = @user_id) AND term = @term`; //test

			const apiResponse = await axios.post("https://mua.kpru.ac.th/FrontEnd_Tabian/apiforall/FindGroup", {
				ID_TEACHER: user_id,
			});
			const groupNumbers = apiResponse.data.map((item) => item.GROUP_NO);
			if (groupNumbers.length === 0) {
				query += ` WHERE 1=0 AND term = @term`;
			} else {
				const groupListString = groupNumbers.map((group) => `'${group}'`).join(", ");
				query += ` WHERE study_group_id IN (${groupListString}) AND term = @term`; //product
			}
		} else if (role === "chairpersons") {
			// query += ` WHERE major_id IN (SELECT major_id FROM users WHERE user_id = @user_id) AND (status IN (0, 2, 3, 4, 5, 7, 8, 9) OR (status = 6 AND advisor_approvals_id IS NOT NULL AND chairpersons_approvals_id IS NOT NULL)) AND term = @term`; //test

			request.input("major_ids_str", major_ids.join(","));
			query += ` WHERE major_id IN ((SELECT value FROM STRING_SPLIT(@major_ids_str, ','))) AND (status IN (0, 2, 3, 4, 5, 7, 8, 9) OR (status = 6 AND advisor_approvals_id IS NOT NULL AND chairpersons_approvals_id IS NOT NULL)) AND term = @term`; //product
		} else if (role === "officer_registrar") {
			query += ` WHERE (status IN (0, 3, 4, 5, 7, 8, 9) OR (status = 6 AND advisor_approvals_id IS NOT NULL AND chairpersons_approvals_id IS NOT NULL AND registrar_approvals_id IS NOT NULL)) AND term = @term`;
		} else if (role === "officer_major") {
			// query += " WHERE major_id IN (SELECT major_id FROM users WHERE user_id = @user_id) AND term = @term"; //test

			request.input("major_ids_str", major_ids.join(","));
			query += ` WHERE major_id IN ((SELECT value FROM STRING_SPLIT(@major_ids_str, ','))) AND term = @term`; //product
		}
		query += " ORDER BY request_exam_id DESC";
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

						// เช็คว่ามีข้อมูลและ success เป็น 1 หรือไม่ (API ส่งกลับเป็น Array)
						if (Array.isArray(paymentData) && paymentData.length > 0) {
							const payInfo = paymentData[0];

							if (payInfo.success == 1) {
								// A. อัปเดตลงฐานข้อมูล
								const updateQuery = `
                                    UPDATE request_exam 
                                    SET status =@status, 
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
									.input("date", payInfo.payment_create) // วันที่เป็น string เช่น "02/12/2568"
									.input("id", item.request_exam_id)
									.query(updateQuery);

								// B. อัปเดตค่าใน Object item เพื่อส่งกลับไปให้ Frontend เห็นทันที
								item.status = 5;
								item.receipt_vol = payInfo.receipt_book;
								item.receipt_No = payInfo.receipt_no;
								item.receipt_pay_date = payInfo.payment_create;

								// (Optional) ถ้าต้องการเปลี่ยน status เป็น 5 (จ่ายแล้ว) โดยอัตโนมัติ ให้ทำตรงนี้
								// item.status = 5;
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
				let student;
				try {
					const studentRes = await axios.get(`${BASE_URL}/api/student/${item.student_id}`);
					student = studentRes.data;
				} catch (err) {
					console.warn(`ไม่สามารถดึงข้อมูลนักศึกษา ${item.student_id}`);
				}
				return {
					...item,
					...student,
					status_text: statusMap[item.status?.toString()],
					advisor_approvals: item.advisor_approvals === null ? null : item.advisor_approvals === "1",
					chairpersons_approvals: item.chairpersons_approvals === null ? null : item.chairpersons_approvals === "1",
					registrar_approvals: item.registrar_approvals === null ? null : item.registrar_approvals === "1",
				};
			})
		);
		/* console.log(enrichedData); */
		res.status(200).json(enrichedData);
	} catch (err) {
		console.error("requestExamAll:", err);
		res.status(500).json({ message: "เกิดข้อผิดพลาดในการดึงข้อมูลคำร้อง" });
	}
});

router.post("/addRequestExam", authenticateToken, async (req, res) => {
	const { student_id, study_group_id, major_id, major_name, faculty_name, education_level, term } = req.body;
	try {
		const pool = await poolPromise;

		/* const infoRes = await pool.request().query(`SELECT TOP 1 *
			FROM request_exam_info
			WHERE CAST(GETDATE() AS DATE) BETWEEN KQ_open_date AND KQ_close_date
			ORDER BY request_exam_info_id DESC`);
		console.log(infoRes); */

		const requestType = `ขอสอบ${education_level === "ปริญญาโท" ? "ประมวลความรู้" : "วัดคุณสมบัติ"}`;
		const receipt_pay = education_level === "ปริญญาโท" ? 1000 : 1500;
		const result = await pool
			.request()
			.input("student_id", student_id)
			.input("study_group_id", study_group_id)
			.input("major_id", major_id)
			.input("faculty_name", faculty_name)
			.input("request_type", requestType)
			.input("term", term /* infoRes.recordset[0].term */)
			.input("status", "1")
			//receipt_pay
			.input("receipt_pay", receipt_pay).query(`
				INSERT INTO request_exam (
					student_id,
					study_group_id,
					major_id,
					faculty_name,
					request_type,
					term,
					request_date,
					status,
					receipt_pay
				) OUTPUT INSERTED.* VALUES (
					@student_id,
					@study_group_id,
					@major_id,
					@faculty_name,
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
				major_name: major_name,
				status_text: statusMap[result.recordset[0].status?.toString()],
				advisor_approvals: result.recordset[0].advisor_approvals === null ? null : result.recordset[0].advisor_approvals === "1",
				chairpersons_approvals: result.recordset[0].chairpersons_approvals === null ? null : result.recordset[0].chairpersons_approvals === "1",
				registrar_approvals: result.recordset[0].registrar_approvals === null ? null : result.recordset[0].registrar_approvals === "1",
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
				advisor_approvals: result.recordset[0].advisor_approvals === null ? null : result.recordset[0].advisor_approvals === "1",
				chairpersons_approvals: result.recordset[0].chairpersons_approvals === null ? null : result.recordset[0].chairpersons_approvals === "1",
				registrar_approvals: result.recordset[0].registrar_approvals === null ? null : result.recordset[0].registrar_approvals === "1",
			},
		});
	} catch (err) {
		console.error("approveRequestExam:", err);
		res.status(500).json({ message: "เกิดข้อผิดพลาดในการประมวลผลการอนุมัติ" });
	}
});

router.post("/payRequestExam", authenticateToken, async (req, res) => {
	const { request_exam_id, receipt_vol, receipt_No, receipt_pay } = req.body;
	try {
		const pool = await poolPromise;
		const result = await pool
			.request()
			.input("request_exam_id", request_exam_id)
			.input("receipt_vol", receipt_vol)
			.input("receipt_No", receipt_No)
			.input("receipt_pay", receipt_pay)
			.input("status", "5").query(`
			UPDATE request_exam
			SET receipt_vol = @receipt_vol,
				receipt_No = @receipt_No,
				receipt_pay = @receipt_pay,
				receipt_pay_date = GETDATE(),
				status = @status
			OUTPUT INSERTED.*
			WHERE request_exam_id = @request_exam_id
		`);

		res.status(200).json({
			message: "บันทึกข้อมูลการชำระเงินเรียบร้อยแล้ว",
			data: {
				...result.recordset[0],
				status_text: statusMap[result.recordset[0].status?.toString()],
				advisor_approvals: result.recordset[0].advisor_approvals === null ? null : result.recordset[0].advisor_approvals === "1",
				chairpersons_approvals: result.recordset[0].chairpersons_approvals === null ? null : result.recordset[0].chairpersons_approvals === "1",
				registrar_approvals: result.recordset[0].registrar_approvals === null ? null : result.recordset[0].registrar_approvals === "1",
			},
		});
	} catch (err) {
		console.error("SQL Error payRequestExam:", err);
		res.status(500).json({ message: "เกิดข้อผิดพลาดในการบันทึกการชำระเงิน" });
	}
});

module.exports = router;
