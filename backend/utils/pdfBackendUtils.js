// backend/utils/pdfBackendUtils.js
const { rgb } = require("pdf-lib");
const fs = require("fs");
const path = require("path");
const axios = require("axios");
const dayjs = require("dayjs");
const utc = require("dayjs/plugin/utc");
const timezone = require("dayjs/plugin/timezone");

dayjs.extend(utc);
dayjs.extend(timezone);

// Config path ของ Font (ปรับแก้ path ตามโครงสร้างโฟลเดอร์จริงของคุณ)
const fontPathRegular = path.join(__dirname, "../assets/fonts/THSarabunNew.ttf");
const fontPathBold = path.join(__dirname, "../assets/fonts/THSarabunNew Bold.ttf");

// URL ของ API ตัวเอง (สำหรับดึงรูป/ลายเซ็น หากไม่ได้ดึงจาก DB โดยตรง)
// ควรตั้งค่าใน .env: API_URL=http://localhost:3000
const BASE_URL = process.env.API_URL || "http://localhost:3000";

let THSarabunNewFont = null;
let THSarabunNewBoldFont = null;

async function loadFonts(pdfDoc) {
	// Load Regular
	const fontBytes = fs.readFileSync(fontPathRegular);
	THSarabunNewFont = await pdfDoc.embedFont(fontBytes);

	// Load Bold
	const fontBytesBold = fs.readFileSync(fontPathBold);
	THSarabunNewBoldFont = await pdfDoc.embedFont(fontBytesBold);

	return { font: THSarabunNewFont, fontBold: THSarabunNewBoldFont };
}

const draw = (page, text, x, y, font = THSarabunNewFont, size = 14) => {
	if (text !== undefined && text !== null) {
		page.drawText(String(text), { x, y, size, font });
	}
};

const drawRect = (page, x, y, w, h, lineW = 1) => {
	page.drawRectangle({
		x,
		y,
		width: w,
		height: h,
		borderWidth: lineW,
		borderColor: rgb(0, 0, 0),
	});
};

const drawCenterXText = (page, text, y, font = THSarabunNewFont, size = 14) => {
	if (text !== undefined && text !== null) {
		const pageWidth = page.getWidth();
		const textWidth = font.widthOfTextAtSize(text, size);
		const x = (pageWidth - textWidth) / 2;
		page.drawText(text, { x, y, size, font });
	}
};

function formatThaiDate(dateStr) {
	if (!dateStr) return ["", "", ""];
	const months = ["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"];
	const d = dayjs.utc(dateStr).tz("Asia/Bangkok");
	const day = d.date();
	const month = months[d.month()];
	const year = d.year() + 543;
	return [day, month, year];
}

function formatThaiDateShort(dateStr) {
	if (!dateStr) return ["", "", ""];
	const monthsShort = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
	const d = dayjs.utc(dateStr).tz("Asia/Bangkok");
	const day = d.date();
	const monthShort = monthsShort[d.month()];
	const year = (d.year() + 543) % 100;
	return [day, monthShort, year];
}

async function fetchPersonDataAndSignature(pdfDoc, data, ids) {
	const signatureImages = {};

	for (const [role, prop] of Object.entries(ids)) {
		const id = data?.[prop];
		/* const id = "1629900598264"; */

		// ข้ามถ้าไม่มี ID หรือ ID เป็น 0
		if (!id || id == 0 || id === "0") continue;

		// --- 1. ดึงรูปภาพลายเซ็น (Direct from e-par) ---
		try {
			const signatureUrl = `https://e-par.kpru.ac.th/timeKPRU/contents/signature/${id}.jpg`;
			// console.log(`Fetching signature for ${role} (${id}) from external: ${signatureUrl}`);

			const imgRes = await axios.get(signatureUrl, {
				responseType: "arraybuffer", // สำคัญ: ต้องรับเป็น Binary
			});

			if (imgRes.data && imgRes.data.byteLength > 0) {
				const buffer = Buffer.from(imgRes.data);

				// ตรวจสอบ Magic Bytes ว่าเป็น PNG หรือ JPG (กันเหนียว เผื่อไฟล์ปลายทางนามสกุลผิด)
				// PNG Header: 89 50 4E 47
				const isPng = buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47;

				if (isPng) {
					signatureImages[role] = await pdfDoc.embedPng(buffer);
				} else {
					signatureImages[role] = await pdfDoc.embedJpg(buffer);
				}
			}
		} catch (imgError) {
			// กรณีไม่เจอรูป (404) หรือ Network Error
			console.warn(`[Signature] Cannot fetch signature for ${role} (ID: ${id}): ${imgError.message}`);
		}

		// --- 2. ดึงชื่อ-นามสกุล (Direct from mis) ---
		// ทำเฉพาะเมื่อยังไม่มีชื่อใน data (หรือ Frontend ไม่ได้ส่งมา)
		const nameProp = prop.replace("_id", "_name"); // เช่น advisor_approvals_name

		if (!data[nameProp]) {
			try {
				const nameUrl = `https://mis.kpru.ac.th/api/TabianAPI/${id}`;
				const nameRes = await axios.get(nameUrl);
				const nameData = nameRes.data;

				if (nameData?.AjDetail && nameData.AjDetail.length > 0) {
					const info = nameData.AjDetail[0];
					// อัปเดตข้อมูลใส่ data object โดยตรง
					data[nameProp] = `${info.prename_full_tha}${info.first_name_tha} ${info.last_name_tha}`;
				}
			} catch (nameError) {
				console.error(`[Name] Error fetch name for ID ${id}:`, nameError.message);
			}
		}
	}
	return signatureImages;
}

const drawSignature = (page, image, x, y, maxWidth = 70, maxHeight = 30) => {
	if (!image) return;
	const xScale = maxWidth / image.width;
	const yScale = maxHeight / image.height;
	const scaleFactor = Math.min(xScale, yScale);
	const imgWidth = image.width * scaleFactor;
	const imgHeight = image.height * scaleFactor;
	const centeredX = x - imgWidth / 2;
	const centeredY = y + 3;

	page.drawImage(image, {
		x: centeredX,
		y: centeredY,
		width: imgWidth,
		height: imgHeight,
	});
};

module.exports = {
	loadFonts,
	draw,
	drawRect,
	drawCenterXText,
	formatThaiDate,
	formatThaiDateShort,
	fetchPersonDataAndSignature,
	drawSignature,
	BASE_URL,
};
