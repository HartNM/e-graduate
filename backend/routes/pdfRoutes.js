// backend/routes/pdfRoutes.js

const express = require("express");
const router = express.Router();
const authenticateToken = require("../middleware/authenticateToken");
const { PDFDocument } = require("pdf-lib");
const fontkit = require("@pdf-lib/fontkit");
const { poolPromise, sql } = require("../db");
const { getStudentData } = require("../services/studentService");
const { loadFonts, draw, drawRect, drawCenterXText, formatThaiDate, formatThaiDateShort, fetchPersonDataAndSignature, drawSignature, BASE_URL } = require("../utils/pdfBackendUtils");

/**
 * Helper: แปลงค่า 0/1 จาก Database ให้เป็น Boolean (true/false)
 * หรือคืนค่าเดิมถ้าเป็น Boolean อยู่แล้ว
 */
const toBoolean = (val) => {
	if (typeof val === "boolean") return val;
	if (val === "1" || val === 1) return true;
	if (val === "0" || val === 0) return false;
	return null; // กรณีเป็น null หรือundefined
};

// =========================================================================
// Route: PDF G01 (แบบคำร้องขอสอบประมวลความรู้ / สอบวัดคุณสมบัติ)
// =========================================================================
router.post("/Pdfg01", authenticateToken, async (req, res) => {
	try {
		// 1. รับ ID จาก Frontend
		const { request_exam_id } = req.body;
		const token = req.headers.authorization?.split(" ")[1];
		const pool = await poolPromise;

		// 2. ดึงข้อมูลคำร้องจาก Database
		const requestResult = await pool.request().input("id", sql.Int, request_exam_id).query(`SELECT * FROM [dbRequestSubmission].[dbo].[request_exam] WHERE request_exam_id = @id`);

		if (requestResult.recordset.length === 0) {
			return res.status(404).send("Request not found");
		}
		let reportData = requestResult.recordset[0];

		// 3. ดึงข้อมูลกำหนดการสอบ (วันสอบ) จากตาราง Info
		const examInfoResult = await pool.request().input("term", sql.VarChar, reportData.term).query(`SELECT * FROM [dbRequestSubmission].[dbo].[request_exam_info] WHERE term = @term`);

		let examStartDate = null;
		let examEndDate = null;

		if (examInfoResult.recordset.length > 0) {
			examStartDate = examInfoResult.recordset[0].KQ_exam_date;
			examEndDate = examInfoResult.recordset[0].KQ_exam_end_date;
		}

		// 4. ดึงข้อมูลนักศึกษาจาก External API/Service
		const studentInfo = await getStudentData(reportData.student_id);

		// 5. รวมข้อมูลทั้งหมดเข้าด้วยกัน (Database + Student Info)
		reportData = { ...reportData, ...(studentInfo || {}) };

		// 6. แปลงสถานะการอนุมัติเป็น Boolean
		reportData.advisor_approvals = toBoolean(reportData.advisor_approvals);
		reportData.chairpersons_approvals = toBoolean(reportData.chairpersons_approvals);
		reportData.registrar_approvals = toBoolean(reportData.registrar_approvals);

		// --- เริ่มต้นกระบวนการสร้าง PDF ---
		const pdfDoc = await PDFDocument.create();
		pdfDoc.registerFontkit(fontkit);
		const page = pdfDoc.addPage([595, 842]); // A4 Size

		// โหลดฟอนต์ภาษาไทย
		const { font: THSarabunNewFont, fontBold: THSarabunNewBold } = await loadFonts(pdfDoc);

		// 7. ดึงรูปภาพลายเซ็นและชื่อผู้เซ็น
		if (reportData) reportData.finance_approvals_id = "1629900598264" /* "3630100364381" */; // Fix ID เจ้าหน้าที่การเงิน

		const signatureMapping = {
			advisor: "advisor_approvals_id",
			chairpersons: "chairpersons_approvals_id",
			registrar: "registrar_approvals_id",
			finance: "finance_approvals_id",
		};
		const signatureImages = await fetchPersonDataAndSignature(pdfDoc, reportData, signatureMapping, token);

		// 8. จัดรูปแบบวันที่สำหรับแสดงผล
		const [exam_s_day, exam_s_month, exam_s_year] = formatThaiDate(examStartDate);
		let examDateText = `${exam_s_day} ${exam_s_month} ${exam_s_year}`;

		// Logic การแสดงช่วงวันที่ (ถ้ามีวันสิ้นสุด)
		if (examEndDate && examStartDate?.toString() !== examEndDate?.toString()) {
			const [exam_e_day, exam_e_month, exam_e_year] = formatThaiDate(examEndDate);
			if (exam_s_month === exam_e_month && exam_s_year === exam_e_year) {
				examDateText = `${exam_s_day} - ${exam_e_day} ${exam_s_month} ${exam_s_year}`;
			} else if (exam_s_year === exam_e_year) {
				examDateText = `${exam_s_day} ${exam_s_month} - ${exam_e_day} ${exam_e_month} ${exam_s_year}`;
			} else {
				examDateText = `${exam_s_day} ${exam_s_month} ${exam_s_year} - ${exam_e_day} ${exam_e_month} ${exam_e_year}`;
			}
		}

		// จัดรูปแบบวันที่ต่างๆ ในฟอร์ม
		const [req_d, req_m, req_y] = formatThaiDate(reportData?.request_date);
		const [adv_d, adv_m, adv_y] = formatThaiDateShort(reportData?.advisor_approvals_date);
		const [chair_d, chair_m, chair_y] = formatThaiDateShort(reportData?.chairpersons_approvals_date);
		const [reg_d, reg_m, reg_y] = formatThaiDateShort(reportData?.registrar_approvals_date);
		const [pay_d, pay_m, pay_y] = formatThaiDateShort(reportData?.receipt_pay_date);

		// 9. กำหนดตำแหน่งการวาด (Coordinates)
		let y = 760;
		let space = 20;

		// วาดหัวกระดาษ
		drawCenterXText(page, `คำร้อง${reportData?.request_type}`, 780, THSarabunNewBold, 20);

		// รายการข้อความที่จะวาด
		const drawItems = [
			// ส่วนหัว
			{ text: `มหาวิทยาลัยราชภัฏกำแพงเพชร`, x: 420, y: (y -= space) },
			{ text: `วันที่................เดือน...........................พ.ศ...................`, x: 350, y: (y -= space) },
			{ text: req_d, x: 380, y: y + 2 },
			{ text: req_m, x: 425, y: y + 2 },
			{ text: req_y, x: 510, y: y + 2 },
			{ text: `เรื่อง`, x: 60, y: (y -= space * 2), font: THSarabunNewBold },
			{ text: reportData?.request_type, x: 100, y: y },
			{ text: `เรียน`, x: 60, y: (y -= space), font: THSarabunNewBold },
			{ text: `ประธานคณะกรรมการบัณฑิตศึกษาประจำสาขาวิชา${reportData?.major_name}`, x: 100, y: y },

			// ข้อมูลนักศึกษา
			{ text: `ข้าพเจ้า................................................................................................รหัสประจำตัวนักศึกษา.................................................`, x: 100, y: (y -= space * 2) },
			{ text: reportData?.student_name, x: 180, y: y + 2 },
			{ text: reportData?.student_id, x: 460, y: y + 2 },
			{ text: "ระดับ...........................................หลักสูตร...............................................................................สาขาวิชา....................................................", x: 60, y: (y -= space) },
			{ text: reportData?.education_level, x: 110, y: y + 2 },
			{ text: reportData?.program, x: 230, y: y + 2 },
			{ text: reportData?.major_name, x: 440, y: y + 2 },
			{ text: `คณะ..........................................................................................มีความประสงค์.........................................................................................`, x: 60, y: (y -= space) },
			{ text: reportData?.faculty_name, x: 100, y: y + 2 },
			{ text: `ขอสอบ${reportData?.request_type}`, x: 360, y: y + 2 },
			{ text: `ในภาคเรียนที่ ....................... ในวันที่.....................................................`, x: 60, y: (y -= space) },
			{ text: reportData?.term, x: 130, y: y + 2 },
			{ text: examDateText, x: 210, y: y + 2 },
			{ text: `จึงเรียนมาเพื่อโปรดพิจารณา`, x: 100, y: (y -= space) },

			// ลายเซ็นนักศึกษา
			{ text: `ลงชื่อ...........................................................................`, x: 310, y: (y -= space * 2) },
			{ text: reportData?.student_name, x: 415, y: y + 2, centered: true },
			{ text: `(.........................................................................)`, x: 330, y: (y -= space) },
			{ text: reportData?.student_name, x: 415, y: y + 2, centered: true },
			{ text: `นักศึกษา`, x: 400, y: (y -= space) },
			{ text: `วันที่................/........................../......................`, x: 330, y: (y -= space) },
			{ text: req_d, x: 360, y: y + 2 },
			{ text: req_m, x: 400, y: y + 2 },
			{ text: req_y, x: 465, y: y + 2 },

			// ส่วนที่ 1: อาจารย์ที่ปรึกษา
			{ text: `1. ความเห็นของอาจารย์ที่ปรึกษาหมู่เรียน`, x: 60, y: (y -= space * 2), font: THSarabunNewBold, show: typeof reportData?.advisor_approvals === "boolean" },
			{ text: reportData?.advisor_approvals ? "เห็นควรอนุญาต" : "ไม่อนุญาต", x: 80, y: (y -= space), show: typeof reportData?.advisor_approvals === "boolean" },
			{ text: `เนื่องจาก ${reportData?.comment}`, x: 80, y: (y -= space), show: typeof reportData?.advisor_approvals === "boolean" && !reportData.advisor_approvals },
			{ text: `ลงชื่อ.......................................................................`, x: 75, y: (y -= space * 2), show: typeof reportData?.advisor_approvals === "boolean" },
			{ text: "", x: 175, y: y + 2, show: typeof reportData?.advisor_approvals === "boolean", image: signatureImages.advisor },
			{ text: `(.....................................................................) `, x: 95, y: (y -= space), show: typeof reportData?.advisor_approvals === "boolean" },
			{ text: reportData?.advisor_approvals_name, x: 177, y: y + 2, show: typeof reportData?.advisor_approvals === "boolean", centered: true },
			{ text: `อาจารย์ที่ปรึกษา`, x: 145, y: (y -= space), show: typeof reportData?.advisor_approvals === "boolean" },
			{ text: `วันที่ ........../................./...................`, x: 110, y: (y -= space), show: typeof reportData?.advisor_approvals === "boolean" },
			{ text: adv_d, x: 135, y: y + 2, show: typeof reportData?.advisor_approvals === "boolean" },
			{ text: adv_m, x: 170, y: y + 2, show: typeof reportData?.advisor_approvals === "boolean" },
			{ text: adv_y, x: 210, y: y + 2, show: typeof reportData?.advisor_approvals === "boolean" },

			// ส่วนที่ 2: ประธานกรรมการ
			{ text: `2. ความเห็นประธานกรรมการบัณฑิตศึกษาประจำสาขาวิชา`, x: 310, y: (y += space * 7), font: THSarabunNewBold, show: typeof reportData?.chairpersons_approvals === "boolean" },
			{ text: reportData?.chairpersons_approvals ? "เห็นควรอนุญาต" : "ไม่อนุญาต", x: 330, y: (y -= space), show: typeof reportData?.chairpersons_approvals === "boolean" },
			{ text: `เนื่องจาก ${reportData?.comment}`, x: 330, y: (y -= space), show: typeof reportData?.chairpersons_approvals === "boolean" && !reportData.chairpersons_approvals },
			{ text: `ลงชื่อ.......................................................................`, x: 325, y: (y -= space * 2), show: typeof reportData?.chairpersons_approvals === "boolean" },
			{ text: "", x: 425, y: y + 2, show: typeof reportData?.chairpersons_approvals === "boolean", image: signatureImages.chairpersons },
			{ text: `(.....................................................................) `, x: 345, y: (y -= space), show: typeof reportData?.chairpersons_approvals === "boolean" },
			{ text: reportData?.chairpersons_approvals_name, x: 427, y: y + 2, show: typeof reportData?.chairpersons_approvals === "boolean", centered: true },
			{ text: `ประธานกรรมการบัณฑิตศึกษาประจำสาขาวิชา`, x: 340, y: (y -= space), show: typeof reportData?.chairpersons_approvals === "boolean" },
			{ text: `วันที่ ........../................./...................`, x: 360, y: (y -= space), show: typeof reportData?.chairpersons_approvals === "boolean" },
			{ text: chair_d, x: 385, y: y + 2, show: typeof reportData?.chairpersons_approvals === "boolean" },
			{ text: chair_m, x: 420, y: y + 2, show: typeof reportData?.chairpersons_approvals === "boolean" },
			{ text: chair_y, x: 460, y: y + 2, show: typeof reportData?.chairpersons_approvals === "boolean" },

			// ส่วนที่ 3: นายทะเบียน
			{ text: `3. การตรวจสอบของสำนักส่งเสริมวิชาการและงานทะเบียน`, x: 60, y: (y -= space * 1.5), font: THSarabunNewBold, show: typeof reportData?.registrar_approvals === "boolean" },
			{ text: reportData?.registrar_approvals ? `มีสภาพการเป็นนักศึกษา ภาคเรียนที่ ${reportData?.term}` : `ไม่อนุญาต`, x: 80, y: (y -= space), show: typeof reportData?.registrar_approvals === "boolean" },
			{ text: reportData?.registrar_approvals ? `ลงทะเบียนเรียนครบตามหลักสูตร` : `เนื่องจาก ${reportData?.comment}`, x: 80, y: (y -= space), show: typeof reportData?.registrar_approvals === "boolean" },
			{ text: ``, x: 60, y: (y -= space), show: typeof reportData?.registrar_approvals === "boolean" && reportData?.registrar_approvals },
			{ text: `ลงชื่อ.......................................................................`, x: 75, y: (y -= space), show: typeof reportData?.registrar_approvals === "boolean" },
			{ text: "", x: 175, y: y + 2, show: typeof reportData?.registrar_approvals === "boolean", image: signatureImages.registrar },
			{ text: `(.....................................................................) `, x: 95, y: (y -= space), show: typeof reportData?.registrar_approvals === "boolean" },
			{ text: reportData?.registrar_approvals_name, x: 177, y: y + 2, show: typeof reportData?.registrar_approvals === "boolean", centered: true },
			{ text: `นายทะเบียน`, x: 150, y: (y -= space), show: typeof reportData?.registrar_approvals === "boolean" },
			{ text: `วันที่ ........../................./...................`, x: 110, y: (y -= space), show: typeof reportData?.registrar_approvals === "boolean" },
			{ text: reg_d, x: 135, y: y + 2, show: typeof reportData?.registrar_approvals === "boolean" },
			{ text: reg_m, x: 170, y: y + 2, show: typeof reportData?.registrar_approvals === "boolean" },
			{ text: reg_y, x: 210, y: y + 2, show: typeof reportData?.registrar_approvals === "boolean" },

			// ส่วนที่ 4: การเงิน
			{ text: `4. ชำระค่าธรรมเนียมการสอบแล้ว ภาคเรียนที่ ${reportData?.term}`, x: 310, y: (y += space * 7), font: THSarabunNewBold, show: reportData?.receipt_vol !== null },
			{ text: reportData?.education_level === "ปริญญาโท" ? "ปริญญาโท จำนวน 1,000 บาท (หนึ่งพันบาทถ้วน)" : "ปริญญาเอก จำนวน 1,500 บาท (หนึ่งพันห้าร้อยบาทถ้วน)", x: 330, y: (y -= space), show: reportData?.receipt_vol !== null },
			{ text: `ตามใบเสร็จรับเงิน เล่มที่ ${reportData?.receipt_vol} เลขที่ ${reportData?.receipt_No}`, x: 310, y: (y -= space), show: reportData?.receipt_vol !== null },
			{ text: `ลงชื่อ.......................................................................`, x: 325, y: (y -= space * 2), show: reportData?.receipt_vol !== null },
			{ text: "", x: 425, y: y + 2, show: reportData?.receipt_vol !== null, image: signatureImages.finance },
			{ text: `(.....................................................................) `, x: 345, y: (y -= space), show: reportData?.receipt_vol !== null },
			{ text: reportData?.finance_approvals_name, x: 427, y: y + 2, show: reportData?.receipt_vol !== null, centered: true },
			{ text: `เจ้าหน้าที่การเงิน`, x: 395, y: (y -= space), show: reportData?.receipt_vol !== null },
			{ text: `วันที่ ........../................./...................`, x: 360, y: (y -= space), show: reportData?.receipt_vol !== null },
			{ text: pay_d, x: 385, y: y + 2, show: reportData?.receipt_vol !== null },
			{ text: pay_m, x: 420, y: y + 2, show: reportData?.receipt_vol !== null },
			{ text: pay_y, x: 460, y: y + 2, show: reportData?.receipt_vol !== null },
		];

		// วาด Text และ Image ทั้งหมด
		drawItems
			.filter((item) => item.show !== false)
			.forEach((item) => {
				let drawX = item.x;
				// คำนวณจุดกึ่งกลางสำหรับข้อความ (Centered Text)
				if (item.centered && item.text) {
					const fontToUse = item.font || THSarabunNewFont;
					const sizeToUse = item.size || 14;
					const textWidth = fontToUse.widthOfTextAtSize(item.text, sizeToUse);
					drawX = item.x - textWidth / 2;
				}
				draw(page, item.text, drawX, item.y, item.font, item.size);
				if (item.image) {
					drawSignature(page, item.image, item.x, item.y);
				}
			});

		// วาดกรอบสี่เหลี่ยมเมื่อมีข้อมูล (ตาม Logic เดิม)
		typeof reportData?.advisor_approvals === "boolean" && drawRect(page, 50, y + space * 8, 250, space * 8.5);
		typeof reportData?.chairpersons_approvals === "boolean" && drawRect(page, 300, y + space * 8, 250, space * 8.5);
		typeof reportData?.registrar_approvals === "boolean" && drawRect(page, 50, y - space * 0.5, 250, space * 8.5);
		reportData?.receipt_vol !== null && drawRect(page, 300, y - space * 0.5, 250, space * 8.5);

		// ส่งไฟล์กลับไปยัง Frontend
		const pdfBytes = await pdfDoc.save();
		res.setHeader("Content-Type", "application/pdf");
		res.send(Buffer.from(pdfBytes));
	} catch (error) {
		console.error("Error in Pdfg01:", error);
		res.status(500).send("Error generating PDF G01");
	}
});

