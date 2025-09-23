import React from "react";
import { Button } from "@mantine/core";
import { PDFDocument, rgb } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import { formatThaiDate, drawGrid, drawRect, drawLine, drawCenteredText, drawMiddleText, drawCenterXText } from "./PdfUtils.js";

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

	const [day, month, year] = formatThaiDate(exam_date);
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
				drawCenterXText(newPage, `สอบวันที่ ${day} ${month} ${year} เวลา............................`, 620, customFont, 16);
				y = 580;
			} else {
				drawCenterXText(newPage, `รายชื่อผู้เข้า${type}`, 680, customFont, 16);
				drawCenterXText(newPage, `ด้าน..................................................`, 660, customFont, 16);
				drawCenterXText(newPage, `ปรัชญาดุษฎีบัณฑิต สาขาวิชา${students[0].major_name} รุ่นที่ ${parseInt(students[0].id.slice(0, 2), 10) - 57}`, 640, customFont, 16);
				drawCenterXText(newPage, `มหาวิทยาลัยราชภัฏกําแพงเพชร`, 620, customFont, 16);
				drawCenterXText(newPage, `สอบวันที่ ${day} ${month} ${year} เวลา............................`, 600, customFont, 16);
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
	const handleClick = async () => {
		const blob = await fillPdf("/pdf/blank.pdf", data, exam_date);
		const url = URL.createObjectURL(blob);
		window.open(url, "_blank");
	};

	return (
		<Button size="xs" color="gray" onClick={handleClick}>
			พิมพ์รายชื่อ
		</Button>
	);
}
