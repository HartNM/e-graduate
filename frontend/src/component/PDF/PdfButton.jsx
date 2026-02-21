import { useState } from "react";
import { Button } from "@mantine/core";
import axios from "axios";

// ดึง URL จาก Environment Variable
const BASE_URL = import.meta.env.VITE_API_URL;

export default function PdfButton({ data, showType }) {
	const [loading, setLoading] = useState(false);

	// ฟังก์ชันตรวจสอบและเลือก Endpoint ตามข้อมูลที่มี
	const getApiConfig = () => {
		let endpoint = "";
		let body = { ...data }; // ส่งข้อมูลทั้งหมดไปด้วย (เผื่อใช้ชื่อ/คณะ)

		if (data?.request_cancel_exam_id) {
			// กรณี G07: ขอยกเลิกการสอบ
			endpoint = "/api/Pdfg07"; // อ้างอิงจาก route ใน backend
			body = { request_cancel_exam_id: data.request_cancel_exam_id, term: data.term };
		} else if (data?.request_exam_id) {
			// กรณี G01: คำร้องทั่วไป/สอบประมวล
			endpoint = "/api/Pdfg01";
			body = { request_exam_id: data.request_exam_id, term: data.term };
		} else if (data?.request_eng_test_id) {
			// กรณี G02: ทดสอบภาษาอังกฤษ
			endpoint = "/api/Pdfg02";
			body = { request_eng_test_id: data.request_eng_test_id, term: data.term };
		} else if (data?.request_thesis_proposal_id) {
			// กรณี G03: สอบโครงร่าง
			endpoint = "/api/Pdfg03-04"; // อ้างอิงจาก route ใน backend
			body = { request_thesis_proposal_id: data.request_thesis_proposal_id, ...data };
		} else if (data?.request_thesis_defense_id) {
			// กรณี G04: สอบป้องกัน/จบ
			endpoint = "/api/Pdfg03-04"; // ใช้ route เดียวกับ G03
			body = { request_thesis_defense_id: data.request_thesis_defense_id, ...data };
		}

		return { endpoint, body };
	};

	// ฟังก์ชันสำหรับเรียก API เพื่อขอไฟล์ PDF จาก Backend
	const fetchPdfFromBackend = async () => {
		const token = localStorage.getItem("token");
		const { endpoint, body } = getApiConfig();

		if (!endpoint) {
			throw new Error("ไม่พบข้อมูล ID สำหรับสร้าง PDF");
		}

		// ยิง POST ไปที่ Route ที่คำนวณได้
		const response = await axios.post(`${BASE_URL}${endpoint}`, body, {
			headers: { Authorization: `Bearer ${token}` },
			responseType: "blob", // ⚠️ สำคัญมาก: รับข้อมูลเป็นไฟล์
		});
		return response.data;
	};

	const handleOpen = async () => {
		setLoading(true);
		try {
			const blob = await fetchPdfFromBackend();
			const url = URL.createObjectURL(blob);
			window.open(url, "_blank");

			// คืน memory (optional)
			setTimeout(() => URL.revokeObjectURL(url), 1000);
		} catch (error) {
			console.error("Error generating PDF:", error);
			alert("ไม่สามารถสร้าง PDF ได้ หรือข้อมูลไม่ถูกต้อง");
		} finally {
			setLoading(false);
		}
	};

	const handlePrint = async () => {
		setLoading(true);
		try {
			const blob = await fetchPdfFromBackend();
			const url = URL.createObjectURL(blob);

			const iframe = document.createElement("iframe");
			/* iframe.style.display = "none"; */
			iframe.style.position = "fixed";
			iframe.style.right = "0";
			iframe.style.bottom = "0";
			iframe.style.width = "0";
			iframe.style.height = "0";
			iframe.style.border = "0";

			iframe.src = url;
			document.body.appendChild(iframe);

			iframe.onload = () => {
				/* iframe.contentWindow.print(); */
				setTimeout(() => {
					try {
						iframe.contentWindow.focus(); // focus ก่อนสั่ง print เพื่อความชัวร์ในบาง browser
						iframe.contentWindow.print();
					} catch (e) {
						console.error("Print error inside iframe:", e);
					} /* finally {
						// ลบ iframe และ url ออกหลังจากพิมพ์เสร็จ (หรือ user กด cancel)
						// หมายเหตุ: การ remove iframe ทันทีอาจทำให้ print dialog หายในบาง browser
						// อาจจะต้องรอ user action หรือปล่อยทิ้งไว้สักพัก

						// ในทางปฏิบัติ เรามักจะปล่อย iframe ทิ้งไว้หรือลบออกหลังจากผ่านไปสักพักใหญ่ๆ
						setTimeout(() => {
							document.body.removeChild(iframe);
							URL.revokeObjectURL(url);
						}, 60000); // รอ 1 นาทีค่อยลบ
					} */
				}, 500); // รอ 0.5 วินาที
			};
		} catch (error) {
			console.error("Error printing PDF:", error);
			alert("เกิดข้อผิดพลาดในการพิมพ์");
			if (url) URL.revokeObjectURL(url); // Clean up ถ้า error
		} finally {
			setLoading(false);
		}
	};

	return (
		<>
			{showType === "view" ? (
				<Button size="xs" color="gray" onClick={handleOpen} loading={loading}>
					ข้อมูล
				</Button>
			) : (
				<Button size="xs" color="blue" onClick={handlePrint} loading={loading}>
					พิมพ์
				</Button>
			)}
		</>
	);
}
