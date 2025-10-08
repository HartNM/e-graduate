//อาจารย์ที่ปรึกษา
import { IconClipboardText, IconCertificate, IconClipboardX, IconReport, IconCalendarClock, IconSearch, IconSchool } from "@tabler/icons-react";
import UserLayout from "../../layout/userLayout.jsx";

const menu = [
	{ label: "คำร้องขอสอบประมวลความรู้/สอบวัดคุณสมบัติ", icon: IconClipboardText, links: "/advisor/RequestExam" },
	{ label: `คำร้องขอยกเลิกการเข้าสอบประมวลความรู้/สอบวัดคุณสมบัติ`, icon: IconClipboardX, links: "/advisor/RequestExamCancel" },
	{ label: "คำร้องขอทดสอบความรู้ทางภาษาอังกฤษ", icon: IconCertificate, links: "/advisor/RequestEngTest" },
	{ label: `คำร้องขอสอบโครงร่างวิทยานิพนธ์/การค้นคว้าอิสระ`, icon: IconReport, links: "/advisor/RequestThesisProposal" },
	{ label: `คำร้องขอเลื่อนสอบโครงร่างวิทยานิพนธ์/การค้นคว้าอิสระ`, icon: IconCalendarClock, links: "/advisor/PostponeProposalExam" },
	{ label: `คำร้องขอสอบวิทยานิพนธ์/การค้นคว้าอิสระ`, icon: IconReport, links: "/advisor/RequestThesisDefense" },
	{ label: `คำร้องขอเลื่อนสอบวิทยานิพนธ์/การค้นคว้าอิสระ`, icon: IconCalendarClock, links: "/advisor/PostponeDefenseExam" },
	{ label: "คำร้องขอสำเร็จการศึกษาระดับบัณฑิตศึกษา", icon: IconSchool, links: "/advisor/RequestGraduation" },
];

const Advisor = () => {
	return (
		<>
			<UserLayout item={menu} />
		</>
	);
};

export default Advisor;
