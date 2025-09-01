import fontkit from "@pdf-lib/fontkit";
import { PDFDocument, rgb } from "pdf-lib";
import { Button } from "@mantine/core";
import { setDefaultFont, drawGrid, draw, drawRect, drawCenterXText, formatThaiDate, formatThaiDateShort } from "./PdfUtils.js";

async function fillPdf(data) {
	const existingPdfBytes = await fetch("/pdf/g01.pdf").then((res) => res.arrayBuffer());
	const pdfDoc = await PDFDocument.load(existingPdfBytes);
	pdfDoc.registerFontkit(fontkit);

	await setDefaultFont(pdfDoc);
	const THSarabunNewBytesBold = await fetch("/fonts/THSarabunNew Bold.ttf").then((res) => res.arrayBuffer());
	const THSarabunNewFontBold = await pdfDoc.embedFont(THSarabunNewBytesBold);

	const pages = pdfDoc.getPages();
	const page = pages[0];

	let Exam_date;
	try {
		const token = localStorage.getItem("token");
		const requestRes = await fetch("http://localhost:8080/api/allRequestExamInfo", {
			method: "POST",
			headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
			body: JSON.stringify({ term: data?.term }),
		});
		const requestData = await requestRes.json();
		if (Array.isArray(requestData) && requestData.length > 0) {
			Exam_date = requestData[0].exam_date;
			data.term = requestData[0].term;
		}
	} catch (e) {
		console.error("Error fetch allRequestExamInfo:", e);
	}

	const [request_exam_date_day, request_exam_date_month, request_exam_date_year] = formatThaiDate(data?.request_exam_date);
	const [exam_date_day, exam_date_month, exam_date_year] = formatThaiDate(Exam_date);
	const [advisor_approvals_date_day, advisor_approvals_date_month, advisor_approvals_date_year] = formatThaiDateShort(data?.advisor_approvals_date);
	const [chairpersons_approvals_date_day, chairpersons_approvals_date_month, chairpersons_approvals_date_year] = formatThaiDateShort(data?.chairpersons_approvals_date);
	const [receipt_pay_date_day, receipt_pay_date_month, receipt_pay_date_year] = formatThaiDate(data?.receipt_pay_date);

	drawCenterXText(page, `คำร้องขอสอบ${data?.education_level === "ปริญญาโท" ? "ประมวลความรู้" : "วัดคุณสมบัติ"}`, 780, THSarabunNewFontBold, 24);

	const drawItems = [
		{ text: request_exam_date_day, x: 365, y: 721 },
		{ text: request_exam_date_month, x: 430, y: 721 },
		{ text: request_exam_date_year, x: 510, y: 721 },

		{ text: `ขอสอบ${data?.education_level === "ปริญญาโท" ? "ประมวลความรู้" : "วัดคุณสมบัติ"}`, x: 99, y: 687 },
		{ text: `ประธานคณะกรรมการบัณฑิตศึกษาประจำสาขาวิชา${data?.major_name}`, x: 99, y: 669 },

		{ text: "ข้าพเจ้า................................................................................................รหัสประจำตัวนักศึกษา...................................................", x: 99, y: 634 },
		{ text: data?.student_name, x: 180, y: 637 },
		{ text: data?.student_id, x: 460, y: 637 },
		{ text: "ระดับ...........................................หลักสูตร...............................................................................สาขาวิชา....................................................", x: 63, y: 615 },
		{ text: data?.education_level, x: 110, y: 618 },
		{ text: data?.program, x: 230, y: 618 },
		{ text: data?.major_name, x: 440, y: 618 },
		{ text: `คณะ..........................................................................................มีความประสงค์ ขอสอบ${data?.education_level === "ปริญญาโท" ? "ประมวลความรู้" : "วัดคุณสมบัติ"}`, x: 63, y: 596 },
		{ text: data?.faculty_name, x: 100, y: 600 },
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
		{ text: data?.advisor_approvals_id, x: 110, y: 350 },
		{ text: data?.advisor_approvals_id, x: 110, y: 330 },
		{ text: advisor_approvals_date_day, x: 110, y: 311 },
		{ text: advisor_approvals_date_month, x: 145, y: 311 },
		{ text: advisor_approvals_date_year, x: 180, y: 311 },

		{ text: data?.chairpersons_approvals ? "เห็นควรสอบได้" : "ไม่เห็นควร", x: 330, y: 403, show: typeof data?.chairpersons_approvals === "boolean" },
		{ text: "เนื่องจาก.............................................................................", x: 330, y: 384, show: typeof data?.chairpersons_approvals === "boolean" && !data.chairpersons_approvals },
		{ text: data?.comment, x: 370, y: 386, show: typeof data?.chairpersons_approvals === "boolean" && !data.chairpersons_approvals },
		{ text: data?.chairpersons_approvals_id, x: 390, y: 370 },
		{ text: data?.chairpersons_approvals_id, x: 390, y: 350 },
		{ text: chairpersons_approvals_date_day, x: 410, y: 311 },
		{ text: chairpersons_approvals_date_month, x: 440, y: 311 },
		{ text: chairpersons_approvals_date_year, x: 480, y: 311 },

		{ text: `มีสภาพการเป็นนักศึกษา ภาคเรียนที่ ${data?.term}`, x: 80, y: 271, show: typeof data?.registrar_approvals === "boolean" && data?.registrar_approvals },
		{ text: "ลงทะเบียนเรียนครบตามหลักสูตร", x: 80, y: 252, show: typeof data?.registrar_approvals === "boolean" && data?.registrar_approvals },
		{ text: "ให้ชำระค่าธรรมเนียมที่ฝ่ายการเงิน", x: 80, y: 233, show: typeof data?.registrar_approvals === "boolean" && data?.registrar_approvals },
		{ text: "ไม่เห็นควร", x: 80, y: 271, show: typeof data?.registrar_approvals === "boolean" && !data?.registrar_approvals },
		{ text: "เนื่องจาก............................................................................", x: 80, y: 252, show: typeof data?.registrar_approvals === "boolean" && !data?.registrar_approvals },
		{ text: data?.comment, x: 120, y: 254, show: !data.registrar_approvals },
		{ text: data?.registrar_approvals_id, x: 140, y: 180 },
		{ text: data?.registrar_approvals_id, x: 140, y: 161 },

		{ text: data?.term, x: 500, y: 292, show: data?.receipt_vol_No !== null },
		{ text: data?.education_level === "ปริญญาโท" ? "ปริญญาโท จำนวน 1,000 บาท (หนึ่งพันบาทถ้วน)" : "ปริญญาเอก จำนวน 1,500 บาท (หนึ่งพันห้าร้อยบาทถ้วน)", x: 330, y: 271, show: data?.receipt_vol_No !== null },
		{ text: "1", x: 420, y: 236, show: data?.receipt_vol_No !== null },
		{ text: "25", x: 490, y: 236, show: data?.receipt_vol_No !== null },
		{ text: `${receipt_pay_date_day} ${receipt_pay_date_month} ${receipt_pay_date_year}`, x: 380, y: 217, show: data?.receipt_vol_No !== null },
		{ text: "นายณัฐวุฒิ มาตกาง", x: 400, y: 180, show: data?.receipt_vol_No !== null },
		{ text: "นายณัฐวุฒิ มาตกาง", x: 400, y: 161, show: data?.receipt_vol_No !== null },
	];

	drawItems.filter((item) => item.show !== false).forEach((item) => draw(page, item.text, item.x, item.y, item.font, item.size));

	if (typeof data?.advisor_approvals !== "boolean") {
		drawRect(page, 50, 302, 257, 140);
	}
	if (typeof data?.chairpersons_approvals !== "boolean") {
		drawRect(page, 306.5, 302, 250, 140);
	}
	if (typeof data?.registrar_approvals !== "boolean") {
		drawRect(page, 50, 130, 257, 172.4);
	}
	if (data?.receipt_vol_No === null) {
		drawRect(page, 306.5, 130, 250, 172.4);
	}
	const pdfBytes = await pdfDoc.save();
	return new Blob([pdfBytes], { type: "application/pdf" });
}

export default function Pdfg01({ data, showType }) {
	const handleOpen = async () => {
		const blob = await fillPdf(data);
		const url = URL.createObjectURL(blob);
		window.open(url, "_blank");
	};

	const handlePrint = async () => {
		const blob = await fillPdf(data);
		const url = URL.createObjectURL(blob);

		const iframe = document.createElement("iframe");
		iframe.style.display = "none";
		iframe.src = url;
		document.body.appendChild(iframe);
		setTimeout(() => iframe.contentWindow.print(), 100);
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
