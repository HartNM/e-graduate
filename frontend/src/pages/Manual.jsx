import React, { useMemo } from "react";
import { Box, Text } from "@mantine/core";
import { jwtDecode } from "jwt-decode";

const Manual = () => {
	const token = localStorage.getItem("token");

	const { role } = useMemo(() => {
		if (!token) return { role: "" };
		try {
			return jwtDecode(token);
		} catch (error) {
			console.error("Invalid token:", error);
			return { role: "" };
		}
	}, [token]);

	const pdfMapping = {
		student: "/manuals/คู่มือการใช้งานระบบสารสนเทศบัณฑิตศึกษา นศ.pdf",
		advisor: "/manuals/คู่มือการใช้งานระบบสารสนเทศบัณฑิตศึกษา อาจารย์.pdf",
		research_advisor: "/manuals/คู่มือเข้าใช้ระบบสารสนเทศบัณฑิตศึกษา อาจารย์ที่ปรึกษาวิทยานิพนธ์.pdf",
		chairpersons: "/manuals/คู่มือเข้าใช้ระบบสารสนเทศบัณฑิตศึกษา ประธาน.pdf",
		officer_registrar: "/manuals/คู่มือการใช้งานระบบสารสนเทศบัณฑิตศึกษา. เจ้าหน้าที่ทะเบียน docx.pdf",
		officer_major: "/manuals/คู่มือการใช้งานระบบสารสนเทศบัณฑิตศึกษา สาขา.pdf",
		dean: "/manuals/คู่มือเข้าใช้ระบบสารสนเทศบัณฑิตศึกษา คณบดี.pdf",
	};

	const selectedPdf = role ? pdfMapping[role.toLowerCase()] : null;

	return (
		<Box w="100%" h="82vh" p="md">
			{/* <Text fw={700} mb="sm">
				คู่มือการใช้งานสำหรับ: {role}
			</Text> */}

			<iframe src={`${selectedPdf}#toolbar=0&navpanes=0&scrollbar=0`} title="User Manual" width="100%" height="100%" style={{ border: "1px solid #ddd", borderRadius: "8px" }} />
		</Box>
	);
};

export default Manual;
