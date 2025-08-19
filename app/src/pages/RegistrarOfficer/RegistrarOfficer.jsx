//เจ้าหน้าที่งานทะเบียน
import { IconGauge } from "@tabler/icons-react";
import UserLayout from "../../layout/userLayout.jsx";

const menu = [
	{ label: "คำร้องขอสอบวัดคุณสมบัติ", icon: IconGauge, links: "/registrar-officer/requestList?type=ขอสอบวัดคุณสมบัติ" },
	{ label: "คำร้องขอสอบประมวลความรู้", icon: IconGauge, links: "/registrar-officer/requestList?type=ขอสอบประมวลความรู้" },
	{ label: "พิมพ์ผลการสอบ", icon: IconGauge, links: "/registrar-officer/exam-results-print" },
	{ label: "กำหนดวันสอบประมวลความรู้/สอบวัดคุณสมบัต", icon: IconGauge, links: "/registrar-officer/ExamScheduleSetupPage" },
	{ label: "กรอกข้อมูลเจ้าหน้าที่ประจำสาขาวิชา", icon: IconGauge, links: "/registrar-officer/assign-major-officer" },
];

const RegistrarOfficer = () => {
	return (
		<>
			<UserLayout item={menu} />
		</>
	);
};

export default RegistrarOfficer;
