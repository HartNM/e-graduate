import fontkit from "@pdf-lib/fontkit";
import { PDFDocument } from "pdf-lib";
import { Button } from "@mantine/core";
import { setDefaultFont, draw, drawRect, drawCenterXText, formatThaiDate, formatThaiDateShort, fetchPersonDataAndSignature, drawSignature } from "./PdfUtils.js";
const BASE_URL = import.meta.env.VITE_API_URL;

async function fillPdf(data) {
	// สร้าง pdf
	const pdfDoc = await PDFDocument.create();
	pdfDoc.registerFontkit(fontkit);
	const page = pdfDoc.addPage([595, 842]);

	// ดึง Font
	await setDefaultFont(pdfDoc);
	const THSarabunNewBytesBold = await fetch("/fonts/THSarabunNew Bold.ttf").then((res) => res.arrayBuffer());
	const THSarabunNewBold = await pdfDoc.embedFont(THSarabunNewBytesBold);

	// ดึงวันสอบ
	const token = localStorage.getItem("token");
	let KQ_exam_date;
	try {
		const requestRes = await fetch(`${BASE_URL}/api/allRequestExamInfo`, {
			method: "POST",
			headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
			body: JSON.stringify({ term: data?.term }),
		});
		const requestData = await requestRes.json();
		if (Array.isArray(requestData) && requestData.length > 0) {
			KQ_exam_date = requestData[0].KQ_exam_date;
		}
	} catch (e) {
		console.error("Error fetch allRequestExamInfo:", e);
	}
	
	// ดึงลายเซ็น ชื่อ
	if (data) {
		data.finance_approvals_id = 1629900598264;
	}
	const ids = {
		advisor: "advisor_approvals_id",
		chairpersons: "chairpersons_approvals_id",
		registrar: "registrar_approvals_id",
		finance: "finance_approvals_id",
	};
	const signatureImages = await fetchPersonDataAndSignature(pdfDoc, data, ids);

	// แปลงวันที่
	const [request_date_day, request_date_month, request_date_year] = formatThaiDate(data?.request_date);
	const [exam_date_day, exam_date_month, exam_date_year] = formatThaiDate(KQ_exam_date);
	const [advisor_approvals_date_day, advisor_approvals_date_month, advisor_approvals_date_year] = formatThaiDateShort(data?.advisor_approvals_date);
	const [chairpersons_approvals_date_day, chairpersons_approvals_date_month, chairpersons_approvals_date_year] = formatThaiDateShort(data?.chairpersons_approvals_date);
	const [registrar_approvals_date_day, registrar_approvals_date_month, registrar_approvals_date_year] = formatThaiDateShort(data?.registrar_approvals_date);
	const [receipt_pay_date_day, receipt_pay_date_month, receipt_pay_date_year] = formatThaiDateShort(data?.receipt_pay_date);

	let y = 760;
	let space = 20;

	// ข้อมูลวาด pdf
	drawCenterXText(page, `คำร้อง${data?.request_type}`, 780, THSarabunNewBold, 20);
	const drawItems = [
		// คำร้อง
		{ text: `มหาวิทยาลัยราชภัฏกำแพงเพชร`, x: 420, y: (y -= space) },
		{ text: `วันที่................เดือน...........................พ.ศ...................`, x: 350, y: (y -= space) },
		{ text: request_date_day, x: 380, y: y + 2 },
		{ text: request_date_month, x: 425, y: y + 2 },
		{ text: request_date_year, x: 510, y: y + 2 },
		{ text: `เรื่อง`, x: 60, y: (y -= space * 2), font: THSarabunNewBold },
		{ text: data?.request_type, x: 100, y: y },
		{ text: `เรียน`, x: 60, y: (y -= space), font: THSarabunNewBold },
		{ text: `ประธานคณะกรรมการบัณฑิตศึกษาประจำสาขาวิชา${data?.major_name}`, x: 100, y: y },
		{ text: `ข้าพเจ้า................................................................................................รหัสประจำตัวนักศึกษา.................................................`, x: 100, y: (y -= space * 2) },
		{ text: data?.student_name, x: 180, y: y + 2 },
		{ text: data?.student_id, x: 460, y: y + 2 },
		{ text: "ระดับ...........................................หลักสูตร...............................................................................สาขาวิชา....................................................", x: 60, y: (y -= space) },
		{ text: data?.education_level, x: 110, y: y + 2 },
		{ text: data?.program, x: 230, y: y + 2 },
		{ text: data?.major_name, x: 440, y: y + 2 },
		{ text: `คณะ..........................................................................................มีความประสงค์.........................................................................................`, x: 60, y: (y -= space) },
		{ text: data?.faculty_name, x: 100, y: y + 2 },
		{ text: `ขอสอบ${data?.request_type}`, x: 360, y: y + 2 },
		{ text: `ในภาคเรียนที่ ....................... ในวันที่.....................................................`, x: 60, y: (y -= space) },
		{ text: data?.term, x: 130, y: y + 2 },
		{ text: `${exam_date_day} ${exam_date_month} ${exam_date_year}`, x: 210, y: y + 2 },
		{ text: `จึงเรียนมาเพื่อโปรดพิจารณา`, x: 100, y: (y -= space) },
		
		{ text: `ลงชื่อ...........................................................................`, x: 310, y: (y -= space * 2) },
		{ text: data?.student_name, x: 415, y: y + 2, centered: true },
		{ text: `(.........................................................................)`, x: 330, y: (y -= space) },
		{ text: data?.student_name, x: 415, y: y + 2, centered: true },
		{ text: `นักศึกษา`, x: 400, y: (y -= space) },
		{ text: `วันที่................/........................../......................`, x: 330, y: (y -= space) },
		{ text: request_date_day, x: 360, y: y + 2 },
		{ text: request_date_month, x: 400, y: y + 2 },
		{ text: request_date_year, x: 465, y: y + 2 },

		// อาจารย์ที่ปรึกษา
		{ text: `1. ความเห็นของอาจารย์ที่ปรึกษาหมู่เรียน`, x: 60, y: (y -= space * 2), font: THSarabunNewBold, show: typeof data?.advisor_approvals === "boolean" },
		{ text: data?.advisor_approvals ? "เห็นควรอนุญาต" : "ไม่อนุญาต", x: 80, y: (y -= space), show: typeof data?.advisor_approvals === "boolean" },
		{ text: `เนื่องจาก ${data?.comment}`, x: 80, y: (y -= space), show: typeof data?.advisor_approvals === "boolean" && !data.advisor_approvals },
		{ text: `ลงชื่อ.......................................................................`, x: 75, y: (y -= space * 2), show: typeof data?.advisor_approvals === "boolean" },
		{ text: "", x: 175, y: y + 2, show: typeof data?.advisor_approvals === "boolean", image: signatureImages.advisor },
		{ text: `(.....................................................................) `, x: 95, y: (y -= space), show: typeof data?.advisor_approvals === "boolean" },
		{ text: data?.advisor_approvals_name, x: 175, y: y + 2, show: typeof data?.advisor_approvals === "boolean", centered: true },
		{ text: `อาจารย์ที่ปรึกษา`, x: 145, y: (y -= space), show: typeof data?.advisor_approvals === "boolean" },
		{ text: `วันที่ ........../................./...................`, x: 110, y: (y -= space), show: typeof data?.advisor_approvals === "boolean" },
		{ text: advisor_approvals_date_day, x: 135, y: y + 2, show: typeof data?.advisor_approvals === "boolean" },
		{ text: advisor_approvals_date_month, x: 170, y: y + 2, show: typeof data?.advisor_approvals === "boolean" },
		{ text: advisor_approvals_date_year, x: 210, y: y + 2, show: typeof data?.advisor_approvals === "boolean" },

		// ประธานกรรมการ
		{ text: `2. ความเห็นประธานกรรมการบัณฑิตศึกษาประจำสาขาวิชา`, x: 310, y: (y += space * 7), font: THSarabunNewBold, show: typeof data?.chairpersons_approvals === "boolean" },
		{ text: data?.chairpersons_approvals ? "เห็นควรอนุญาต" : "ไม่อนุญาต", x: 330, y: (y -= space), show: typeof data?.chairpersons_approvals === "boolean" },
		{ text: `เนื่องจาก ${data?.comment}`, x: 330, y: (y -= space), show: typeof data?.chairpersons_approvals === "boolean" && !data.chairpersons_approvals },
		{ text: `ลงชื่อ.......................................................................`, x: 325, y: (y -= space * 2), show: typeof data?.chairpersons_approvals === "boolean" },
		{ text: "", x: 425, y: y + 2, show: typeof data?.chairpersons_approvals === "boolean", image: signatureImages.chairpersons },
		{ text: `(.....................................................................) `, x: 345, y: (y -= space), show: typeof data?.chairpersons_approvals === "boolean" },
		{ text: data?.chairpersons_approvals_name, x: 425, y: y + 2, show: typeof data?.chairpersons_approvals === "boolean", centered: true },
		{ text: `ประธานกรรมการบัณฑิตศึกษาประจำสาขาวิชา`, x: 340, y: (y -= space), show: typeof data?.chairpersons_approvals === "boolean" },
		{ text: `วันที่ ........../................./...................`, x: 360, y: (y -= space), show: typeof data?.chairpersons_approvals === "boolean" },
		{ text: chairpersons_approvals_date_day, x: 385, y: y + 2, show: typeof data?.chairpersons_approvals === "boolean" },
		{ text: chairpersons_approvals_date_month, x: 420, y: y + 2, show: typeof data?.chairpersons_approvals === "boolean" },
		{ text: chairpersons_approvals_date_year, x: 460, y: y + 2, show: typeof data?.chairpersons_approvals === "boolean" },

		// นายทะเบียน
		{ text: `3. การตรวจสอบของสำนักส่งเสริมวิชาการและงานทะเบียน`, x: 60, y: (y -= space * 1.5), font: THSarabunNewBold, show: typeof data?.registrar_approvals === "boolean" },
		{ text: data?.registrar_approvals ? `มีสภาพการเป็นนักศึกษา ภาคเรียนที่ ${data?.term}` : `ไม่อนุญาต`, x: 80, y: (y -= space), show: typeof data?.registrar_approvals === "boolean" },
		{ text: data?.registrar_approvals ? `ลงทะเบียนเรียนครบตามหลักสูตร` : `เนื่องจาก ${data?.comment}`, x: 80, y: (y -= space), show: typeof data?.registrar_approvals === "boolean" },
		{ text: ``, x: 60, y: (y -= space), show: typeof data?.registrar_approvals === "boolean" && data?.registrar_approvals }, //ให้ชำระค่าธรรมเนียมที่ฝ่ายการเงิน
		{ text: `ลงชื่อ.......................................................................`, x: 75, y: (y -= space), show: typeof data?.registrar_approvals === "boolean" },
		{ text: "", x: 175, y: y + 2, show: typeof data?.registrar_approvals === "boolean", image: signatureImages.registrar },
		{ text: `(.....................................................................) `, x: 95, y: (y -= space), show: typeof data?.registrar_approvals === "boolean" },
		{ text: data?.registrar_approvals_name, x: 175, y: y + 2, show: typeof data?.registrar_approvals === "boolean", centered: true },
		{ text: `นายทะเบียน`, x: 150, y: (y -= space), show: typeof data?.registrar_approvals === "boolean" },
		{ text: `วันที่ ........../................./...................`, x: 110, y: (y -= space), show: typeof data?.registrar_approvals === "boolean" },
		{ text: registrar_approvals_date_day, x: 135, y: y + 2, show: typeof data?.registrar_approvals === "boolean" },
		{ text: registrar_approvals_date_month, x: 170, y: y + 2, show: typeof data?.registrar_approvals === "boolean" },
		{ text: registrar_approvals_date_year, x: 210, y: y + 2, show: typeof data?.registrar_approvals === "boolean" },

		// การเงิน
		{ text: `4. ชำระค่าธรรมเนียมการสอบแล้ว ภาคเรียนที่ ${data?.term}`, x: 310, y: (y += space * 7), font: THSarabunNewBold, show: data?.receipt_vol !== null },
		{ text: data?.education_level === "ปริญญาโท" ? "ปริญญาโท จำนวน 1,000 บาท (หนึ่งพันบาทถ้วน)" : "ปริญญาเอก จำนวน 1,500 บาท (หนึ่งพันห้าร้อยบาทถ้วน)", x: 330, y: (y -= space), show: data?.receipt_vol !== null },
		{ text: `ตามใบเสร็จรับเงิน เล่มที่ ${data?.receipt_vol} เลขที่ ${data?.receipt_No}`, x: 310, y: (y -= space), show: data?.receipt_vol !== null },
		{ text: `ลงชื่อ.......................................................................`, x: 325, y: (y -= space * 2), show: data?.receipt_vol !== null },
		{ text: "", x: 425, y: y + 2, show: data?.receipt_vol !== null, image: signatureImages.finance },
		{ text: `(.....................................................................) `, x: 345, y: (y -= space), show: data?.receipt_vol !== null },
		{ text: data?.finance_approvals_name, x: 425, y: y + 2, show: data?.receipt_vol !== null, centered: true },
		{ text: `เจ้าหน้าที่การเงิน`, x: 395, y: (y -= space), show: data?.receipt_vol !== null },
		{ text: `วันที่ ........../................./...................`, x: 360, y: (y -= space), show: data?.receipt_vol !== null },
		{ text: receipt_pay_date_day, x: 385, y: y + 2, show: data?.receipt_vol !== null },
		{ text: receipt_pay_date_month, x: 420, y: y + 2, show: data?.receipt_vol !== null },
		{ text: receipt_pay_date_year, x: 460, y: y + 2, show: data?.receipt_vol !== null },
	];

	// วาด pdf
	drawItems
		.filter((item) => item.show !== false)
		.forEach((item) => {
			let drawX = item.x;

			// ถ้ามี flag centered ให้คำนวณหาจุดกึ่งกลาง
			if (item.centered && item.text) {
				const fontToUse = item.font || THSarabunNewBold;
				const sizeToUse = item.size || 14;
				const textWidth = fontToUse.widthOfTextAtSize(item.text, sizeToUse);
				drawX = item.x - textWidth / 2;
			}

			// วาดข้อความ (ใช้ drawX ที่คำนวณแล้ว)
			draw(page, item.text, drawX, item.y, item.font, item.size);

			// วาดรูปภาพ (โค้ดเดิม)
			if (item.image) {
				drawSignature(page, item.image, item.x, item.y);
			}
		});

	typeof data?.advisor_approvals === "boolean" && drawRect(page, 50, y + space * 8, 250, space * 8.5);
	typeof data?.chairpersons_approvals === "boolean" && drawRect(page, 300, y + space * 8, 250, space * 8.5);
	typeof data?.registrar_approvals === "boolean" && drawRect(page, 50, y - space * 0.5, 250, space * 8.5);
	data?.receipt_vol !== null && drawRect(page, 300, y - space * 0.5, 250, space * 8.5);

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
