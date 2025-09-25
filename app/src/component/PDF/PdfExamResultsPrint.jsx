import { PDFDocument, rgb } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import { setDefaultFont, drawRect, drawCenterXText, drawCenteredText, drawMiddleText, drawLine, formatThaiDate } from "./PdfUtils.js";

async function fillPdf(students) {
	const pdfDoc = await PDFDocument.create();
	pdfDoc.registerFontkit(fontkit);
	const page = pdfDoc.addPage([595, 842]);

	const font = await setDefaultFont(pdfDoc);

	const logoBytes = await fetch("/icons/KPRU-LOGO-line2.png").then((res) => res.arrayBuffer());
	const logoImage = await pdfDoc.embedPng(logoBytes);
	const pngDims = logoImage.scale(0.125);

	const STUDENTS_PER_PAGE = 25;
	const ROW_HEIGHT = 20;
	let pageIndex = 0;

	let KQ_exam_date;
	try {
		const token = localStorage.getItem("token");
		const requestRes = await fetch("http://localhost:8080/api/allRequestExamInfo", {
			method: "POST",
			headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
			body: JSON.stringify({ term: students[0].term }),
		});
		const requestData = await requestRes.json();
		if (Array.isArray(requestData) && requestData.length > 0) {
			KQ_exam_date = requestData[0].KQ_exam_date;
		}
		console.log(KQ_exam_date);
	} catch (e) {
		console.error("Error fetch allRequestExamInfo:", e);
	}

	const [exam_date_day, exam_date_month, exam_date_year] = formatThaiDate(KQ_exam_date);
	console.log(exam_date_day, exam_date_month, exam_date_year);

	while (pageIndex * STUDENTS_PER_PAGE < students.length) {
		const newPage = pageIndex === 0 ? page : pdfDoc.addPage([595, 842]);
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

		let y = 600;
		drawCenterXText(newPage, `รายการผล${type}`, 680, font, 16);
		drawCenterXText(newPage, `สาขาวิชา${students[0].major_name}`, 660, font, 16);
		drawCenterXText(newPage, `ประจำภาคเรียนที่ ${students[0].term} สอบวันที่ ${exam_date_day} ${exam_date_month} ${exam_date_year} `, 640, font, 16);

		drawRect(newPage, 60, y, 490, ROW_HEIGHT);
		drawLine(newPage, 100, y + ROW_HEIGHT, 100, y - (end - start) * ROW_HEIGHT);
		drawLine(newPage, 230, y + ROW_HEIGHT, 230, y - (end - start) * ROW_HEIGHT);
		drawLine(newPage, 440, y + ROW_HEIGHT, 440, y - (end - start) * ROW_HEIGHT);

		drawCenteredText(newPage, "ลำดับ", 60, y, 40, ROW_HEIGHT, font, 14);
		drawCenteredText(newPage, "รหัสนักศึกษา", 100, y, 130, ROW_HEIGHT, font, 14);
		drawCenteredText(newPage, "ชื่อ - นามสกุล", 230, y, 210, ROW_HEIGHT, font, 14);
		drawCenteredText(newPage, "ผลการสอบ", 440, y, 110, ROW_HEIGHT, font, 14);

		for (let i = start; i < end; i++) {
			y -= ROW_HEIGHT;
			drawRect(newPage, 60, y, 490, ROW_HEIGHT);
			drawCenteredText(newPage, `${i + 1}`, 60, y, 40, ROW_HEIGHT, font, 14);
			drawCenteredText(newPage, `${students[i].student_id}`, 100, y, 130, ROW_HEIGHT, font, 14);

			const nameParts = students[i].name ? students[i].name.split(" ") : ["", ""];
			drawMiddleText(newPage, nameParts[0], 260, y, ROW_HEIGHT, font, 14);
			drawMiddleText(newPage, nameParts.slice(1).join(" "), 350, y, ROW_HEIGHT, font, 14);

			if (students[i].exam_results !== null && students[i].exam_results !== undefined) {
				drawCenteredText(newPage, students[i].exam_results, 440, y, 110, ROW_HEIGHT, font, 14);
			}
		}
		pageIndex++;
	}

	const pdfBytes = await pdfDoc.save();
	return new Blob([pdfBytes], { type: "application/pdf" });
}

export default async function PDFExamResultsPrint(students) {
	console.log("ข้อมูลที่จะพิมพ์:", students);
	try {
		const blob = await fillPdf(students);
		const url = URL.createObjectURL(blob);
		window.open(url, "_blank");
	} catch (err) {
		console.error("เกิดข้อผิดพลาดสร้าง PDF:", err);
	}
}