// =========================================================================
// Route: PDF G02 (แบบคำร้องขอสอบความรู้ภาษาอังกฤษ)
// =========================================================================
router.post("/Pdfg02", authenticateToken, async (req, res) => {
	try {
		// 1. รับ ID จาก Frontend
		const { request_eng_test_id } = req.body;
		const token = req.headers.authorization?.split(" ")[1];
		const pool = await poolPromise;

		// 2. ดึงข้อมูลคำร้อง
		const requestResult = await pool.request().input("id", sql.Int, request_eng_test_id).query(`SELECT * FROM [dbRequestSubmission].[dbo].[request_eng_test] WHERE request_eng_test_id = @id`);

		if (requestResult.recordset.length === 0) {
			return res.status(404).send("Request not found");
		}
		let reportData = requestResult.recordset[0];

		// 3. ดึงวันสอบภาษาอังกฤษ (ET_exam_date)
		const examInfoResult = await pool.request().input("term", sql.VarChar, reportData.term).query(`SELECT ET_exam_date FROM [dbRequestSubmission].[dbo].[request_exam_info] WHERE term = @term`);

		let englishExamDate = null;
		if (examInfoResult.recordset.length > 0) {
			englishExamDate = examInfoResult.recordset[0].ET_exam_date;
		}

		// 4. ดึงข้อมูลนักศึกษา
		const studentInfo = await getStudentData(reportData.student_id);
		reportData = { ...reportData, ...(studentInfo || {}) };

		// 5. แปลง Boolean
		reportData.advisor_approvals = toBoolean(reportData.advisor_approvals);
		reportData.chairpersons_approvals = toBoolean(reportData.chairpersons_approvals);
		reportData.registrar_approvals = toBoolean(reportData.registrar_approvals);

		// --- สร้าง PDF ---
		const pdfDoc = await PDFDocument.create();
		pdfDoc.registerFontkit(fontkit);
		const page = pdfDoc.addPage([595, 842]);
		const { font: THSarabunNewFont, fontBold: THSarabunNewBold } = await loadFonts(pdfDoc);

		// ดึงลายเซ็น
		if (reportData) reportData.finance_approvals_id = "1629900598264" /* "3630100364381" */;
		const signatureMapping = {
			advisor: "advisor_approvals_id",
			chairpersons: "chairpersons_approvals_id",
			registrar: "registrar_approvals_id",
			finance: "finance_approvals_id",
		};
		const signatureImages = await fetchPersonDataAndSignature(pdfDoc, reportData, signatureMapping, token);

		// Format วันที่
		const [req_d, req_m, req_y] = formatThaiDate(reportData?.request_date);
		const [exam_d, exam_m, exam_y] = formatThaiDate(englishExamDate);
		const [adv_d, adv_m, adv_y] = formatThaiDateShort(reportData?.advisor_approvals_date);
		const [chair_d, chair_m, chair_y] = formatThaiDateShort(reportData?.chairpersons_approvals_date);
		const [reg_d, reg_m, reg_y] = formatThaiDateShort(reportData?.registrar_approvals_date);
		const [pay_d, pay_m, pay_y] = formatThaiDateShort(reportData?.receipt_pay_date);

		let y = 760;
		let space = 20;

		// วาดเนื้อหา
		drawCenterXText(page, `คำร้องขอสอบความรู้ทางภาษาอังกฤษ`, 780, THSarabunNewBold, 20);

		const drawItems = [
			{ text: `มหาวิทยาลัยราชภัฏกำแพงเพชร`, x: 420, y: (y -= space) },
			{ text: `วันที่................เดือน...........................พ.ศ...................`, x: 350, y: (y -= space) },
			{ text: req_d, x: 380, y: y + 2 },
			{ text: req_m, x: 440, y: y + 2 },
			{ text: req_y, x: 510, y: y + 2 },
			{ text: `เรื่อง`, x: 60, y: (y -= space * 2), font: THSarabunNewBold },
			{ text: `ขอสอบความรู้ทางภาษาอังกฤษสำหรับนักศึกษาระดับดุษฎีบัณฑิต`, x: 100, y: y },
			{ text: `เรียน`, x: 60, y: (y -= space), font: THSarabunNewBold },
			{ text: `อธิการบดีมหาวิทยาลัยราชภัฏกำแพงเพชร`, x: 100, y: y },
			{ text: `ข้าพเจ้า................................................................................................รหัสประจำตัวนักศึกษา.................................................`, x: 100, y: (y -= space * 2) },
			{ text: reportData?.student_name, x: 180, y: y + 2 },
			{ text: reportData?.student_id, x: 460, y: y + 2 },
			{ text: "ระดับ...........................................หลักสูตร...............................................................................สาขาวิชา....................................................", x: 60, y: (y -= space) },
			{ text: reportData?.education_level, x: 110, y: y + 2 },
			{ text: reportData?.program, x: 230, y: y + 2 },
			{ text: reportData?.major_name, x: 440, y: y + 2 },
			{ text: `คณะ.................................................................................มีความประสงค์จะขอสอบความรู้ภาษาอังกฤษสำหรับนักศึกษาดุษฎีบัณฑิต`, x: 60, y: (y -= space) },
			{ text: reportData?.faculty_name, x: 100, y: y + 2 },
			{ text: `ในภาคเรียนที่ .........................ในวันที่.....................................................`, x: 60, y: (y -= space) },
			{ text: reportData?.term, x: 130, y: y + 2 },
			{ text: `${exam_d} ${exam_m} ${exam_y}`, x: 210, y: y + 2 },
			{ text: `จึงเรียนมาเพื่อโปรดพิจารณา`, x: 100, y: (y -= space) },

			// ส่วนลายเซ็นนักศึกษา
			{ text: `ลงชื่อ...........................................................................`, x: 310, y: (y -= space * 2) },
			{ text: reportData?.student_name, x: 415, y: y + 2, centered: true },
			{ text: `(.........................................................................)`, x: 330, y: (y -= space) },
			{ text: reportData?.student_name, x: 415, y: y + 2, centered: true },
			{ text: `นักศึกษา`, x: 400, y: (y -= space) },
			{ text: `วันที่................/........................../......................`, x: 330, y: (y -= space) },
			{ text: req_d, x: 360, y: y + 2 },
			{ text: req_m, x: 400, y: y + 2 },
			{ text: req_y, x: 465, y: y + 2 },

			// 1. อาจารย์ที่ปรึกษา
			{ text: `1. ความเห็นของอาจารย์ที่ปรึกษาหมู่เรียน`, x: 60, y: (y -= space * 2), font: THSarabunNewBold, show: typeof reportData?.advisor_approvals === "boolean" },
			{ text: reportData?.advisor_approvals ? "เห็นควรอนุญาต" : "ไม่อนุญาต", x: 80, y: (y -= space), show: typeof reportData?.advisor_approvals === "boolean" },
			{ text: `เนื่องจาก ${reportData?.comment}`, x: 80, y: (y -= space), show: typeof reportData?.advisor_approvals === "boolean" && !reportData.advisor_approvals },
			{ text: `ลงชื่อ.......................................................................`, x: 75, y: (y -= space * 2), show: typeof reportData?.advisor_approvals === "boolean" },
			{ text: "", x: 175, y: y + 2, show: typeof reportData?.advisor_approvals === "boolean", image: signatureImages.advisor },
			{ text: `(.....................................................................) `, x: 95, y: (y -= space), show: typeof reportData?.advisor_approvals === "boolean" },
			{ text: reportData?.advisor_approvals_name, x: 177, y: y + 2, show: typeof reportData?.advisor_approvals === "boolean", centered: true },
			{ text: `อาจารย์ที่ปรึกษา`, x: 145, y: (y -= space), show: typeof reportData?.advisor_approvals === "boolean" },
			{ text: `วันที่ ........../................./...................`, x: 110, y: (y -= space), show: typeof reportData?.advisor_approvals === "boolean" },
			{ text: adv_d, x: 135, y: y + 2, show: typeof reportData?.advisor_approvals === "boolean" },
			{ text: adv_m, x: 170, y: y + 2, show: typeof reportData?.advisor_approvals === "boolean" },
			{ text: adv_y, x: 210, y: y + 2, show: typeof reportData?.advisor_approvals === "boolean" },

			// 2. ประธานกรรมการ
			{ text: `2. ความเห็นประธานกรรมการบัณฑิตศึกษาประจำสาขาวิชา`, x: 310, y: (y += space * 7), font: THSarabunNewBold, show: typeof reportData?.chairpersons_approvals === "boolean" },
			{ text: reportData?.chairpersons_approvals ? "เห็นควรอนุญาต" : "ไม่อนุญาต", x: 330, y: (y -= space), show: typeof reportData?.chairpersons_approvals === "boolean" },
			{ text: `เนื่องจาก ${reportData?.comment}`, x: 330, y: (y -= space), show: typeof reportData?.chairpersons_approvals === "boolean" && !reportData.chairpersons_approvals },
			{ text: `ลงชื่อ.......................................................................`, x: 325, y: (y -= space * 2), show: typeof reportData?.chairpersons_approvals === "boolean" },
			{ text: "", x: 425, y: y + 2, show: typeof reportData?.chairpersons_approvals === "boolean", image: signatureImages.chairpersons },
			{ text: `(.....................................................................) `, x: 345, y: (y -= space), show: typeof reportData?.chairpersons_approvals === "boolean" },
			{ text: reportData?.chairpersons_approvals_name, x: 427, y: y + 2, show: typeof reportData?.chairpersons_approvals === "boolean", centered: true },
			{ text: `ประธานกรรมการบัณฑิตศึกษาประจำสาขาวิชา`, x: 340, y: (y -= space), show: typeof reportData?.chairpersons_approvals === "boolean" },
			{ text: `วันที่ ........../................./...................`, x: 360, y: (y -= space), show: typeof reportData?.chairpersons_approvals === "boolean" },
			{ text: chair_d, x: 385, y: y + 2, show: typeof reportData?.chairpersons_approvals === "boolean" },
			{ text: chair_m, x: 420, y: y + 2, show: typeof reportData?.chairpersons_approvals === "boolean" },
			{ text: chair_y, x: 460, y: y + 2, show: typeof reportData?.chairpersons_approvals === "boolean" },

			// 3. นายทะเบียน
			{ text: `3. การตรวจสอบของสำนักส่งเสริมวิชาการและงานทะเบียน`, x: 60, y: (y -= space * 1.5), font: THSarabunNewBold, show: typeof reportData?.registrar_approvals === "boolean" },
			{ text: reportData?.registrar_approvals ? `มีสภาพการเป็นนักศึกษา ภาคเรียนที่ ${reportData?.term}` : `ไม่อนุญาต`, x: 80, y: (y -= space), show: typeof reportData?.registrar_approvals === "boolean" },
			{ text: reportData?.registrar_approvals ? `ลงทะเบียนเรียนครบตามหลักสูตร` : `เนื่องจาก ${reportData?.comment}`, x: 80, y: (y -= space), show: typeof reportData?.registrar_approvals === "boolean" },
			{ text: ``, x: 60, y: (y -= space), show: typeof reportData?.registrar_approvals === "boolean" && reportData?.registrar_approvals },
			{ text: `ลงชื่อ.......................................................................`, x: 75, y: (y -= space), show: typeof reportData?.registrar_approvals === "boolean" },
			{ text: "", x: 175, y: y + 2, show: typeof reportData?.registrar_approvals === "boolean", image: signatureImages.registrar },
			{ text: `(.....................................................................) `, x: 95, y: (y -= space), show: typeof reportData?.registrar_approvals === "boolean" },
			{ text: reportData?.registrar_approvals_name, x: 177, y: y + 2, show: typeof reportData?.registrar_approvals === "boolean", centered: true },
			{ text: `นายทะเบียน`, x: 150, y: (y -= space), show: typeof reportData?.registrar_approvals === "boolean" },
			{ text: `วันที่ ........../................./...................`, x: 110, y: (y -= space), show: typeof reportData?.registrar_approvals === "boolean" },
			{ text: reg_d, x: 135, y: y + 2, show: typeof reportData?.registrar_approvals === "boolean" },
			{ text: reg_m, x: 170, y: y + 2, show: typeof reportData?.registrar_approvals === "boolean" },
			{ text: reg_y, x: 210, y: y + 2, show: typeof reportData?.registrar_approvals === "boolean" },

			// 4. การเงิน
			{ text: `4. ชำระค่าธรรมเนียมการสอบแล้ว ภาคเรียนที่ ${reportData?.term}`, x: 310, y: (y += space * 7), font: THSarabunNewBold, show: reportData?.receipt_vol !== null },
			{ text: "จำนวน 1,000 บาท (หนึ่งพันบาทถ้วน)", x: 330, y: (y -= space), show: reportData?.receipt_vol !== null },
			{ text: `ตามใบเสร็จรับเงิน เล่มที่ ${reportData?.receipt_vol} เลขที่ ${reportData?.receipt_No}`, x: 310, y: (y -= space), show: reportData?.receipt_vol !== null },
			{ text: `ลงชื่อ.......................................................................`, x: 325, y: (y -= space * 2), show: reportData?.receipt_vol !== null },
			{ text: "", x: 425, y: y + 2, show: reportData?.receipt_vol !== null, image: signatureImages.finance },
			{ text: `(.....................................................................) `, x: 345, y: (y -= space), show: reportData?.receipt_vol !== null },
			{ text: reportData?.finance_approvals_name, x: 427, y: y + 2, show: reportData?.receipt_vol !== null, centered: true },
			{ text: `เจ้าหน้าที่การเงิน`, x: 395, y: (y -= space), show: reportData?.receipt_vol !== null },
			{ text: `วันที่ ........../................./...................`, x: 360, y: (y -= space), show: reportData?.receipt_vol !== null },
			{ text: pay_d, x: 385, y: y + 2, show: reportData?.receipt_vol !== null },
			{ text: pay_m, x: 420, y: y + 2, show: reportData?.receipt_vol !== null },
			{ text: pay_y, x: 460, y: y + 2, show: reportData?.receipt_vol !== null },
		];

		// วาด Loop
		drawItems
			.filter((item) => item.show !== false)
			.forEach((item) => {
				let drawX = item.x;
				if (item.centered && item.text) {
					const fontToUse = item.font || THSarabunNewBold;
					const sizeToUse = item.size || 14;
					const textWidth = fontToUse.widthOfTextAtSize(item.text, sizeToUse);
					drawX = item.x - textWidth / 2;
				}
				draw(page, item.text, drawX, item.y, item.font, item.size);
				if (item.image) drawSignature(page, item.image, item.x, item.y);
			});

		// วาดกรอบ
		typeof reportData?.advisor_approvals === "boolean" && drawRect(page, 50, y + space * 8, 250, space * 8.5);
		typeof reportData?.chairpersons_approvals === "boolean" && drawRect(page, 300, y + space * 8, 250, space * 8.5);
		typeof reportData?.registrar_approvals === "boolean" && drawRect(page, 50, y - space * 0.5, 250, space * 8.5);
		reportData?.receipt_vol !== null && drawRect(page, 300, y - space * 0.5, 250, space * 8.5);

		const pdfBytes = await pdfDoc.save();
		res.setHeader("Content-Type", "application/pdf");
		res.send(Buffer.from(pdfBytes));
	} catch (error) {
		console.error("Error generating PDF G02:", error);
		res.status(500).send("Error generating PDF G02");
	}
});

