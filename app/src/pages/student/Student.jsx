//นักศึกษา
import { useEffect, useState } from "react";
import { IconClipboardText, IconCertificate, IconReport, IconFileText, IconSchool, IconSearch, IconCalendarClock, IconClipboardX } from "@tabler/icons-react";
import UserLayout from "../../layout/userLayout.jsx";

const Student = () => {
	const [menu, setMenu] = useState([]);
	const token = localStorage.getItem("token");

	useEffect(() => {
		(async () => {
			try {
				const res = await fetch("http://localhost:8080/api/checkStudent", {
					method: "GET",
					headers: { Authorization: `Bearer ${token}` },
				});
				const data = await res.json();
				const newMenu = [];
				newMenu.push({ label: `คำร้องขอสอบ${data.education_level === "ปริญญาโท" ? "ประมวลความรู้" : "วัดคุณสมบัติ"}`, icon: IconClipboardText, links: "/student/RequestExam" });
				if (data.RequestExamCancel) {
					newMenu.push({ label: `คำร้องขอยกเลิกการเข้าสอบ${data.education_level === "ปริญญาโท" ? "ประมวลความรู้" : "วัดคุณสมบัติ"}`, icon: IconClipboardX, links: "/student/RequestExamCancel" });
				}
				data.education_level === "ปริญญาเอก" && newMenu.push({ label: "คำร้องขอทดสอบความรู้ทางภาษาอังกฤษ", icon: IconCertificate, links: "/student/RequestEngTest" });
				if (data.RequestThesisProposal) {
					newMenu.push({ label: `คำร้องขอสอบโครงร่างวิทยานิพนธ์/การค้นคว้าอิสระ`, icon: IconReport, links: "/student/RequestThesisProposal" });
				}
				if (data.PostponeProposalExam) {
					data.education_level === "ปริญญาเอก" && newMenu.push({ label: `คำร้องขอเลื่อนสอบโครงร่างการวิจัย`, icon: IconCalendarClock, links: "/student/PostponeProposalExam" });
				}
				if (data.RequestThesisDefense) {
					newMenu.push({ label: `คำร้องขอสอบวิทยานิพนธ์/การค้นคว้าอิสระ`, icon: IconFileText, links: "/student/RequestThesisDefense" });
				}
				if (data.PostponeDefenseExam) {
					newMenu.push({ label: `คำร้องขอเลื่อนสอบการวิจัย`, icon: IconCalendarClock, links: "/student/PostponeDefenseExam" });
				}
				if (data.RequestGraduation) {
					newMenu.push({ label: "คำร้องขอสำเร็จการศึกษา", icon: IconSchool, links: "/student/RequestGraduation" });
				}
				setMenu(newMenu);
			} catch (e) {
				console.error("Error fetching checkStudent:", e);
			}
		})();
	}, []);

	return <UserLayout item={menu} />;
};

export default Student;
