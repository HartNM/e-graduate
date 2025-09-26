//อาจารย์ที่ปรึกษา
import { IconClipboardText, IconCertificate, IconClipboardX, IconReport, IconCalendarClock, IconSearch, IconSchool } from "@tabler/icons-react";
import UserLayout from "../../layout/userLayout.jsx";

const menu = [
	{ label: "คำร้องขอสอบประมวลความรู้/สอบวัดคุณสมบัติ", icon: IconClipboardText, links: "/advisor/RequestExam" },
	{ label: `คำร้องขอยกเลิกการเข้าสอบประมวลความรู้/สอบวัดคุณสมบัติ`, icon: IconClipboardX, links: "/advisor/RequestExamCancel" },
	{ label: "คำร้องขอทดสอบความรู้ทางภาษาอังกฤษ", icon: IconCertificate, links: "/advisor/RequestEngTest" },
	{ label: `คำร้องขอสอบโครงร่างการวิจัย`, icon: IconReport, links: "/advisor/RequestThesisProposal" },
	{ label: `คำร้องขอเลื่อนสอบโครงร่างการวิจัย`, icon: IconCalendarClock, links: "/advisor/PostponeProposalExam" },
	{ label: "รายงานตรวจสอบโครงร่างการวิจัย", icon: IconSearch, links: "/advisor/PlagiarismProposal" },
	{ label: `คำร้องขอสอบการวิจัย`, icon: IconReport, links: "/advisor/RequestThesisDefense" },
	{ label: `คำร้องขอเลื่อนสอบการวิจัย`, icon: IconCalendarClock, links: "/advisor/PostponeDefenseExam" },
	{ label: "รายงานตรวจสอบการวิจัย", icon: IconSearch, links: "/advisor/PlagiarismDefense" },
	/* { label: "รายงานผลการตรวจสอบการคัดลอกผลงานทางวิชาการ", icon: IconSearch, links: "/advisor/PlagiarismReport" }, */
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