// =========================================================================
// Route: PDF G03-04 (แบบคำร้องขอสอบโครงร่างฯ และ สอบวิทยานิพนธ์/ค้นคว้าอิสระ)
// =========================================================================
router.post("/Pdfg03-04", authenticateToken, async (req, res) => {
	try {
		// 1. รับ ID (ตรวจสอบว่าเป็นประเภท Proposal หรือ Defense)
		const { request_thesis_proposal_id, request_thesis_defense_id } = req.body;
		const token = req.headers.authorization?.split(" ")[1];
		const pool = await poolPromise;

		let reportData = null;
		let queryType = ""; // ตัวระบุประเภทคำร้องเพื่อใช้คำนวณค่าธรรมเนียม

		// 2. Query ข้อมูลจากตารางที่ถูกต้อง
		if (request_thesis_proposal_id) {
			queryType = "PROPOSAL";
			const requestResult = await pool.request().input("id", sql.Int, request_thesis_proposal_id).query(`SELECT * FROM [dbRequestSubmission].[dbo].[request_thesis_proposal] WHERE request_thesis_proposal_id = @id`);

			if (requestResult.recordset.length > 0) reportData = requestResult.recordset[0];
		} else if (request_thesis_defense_id) {
			queryType = "DEFENSE";
			const requestResult = await pool.request().input("id", sql.Int, request_thesis_defense_id).query(`SELECT * FROM [dbRequestSubmission].[dbo].[request_thesis_defense] WHERE request_thesis_defense_id = @id`);

			if (requestResult.recordset.length > 0) reportData = requestResult.recordset[0];
		}

		if (!reportData) return res.status(404).send("Request not found");

		// 3. ดึงข้อมูลนักศึกษา
		const studentInfo = await getStudentData(reportData.student_id);
		reportData = { ...reportData, ...(studentInfo || {}) };

		// 4. แปลงสถานะเป็น Boolean
		reportData.advisor_approvals = toBoolean(reportData.advisor_approvals);
		reportData.chairpersons_approvals = toBoolean(reportData.chairpersons_approvals);
		reportData.registrar_approvals = toBoolean(reportData.registrar_approvals);

		// --- สร้าง PDF ---
		const pdfDoc = await PDFDocument.create();
		pdfDoc.registerFontkit(fontkit);
		const page = pdfDoc.addPage([595, 842]);
		const { font: THSarabunNewFont, fontBold: THSarabunNewBold } = await loadFonts(pdfDoc);

		// ดึงลายเซ็น
		if (reportData) reportData.finance_approvals_id = "1629900598264" /* "3630100364381" */;
		const signatureMapping = {
			advisor: "advisor_approvals_id",
			chairpersons: "chairpersons_approvals_id",
			registrar: "registrar_approvals_id",
			finance: "finance_approvals_id",
		};
		const signatureImages = await fetchPersonDataAndSignature(pdfDoc, reportData, signatureMapping, token);

		// คำนวณค่าธรรมเนียม
		let fee = reportData.receipt_pay;
		if (!fee) {
			const feeMap = {
				ปริญญาโท: { PROPOSAL: 2000, DEFENSE: 3000 },
				ปริญญาเอก: { PROPOSAL: 5000, DEFENSE: 7000 },
			};
			const level = reportData.education_level || "ปริญญาโท";
			fee = feeMap[level]?.[queryType] || 0;
		}

		// Format วันที่
		const [req_d, req_m, req_y] = formatThaiDate(reportData?.request_date);
		const [exam_d, exam_m, exam_y] = formatThaiDate(reportData?.thesis_exam_date); // วันสอบ
		const [adv_d, adv_m, adv_y] = formatThaiDateShort(reportData?.advisor_approvals_date);
		const [chair_d, chair_m, chair_y] = formatThaiDateShort(reportData?.chairpersons_approvals_date);
		const [reg_d, reg_m, reg_y] = formatThaiDateShort(reportData?.registrar_approvals_date);
		const [pay_d, pay_m, pay_y] = formatThaiDateShort(reportData?.receipt_pay_date);

		let y = 760;
		let space = 20;

		// วาดหัวกระดาษ
		drawCenterXText(page, `คำร้อง${reportData?.request_type}`, 780, THSarabunNewBold, 20);

		const drawItems = [
			{ text: `มหาวิทยาลัยราชภัฏกำแพงเพชร`, x: 420, y: (y -= space) },
			{ text: `วันที่................เดือน...........................พ.ศ...................`, x: 350, y: (y -= space) },
			{ text: req_d, x: 380, y: y + 2 },
			{ text: req_m, x: 440, y: y + 2 },
			{ text: req_y, x: 510, y: y + 2 },
			{ text: `เรื่อง`, x: 60, y: (y -= space * 2), font: THSarabunNewBold },
			{ text: reportData?.request_type, x: 100, y: y },
			{ text: `เรียน`, x: 60, y: (y -= space), font: THSarabunNewBold },
			{ text: `อธิการบดีมหาวิทยาลัยราชภัฏกำแพงเพชร`, x: 100, y: y },
			{ text: `ข้าพเจ้า................................................................................................รหัสประจำตัวนักศึกษา.................................................`, x: 100, y: (y -= space * 2) },
			{ text: reportData?.student_name, x: 180, y: y + 2 },
			{ text: reportData?.student_id, x: 460, y: y + 2 },
			{ text: "ระดับ...........................................หลักสูตร...............................................................................สาขาวิชา....................................................", x: 60, y: (y -= space) },
			{ text: reportData?.education_level, x: 110, y: y + 2 },
			{ text: reportData?.program, x: 230, y: y + 2 },
			{ text: reportData?.major_name, x: 440, y: y + 2 },
			{ text: `คณะ..........................................................................................มีความประสงค์.........................................................................................`, x: 60, y: (y -= space) },
			{ text: reportData?.faculty_name, x: 100, y: y + 2 },
			{ text: `${reportData?.request_type}`, x: 360, y: y + 2 },
			{ text: `ในภาคเรียนที่ ....................... `, x: 60, y: (y -= space) },
			{ text: reportData?.term, x: 130, y: y + 2 },
			{ text: `จึงเรียนมาเพื่อโปรดพิจารณา`, x: 100, y: (y -= space) },

			// ลายเซ็นนักศึกษา
			{ text: `ลงชื่อ...........................................................................`, x: 325, y: (y -= space * 2) },
			{ text: reportData?.student_name, x: 425, y: y + 2, centered: true },
			{ text: `(.........................................................................)`, x: 345, y: (y -= space) },
			{ text: reportData?.student_name, x: 425, y: y + 2, centered: true },
			{ text: `นักศึกษา`, x: 425, y: (y -= space), centered: true },
			{ text: `วันที่................/........................../......................`, x: 330, y: (y -= space) },
			{ text: req_d, x: 360, y: y + 2 },
			{ text: req_m, x: 400, y: y + 2 },
			{ text: req_y, x: 465, y: y + 2 },

			// 1. อาจารย์ที่ปรึกษา
			{ text: `1. ความเห็นของอาจารย์ที่ปรึกษาวิทยานิพนธ์/การค้นคว้าอิสระ`, x: 60, y: (y -= space * 2), font: THSarabunNewBold, show: typeof reportData?.advisor_approvals === "boolean" },
			{ text: reportData?.advisor_approvals ? "เห็นควรสอบได้" : "ไม่เห็นควร", x: 80, y: (y -= space), show: typeof reportData?.advisor_approvals === "boolean" },
			{ text: `เนื่องจาก ${reportData?.comment}`, x: 80, y: (y -= space), show: typeof reportData?.advisor_approvals === "boolean" && !reportData.advisor_approvals },
			{ text: `ลงชื่อ.......................................................................`, x: 75, y: (y -= space * 2), show: typeof reportData?.advisor_approvals === "boolean" },
			{ text: "", x: 175, y: y + 2, show: typeof reportData?.advisor_approvals === "boolean", image: signatureImages.advisor },
			{ text: `(.....................................................................) `, x: 95, y: (y -= space), show: typeof reportData?.advisor_approvals === "boolean" },
			{ text: reportData?.advisor_approvals_name, x: 177, y: y + 2, show: typeof reportData?.advisor_approvals === "boolean", centered: true },
			{ text: `อาจารย์ที่ปรึกษา`, x: 145, y: (y -= space), show: typeof reportData?.advisor_approvals === "boolean" },
			{ text: `วันที่ ........../................./...................`, x: 110, y: (y -= space), show: typeof reportData?.advisor_approvals === "boolean" },
			{ text: adv_d, x: 135, y: y + 2, show: typeof reportData?.advisor_approvals === "boolean" },
			{ text: adv_m, x: 170, y: y + 2, show: typeof reportData?.advisor_approvals === "boolean" },
			{ text: adv_y, x: 210, y: y + 2, show: typeof reportData?.advisor_approvals === "boolean" },

			// 2. ประธานกรรมการ
			{ text: `2. ความเห็นประธานกรรมการบัณฑิตศึกษาประจำสาขาวิชา`, x: 310, y: (y += space * 7), font: THSarabunNewBold, show: typeof reportData?.chairpersons_approvals === "boolean" },
			{ text: reportData?.chairpersons_approvals ? "เห็นควรสอบได้" : "ไม่เห็นควร", x: 330, y: (y -= space), show: typeof reportData?.chairpersons_approvals === "boolean" },
			{ text: `เนื่องจาก ${reportData?.comment}`, x: 330, y: (y -= space), show: typeof reportData?.chairpersons_approvals === "boolean" && !reportData.chairpersons_approvals },
			{ text: `ลงชื่อ.......................................................................`, x: 325, y: (y -= space * 2), show: typeof reportData?.chairpersons_approvals === "boolean" },
			{ text: "", x: 425, y: y + 2, show: typeof reportData?.chairpersons_approvals === "boolean", image: signatureImages.chairpersons },
			{ text: `(.....................................................................) `, x: 345, y: (y -= space), show: typeof reportData?.chairpersons_approvals === "boolean" },
			{ text: reportData?.chairpersons_approvals_name, x: 427, y: y + 2, show: typeof reportData?.chairpersons_approvals === "boolean", centered: true },
			{ text: `ประธานกรรมการบัณฑิตศึกษาประจำสาขาวิชา`, x: 340, y: (y -= space), show: typeof reportData?.chairpersons_approvals === "boolean" },
			{ text: `วันที่ ........../................./...................`, x: 360, y: (y -= space), show: typeof reportData?.chairpersons_approvals === "boolean" },
			{ text: chair_d, x: 385, y: y + 2, show: typeof reportData?.chairpersons_approvals === "boolean" },
			{ text: chair_m, x: 420, y: y + 2, show: typeof reportData?.chairpersons_approvals === "boolean" },
			{ text: chair_y, x: 460, y: y + 2, show: typeof reportData?.chairpersons_approvals === "boolean" },

			// 3. นายทะเบียน
			{ text: `3. การตรวจสอบของสำนักส่งเสริมวิชาการและงานทะเบียน`, x: 60, y: (y -= space * 1.5), font: THSarabunNewBold, show: typeof reportData?.registrar_approvals === "boolean" },
			{ text: reportData?.registrar_approvals ? `มีสภาพการเป็นนักศึกษา ภาคเรียนที่ ${reportData?.term}` : `ไม่เห็นควร`, x: 80, y: (y -= space), show: typeof reportData?.registrar_approvals === "boolean" },
			{ text: reportData?.registrar_approvals ? `ลงทะเบียนเรียนครบตามหลักสูตร` : `เนื่องจาก ${reportData?.comment}`, x: 80, y: (y -= space), show: typeof reportData?.registrar_approvals === "boolean" },
			{ text: `ให้ชำระค่าธรรมเนียมที่ฝ่ายการเงิน`, x: 60, y: (y -= space), show: typeof reportData?.registrar_approvals === "boolean" && reportData?.registrar_approvals },
			{ text: `ลงชื่อ.......................................................................`, x: 75, y: (y -= space), show: typeof reportData?.registrar_approvals === "boolean" },
			{ text: "", x: 175, y: y + 2, show: typeof reportData?.registrar_approvals === "boolean", image: signatureImages.registrar },
			{ text: `(.....................................................................) `, x: 95, y: (y -= space), show: typeof reportData?.registrar_approvals === "boolean" },
			{ text: reportData?.registrar_approvals_name, x: 177, y: y + 2, show: typeof reportData?.registrar_approvals === "boolean", centered: true },
			{ text: `นายทะเบียน`, x: 150, y: (y -= space), show: typeof reportData?.registrar_approvals === "boolean" },
			{ text: `วันที่ ........../................./...................`, x: 110, y: (y -= space), show: typeof reportData?.registrar_approvals === "boolean" },
			{ text: reg_d, x: 135, y: y + 2, show: typeof reportData?.registrar_approvals === "boolean" },
			{ text: reg_m, x: 170, y: y + 2, show: typeof reportData?.registrar_approvals === "boolean" },
			{ text: reg_y, x: 210, y: y + 2, show: typeof reportData?.registrar_approvals === "boolean" },

			// 4. การเงิน
			{ text: `4. ชำระค่าธรรมเนียมการสอบแล้ว ภาคเรียนที่ ${reportData?.term}`, x: 310, y: (y += space * 7), font: THSarabunNewBold, show: reportData?.receipt_vol !== null },
			{ text: `จำนวน ${Number(fee).toLocaleString()} บาท `, x: 330, y: (y -= space), show: reportData?.receipt_vol !== null },
			{ text: `ตามใบเสร็จรับเงิน เล่มที่ ${reportData?.receipt_vol} เลขที่ ${reportData?.receipt_No}`, x: 310, y: (y -= space), show: reportData?.receipt_vol !== null },
			{ text: `ลงชื่อ.......................................................................`, x: 325, y: (y -= space * 2), show: reportData?.receipt_vol !== null },
			{ text: "", x: 425, y: y + 2, show: reportData?.receipt_vol !== null, image: signatureImages.finance },
			{ text: `(.....................................................................) `, x: 345, y: (y -= space), show: reportData?.receipt_vol !== null },
			{ text: reportData?.finance_approvals_name, x: 427, y: y + 2, show: reportData?.receipt_vol !== null, centered: true },
			{ text: `เจ้าหน้าที่การเงิน`, x: 395, y: (y -= space), show: reportData?.receipt_vol !== null },
			{ text: `วันที่ ........../................./...................`, x: 360, y: (y -= space), show: reportData?.receipt_vol !== null },
			{ text: pay_d, x: 385, y: y + 2, show: reportData?.receipt_vol !== null },
			{ text: pay_m, x: 420, y: y + 2, show: reportData?.receipt_vol !== null },
			{ text: pay_y, x: 460, y: y + 2, show: reportData?.receipt_vol !== null },
		];

		// Loop วาด
		drawItems
			.filter((item) => item.show !== false)
			.forEach((item) => {
				let drawX = item.x;
				if (item.centered && item.text) {
					const fontToUse = item.font || THSarabunNewBold;
					const sizeToUse = item.size || 14;
					const textWidth = fontToUse.widthOfTextAtSize(item.text, sizeToUse);
					drawX = item.x - textWidth / 2;
				}
				draw(page, item.text, drawX, item.y, item.font, item.size);
				if (item.image) drawSignature(page, item.image, item.x, item.y);
			});

		// วาดกรอบ (ใช้ boolean check ตามเดิม)
		typeof reportData?.advisor_approvals === "boolean" && drawRect(page, 50, y + space * 8, 250, space * 8.5);
		typeof reportData?.chairpersons_approvals === "boolean" && drawRect(page, 300, y + space * 8, 250, space * 8.5);
		typeof reportData?.registrar_approvals === "boolean" && drawRect(page, 50, y - space * 0.5, 250, space * 8.5);
		reportData?.receipt_vol !== null && drawRect(page, 300, y - space * 0.5, 250, space * 8.5);

		const pdfBytes = await pdfDoc.save();
		res.setHeader("Content-Type", "application/pdf");
		res.send(Buffer.from(pdfBytes));
	} catch (error) {
		console.error("Error generating PDF G03-4:", error);
		res.status(500).send("Error generating PDF G03-4");
	}
});

