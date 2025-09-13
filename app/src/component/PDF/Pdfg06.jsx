import fontkit from "@pdf-lib/fontkit";
import { PDFDocument } from "pdf-lib";
import { Button, Loader } from "@mantine/core";
import { setDefaultFont, drawGrid, draw, drawRect, drawCenterXText, formatThaiDate, formatThaiDateShort } from "./PdfUtils.js";
import { useMemo, useState } from "react";

let THSarabunNewBoldBytesPromise = fetch("/fonts/THSarabunNew Bold.ttf").then((res) => res.arrayBuffer());

async function fillPdf(data) {
	const pdfDoc = await PDFDocument.create();
	pdfDoc.registerFontkit(fontkit);
	const page = pdfDoc.addPage([595, 842]);

	await setDefaultFont(pdfDoc);

	const THSarabunNewBoldBytes = await THSarabunNewBoldBytesPromise;
	const THSarabunNewBold = await pdfDoc.embedFont(THSarabunNewBoldBytes);

	let y = 760;
	let space = 20;
	const lavel = "ปริญญาเอก";
	const type = ""; /* โครงร่าง */
	drawCenterXText(page, "แบบฟอร์มรายงานผลการตรวจสอบการคัดลอกผลงานทางวิชาการ", y + 40, THSarabunNewBold, 20);
	drawCenterXText(page, "นักศึกษาระดับบัณฑิตศึกษา มหาวิทยาลัยราชภัฏกำแพงเพชร", y + 20, THSarabunNewBold, 20);

	const drawItems = [
		{ text: "ข้าพเจ้า ................................................................................................. รหัสประจำตัว .....................................................", x: 100, y: (y -= space) },
		{ text: data?.student_name, x: 180, y: y + 2 },
		{ text: data?.student_id, x: 460, y: y + 2 },
		{ text: `นักศึกษาระดับ ${lavel} สาขาวิชา .................................................................หลักสูตร ${data?.request_type}`, x: 60, y: (y -= space) },
		{ text: data?.major_name, x: 440, y: y + 2 },
		{ text: `ขอส่งรายงานผลการตรวจสอบความคล้ายคลึงของผลงาน${data?.request_type} (Plagiarism Checking)`, x: 100, y: (y -= space * 2) },
		{ text: "ด้วยโปรแกรมอักขราวิสุทธิ์ เพื่อการพิจารณาอนุมัติ", x: 60, y: (y -= space) },

		{ text: `${data?.request_type}`, x: 140, y: (y -= space), show: type === "โครงร่าง" },
		{ text: `บทที่ 1 มีความคล้ายคลึง กับผลงานผู้อื่น ร้อยละ .............................`, x: 150, y: (y -= space)},
		{ text: data?.chapter_1, x: 440, y: y + 2 },
		{ text: `บทที่ 2 มีความคล้ายคลึง กับผลงานผู้อื่น ร้อยละ .............................`, x: 150, y: (y -= space)},
		{ text: data?.chapter_2, x: 440, y: y + 2 },
		{ text: `บทที่ 3 มีความคล้ายคลึง กับผลงานผู้อื่น ร้อยละ .............................`, x: 150, y: (y -= space)},
		{ text: data?.chapter_3, x: 440, y: y + 2 },
		{ text: `บทที่ 4 มีความคล้ายคลึง กับผลงานผู้อื่น ร้อยละ .............................`, x: 150, y: (y -= space), show: type === "" },
		{ text: data?.chapter_4, x: 440, y: y + 2 },
		{ text: `บทที่ 5 มีความคล้ายคลึง กับผลงานผู้อื่น ร้อยละ .............................`, x: 150, y: (y -= space), show: type === "" },
		{ text: data?.chapter_5, x: 440, y: y + 2 },
		{ text: `รวมความคล้ายคลึงกับผลงานผู้อื่น ร้อยละ ..........................`, x: 180, y: (y -= space), show: type === "" },
		{ text: `ตรวจสอบเมื่อวันที่ ............... เดือน ......................... พ.ศ. ................`, x: 150, y: (y -= space), show: type === "" },

		{ text: "ข้าพเจ้าขอรับรองว่า ผลงานเรื่องที่เสนอข้างต้น มิได้คัดลอกข้อความของผู้อื่น หากมิเป็นความจริง ข้าพเจ้ายินดีให้", x: 100, y: type === "โครงร่าง" ? (y += space) : (y -= space) },
		{ text: "มหาวิทยาลัยราชภัฏกำแพงเพชรลงโทษตามระเบียบข้อบังคับของมหาวิทยาลัยโดยไม่มีเงื่อนไข", x: 60, y: (y -= space) },

		{ text: `ลงชื่อ...........................................................................`, x: 310, y: (y -= space) },
		{ text: `(.........................................................................)`, x: 330, y: (y -= space) },
		{ text: `นักศึกษา`, x: 400, y: (y -= space) },
		{ text: `วันที่................/........................../......................`, x: 330, y: (y -= space) },
		{ text: `ผลการพิจารณาของประธานที่ปรึกษา${lavel === "ปริญญาโท" ? "วิทยานิพนธ์" : "การค้นคว้าอิสระ"}`, x: 60, y: (y -= space) },
		{ text: "...............................................................................................................................................................................................................", x: 60, y: (y -= space) },
		{ text: `ลงชื่อ...........................................................................`, x: 310, y: (y -= space) },
		{ text: `(.........................................................................)`, x: 330, y: (y -= space) },
		{ text: `อาจารย์ที่ปรึกษา`, x: 385, y: (y -= space) },
		{ text: `วันที่................/........................../......................`, x: 330, y: (y -= space) },
		{ text: `ผลการพิจารณาตรวจสอบของประธานคณะกรรมการบัณฑิตศึกษาประจำสาขา`, x: 60, y: (y -= space) },
		{ text: "...............................................................................................................................................................................................................", x: 60, y: (y -= space) },
		{ text: `ลงชื่อ...........................................................................`, x: 310, y: (y -= space) },
		{ text: `(.........................................................................)`, x: 330, y: (y -= space) },
		{ text: `ประธานกรรมการบัณฑิตศึกษาประจำสาขาวิชา`, x: 330, y: (y -= space) },
		{ text: `ประจำสาขาวิชา.......................................`, x: 330, y: (y -= space) },
		{ text: `วันที่................/........................../......................`, x: 330, y: (y -= space) },
		{ text: `* หมายเหตุ`, x: 60, y: 60, font: THSarabunNewBold },
		{ text: `1. ให้นักศึกษาแนบผลการตรวจสอบการคัดลอกผลงานทางวิชาการด้วยโปรแกรมอักขราวิสุทธิ์ (Plagiarism Checking Report)`, x: 60, y: 40 },
		{ text: `2. แนบแผ่นไฟล์โครงร่างวิทยานิพนธ์/การค้นคว้าอิสระ หรือวิทยานิพนธ์/การค้นคว้าอิสระ ฉบับสมบูรณ์มาด้วย`, x: 60, y: 20 },
	];
	drawItems.filter((item) => item.show !== false).forEach((item) => draw(page, item.text, item.x, item.y, item.font, item.size));

	const pdfBytes = await pdfDoc.save();
	return new Blob([pdfBytes], { type: "application/pdf" });
}

