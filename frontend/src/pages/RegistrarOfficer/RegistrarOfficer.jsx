// RegistrarOfficer.jsx
import { IconClipboardText, IconCertificate, IconCalendar, IconUserCheck, IconBooks, IconBook } from "@tabler/icons-react";
import UserLayout from "../../layout/userLayout.jsx";
import useMenuWithBadge from "../../hooks/useMenuWithBadge";

const initialMenu = [
	{
		label: "คำร้องขอสอบ",
		icon: IconClipboardText,
		links: [
			{ label: "ประมวลความรู้", link: "/registrar-officer/RequestExam/ขอสอบประมวลความรู้", type: "request_exam", status: "3" },
			{ label: "วัดคุณสมบัติ", link: "/registrar-officer/RequestExam/ขอสอบวัดคุณสมบัติ", type: "request_exam", status: "3" },
			{ label: "ความรู้ทางภาษาอังกฤษ", link: "/registrar-officer/RequestEngTest", type: "request_eng_test", status: "3" },
			{ label: "โครงร่างวิทยานิพนธ์/การค้นคว้าอิสระ", link: "/registrar-officer/RequestThesisProposal", type: "request_thesis_proposal", status: "3" },
			{ label: "วิทยานิพนธ์/การค้นคว้าอิสระ", link: "/registrar-officer/RequestThesisDefense", type: "request_thesis_defense", status: "3" },
		],
	},
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
	const menuItems = useMenuWithBadge(initialMenu);
	return <UserLayout item={menuItems} />;
};

export default RegistrarOfficer;
