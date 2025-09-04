//เจ้าหน้าที่งานทะเบียน
import { IconClipboardText, IconCertificate, IconCalendar, IconUserCheck, IconReport } from "@tabler/icons-react";
import UserLayout from "../../layout/userLayout.jsx";

const menu = [
	{ label: "คำร้องขอสอบประมวลความรู้", icon: IconClipboardText, links: "/registrar-officer/RequestExam/ขอสอบประมวลความรู้" },
	{ label: "คำร้องขอสอบวัดคุณสมบัติ", icon: IconClipboardText, links: "/registrar-officer/RequestExam/ขอสอบวัดคุณสมบัติ" },
	{ label: "คำร้องขอทดสอบความรู้ทางภาษาอังกฤษ", icon: IconCertificate, links: "/registrar-officer/RequestEngTest" },
	{ label: "คำร้องขอลงทะเบียนสอบโครงร่างวิทยานิพนธ์", icon: IconReport, links: "/registrar-officer/RequestThesisProposal/วิทยานิพนธ์" },
	{ label: "คำร้องขอลงทะเบียนสอบโครงร่างการค้นคว้าอิสระ", icon: IconReport, links: "/registrar-officer/RequestThesisProposal/การค้นคว้าอิสระ" },
	{ label: "คำร้องขอลงทะเบียนสอบวิทยานิพนธ์", icon: IconReport, links: "/registrar-officer/RequestThesisDefense/วิทยานิพนธ์" },
	{ label: "คำร้องขอลงทะเบียนสอบการค้นคว้าอิสระ", icon: IconReport, links: "/registrar-officer/RequestThesisDefense/การค้นคว้าอิสระ" },
	{ label: "พิมพ์ผลการสอบประมวลความรู้/สอบวัดคุณสมบัต", icon: IconCertificate, links: "/registrar-officer/exam-results-print" },
	{ label: "กำหนดวันสอบประมวลความรู้/สอบวัดคุณสมบัต", icon: IconCalendar, links: "/registrar-officer/ExamScheduleSetupPage" },
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
