import { Button } from "@mantine/core";
import { PDFDocument, rgb } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import { formatThaiDate, drawGrid, drawRect, drawLine, drawCenteredText, drawMiddleText, drawCenterXText } from "./PdfUtils.js";
const BASE_URL = import.meta.env.VITE_API_URL;

async function fillPdf(templateUrl, data) {
	// data ตอนนี้เป็น Array [ {..}, {..} ]
	// --- 1. ส่วน Setup ---
	const templateBytes = await fetch(templateUrl).then((res) => res.arrayBuffer());
	const templateDoc = await PDFDocument.load(templateBytes);
	templateDoc.registerFontkit(fontkit);
	const pdfDoc = await PDFDocument.create();
	pdfDoc.registerFontkit(fontkit);

	const fontBytes = await fetch("/fonts/THSarabunNew.ttf").then((res) => res.arrayBuffer());
	const customFont = await pdfDoc.embedFont(fontBytes);

	const logoBytes = await fetch("/icons/KPRU-LOGO-line2.png").then((res) => res.arrayBuffer());
	const logoImage = await pdfDoc.embedPng(logoBytes);
	const pngDims = logoImage.scale(0.125); // --- 2. ดึง term จาก data (ที่เป็น array) ---

	const term = data?.[0]?.term; // --- 3. จัดกลุ่มข้อมูล data ที่รับมา ---

	const groupedData = data.reduce((acc, student) => {
		const groupId = student.study_group_id;
		if (!acc[groupId]) {
			acc[groupId] = [];
		}
		acc[groupId].push(student);
		return acc;
	}, {}); // --- 4. ดึงข้อมูล Exam Info ---

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
	} // --- 5. สร้างรายการวันที่สอบ (examDates) ---

	const examDates = [];
	if (examInfo && examInfo.KQ_exam_date && examInfo.KQ_exam_end_date) {
		const startDate = new Date(examInfo.KQ_exam_date);
		const endDate = new Date(examInfo.KQ_exam_end_date);
		let currentDate = new Date(startDate.getTime());
		while (currentDate <= endDate) {
			examDates.push(new Date(currentDate));
			currentDate.setDate(currentDate.getDate() + 1);
		}
	} else if (examInfo && examInfo.KQ_exam_date) {
		examDates.push(new Date(examInfo.KQ_exam_date));
	}
	if (examDates.length === 0) {
		examDates.push(null);
	}

	const STUDENTS_PER_PAGE = 25;
	const ROW_HEIGHT = 20; // --- 6. ลูปหลัก (วนตามกลุ่มที่จัดใหม่) ---

	for (const groupId in groupedData) {
		const students = groupedData[groupId]; // วนลูปตามจำนวนวันที่สอบ

		for (const examDate of examDates) {
			// --- สร้าง dateString ---
			let dateString;
			if (examDate) {
				const [day, month, year] = formatThaiDate(examDate);
				dateString = `สอบวันที่ ${day} ${month} ${year} เวลา............................`;
			} else {
				dateString = "สอบวันที่ ........................................ เวลา............................";
			} // --- ลูปแบ่งหน้า (Pagination) ---

			let pageIndex = 0;
			while (pageIndex * STUDENTS_PER_PAGE < students.length) {
				const [newPage] = await pdfDoc.copyPages(templateDoc, [0]);
				pdfDoc.addPage(newPage);
				const start = pageIndex * STUDENTS_PER_PAGE;
				const end = Math.min(start + STUDENTS_PER_PAGE, students.length); // --- วาดโลโก้ ---

				const centerX = (newPage.getWidth() - pngDims.width) / 2;
				newPage.drawImage(logoImage, {
					x: centerX,
					y: 700,
					width: pngDims.width,
					height: pngDims.height,
				});

				// --- 7. ⬇️ (แก้ไข) สร้าง Header ที่ใช้ร่วมกัน ---
				const studentInfo = students[0];
				const type = studentInfo.request_type.split("ขอ")[1];

				// ดึงชื่อหลักสูตร (เช่น "ปรัชญาดุษฎีบัณฑิต")
				const programName = studentInfo.program.split(" (")[0];

				// สร้างบรรทัด
				const majorHeaderLine = `${programName} สาขาวิชา${studentInfo.major_name}`;

				// คำนวณรุ่น
				const cohort = parseInt(studentInfo.student_id.slice(0, 2), 10) - 57;
				let y;
				if (type === "สอบประมวลความรู้") {
					drawCenterXText(newPage, `รายชื่อผู้เข้า${type}`, 680, customFont, 16);
					drawCenterXText(newPage, majorHeaderLine, 660, customFont, 16);
					drawCenterXText(newPage, `ประจำภาคเรียนที่ ${studentInfo.term}`, 640, customFont, 16);
					drawCenterXText(newPage, `หมวด..........................................`, 620, customFont, 16);
					drawCenterXText(newPage, dateString, 600, customFont, 16);
					y = 560;
				} else {
					drawCenterXText(newPage, `รายชื่อผู้เข้า${type}`, 680, customFont, 16);
					drawCenterXText(newPage, majorHeaderLine /* `${majorHeaderLine} รุ่นที่ ${cohort}` */, 660, customFont, 16);
					/* drawCenterXText(newPage, `มหาวิทยาลัยราชภัฏกําแพงเพชร`, 660, customFont, 16); */
					drawCenterXText(newPage, `ประจำภาคเรียนที่ ${studentInfo.term}`, 640, customFont, 16);
					drawCenterXText(newPage, `ด้าน..................................................`, 620, customFont, 16);
					drawCenterXText(newPage, dateString, 600, customFont, 16);
					y = 560;
				}

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

				// --- วาดข้อมูลนักศึกษา ---
				for (let i = start; i < end; i++) {
					y -= ROW_HEIGHT;
					drawRect(newPage, 60, y, 490, ROW_HEIGHT);
					drawCenteredText(newPage, `${i + 1}`, 60, y, 40, ROW_HEIGHT, customFont, 14);
					drawCenteredText(newPage, `${students[i].student_id}`, 100, y, 70, ROW_HEIGHT, customFont, 14);
					drawMiddleText(newPage, `${students[i].student_name.split(" ")[0]}`, 190, y, ROW_HEIGHT, customFont, 14);
					drawMiddleText(newPage, students[i].student_name.split(" ").slice(1).join(" "), 290, y, ROW_HEIGHT, customFont, 14);
				}
				pageIndex++;
			}
		} // ⬅️ สิ้นสุดลูปของ examDates
	} // ⬅️ สิ้นสุดลูปของ groupedData

	const pdfBytes = await pdfDoc.save();
	return new Blob([pdfBytes], { type: "application/pdf" });
}

export default function SignatureForm({ data }) {
	// data ควรเป็น Array [ {..}, {..} ]
	const handleClick = async () => {
		if (!data || data.length === 0) {
			console.error("No data to print");
			return;
		}
		const blob = await fillPdf("/pdf/blank.pdf", data);
		const url = URL.createObjectURL(blob);
		window.open(url, "_blank");
	};

	return (
		<Button size="xs" color="gray" onClick={handleClick} disabled={!data || data.length === 0}>
			พิมพ์รายชื่อ
		</Button>
	);
}
