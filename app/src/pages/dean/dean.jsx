//คณบดี
import { IconClipboardX  } from "@tabler/icons-react";
import UserLayout from "../../layout/userLayout.jsx";

const menu = [{ label: "คำร้องขอยกเลิกสอบประมวลความรู้/สอบวัดคุณสมบัต", icon: IconClipboardX , links: "/dean/RequestExam" }];

const GraduateCommitteeChair = () => {
	return (
		<>
			<UserLayout item={menu} />
		</>
	);
};
export default GraduateCommitteeChair;
