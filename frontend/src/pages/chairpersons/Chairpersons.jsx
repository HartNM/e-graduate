//ประธานกรรมการบัณฑิตศึกษาประจำสาขาวิชา
import { IconCertificate, IconClipboardText, IconClipboardX, IconReport, IconBook } from "@tabler/icons-react";
import UserLayout from "../../layout/userLayout.jsx";
import useMenuWithBadge from "../../hooks/useMenuWithBadge";

const initialMenu = [
	{ label: "คำร้องขอสอบประมวลความรู้/สอบวัดคุณสมบัติ", icon: IconClipboardText, links: "/chairpersons/RequestExam", type: "request_exam", status: "2" },
	{ label: "คำร้องขอยกเลิกการเข้าสอบประมวลความรู้/สอบวัดคุณสมบัติ", icon: IconClipboardX, links: "/chairpersons/RequestExamCancel", type: "request_exam_cancel", status: "8" },
	{ label: "คำร้องขอสอบความรู้ทางภาษาอังกฤษ", icon: IconCertificate, links: "/chairpersons/RequestEngTest", type: "request_eng_test", status: "2" },
	{ label: `คำร้องขอสอบโครงร่างวิทยานิพนธ์/การค้นคว้าอิสระ`, icon: IconReport, links: "/chairpersons/RequestThesisProposal", type: "request_thesis_proposal", status: "2" },
	{ label: `คำร้องขอสอบวิทยานิพนธ์/การค้นคว้าอิสระ`, icon: IconReport, links: "/chairpersons/RequestThesisDefense", type: "request_thesis_defense", status: "2" },
	{ label: `คู่มือ`, icon: IconBook, links: "/chairpersons/Manual" },
];

const Chairpersons = () => {
	const menuItems = useMenuWithBadge(initialMenu);
	return <UserLayout item={menuItems} />;
};
export default Chairpersons;
