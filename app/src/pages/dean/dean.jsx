//คณบดี
import { IconClipboardX } from "@tabler/icons-react";
import UserLayout from "../../layout/userLayout.jsx";

const menu = [
	/* { label: "คำร้องขอยกเลิกสอบประมวลความรู้/สอบวัดคุณสมบัติ", icon: IconClipboardX, links: "/dean/RequestExam" }, */
	{ label: `คำร้องขอยกเลิกการเข้าสอบประมวลความรู้/สอบวัดคุณสมบัติ`, icon: IconClipboardX, links: "/dean/RequestExamCancel" },
];

const GraduateCommitteeChair = () => {
	return (
		<>
			<UserLayout item={menu} />
		</>
	);
};
export default GraduateCommitteeChair;
