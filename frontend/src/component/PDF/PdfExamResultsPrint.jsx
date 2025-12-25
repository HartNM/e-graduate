import { PDFDocument, rgb } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import { setDefaultFont, drawRect, drawCenterXText, drawCenteredText, drawMiddleText, drawLine, formatThaiDate } from "./PdfUtils.js";
const BASE_URL = import.meta.env.VITE_API_URL;

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

	let date_exam = `ประจำภาคเรียนที่ ${students[0].term}`;

	if (students[0].request_type === "ขอสอบประมวลความรู้" || students[0].request_type === "ขอสอบวัดคุณสมบัติ") {
		try {
			const token = localStorage.getItem("token");
			const requestRes = await fetch(`${BASE_URL}/api/allRequestExamInfo`, {
				method: "POST",
				headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
				body: JSON.stringify({ term: students[0].term }),
			});
			const requestData = await requestRes.json();

			if (Array.isArray(requestData) && requestData.length > 0) {
				const info = requestData[0];
				const startDateRaw = info.KQ_exam_date;
				const endDateRaw = info.KQ_exam_end_date; // รับค่าวันที่สิ้นสุด

				if (startDateRaw) {
					const [d1, m1, y1] = formatThaiDate(startDateRaw);

					// กรณีมีวันที่สิ้นสุด และ วันที่สิ้นสุดไม่ตรงกับวันเริ่ม
					if (endDateRaw && endDateRaw !== startDateRaw) {
						const [d2, m2, y2] = formatThaiDate(endDateRaw);

						if (m1 === m2 && y1 === y2) {
							// กรณีเดือนเดียวกัน ปีเดียวกัน (เช่น 29 - 30 ตุลาคม 2568)
							date_exam += ` สอบวันที่ ${d1} - ${d2} ${m1} ${y1}`;
						} else {
							// กรณีคนละเดือน หรือ คนละปี (เช่น 31 ตุลาคม 2568 - 1 พฤศจิกายน 2568)
							date_exam += ` สอบวันที่ ${d1} ${m1} ${y1} - ${d2} ${m2} ${y2}`;
						}
					} else {
						// กรณีสอบวันเดียว หรือไม่มีวันที่สิ้นสุดระบุมา
						date_exam += ` สอบวันที่ ${d1} ${m1} ${y1}`;
					}
				}
			}
		} catch (e) {
			console.error("Error fetch allRequestExamInfo:", e);
		}
	}

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
		drawCenterXText(newPage, `ผล${type}`, 680, font, 16);
		drawCenterXText(newPage, `สาขาวิชา${students[0].major_name}`, 660, font, 16);
		drawCenterXText(newPage, date_exam, 640, font, 16);

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

			const nameParts = students[i].name ? students[i].name.split(/\s+/).filter(Boolean) : ["", ""];
			const firstName = nameParts[0] || "";
			const lastName = nameParts.slice(1).join(" ");
			drawMiddleText(newPage, firstName, 260, y, ROW_HEIGHT, font, 14);
			drawMiddleText(newPage, lastName, 350, y, ROW_HEIGHT, font, 14);

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
