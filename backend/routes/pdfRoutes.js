const express = require("express");
const router = express.Router();
const { poolPromise } = require("../db");
const { getStudentData } = require("../services/studentService"); // ใช้ service เดิมที่มี
const authenticateToken = require("../middleware/authenticateToken");
const { PDFDocument, rgb } = require("pdf-lib");
const fontkit = require("@pdf-lib/fontkit");
const fs = require("fs");
const path = require("path");
const axios = require("axios");
const dayjs = require("dayjs");
const utc = require("dayjs/plugin/utc");
const timezone = require("dayjs/plugin/timezone");

dayjs.extend(utc);
dayjs.extend(timezone);

// --- 1. Helper Functions (ย้ายมาจาก PdfUtils.js) ---

// แปลงวันที่ไทย
function formatThaiDate(dateStr) {
	if (!dateStr) return ["", "", ""];
	const months = ["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"];
	const d = dayjs.utc(dateStr).tz("Asia/Bangkok");
	return [d.date(), months[d.month()], d.year() + 543];
}

function formatThaiDateShort(dateStr) {
	if (!dateStr) return ["", "", ""];
	const monthsShort = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
	const d = dayjs.utc(dateStr).tz("Asia/Bangkok");
	return [d.date(), monthsShort[d.month()], (d.year() + 543) % 100];
}

// ฟังก์ชันวาดข้อความ
const draw = (page, text, x, y, font, size = 14) => {
	if (text) page.drawText(String(text), { x, y, size, font });
};

// ฟังก์ชันวาดข้อความกึ่งกลาง
const drawCenterXText = (page, text, y, font, size = 14) => {
	if (text) {
		const textWidth = font.widthOfTextAtSize(String(text), size);
		const pageWidth = page.getWidth();
		const x = (pageWidth - textWidth) / 2;
		page.drawText(String(text), { x, y, size, font });
	}
};

const drawRect = (page, x, y, w, h) => {
	page.drawRectangle({
		x,
		y,
		width: w,
		height: h,
		borderWidth: 1,
		borderColor: rgb(0, 0, 0),
	});
};

// ฟังก์ชันวาดข้อความ โดยให้ x เป็นจุดกึ่งกลาง (Center)
const drawCentered = (page, text, centerX, y, font, size = 14) => {
	if (!text) return;
	const textWidth = font.widthOfTextAtSize(String(text), size);
	const drawX = centerX - textWidth / 2;
	page.drawText(String(text), { x: drawX, y, size, font });
};

// ฟังก์ชันดึงชื่อบุคลากร (สำหรับแปลง ID เป็นชื่อ)
async function fetchPersonName(id) {
	try {
		const response = await axios.get(`https://mis.kpru.ac.th/api/TabianAPI/${id}`);
		const data = response.data;
		if (data?.AjDetail && data.AjDetail.length > 0) {
			const info = data.AjDetail[0];
			return `${info.prename_full_tha}${info.first_name_tha} ${info.last_name_tha}`;
		}
		return "";
	} catch (e) {
		console.error(`Error fetching name for ${id}:`, e.message);
		return "";
	}
}

// --- 2. Main Route ---

