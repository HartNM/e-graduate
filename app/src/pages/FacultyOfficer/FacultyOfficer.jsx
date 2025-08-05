//เจ้าหน้าที่ประจำคณะ
import { IconGauge } from "@tabler/icons-react";
import UserLayout from "../../layout/userLayout.jsx";

const menu = [
	{ label: "กรอกวิชาที่ต้องลงทะเบียนเรียน", icon: IconGauge, links: "/faculty-officer/CourseRegistration" },
	{ label: "แต่งตั้งประธานกรรมการบัณฑิตศึกษา", icon: IconGauge, links: "/faculty-officer/AssignChairpersons" },
];

const FacultyOfficer = () => {
	return (
		<>
			<UserLayout item={menu} />
		</>
	);
};

export default FacultyOfficer;
