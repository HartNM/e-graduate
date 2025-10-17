//อาจารย์ที่ปรึกษา
import { IconClipboardText, IconCertificate, IconClipboardX, IconReport, IconCalendarClock, IconSearch, IconSchool } from "@tabler/icons-react";
import UserLayout from "../../layout/userLayout.jsx";

const menu = [
	{ label: "AssignFinanceOfficer", icon: IconClipboardText, links: "/admin/AssignFinanceOfficer" },
	{ label: "AssignRegistrarOfficer", icon: IconClipboardText, links: "/admin/AssignRegistrarOfficer" },
];

const Advisor = () => {
	return (
		<>
			<UserLayout item={menu} />
		</>
	);
};

export default Advisor;