// =========================================================================
// Route: PDF G07 (แบบคำร้องขอยกเลิกการสอบ / Cancel Exam)
// =========================================================================
router.post("/Pdfg07", authenticateToken, async (req, res) => {
	try {
		const { request_cancel_exam_id } = req.body;
		const token = req.headers.authorization?.split(" ")[1];
		const pool = await poolPromise;

		// 1. ดึงข้อมูล "การขอยกเลิก" (Cancel Request)
		const cancelRequestResult = await pool.request().input("id", sql.Int, request_cancel_exam_id).query(`SELECT * FROM [dbRequestSubmission].[dbo].[request_exam_cancel] WHERE request_cancel_exam_id = @id`);

		if (cancelRequestResult.recordset.length === 0) return res.status(404).send("Cancel Request not found");
		let cancelData = cancelRequestResult.recordset[0];

		// 2. ดึงข้อมูล "คำร้องเดิม" (Original Exam Request)
		const originalExamResult = await pool.request().input("exam_id", sql.Int, cancelData.request_exam_id).query(`SELECT * FROM [dbRequestSubmission].[dbo].[request_exam] WHERE request_exam_id = @exam_id`);

		if (originalExamResult.recordset.length === 0) return res.status(404).send("Original Exam Request not found");
		const originalExamData = originalExamResult.recordset[0];

		// 3. รวมข้อมูล (Cancel + Original Exam)
		let mergedData = {
			...originalExamData, // ข้อมูลพื้นฐานจากคำร้องเดิม
			...cancelData, // ข้อมูลการยกเลิก (ทับค่าที่ซ้ำกัน)
			original_request_type: originalExamData.request_type, // ชื่อคำร้องเดิม
			cancel_request_type: cancelData.request_type, // ชื่อคำร้องยกเลิก
		};

		// 4. ดึงข้อมูลนักศึกษา
		const studentInfo = await getStudentData(mergedData.student_id);
		mergedData = { ...mergedData, ...(studentInfo || {}) };

		// 5. แปลง Boolean
		mergedData.advisor_approvals = toBoolean(mergedData.advisor_approvals);
		mergedData.chairpersons_approvals = toBoolean(mergedData.chairpersons_approvals);
		mergedData.dean_approvals = toBoolean(mergedData.dean_approvals);

		// --- สร้าง PDF ---
		const pdfDoc = await PDFDocument.create();
		pdfDoc.registerFontkit(fontkit);
		const page = pdfDoc.addPage([595, 842]);
		const { font: THSarabunNewFont, fontBold: THSarabunNewBold } = await loadFonts(pdfDoc);

		// ดึงลายเซ็น
		const signatureMapping = {
			advisor: "advisor_approvals_id",
			chairpersons: "chairpersons_approvals_id",
			dean: "dean_approvals_id",
		};
		const signatureImages = await fetchPersonDataAndSignature(pdfDoc, mergedData, signatureMapping, token);

		// Format วันที่
		const [req_d, req_m, req_y] = formatThaiDate(mergedData?.request_date);
		const [adv_d, adv_m, adv_y] = formatThaiDateShort(mergedData?.advisor_approvals_date);
		const [chair_d, chair_m, chair_y] = formatThaiDateShort(mergedData?.chairpersons_approvals_date);
		const [dean_d, dean_m, dean_y] = formatThaiDateShort(mergedData?.dean_approvals_date);

		let y = 760;
		let space = 20;

		// หัวกระดาษ
		drawCenterXText(page, `คำร้อง${mergedData?.cancel_request_type || "ขอยกเลิกการสอบ"}`, 780, THSarabunNewBold, 20);

		const drawItems = [
			{ text: `มหาวิทยาลัยราชภัฏกำแพงเพชร`, x: 420, y: (y -= space) },
			{ text: `วันที่................เดือน...........................พ.ศ...................`, x: 350, y: (y -= space) },
			{ text: req_d, x: 380, y: y + 2 },
			{ text: req_m, x: 440, y: y + 2 },
			{ text: req_y, x: 510, y: y + 2 },
			{ text: `เรื่อง`, x: 60, y: (y -= space * 2), font: THSarabunNewBold },
			{ text: mergedData?.cancel_request_type, x: 100, y: y },
			{ text: `เรียน`, x: 60, y: (y -= space), font: THSarabunNewBold },
			{ text: `คณบดี${mergedData?.faculty_name || "..........................."}`, x: 100, y: y },
			{ text: `ข้าพเจ้า................................................................................................รหัสประจำตัวนักศึกษา.................................................`, x: 100, y: (y -= space * 2) },
			{ text: mergedData?.student_name, x: 180, y: y + 2 },
			{ text: mergedData?.student_id, x: 460, y: y + 2 },
			{ text: "ระดับ...........................................หลักสูตร...............................................................................สาขาวิชา....................................................", x: 60, y: (y -= space) },
			{ text: mergedData?.education_level, x: 110, y: y + 2 },
			{ text: mergedData?.program, x: 230, y: y + 2 },
			{ text: mergedData?.major_name, x: 440, y: y + 2 },
			{ text: `คณะ..........................................................................................มีความประสงค์.........................................................................................`, x: 60, y: (y -= space) },
			{ text: mergedData?.faculty_name, x: 100, y: y + 2 },
			{ text: `ขอยกเลิกการสอบ${mergedData?.original_request_type}`, x: 360, y: y + 2 },
			{ text: `ในภาคเรียนที่ ....................... `, x: 60, y: (y -= space) },
			{ text: mergedData?.term, x: 130, y: y + 2 },
			{ text: "เนื่องจาก.....................................................................................................................................................................................................", x: 60, y: (y -= space) },
			{ text: mergedData?.reason || "", x: 110, y: y + 2 },
			{ text: `จึงเรียนมาเพื่อโปรดพิจารณา`, x: 100, y: (y -= space) },

			// ลายเซ็นนักศึกษา
			{ text: `ลงชื่อ...........................................................................`, x: 325, y: (y -= space * 2) },
			{ text: mergedData?.student_name, x: 425, y: y + 2, centered: true },
			{ text: `(.........................................................................)`, x: 345, y: (y -= space) },
			{ text: mergedData?.student_name, x: 425, y: y + 2, centered: true },
			{ text: `นักศึกษา`, x: 425, y: (y -= space), centered: true },
			{ text: `วันที่................/........................../......................`, x: 330, y: (y -= space) },
			{ text: req_d, x: 360, y: y + 2 },
			{ text: req_m, x: 400, y: y + 2 },
			{ text: req_y, x: 465, y: y + 2 },

			// 1. อาจารย์ที่ปรึกษา
			{ text: `1. ความเห็นของอาจารย์ที่ปรึกษาหมู่เรียน`, x: 60, y: (y -= space * 2), font: THSarabunNewBold, show: typeof mergedData?.advisor_approvals === "boolean" },
			{ text: mergedData?.advisor_approvals ? "เห็นควรอนุญาต" : "ไม่อนุญาต", x: 80, y: (y -= space), show: typeof mergedData?.advisor_approvals === "boolean" },
			{ text: `เนื่องจาก ${mergedData?.comment}`, x: 80, y: (y -= space), show: typeof mergedData?.advisor_approvals === "boolean" && !mergedData.advisor_approvals },
			{ text: `ลงชื่อ.......................................................................`, x: 75, y: (y -= space * 2), show: typeof mergedData?.advisor_approvals === "boolean" },
			{ text: "", x: 175, y: y + 2, show: typeof mergedData?.advisor_approvals === "boolean", image: signatureImages.advisor },
			{ text: `(.....................................................................) `, x: 95, y: (y -= space), show: typeof mergedData?.advisor_approvals === "boolean" },
			{ text: mergedData?.advisor_approvals_name, x: 175, y: y + 2, show: typeof mergedData?.advisor_approvals === "boolean", centered: true },
			{ text: `อาจารย์ที่ปรึกษา`, x: 145, y: (y -= space), show: typeof mergedData?.advisor_approvals === "boolean" },
			{ text: `วันที่ ........../................./...................`, x: 110, y: (y -= space), show: typeof mergedData?.advisor_approvals === "boolean" },
			{ text: adv_d, x: 135, y: y + 2, show: typeof mergedData?.advisor_approvals === "boolean" },
			{ text: adv_m, x: 170, y: y + 2, show: typeof mergedData?.advisor_approvals === "boolean" },
			{ text: adv_y, x: 210, y: y + 2, show: typeof mergedData?.advisor_approvals === "boolean" },

			// 2. ประธานกรรมการ
			{ text: `2. ความเห็นประธานกรรมการบัณฑิตศึกษาประจำสาขาวิชา`, x: 310, y: (y += space * 7), font: THSarabunNewBold, show: typeof mergedData?.chairpersons_approvals === "boolean" },
			{ text: mergedData?.chairpersons_approvals ? "เห็นควรอนุญาต" : "ไม่อนุญาต", x: 330, y: (y -= space), show: typeof mergedData?.chairpersons_approvals === "boolean" },
			{ text: `เนื่องจาก ${mergedData?.comment}`, x: 330, y: (y -= space), show: typeof mergedData?.chairpersons_approvals === "boolean" && !mergedData.chairpersons_approvals },
			{ text: `ลงชื่อ.......................................................................`, x: 325, y: (y -= space * 2), show: typeof mergedData?.chairpersons_approvals === "boolean" },
			{ text: "", x: 425, y: y + 2, show: typeof mergedData?.chairpersons_approvals === "boolean", image: signatureImages.chairpersons },
			{ text: `(.....................................................................) `, x: 345, y: (y -= space), show: typeof mergedData?.chairpersons_approvals === "boolean" },
			{ text: mergedData?.chairpersons_approvals_name, x: 425, y: y + 2, show: typeof mergedData?.chairpersons_approvals === "boolean", centered: true },
			{ text: `ประธานกรรมการบัณฑิตศึกษาประจำสาขาวิชา`, x: 340, y: (y -= space), show: typeof mergedData?.chairpersons_approvals === "boolean" },
			{ text: `วันที่ ........../................./...................`, x: 360, y: (y -= space), show: typeof mergedData?.chairpersons_approvals === "boolean" },
			{ text: chair_d, x: 385, y: y + 2, show: typeof mergedData?.chairpersons_approvals === "boolean" },
			{ text: chair_m, x: 420, y: y + 2, show: typeof mergedData?.chairpersons_approvals === "boolean" },
			{ text: chair_y, x: 460, y: y + 2, show: typeof mergedData?.chairpersons_approvals === "boolean" },

			// 3. คณบดี (Dean)
			{ text: `3. ความเห็นคณบดี${mergedData?.faculty_name}`, x: 185, y: (y -= space * 1.5), font: THSarabunNewBold, show: typeof mergedData?.dean_approvals === "boolean" },
			{ text: mergedData?.dean_approvals ? "อนุญาต" : "ไม่อนุญาต", x: 205, y: (y -= space), show: typeof mergedData?.dean_approvals === "boolean" },
			{ text: `เนื่องจาก ${mergedData?.comment}`, x: 250, y: (y -= space), show: typeof mergedData?.dean_approvals === "boolean" && !mergedData.dean_approvals },
			{ text: `ลงชื่อ.......................................................................`, x: 200, y: (y -= space * 2), show: typeof mergedData?.dean_approvals === "boolean" },
			{ text: "", x: 300, y: y + 2, show: typeof mergedData?.dean_approvals === "boolean", image: signatureImages.dean },
			{ text: `(.....................................................................) `, x: 220, y: (y -= space), show: typeof mergedData?.dean_approvals === "boolean" },
			{ text: mergedData?.dean_approvals_name, x: 300, y: y + 2, show: typeof mergedData?.dean_approvals === "boolean", centered: true },
			{ text: `คณบดี${mergedData?.faculty_name}`, x: 260, y: (y -= space), show: typeof mergedData?.dean_approvals === "boolean" },
			{ text: `วันที่ ........../................./...................`, x: 235, y: (y -= space), show: typeof mergedData?.dean_approvals === "boolean" },
			{ text: dean_d, x: 260, y: y + 2, show: typeof mergedData?.dean_approvals === "boolean" },
			{ text: dean_m, x: 295, y: y + 2, show: typeof mergedData?.dean_approvals === "boolean" },
			{ text: dean_y, x: 335, y: y + 2, show: typeof mergedData?.dean_approvals === "boolean" },
		];

		// Loop วาด
		drawItems
			.filter((item) => item.show !== false)
			.forEach((item) => {
				let drawX = item.x;
				if (item.centered && item.text) {
					const fontToUse = item.font || THSarabunNewBold;
					const sizeToUse = item.size || 14;
					const textWidth = fontToUse.widthOfTextAtSize(item.text, sizeToUse);
					drawX = item.x - textWidth / 2;
				}
				draw(page, item.text, drawX, item.y, item.font, item.size);
				if (item.image) drawSignature(page, item.image, item.x, item.y);
			});

		// วาดกรอบสี่เหลี่ยมเมื่อมีข้อมูล
		typeof mergedData?.advisor_approvals === "boolean" && drawRect(page, 50, y + space * 8, 250, space * 8.5);
		typeof mergedData?.chairpersons_approvals === "boolean" && drawRect(page, 300, y + space * 8, 250, space * 8.5);
		typeof mergedData?.dean_approvals === "boolean" && drawRect(page, 50, y - space * 0.5, 500, space * 8.5);

		const pdfBytes = await pdfDoc.save();
		res.setHeader("Content-Type", "application/pdf");
		res.send(Buffer.from(pdfBytes));
	} catch (error) {
		console.error("Error generating PDF Cancel Exam:", error);
		res.status(500).send("Error generating PDF Cancel Exam");
	}
});

module.exports = router;
