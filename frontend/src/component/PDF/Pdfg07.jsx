import fontkit from "@pdf-lib/fontkit";
import { PDFDocument, rgb } from "pdf-lib";
import { Button } from "@mantine/core";
import { setDefaultFont, drawGrid, draw, drawRect, drawCenterXText, formatThaiDate, formatThaiDateShort, fetchPersonDataAndSignature, drawSignature } from "./PdfUtils.js";
const BASE_URL = import.meta.env.VITE_API_URL;

async function fillPdf(data) {
	// 1. สร้างเอกสาร PDF
	const pdfDoc = await PDFDocument.create();
	pdfDoc.registerFontkit(fontkit);
	const page = pdfDoc.addPage([595, 842]);

	await setDefaultFont(pdfDoc);
	const THSarabunNewBytesBold = await fetch("/fonts/THSarabunNew Bold.ttf").then((res) => res.arrayBuffer());
	const THSarabunNewBold = await pdfDoc.embedFont(THSarabunNewBytesBold);

	/* drawGrid(page); */
	const token = localStorage.getItem("token");

	// 2. [แก้ไข] ใช้ fetchPersonDataAndSignature แทน Loop เดิม
	const ids = {
		advisor: "advisor_approvals_id",
		chairpersons: "chairpersons_approvals_id",
		dean: "dean_approvals_id", // Pdfg07 ใช้ dean
	};

	// ดึงรูปภาพและชื่อ (data จะถูกอัปเดตเป็น _name อัตโนมัติจากฟังก์ชันนี้)
	const signatureImages = await fetchPersonDataAndSignature(pdfDoc, data, ids);

	const [request_date_day, request_date_month, request_date_year] = formatThaiDate(data?.request_date);
	const [advisor_approvals_date_day, advisor_approvals_date_month, advisor_approvals_date_year] = formatThaiDateShort(data?.advisor_approvals_date);
	const [chairpersons_approvals_date_day, chairpersons_approvals_date_month, chairpersons_approvals_date_year] = formatThaiDateShort(data?.chairpersons_approvals_date);
	const [dean_approvals_date_day, dean_approvals_date_month, dean_approvals_date_year] = formatThaiDateShort(data?.dean_approvals_date);

	let y = 760;
	let space = 20;

	drawCenterXText(page, `คำร้อง${data.request_type}`, 780, THSarabunNewBold, 20);

	const drawItems = [
		{ text: `มหาวิทยาลัยราชภัฏกำแพงเพชร`, x: 420, y: (y -= space) },
		{ text: `วันที่................เดือน...........................พ.ศ...................`, x: 350, y: (y -= space) },
		{ text: request_date_day, x: 380, y: y + 2 },
		{ text: request_date_month, x: 440, y: y + 2 },
		{ text: request_date_year, x: 510, y: y + 2 },
		{ text: `เรื่อง`, x: 60, y: (y -= space * 2), font: THSarabunNewBold },
		{ text: data.request_type, x: 100, y: y },
		{ text: `เรียน`, x: 60, y: (y -= space), font: THSarabunNewBold },
		{ text: `คณบดี${data?.faculty_name}`, x: 100, y: y },
		{ text: `ข้าพเจ้า................................................................................................รหัสประจำตัวนักศึกษา.................................................`, x: 100, y: (y -= space * 2) },
		{ text: data?.student_name, x: 180, y: y + 2 },
		{ text: data?.student_id, x: 460, y: y + 2 },
		{ text: "ระดับ...........................................หลักสูตร...............................................................................สาขาวิชา....................................................", x: 60, y: (y -= space) },
		{ text: data?.education_level, x: 110, y: y + 2 },
		{ text: data?.program, x: 230, y: y + 2 },
		{ text: data?.major_name, x: 440, y: y + 2 },
		{ text: `คณะ..........................................................................................มีความประสงค์.........................................................................................`, x: 60, y: (y -= space) },
		{ text: data?.faculty_name, x: 100, y: y + 2 },
		{ text: data.request_type, x: 360, y: y + 2 },
		{ text: "เนื่่องจาก.....................................................................................................................................................................................................", x: 60, y: (y -= space) },
		{ text: data?.reason, x: 140, y: y + 2 },
		{ text: `จึงเรียนมาเพื่อโปรดพิจารณา`, x: 100, y: (y -= space) },

		// --- ส่วนนักศึกษา (จัดกึ่งกลางตามแบบ Pdfg01) ---
		{ text: `ลงชื่อ...........................................................................`, x: 325, y: (y -= space * 2) },
		{ text: data?.student_name, x: 425, y: y + 2, centered: true }, // ชื่อบนลายเซ็น (ถ้ามี)
		{ text: `(.........................................................................)`, x: 345, y: (y -= space) },
		{ text: data?.student_name, x: 425, y: y + 2, centered: true }, // ชื่อในวงเล็บ
		{ text: `นักศึกษา`, x: 425, y: (y -= space), centered: true }, // คำว่านักศึกษา

		{ text: `วันที่................/........................../......................`, x: 330, y: (y -= space) },
		{ text: request_date_day, x: 360, y: y + 2 },
		{ text: request_date_month, x: 400, y: y + 2 },
		{ text: request_date_year, x: 465, y: y + 2 },

		// --- 1. อาจารย์ที่ปรึกษา ---
		{ text: `1. ความเห็นของอาจารย์ที่ปรึกษาหมู่เรียน`, x: 60, y: (y -= space * 2), font: THSarabunNewBold, show: typeof data?.advisor_approvals === "boolean" },
		{ text: data?.advisor_approvals ? "เห็นควรอนุญาต" : "ไม่อนุญาต", x: 80, y: (y -= space), show: typeof data?.advisor_approvals === "boolean" },
		{ text: `เนื่องจาก ${data?.comment}`, x: 80, y: (y -= space), show: typeof data?.advisor_approvals === "boolean" && !data.advisor_approvals },
		{ text: `ลงชื่อ.......................................................................`, x: 75, y: (y -= space * 2), show: typeof data?.advisor_approvals === "boolean" },

		// รูปภาพลายเซ็น
		{ text: "", x: 175, y: y + 2, show: typeof data?.advisor_approvals === "boolean", image: signatureImages.advisor },

		{ text: `(.....................................................................) `, x: 95, y: (y -= space), show: typeof data?.advisor_approvals === "boolean" },
		{ text: data?.advisor_approvals_name, x: 175, y: y + 2, show: typeof data?.advisor_approvals === "boolean", centered: true },
		{ text: `อาจารย์ที่ปรึกษา`, x: 145, y: (y -= space), show: typeof data?.advisor_approvals === "boolean" },
		{ text: `วันที่ ........../................./...................`, x: 110, y: (y -= space), show: typeof data?.advisor_approvals === "boolean" },
		{ text: advisor_approvals_date_day, x: 135, y: y + 2, show: typeof data?.advisor_approvals === "boolean" },
		{ text: advisor_approvals_date_month, x: 170, y: y + 2, show: typeof data?.advisor_approvals === "boolean" },
		{ text: advisor_approvals_date_year, x: 210, y: y + 2, show: typeof data?.advisor_approvals === "boolean" },

		// --- 2. ประธานกรรมการ ---
		{ text: `2. ความเห็นประธานกรรมการบัณฑิตศึกษาประจำสาขาวิชา`, x: 310, y: (y += space * 7), font: THSarabunNewBold, show: typeof data?.chairpersons_approvals === "boolean" },
		{ text: data?.chairpersons_approvals ? "เห็นควรอนุญาต" : "ไม่อนุญาต", x: 330, y: (y -= space), show: typeof data?.chairpersons_approvals === "boolean" },
		{ text: `เนื่องจาก ${data?.comment}`, x: 330, y: (y -= space), show: typeof data?.chairpersons_approvals === "boolean" && !data.chairpersons_approvals },
		{ text: `ลงชื่อ.......................................................................`, x: 325, y: (y -= space * 2), show: typeof data?.chairpersons_approvals === "boolean" },

		// รูปภาพลายเซ็น
		{ text: "", x: 425, y: y + 2, show: typeof data?.chairpersons_approvals === "boolean", image: signatureImages.chairpersons },

		{ text: `(.....................................................................) `, x: 345, y: (y -= space), show: typeof data?.chairpersons_approvals === "boolean" },
		{ text: data?.chairpersons_approvals_name, x: 425, y: y + 2, show: typeof data?.chairpersons_approvals === "boolean", centered: true },
		{ text: `ประธานกรรมการบัณฑิตศึกษาประจำสาขาวิชา`, x: 340, y: (y -= space), show: typeof data?.chairpersons_approvals === "boolean" },
		{ text: `วันที่ ........../................./...................`, x: 360, y: (y -= space), show: typeof data?.chairpersons_approvals === "boolean" },
		{ text: chairpersons_approvals_date_day, x: 385, y: y + 2, show: typeof data?.chairpersons_approvals === "boolean" },
		{ text: chairpersons_approvals_date_month, x: 420, y: y + 2, show: typeof data?.chairpersons_approvals === "boolean" },
		{ text: chairpersons_approvals_date_year, x: 460, y: y + 2, show: typeof data?.chairpersons_approvals === "boolean" },

		// --- 3. คณบดี (Dean) ---
		// ปรับตำแหน่ง X ให้กึ่งกลางอยู่ที่ประมาณ 300 (จากเดิม 245-45 = 200, ลองขยับให้สวยงาม)
		{ text: `3. ความเห็นคณบดี${data?.faculty_name}`, x: 185, y: (y -= space * 1.5), font: THSarabunNewBold, show: data?.dean_approvals !== null },
		{ text: data?.dean_approvals ? "อนุญาต" : "ไม่อนุญาต", x: 205, y: (y -= space), show: data?.dean_approvals !== null },
		{ text: `เนื่องจาก ${data?.comment}`, x: 250, y: (y -= space), show: data?.dean_approvals !== null && !data.dean_approvals },
		{ text: `ลงชื่อ.......................................................................`, x: 200, y: (y -= space * 2), show: data?.dean_approvals !== null },

		// รูปภาพลายเซ็น (Key: dean, Center X: 300)
		{ text: "", x: 300, y: y + 2, show: data?.dean_approvals !== null, image: signatureImages.dean },

		{ text: `(.....................................................................) `, x: 220, y: (y -= space), show: data?.dean_approvals !== null },
		{ text: data?.dean_approvals_name, x: 300, y: y + 2, show: data?.dean_approvals !== null, centered: true },
		{ text: `คณบดี${data?.faculty_name}`, x: 260, y: (y -= space), show: data?.dean_approvals !== null },
		{ text: `วันที่ ........../................./...................`, x: 235, y: (y -= space), show: data?.dean_approvals !== null },
		{ text: dean_approvals_date_day, x: 260, y: y + 2, show: data?.dean_approvals !== null },
		{ text: dean_approvals_date_month, x: 295, y: y + 2, show: data?.dean_approvals !== null },
		{ text: dean_approvals_date_year, x: 335, y: y + 2, show: data?.dean_approvals !== null },
	];

	drawItems
		.filter((item) => item.show !== false)
		.forEach((item) => {
			let drawX = item.x;
			if (item.centered && item.text) {
				const fontToUse = item.font || THSarabunNewBold;
				const sizeToUse = item.size || 14;
				const textWidth = fontToUse.widthOfTextAtSize(item.text, sizeToUse);
				drawX = item.x - textWidth / 2;
			}
			draw(page, item.text, drawX, item.y, item.font, item.size);
			if (item.image) {
				drawSignature(page, item.image, item.x, item.y);
			}
		});

	typeof data?.advisor_approvals === "boolean" && drawRect(page, 50, y + space * 8, 250, space * 8.5);
	typeof data?.chairpersons_approvals === "boolean" && drawRect(page, 300, y + space * 8, 250, space * 8.5);
	data?.dean_approvals !== null && drawRect(page, 50, y - space * 0.5, 500, space * 8.5);

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
/* import fontkit from "@pdf-lib/fontkit";
import { PDFDocument, rgb } from "pdf-lib";
import { Button } from "@mantine/core";
import { setDefaultFont, drawGrid, draw, drawRect, drawCenterXText, formatThaiDate, formatThaiDateShort } from "./PdfUtils.js";
const BASE_URL = import.meta.env.VITE_API_URL;

async function fillPdf(data) {
	const pdfDoc = await PDFDocument.create();
	pdfDoc.registerFontkit(fontkit);
	const page = pdfDoc.addPage([595, 842]);

	await setDefaultFont(pdfDoc);
	const THSarabunNewBytesBold = await fetch("/fonts/THSarabunNew Bold.ttf").then((res) => res.arrayBuffer());
	const THSarabunNewBold = await pdfDoc.embedFont(THSarabunNewBytesBold);

	const token = localStorage.getItem("token");
	const ids = {
		advisor: "advisor_approvals_id",
		chairpersons: "chairpersons_approvals_id",
		registrar: "dean_approvals_id",
	};
	try {
		for (const [role, prop] of Object.entries(ids)) {
			const id = data?.[prop];
			if (!id || isNaN(Number(id))) continue;
			const res = await fetch(`${BASE_URL}/api/personnelInfo`, {
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

	const [request_date_day, request_date_month, request_date_year] = formatThaiDate(data?.request_date);
	const [advisor_approvals_date_day, advisor_approvals_date_month, advisor_approvals_date_year] = formatThaiDateShort(data?.advisor_approvals_date);
	const [chairpersons_approvals_date_day, chairpersons_approvals_date_month, chairpersons_approvals_date_year] = formatThaiDateShort(data?.chairpersons_approvals_date);
	const [dean_approvals_date_day, dean_approvals_date_month, dean_approvals_date_year] = formatThaiDateShort(data?.dean_approvals_date);

	let y = 760;
	let space = 20;

	drawCenterXText(page, `คำร้อง${data.request_type}`, 780, THSarabunNewBold, 20);

	const drawItems = [
		{ text: `มหาวิทยาลัยราชภัฏกำแพงเพชร`, x: 420, y: (y -= space) },
		{ text: `วันที่................เดือน...........................พ.ศ...................`, x: 350, y: (y -= space) },
		{ text: request_date_day, x: 380, y: y + 2 },
		{ text: request_date_month, x: 440, y: y + 2 },
		{ text: request_date_year, x: 510, y: y + 2 },
		{ text: `เรื่อง`, x: 60, y: (y -= space * 2), font: THSarabunNewBold },
		{ text: data.request_type, x: 100, y: y },
		{ text: `เรียน`, x: 60, y: (y -= space), font: THSarabunNewBold },
		{ text: `คณบดี${data?.faculty_name}`, x: 100, y: y },
		{ text: `ข้าพเจ้า................................................................................................รหัสประจำตัวนักศึกษา.................................................`, x: 100, y: (y -= space * 2) },
		{ text: data?.student_name, x: 180, y: y + 2 },
		{ text: data?.student_id, x: 460, y: y + 2 },
		{ text: "ระดับ...........................................หลักสูตร...............................................................................สาขาวิชา....................................................", x: 60, y: (y -= space) },
		{ text: data?.education_level, x: 110, y: y + 2 },
		{ text: data?.program, x: 230, y: y + 2 },
		{ text: data?.major_name, x: 440, y: y + 2 },
		{ text: `คณะ..........................................................................................มีความประสงค์.........................................................................................`, x: 60, y: (y -= space) },
		{ text: data?.faculty_name, x: 100, y: y + 2 },
		{ text: data.request_type, x: 360, y: y + 2 },
		{ text: "เนื่่องจาก.....................................................................................................................................................................................................", x: 60, y: (y -= space) },
		{ text: data?.reason, x: 140, y: y + 2 },
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

		{ text: `1. ความเห็นของอาจารย์ที่ปรึกษาหมู่เรียน`, x: 60, y: (y -= space * 2), font: THSarabunNewBold, show: typeof data?.advisor_approvals === "boolean" },
		{ text: data?.advisor_approvals ? "เห็นควรอนุญาต" : "ไม่อนุญาต", x: 80, y: (y -= space), show: typeof data?.advisor_approvals === "boolean" },
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
		{ text: data?.chairpersons_approvals ? "เห็นควรอนุญาต" : "ไม่อนุญาต", x: 330, y: (y -= space), show: typeof data?.chairpersons_approvals === "boolean" },
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

		{ text: `3. ความเห็นคณบดี${data?.faculty_name}`, x: 185, y: (y -= space * 1.5), font: THSarabunNewBold, show: data?.dean_approvals !== null },
		{ text: data?.dean_approvals ? "อนุญาต" : "ไม่อนุญาต", x: 205, y: (y -= space), show: data?.dean_approvals !== null },
		{ text: `เนื่องจาก ${data?.comment}`, x: 250, y: (y -= space), show: data?.dean_approvals !== null && !data.dean_approvals },
		{ text: `ลงชื่อ.......................................................................`, x: 245 - 45, y: (y -= space * 2), show: data?.dean_approvals !== null },
		{ text: data?.dean_approvals_id, x: 310 - 45, y: y + 2, show: data?.dean_approvals !== null },
		{ text: `(.....................................................................) `, x: 265 - 45, y: (y -= space), show: data?.dean_approvals !== null },
		{ text: data?.dean_approvals_id, x: 310 - 45, y: y + 2, show: data?.dean_approvals !== null },
		{ text: `คณบดี${data?.faculty_name}`, x: 260, y: (y -= space), show: data?.dean_approvals !== null },
		{ text: `วันที่ ........../................./...................`, x: 290 - 55, y: (y -= space), show: data?.dean_approvals !== null },
		{ text: dean_approvals_date_day, x: 315 - 55, y: y + 2, show: data?.dean_approvals !== null },
		{ text: dean_approvals_date_month, x: 350 - 55, y: y + 2, show: data?.dean_approvals !== null },
		{ text: dean_approvals_date_year, x: 390 - 55, y: y + 2, show: data?.dean_approvals !== null },
	];

	drawItems.filter((item) => item.show !== false).forEach((item) => draw(page, item.text, item.x, item.y, item.font, item.size));

	typeof data?.advisor_approvals === "boolean" && drawRect(page, 50, y + space * 8, 250, space * 8.5);
	typeof data?.chairpersons_approvals === "boolean" && drawRect(page, 300, y + space * 8, 250, space * 8.5);
	data?.dean_approvals !== null && drawRect(page, 50, y - space * 0.5, 500, space * 8.5);

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
 */
