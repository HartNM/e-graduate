import React from "react";
import { Button } from "@mantine/core";
import { PDFDocument, rgb } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";

const STUDENTS_PER_PAGE = 20;

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
	const drawCenteredText = (page, text, x, y, width, height, font, size = 14) => {
		const textWidth = font.widthOfTextAtSize(text, size);
		const textHeight = size; // ความสูงประมาณ size

		const centerX = x + (width - textWidth) / 2;
		const centerY = y + (height - textHeight) / 2;

		page.drawText(text, { x: centerX, y: centerY, size, font });
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
	const STUDENTS_PER_PAGE = 20;

	for (const groupId in data) {
		const students = data[groupId];
		let pageIndex = 0;

		while (pageIndex * STUDENTS_PER_PAGE < students.length) {
			// copy template page จาก templateDoc
			const [newPage] = await pdfDoc.copyPages(templateDoc, [0]);
			pdfDoc.addPage(newPage);

			/* drawGrid(newPage); */

			const start = pageIndex * STUDENTS_PER_PAGE;
			const end = Math.min(start + STUDENTS_PER_PAGE, students.length);

			// เขียนชื่อ study group
			drawText(newPage, `Study Group: ${groupId}`, 67, 810, customFont, 16);

			// วาด student_id
			let y = 755;
			for (let i = start; i < end; i++) {
				drawText(newPage, `${students[i].id}`, 98, y, customFont, 14);

				const nameParts = students[i].name.split(" ");
				const firstName = nameParts[0] || "";
				const lastName = nameParts.slice(1).join(" ") || "";

				drawText(newPage, firstName, 200, y, customFont, 14);
				drawText(newPage, lastName, 300, y, customFont, 14);

				y -= 21.5;
			}

			pageIndex++;
		}
	}

	const pdfBytes = await pdfDoc.save();
	return new Blob([pdfBytes], { type: "application/pdf" });
}

export default function SignatureForm({ data }) {
	const handleClick = async () => {
		const blob = await fillPdf("/pdf/SignatureForm.pdf", data);
		const url = URL.createObjectURL(blob);
		window.open(url, "_blank");
	};

	return (
		<Button size="xs" color="gray" onClick={handleClick}>
			พิมพ์รายชื่อ
		</Button>
	);
}
