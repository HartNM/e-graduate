//ประธานกรรมการบัณฑิตศึกษาประจำสาขาวิชา
import { IconCertificate, IconClipboardText } from "@tabler/icons-react";
import UserLayout from "../../layout/userLayout.jsx";

const menu = [
	{ label: "คำร้องขอสอบประมวลความรู้/สอบวัดคุณสมบัต", icon: IconClipboardText, links: "/chairpersons/RequestExam" },
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
