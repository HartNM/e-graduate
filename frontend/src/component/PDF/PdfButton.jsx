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
			iframe.style.display = "none";
			iframe.src = url;
			document.body.appendChild(iframe);

			iframe.onload = () => {
				iframe.contentWindow.print();
			};
		} catch (error) {
			console.error("Error printing PDF:", error);
			alert("เกิดข้อผิดพลาดในการพิมพ์");
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
