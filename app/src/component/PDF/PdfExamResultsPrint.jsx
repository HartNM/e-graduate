import React from "react";
import { Button } from "@mantine/core";
import { PDFDocument, rgb } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";

async function fillPdf(templateUrl, data) {
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

			/* drawGrid(newPage); */

			const centerX = (newPage.getWidth() - pngDims.width) / 2;
			newPage.drawImage(logoImage, {
				x: centerX,
				y: 700,
				width: pngDims.width,
				height: pngDims.height,
			});
			const type = students[0].request_type.split("ขอ")[1];
			let y = 600;
			drawCenterXText(newPage, `รายการผล${type}`, 680, customFont, 16);
			drawCenterXText(newPage, `สาขาวิชา${students[0].major_name}`, 660, customFont, 16);
			drawCenterXText(newPage, `ประจำภาคเรียนที่ ${students[0].term}`, 640, customFont, 16);

			drawRect(newPage, 60, y, 490, ROW_HEIGHT);
			const tableHeight = (end - start) * ROW_HEIGHT;
			const bottomY = y - tableHeight;
			drawLine(newPage, 100, y + ROW_HEIGHT, 100, bottomY);
			drawLine(newPage, 230, y + ROW_HEIGHT, 230, bottomY);
			drawLine(newPage, 440, y + ROW_HEIGHT, 440, bottomY);

			drawCenteredText(newPage, "ลำดับ", 60, y, 40, ROW_HEIGHT, customFont, 14);
			drawCenteredText(newPage, "รหัสนักศึกษา", 100, y, 130, ROW_HEIGHT, customFont, 14);
			drawCenteredText(newPage, "ชื่อ - นามสกุล", 230, y, 210, ROW_HEIGHT, customFont, 14);
			drawCenteredText(newPage, "ผลการสอบ", 440, y, 110, ROW_HEIGHT, customFont, 14);
			for (let i = start; i < end; i++) {
				y -= ROW_HEIGHT;
				drawRect(newPage, 60, y, 490, ROW_HEIGHT);
				drawCenteredText(newPage, `${i + 1}`, 60, y, 40, ROW_HEIGHT, customFont, 14);
				drawCenteredText(newPage, `${students[i].id}`, 100, y, 130, ROW_HEIGHT, customFont, 14);
				drawMiddleText(newPage, students[i].name.split(" ")[0], 250, y, ROW_HEIGHT, customFont, 14);
				drawMiddleText(newPage, students[i].name.split(" ").slice(1).join(" "), 360, y, ROW_HEIGHT, customFont, 14);
				if (students[i].exam_results !== null) {
					drawCenteredText(newPage, students[i].exam_results ? "ผ่าน" : "ไม่ผ่าน", 440, y, 110, ROW_HEIGHT, customFont, 14);
				}
			}
			pageIndex++;
		}
	}

	const pdfBytes = await pdfDoc.save();
	return new Blob([pdfBytes], { type: "application/pdf" });
}

export default function PdfExamResultsPrint({ data }) {
	const handleClick = async () => {
		const blob = await fillPdf("/pdf/blank.pdf", data);
		const url = URL.createObjectURL(blob);
		window.open(url, "_blank");
	};

	return (
		<Button size="xs" color="gray" onClick={handleClick}>
			พิมพ์รายชื่อ
		</Button>
	);
}
