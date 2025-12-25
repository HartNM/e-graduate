import fontkit from "@pdf-lib/fontkit";
import { PDFDocument, rgb } from "pdf-lib";
import { Button } from "@mantine/core";
import { setDefaultFont, drawGrid, draw, drawRect, drawCenterXText, drawLine, formatThaiDate, formatThaiDateShort } from "./PdfUtils.js";

async function fillPdf(data) {
	const pdfDoc = await PDFDocument.create();
	pdfDoc.registerFontkit(fontkit);
	const page = pdfDoc.addPage([595, 842]);

	await setDefaultFont(pdfDoc);
	const THSarabunNewBytesBold = await fetch("/fonts/THSarabunNew Bold.ttf").then((res) => res.arrayBuffer());
	const THSarabunNewBold = await pdfDoc.embedFont(THSarabunNewBytesBold);

	const logoBytes = await fetch("/image/krut-3-cm.png").then((res) => res.arrayBuffer());
	const logoImage = await pdfDoc.embedPng(logoBytes);
	const pngDims = logoImage.scale(0.085);

	function formatBdateDate(dateStr) {
		if (!dateStr) return ["", "", ""];	
		const [day, month, year] = dateStr.split("/");
		const monthsFull = ["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"];
		const monthName = monthsFull[parseInt(month, 10) - 1] || "";
		return [day, monthName, year];
	}

	/* drawGrid(page); */

	let y = 760;
	let space = 20;

	const [request_date_day, request_date_month, request_date_year] = formatThaiDate(data?.request_date);
	const [BDATE_day, BDATE_month, BDATE_year] = formatBdateDate(data?.BDATE);
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
		{ text: request_date_day, x: 370, y: y + 2 },
		{ text: request_date_month, x: 440, y: y + 2 },
		{ text: request_date_year, x: 520, y: y + 2 },
		{ text: "เรื่อง    ขอสำเร็จการศึกษาระดับบัณฑิตศึกษา", x: 60, y: (y -= space) },
		{ text: "เรียน    อธิการบดีมหาวิทยาลัยราชภัฏกำแพงเพชร", x: 60, y: (y -= space) },
		{ text: "ข้าพเจ้า………………………………………………………………………………………………………………………………………………………", x: 100, y: (y -= space) },
		{ text: data?.student_name, x: 170, y: y + 2 },
		{ text: "ระดับปริญญาโท  สาขา………………………………………………………………รหัสประจำตัว………………………………………………….", x: 80, y: (y -= space), show: data?.education_level === "ปริญญาโท" },
		{ text: "ระดับปริญญาเอก  สาขา………………………………………………………………รหัสประจำตัว………………………………………………….", x: 80, y: y, show: data?.education_level === "ปริญญาเอก" },
		{ text: data?.major_name, x: 180, y: y + 2 },
		{ text: data?.student_id, x: 390, y: y + 2 },
		{ text: "วุฒิเดิมในระดับปริญญาตรี  สาขา………………………………………….มหาวิทยาลัย…………………………………………………..", x: 100, y: (y -= space) },
		{ text: data?.bachelor_major, x: 230, y: y + 2 },
		{ text: data?.bachelor_university, x: 390, y: y + 2 },
		{ text: "วุฒิเดิมในระดับปริญญาโท  สาขา………………………………………….มหาวิทยาลัย……………………………………………………", x: 100, y: (y -= space), show: data?.education_level === "ปริญญาเอก" },
		{ text: data?.master_major, x: 230, y: y + 2 },
		{ text: data?.master_university, x: 390, y: y + 2 },
		{ text: "เกิดวันที่………………เดือน………………………………พ.ศ………………", x: 100, y: data?.education_level === "ปริญญาโท" ? (y -= space * 1) : (y -= space) },
		{ text: BDATE_day, x: 140, y: y + 2 },
		{ text: BDATE_month, x: 210, y: y + 2 },
		{ text: BDATE_year, x: 290, y: y + 2 },
		{ text: "ที่อยู่สามารถติดต่อได้  บ้านเลขที่…………………..หมู่ที่……..…………ถนน………………….ตำบล……………..…….………..", x: 60, y: (y -= space) },
		{ text: data?.contact_house_no, x: 190, y: y + 2 },
		{ text: data?.contact_moo, x: 260, y: y + 2 },
		{ text: data?.contact_road, x: 320, y: y + 2 },
		{ text: data?.contact_subdistrict, x: 390, y: y + 2 },
		{ text: "อำเภอ……………………………..จังหวัด……………………รหัสไปรษณีย์………………….โทรศัพท์………………….……………..", x: 60, y: (y -= space) },
		{ text: data?.contact_district, x: 90, y: y + 2 },
		{ text: data?.contact_province, x: 190, y: y + 2 },
		{ text: data?.contact_zipcode, x: 300, y: y + 2 },
		{ text: data?.contact_phone, x: 380, y: y + 2 },
		{ text: "สถานที่ทำงานปัจจุบัน…………………..…………หมู่ที่………………..ถนน…………………..ตำบล…………………………………", x: 60, y: (y -= space) },
		{ text: data?.work_name, x: 150, y: y + 2 },
		{ text: data?.work_moo, x: 240, y: y + 2 },
		{ text: data?.work_road, x: 305, y: y + 2 },
		{ text: data?.work_subdistrict, x: 380, y: y + 2 },
		{ text: "อำเภอ……………………………..จังหวัด……………………รหัสไปรษณีย์………………….โทรศัพท์………………….……………..", x: 60, y: (y -= space) },
		{ text: data?.work_district, x: 90, y: y + 2 },
		{ text: data?.work_province, x: 190, y: y + 2 },
		{ text: data?.work_zipcode, x: 300, y: y + 2 },
		{ text: data?.work_phone, x: 380, y: y + 2 },
		{ text: "สังกัดหน่วยงาน………………………………..……........................... ได้ศึกษาจนครบหลักสูตรจึงขอสำเร็จการศึกษาในภาคเรียนนี้", x: 60, y: (y -= space) },
		{ text: data?.work_department, x: 130, y: y + 2 },
		{ text: "จึงเรียนมาเพื่อโปรดพิจารณา", x: 100, y: (y -= space) },
		{ text: "ลงชื่อ.........................................................( นักศึกษา )", x: 240, y: (y -= space) },
		{ text: data?.student_name, x: 280, y: y + 2 },
		{ text: "(.........................................................)", x: 260, y: (y -= space) },
		{ text: data?.student_name, x: 280, y: y + 2 },
		{ text: "ความเห็นของอาจารย์ที่ปรึกษา", x: 60, y: (y -= space) },
		{ text: "ศึกษารายวิชาและจำนวนหน่วยกิตครบตามหลักสูตรเรียบร้อยแล้ว ", x: 100, y: (y -= space) },
		{ text: `${data?.education_level === "ปริญญาโท" ? "สอบประมวลความรู้" : "สอบวัดคุณสมบัติ"} ผ่านเรียบร้อย`, x: 100, y: (y -= space) },
		{ text: "กำลังดำเนินการทำวิทยานิพนธ์  ในขั้น…………………………………….", x: 100, y: (y -= space) },
		{ text: "100%", x: 250, y: y + 2, show: data.advisor_approvals_id != null },
		{ text: "ลงชื่อ.........................................................อาจารย์ที่ปรึกษา         ลงชื่อ.........................................................ประธานคณะกรรมการ ", x: 60, y: (y -= space * 2) },
		{ text: data?.advisor_approvals_id, x: 100, y: y + 2 },
		{ text: data?.chairpersons_approvals_id, x: 340, y: y + 2 },
		{ text: "(........................................................)                                   (........................................................) บัณฑิตศึกษาประจำสาขาวิชา", x: 80, y: (y -= space) },
		{ text: data?.advisor_approvals_id, x: 100, y: y + 2 },
		{ text: data?.chairpersons_approvals_id, x: 340, y: y + 2 },
		{ text: "ชำระเงิน", x: 60, y: (y -= space) },
		{ text: "ทางฝ่ายการเงินได้รับเงินค่าลงทะเบียนบัณฑิต  จำนวน  1,000  บาท  ในใบเสร็จรับเงิน……………./…………....", x: 100, y: (y -= space) },
		{ text: "ลงชื่อ........................................................ผู้รับเงิน", x: 240, y: (y -= space) },
		{ text: "นายณัฐวุฒิ มาตกาง", x: 280, y: y + 2, show: data?.receipt_vol != null },
		{ text: "(........................................................)", x: 260, y: (y -= space) },
		{ text: "นายณัฐวุฒิ มาตกาง", x: 280, y: y + 2, show: data?.receipt_vol != null },
		{ text: "------------------------------------------------------------------------------------------------------------------------------------------------------------------ ", x: 60, y: (y -= space) },
		{ text: "กรุณานำส่ง", x: 240, y: (y -= space * 2), font: THSarabunNewBold },
		{ text: "สถานที่ติดต่อเพื่อแจ้งรายละเอียด", x: 60, y: (y -= space) },
		{ text: "คุณ………………………………………………………………………….", x: 270, y: y },
		{ text: data?.student_name, x: 300, y: y + 2 },
		{ text: "เกี่ยวกับพิธีพระราชทานปริญญาบัตร", x: 60, y: (y -= space) },
		{ text: "เลขที่………………………ถนน………………………………………..", x: 270, y: y },
		{ text: data?.contact_house_no, x: 300, y: y + 2 },
		{ text: data?.contact_moo, x: 390, y: y + 2 },
		{ text: "ตำบล……………………………อำเภอ……………………………….", x: 270, y: (y -= space) },
		{ text: data?.contact_subdistrict, x: 310, y: y + 2 },
		{ text: data?.contact_district, x: 410, y: y + 2 },
		{ text: "จังหวัด……………………………รหัสไปรษณีย์……………………", x: 270, y: (y -= space) },
		{ text: data?.work_province, x: 310, y: y + 2 },
		{ text: data?.work_zipcode, x: 430, y: y + 2 },
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
