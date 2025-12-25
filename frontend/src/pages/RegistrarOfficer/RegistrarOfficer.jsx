//เจ้าหน้าที่งานทะเบียน
import { IconClipboardText, IconCertificate, IconCalendar, IconUserCheck, IconReport, IconBooks } from "@tabler/icons-react";
import UserLayout from "../../layout/userLayout.jsx";

const menu = [
	{
		label: "คำร้องขอสอบ",
		icon: IconClipboardText,
		links: [
			{ label: "ประมวลความรู้", link: "/registrar-officer/RequestExam/ขอสอบประมวลความรู้" },
			{ label: "วัดคุณสมบัติ", link: "/registrar-officer/RequestExam/ขอสอบวัดคุณสมบัติ" },
			{ label: "ความรู้ทางภาษาอังกฤษ", link: "/registrar-officer/RequestEngTest" },
			{ label: "โครงร่างวิทยานิพนธ์/การค้นคว้าอิสระ", link: "/registrar-officer/RequestThesisProposal" },
			{ label: "วิทยานิพนธ์/การค้นคว้าอิสระ", link: "/registrar-officer/RequestThesisDefense" },
		],
	},
	{
		label: "พิมพ์ผลการสอบ",
		icon: IconCertificate,
		links: [
			{ label: "ประมวลความรู้/สอบวัดคุณสมบัติ", link: "/registrar-officer/ExamResultsPrint" },
			{ label: "โครงร่างวิทยานิพนธ์/การค้นคว้าอิสระ", link: "/registrar-officer/ExamProposalResultsPrint" },
			{ label: "วิทยานิพนธ์/การค้นคว้าอิสระ", link: "/registrar-officer/ExamDefenseResultsPrint" },
		],
	},
	/* { label: "คำร้องขอสอบประมวลความรู้", icon: IconClipboardText, links: "/registrar-officer/RequestExam/ขอสอบประมวลความรู้" },
	{ label: "คำร้องขอสอบวัดคุณสมบัติ", icon: IconClipboardText, links: "/registrar-officer/RequestExam/ขอสอบวัดคุณสมบัติ" },
	{ label: "คำร้องขอทดสอบความรู้ทางภาษาอังกฤษ", icon: IconCertificate, links: "/registrar-officer/RequestEngTest" },
	{ label: "คำร้องขอสอบโครงร่างวิทยานิพนธ์/การค้นคว้าอิสระ", icon: IconReport, links: "/registrar-officer/RequestThesisProposal" },
	{ label: "คำร้องขอสอบวิทยานิพนธ์/การค้นคว้าอิสระ", icon: IconReport, links: "/registrar-officer/RequestThesisDefense" }, */
	/* { label: "พิมพ์ผลการสอบประมวลความรู้/สอบวัดคุณสมบัติ", icon: IconCertificate, links: "/registrar-officer/ExamResultsPrint" },
	{ label: "พิมพ์ผลการสอบโครงร่างวิทยานิพนธ์/การค้นคว้าอิสระ", icon: IconCertificate, links: "/registrar-officer/ExamProposalResultsPrint" },
	{ label: "พิมพ์ผลการสอบวิทยานิพนธ์/การค้นคว้าอิสระ", icon: IconCertificate, links: "/registrar-officer/ExamDefenseResultsPrint" }, */
	{ label: "กรอกข้อมูลรายวิชาบังคับ", icon: IconBooks, links: "/registrar-officer/CourseRegistration" },
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
