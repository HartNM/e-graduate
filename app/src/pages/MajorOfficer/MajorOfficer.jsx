//เจ้าหน้าที่ประจำคณะ
import { IconGauge } from "@tabler/icons-react";
import UserLayout from "../../layout/userLayout.jsx";

const menu = [
	{ label: "กรอกวิชาที่ต้องลงทะเบียนเรียน", icon: IconGauge, links: "/major-officer/CourseRegistration" },
	{ label: "แต่งตั้งประธานกรรมการบัณฑิตศึกษา", icon: IconGauge, links: "/major-officer/AssignChairpersons" },
	{ label: "กรอกผลการสอบ", icon: IconGauge, links: "/major-officer/examResults" },
];

const MajorOfficer = () => {
	return (
		<>
			<UserLayout item={menu} />
		</>
	);
};

export default MajorOfficer;
