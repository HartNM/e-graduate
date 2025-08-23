import fontkit from "@pdf-lib/fontkit";
import { PDFDocument, rgb } from "pdf-lib";
import { Button } from "@mantine/core";

async function fillPdf(data, Exam_date) {
	const existingPdfBytes = await fetch("/pdf/g01.pdf").then((res) => res.arrayBuffer());
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

	drawCenterXText(firstPage, `คำร้องขอสอบ${data?.education_level === "ปริญญาโท" ? "ประมวลความรู้" : "วัดคุณสมบัติ"}`, 780, customFontBold, 24);

	const drawItems = [
		{ text: request_exam_date_day, x: 365, y: 721 },
		{ text: request_exam_date_month, x: 430, y: 721 },
		{ text: request_exam_date_year, x: 510, y: 721 },

		{ text: `ขอสอบ${data?.education_level === "ปริญญาโท" ? "ประมวลความรู้" : "วัดคุณสมบัติ"}`, x: 99, y: 687 },
		{ text: `ประธานคณะกรรมการบัณฑิตศึกษาประจำสาขาวิชา${data?.major_name}`, x: 99, y: 669 },

		{ text: "ข้าพเจ้า................................................................................................รหัสประจำตัวนักศึกษา...................................................", x: 99, y: 634 },
		{ text: data?.student_name, x: 180, y: 637 },
		{ text: data?.student_id, x: 460, y: 637 },
		{ text: "ระดับ...........................................หลักสูตร.......................................................................สาขาวิชา............................................................", x: 63, y: 615 },
		{ text: data?.education_level, x: 110, y: 618 },
		{ text: data?.program, x: 230, y: 618 },
		{ text: data?.major_name, x: 420, y: 618 },
		{ text: "คณะ..........................................................................................มีความประสงค์..........................................................................................", x: 63, y: 596 },
		{ text: data?.faculty_name, x: 100, y: 600 },
		{ text: `ขอสอบ${data?.education_level === "ปริญญาโท" ? "ประมวลความรู้" : "วัดคุณสมบัติ"}`, x: 370, y: 600 },
		{ text: "ในภาคเรียนที่......................................วันที่สอบ..........................................................", x: 63, y: 577 },
		{ text: data?.term, x: 140, y: 580 },
		{ text: exam_date_day, x: 240, y: 580 },
		{ text: exam_date_month, x: 260, y: 580 },
		{ text: exam_date_year + 543, x: 300, y: 580 },

		{ text: data?.student_name, x: 370, y: 500 },
		{ text: data?.student_name, x: 370, y: 481 },
		{ text: request_exam_date_day, x: 360, y: 463 },
		{ text: request_exam_date_month, x: 410, y: 463 },
		{ text: request_exam_date_year, x: 470, y: 463 },

		{ text: data?.advisor_approvals ? "เห็นควรสอบได้" : "ไม่เห็นควร", x: 80, y: 403, show: typeof data?.advisor_approvals === "boolean" },
		{ text: "เนื่องจาก..................................................................................", x: 80, y: 384, show: typeof data?.advisor_approvals === "boolean" && !data.advisor_approvals },
		{ text: data?.comment, x: 120, y: 386, show: typeof data?.advisor_approvals === "boolean" && !data.advisor_approvals },
		{ text: data?.advisor_approvals_name, x: 110, y: 350 },
		{ text: data?.advisor_approvals_name, x: 110, y: 330 },
		{ text: advisor_approvals_date_day, x: 110, y: 311 },
		{ text: advisor_approvals_date_month, x: 145, y: 311 },
		{ text: advisor_approvals_date_year, x: 180, y: 311 },

		{ text: data?.chairpersons_approvals ? "เห็นควรสอบได้" : "ไม่เห็นควร", x: 330, y: 403, show: typeof data?.chairpersons_approvals === "boolean" },
		{ text: "เนื่องจาก.............................................................................", x: 330, y: 384, show: typeof data?.chairpersons_approvals === "boolean" && !data.chairpersons_approvals },
		{ text: data?.comment, x: 370, y: 386, show: typeof data?.chairpersons_approvals === "boolean" && !data.chairpersons_approvals },
		{ text: data?.chairpersons_approvals_name, x: 390, y: 370 },
		{ text: data?.chairpersons_approvals_name, x: 390, y: 350 },
		{ text: chairpersons_approvals_date_day, x: 410, y: 311 },
		{ text: chairpersons_approvals_date_month, x: 440, y: 311 },
		{ text: chairpersons_approvals_date_year, x: 480, y: 311 },

		{ text: `มีสภาพการเป็นนักศึกษา ภาคเรียนที่ ${data?.term}`, x: 80, y: 271, show: typeof data?.registrar_approvals === "boolean" && data?.registrar_approvals },
		{ text: "ลงทะเบียนเรียนครบตามหลักสูตร", x: 80, y: 252, show: typeof data?.registrar_approvals === "boolean" && data?.registrar_approvals },
		{ text: "ให้ชำระค่าธรรมเนียมที่ฝ่ายการเงิน", x: 80, y: 233, show: typeof data?.registrar_approvals === "boolean" && data?.registrar_approvals },
		{ text: "ไม่เห็นควร", x: 80, y: 271, show: typeof data?.registrar_approvals === "boolean" && !data?.registrar_approvals },
		{ text: "เนื่องจาก............................................................................", x: 80, y: 252, show: typeof data?.registrar_approvals === "boolean" && !data?.registrar_approvals },
		{ text: data?.comment, x: 120, y: 254, show: !data.registrar_approvals },
		{ text: data?.registrar_approvals_name, x: 140, y: 180 },
		{ text: data?.registrar_approvals_name, x: 140, y: 161 },

		{ text: data?.term, x: 500, y: 292, show: data?.receipt_vol_No !== null },
		{ text: data?.education_level === "ปริญญาโท" ? "ปริญญาโท จำนวน 1,000 บาท" : "ปริญญาเอก จำนวน 1,500 บาท", x: 330, y: 271, show: data?.receipt_vol_No != null },
		{ text: "1", x: 420, y: 236, show: data?.receipt_vol_No !== null },
		{ text: "25", x: 490, y: 236, show: data?.receipt_vol_No !== null },
		{ text: `${receipt_pay_date_day} ${receipt_pay_date_month} ${receipt_pay_date_year}`, x: 380, y: 217, show: data?.receipt_vol_No !== null },
		{ text: "นายณัฐวุฒิ มาตกาง", x: 400, y: 180, show: data?.receipt_vol_No !== null },
		{ text: "นายณัฐวุฒิ มาตกาง", x: 400, y: 161, show: data?.receipt_vol_No !== null },
	];

	drawItems.filter((item) => item.show !== false).forEach((item) => draw(firstPage, item.text, item.x, item.y, item.font, item.size));

	if (typeof data?.advisor_approvals !== "boolean") {
		drawRect(firstPage, 50, 302, 257, 140);
	}
	if (typeof data?.chairpersons_approvals !== "boolean") {
		drawRect(firstPage, 306.5, 302, 250, 140);
	}
	if (typeof data?.registrar_approvals !== "boolean") {
		drawRect(firstPage, 50, 130, 257, 172.4);
	}
	if (data?.receipt_vol_No === null) {
		drawRect(firstPage, 306.5, 130, 250, 172.4);
	}
	/* drawGrid(firstPage); */

	if (data?.cancel_list?.length > 0) {
		const g07Bytes = await fetch("/pdf/g07.pdf").then((res) => res.arrayBuffer());
		const g07Doc = await PDFDocument.load(g07Bytes);

		for (let i = 0; i < data.cancel_list.length; i++) {
			const [g07Page] = await pdfDoc.copyPages(g07Doc, [0]);
			pdfDoc.addPage(g07Page);
			const page = pdfDoc.getPages()[pdfDoc.getPageCount() - 1];
			/* drawGrid(page); */

			const date_cancel = data?.cancel_list[i];

			const [request_cancel_exam_date_day, request_cancel_exam_date_month, request_cancel_exam_date_year] = formatThaiDate(date_cancel?.request_cancel_exam_date);
			const [advisor_cancel_date_day, advisor_cancel_date_month, advisor_cancel_date_year] = formatThaiDateShort(date_cancel?.advisor_cancel_date);
			const [chairpersons_cancel_date_day, chairpersons_cancel_date_month, chairpersons_cancel_date_year] = formatThaiDateShort(date_cancel?.chairpersons_cancel_date);
			const [dean_cancel_date_day, dean_cancel_date_month, dean_cancel_date_year] = formatThaiDateShort(date_cancel?.dean_cancel_date);

			drawCenterXText(page, `คำร้องขอยกเลิกการเข้าสอบ${data?.education_level === "ปริญญาโท" ? "ประมวลความรู้" : "วัดคุณสมบัติ"}`, 780, customFontBold, 24);
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
				{ text: "เนื่่องจาก................................................................................................", x: 63, y: 583 },
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

				{ text: `3. ความเห็นคณบดี${data?.faculty_name}`, x: 187, y: 257, font: customFontBold },
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
				drawRect(page, 50, 270, 260, 140);
			}
			if (typeof date_cancel?.chairpersons_cancel !== "boolean") {
				drawRect(page, 307, 270, 250, 140);
			}
			if (typeof date_cancel?.dean_cancel !== "boolean") {
				drawRect(page, 50, 130, 510, 146);
			}
		}
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
