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

	const [request_exam_date_year, request_exam_date_month, request_exam_date_day] = data?.request_exam_date.split("-");

	firstPage.drawText(request_exam_date_day || "", {
		x: 360,
		y: 720,
		size: 14,
		font: customFont,
	});
	firstPage.drawText(request_exam_date_month || "", {
		x: 430,
		y: 720,
		size: 14,
		font: customFont,
	});
	firstPage.drawText(request_exam_date_year || "", {
		x: 510,
		y: 720,
		size: 14,
		font: customFont,
	});

	firstPage.drawText(data?.major_name || "", {
		x: 300,
		y: 670,
		size: 14,
		font: customFont,
	});

	firstPage.drawText(data?.student_name || "", {
		x: 220,
		y: 637,
		size: 14,
		font: customFont,
	});

	firstPage.drawText(data?.student_id || "", {
		x: 460,
		y: 637,
		size: 14,
		font: customFont,
	});

	if (data?.education_level === "ปริญญาโท") {
		firstPage.drawText("✓" || "", {
			x: 88,
			y: 615,
			size: 14,
			font: customFontNoto,
		});
	} else {
		firstPage.drawText("✓" || "", {
			x: 145,
			y: 615,
			size: 14,
			font: customFontNoto,
		});
	}

	firstPage.drawText(data?.Program || "", {
		x: 250,
		y: 615,
		size: 14,
		font: customFont,
	});

	firstPage.drawText(data?.major_name || "", {
		x: 420,
		y: 618,
		size: 14,
		font: customFont,
	});

	firstPage.drawText(data?.faculty_name || "", {
		x: 90,
		y: 600,
		size: 14,
		font: customFont,
	});

	if (data?.education_level === "ปริญญาโท") {
		firstPage.drawText("✓" || "", {
			x: 348,
			y: 596,
			size: 14,
			font: customFontNoto,
		});
	} else {
		firstPage.drawText("✓" || "", {
			x: 450,
			y: 596,
			size: 14,
			font: customFontNoto,
		});
	}

	firstPage.drawText("day" || "", {
		x: 280,
		y: 580,
		size: 14,
		font: customFont,
	});
	firstPage.drawText("month" || "", {
		x: 330,
		y: 580,
		size: 14,
		font: customFont,
	});
	firstPage.drawText("year" || "", {
		x: 430,
		y: 580,
		size: 14,
		font: customFont,
	});

	firstPage.drawText(data?.student_name || "", {
		x: 370,
		y: 500,
		size: 14,
		font: customFont,
	});

	firstPage.drawText(data?.student_name || "", {
		x: 370,
		y: 481,
		size: 14,
		font: customFont,
	});

	firstPage.drawText(request_exam_date_day || "", {
		x: 360,
		y: 463,
		size: 14,
		font: customFont,
	});
	firstPage.drawText(request_exam_date_month || "", {
		x: 420,
		y: 463,
		size: 14,
		font: customFont,
	});
	firstPage.drawText(request_exam_date_year || "", {
		x: 470,
		y: 463,
		size: 14,
		font: customFont,
	});
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
