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

	drawGrid(page);

	const [request_date_day, request_date_month, request_date_year] = formatThaiDate(data?.request_date);
	const [advisor_cancel_date_day, advisor_cancel_date_month, advisor_cancel_date_year] = formatThaiDateShort(data?.advisor_approvals_date);
	const [chairpersons_cancel_date_day, chairpersons_cancel_date_month, chairpersons_cancel_date_year] = formatThaiDateShort(data?.chairpersons_approvals_date);
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
		{ text: advisor_cancel_date_day, x: 135, y: y + 2, show: typeof data?.advisor_approvals === "boolean" },
		{ text: advisor_cancel_date_month, x: 170, y: y + 2, show: typeof data?.advisor_approvals === "boolean" },
		{ text: advisor_cancel_date_year, x: 210, y: y + 2, show: typeof data?.advisor_approvals === "boolean" },

		{ text: `2. ความเห็นประธานกรรมการบัณฑิตศึกษาประจำสาขาวิชา`, x: 310, y: (y += space * 7), font: THSarabunNewBold, show: typeof data?.chairpersons_approvals === "boolean" },
		{ text: data?.chairpersons_approvals ? "เห็นควรอนุญาต" : "ไม่อนุญาต", x: 330, y: (y -= space), show: typeof data?.chairpersons_approvals === "boolean" },
		{ text: `เนื่องจาก ${data?.comment}`, x: 330, y: (y -= space), show: typeof data?.chairpersons_approvals === "boolean" && !data.chairpersons_approvals },
		{ text: `ลงชื่อ.......................................................................`, x: 325, y: (y -= space * 2), show: typeof data?.chairpersons_approvals === "boolean" },
		{ text: data?.chairpersons_approvals_id, x: 390, y: y + 2, show: typeof data?.chairpersons_approvals === "boolean" },
		{ text: `(.....................................................................) `, x: 345, y: (y -= space), show: typeof data?.chairpersons_approvals === "boolean" },
		{ text: data?.chairpersons_approvals_id, x: 390, y: y + 2, show: typeof data?.chairpersons_approvals === "boolean" },
		{ text: `ประธานกรรมการบัณฑิตศึกษาประจำสาขาวิชา`, x: 340, y: (y -= space), show: typeof data?.chairpersons_approvals === "boolean" },
		{ text: `วันที่ ........../................./...................`, x: 360, y: (y -= space), show: typeof data?.chairpersons_approvals === "boolean" },
		{ text: chairpersons_cancel_date_day, x: 385, y: y + 2, show: typeof data?.chairpersons_approvals === "boolean" },
		{ text: chairpersons_cancel_date_month, x: 420, y: y + 2, show: typeof data?.chairpersons_approvals === "boolean" },
		{ text: chairpersons_cancel_date_year, x: 460, y: y + 2, show: typeof data?.chairpersons_approvals === "boolean" },
	];

	drawItems.filter((item) => item.show !== false).forEach((item) => draw(page, item.text, item.x, item.y, item.font, item.size));

	typeof data?.advisor_approvals === "boolean" && drawRect(page, 50, y - 10, 250, space * 8.5);
	typeof data?.chairpersons_approvals === "boolean" && drawRect(page, 300, y - 10, 250, space * 8.5);

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
