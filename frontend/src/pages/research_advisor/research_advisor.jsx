//อาจารย์ที่ปรึกษา
import { IconReport, IconBook } from "@tabler/icons-react";
import UserLayout from "../../layout/userLayout.jsx";
import useMenuWithBadge from "../../hooks/useMenuWithBadge";

const initialMenu = [
	{ label: `คำร้องขอสอบโครงร่างวิทยานิพนธ์/การค้นคว้าอิสระ`, icon: IconReport, links: "/research_advisor/RequestThesisProposal", type: "request_thesis_proposal", status: "1" },
	{ label: `คำร้องขอสอบวิทยานิพนธ์/การค้นคว้าอิสระ`, icon: IconReport, links: "/research_advisor/RequestThesisDefense", type: "request_thesis_defense", status: "1" },
	{ label: `คู่มือ`, icon: IconBook, links: "/research_advisor/Manual" },
];

const research_advisor = () => {
	const menuItems = useMenuWithBadge(initialMenu);
	return <UserLayout item={menuItems} />;
};

export default research_advisor;
