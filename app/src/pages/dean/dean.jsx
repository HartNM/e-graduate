//คณบดี
import { IconGauge } from "@tabler/icons-react";
import UserLayout from "../../layout/userLayout.jsx";

const menu = [{ label: "คำร้องขอยกเลิกสอบ", icon: IconGauge, links: "/dean/requestList" }];

const GraduateCommitteeChair = () => {
	return (
		<>
			<UserLayout item={menu} />
		</>
	);
};
export default GraduateCommitteeChair;
