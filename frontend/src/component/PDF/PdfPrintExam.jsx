import { Button } from "@mantine/core";
import { PDFDocument } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import { formatThaiDate, drawRect, drawLine, drawCenteredText, drawMiddleText, drawCenterXText, drawGrid } from "./PdfUtils.js";
const BASE_URL = import.meta.env.VITE_API_URL;

async function fillPdf(data, typeRQ) {
	const pdfDoc = await PDFDocument.create();
	pdfDoc.registerFontkit(fontkit);

	const fontBytes = await fetch("/fonts/THSarabunNew.ttf").then((res) => res.arrayBuffer());
	const customFont = await pdfDoc.embedFont(fontBytes);

	const logoBytes = await fetch("/images/KPRU-LOGO-line2.png").then((res) => res.arrayBuffer());
	const logoImage = await pdfDoc.embedPng(logoBytes);
	const pngDims = logoImage.scale(0.125);

	const groupedData = data.reduce((acc, student) => {
		const groupId = student.study_group_id;
		if (!acc[groupId]) acc[groupId] = [];
		acc[groupId].push(student);
		return acc;
	}, {});

	for (const groupId in groupedData) {
		const students = groupedData[groupId];
		if (students.length === 0) continue;

		const firstStudent = students[0];
		const term = firstStudent.term;

		const studentYear = parseInt(String(firstStudent.student_id).substring(0, 2), 10);
		let targetYearBook = studentYear >= 67 ? "ตั้งแต่ปี 67" : "ระหว่างปี 57-66";

		let examInfo = null;
		try {
			const token = localStorage.getItem("token");

			const requestRes = await fetch(`${BASE_URL}/api/allRequestExamInfo`, {
				method: "POST",
				headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
				body: JSON.stringify({
					term: term,
					year_book: targetYearBook,
				}),
			});
			const requestData = await requestRes.json();

			if (Array.isArray(requestData) && requestData.length > 0) {
				examInfo = requestData.find((info) => info.year_book === targetYearBook) || requestData[0];
			}
		} catch (e) {
			console.error("Error fetch examInfo:", e);
		}

		const examDates = [];

		if (typeRQ === "1") {
			if (examInfo && examInfo.KQ_exam_date) {
				if (examInfo.KQ_exam_end_date) {
					const startDate = new Date(examInfo.KQ_exam_date);
					const endDate = new Date(examInfo.KQ_exam_end_date);
					let currentDate = new Date(startDate);

					while (currentDate <= endDate) {
						examDates.push(new Date(currentDate));
						currentDate.setDate(currentDate.getDate() + 1);
					}
				} else {
					examDates.push(new Date(examInfo.KQ_exam_date));
				}
			}
		} else if (typeRQ === "2") {
			if (examInfo && examInfo.ET_exam_date) {
				examDates.push(new Date(examInfo.ET_exam_date));
			}
		}

		if (examDates.length === 0) examDates.push(null);

		const STUDENTS_PER_PAGE = 25;
		const ROW_HEIGHT = 20;
		for (const examDate of examDates) {
			let dateString;
			if (examDate) {
				const [day, month, year] = formatThaiDate(examDate);
				dateString = `สอบวันที่ ${day} ${month} ${year} เวลา............................`;
			} else {
				dateString = "สอบวันที่ ........................................ เวลา............................";
			}

			let pageIndex = 0;
			while (pageIndex * STUDENTS_PER_PAGE < students.length) {
				const newPage = pdfDoc.addPage([595, 842]);
				/* drawGrid(newPage); */
				const start = pageIndex * STUDENTS_PER_PAGE;
				const end = Math.min(start + STUDENTS_PER_PAGE, students.length);

				const centerX = (newPage.getWidth() - pngDims.width) / 2;
				newPage.drawImage(logoImage, {
					x: centerX,
					y: 700,
					width: pngDims.width,
					height: pngDims.height,
				});

				const studentInfo = students[0];
				let type;

				if (typeRQ === "3") {
					if (studentInfo.education_level === "ปริญญาโท") {
						type = "สอบโครงร่างวิทยานิพนธ์/การค้นคว้าอิสระ";
					} else {
						type = "สอบโครงร่างวิทยานิพนธ์";
					}
				} else if (typeRQ === "4") {
					if (studentInfo.education_level === "ปริญญาโท") {
						type = "สอบวิทยานิพนธ์/การค้นคว้าอิสระ";
					} else {
						type = "สอบวิทยานิพนธ์";
					}
				} else {
					type = studentInfo.request_type.split("ขอ")[1];
				}

				const programName = studentInfo.program.split(" (")[0];
				const majorHeaderLine = `${programName} สาขาวิชา${studentInfo.major_name}`;

				drawCenterXText(newPage, `รายชื่อผู้เข้า${type}`, 680, customFont, 16);
				drawCenterXText(newPage, majorHeaderLine, 660, customFont, 16);
				drawCenterXText(newPage, `ประจำภาคเรียนที่ ${studentInfo.term}`, 640, customFont, 16);
				drawCenterXText(newPage, `..................................................`, 620, customFont, 16); //ด้าน
				drawCenterXText(newPage, dateString, 600, customFont, 16);

				let y = 560;

				drawRect(newPage, 60, y, 490, ROW_HEIGHT);
				const tableHeight = (end - start) * ROW_HEIGHT;
				const bottomY = y - tableHeight;
				drawLine(newPage, 100, y + ROW_HEIGHT, 100, bottomY);
				drawLine(newPage, 170, y + ROW_HEIGHT, 170, bottomY);
				drawLine(newPage, 370, y + ROW_HEIGHT, 370, bottomY);
				drawLine(newPage, 470, y + ROW_HEIGHT, 470, bottomY);
				if (typeRQ === "3" || typeRQ === "4" /* || 1===1 */) {
					drawCenteredText(newPage, "ลำดับ", 60, y, 40, ROW_HEIGHT, customFont, 14);
					drawCenteredText(newPage, "รหัสนักศึกษา", 100, y, 70, ROW_HEIGHT, customFont, 14);
					drawCenteredText(newPage, "ชื่อ - นามสกุล", 170, y, 200, ROW_HEIGHT, customFont, 14);
					drawCenteredText(newPage, "คำขอสอบ", 370, y, 100, ROW_HEIGHT, customFont, 14);
					drawCenteredText(newPage, "ลายมือชื่อ", 470, y, 80, ROW_HEIGHT, customFont, 14);
					for (let i = start; i < end; i++) {
						y -= ROW_HEIGHT;
						drawRect(newPage, 60, y, 490, ROW_HEIGHT);
						drawCenteredText(newPage, `${i + 1}`, 60, y, 40, ROW_HEIGHT, customFont, 14);
						drawCenteredText(newPage, `${students[i].student_id}`, 100, y, 70, ROW_HEIGHT, customFont, 14);
						drawMiddleText(newPage, `${students[i].student_name.split(" ")[0]}`, 190, y, ROW_HEIGHT, customFont, 14);
						drawMiddleText(newPage, students[i].student_name.split(" ").slice(1).join(" "), 290, y, ROW_HEIGHT, customFont, 14);
						drawCenteredText(newPage, `${students[i].request_type.replace("ขอสอบ", "").trim()}`, 370, y, 100, ROW_HEIGHT, customFont, 14);
					}
				} else {
					drawCenteredText(newPage, "ลำดับ", 60, y, 40, ROW_HEIGHT, customFont, 14);
					drawCenteredText(newPage, "รหัสนักศึกษา", 100, y, 70, ROW_HEIGHT, customFont, 14);
					drawCenteredText(newPage, "ชื่อ - นามสกุล", 170, y, 200, ROW_HEIGHT, customFont, 14);
					drawCenteredText(newPage, "ลายมือชื่อ", 370, y, 100, ROW_HEIGHT, customFont, 14);
					drawCenteredText(newPage, "หมายเหตุ", 470, y, 80, ROW_HEIGHT, customFont, 14);
					for (let i = start; i < end; i++) {
						y -= ROW_HEIGHT;
						drawRect(newPage, 60, y, 490, ROW_HEIGHT);
						drawCenteredText(newPage, `${i + 1}`, 60, y, 40, ROW_HEIGHT, customFont, 14);
						drawCenteredText(newPage, `${students[i].student_id}`, 100, y, 70, ROW_HEIGHT, customFont, 14);
						drawMiddleText(newPage, `${students[i].student_name.split(" ")[0]}`, 190, y, ROW_HEIGHT, customFont, 14);
						drawMiddleText(newPage, students[i].student_name.split(" ").slice(1).join(" "), 290, y, ROW_HEIGHT, customFont, 14);
					}
				}

				pageIndex++;
			}
		}
	}

	const pdfBytes = await pdfDoc.save();
	return new Blob([pdfBytes], { type: "application/pdf" });
}

export default function SignatureForm({ data, typeRQ }) {
	const handleClick = async () => {
		if (!data || data.length === 0) {
			console.error("No data to print");
			return;
		}
		const blob = await fillPdf(data, typeRQ);
		const url = URL.createObjectURL(blob);
		window.open(url, "_blank");
	};

	return (
		<Button size="xs" color="gray" onClick={handleClick} disabled={!data || data.length === 0}>
			พิมพ์รายชื่อ
		</Button>
	);
}
