//อาจารย์ที่ปรึกษา
import { IconReport, IconCalendarClock, IconSchool } from "@tabler/icons-react";
import UserLayout from "../../layout/userLayout.jsx";

const menu = [
	{ label: `คำร้องขอสอบโครงร่างวิทยานิพนธ์/การค้นคว้าอิสระ`, icon: IconReport, links: "/research_advisor/RequestThesisProposal" },
	{ label: `คำร้องขอเลื่อนสอบโครงร่างวิทยานิพนธ์/การค้นคว้าอิสระ`, icon: IconCalendarClock, links: "/research_advisor/PostponeProposalExam" },
	{ label: `คำร้องขอสอบวิทยานิพนธ์/การค้นคว้าอิสระ`, icon: IconReport, links: "/research_advisor/RequestThesisDefense" },
	{ label: `คำร้องขอเลื่อนสอบวิทยานิพนธ์/การค้นคว้าอิสระ`, icon: IconCalendarClock, links: "/research_advisor/PostponeDefenseExam" },
];

const research_advisor = () => {
	return (
		<>
			<UserLayout item={menu} />
		</>
	);
};

export default research_advisor;
