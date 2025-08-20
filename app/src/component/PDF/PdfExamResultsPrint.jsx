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

	const drawText = (page, text, x, y, font = customFont, size = 14) => {
		if (text !== undefined && text !== null) {
			page.drawText(String(text), { x, y, size, font });
		}
	};
	const drawRect = (page, x, y, w, h, lineW = 1) => {
		page.drawRectangle({ x, y, width: w, height: h, borderWidth: lineW, borderColor: rgb(0, 0, 0) });
	};
	const drawLine = (page, x1, y1, x2, y2, w = 1) => page.drawLine({ start: { x: x1, y: y1 }, end: { x: x2, y: y2 }, thickness: w, color: rgb(0, 0, 0) });
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
	const STUDENTS_PER_PAGE = 30;

	for (const groupId in data) {
		const students = data[groupId];
		let pageIndex = 0;

		while (pageIndex * STUDENTS_PER_PAGE < students.length) {
			const [newPage] = await pdfDoc.copyPages(templateDoc, [0]);
			pdfDoc.addPage(newPage);
			const start = pageIndex * STUDENTS_PER_PAGE;
			const end = Math.min(start + STUDENTS_PER_PAGE, students.length);

			let y = 730;
			drawText(newPage, `Study Group: ${groupId}`, 67, 810, customFont, 16);
			drawRect(newPage, 60, y, 490, 20);
			drawLine(newPage, 100, y + 20, 100, y - students.length * 20);
			drawLine(newPage, 230, y + 20, 230, y - students.length * 20);
			drawLine(newPage, 440, y + 20, 440, y - students.length * 20);
			drawText(newPage, "ลำดับ", 70, y + 6, customFont, 14);
			drawText(newPage, "รหัสนักศึกษา", 140, y + 6, customFont, 14);
			drawText(newPage, "ชื่อนักศึกษา", 310, y + 6, customFont, 14);
			drawText(newPage, "ผลการสอบ", 475, y + 6, customFont, 14);
			for (let i = start; i < end; i++) {
				y -= 20;
				drawRect(newPage, 60, y, 490, 20);
				drawText(newPage, i + 1, 75, y + 6, customFont, 14);
				drawText(newPage, `${students[i].id}`, 140, y + 6, customFont, 14);
				drawText(newPage, students[i].name.split(" ")[0], 260, y + 6, customFont, 14);
				drawText(newPage, students[i].name.split(" ").slice(1).join(" "), 360, y + 6, customFont, 14);
				if (students[i].exam_results !== null) {
					drawText(newPage, students[i].exam_results ? "ผ่าน" : "ไม่ผ่าน", 480, y + 6, customFont, 14);
				}
			}
			drawGrid(newPage);
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
