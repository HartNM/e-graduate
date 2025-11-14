/* import React from "react";
import { Button } from "@mantine/core";
import { PDFDocument, rgb } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import { formatThaiDate, drawGrid, drawRect, drawLine, drawCenteredText, drawMiddleText, drawCenterXText } from "./PdfUtils.js";
const BASE_URL = import.meta.env.VITE_API_URL;

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

	
	const firstArray = Object.values(data)[0];
	const term = firstArray?.[0]?.term;

	console.log("term:", term);

	let KQ_exam_date;
	try {
		const token = localStorage.getItem("token");
		const requestRes = await fetch(`${BASE_URL}/api/allRequestExamInfo`, {
			method: "POST",
			headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
			body: JSON.stringify({ term: term }),
		});
		const requestData = await requestRes.json();
		if (Array.isArray(requestData) && requestData.length > 0) {
			KQ_exam_date = requestData[0].KQ_exam_date;
		}
		console.log(KQ_exam_date);
	} catch (e) {
		console.error("Error fetch allRequestExamInfo:", e);
	}

	const [day, month, year] = formatThaiDate(KQ_exam_date);

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

			// drawGrid(newPage); 
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

export default function SignatureForm({ data }) {
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
 */

import React from "react";
import { Button } from "@mantine/core";
import { PDFDocument, rgb } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import { formatThaiDate, drawGrid, drawRect, drawLine, drawCenteredText, drawMiddleText, drawCenterXText } from "./PdfUtils.js";
const BASE_URL = import.meta.env.VITE_API_URL;

async function fillPdf(templateUrl, data) {
	// --- 1. ส่วน Setup (เหมือนเดิม) ---
	const templateBytes = await fetch(templateUrl).then((res) => res.arrayBuffer());
	const templateDoc = await PDFDocument.load(templateBytes);
	templateDoc.registerFontkit(fontkit);
	const pdfDoc = await PDFDocument.create();
	pdfDoc.registerFontkit(fontkit);

	const fontBytes = await fetch("/fonts/THSarabunNew.ttf").then((res) => res.arrayBuffer());
	const customFont = await pdfDoc.embedFont(fontBytes);

	const logoBytes = await fetch("/icons/KPRU-LOGO-line2.png").then((res) => res.arrayBuffer());
	const logoImage = await pdfDoc.embedPng(logoBytes);
	const pngDims = logoImage.scale(0.125);

	const firstArray = Object.values(data)[0];
	const term = firstArray?.[0]?.term;

	// --- 2. ดึงข้อมูล Exam Info (เหมือนเดิม) ---
	let examInfo = null;
	try {
		const token = localStorage.getItem("token");
		const requestRes = await fetch(`${BASE_URL}/api/allRequestExamInfo`, {
			method: "POST",
			headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
			body: JSON.stringify({ term: term }),
		});
		const requestData = await requestRes.json();
		if (Array.isArray(requestData) && requestData.length > 0) {
			examInfo = requestData[0];
		}
		console.log(examInfo);
	} catch (e) {
		console.error("Error fetch allRequestExamInfo:", e);
	}

	// --- 3. ⬇️ (แก้ไข) สร้างรายการวันที่สอบ (examDates) ---
	const examDates = [];
	if (examInfo && examInfo.KQ_exam_date && examInfo.KQ_exam_end_date) {
		// --- กรณีเป็นช่วงวันที่ ---
		const startDate = new Date(examInfo.KQ_exam_date);
		const endDate = new Date(examInfo.KQ_exam_end_date);
		let currentDate = new Date(startDate.getTime()); // สร้าง Date object ใหม่

		while (currentDate <= endDate) {
			examDates.push(new Date(currentDate));
			currentDate.setDate(currentDate.getDate() + 1); // เพิ่มวันทีละ 1
		}
	} else if (examInfo && examInfo.KQ_exam_date) {
		// --- กรณีมีวันเดียว ---
		examDates.push(new Date(examInfo.KQ_exam_date));
	}

	// ถ้าไม่มีข้อมูลวันสอบ ให้เพิ่ม null เพื่อให้วนลูป 1 ครั้ง (แสดงเป็น .............)
	if (examDates.length === 0) {
		examDates.push(null);
	}

	const STUDENTS_PER_PAGE = 25;
	const ROW_HEIGHT = 20;

	// --- 4. ⬇️ (แก้ไข) ลูปหลัก (วนตามกลุ่ม -> วนตามวันสอบ -> วนตามหน้า) ---
	for (const groupId in data) {
		const students = data[groupId];

		// ⬇️ วนลูปตามจำนวนวันที่สอบ
		for (const examDate of examDates) {
			// --- สร้าง dateString สำหรับวันที่ในลูปนี้ ---
			let dateString;
			if (examDate) {
				const [day, month, year] = formatThaiDate(examDate);
				dateString = `สอบวันที่ ${day} ${month} ${year} เวลา............................`;
			} else {
				dateString = "สอบวันที่ ........................................ เวลา............................";
			}

			// --- ลูปแบ่งหน้า (Pagination) ---
			let pageIndex = 0;
			while (pageIndex * STUDENTS_PER_PAGE < students.length) {
				const [newPage] = await pdfDoc.copyPages(templateDoc, [0]);
				pdfDoc.addPage(newPage);
				const start = pageIndex * STUDENTS_PER_PAGE;
				const end = Math.min(start + STUDENTS_PER_PAGE, students.length);

				// --- วาดโลโก้ (เหมือนเดิม) ---
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

					// ⬇️ ใช้ dateString ของวันที่ในลูปนี้
					drawCenterXText(newPage, dateString, 620, customFont, 16);
					y = 580;
				} else {
					drawCenterXText(newPage, `รายชื่อผู้เข้า${type}`, 680, customFont, 16);
					drawCenterXText(newPage, `ด้าน..................................................`, 660, customFont, 16);
					drawCenterXText(newPage, `ปรัชญาดุษฎีบัณฑิต สาขาวิชา${students[0].major_name} รุ่นที่ ${parseInt(students[0].id.slice(0, 2), 10) - 57}`, 640, customFont, 16);
					drawCenterXText(newPage, `มหาวิทยาลัยราชภัฏกําแพงเพชร`, 620, customFont, 16);

					// ⬇️ ใช้ dateString ของวันที่ในลูปนี้
					drawCenterXText(newPage, dateString, 600, customFont, 16);
					y = 560;
				} // --- วาดตาราง (เหมือนเดิม) ---

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

				// --- วาดข้อมูลนักศึกษา (เหมือนเดิม) ---
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
		} // ⬅️ สิ้นสุดลูปของ examDates
	} // ⬅️ สิ้นสุดลูปของ groupId

	const pdfBytes = await pdfDoc.save();
	return new Blob([pdfBytes], { type: "application/pdf" });
}

export default function SignatureForm({ data }) {
	const handleClick = async () => {
		const blob = await fillPdf("/pdf/blank.pdf", data);
		const url = URL.createObjectURL(blob);
		window.open(url, "_blank");
	};

	return (
		<Button size="xs" color="gray" onClick={handleClick}>
			พิมพ์รายชื่อ{" "}
		</Button>
	);
}