router.post("/generate-report", authenticateToken, async (req, res) => {
	const { request_exam_id, term } = req.body;

	try {
		// A. ดึงข้อมูล Request จาก DB
		const pool = await poolPromise;
		const requestResult = await pool.request().input("id", request_exam_id).query("SELECT * FROM request_exam WHERE request_exam_id = @id");

		if (requestResult.recordset.length === 0) {
			return res.status(404).json({ message: "ไม่พบข้อมูลคำร้อง" });
		}
		const requestData = requestResult.recordset[0];

		// B. ดึงข้อมูลนักศึกษา
		const studentData = await getStudentData(requestData.student_id);

		// C. ดึงข้อมูลวันสอบ (KQ)
		let examDateText = "";
		try {
			const kqResult = await pool.query(`
                SELECT TOP 1 * FROM request_exam_info 
                WHERE term = '${requestData.term || term}' 
                ORDER BY request_exam_info_id DESC
            `);
			if (kqResult.recordset.length > 0) {
				const kq = kqResult.recordset[0];
				const [s_d, s_m, s_y] = formatThaiDate(kq.KQ_exam_date);
				examDateText = `${s_d} ${s_m} ${s_y}`;
				// Logic รวมวันที่ (Start - End) แบบย่อ
				if (kq.KQ_exam_end_date && kq.KQ_exam_date !== kq.KQ_exam_end_date) {
					const [e_d, e_m, e_y] = formatThaiDate(kq.KQ_exam_end_date);
					if (s_m === e_m && s_y === e_y) examDateText = `${s_d} - ${e_d} ${s_m} ${s_y}`;
					else if (s_y === e_y) examDateText = `${s_d} ${s_m} - ${e_d} ${e_m} ${s_y}`;
					else examDateText = `${s_d} ${s_m} ${s_y} - ${e_d} ${e_m} ${e_y}`;
				}
			}
		} catch (e) {
			console.warn("KQ Info Error:", e.message);
		}

		// D. เตรียมข้อมูลชื่อผู้เซ็น (ดึงชื่ออาจารย์/จนท. จาก API)
		const approvers = {
			advisor: { id: requestData.advisor_approvals_id, name: "" },
			chairpersons: { id: requestData.chairpersons_approvals_id, name: "" },
			registrar: { id: requestData.registrar_approvals_id, name: "" },
			finance: { id: 1629900598264, name: "" }, // Mock ID ตามโค้ดเดิม
		};

		// Parallel Fetch ชื่อ
		await Promise.all(
			Object.keys(approvers).map(async (key) => {
				if (approvers[key].id) {
					approvers[key].name = await fetchPersonName(approvers[key].id);
				}
			})
		);

		// E. เริ่มสร้าง PDF
		const pdfDoc = await PDFDocument.create();
		pdfDoc.registerFontkit(fontkit);

		// โหลดฟอนต์ (ปรับ Path ให้ตรงกับเครื่อง Server)
		const fontPathRegular = path.join(__dirname, "../assets/fonts/THSarabunNew.ttf");
		const fontPathBold = path.join(__dirname, "../assets/fonts/THSarabunNew Bold.ttf");

		const fontRegularBytes = fs.readFileSync(fontPathRegular);
		const fontBoldBytes = fs.readFileSync(fontPathBold);

		const fontRegular = await pdfDoc.embedFont(fontRegularBytes);
		const fontBold = await pdfDoc.embedFont(fontBoldBytes);

		const page = pdfDoc.addPage([595, 842]); // A4

		// F. ดึงและฝังลายเซ็น (Server-Side)
		const signatures = {};
		for (const [role, info] of Object.entries(approvers)) {
			if (!info.id) continue;
			try {
				// ยิง API ภายในเพื่อดึงรูป (หรือยิงตรงไป e-par ถ้า Server ออกเน็ตได้)
				const imgUrl = `https://e-par.kpru.ac.th/timeKPRU/contents/signature/${info.id}.jpg`;
				const imgRes = await axios.get(imgUrl, { responseType: "arraybuffer" });
				const img = await pdfDoc.embedJpg(imgRes.data);
				signatures[role] = img;
			} catch (err) {
				console.warn(`Signature fetch failed for ${role} (${info.id})`);
			}
		}

		// G. วาดเนื้อหา (Logic จาก Pdfg01.jsx)
		let y = 760;
		const space = 20;

		// Header
		drawCenterXText(page, `คำร้อง${requestData.request_type || ""}`, 780, fontBold, 20);

		// วันที่ขอ
		const [req_d, req_m, req_y] = formatThaiDate(requestData.request_date);

		draw(page, `มหาวิทยาลัยราชภัฏกำแพงเพชร`, 420, (y -= space), fontRegular);
		draw(page, `วันที่................เดือน...........................พ.ศ...................`, 350, (y -= space), fontRegular);
		draw(page, req_d, 380, y + 2, fontRegular);
		draw(page, req_m, 425, y + 2, fontRegular);
		draw(page, req_y, 510, y + 2, fontRegular);

		// เรื่อง เรียน
		draw(page, `เรื่อง`, 60, (y -= space * 2), fontBold);
		draw(page, requestData.request_type || "", 100, y, fontRegular);
		draw(page, `เรียน`, 60, (y -= space), fontBold);
		draw(page, `ประธานคณะกรรมการบัณฑิตศึกษาประจำสาขาวิชา${studentData?.major_name || ""}`, 100, y, fontRegular);

		// ข้อมูลนักศึกษา
		draw(
			page,
			`ข้าพเจ้า................................................................................................รหัสประจำตัวนักศึกษา.................................................`,
			100,
			(y -= space * 2),
			fontRegular
		);
		draw(page, studentData?.student_name, 180, y + 2, fontRegular);
		draw(page, requestData.student_id, 460, y + 2, fontRegular);

		draw(
			page,
			"ระดับ...........................................หลักสูตร...............................................................................สาขาวิชา....................................................",
			60,
			(y -= space),
			fontRegular
		);
		draw(page, studentData?.education_level, 110, y + 2, fontRegular);
		draw(page, studentData?.program, 230, y + 2, fontRegular);
		draw(page, studentData?.major_name, 440, y + 2, fontRegular);

		draw(
			page,
			`คณะ..........................................................................................มีความประสงค์.........................................................................................`,
			60,
			(y -= space),
			fontRegular
		);
		draw(page, studentData?.faculty_name, 100, y + 2, fontRegular);
		draw(page, `ขอสอบ${requestData.request_type || ""}`, 360, y + 2, fontRegular);

		draw(page, `ในภาคเรียนที่ ....................... ในวันที่.....................................................`, 60, (y -= space), fontRegular);
		draw(page, requestData.term, 130, y + 2, fontRegular);
		draw(page, examDateText, 210, y + 2, fontRegular);

		draw(page, `จึงเรียนมาเพื่อโปรดพิจารณา`, 100, (y -= space), fontRegular);

		// ส่วนลงชื่อนักศึกษา
		draw(page, `ลงชื่อ...........................................................................`, 310, (y -= space * 2), fontRegular);
		drawCentered(page, studentData?.student_name, 415, y + 2, fontRegular);
		draw(page, `(.........................................................................)`, 330, (y -= space), fontRegular);
		drawCentered(page, studentData?.student_name, 415, y + 2, fontRegular);
		draw(page, `นักศึกษา`, 400, (y -= space), fontRegular);
		draw(page, `วันที่................/........................../......................`, 330, (y -= space), fontRegular);
		draw(page, req_d, 360, y + 2, fontRegular);
		draw(page, req_m, 400, y + 2, fontRegular);
		draw(page, req_y, 465, y + 2, fontRegular);

		// --- ส่วนลายเซ็นอาจารย์ (Advisor) ---
		const isAdvisorApprove = requestData.advisor_approvals === "1";
		const [adv_d, adv_m, adv_y] = formatThaiDateShort(requestData.advisor_approvals_date);

		if (requestData.advisor_approvals !== null) {
			draw(page, `1. ความเห็นของอาจารย์ที่ปรึกษาหมู่เรียน`, 60, (y -= space * 2), fontBold);
			draw(page, isAdvisorApprove ? "เห็นควรอนุญาต" : `ไม่อนุญาต เนื่องจาก ${requestData.comment || "-"}`, 80, (y -= space), fontRegular);

			draw(page, `ลงชื่อ.......................................................................`, 75, (y -= space * 3), fontRegular);
			// วาดรูป
			if (signatures.advisor) {
				const img = signatures.advisor;
				const scale = Math.min(70 / img.width, 30 / img.height);
				page.drawImage(img, { x: 175 - (img.width * scale) / 2, y: y + 5, width: img.width * scale, height: img.height * scale });
			}

			draw(page, `(.....................................................................) `, 95, (y -= space), fontRegular);

			drawCentered(page, approvers.advisor.name, 177, y + 2, fontRegular);

			draw(page, `อาจารย์ที่ปรึกษา`, 145, (y -= space), fontRegular);
			draw(page, `วันที่ ........../................./...................`, 110, (y -= space), fontRegular);
			draw(page, adv_d, 135, y + 2, fontRegular);
			draw(page, adv_m, 170, y + 2, fontRegular);
			draw(page, adv_y, 210, y + 2, fontRegular);

			drawRect(page, 50, y - 10, 250, space * 8.5);
		}

		// --- 2. ส่วนความเห็นประธานกรรมการ (Chairpersons) ---
		// Logic: ขยับ Y กลับขึ้นมาเพื่อเริ่มคอลัมน์ขวา (ตามโค้ด Frontend: y += space * 7)
		const isChairpersonApprove = requestData.chairpersons_approvals === "1";
		const [ch_d, ch_m, ch_y] = formatThaiDateShort(requestData.chairpersons_approvals_date);

		// เช็คว่ามีการเซ็นมาแล้วหรือยัง (เช็ค null)
		if (requestData.chairpersons_approvals !== null) {
			y += space * 7; // ขยับขึ้นไปเริ่มคอลัมน์ขวา

			draw(page, `2. ความเห็นประธานกรรมการบัณฑิตศึกษาประจำสาขาวิชา`, 310, y, fontBold);
			y -= space;

			draw(page, isChairpersonApprove ? "เห็นควรอนุญาต" : "ไม่อนุญาต", 330, y, fontRegular);
			if (!isChairpersonApprove) {
				y -= space;
				draw(page, `เนื่องจาก ${requestData.comment || "-"}`, 330, y, fontRegular);
			} else {
				y -= space; // เว้นบรรทัดให้เท่ากันกรณีอนุญาต
			}

			y -= space * 2;
			draw(page, `ลงชื่อ.......................................................................`, 325, y, fontRegular);

			// วาดลายเซ็นประธาน
			if (signatures.chairpersons) {
				const img = signatures.chairpersons;
				const scale = Math.min(70 / img.width, 30 / img.height);
				// x: 425 คือจุดกึ่งกลางคร่าวๆ ของลายเซ็นใน Frontend
				page.drawImage(img, {
					x: 425 - (img.width * scale) / 2,
					y: y + 5,
					width: img.width * scale,
					height: img.height * scale,
				});
			}

			y -= space;
			draw(page, `(.....................................................................) `, 345, y, fontRegular);

			// ชื่อตัวบรรจง (Centered ที่ x=427)
			drawCentered(page, approvers.chairpersons.name, 427, y + 2, fontRegular);

			y -= space;
			draw(page, `ประธานกรรมการบัณฑิตศึกษาประจำสาขาวิชา`, 340, y, fontRegular);

			y -= space;
			draw(page, `วันที่ ........../................./...................`, 360, y, fontRegular);
			draw(page, ch_d, 385, y + 2, fontRegular);
			draw(page, ch_m, 420, y + 2, fontRegular);
			draw(page, ch_y, 460, y + 2, fontRegular);

			// วาดกรอบสี่เหลี่ยม (ปรับตำแหน่งให้ครอบคลุม)
			drawRect(page, 300, y - 10, 250, space * 8.5);
		}

		// --- 3. ส่วนนายทะเบียน (Registrar) ---
		// Logic: ลงมาบรรทัดล่างซ้าย (y -= space * 1.5 จากจุดล่าสุดของประธาน)
		const isRegistrarApprove = requestData.registrar_approvals === "1";
		const [reg_d, reg_m, reg_y] = formatThaiDateShort(requestData.registrar_approvals_date);

		if (requestData.registrar_approvals !== null) {
			y -= space * 1.5; // ขยับลง

			draw(page, `3. การตรวจสอบของสำนักส่งเสริมวิชาการและงานทะเบียน`, 60, y, fontBold);
			y -= space;

			// เงื่อนไขข้อความ
			if (isRegistrarApprove) {
				draw(page, `มีสภาพการเป็นนักศึกษา ภาคเรียนที่ ${requestData.term || ""}`, 80, y, fontRegular);
				y -= space;
				draw(page, `ลงทะเบียนเรียนครบตามหลักสูตร`, 80, y, fontRegular);
			} else {
				draw(page, `ไม่อนุญาต`, 80, y, fontRegular);
				y -= space;
				draw(page, `เนื่องจาก ${requestData.comment || "-"}`, 80, y, fontRegular);
			}

			y -= space; // บรรทัดว่าง หรือ ชำระเงิน (ตาม Frontend เว้นไว้ 1 บรรทัด)

			y -= space;
			draw(page, `ลงชื่อ.......................................................................`, 75, y, fontRegular);

			// วาดลายเซ็นนายทะเบียน
			if (signatures.registrar) {
				const img = signatures.registrar;
				const scale = Math.min(70 / img.width, 30 / img.height);
				page.drawImage(img, {
					x: 175 - (img.width * scale) / 2,
					y: y + 5,
					width: img.width * scale,
					height: img.height * scale,
				});
			}

			y -= space;
			draw(page, `(.....................................................................) `, 95, y, fontRegular);

			// ชื่อตัวบรรจง (Centered ที่ x=177)
			drawCentered(page, approvers.registrar.name, 177, y + 2, fontRegular);

			y -= space;
			draw(page, `นายทะเบียน`, 150, y, fontRegular);

			y -= space;
			draw(page, `วันที่ ........../................./...................`, 110, y, fontRegular);
			draw(page, reg_d, 135, y + 2, fontRegular);
			draw(page, reg_m, 170, y + 2, fontRegular);
			draw(page, reg_y, 210, y + 2, fontRegular);

			// วาดกรอบ
			drawRect(page, 50, y - 10, 250, space * 8.5);
		}

		// --- 4. ส่วนการเงิน (Finance) ---
		// Logic: ขยับขึ้นไปขวา (y += space * 7)
		const [fin_d, fin_m, fin_y] = formatThaiDateShort(requestData.receipt_pay_date);

		if (requestData.receipt_vol) {
			y += space * 7;

			draw(page, `4. ชำระค่าธรรมเนียมการสอบแล้ว ภาคเรียนที่ ${requestData.term || ""}`, 310, y, fontBold);
			y -= space;

			// เช็คระดับการศึกษาเพื่อแสดงข้อความค่าธรรมเนียม
			const feeText = studentData.education_level === "ปริญญาโท" ? "ปริญญาโท จำนวน 1,000 บาท (หนึ่งพันบาทถ้วน)" : "ปริญญาเอก จำนวน 1,500 บาท (หนึ่งพันห้าร้อยบาทถ้วน)";

			draw(page, feeText, 330, y, fontRegular);
			y -= space;

			draw(page, `ตามใบเสร็จรับเงิน เล่มที่ ${requestData.receipt_vol} เลขที่ ${requestData.receipt_No}`, 310, y, fontRegular);

			y -= space * 2;
			draw(page, `ลงชื่อ.......................................................................`, 325, y, fontRegular);

			// วาดลายเซ็นการเงิน
			if (signatures.finance) {
				const img = signatures.finance;
				const scale = Math.min(70 / img.width, 30 / img.height);
				page.drawImage(img, {
					x: 425 - (img.width * scale) / 2,
					y: y + 5,
					width: img.width * scale,
					height: img.height * scale,
				});
			}

			y -= space;
			draw(page, `(.....................................................................) `, 345, y, fontRegular);

			// ชื่อตัวบรรจง (Centered ที่ x=427)
			drawCentered(page, approvers.finance.name, 427, y + 2, fontRegular);

			y -= space;
			draw(page, `เจ้าหน้าที่การเงิน`, 395, y, fontRegular);

			y -= space;
			draw(page, `วันที่ ........../................./...................`, 360, y, fontRegular);
			draw(page, fin_d, 385, y + 2, fontRegular);
			draw(page, fin_m, 420, y + 2, fontRegular);
			draw(page, fin_y, 460, y + 2, fontRegular);

			// วาดกรอบ
			drawRect(page, 300, y - 10, 250, space * 8.5);
		}

		// H. ส่งไฟล์กลับ
		const pdfBytes = await pdfDoc.save();
		res.set({
			"Content-Type": "application/pdf",
			"Content-Disposition": `attachment; filename="report_g01_${request_exam_id}.pdf"`,
			"Content-Length": pdfBytes.length,
		});
		res.send(Buffer.from(pdfBytes));
	} catch (err) {
		console.error("PDF Generate Error:", err);
		res.status(500).json({ message: "เกิดข้อผิดพลาดในการสร้างเอกสาร" });
	}
});

module.exports = router;
