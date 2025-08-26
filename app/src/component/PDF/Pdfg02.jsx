import fontkit from "@pdf-lib/fontkit";
import { PDFDocument, rgb } from "pdf-lib";
import { Button } from "@mantine/core";

async function fillPdf(data, Exam_date) {
	const existingPdfBytes = await fetch("/pdf/g02.pdf").then((res) => res.arrayBuffer());
	const pdfDoc = await PDFDocument.load(existingPdfBytes);
	pdfDoc.registerFontkit(fontkit);

	const fontBytes = await fetch("/fonts/THSarabunNew.ttf").then((res) => res.arrayBuffer());
	const customFont = await pdfDoc.embedFont(fontBytes);
	const fontBytesBold = await fetch("/fonts/THSarabunNew Bold.ttf").then((res) => res.arrayBuffer());
	const customFontBold = await pdfDoc.embedFont(fontBytesBold);
	const fontBytesNoto = await fetch("/fonts/DejaVuSans.ttf").then((r) => r.arrayBuffer());
	const customFontNoto = await pdfDoc.embedFont(fontBytesNoto);

	const pages = pdfDoc.getPages();
	const firstPage = pages[0];
	/* ------------------------------------------------------------------------------------------------------------------------- */
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
	/* ------------------------------------------------------------------------------------------------------------------------- */
	const draw = (page, text, x, y, font = customFont, size = 14) => {
		if (text !== undefined && text !== null) {
			page.drawText(String(text), { x, y, size, font });
		}
	};

	const drawRect = (page, x, y, w, h, lineW = 0) => {
		page.drawRectangle({ x, y, width: w, height: h, borderWidth: lineW, color: rgb(1, 1, 1), borderColor: rgb(0, 0, 0) });
	};

	const drawCenterXText = (page, text, y, font, size = 14) => {
		if (text !== undefined && text !== null) {
			const pageWidth = page.getWidth();
			const textWidth = font.widthOfTextAtSize(text, size);
			const x = (pageWidth - textWidth) / 2;
			page.drawText(text, { x, y, size, font });
		}
	};

	function formatThaiDate(dateStr) {
		if (!dateStr) return ["", "", ""];
		const months = ["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"];
		const [year, month, day] = dateStr.split("-").map(Number);
		const thaiMonth = months[month - 1];
		return [day, thaiMonth, year];
	}

	function formatThaiDateShort(dateStr) {
		if (!dateStr) return ["", "", ""];
		const monthsShort = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
		const [year, month, day] = dateStr.split("-").map(Number);
		const thaiMonthShort = monthsShort[month - 1];
		return [day, thaiMonthShort, year];
	}

	const [request_exam_date_day, request_exam_date_month, request_exam_date_year] = formatThaiDate(data?.request_exam_date);
	const [exam_date_day, exam_date_month, exam_date_year] = formatThaiDate(Exam_date);
	const [advisor_approvals_date_day, advisor_approvals_date_month, advisor_approvals_date_year] = formatThaiDateShort(data?.advisor_approvals_date);
	const [chairpersons_approvals_date_day, chairpersons_approvals_date_month, chairpersons_approvals_date_year] = formatThaiDateShort(data?.chairpersons_approvals_date);
	const [receipt_pay_date_day, receipt_pay_date_month, receipt_pay_date_year] = formatThaiDate(data?.receipt_pay_date);

	const drawItems = [
		{ text: request_exam_date_day, x: 340, y: 693 },
		{ text: request_exam_date_month, x: 405, y: 693 },
		{ text: request_exam_date_year, x: 490, y: 693 },

		{ text: "ข้าพเจ้า..................................................................................รหัสประจำตัวนักศึกษา...................................................", x: 108, y: 601 },
		{ text: data?.student_name, x: 180, y: 603 },
		{ text: data?.student_id, x: 430, y: 603 },
		{ text: "ระดับ.........................หลักสูตร............................................................................สาขาวิชา...........................................................", x: 72, y: 581 },
		{ text: data?.education_level, x: 100, y: 583 },
		{ text: data?.program, x: 190, y: 583 },
		{ text: data?.major_name, x: 400, y: 583 },
		{ text: "คณะ.........................................................................................มีความประสงค์............................................................................", x: 72, y: 563 },
		{ text: data?.faculty_name, x: 110, y: 565 },
		{ text: "ขอทดสอบความรู้ทางภาษาอังกฤษ", x: 360, y: 565 },
		{ text: "ในภาคเรียนที่............................วันที่สอบ....................................................................", x: 72, y: 544 },
		{ text: data?.term, x: 140, y: 546 },
		{ text: exam_date_day, x: 240, y: 546 },
		{ text: exam_date_month, x: 260, y: 546 },
		{ text: exam_date_year + 543, x: 300, y: 546 },

		{ text: data?.student_name, x: 370, y: 492 },
		{ text: data?.student_name, x: 370, y: 472 },
		{ text: request_exam_date_day, x: 350, y: 453 },
		{ text: request_exam_date_month, x: 400, y: 453 },
		{ text: request_exam_date_year, x: 460, y: 453 },

		{ text: data?.advisor_approvals ? "เห็นควรสอบได้" : "ไม่เห็นควร", x: 60, y: 394, show: typeof data?.advisor_approvals === "boolean" },
		{ text: "เนื่องจาก..................................................................................", x: 60, y: 376, show: typeof data?.advisor_approvals === "boolean" && !data.advisor_approvals },
		{ text: " data?.comment", x: 110, y: 378, show: typeof data?.advisor_approvals === "boolean" && !data.advisor_approvals },
		{ text: data?.advisor_approvals_id, x: 90, y: 341 },
		{ text: data?.advisor_approvals_id, x: 90, y: 322 },
		{ text: advisor_approvals_date_day, x: 95, y: 303 },
		{ text: advisor_approvals_date_month, x: 130, y: 303 },
		{ text: advisor_approvals_date_year, x: 165, y: 303 },

		{ text: data?.chairpersons_approvals ? "เห็นควรสอบได้" : "ไม่เห็นควร", x: 320, y: 394, show: typeof data?.chairpersons_approvals === "boolean" },
		{ text: "เนื่องจาก.............................................................................", x: 320, y: 376, show: typeof data?.chairpersons_approvals === "boolean" && !data.chairpersons_approvals },
		{ text: "data?.comment", x: 360, y: 378, show: typeof data?.chairpersons_approvals === "boolean" && !data.chairpersons_approvals },
		{ text: data?.chairpersons_approvals_id, x: 400, y: 360 },
		{ text: data?.chairpersons_approvals_id, x: 400, y: 341 },
		{ text: chairpersons_approvals_date_day, x: 390, y: 303 },
		{ text: chairpersons_approvals_date_month, x: 420, y: 303 },
		{ text: chairpersons_approvals_date_year, x: 460, y: 303 },

		{ text: `มีสภาพการเป็นนักศึกษา ภาคเรียนที่ ${data?.term}`, x: 60, y: 261, show: typeof data?.registrar_approvals === "boolean" && data?.registrar_approvals },
		{ text: "ลงทะเบียนเรียนครบตามหลักสูตร", x: 60, y: 242, show: typeof data?.registrar_approvals === "boolean" && data?.registrar_approvals },
		{ text: "ให้ชำระค่าธรรมเนียมที่ฝ่ายการเงิน", x: 60, y: 223, show: typeof data?.registrar_approvals === "boolean" && data?.registrar_approvals },
		{ text: "ไม่เห็นควร", x: 60, y: 261, show: typeof data?.registrar_approvals === "boolean" && !data?.registrar_approvals },
		{ text: "เนื่องจาก............................................................................", x: 60, y: 242, show: typeof data?.registrar_approvals === "boolean" && !data?.registrar_approvals },
		{ text: "data?.comment", x: 100, y: 244, show: !data.registrar_approvals },
		{ text: data?.registrar_approvals_id, x: 120, y: 171 },
		{ text: data?.registrar_approvals_id, x: 120, y: 153 },

		{ text: "1", x: 420, y: 265, show: data?.receipt_vol_No !== null },
		{ text: "25", x: 490, y: 265, show: data?.receipt_vol_No !== null },
		{ text: `${receipt_pay_date_day} ${receipt_pay_date_month} ${receipt_pay_date_year}`, x: 380, y: 247, show: data?.receipt_vol_No !== null },
		{ text: "นายณัฐวุฒิ มาตกาง", x: 400, y: 210, show: data?.receipt_vol_No !== null },
		{ text: "นายณัฐวุฒิ มาตกาง", x: 400, y: 191, show: data?.receipt_vol_No !== null },
	];

	drawItems.filter((item) => item.show !== false).forEach((item) => draw(firstPage, item.text, item.x, item.y, item.font, item.size));

	if (typeof data?.advisor_approvals !== "boolean") {
		drawRect(firstPage, 30, 290, 280, 140);
	}
	if (typeof data?.chairpersons_approvals !== "boolean") {
		drawRect(firstPage, 302.5, 290, 260, 140);
	}
	if (typeof data?.registrar_approvals !== "boolean") {
		drawRect(firstPage, 30, 120, 280, 173.5);
	}
	if (data?.receipt_vol_No === null) {
		drawRect(firstPage, 302.5, 120, 260, 173.5);
	}

	drawGrid(firstPage);

	const pdfBytes = await pdfDoc.save();
	return new Blob([pdfBytes], { type: "application/pdf" });
}

export default function Pdfg02({ data, showType, exam_date }) {
	const handleOpen = async () => {
		const blob = await fillPdf(data, exam_date);
		const url = URL.createObjectURL(blob);
		window.open(url, "_blank");
	};

	const handlePrint = async () => {
		const blob = await fillPdf(data, exam_date);
		const url = URL.createObjectURL(blob);

		const iframe = document.createElement("iframe");
		iframe.style.display = "none";
		iframe.src = url;
		document.body.appendChild(iframe);
		iframe.onload = () => {
			iframe.contentWindow.print();
		};
	};
	return (
		<>
			{showType === "view" ? (
				<Button size="xs" color="gray" onClick={handleOpen}>
					ข้อมูล
				</Button>
			) : (
				<Button size="xs" color="blue" onClick={handlePrint}>
					พิมพ์
				</Button>
			)}
		</>
	);
}
