//ประธานกรรมการบัณฑิตศึกษาประจำสาขาวิชา
import { IconCertificate, IconClipboardText, IconClipboardX } from "@tabler/icons-react";
import UserLayout from "../../layout/userLayout.jsx";

const menu = [
	{ label: "คำร้องขอสอบประมวลความรู้/สอบวัดคุณสมบัต", icon: IconClipboardText, links: "/chairpersons/RequestExam" },
	{ label: `คำร้องขอยกเลิกการเข้าสอบประมวลความรู้/สอบวัดคุณสมบัต`, icon: IconClipboardX, links: "/chairpersons/RequestExamCancel" },
	{ label: "คำร้องขอทดสอบความรู้ทางภาษาอังกฤษ", icon: IconCertificate, links: "/chairpersons/RequestEngTest" },
];

const Chairpersons = () => {
	return (
		<>
			<UserLayout item={menu} />
		</>
	);
};
export default Chairpersons;
