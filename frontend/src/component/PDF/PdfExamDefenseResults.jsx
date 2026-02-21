import { PDFDocument, rgb } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import { setDefaultFont, drawRect, drawCenterXText, drawCenteredText, drawMiddleText, drawLine, formatThaiDate, drawGrid } from "./PdfUtils.js";

async function fillPdf(students) {
	const pdfDoc = await PDFDocument.create();
	pdfDoc.registerFontkit(fontkit);

	// โหลดฟอนต์ (สมมติว่าฟังก์ชันนี้ return font object)
	const font = await setDefaultFont(pdfDoc);

	const logoBytes = await fetch("/images/KPRU-LOGO-line2.png").then((res) => res.arrayBuffer());
	const logoImage = await pdfDoc.embedPng(logoBytes);
	const pngDims = logoImage.scale(0.125);

	const isAllThesis = students.every((s) => s.request_type && s.request_type.includes("วิทยานิพนธ์"));
	const isAllIS = students.every((s) => s.request_type && s.request_type.includes("การค้นคว้าอิสระ"));
	let titleType = "วิทยานิพนธ์/การค้นคว้าอิสระ";
	if (isAllThesis) {
		titleType = "วิทยานิพนธ์";
	} else if (isAllIS) {
		titleType = "การค้นคว้าอิสระ";
	}

	const STUDENTS_PER_PAGE = 25;
	const ROW_HEIGHT = 20;
	let pageIndex = 0;

	// กำหนดตำแหน่ง X และความกว้างของแต่ละคอลัมน์ใหม่ เพื่อให้พอดีกับหน้ากระดาษ (Total Width = 490)
	// เริ่มต้น X = 60
	const col = {
		no: { x: 60, w: 35 }, // ลำดับ
		id: { x: 95, w: 70 }, // รหัสนักศึกษา (เริ่ม 60+35)
		name: { x: 165, w: 155 }, // ชื่อ-สกุล (เริ่ม 95+70)
		type: { x: 320, w: 80 }, // คำขอสอบ (เริ่ม 165+155)
		result: { x: 400, w: 60 }, // ผลสอบ (เริ่ม 320+80)
		date: { x: 460, w: 90 }, // วันที่สอบ (เริ่ม 400+60) -> จบที่ 550
	};

	let date_exam = `ประจำภาคเรียนที่ ${students[0].term}`;

	while (pageIndex * STUDENTS_PER_PAGE < students.length) {
		// สร้างหน้าใหม่ถ้าไม่ใช่หน้าแรก
		let newPage;
		if (pageIndex === 0 && pdfDoc.getPageCount() > 0) {
			newPage = pdfDoc.getPages()[0];
		} else {
			newPage = pdfDoc.addPage([595, 842]);
		}

		const start = pageIndex * STUDENTS_PER_PAGE;
		const end = Math.min(start + STUDENTS_PER_PAGE, students.length);

		const centerX = (newPage.getWidth() - pngDims.width) / 2;
		newPage.drawImage(logoImage, {
			x: centerX,
			y: 700,
			width: pngDims.width,
			height: pngDims.height,
		});

		let y = 600;
		drawCenterXText(newPage, `ผลการสอบโครงร่าง${titleType}`, 680, font, 16);
		drawCenterXText(newPage, `สาขาวิชา${students[0].major_name}`, 660, font, 16);
		drawCenterXText(newPage, date_exam, 640, font, 16);

		// คำนวณความสูงของตาราง
		const tableHeight = (end - start) * ROW_HEIGHT;
		const bottomY = y - tableHeight;

		// วาดกรอบหัวตาราง
		drawRect(newPage, 60, y, 490, ROW_HEIGHT);

		// วาดเส้นแบ่งคอลัมน์ (แนวตั้ง) ยาวลงไปถึงด้านล่างของตาราง
		drawLine(newPage, col.id.x, y + ROW_HEIGHT, col.id.x, bottomY); // หลังลำดับ
		drawLine(newPage, col.name.x, y + ROW_HEIGHT, col.name.x, bottomY); // หลังรหัส
		drawLine(newPage, col.type.x, y + ROW_HEIGHT, col.type.x, bottomY); // หลังชื่อ
		drawLine(newPage, col.result.x, y + ROW_HEIGHT, col.result.x, bottomY); // หลังคำขอ
		drawLine(newPage, col.date.x, y + ROW_HEIGHT, col.date.x, bottomY); // หลังผลสอบ (เส้นใหม่)

		// วาดข้อความหัวตาราง
		drawCenteredText(newPage, "ลำดับ", col.no.x, y, col.no.w, ROW_HEIGHT, font, 14);
		drawCenteredText(newPage, "รหัสนักศึกษา", col.id.x, y, col.id.w, ROW_HEIGHT, font, 14);
		drawCenteredText(newPage, "ชื่อ - นามสกุล", col.name.x, y, col.name.w, ROW_HEIGHT, font, 14);
		drawCenteredText(newPage, "คำขอสอบ", col.type.x, y, col.type.w, ROW_HEIGHT, font, 14);
		drawCenteredText(newPage, "ผลการสอบ", col.result.x, y, col.result.w, ROW_HEIGHT, font, 14);
		drawCenteredText(newPage, "วันที่สอบ", col.date.x, y, col.date.w, ROW_HEIGHT, font, 14); // เพิ่มหัวข้อใหม่

		for (let i = start; i < end; i++) {
			y -= ROW_HEIGHT;
			drawRect(newPage, 60, y, 490, ROW_HEIGHT); // กรอบของแถว

			// 1. ลำดับ
			drawCenteredText(newPage, `${i + 1}`, col.no.x, y, col.no.w, ROW_HEIGHT, font, 14);

			// 2. รหัส
			drawCenteredText(newPage, `${students[i].student_id}`, col.id.x, y, col.id.w, ROW_HEIGHT, font, 14);

			// 3. ชื่อ-สกุล (ปรับตำแหน่ง split ชื่อให้เหมาะสมกับความกว้างใหม่)
			const nameParts = students[i].name ? students[i].name.split(/\s+/).filter(Boolean) : ["", ""];
			const firstName = nameParts[0] || "";
			const lastName = nameParts.slice(1).join(" ");
			// ปรับ offset การวางชื่อเล็กน้อย
			drawMiddleText(newPage, firstName, col.name.x + 10, y, ROW_HEIGHT, font, 14);
			drawMiddleText(newPage, lastName, col.name.x + 80, y, ROW_HEIGHT, font, 14);

			// 4. คำขอสอบ
			drawCenteredText(newPage, `${students[i].request_type.replace("ขอสอบ", "").trim()}`, col.type.x, y, col.type.w, ROW_HEIGHT, font, 14);

			// 5. ผลสอบ
			if (students[i].exam_results !== null && students[i].exam_results !== undefined) {
				drawCenteredText(newPage, students[i].exam_results, col.result.x, y, col.result.w, ROW_HEIGHT, font, 14);
			}

			// 6. วันที่สอบ (ใหม่)
			let dateStr = "-";
			if (students[i].thesis_exam_date) {
				const d = new Date(students[i].thesis_exam_date);
				const day = String(d.getDate()).padStart(2, "0");
				const month = String(d.getMonth() + 1).padStart(2, "0");
				const year = d.getFullYear() + 543; // พ.ศ.
				dateStr = `${day}/${month}/${year}`;
			}
			drawCenteredText(newPage, dateStr, col.date.x, y, col.date.w, ROW_HEIGHT, font, 14);
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
