import { IconClipboardText, IconCertificate, IconClipboardX, IconBook } from "@tabler/icons-react";
import UserLayout from "../../layout/userLayout.jsx";
import useMenuWithBadge from "../../hooks/useMenuWithBadge";

const initialMenu = [
	{ label: "คำร้องขอสอบประมวลความรู้/สอบวัดคุณสมบัติ", icon: IconClipboardText, links: "/advisor/RequestExam", type: "request_exam", status: "1" },
	{ label: `คำร้องขอยกเลิกการเข้าสอบ`, icon: IconClipboardX, links: "/advisor/RequestExamCancel", type: "request_exam_cancel", status: "7" },
	{ label: "คำร้องขอสอบความรู้ทางภาษาอังกฤษ", icon: IconCertificate, links: "/advisor/RequestEngTest", type: "request_eng_test", status: "1" },
	{ label: `คู่มือ`, icon: IconBook, links: "/advisor/Manual" },
];

const Advisor = () => {
	const menuItems = useMenuWithBadge(initialMenu);

	return <UserLayout item={menuItems} />;
};

export default Advisor;
