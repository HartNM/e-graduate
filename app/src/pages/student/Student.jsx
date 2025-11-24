//นักศึกษา
import { useEffect, useState } from "react";
import { IconClipboardText, IconCertificate, IconReport, IconFileText, IconSchool, IconSearch, IconCalendarClock, IconClipboardX } from "@tabler/icons-react";
import UserLayout from "../../layout/userLayout.jsx";
const BASE_URL = import.meta.env.VITE_API_URL;

const Student = () => {
	const [menu, setMenu] = useState([]);
	const token = localStorage.getItem("token");

	useEffect(() => {
		(async () => {
			try {
				const newMenu = [];
				/* const res = await fetch(`${BASE_URL}/api/checkStudent`, {
					method: "GET",
					headers: { Authorization: `Bearer ${token}` },
				});
				const data = await res.json();
				newMenu.push({ label: `คำร้องขอสอบ${data.education_level === "ปริญญาโท" ? "ประมวลความรู้" : "วัดคุณสมบัติ"}`, icon: IconClipboardText, links: "/student/RequestExam" });
				if (data.RequestExamCancel) {
					newMenu.push({ label: `คำร้องขอยกเลิกการเข้าสอบ${data.education_level === "ปริญญาโท" ? "ประมวลความรู้" : "วัดคุณสมบัติ"}`, icon: IconClipboardX, links: "/student/RequestExamCancel" });
				}
				data.education_level === "ปริญญาเอก" && newMenu.push({ label: "คำร้องขอทดสอบความรู้ทางภาษาอังกฤษ", icon: IconCertificate, links: "/student/RequestEngTest" });
				if (data.RequestThesisProposal) {
					newMenu.push({ label: `คำร้องขอสอบโครงร่างวิทยานิพนธ์/การค้นคว้าอิสระ`, icon: IconReport, links: "/student/RequestThesisProposal" });
				}
				if (data.RequestThesisDefense) {
					newMenu.push({ label: `คำร้องขอสอบวิทยานิพนธ์/การค้นคว้าอิสระ`, icon: IconFileText, links: "/student/RequestThesisDefense" });
				} */
				newMenu.push({ label: `คำร้องขอสอบ${data.education_level === "ปริญญาโท" ? "ประมวลความรู้" : "วัดคุณสมบัติ"}`, icon: IconClipboardText, links: "/student/RequestExam" });
				newMenu.push({ label: `คำร้องขอยกเลิกการเข้าสอบ${data.education_level === "ปริญญาโท" ? "ประมวลความรู้" : "วัดคุณสมบัติ"}`, icon: IconClipboardX, links: "/student/RequestExamCancel" });
				data.education_level === "ปริญญาเอก" && newMenu.push({ label: "คำร้องขอทดสอบความรู้ทางภาษาอังกฤษ", icon: IconCertificate, links: "/student/RequestEngTest" });
				newMenu.push({ label: `คำร้องขอสอบโครงร่างวิทยานิพนธ์/การค้นคว้าอิสระ`, icon: IconReport, links: "/student/RequestThesisProposal" });
				newMenu.push({ label: `คำร้องขอสอบวิทยานิพนธ์/การค้นคว้าอิสระ`, icon: IconFileText, links: "/student/RequestThesisDefense" });

				setMenu(newMenu);
			} catch (e) {
				console.error("Error fetching checkStudent:", e);
			}
		})();
	}, []);

	return <UserLayout item={menu} />;
};

export default Student;
