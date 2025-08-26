//เจ้าหน้าที่งานทะเบียน
import { IconClipboardText, IconCertificate, IconCalendar, IconUserCheck } from "@tabler/icons-react";
import UserLayout from "../../layout/userLayout.jsx";

const menu = [
	{ label: "คำร้องขอสอบประมวลความรู้", icon: IconClipboardText, links: "/registrar-officer/RequestExam/ขอสอบประมวลความรู้" },
	{ label: "คำร้องขอสอบวัดคุณสมบัติ", icon: IconClipboardText, links: "/registrar-officer/RequestExam/ขอสอบวัดคุณสมบัติ" },
	{ label: "พิมพ์ผลการสอบประมวลความรู้/สอบวัดคุณสมบัต", icon: IconCertificate, links: "/registrar-officer/exam-results-print" },
	{ label: "กำหนดวันสอบประมวลความรู้/สอบวัดคุณสมบัต", icon: IconCalendar, links: "/registrar-officer/ExamScheduleSetupPage" },
	{ label: "คำร้องขอทดสอบความรู้ทางภาษาอังกฤษ", icon: IconCertificate, links: "/registrar-officer/RequestEngTest" },
	{ label: "กรอกข้อมูลเจ้าหน้าที่ประจำสาขาวิชา", icon: IconUserCheck, links: "/registrar-officer/assign-major-officer" },
];

const RegistrarOfficer = () => {
	return (
		<>
			<UserLayout item={menu} />
		</>
	);
};

export default RegistrarOfficer;
