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
				const eduRes = await fetch("http://localhost:8080/api/studentInfo", {
					method: "GET",
					headers: { Authorization: `Bearer ${token}` },
				});
				const eduData = await eduRes.json();

				setMenu([
					{ label: `คำร้องขอสอบ${eduData.education_level === "ปริญญาโท" ? "ประมวลความรู้" : "วัดคุณสมบัติ"}`, icon: IconClipboardText, links: "/student/RequestExam" },
					{ label: `คำร้องขอยกเลิกการเข้าสอบ${eduData.education_level === "ปริญญาโท" ? "ประมวลความรู้" : "วัดคุณสมบัติ"}`, icon: IconClipboardX, links: "/student/RequestExamCancel" },
					{ label: "คำร้องขอทดสอบความรู้ทางภาษาอังกฤษ", icon: IconCertificate, links: "/student/RequestEngTest" },
					{ label: `คำร้องขอลงทะเบียนสอบโครงร่าง${eduData.education_level === "ปริญญาโท" ? "วิทยานิพนธ์" : "การค้นคว้าอิสระ"}`, icon: IconReport, links: "/student/RequestThesisProposal" },
					/* { label: `คำร้องขอเลื่อนสอบโครงร่าง${eduData.education_level === "ปริญญาโท" ? "วิทยานิพนธ์" : "การค้นคว้าอิสระ"}`, icon: IconCalendarClock, links: "/student/PostponeProposalExam" }, */
					{ label: `คำร้องขอลงทะเบียนสอบ${eduData.education_level === "ปริญญาโท" ? "วิทยานิพนธ์" : "การค้นคว้าอิสระ"}`, icon: IconFileText, links: "/student/RequestThesisDefense" },
					/* { label: `คำร้องขอเลื่อนสอบ${eduData.education_level === "ปริญญาโท" ? "วิทยานิพนธ์" : "การค้นคว้าอิสระ"}`, icon: IconCalendarClock, links: "/student/PostponeDefenseExam" }, */
					{ label: `คำร้องขอสำเร็จการศึกษาระดับบัณฑิตศึกษา`, icon: IconSchool, links: "/student/RequestGraduation" },
					{ label: `รายงานผลการตรวจสอบการคัดลอกผลงานทางวิชาการ`, icon: IconSearch, links: "/student/PlagiarismReport" },
				]);
			} catch (err) {
				console.error("Error fetching education level:", err);
			}
		})();
	}, []);

	return <UserLayout item={menu} />;
};

export default Student;
