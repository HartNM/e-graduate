//ประธานกรรมการบัณฑิตศึกษาประจำสาขาวิชา
import { IconGauge } from "@tabler/icons-react";
import UserLayout from "../../layout/userLayout.jsx";

const menu = [{ label: "คำร้องขอสอบ", icon: IconGauge, links: "/graduate-committee-chair/requestList" }];

const GraduateCommitteeChair = () => {
	return (
		<>
			<UserLayout item={menu} />
		</>
	);
};
export default GraduateCommitteeChair;