const API_BASE = "http://localhost:8080/api";

async function fetchPdfBlob(url, token) {
	const res = await fetch(url, {
		headers: token ? { Authorization: `Bearer ${token}` } : undefined,
	});
	if (!res.ok) throw new Error(`โหลดไฟล์ไม่สำเร็จ: ${await res.text()}`);
	return await res.blob();
}

async function mergePdfFiles(files) {
	const mergedPdf = await PDFDocument.create();
	const pdfs = await Promise.all(files.map((f) => f.arrayBuffer().then((bytes) => PDFDocument.load(bytes))));
	for (const pdf of pdfs) {
		const pages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
		pages.forEach((p) => mergedPdf.addPage(p));
	}
	const mergedBytes = await mergedPdf.save();
	return new Blob([mergedBytes], { type: "application/pdf" });
}
async function generateMergedPdf(data) {
	const token = localStorage.getItem("token");
	const reportId = data?.plagiarism_report_id;
	const cover = await fillPdf(data);
	const blobs = [cover];
	if (reportId) {
		const [plagiarismRes, fullReportRes] = await Promise.allSettled([fetchPdfBlob(`${API_BASE}/plagiarism-report/${reportId}/plagiarism-file`, token), fetchPdfBlob(`${API_BASE}/plagiarism-report/${reportId}/full-report-file`, token)]);
		if (plagiarismRes.status === "fulfilled") blobs.push(plagiarismRes.value);
		if (fullReportRes.status === "fulfilled") blobs.push(fullReportRes.value);
	}
	if (blobs.length === 1) return cover;
	return await mergePdfFiles(blobs);
}

export default function Pdfg06({ data, showType }) {
	const reportId = data?.plagiarism_report_id;
	const hasReportId = useMemo(() => !!reportId, [reportId]);
	const [loading, setLoading] = useState(false);
	const handleOpen = async () => {
		setLoading(true);
		try {
			const blob = await generateMergedPdf(data);
			const url = URL.createObjectURL(blob);
			window.open(url, "_blank");
		} catch (err) {
			console.error("handleOpen error:", err);
			alert(err?.message || "ไม่สามารถเปิดไฟล์ได้");
		} finally {
			setTimeout(() => setLoading(false), 800);
		}
	};
	const handlePrint = async () => {
		setLoading(true);
		try {
			const blob = await generateMergedPdf(data);
			const url = URL.createObjectURL(blob);
			const iframe = document.createElement("iframe");
			iframe.style.display = "none";
			iframe.src = url;
			document.body.appendChild(iframe);
			iframe.onload = () => iframe.contentWindow?.print();
		} catch (err) {
			console.error("handlePrint error:", err);
			alert(err?.message || "ไม่สามารถพิมพ์ไฟล์ได้");
		} finally {
			setTimeout(() => setLoading(false), 2000);
		}
	};
	return (
		<>
			{showType === "view" ? (
				<Button size="xs" color="gray" onClick={handleOpen} disabled={!hasReportId}>
					ข้อมูล
				</Button>
			) : (
				<Button size="xs" color="blue" onClick={handlePrint} disabled={!hasReportId}>
					พิมพ์
				</Button>
			)}
			{loading && (
				<div
					style={{
						position: "fixed",
						top: 0,
						left: 0,
						width: "100vw",
						height: "100vh",
						backgroundColor: "rgba(255,255,255,0.8)",
						display: "flex",
						justifyContent: "center",
						alignItems: "center",
						zIndex: 9999,
					}}
				>
					<Loader size="xl" variant="dots" />
				</div>
			)}
		</>
	);
}
