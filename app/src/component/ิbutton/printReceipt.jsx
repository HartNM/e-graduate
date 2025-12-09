import { Button } from "@mantine/core";
import { PDFDocument } from "pdf-lib";

const PrintReceipt = ({ item }) => {
	if (!item.student_id || !item.receipt_vol || !item.receipt_No) return null;
	const Url = `https://e-finance.kpru.ac.th/receipt_research?customer_id=${item.student_id}&receipt_book=${item.receipt_vol}&receipt_no=${item.receipt_No}&type=u`;

	const downloadIcon = (
		<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
			<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
			<polyline points="7 10 12 15 17 10"></polyline>
			<line x1="12" y1="15" x2="12" y2="3"></line>
		</svg>
	);

	return (
		<Button
			component="a"
			href={Url}
			target="_blank"
			rel="noopener noreferrer"
			variant="filled"
			color="green"
			size="xs"
			/* leftSection={downloadIcon} */
		>
			ดาวน์โหลดใบเสร็จ
		</Button>
	);
};

export default PrintReceipt;

/* const printReceipt = async (item) => {
	try {
		const myProxyUrl = `https://e-finance.kpru.ac.th/receipt_research?customer_id=${item.student_id}&receipt_book=${item.receipt_vol}&receipt_no=${item.receipt_No}&type=u`;
		// 1. กำหนด URL ของไฟล์ทั้งสอง
		const receiptUrl = `/pdf/1764651312.pdf`;
		let announceUrl;
		if (item.education_level === "ปริญญาโท") {
			announceUrl = `/pdf/ระเบียบ-การรับจ่ายเงิน ป.โท_61.pdf`;
		} else {
			announceUrl = `/pdf/ประกาศการเก็บเงินป.เอก_2557.pdf`;
		}

		// 2. โหลดไฟล์ PDF ทั้งสองเข้ามาเป็น ArrayBuffer (โหลดข้อมูลไฟล์)
		const receiptBytes = await fetch(receiptUrl).then((res) => res.arrayBuffer());
		const announceBytes = await fetch(announceUrl).then((res) => res.arrayBuffer());

		// 3. สร้าง PDF เอกสารใหม่ที่ว่างเปล่า
		const mergedPdf = await PDFDocument.create();

		// 4. โหลด PDF ต้นฉบับเพื่อเตรียมคัดลอก
		const pdfA = await PDFDocument.load(receiptBytes);
		const pdfB = await PDFDocument.load(announceBytes);

		// 5. คัดลอกหน้าจากไฟล์แรก (Receipt) ไปใส่ไฟล์ใหม่
		const copiedPagesA = await mergedPdf.copyPages(pdfA, pdfA.getPageIndices());
		copiedPagesA.forEach((page) => mergedPdf.addPage(page));

		// 6. คัดลอกหน้าจากไฟล์ที่สอง (Announce) ไปต่อท้าย
		const copiedPagesB = await mergedPdf.copyPages(pdfB, pdfB.getPageIndices());
		copiedPagesB.forEach((page) => mergedPdf.addPage(page));

		// 7. เซฟไฟล์ใหม่เป็น Blob และสร้าง URL
		const pdfBytes = await mergedPdf.save();
		const blob = new Blob([pdfBytes], { type: "application/pdf" });
		const mergedUrl = URL.createObjectURL(blob);

		// 8. เปิดไฟล์ที่รวมเสร็จแล้วใน Tab ใหม่
		window.open(mergedUrl, "_blank");
	} catch (error) {
		console.error("Error merging PDFs:", error);
		alert("ไม่สามารถรวมไฟล์ PDF ได้");
	}
}; */
/* <Button
			size="xs"
			color="green"
			onClick={() => {
				printReceipt(item.item);
			}}
		>
			พิมพ์ใบเสร็จ
		</Button> */
