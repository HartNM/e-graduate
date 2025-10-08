//เจ้าหน้าที่งานทะเบียน
import { IconClipboardText, IconCertificate, IconCalendar, IconUserCheck, IconReport } from "@tabler/icons-react";
import UserLayout from "../../layout/userLayout.jsx";

const menu = [
	{ label: "คำร้องขอสอบประมวลความรู้", icon: IconClipboardText, links: "/registrar-officer/RequestExam/ขอสอบประมวลความรู้" },
	{ label: "คำร้องขอสอบวัดคุณสมบัติ", icon: IconClipboardText, links: "/registrar-officer/RequestExam/ขอสอบวัดคุณสมบัติ" },
	{ label: "คำร้องขอทดสอบความรู้ทางภาษาอังกฤษ", icon: IconCertificate, links: "/registrar-officer/RequestEngTest" },
	{ label: "คำร้องขอสอบโครงร่างวิทยานิพนธ์/การค้นคว้าอิสระ", icon: IconReport, links: "/registrar-officer/RequestThesisProposal" },
	{ label: "คำร้องขอสอบวิทยานิพนธ์/การค้นคว้าอิสระ", icon: IconReport, links: "/registrar-officer/RequestThesisDefense" },
	{ label: "พิมพ์ผลการสอบประมวลความรู้/สอบวัดคุณสมบัติ", icon: IconCertificate, links: "/registrar-officer/ExamResultsPrint" },
	{ label: "พิมพ์ผลการสอบโครงร่างวิทยานิพนธ์/การค้นคว้าอิสระ", icon: IconCertificate, links: "/registrar-officer/ExamProposalResultsPrint" },
	{ label: "พิมพ์ผลการสอบวิทยานิพนธ์/การค้นคว้าอิสระ", icon: IconCertificate, links: "/registrar-officer/ExamDefenseResultsPrint" },
	{ label: "กรอกข้อมูลภาคเรียน", icon: IconCalendar, links: "/registrar-officer/ExamScheduleSetupPage" },
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