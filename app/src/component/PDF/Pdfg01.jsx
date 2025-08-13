import fontkit from "@pdf-lib/fontkit";
import { PDFDocument, rgb } from "pdf-lib";
import { Button } from "@mantine/core";

async function fillPdf(templateUrl, data) {
	const existingPdfBytes = await fetch(templateUrl).then((res) => res.arrayBuffer());
	const pdfDoc = await PDFDocument.load(existingPdfBytes);
	pdfDoc.registerFontkit(fontkit);
	const fontBytes = await fetch("/fonts/THSarabunNew.ttf").then((res) => res.arrayBuffer());
	const customFont = await pdfDoc.embedFont(fontBytes);
	const fontBytesNoto = await fetch("/fonts/DejaVuSans.ttf").then((r) => r.arrayBuffer());
	const customFontNoto = await pdfDoc.embedFont(fontBytesNoto);
	const pages = pdfDoc.getPages();
	const firstPage = pages[0];

	// helper function สำหรับ drawText
	const draw = (text, x, y, font = customFont, size = 14) => {
		if (text !== undefined && text !== null) {
			firstPage.drawText(String(text), { x, y, size, font });
		}
	};

	const splitDate = (str) => (str ? str.split("-") : [null, null, null]);

	const [request_exam_date_year, request_exam_date_month, request_exam_date_day] = splitDate(data?.request_exam_date);
	const [advisor_approvals_date_year, advisor_approvals_date_month, advisor_approvals_date_day] = splitDate(data?.advisor_approvals_date);
	const [chairpersons_approvals_date_year, chairpersons_approvals_date_month, chairpersons_approvals_date_day] = splitDate(data?.chairpersons_approvals_date);
	const [registrar_approvals_date_year, registrar_approvals_date_month, registrar_approvals_date_day] = splitDate(data?.registrar_approvals_date);

	const drawItems = [
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
		/* ----------------------------------------------------------------------------- */
		{ text: "✓", x: 76, y: data?.advisor_approvals ? 403 : 383, font: customFontNoto, show: typeof data?.chairpersons_approvals === "boolean" },
		{ text: data?.comment, x: 80, y: 369, show: typeof data?.chairpersons_approvals === "boolean" && !data.chairpersons_approvals },

		{ text: data?.advisor_approvals_name, x: 110, y: 350 },
		{ text: data?.advisor_approvals_name, x: 110, y: 330 },

		{ text: advisor_approvals_date_day, x: 110, y: 311 },
		{ text: advisor_approvals_date_month, x: 145, y: 311 },
		{ text: advisor_approvals_date_year, x: 180, y: 311 },
		/* ----------------------------------------------------------------------------- */
		{ text: "✓", x: data?.chairpersons_approvals ? 342 : 389, y: 403, font: customFontNoto, show: typeof data?.chairpersons_approvals === "boolean" },
		{ text: data?.comment, x: 360, y: 386, show: typeof data?.chairpersons_approvals === "boolean" && !data.chairpersons_approvals },

		{ text: data?.chairpersons_approvals_name, x: 390, y: 370 },
		{ text: data?.chairpersons_approvals_name, x: 390, y: 350 },

		{ text: chairpersons_approvals_date_day, x: 410, y: 311 },
		{ text: chairpersons_approvals_date_month, x: 440, y: 311 },
		{ text: chairpersons_approvals_date_year, x: 480, y: 311 },
		/* ----------------------------------------------------------------------------- */
		{ text: "✓", x: 80, y: data?.registrar_approvals ? 270 : 210, font: customFontNoto, show: typeof data?.registrar_approvals === "boolean" },
		{ text: "✓", x: 80, y: data?.registrar_approvals ? 250 : 210, font: customFontNoto, show: typeof data?.registrar_approvals === "boolean" },
		{ text: data?.comment, x: 160, y: 220, show: typeof data?.registrar_approvals === "boolean" && !data.registrar_approvals },

		{ text: data?.registrar_approvals_name, x: 110, y: 180 },
		{ text: data?.registrar_approvals_name, x: 110, y: 160 },

		/* 		{ text: registrar_approvals_date_day, x: 410, y: 311 },
		{ text: registrar_approvals_date_month, x: 440, y: 311 },
		{ text: registrar_approvals_date_year, x: 480, y: 311 }, */
	];

	// loop วาด
	drawItems.filter((item) => item.show !== false).forEach((item) => draw(item.text, item.x, item.y, item.font, item.size));

	// ขนาดหน้ากระดาษ (ประมาณ) เพื่อกำหนดขอบเขตตีเส้น
	const pageWidth = firstPage.getWidth();
	const pageHeight = firstPage.getHeight();

	// ตีเส้นแกน X (แนวนอน) ทุก 10 หน่วย
	for (let x = 0; x <= pageWidth; x += 10) {
		firstPage.drawLine({
			start: { x: x, y: 0 },
			end: { x: x, y: pageHeight },
			thickness: 0.3,
			color: rgb(0.8, 0.8, 0.8),
		});

		firstPage.drawText(`${x}`, { x: x + 1, y: 5, size: 6, color: rgb(1, 0, 0) });
	}

	// ตีเส้นแกน Y (แนวตั้ง) ทุก 10 หน่วย
	for (let y = 0; y <= pageHeight; y += 10) {
		firstPage.drawLine({
			start: { x: 0, y: y },
			end: { x: pageWidth, y: y },
			thickness: 0.3,
			color: rgb(0.8, 0.8, 0.8),
		});

		firstPage.drawText(`${y}`, { x: 2, y: y + 1, size: 6, color: rgb(0, 0, 1) });
	}

	const pdfBytes = await pdfDoc.save();
	return new Blob([pdfBytes], { type: "application/pdf" });
}

export default function Pdfg01({ data }) {
	const handleClick = async () => {
		const blob = await fillPdf("/pdf/g01.pdf", data);
		const url = URL.createObjectURL(blob);
		window.open(url, "_blank");
	};

	return (
		<Button size="xs" color="gray" onClick={handleClick}>
			ข้อมูล
		</Button>
	);
}
