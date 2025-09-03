//อาจารย์ที่ปรึกษา
import { IconClipboardText, IconCertificate, IconClipboardX, IconReport } from "@tabler/icons-react";
import UserLayout from "../../layout/userLayout.jsx";

const menu = [
	{ label: "คำร้องขอสอบประมวลความรู้/สอบวัดคุณสมบัต", icon: IconClipboardText, links: "/advisor/RequestExam" },
	{ label: `คำร้องขอยกเลิกการเข้าสอบประมวลความรู้/สอบวัดคุณสมบัต`, icon: IconClipboardX, links: "/advisor/RequestExamCancel" },
	{ label: "คำร้องขอทดสอบความรู้ทางภาษาอังกฤษ", icon: IconCertificate, links: "/advisor/RequestEngTest" },
	{ label: `คำร้องขอลงทะเบียนสอบโครงร่างวิทยานิพนธ์/การค้นคว้าอิสระ`, icon: IconReport, links: "/advisor/RequestThesisProposal" },
];

const Advisor = () => {
	return (
		<>
			<UserLayout item={menu} />
		</>
	);
};

export default Advisor;
