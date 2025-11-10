//เจ้าหน้าที่ประจำคณะ
import { IconFileText, IconEdit, IconBooks, IconUserCheck, IconCertificate } from "@tabler/icons-react";
import UserLayout from "../../layout/userLayout.jsx";

const menu = [
	/* { label: "พิมพ์ใบรายชื่อผู้มีสิทธิสอบประมวลความรู้/สอบวัดคุณสมบัติ", icon: IconFileText, links: "/major-officer/ExamEligibleListPrint" }, */
	/* { label: "พิมพ์ใบรายชื่อผู้มีสิทธิสอบประมวลความรู้/สอบวัดคุณสมบัติ2", icon: IconFileText, links: "/major-officer/PrintExam" }, */
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
			{ label: "ประมวลความรู้/วัดคุณสมบัติ", link: "/major-officer/ExamResults" },
			{ label: "โครงร่างวิทยานิพนธ์/การค้นคว้าอิสระ", link: "/major-officer/ExamProposalResults" },
			{ label: "วิทยานิพนธ์/การค้นคว้าอิสระ", link: "/major-officer/ExamDefenseResults" },
		],
	},
	/* { label: "คำร้องขอทดสอบความรู้ทางภาษาอังกฤษ", icon: IconCertificate, links: "/major-officer/RequestEngTest" }, */
	/* { label: "กรอกผลการสอบประมวลความรู้/สอบวัดคุณสมบัติ", icon: IconEdit, links: "/major-officer/ExamResults" },
	{ label: "กรอกผลการสอบโครงร่างวิทยานิพนธ์/การค้นคว้าอิสระ", icon: IconEdit, links: "/major-officer/ExamProposalResults" },
	{ label: "กรอกผลการสอบวิทยานิพนธ์/การค้นคว้าอิสระ", icon: IconEdit, links: "/major-officer/ExamDefenseResults" }, */
	{ label: "กรอกข้อมูลรายวิชาสำหรับสอบประมวลความรู้/สอบวัดคุณสมบัติ", icon: IconBooks, links: "/major-officer/CourseRegistration" },
	{ label: "กรอกข้อมูลประธานกรรมการบัณฑิตศึกษาประจำสาขาวิชา", icon: IconUserCheck, links: "/major-officer/AssignChairpersons" },
];
/* data.education_level === "ปริญญาเอก" && newMenu.push({ label: "คำร้องขอทดสอบความรู้ทางภาษาอังกฤษ", icon: IconCertificate, links: "/student/RequestEngTest" }); */

const MajorOfficer = () => {
	return (
		<>
			<UserLayout item={menu} />
		</>
	);
};

export default MajorOfficer;
