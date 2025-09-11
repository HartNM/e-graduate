import React from "react";
import { Button } from "@mantine/core";
import { PDFDocument, rgb } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";

async function fillPdf(templateUrl, data, exam_date) {
	// โหลด template PDF ใหม่สำหรับ copy
	const templateBytes = await fetch(templateUrl).then((res) => res.arrayBuffer());
	const templateDoc = await PDFDocument.load(templateBytes);
	templateDoc.registerFontkit(fontkit);
	// สร้าง pdf ใหม่
	const pdfDoc = await PDFDocument.create();
	pdfDoc.registerFontkit(fontkit);

	const fontBytes = await fetch("/fonts/THSarabunNew.ttf").then((res) => res.arrayBuffer());
	const customFont = await pdfDoc.embedFont(fontBytes);

	const logoBytes = await fetch("/icons/KPRU-LOGO-line2.png").then((res) => res.arrayBuffer());
	const logoImage = await pdfDoc.embedPng(logoBytes);
	const pngDims = logoImage.scale(0.125);

	const drawText = (page, text, x, y, font = customFont, size = 14) => {
		if (text !== undefined && text !== null) {
			page.drawText(String(text), { x, y, size, font });
		}
	};
	const drawRect = (page, x, y, w, h, lineW = 1) => {
		page.drawRectangle({ x, y, width: w, height: h, borderWidth: lineW, borderColor: rgb(0, 0, 0) });
	};
	const drawLine = (page, x1, y1, x2, y2, w = 1) => page.drawLine({ start: { x: x1, y: y1 }, end: { x: x2, y: y2 }, thickness: w, color: rgb(0, 0, 0) });

	const drawCenteredText = (page, text, x, y, width, height, font, size = 14) => {
		const textWidth = font.widthOfTextAtSize(text, size);
		const textHeight = size; // approximate

		const centerX = x + (width - textWidth) / 2;
		// ปรับ y ให้ baseline อยู่กลางกล่อง
		const centerY = y + (height - textHeight) / 2 + size * 0.3;

		page.drawText(text, { x: centerX, y: centerY, size, font });
	};

	const drawMiddleText = (page, text, x, y, height, font, size = 14) => {
		if (!text) return;
		const textHeight = size; // ประมาณความสูงฟอนต์
		const centerY = y + (height - textHeight) / 2 + size * 0.3; // baseline ให้อยู่กลาง
		page.drawText(text, { x, y: centerY, size, font });
	};

	const drawCenterXText = (page, text, y, font, size = 14) => {
		if (!text) return;
		const pageWidth = page.getWidth();
		const textWidth = font.widthOfTextAtSize(text, size);
		const x = (pageWidth - textWidth) / 2;
		page.drawText(text, { x, y, size, font });
	};

	/* ------------------------------------------ลบ------------------------------------------ */
	const drawGrid = (page) => {
		const width = page.getWidth();
		const height = page.getHeight();

		// ตีเส้นแกน X ทุก 10
		for (let x = 0; x <= width; x += 10) {
			page.drawLine({
				start: { x, y: 0 },
				end: { x, y: height },
				thickness: 0.3,
				color: rgb(0.8, 0.8, 0.8),
			});
			page.drawText(`${x}`, { x: x + 1, y: 5, size: 6, color: rgb(1, 0, 0) });
		}

		// ตีเส้นแกน Y ทุก 10
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
	/* -------------------------------------------------------------------------------------- */
	const STUDENTS_PER_PAGE = 25;

	const ROW_HEIGHT = 20;

	for (const groupId in data) {
		const students = data[groupId];
		let pageIndex = 0;

		while (pageIndex * STUDENTS_PER_PAGE < students.length) {
			const [newPage] = await pdfDoc.copyPages(templateDoc, [0]);
			pdfDoc.addPage(newPage);
			const start = pageIndex * STUDENTS_PER_PAGE;
			const end = Math.min(start + STUDENTS_PER_PAGE, students.length);

			const centerX = (newPage.getWidth() - pngDims.width) / 2;
			newPage.drawImage(logoImage, {
				x: centerX,
				y: 700,
				width: pngDims.width,
				height: pngDims.height,
			});
			const type = students[0].request_type.split("ขอ")[1];
			let y;
			if (type === "สอบประมวลความรู้") {
				drawCenterXText(newPage, `รายชื่อผู้เข้า${type}`, 680, customFont, 16);
				drawCenterXText(newPage, `ประจำภาคเรียนที่ ${students[0].term}`, 660, customFont, 16);
				drawCenterXText(newPage, `หมวด..........................................`, 640, customFont, 16);
				drawCenterXText(newPage, `สอบวันที่ ${exam_date} เวลา............................`, 620, customFont, 16);
				y = 580;
			} else {
				drawCenterXText(newPage, `รายชื่อผู้เข้า${type}`, 680, customFont, 16);
				drawCenterXText(newPage, `ด้าน..................................................`, 660, customFont, 16);
				drawCenterXText(newPage, `ปรัชญาดุษฎีบัณฑิต สาขาวิชา${students[0].major_name} รุ่นที่ ${parseInt(students[0].id.slice(0, 2), 10) - 57}`, 640, customFont, 16);
				drawCenterXText(newPage, `มหาวิทยาลัยราชภัฏกําแพงเพชร`, 620, customFont, 16);
				drawCenterXText(newPage, `สอบวันที่ ${exam_date} เวลา............................`, 600, customFont, 16);
				y = 560;
			}

			/* drawGrid(newPage); */
			drawRect(newPage, 60, y, 490, ROW_HEIGHT);
			const tableHeight = (end - start) * ROW_HEIGHT;
			const bottomY = y - tableHeight;
			drawLine(newPage, 100, y + ROW_HEIGHT, 100, bottomY);
			drawLine(newPage, 170, y + ROW_HEIGHT, 170, bottomY);
			drawLine(newPage, 370, y + ROW_HEIGHT, 370, bottomY);
			drawLine(newPage, 470, y + ROW_HEIGHT, 470, bottomY);
			drawCenteredText(newPage, "ลำดับ", 60, y, 40, ROW_HEIGHT, customFont, 14);
			drawCenteredText(newPage, "รหัสนักศึกษา", 100, y, 70, ROW_HEIGHT, customFont, 14);
			drawCenteredText(newPage, "ชื่อ - นามสกุล", 170, y, 200, ROW_HEIGHT, customFont, 14);
			drawCenteredText(newPage, "ลายมือชื่อ", 370, y, 100, ROW_HEIGHT, customFont, 14);
			drawCenteredText(newPage, "หมายเหตุ", 470, y, 80, ROW_HEIGHT, customFont, 14);
			for (let i = start; i < end; i++) {
				y -= ROW_HEIGHT;
				drawRect(newPage, 60, y, 490, ROW_HEIGHT);
				drawCenteredText(newPage, `${i + 1}`, 60, y, 40, ROW_HEIGHT, customFont, 14);
				drawCenteredText(newPage, `${students[i].id}`, 100, y, 70, ROW_HEIGHT, customFont, 14);
				drawMiddleText(newPage, students[i].name.split(" ")[0], 190, y, ROW_HEIGHT, customFont, 14);
				drawMiddleText(newPage, students[i].name.split(" ").slice(1).join(" "), 290, y, ROW_HEIGHT, customFont, 14);
			}
			pageIndex++;
		}
	}

	const pdfBytes = await pdfDoc.save();
	return new Blob([pdfBytes], { type: "application/pdf" });
}

export default function SignatureForm({ data, exam_date }) {
	function formatThaiDate(dateStr) {
		const months = ["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"];

		const [year, month, day] = dateStr.split("-").map(Number);
		const buddhistYear = year;
		const thaiMonth = months[month - 1];

		return `${day} ${thaiMonth} ${buddhistYear}`;
	}

	const handleClick = async () => {
		const blob = await fillPdf("/pdf/blank.pdf", data, formatThaiDate(exam_date));
		const url = URL.createObjectURL(blob);
		window.open(url, "_blank");
	};

	return (
		<Button size="xs" color="gray" onClick={handleClick}>
			พิมพ์รายชื่อ
		</Button>
	);
}
