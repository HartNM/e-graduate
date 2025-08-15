//เจ้าหน้าที่ประจำคณะ
import { IconGauge } from "@tabler/icons-react";
import UserLayout from "../../layout/userLayout.jsx";

const menu = [
	{ label: "พิมพ์ใบรายชื่อผู้มีสิทธิสอบ", icon: IconGauge, links: "/major-officer/ExamEligibleListPrint" },
	{ label: "กรอกผลการสอบ", icon: IconGauge, links: "/major-officer/examResults" },
	{ label: "กรอกวิชาที่ต้องลงทะเบียนเรียน", icon: IconGauge, links: "/major-officer/CourseRegistration" },
	{ label: "กรอกข้อมูลประธานกรรมการบัณฑิตศึกษาประจำสาขาวิชา", icon: IconGauge, links: "/major-officer/AssignChairpersons" },
];

const MajorOfficer = () => {
	return (
		<>
			<UserLayout item={menu} />
		</>
	);
};

export default MajorOfficer;
