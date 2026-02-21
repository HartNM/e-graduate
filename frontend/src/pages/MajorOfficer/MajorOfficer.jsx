// MajorOfficer.jsx
import { IconFileText, IconEdit, IconBooks, IconUserCheck, IconCertificate, IconBook } from "@tabler/icons-react";
import UserLayout from "../../layout/userLayout.jsx";
import useMenuWithBadge from "../../hooks/useMenuWithBadge"; // Import Hook ที่สร้างตะกี้

const initialMenu = [
	{ label: "กรอกข้อมูลรายวิชาบังคับ", icon: IconBooks, links: "/major-officer/CourseRegistration" },
	{ label: "กรอกข้อมูลประธานกรรมการบัณฑิตศึกษาประจำสาขาวิชา", icon: IconUserCheck, links: "/major-officer/AssignChairpersons" },
	{
		label: "พิมพ์ใบรายชื่อผู้มีสิทธิสอบ",
		icon: IconFileText,
		links: [
			{ label: "ประมวลความรู้/วัดคุณสมบัติ", link: "/major-officer/PrintExam" },
			{ label: "ความรู้ทางภาษาอังกฤษ", link: "/major-officer/PrintEngTest" },
			{ label: "โครงร่างวิทยานิพนธ์/การค้นคว้าอิสระ", link: "/major-officer/PrintThesisProposal" },
			{ label: "วิทยานิพนธ์/การค้นคว้าอิสระ", link: "/major-officer/PrintThesisDefense" },
		],
	},
	{
		label: "สถานะคำร้องขอสอบ",
		icon: IconCertificate,
		links: [
			{ label: "ประมวลความรู้/วัดคุณสมบัติ", link: "/major-officer/RequestExam" },
			{ label: "ความรู้ทางภาษาอังกฤษ", link: "/major-officer/RequestEngTest" },
			{ label: "โครงร่างวิทยานิพนธ์/การค้นคว้าอิสระ", link: "/major-officer/RequestThesisProposal" },
			{ label: "วิทยานิพนธ์/การค้นคว้าอิสระ", link: "/major-officer/RequestThesisDefense" },
		],
	},
	{
		label: "กรอกผลการสอบ",
		icon: IconEdit,
		links: [
			{ label: "ประมวลความรู้/วัดคุณสมบัติ", link: "/major-officer/ExamResults", type: "request_exam", status: "5" },
			{ label: "โครงร่างวิทยานิพนธ์/การค้นคว้าอิสระ", link: "/major-officer/ExamProposalResults", type: "request_thesis_proposal", status: "5" },
			{ label: "วิทยานิพนธ์/การค้นคว้าอิสระ", link: "/major-officer/ExamDefenseResults", type: "request_thesis_defense", status: "5" },
		],
	},
	{ label: `คู่มือ`, icon: IconBook, links: "/major-officer/Manual" },
];

const MajorOfficer = () => {
	const menuItems = useMenuWithBadge(initialMenu);

	return <UserLayout item={menuItems} />;
};

export default MajorOfficer;
