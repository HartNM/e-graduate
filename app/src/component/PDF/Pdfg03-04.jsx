import fontkit from "@pdf-lib/fontkit";
import { PDFDocument, rgb } from "pdf-lib";
import { Button } from "@mantine/core";
import { setDefaultFont, drawGrid, draw, drawRect, drawCenterXText, formatThaiDate, formatThaiDateShort } from "./PdfUtils.js";

async function fillPdf(data) {
	const pdfDoc = await PDFDocument.create();
	pdfDoc.registerFontkit(fontkit);
	const page = pdfDoc.addPage([595, 842]);

	await setDefaultFont(pdfDoc);
	const THSarabunNewBytesBold = await fetch("/fonts/THSarabunNew Bold.ttf").then((res) => res.arrayBuffer());
	const THSarabunNewBold = await pdfDoc.embedFont(THSarabunNewBytesBold);

	const [request_date_day, request_date_month, request_date_year] = formatThaiDate(data?.request_date);
	const [exam_date_day, exam_date_month, exam_date_year] = formatThaiDate(data?.thesis_exam_date);
	const [advisor_approvals_date_day, advisor_approvals_date_month, advisor_approvals_date_year] = formatThaiDateShort(data?.advisor_approvals_date);
	const [chairpersons_approvals_date_day, chairpersons_approvals_date_month, chairpersons_approvals_date_year] = formatThaiDateShort(data?.chairpersons_approvals_date);
	const [registrar_approvals_date_day, registrar_approvals_date_month, registrar_approvals_date_year] = formatThaiDateShort(data?.registrar_approvals_date);
	const [receipt_pay_date_day, receipt_pay_date_month, receipt_pay_date_year] = formatThaiDateShort(data?.receipt_pay_date);

	function numberToThaiText(number) {
		const thNumbers = ["ศูนย์", "หนึ่ง", "สอง", "สาม", "สี่", "ห้า", "หก", "เจ็ด", "แปด", "เก้า"];
		const thPositions = ["", "สิบ", "ร้อย", "พัน", "หมื่น", "แสน", "ล้าน"];
		let numStr = number.toString();
		let result = "";
		let len = numStr.length;
		for (let i = 0; i < len; i++) {
			let digit = parseInt(numStr.charAt(i));
			let position = len - i - 1;
			if (digit !== 0) {
				if (position === 1 && digit === 1) result += "สิบ";
				else if (position === 1 && digit === 2) result += "ยี่สิบ";
				else if (position === 1) result += thNumbers[digit] + "สิบ";
				else if (position === 0 && digit === 1 && len > 1) result += "เอ็ด";
				else result += thNumbers[digit] + thPositions[position];
			}
		}
		return result;
	}
	const feeMap = {
		ปริญญาโท: { โครงร่าง: 2000, สอบจริง: 3000 },
		ปริญญาเอก: { โครงร่าง: 5000, สอบจริง: 7000 },
	};
	const examTypeMap = {
		ขอสอบโครงร่างวิทยานิพนธ์: "โครงร่าง",
		ขอสอบโครงร่างการค้นคว้าอิสระ: "โครงร่าง",
		ขอสอบวิทยานิพนธ์: "สอบจริง",
		ขอสอบการค้นคว้าอิสระ: "สอบจริง",
	};
	const examType = examTypeMap[data?.request_type];
	const fee = feeMap[data?.education_level]?.[examType] ?? 0;

	const token = localStorage.getItem("token");
	const ids = {
		advisor: "advisor_approvals_id",
		chairpersons: "chairpersons_approvals_id",
		registrar: "registrar_approvals_id",
	};
	try {
		for (const [role, prop] of Object.entries(ids)) {
			const id = data?.[prop];
			if (!id || isNaN(Number(id))) continue;
			const res = await fetch("http://localhost:8080/api/personnelInfo", {
				method: "POST",
				headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
				body: JSON.stringify({ user_id: id }),
			});
			const person = await res.json();
			if (person) {
				data[prop] = person.name;
			}
		}
	} catch (e) {
		console.error("Error fetch personnelInfo:", e);
	}

	let y = 760;
	let space = 20;

	drawCenterXText(page, `คำร้อง${data?.request_type}`, 780, THSarabunNewBold, 20);

	const drawItems = [
		{ text: `มหาวิทยาลัยราชภัฏกำแพงเพชร`, x: 420, y: (y -= space) },
		{ text: `วันที่................เดือน...........................พ.ศ...................`, x: 350, y: (y -= space) },
		{ text: request_date_day, x: 380, y: y + 2 },
		{ text: request_date_month, x: 440, y: y + 2 },
		{ text: request_date_year, x: 510, y: y + 2 },
		{ text: `เรื่อง`, x: 60, y: (y -= space * 2), font: THSarabunNewBold },
		{ text: data?.request_type, x: 100, y: y },
		{ text: `เรียน`, x: 60, y: (y -= space), font: THSarabunNewBold },
		{ text: `อธิการบดีมหาวิทยาลัยราชภัฏกำแพงเพชร`, x: 100, y: y },
		{ text: `ข้าพเจ้า................................................................................................รหัสประจำตัวนักศึกษา.................................................`, x: 100, y: (y -= space * 2) },
		{ text: data?.student_name, x: 180, y: y + 2 },
		{ text: data?.student_id, x: 460, y: y + 2 },
		{ text: "ระดับ...........................................หลักสูตร...............................................................................สาขาวิชา....................................................", x: 60, y: (y -= space) },
		{ text: data?.education_level, x: 110, y: y + 2 },
		{ text: data?.program, x: 230, y: y + 2 },
		{ text: data?.major_name, x: 440, y: y + 2 },
		{ text: `คณะ..........................................................................................มีความประสงค์.........................................................................................`, x: 60, y: (y -= space) },
		{ text: data?.faculty_name, x: 100, y: y + 2 },
		{ text: `${data?.request_type}`, x: 360, y: y + 2 },
		{ text: `ในภาคเรียนที่ ....................... ในวันที่.....................................................`, x: 60, y: (y -= space) },
		{ text: data?.term, x: 130, y: y + 2 },
		{ text: `${exam_date_day} ${exam_date_month} ${exam_date_year}`, x: 210, y: y + 2 },
		{ text: `จึงเรียนมาเพื่อโปรดพิจารณา`, x: 100, y: (y -= space) },
		{ text: `ลงชื่อ...........................................................................`, x: 310, y: (y -= space * 2) },
		{ text: data?.student_name, x: 370, y: y + 2 },
		{ text: `(.........................................................................)`, x: 330, y: (y -= space) },
		{ text: data?.student_name, x: 370, y: y + 2 },
		{ text: `นักศึกษา`, x: 400, y: (y -= space) },
		{ text: `วันที่................/........................../......................`, x: 330, y: (y -= space) },
		{ text: request_date_day, x: 360, y: y + 2 },
		{ text: request_date_month, x: 400, y: y + 2 },
		{ text: request_date_year, x: 465, y: y + 2 },

		{ text: `1. ความเห็นของอาจารย์ที่ปรึกษาวิทยานิพนธ์/การค้นคว้าอิสระ`, x: 60, y: (y -= space * 2), font: THSarabunNewBold, show: typeof data?.advisor_approvals === "boolean" },
		{ text: data?.advisor_approvals ? "เห็นควรสอบได้" : "ไม่เห็นควร", x: 80, y: (y -= space), show: typeof data?.advisor_approvals === "boolean" },
		{ text: `เนื่องจาก ${data?.comment}`, x: 80, y: (y -= space), show: typeof data?.advisor_approvals === "boolean" && !data.advisor_approvals },
		{ text: `ลงชื่อ.......................................................................`, x: 75, y: (y -= space * 2), show: typeof data?.advisor_approvals === "boolean" },
		{ text: data?.advisor_approvals_id, x: 140, y: y + 2, show: typeof data?.advisor_approvals === "boolean" },
		{ text: `(.....................................................................) `, x: 95, y: (y -= space), show: typeof data?.advisor_approvals === "boolean" },
		{ text: data?.advisor_approvals_id, x: 140, y: y + 2, show: typeof data?.advisor_approvals === "boolean" },
		{ text: `อาจารย์ที่ปรึกษา`, x: 145, y: (y -= space), show: typeof data?.advisor_approvals === "boolean" },
		{ text: `วันที่ ........../................./...................`, x: 110, y: (y -= space), show: typeof data?.advisor_approvals === "boolean" },
		{ text: advisor_approvals_date_day, x: 135, y: y + 2, show: typeof data?.advisor_approvals === "boolean" },
		{ text: advisor_approvals_date_month, x: 170, y: y + 2, show: typeof data?.advisor_approvals === "boolean" },
		{ text: advisor_approvals_date_year, x: 210, y: y + 2, show: typeof data?.advisor_approvals === "boolean" },

		{ text: `2. ความเห็นประธานกรรมการบัณฑิตศึกษาประจำสาขาวิชา`, x: 310, y: (y += space * 7), font: THSarabunNewBold, show: typeof data?.chairpersons_approvals === "boolean" },
		{ text: data?.chairpersons_approvals ? "เห็นควรสอบได้" : "ไม่เห็นควร", x: 330, y: (y -= space), show: typeof data?.chairpersons_approvals === "boolean" },
		{ text: `เนื่องจาก ${data?.comment}`, x: 330, y: (y -= space), show: typeof data?.chairpersons_approvals === "boolean" && !data.chairpersons_approvals },
		{ text: `ลงชื่อ.......................................................................`, x: 325, y: (y -= space * 2), show: typeof data?.chairpersons_approvals === "boolean" },
		{ text: data?.chairpersons_approvals_id, x: 390, y: y + 2, show: typeof data?.chairpersons_approvals === "boolean" },
		{ text: `(.....................................................................) `, x: 345, y: (y -= space), show: typeof data?.chairpersons_approvals === "boolean" },
		{ text: data?.chairpersons_approvals_id, x: 390, y: y + 2, show: typeof data?.chairpersons_approvals === "boolean" },
		{ text: `ประธานกรรมการบัณฑิตศึกษาประจำสาขาวิชา`, x: 340, y: (y -= space), show: typeof data?.chairpersons_approvals === "boolean" },
		{ text: `วันที่ ........../................./...................`, x: 360, y: (y -= space), show: typeof data?.chairpersons_approvals === "boolean" },
		{ text: chairpersons_approvals_date_day, x: 385, y: y + 2, show: typeof data?.chairpersons_approvals === "boolean" },
		{ text: chairpersons_approvals_date_month, x: 420, y: y + 2, show: typeof data?.chairpersons_approvals === "boolean" },
		{ text: chairpersons_approvals_date_year, x: 460, y: y + 2, show: typeof data?.chairpersons_approvals === "boolean" },

		{ text: `3. การตรวจสอบของสำนักส่งเสริมวิชาการและงานทะเบียน`, x: 60, y: (y -= space * 1.5), font: THSarabunNewBold, show: typeof data?.registrar_approvals === "boolean" },
		{ text: data?.registrar_approvals ? `มีสภาพการเป็นนักศึกษา ภาคเรียนที่ ${data?.term}` : `ไม่เห็นควร`, x: 80, y: (y -= space), show: typeof data?.registrar_approvals === "boolean" },
		{ text: data?.registrar_approvals ? `ลงทะเบียนเรียนครบตามหลักสูตร` : `เนื่องจาก ${data?.comment}`, x: 80, y: (y -= space), show: typeof data?.registrar_approvals === "boolean" },
		{ text: `ให้ชำระค่าธรรมเนียมที่ฝ่ายการเงิน`, x: 60, y: (y -= space), show: typeof data?.registrar_approvals === "boolean" && data?.registrar_approvals },
		{ text: `ลงชื่อ.......................................................................`, x: 75, y: (y -= space), show: typeof data?.registrar_approvals === "boolean" },
		{ text: data?.registrar_approvals_id, x: 140, y: y + 2, show: typeof data?.registrar_approvals === "boolean" },
		{ text: `(.....................................................................) `, x: 95, y: (y -= space), show: typeof data?.registrar_approvals === "boolean" },
		{ text: data?.registrar_approvals_id, x: 140, y: y + 2, show: typeof data?.registrar_approvals === "boolean" },
		{ text: `นายทะเบียน`, x: 150, y: (y -= space), show: typeof data?.registrar_approvals === "boolean" },
		{ text: `วันที่ ........../................./...................`, x: 110, y: (y -= space), show: typeof data?.registrar_approvals === "boolean" },
		{ text: registrar_approvals_date_day, x: 135, y: y + 2, show: typeof data?.registrar_approvals === "boolean" },
		{ text: registrar_approvals_date_month, x: 170, y: y + 2, show: typeof data?.registrar_approvals === "boolean" },
		{ text: registrar_approvals_date_year, x: 210, y: y + 2, show: typeof data?.registrar_approvals === "boolean" },

		{ text: `4. ชำระค่าธรรมเนียมการสอบแล้ว ภาคเรียนที่ ${data?.term}`, x: 310, y: (y += space * 7), font: THSarabunNewBold, show: data?.receipt_vol !== null },
		{ text: `จำนวน ${fee.toLocaleString()} บาท `, x: 330, y: (y -= space), show: data?.receipt_vol !== null },
		{ text: `ตามใบเสร็จรับเงิน เล่มที่ ${data?.receipt_vol} เลขที่ ${data?.receipt_vol}`, x: 310, y: (y -= space), show: data?.receipt_vol !== null },
		{ text: `ลงชื่อ.......................................................................`, x: 325, y: (y -= space * 2), show: data?.receipt_vol !== null },
		{ text: "นายณัฐวุฒิ มาตกาง", x: 390, y: y + 2, show: data?.receipt_vol !== null },
		{ text: `(.....................................................................) `, x: 345, y: (y -= space), show: data?.receipt_vol !== null },
		{ text: "นายณัฐวุฒิ มาตกาง", x: 390, y: y + 2, show: data?.receipt_vol !== null },
		{ text: `เจ้าหน้าที่การเงิน`, x: 395, y: (y -= space), show: data?.receipt_vol !== null },
		{ text: `วันที่ ........../................./...................`, x: 360, y: (y -= space), show: data?.receipt_vol !== null },
		{ text: receipt_pay_date_day, x: 385, y: y + 2, show: data?.receipt_vol !== null },
		{ text: receipt_pay_date_month, x: 420, y: y + 2, show: data?.receipt_vol !== null },
		{ text: receipt_pay_date_year, x: 460, y: y + 2, show: data?.receipt_vol !== null },
	];
	drawItems.filter((item) => item.show !== false).forEach((item) => draw(page, item.text, item.x, item.y, item.font, item.size));

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
