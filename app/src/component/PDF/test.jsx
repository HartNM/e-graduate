import fontkit from "@pdf-lib/fontkit";
import { PDFDocument, rgb } from "pdf-lib";

export async function buildG01Blank() {
	// 1) สร้างเอกสารและหน้า A4
	const pdfDoc = await PDFDocument.create();
    pdfDoc.registerFontkit(fontkit);
	const page = pdfDoc.addPage([595.28, 841.89]); // A4 portrait (pt)
	const { width, height } = page.getSize();

	// 2) ฝังฟอนต์ TH Sarabun New (ตามสไนป์ที่คุณให้มา)
	const fontBytes = await fetch("/fonts/THSarabunNew.ttf").then((res) => res.arrayBuffer());
	const customFont = await pdfDoc.embedFont(fontBytes);

	// 3) util วาด
	const M = 36; // margin
	const drawText = (text, x, y, size = 14, options = {}) => page.drawText(text, { x, y, size, font: customFont, color: rgb(0, 0, 0), ...options });
	const drawLine = (x1, y1, x2, y2, w = 1) => page.drawLine({ start: { x: x1, y: y1 }, end: { x: x2, y: y2 }, thickness: w, color: rgb(0, 0, 0) });
	const drawRect = (x, y, w, h, lineW = 1) => page.drawRectangle({ x, y, width: w, height: h, borderWidth: lineW, color: rgb(1, 1, 1), borderColor: rgb(0, 0, 0) });
	const drawCheckbox = (x, y, size = 10) => drawRect(x, y, size, size, 1);

	// 4) หัวกระดาษ
	let y = height - M - 10;
	drawText("คำร้องขอสอบประมวลความรู้/สอบวัดคุณสมบัติ", M, y, 20);
	y -= 24;
	drawText("มหาวิทยาลัยราชภัฏกำแพงเพชร", M, y, 16);
	y -= 20;
	drawText("วันที่................เดือน..................................พ.ศ. ..................", M, y, 14);
	y -= 18;

	drawText("เรื่อง  ขอสอบประมวลความรู้/สอบวัดคุณสมบัติ", M, y, 16);
	y -= 20;
	drawText("เรียน  ประธานคณะกรรมการบัณฑิตศึกษาประจำสาขาวิชา..............................................................", M, y, 14);

	// 5) เนื้อความนักศึกษา (เว้นว่างทั้งหมด)
	y -= 22;
	drawText("ข้าพเจ้า (นาย/นาง/นางสาว).....................................................................รหัสประจำตัวนักศึกษา...........................................", M, y, 14);
	y -= 18;
	drawText("ระดับ   □ ปริญญาโท    □ ปริญญาเอก    หลักสูตร...........................................................สาขาวิชา........................................................... คณะ..........................................................................................", M, y, 14);
	y -= 20;
	drawText("มีความประสงค์  □ ขอสอบประมวลความรู้    □ ขอสอบวัดคุณสมบัติ", M + 24, y, 14);
	y -= 22;
	drawText("ตามประกาศของมหาวิทยาลัยราชภัฏกำแพงเพชร ลงวันที่.............เดือน.......................................พ.ศ. ..................", M, y, 14);
	y -= 18;
	drawText("จึงเรียนมาเพื่อโปรดพิจารณา", M, y, 14);

	// ลายเซ็นนักศึกษา (เว้นว่าง)
	y -= 40;
	drawText("ลงชื่อ...........................................................................นักศึกษา", M + 280, y, 14);
	y -= 18;
	drawText("(..........................................................................)", M + 280, y, 14);
	y -= 18;
	drawText("วันที่..................../........................../......................", M + 280, y, 14);

	// 6) ตารางส่วนที่ 1–4 (ทุกอย่างว่าง/ไม่ติ๊ก)
	y -= 30;
	const tableX = M,
		tableY = y,
		tableW = width - M * 2,
		tableH = 280;
	drawRect(tableX, tableY - tableH, tableW, tableH); // กรอบรวม
	const midX = tableX + tableW / 2;
	const midY = tableY - tableH / 2;
	drawLine(midX, tableY, midX, tableY - tableH); // แบ่งคอลัมน์
	drawLine(tableX, midY, tableX + tableW, midY); // แบ่งแถว

	// ช่อง 1 (ซ้ายบน)
	let bx = tableX + 8,
		by = tableY - 24;
	drawText("1. ความเห็นของอาจารย์ที่ปรึกษาหมู่เรียน", bx, by, 14);
	by -= 20;
	drawCheckbox(bx, by - 10);
	drawText("เห็นควรสอบได้", bx + 14, by - 8, 13);
	by -= 18;
	drawCheckbox(bx, by - 10);
	drawText("ไม่เห็นควร เนื่องจาก.........................................................", bx + 14, by - 8, 13);
	by = midY - 40;
	drawText("ลงชื่อ............................................................อาจารย์ที่ปรึกษา", bx, by, 13);
	by -= 18;
	drawText("(................................................................)", bx, by, 13);
	by -= 18;
	drawText("วันที่ ........../................./...............", bx, by, 13);

	// ช่อง 2 (ขวาบน)
	bx = midX + 8;
	by = tableY - 24;
	drawText("2. ความเห็นประธานกรรมการบัณฑิตศึกษาประจำสาขาวิชา", bx, by, 14);
	by -= 20;
	drawCheckbox(bx, by - 10);
	drawText("อนุญาต", bx + 14, by - 8, 13);
	by -= 18;
	drawCheckbox(bx, by - 10);
	drawText("ไม่อนุญาต", bx + 14, by - 8, 13);
	by -= 26;
	drawText("ลงชื่อ...........................................................................", bx, by, 13);
	by -= 18;
	drawText("(..........................................................................)", bx, by, 13);
	by -= 18;
	drawText("ประธานกรรมการบัณฑิตศึกษาประจำสาขาวิชา    วันที่ ........../................./...............", bx, by, 12);

	// ช่อง 3 (ซ้ายล่าง)
	bx = tableX + 8;
	by = midY - 24;
	drawText("3. การตรวจสอบของสำนักส่งเสริมวิชาการและงานทะเบียน", bx, by, 14);
	by -= 20;
	drawCheckbox(bx, by - 10);
	drawText("มีสภาพการเป็นนักศึกษา ภาคเรียนที่ ......../...........", bx + 14, by - 8, 13);
	by -= 18;
	drawCheckbox(bx, by - 10);
	drawText("ลงทะเบียนเรียนครบตามหลักสูตรให้ชำระค่าธรรมเนียมที่ ฝ่ายการเงิน", bx + 14, by - 8, 13);
	by -= 18;
	drawCheckbox(bx, by - 10);
	drawText("ไม่อนุมัติ เนื่องจาก..............................................................", bx + 14, by - 8, 13);
	by -= 26;
	drawText("ลงชื่อ..........................................................................", bx, by, 13);
	by -= 18;
	drawText("(..............................................................................)", bx, by, 13);
	by -= 18;
	drawText("นายทะเบียน", bx, by, 13);

	// ช่อง 4 (ขวาล่าง)
	bx = midX + 8;
	by = midY - 24;
	drawText("4. ชำระค่าธรรมเนียมการสอบแล้ว    ภาคเรียนที่............................", bx, by, 14);
	by -= 20;
	drawCheckbox(bx, by - 10);
	drawText("ปริญญาโท จำนวน 1,000 บาท", bx + 14, by - 8, 13);
	by -= 18;
	drawCheckbox(bx, by - 10);
	drawText("ปริญญาเอก จำนวน 1,500 บาท", bx + 14, by - 8, 13);
	by -= 18;
	drawText("ตามใบเสร็จรับเงิน เล่มที่....................เลขที่.................................", bx, by, 13);
	by -= 18;
	drawText("ลงวันที่.........................................................................................", bx, by, 13);
	by -= 26;
	drawText("ลงชื่อ..........................................................................", bx, by, 13);
	by -= 18;
	drawText("(..........................................................................)", bx, by, 13);
	by -= 18;
	drawText("เจ้าหน้าที่การเงิน", bx, by, 13);

	// 7) คืนเป็น Blob (หรือจะ return Uint8Array ก็ได้)
	const pdfBytes = await pdfDoc.save();
	return new Blob([pdfBytes], { type: "application/pdf" });
}

