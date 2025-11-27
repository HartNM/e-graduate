import { Button } from "@mantine/core";
import { PDFDocument } from "pdf-lib";

const printReceipt = (item) => {
	const printReceipt = async (item) => {
		try {
			// 1. กำหนด URL ของไฟล์ทั้งสอง
			const receiptUrl = `/pdf/g01.pdf`;
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
	};
	return (
		<Button
			size="xs"
			color="green"
			onClick={() => {
				printReceipt(item.item);
			}}
		>
			พิมพ์ใบเสร็จ
		</Button>
	);
};

export default printReceipt;
