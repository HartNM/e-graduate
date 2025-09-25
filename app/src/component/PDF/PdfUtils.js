import { rgb } from "pdf-lib";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc.js";
import timezone from "dayjs/plugin/timezone.js";

dayjs.extend(utc);
dayjs.extend(timezone);

let THSarabunNewFont = null; // เก็บฟอนต์ไทยไว้ใช้เป็น default

// โหลดฟอนต์ไทยแล้วเซ็ตเป็น default
export async function setDefaultFont(pdfDoc) {
	const THSarabunNewBytes = await fetch("/fonts/THSarabunNew.ttf").then((res) => res.arrayBuffer());
	THSarabunNewFont = await pdfDoc.embedFont(THSarabunNewBytes);
	return THSarabunNewFont;
}

// getter ไว้เรียกใช้เผื่ออยากได้ font object
export function getDefaultFont() {
	return THSarabunNewFont;
}

export const drawGrid = (page) => {
	const width = page.getWidth();
	const height = page.getHeight();

	for (let x = 0; x <= width; x += 10) {
		page.drawLine({
			start: { x, y: 0 },
			end: { x, y: height },
			thickness: 0.3,
			color: rgb(0.8, 0.8, 0.8),
		});
		page.drawText(`${x}`, { x: x + 1, y: 5, size: 6, color: rgb(1, 0, 0) });
	}

	for (let y = 0; y <= height; y += 10) {
		page.drawLine({
			start: { x: 0, y },
			end: { x: width, y },
			thickness: 0.3,
			color: rgb(0.8, 0.8, 0.8),
		});
		page.drawText(`${y}`, { x: 2, y: y + 1, size: 6, color: rgb(0, 0, 1) });
	}
};

export const draw = (page, text, x, y, font = THSarabunNewFont, size = 14) => {
	if (!font) throw new Error("Font not loaded. Call setDefaultFont(pdfDoc) first.");
	if (text !== undefined && text !== null) {
		page.drawText(String(text), { x, y, size, font });
	}
};

export const drawRect = (page, x, y, w, h, lineW = 1) => {
	page.drawRectangle({
		x,
		y,
		width: w,
		height: h,
		borderWidth: lineW,
		borderColor: rgb(0, 0, 0),
	});
};

export const drawCenterXText = (page, text, y, font = THSarabunNewFont, size = 14) => {
	if (!font) throw new Error("Font not loaded. Call setDefaultFont(pdfDoc) first.");
	if (text !== undefined && text !== null) {
		const pageWidth = page.getWidth();
		const textWidth = font.widthOfTextAtSize(text, size);
		const x = (pageWidth - textWidth) / 2;
		page.drawText(text, { x, y, size, font });
	}
};

export const drawLine = (page, x1, y1, x2, y2, w = 1) => {
	page.drawLine({ start: { x: x1, y: y1 }, end: { x: x2, y: y2 }, thickness: w, color: rgb(0, 0, 0) });
};

export function formatThaiDate(dateStr) {
	console.log(dateStr);
	if (!dateStr) return "";
	const months = ["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"];
	const d = dayjs.utc(dateStr).tz("Asia/Bangkok");
	const day = d.date().toString().padStart(2, "0");
	const month = months[d.month()];
	const year = d.year() + 543;
	return [day, month, year];
}

export function formatThaiDateShort(dateStr) {
	if (!dateStr) return ["", "", ""];
	const monthsShort = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
	const d = dayjs.utc(dateStr).tz("Asia/Bangkok");
	const day = d.date();
	const thaiMonthShort = monthsShort[d.month()];
	const year = (d.year() + 543) % 100;
	return [day, thaiMonthShort, year];
}

export const drawCenteredText = (page, text, x, y, width, height, font = THSarabunNewFont, size = 14) => {
	if (!font) throw new Error("Font not loaded. Call setDefaultFont(pdfDoc) first.");
	if (!text) return;

	const textWidth = font.widthOfTextAtSize(text, size);
	const textHeight = size; // approximate

	const centerX = x + (width - textWidth) / 2;
	const centerY = y + (height - textHeight) / 2 + size * 0.3; // ปรับ baseline

	page.drawText(text, { x: centerX, y: centerY, size, font });
};

export const drawMiddleText = (page, text, x, y, height, font = THSarabunNewFont, size = 14) => {
	if (!font) throw new Error("Font not loaded. Call setDefaultFont(pdfDoc) first.");
	if (!text) return;

	const textHeight = size; // approximate
	const centerY = y + (height - textHeight) / 2 + size * 0.3; // baseline

	page.drawText(text, { x, y: centerY, size, font });
};
