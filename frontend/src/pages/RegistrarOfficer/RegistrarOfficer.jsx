//เจ้าหน้าที่งานทะเบียน
import { IconClipboardText, IconCertificate, IconCalendar, IconUserCheck, IconReport, IconBooks, IconBook } from "@tabler/icons-react";
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
	/* 	{
		label: "พิมพ์ผลการสอบ",
		icon: IconCertificate,
		links: [
			{ label: "ประมวลความรู้/สอบวัดคุณสมบัติ", link: "/registrar-officer/ExamResultsPrint" },
			{ label: "โครงร่างวิทยานิพนธ์/การค้นคว้าอิสระ", link: "/registrar-officer/ExamProposalResultsPrint" },
			{ label: "วิทยานิพนธ์/การค้นคว้าอิสระ", link: "/registrar-officer/ExamDefenseResultsPrint" },
		],
	}, */
	{
		label: "พิมพ์ผลการสอบ",
		icon: IconCertificate,
		links: [
			{ label: "ประมวลความรู้/วัดคุณสมบัติ", link: "/registrar-officer/ExamResults" },
			{ label: "โครงร่างวิทยานิพนธ์/การค้นคว้าอิสระ", link: "/registrar-officer/ExamProposalResults" },
			{ label: "วิทยานิพนธ์/การค้นคว้าอิสระ", link: "/registrar-officer/ExamDefenseResults" },
		],
	},
	{ label: "กรอกข้อมูลรายวิชาบังคับ", icon: IconBooks, links: "/registrar-officer/CourseRegistration" },
	{ label: "กรอกข้อมูลภาคเรียน", icon: IconCalendar, links: "/registrar-officer/ExamScheduleSetupPage" },
	{ label: "กรอกข้อมูลเจ้าหน้าที่ประจำสาขาวิชา", icon: IconUserCheck, links: "/registrar-officer/assign-major-officer" },
	{ label: `คู่มือ`, icon: IconBook, links: "/registrar-officer/Manual" },
];

const RegistrarOfficer = () => {
	return (
		<>
			<UserLayout item={menu} />
		</>
	);
};

export default RegistrarOfficer;