/* const drawItems = [
		{ text: request_exam_date_day, x: 360, y: 720 },
		{ text: request_exam_date_month, x: 430, y: 720 },
		{ text: request_exam_date_year, x: 510, y: 720 },
		{ text: data?.major_name, x: 300, y: 671 },
		{ text: data?.student_name, x: 220, y: 637 },
		{ text: data?.student_id, x: 460, y: 637 },
		{ text: "✓", x: data?.education_level === "ปริญญาโท" ? 88 : 145, y: 615, font: customFontNoto },
		{ text: data?.program, x: 250, y: 618 },
		{ text: data?.major_name, x: 420, y: 618 },
		{ text: data?.faculty_name, x: 90, y: 600 },
		{ text: "✓", x: data?.education_level === "ปริญญาโท" ? 348 : 450, y: 596, font: customFontNoto },
		{ text: "day", x: 280, y: 580 },
		{ text: "month", x: 330, y: 580 },
		{ text: "year", x: 430, y: 580 },
		{ text: data?.student_name, x: 370, y: 500 },
		{ text: data?.student_name, x: 370, y: 481 },
		{ text: request_exam_date_day, x: 360, y: 463 },
		{ text: request_exam_date_month, x: 420, y: 463 },
		{ text: request_exam_date_year, x: 470, y: 463 },

		{ text: "✓", x: 76, y: data?.advisor_approvals ? 403 : 383, font: customFontNoto, show: typeof data?.advisor_approvals === "boolean" },
		{ text: data?.comment, x: 80, y: 369, show: typeof data?.advisor_approvals === "boolean" && !data.advisor_approvals },
		{ text: data?.advisor_approvals_name, x: 110, y: 350 },
		{ text: data?.advisor_approvals_name, x: 110, y: 330 },
		{ text: advisor_approvals_date_day, x: 110, y: 311 },
		{ text: advisor_approvals_date_month, x: 145, y: 311 },
		{ text: advisor_approvals_date_year, x: 180, y: 311 },

		{ text: "✓", x: data?.chairpersons_approvals ? 342 : 389, y: 403, font: customFontNoto, show: typeof data?.chairpersons_approvals === "boolean" },
		{ text: "เนื่องจาก........................................................................", x: 333, y: 384 },
		{ text: data?.comment, x: 370, y: 386, show: typeof data?.chairpersons_approvals === "boolean" && !data.chairpersons_approvals },
		{ text: data?.chairpersons_approvals_name, x: 390, y: 370 },
		{ text: data?.chairpersons_approvals_name, x: 390, y: 350 },
		{ text: chairpersons_approvals_date_day, x: 410, y: 311 },
		{ text: chairpersons_approvals_date_month, x: 440, y: 311 },
		{ text: chairpersons_approvals_date_year, x: 480, y: 311 },

		{ text: "✓", x: 76, y: 271, font: customFontNoto, show: data?.registrar_approvals === true },
		{ text: "3", x: 230, y: 273, show: data?.registrar_approvals === true },
		{ text: "2568", x: 250, y: 273, show: data?.registrar_approvals === true },
		{ text: "✓", x: 76, y: data?.registrar_approvals ? 252 : 215, font: customFontNoto, show: typeof data?.registrar_approvals === "boolean" },
		{ text: data?.comment, x: 165, y: 217, show: typeof data?.registrar_approvals === "boolean" && !data.registrar_approvals },
		{ text: data?.registrar_approvals_name, x: 140, y: 180 },
		{ text: data?.registrar_approvals_name, x: 140, y: 161 },

		{ text: "3/2568", x: 490, y: 292, show: data?.receipt_vol_No !== null },
		{ text: "✓", x: data?.education_level === "ปริญญาโท" ? 337 : 336, y: data?.education_level === "ปริญญาโท" ? 271 : 252, font: customFontNoto, show: data?.receipt_vol_No != null },
		{ text: "1", x: 420, y: 236, show: data?.receipt_vol_No !== null },
		{ text: "25", x: 490, y: 236, show: data?.receipt_vol_No !== null },
		{ text: `${receipt_pay_date_day}/${receipt_pay_date_month}/${receipt_pay_date_year}`, x: 380, y: 217, show: data?.receipt_vol_No !== null },
		{ text: "นายณัฐวุฒิ มาตกาง", x: 400, y: 180, show: data?.receipt_vol_No !== null },
		{ text: "นายณัฐวุฒิ มาตกาง", x: 400, y: 161, show: data?.receipt_vol_No !== null },
	];

	const draw = (text, x, y, font = customFont, size = 14) => {
		if (text !== undefined && text !== null) {
			firstPage.drawText(String(text), { x, y, size, font });
		}
	};
	drawItems.filter((item) => item.show !== false).forEach((item) => draw(item.text, item.x, item.y, item.font, item.size)); */