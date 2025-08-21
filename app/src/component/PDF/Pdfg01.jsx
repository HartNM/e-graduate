import fontkit from "@pdf-lib/fontkit";
import { PDFDocument, rgb } from "pdf-lib";
import { Button } from "@mantine/core";

async function fillPdf(templateUrl, data, Exam_date) {
	const existingPdfBytes = await fetch(templateUrl).then((res) => res.arrayBuffer());
	const pdfDoc = await PDFDocument.load(existingPdfBytes);
	pdfDoc.registerFontkit(fontkit);

	const fontBytes = await fetch("/fonts/THSarabunNew.ttf").then((res) => res.arrayBuffer());
	const customFont = await pdfDoc.embedFont(fontBytes);
	const fontBytesNoto = await fetch("/fonts/DejaVuSans.ttf").then((r) => r.arrayBuffer());
	const customFontNoto = await pdfDoc.embedFont(fontBytesNoto);

	const pages = pdfDoc.getPages();
	const firstPage = pages[0];

	const drawText = (page, text, x, y, font = customFont, size = 14) => {
		if (text !== undefined && text !== null) {
			page.drawText(String(text), { x, y, size, font });
		}
	};
	const drawRect = (page, x, y, w, h, lineW = 1) => {
		page.drawRectangle({ x, y, width: w, height: h, borderWidth: lineW, borderColor: rgb(0, 0, 0) });
	};
	const drawLine = (page, x1, y1, x2, y2, w = 1) => page.drawLine({ start: { x: x1, y: y1 }, end: { x: x2, y: y2 }, thickness: w, color: rgb(0, 0, 0) });

	const drawCenteredText = (page, text, x, y, width, height, font, size = 14) => {
		const textWidth = font.widthOfTextAtSize(text, size);
		const textHeight = size; // approximate

		const centerX = x + (width - textWidth) / 2;
		// ปรับ y ให้ baseline อยู่กลางกล่อง
		const centerY = y + (height - textHeight) / 2 + size * 0.3;

		page.drawText(text, { x: centerX, y: centerY, size, font });
	};

	const drawMiddleText = (page, text, x, y, height, font, size = 14) => {
		if (!text) return;
		const textHeight = size; // ประมาณความสูงฟอนต์
		const centerY = y + (height - textHeight) / 2 + size * 0.3; // baseline ให้อยู่กลาง
		page.drawText(text, { x, y: centerY, size, font });
	};

	const drawCenterXText = (page, text, y, font, size = 14) => {
		if (!text) return;
		const pageWidth = page.getWidth();
		const textWidth = font.widthOfTextAtSize(text, size);
		const x = (pageWidth - textWidth) / 2;
		page.drawText(text, { x, y, size, font });
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
	const [registrar_approvals_date_day, registrar_approvals_date_month, registrar_approvals_date_year] = formatThaiDateShort(data?.registrar_approvals_date);
	const [receipt_pay_date_day, receipt_pay_date_month, receipt_pay_date_year] = formatThaiDateShort(data?.receipt_pay_date);

	console.log(data);

	drawCenterXText(firstPage, `คำร้อง${data?.request_type}`, 780, customFont, 24);
	drawText(firstPage, `มหาวิทยาลัยราชภัฏกำแพงเพชร`, 427, 737, customFont, 14);
	drawText(firstPage, `วันที่ ${request_exam_date_day} เดือน ${request_exam_date_month} พ.ศ. ${request_exam_date_year}`, 410, 719, customFont, 14);
	drawText(firstPage, data?.request_type, 99, 687, customFont, 14);
	drawText(firstPage, `ประธานคณะกรรมการบัณฑิตศึกษาประจำสาขาวิชา${data?.major_name}`, 99, 669, customFont, 14);

	drawText(firstPage, `ข้าพเจ้า................................................................................................รหัสประจำตัวนักศึกษา.................................................`, 99, 634, customFont, 14);
	drawText(firstPage, `ระดับ.......................................................หลักสูตร...........................................................สาขาวิชา..............................................................`, 63, 615, customFont, 14);
	drawText(firstPage, `คณะ..........................................................................................มีความประสงค์........................................................................................`, 63, 596, customFont, 14);
	drawText(firstPage, `ในภาคเรียนที่......................................วันที่สอบ..........................................................`, 63, 577, customFont, 14);

	const drawItems = [
		{ text: data?.student_name, x: 200, y: 637 },
		{ text: data?.student_id, x: 460, y: 637 },
		{ text: data?.education_level, x: 120, y: 618 },
		{ text: data?.program, x: 250, y: 618 },
		{ text: data?.major_name, x: 420, y: 618 },
		{ text: data?.faculty_name, x: 100, y: 600 },
		{ text: data?.request_type, x: 370, y: 600 },
		{ text: data?.term, x: 140, y: 580 },
		{ text: exam_date_day, x: 240, y: 580 },
		{ text: exam_date_month, x: 260, y: 580 },
		{ text: exam_date_year, x: 300, y: 580 },

		{ text: data?.student_name, x: 370, y: 500 },
		{ text: data?.student_name, x: 370, y: 481 },
		{ text: request_exam_date_day, x: 360, y: 463 },
		{ text: request_exam_date_month, x: 410, y: 463 },
		{ text: request_exam_date_year, x: 470, y: 463 },

		{ text: data?.advisor_approvals ? "เห็นควรสอบได้" : "ไม่เห็นควร", x: 70, y: 403, show: typeof data?.advisor_approvals === "boolean" },
		{ text: "เนื่องจาก...................................................................................", x: 70, y: 384, show: typeof data?.advisor_approvals === "boolean" && !data.advisor_approvals },
		{ text: data?.comment, x: 80, y: 386, show: typeof data?.advisor_approvals === "boolean" && !data.advisor_approvals },
		{ text: data?.advisor_approvals_name, x: 110, y: 350 },
		{ text: data?.advisor_approvals_name, x: 110, y: 330 },
		{ text: advisor_approvals_date_day, x: 110, y: 311 },
		{ text: advisor_approvals_date_month, x: 145, y: 311 },
		{ text: advisor_approvals_date_year, x: 180, y: 311 },

		{ text: data?.advisor_approvals ? "เห็นควรสอบได้" : "ไม่เห็นควร", x: 320, y: 403, show: typeof data?.chairpersons_approvals === "boolean" },
		{ text: "เนื่องจาก........................................................................", x: 320, y: 384, show: typeof data?.chairpersons_approvals === "boolean" && !data.chairpersons_approvals },
		{ text: data?.comment, x: 370, y: 386, show: typeof data?.chairpersons_approvals === "boolean" && !data.chairpersons_approvals },
		{ text: data?.chairpersons_approvals_name, x: 390, y: 370 },
		{ text: data?.chairpersons_approvals_name, x: 390, y: 350 },
		{ text: chairpersons_approvals_date_day, x: 410, y: 311 },
		{ text: chairpersons_approvals_date_month, x: 440, y: 311 },
		{ text: chairpersons_approvals_date_year, x: 480, y: 311 },

		{ text: `มีสภาพการเป็นนักศึกษา ภาคเรียนที่ ${data?.term}`, x: 70, y: 271, show: data?.registrar_approvals === true },
		{ text: "ลงทะเบียนเรียนครบตามหลักสูตรให้ชำระค่าธรรมเนียมที่ฝ่ายการเงิน", x: 70, y: 252, show: data?.registrar_approvals === true },

		{ text: "ไม่เห็นควร", x: 76, y: data?.registrar_approvals ? 252 : 215, show: data?.registrar_approvals === false },
		{ text: "เนื่องจาก........................................................................", x: 320, y: 384, show: data?.registrar_approvals === true },

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
	drawItems.filter((item) => item.show !== false).forEach((item) => draw(item.text, item.x, item.y, item.font, item.size));

	/* -------------------------------------------------------------------------------------------- */
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
	drawGrid(firstPage);
	/* -------------------------------------------------------------------------------------------- */
	const pdfBytes = await pdfDoc.save();
	return new Blob([pdfBytes], { type: "application/pdf" });
}

export default function Pdfg01({ data, showType, exam_date }) {
	const handleOpen = async () => {
		const blob = await fillPdf("/pdf/g01.pdf", data, exam_date);
		const url = URL.createObjectURL(blob);
		window.open(url, "_blank");
	};

	const handlePrint = async () => {
		const blob = await fillPdf("/pdf/g01.pdf", data, exam_date);
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
