import { useMemo } from "react";
import { IconClipboardText, IconCertificate, IconReport, IconFileText, IconClipboardX, IconBook } from "@tabler/icons-react";
import UserLayout from "../../layout/userLayout.jsx";
import { jwtDecode } from "jwt-decode";
import useMenuWithBadge from "../../hooks/useMenuWithBadge";

const Student = () => {
	const token = localStorage.getItem("token");

	const { education_level } = useMemo(() => {
		if (!token) return { education_level: "" };
		try {
			return jwtDecode(token);
		} catch (error) {
			console.error("Invalid token:", error);
			return { education_level: "" };
		}
	}, [token]);

	const initialMenu = useMemo(() => {
		const menu = [];
		const isMaster = education_level === "ปริญญาโท";

		menu.push({
			label: `คำร้องขอสอบ${isMaster ? "ประมวลความรู้" : "วัดคุณสมบัติ"}`,
			icon: IconClipboardText,
			links: "/student/RequestExam",
			type: "request_exam",
			status: "4",
		});

		menu.push({
			label: `คำร้องขอยกเลิกการเข้าสอบ${isMaster ? "ประมวลความรู้" : "วัดคุณสมบัติ"}`,
			icon: IconClipboardX,
			links: "/student/RequestExamCancel",
		});

		if (education_level === "ปริญญาเอก") {
			menu.push({
				label: "คำร้องขอสอบความรู้ทางภาษาอังกฤษ",
				icon: IconCertificate,
				links: "/student/RequestEngTest",
				type: "request_eng_test",
				status: "4",
			});
		}

		menu.push({
			label: isMaster ? `คำร้องขอสอบโครงร่างวิทยานิพนธ์/การค้นคว้าอิสระ` : `คำร้องขอสอบโครงร่างวิทยานิพนธ์`,
			icon: IconReport,
			links: "/student/RequestThesisProposal",
			type: "request_thesis_proposal",
			status: "4",
		});

		menu.push({
			label: isMaster ? `คำร้องขอสอบวิทยานิพนธ์/การค้นคว้าอิสระ` : `คำร้องขอสอบวิทยานิพนธ์`,
			icon: IconFileText,
			links: "/student/RequestThesisDefense",
			type: "request_thesis_defense",
			status: "4",
		});

		menu.push({ label: `คู่มือ`, icon: IconBook, links: "/student/Manual" });

		return menu;
	}, [education_level]);
	const menuItems = useMenuWithBadge(initialMenu);

	return <UserLayout item={menuItems} />;
};

export default Student;
