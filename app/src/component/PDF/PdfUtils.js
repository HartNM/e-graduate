import { rgb } from "pdf-lib";

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

export function formatThaiDate(dateStr) {
	if (!dateStr) return ["", "", ""];
	const months = ["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"];
	const [year, month, day] = dateStr.split("-").map(Number);
	const thaiMonth = months[month - 1];
	return [day, thaiMonth, year];
}

export function formatThaiDateShort(dateStr) {
	if (!dateStr) return ["", "", ""];
	const monthsShort = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
	const [year, month, day] = dateStr.split("-").map(Number);
	const thaiMonthShort = monthsShort[month - 1];
	return [day, thaiMonthShort, year];
}

export function drawLine(page, x1, y1, x2, y2, w = 1) {
	page.drawLine({ start: { x: x1, y: y1 }, end: { x: x2, y: y2 }, thickness: w, color: rgb(0, 0, 0) });
}
