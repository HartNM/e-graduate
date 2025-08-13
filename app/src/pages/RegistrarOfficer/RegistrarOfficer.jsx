//เจ้าหน้าที่งานทะเบียน
import { IconGauge } from "@tabler/icons-react";
import UserLayout from "../../layout/userLayout.jsx";

const menu = [
	{ label: "คำร้องขอสอบ", icon: IconGauge, links: "/registrar-officer/requestList" },
	{ label: "กำหนดวันสอบประมวลความรู้/สอบวัดคุณสมบัต", icon: IconGauge, links: "/registrar-officer/ExamScheduleSetupPage" },
	{ label: "แต่งตั้งเจ้าหน้าที่ประจำสาขา", icon: IconGauge, links: "/registrar-officer/assign-major-officer" },
];

const RegistrarOfficer = () => {
	return (
		<>
			<UserLayout item={menu} />
		</>
	);
};

export default RegistrarOfficer;
