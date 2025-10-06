//เจ้าหน้าที่ประจำคณะ
import { IconFileText, IconEdit, IconBooks, IconUserCheck } from "@tabler/icons-react";
import UserLayout from "../../layout/userLayout.jsx";

const menu = [
	{ label: "พิมพ์ใบรายชื่อผู้มีสิทธิสอบประมวลความรู้/สอบวัดคุณสมบัติ", icon: IconFileText, links: "/major-officer/ExamEligibleListPrint" },
	{ label: "กรอกผลการสอบประมวลความรู้/สอบวัดคุณสมบัติ", icon: IconEdit, links: "/major-officer/examResults" },
	{ label: "กรอกข้อมูลรายวิชาสำหรับสอบประมวลความรู้/สอบวัดคุณสมบัติ", icon: IconBooks, links: "/major-officer/CourseRegistration" },
	{ label: "กรอกข้อมูลประธานกรรมการบัณฑิตศึกษาประจำสาขาวิชา", icon: IconUserCheck, links: "/major-officer/AssignChairpersons" },
];

const MajorOfficer = () => {
	return (
		<>
			<UserLayout item={menu} />
		</>
	);
};

export default MajorOfficer;
