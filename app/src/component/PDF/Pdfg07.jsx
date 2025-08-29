import fontkit from "@pdf-lib/fontkit";
import { PDFDocument, rgb } from "pdf-lib";
import { Button } from "@mantine/core";

async function fillPdf(data, Exam_date) {
	const g07Bytes = await fetch("/pdf/g07.pdf").then((res) => res.arrayBuffer());
	const pdfDoc = await PDFDocument.load(g07Bytes);
	/* const pdfDoc = await PDFDocument.create(); */
	pdfDoc.registerFontkit(fontkit);
	const page = pdfDoc.getPages()[pdfDoc.getPageCount() - 1];
	/* const page = pdfDoc.addPage([595, 842]); */

	const THSarabunNewBytes = await fetch("/fonts/THSarabunNew.ttf").then((res) => res.arrayBuffer());
	const THSarabunNew = await pdfDoc.embedFont(THSarabunNewBytes);
	const THSarabunNewBytesBold = await fetch("/fonts/THSarabunNew Bold.ttf").then((res) => res.arrayBuffer());
	const THSarabunNewBold = await pdfDoc.embedFont(THSarabunNewBytesBold);

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
	const draw = (page, text, x, y, font = THSarabunNew, size = 14) => {
		if (text !== undefined && text !== null) {
			page.drawText(String(text), { x, y, size, font });
		}
	};

	const drawRect = (page, x, y, w, h, color, lineW = 1) => {
		page.drawRectangle({ x, y, width: w, height: h, borderWidth: lineW, color: color, borderColor: rgb(0, 0, 0) });
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

	/* drawGrid(page); */

	const date_cancel = data;

	const [request_cancel_exam_date_day, request_cancel_exam_date_month, request_cancel_exam_date_year] = formatThaiDate(date_cancel?.request_cancel_exam_date);
	const [advisor_cancel_date_day, advisor_cancel_date_month, advisor_cancel_date_year] = formatThaiDateShort(date_cancel?.advisor_cancel_date);
	const [chairpersons_cancel_date_day, chairpersons_cancel_date_month, chairpersons_cancel_date_year] = formatThaiDateShort(date_cancel?.chairpersons_cancel_date);
	const [dean_cancel_date_day, dean_cancel_date_month, dean_cancel_date_year] = formatThaiDateShort(date_cancel?.dean_cancel_date);

	drawCenterXText(page, `คำร้องขอยกเลิกการเข้าสอบ${data?.education_level === "ปริญญาโท" ? "ประมวลความรู้" : "วัดคุณสมบัติ"}`, 780, THSarabunNewBold, 24);
	const drawItems = [
		{ text: request_cancel_exam_date_day, x: 355, y: 726 },
		{ text: request_cancel_exam_date_month, x: 420, y: 726 },
		{ text: request_cancel_exam_date_year, x: 510, y: 726 },

		{ text: `ขอยกเลิกการเข้าสอบ${data?.education_level === "ปริญญาโท" ? "ประมวลความรู้" : "วัดคุณสมบัติ"}`, x: 99, y: 693 },
		{ text: `คณบดี${data?.faculty_name}`, x: 99, y: 675 },
		{ text: "ข้าพเจ้า................................................................................................รหัสประจำตัวนักศึกษา...................................................", x: 99, y: 640 },
		{ text: data?.student_name, x: 180, y: 643 },
		{ text: data?.student_id, x: 460, y: 643 },
		{ text: "ระดับ...........................................หลักสูตร.......................................................................สาขาวิชา............................................................", x: 63, y: 621 },
		{ text: data?.education_level, x: 110, y: 624 },
		{ text: data?.program, x: 230, y: 624 },
		{ text: data?.major_name, x: 420, y: 624 },
		{ text: "คณะ..........................................................................................มีความประสงค์..........................................................................................", x: 63, y: 602 },
		{ text: data?.faculty_name, x: 100, y: 606 },
		{ text: `ขอยกเลิกการเข้าสอบ${data?.education_level === "ปริญญาโท" ? "ประมวลความรู้" : "วัดคุณสมบัติ"}`, x: 370, y: 606 },
		{ text: "เนื่่องจาก......................................................................................................................................................................................................", x: 63, y: 583 },
		{ text: date_cancel?.reason, x: 140, y: 586 },

		{ text: data?.student_name, x: 380, y: 474 },
		{ text: data?.student_name, x: 380, y: 455 },
		{ text: request_cancel_exam_date_day, x: 370, y: 437 },
		{ text: request_cancel_exam_date_month, x: 420, y: 437 },
		{ text: request_cancel_exam_date_year, x: 480, y: 437 },

		{ text: date_cancel?.advisor_cancel ? "เห็นควร" : "ไม่เห็นควร", x: 80, y: 376, show: typeof date_cancel?.advisor_cancel === "boolean" },
		{ text: "เนื่องจาก..................................................................................", x: 80, y: 357, show: typeof date_cancel?.advisor_cancel === "boolean" && !date_cancel?.advisor_cancel },
		{ text: date_cancel?.comment, x: 120, y: 359, show: typeof date_cancel?.advisor_cancel === "boolean" && !date_cancel?.advisor_cancel },
		{ text: date_cancel?.advisor_cancel_name, x: 110, y: 323 },
		{ text: date_cancel?.advisor_cancel_name, x: 110, y: 304 },
		{ text: advisor_cancel_date_day, x: 110, y: 286 },
		{ text: advisor_cancel_date_month, x: 145, y: 286 },
		{ text: advisor_cancel_date_year, x: 180, y: 286 },

		{ text: date_cancel?.chairpersons_cancel ? "อนุญาต" : "ไม่อนุญาต", x: 330, y: 376, show: typeof date_cancel?.chairpersons_cancel === "boolean" },
		{ text: "เนื่องจาก.............................................................................", x: 330, y: 357, show: typeof date_cancel?.chairpersons_cancel === "boolean" && !data.chairpersons_approvals },
		{ text: date_cancel?.comment, x: 370, y: 359, show: typeof date_cancel?.chairpersons_cancel === "boolean" && !date_cancel?.chairpersons_cancel },
		{ text: date_cancel?.chairpersons_cancel_name, x: 390, y: 342 },
		{ text: date_cancel?.chairpersons_cancel_name, x: 390, y: 323 },
		{ text: chairpersons_cancel_date_day, x: 400, y: 286 },
		{ text: chairpersons_cancel_date_month, x: 435, y: 286 },
		{ text: chairpersons_cancel_date_year, x: 475, y: 286 },

		{ text: `3. ความเห็นคณบดี${data?.faculty_name}`, x: 187, y: 257, font: THSarabunNewBold },
		{ text: date_cancel?.dean_cancel ? "อนุญาต" : "ไม่อนุญาต", x: 205, y: 240, show: typeof date_cancel?.dean_cancel === "boolean" },
		{ text: "เนื่องจาก.............................................................................", x: 205, y: 220, show: typeof date_cancel?.dean_cancel === "boolean" && !data.chairpersons_approvals },
		{ text: date_cancel?.comment, x: 245, y: 222, show: typeof date_cancel?.dean_cancel === "boolean" && !date_cancel?.dean_cancel },
		{ text: date_cancel?.dean_cancel_name, x: 260, y: 204 },
		{ text: date_cancel?.dean_cancel_name, x: 260, y: 185 },
		{ text: `คณบดี${data?.faculty_name}`, x: 220, y: 164 },
		{ text: dean_cancel_date_day, x: 275, y: 148 },
		{ text: dean_cancel_date_month, x: 310, y: 148 },
		{ text: dean_cancel_date_year, x: 345, y: 148 },
	];

	drawItems.filter((item) => item.show !== false).forEach((item) => draw(page, item.text, item.x, item.y, item.font, item.size));

	if (typeof date_cancel?.advisor_cancel !== "boolean") {
		drawRect(page, 50, 270, 260, 140, rgb(1, 1, 1), 0);
	}
	if (typeof date_cancel?.chairpersons_cancel !== "boolean") {
		drawRect(page, 307, 270, 250, 140, rgb(1, 1, 1), 0);
	}
	if (typeof date_cancel?.dean_cancel !== "boolean") {
		drawRect(page, 50, 130, 510, 146, rgb(1, 1, 1), 0);
	}

	const pdfBytes = await pdfDoc.save();
	return new Blob([pdfBytes], { type: "application/pdf" });
}

export default function Pdfg01({ data, showType, exam_date }) {
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
