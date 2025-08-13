//อาจารย์ที่ปรึกษา
import { IconGauge } from "@tabler/icons-react";
import UserLayout from "../../layout/userLayout.jsx";

const menu = [
	{ label: "คำร้องขอสอบ", icon: IconGauge, links: "/advisor/requestList" },
	{ label: "กรอกผลการสอบ", icon: IconGauge, links: "/advisor/examResults" },
];

const Advisor = () => {
	return (
		<>
			<UserLayout item={menu} />
		</>
	);
};

export default Advisor;
