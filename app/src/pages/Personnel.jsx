import { useEffect, useState } from "react";
import { IconClipboardText, IconCertificate, IconFileText, IconEdit, IconUserCheck, IconCalendar, IconClipboardX, IconBooks } from "@tabler/icons-react";
import UserLayout from "../layout/userLayout.jsx";
import { jwtDecode } from "jwt-decode";

const Personnel = () => {
	const [menu, setMenu] = useState([]);
	const token = localStorage.getItem("token");

	useEffect(() => {
		if (!token) return;

		try {
			const decoded = jwtDecode(token);
			const roles = decoded.roles || [];

			const menuItems = [];

			if (roles.includes("officer_registrar")) {
				menuItems.push(
					{ label: "คำร้องขอสอบประมวลความรู้", icon: IconClipboardText, links: "/personnel/RequestExam/ขอสอบประมวลความรู้" },
					{ label: "คำร้องขอสอบวัดคุณสมบัติ", icon: IconClipboardText, links: "/personnel/RequestExam/ขอสอบวัดคุณสมบัติ" },
					{ label: "พิมพ์ผลการสอบประมวลความรู้/สอบวัดคุณสมบัต", icon: IconCertificate, links: "/personnel/exam-results-print" },
					{ label: "กำหนดวันสอบประมวลความรู้/สอบวัดคุณสมบัติ", icon: IconCalendar, links: "/personnel/ExamScheduleSetupPage" },
					{ label: "คำร้องขอทดสอบความรู้ทางภาษาอังกฤษ", icon: IconCertificate, links: "/personnel/RequestEngTest" },
					{ label: "กรอกข้อมูลเจ้าหน้าที่ประจำสาขาวิชา", icon: IconUserCheck, links: "/personnel/assign-major-officer" }
				);
			}

			if (roles.includes("officer_major")) {
				menuItems.push(
					{ label: "พิมพ์ใบรายชื่อผู้มีสิทธิสอบ", icon: IconFileText, links: "/personnel/ExamEligibleListPrint" },
					{ label: "กรอกผลการสอบ", icon: IconEdit, links: "/personnel/examResults" },
					{ label: "กรอกวิชาที่ต้องลงทะเบียนเรียน", icon: IconBooks, links: "/personnel/CourseRegistration" },
					{ label: "กรอกข้อมูลประธานกรรมการบัณฑิตศึกษาประจำสาขาวิชา", icon: IconUserCheck, links: "/personnel/AssignChairpersons" }
				);
			}

			if (roles.includes("dean")) {
				menuItems.push({ label: "คำร้องขอยกเลิกสอบประมวลความรู้/สอบวัดคุณสมบัติ", icon: IconClipboardX, links: "/personnel/RequestExam" });
			}

			if (roles.includes("chairpersons") || roles.includes("advisor")) {
				menuItems.push({ label: "คำร้องขอสอบประมวลความรู้/สอบวัดคุณสมบัติ", icon: IconClipboardText, links: "/personnel/RequestExam" }, { label: "คำร้องขอทดสอบความรู้ทางภาษาอังกฤษ", icon: IconCertificate, links: "/personnel/RequestEngTest" });
			}

			const uniqueMenu = Array.from(new Map(menuItems.map((item) => [item.label, item])).values());

			setMenu(uniqueMenu);
		} catch (err) {
			console.error("Invalid token:", err);
		}
	}, [token]);

	return <UserLayout item={menu} />;
};

export default Personnel;
