import fontkit from "@pdf-lib/fontkit";
import { PDFDocument, rgb } from "pdf-lib";
import { Button } from "@mantine/core";

async function fillPdf(data) {
	/* blank */ /* g05 */
	const pdfDoc = await PDFDocument.create();
	pdfDoc.registerFontkit(fontkit);

	const page = pdfDoc.addPage([595, 842]);

	const logoBytes = await fetch("/image/krut-3-cm.png").then((res) => res.arrayBuffer());
	const logoImage = await pdfDoc.embedPng(logoBytes);
	const pngDims = logoImage.scale(0.085);

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
	const drawLine = (page, x1, y1, x2, y2, w = 1) => page.drawLine({ start: { x: x1, y: y1 }, end: { x: x2, y: y2 }, thickness: w, color: rgb(0, 0, 0) });
	const drawRect = (page, x, y, w, h, lineW = 1) => {
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

	drawGrid(page);

	let y = 760;
	let space = 20;
	const lavel = "ปริญญาเอก";

	page.drawImage(logoImage, {
		x: 60,
		y: y,
		width: pngDims.width,
		height: pngDims.height,
	});
	drawCenterXText(page, "บันทึกข้อความ", y + 20, THSarabunNewBold, 20);

	const drawItems = [
		{ text: "ส่วนราชการ", x: 60, y: (y -= space), font: THSarabunNewBold },
		{ text: "มหาวิทยาลัยราชภัฏกำแพงเพชร", x: 120, y: y },
		{ text: "ที่………………………………………………………………                                       วันที่………………เดือน……………………………พ.ศ………………", x: 60, y: (y -= space) },
		{ text: "เรื่อง    ขอสำเร็จการศึกษาระดับบัณฑิตศึกษา", x: 60, y: (y -= space) },
		{ text: "เรียน    อธิการบดีมหาวิทยาลัยราชภัฏกำแพงเพชร", x: 60, y: (y -= space) },
		{ text: "ข้าพเจ้า………………………………………………………………………………………………………………………………………………………", x: 100, y: (y -= space) },
		{ text: "ระดับปริญญาโท  สาขา………………………………………………………………รหัสประจำตัว………………………………………………….", x: 80, y: y - space, show: lavel === "ปริญญาโท" },
		{ text: "วุฒิเดิมในระดับปริญญาตรี  สาขา…………………………………………มหาวิทยาลัย…………………………………………………..", x: 100, y: y - space * 2, show: lavel === "ปริญญาโท" },
		{ text: "ระดับปริญญาเอก  สาขา………………………………………………………………รหัสประจำตัว………………………………………………….", x: 80, y: y - space, show: lavel === "ปริญญาเอก" },
		{ text: "วุฒิเดิมในระดับปริญญาตรี  สาขา………………………………………….มหาวิทยาลัย…………………………………………………..", x: 100, y: y - space * 2, show: lavel === "ปริญญาเอก" },
		{ text: "วุฒิเดิมในระดับปริญญาโท  สาขา………………………………………….มหาวิทยาลัย……………………………………………………", x: 100, y: y - space * 3, show: lavel === "ปริญญาเอก" },
		{ text: "เกิดวันที่………………เดือน………………………………พ.ศ………………", x: 100, y: lavel === "ปริญญาโท" ? (y -= space * 3) : (y -= space * 4) },
		{ text: "ที่อยู่สามารถติดต่อได้  บ้านเลขที่…………………..หมู่ที่……..…………ถนน………………….ตำบล……………..…….………..", x: 60, y: (y -= space) },
		{ text: "อำเภอ……………………………..จังหวัด……………………รหัสไปรษณีย์………………….โทรศัพท์………………….……………..", x: 60, y: (y -= space) },
		{ text: "สถานที่ทำงานปัจจุบัน…………………..…………หมู่ที่………………..ถนน…………………..ตำบล…………………………………", x: 60, y: (y -= space) },
		{ text: "อำเภอ……………………………..จังหวัด……………………รหัสไปรษณีย์………………….โทรศัพท์………………….……………..", x: 60, y: (y -= space) },
		{ text: "สังกัดหน่วยงาน………………………………..……........................... ได้ศึกษาจนครบหลักสูตรจึงขอสำเร็จการศึกษาในภาคเรียนนี้", x: 60, y: (y -= space) },
		{ text: "จึงเรียนมาเพื่อโปรดพิจารณา", x: 100, y: (y -= space) },
		{ text: "ลงชื่อ…………………………………..( นักศึกษา )", x: 240, y: (y -= space) },
		{ text: "(………………………………….)", x: 260, y: (y -= space) },
		{ text: "ความเห็นของอาจารย์ที่ปรึกษา", x: 60, y: (y -= space) },
		{ text: "ศึกษารายวิชาและจำนวนหน่วยกิตครบตามหลักสูตรเรียบร้อยแล้ว ", x: 100, y: (y -= space) },
		{ text: "สอบประมวลความรู้/สอบวัดคุณสมบัติ ผ่านเรียบร้อย ", x: 100, y: (y -= space) },
		{ text: "กำลังดำเนินการทำวิทยานิพนธ์  ในขั้น…………………………………….", x: 100, y: (y -= space) },
		{ text: "ลงชื่อ……………….............................อาจารย์ที่ปรึกษา              ลงชื่อ…………………………………. ..ประธานคณะกรรมการ ", x: 60, y: (y -= space * 2) },
		{ text: "(…………………………………)                                   (.........................................................) บัณฑิตศึกษาประจำสาขาวิชา", x: 90, y: (y -= space) },
		{ text: "ชำระเงิน", x: 60, y: (y -= space) },
		{ text: "ทางฝ่ายการเงินได้รับเงินค่าลงทะเบียนบัณฑิต  จำนวน  1,000  บาท  ในใบเสร็จรับเงิน……………./…………....", x: 100, y: (y -= space) },
		{ text: "ลงชื่อ……………………………..…………ผู้รับเงิน", x: 240, y: (y -= space) },
		{ text: "(………………………………………)", x: 260, y: (y -= space) },
		{ text: "------------------------------------------------------------------------------------------------------------------------------------------------------------------ ", x: 60, y: (y -= space) },
		{ text: "กรุณานำส่ง", x: 240, y: (y -= space * 2), font: THSarabunNewBold },
		{ text: "สถานที่ติดต่อเพื่อแจ้งรายละเอียด", x: 60, y: (y -= space) },
		{ text: "คุณ………………………………………………………………………….", x: 270, y: y },
		{ text: "เกี่ยวกับพิธีพระราชทานปริญญาบัตร", x: 60, y: (y -= space) },
		{ text: "เลขที่………………………ถนน………………………………………..", x: 270, y: y },
		{ text: "ตำบล……………………………อำเภอ……………………………….", x: 270, y: (y -= space) },
		{ text: "จังหวัด……………………………รหัสไปรษณีย์……………………", x: 270, y: (y -= space) },
	];
	drawLine(page, 60, y + space * 31.75, 550, y + space * 31.75);
	drawRect(page, 230, (y -= space), 300, space * 6);
	drawItems.filter((item) => item.show !== false).forEach((item) => draw(page, item.text, item.x, item.y, item.font, item.size));

	const pdfBytes = await pdfDoc.save();
	return new Blob([pdfBytes], { type: "application/pdf" });
}

export default function Pdfg02({ data, showType }) {
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
