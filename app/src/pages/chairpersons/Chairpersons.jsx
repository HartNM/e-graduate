//ประธานกรรมการบัณฑิตศึกษาประจำสาขาวิชา
import { IconCertificate, IconClipboardText, IconClipboardX, IconReport, IconCalendarClock, IconSearch, IconSchool } from "@tabler/icons-react";
import UserLayout from "../../layout/userLayout.jsx";

const menu = [
	{ label: "คำร้องขอสอบประมวลความรู้/สอบวัดคุณสมบัติ", icon: IconClipboardText, links: "/chairpersons/RequestExam" },
	{ label: "คำร้องขอยกเลิกการเข้าสอบประมวลความรู้/สอบวัดคุณสมบัติ", icon: IconClipboardX, links: "/chairpersons/RequestExamCancel" },
	{ label: "คำร้องขอทดสอบความรู้ทางภาษาอังกฤษ", icon: IconCertificate, links: "/chairpersons/RequestEngTest" },
	{ label: `คำร้องขอสอบโครงร่างวิทยานิพนธ์/การค้นคว้าอิสระ`, icon: IconReport, links: "/chairpersons/RequestThesisProposal" },
	{ label: `คำร้องขอเลื่อนสอบโครงร่างการวิจัย`, icon: IconCalendarClock, links: "/chairpersons/PostponeProposalExam" },
	{ label: `คำร้องขอสอบวิทยานิพนธ์/การค้นคว้าอิสระ`, icon: IconReport, links: "/chairpersons/RequestThesisDefense" },
	{ label: `คำร้องขอเลื่อนสอบการวิจัย`, icon: IconCalendarClock, links: "/chairpersons/PostponeDefenseExam" },
	{ label: "คำร้องขอสำเร็จการศึกษาระดับบัณฑิตศึกษา", icon: IconSchool, links: "/chairpersons/RequestGraduation" },
];

const Chairpersons = () => {
	return (
		<>
			<UserLayout item={menu} />
		</>
	);
};
export default Chairpersons;
