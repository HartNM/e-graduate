//นักศึกษา
import { useEffect, useState } from "react";
import { IconCertificate, IconClipboardText } from "@tabler/icons-react";
import UserLayout from "../../layout/userLayout.jsx";

const Student = () => {
	const [menu, setMenu] = useState([]);
	const token = localStorage.getItem("token");

	const baseMenu = [{ label: "คำร้องขอทดสอบความรู้ทางภาษาอังกฤษ", icon: IconCertificate, links: "/student/RequestEngTest" }];

	useEffect(() => {
		(async () => {
			try {
				const eduRes = await fetch("http://localhost:8080/api/studentInfo", {
					method: "GET",
					headers: { Authorization: `Bearer ${token}` },
				});
				const eduData = await eduRes.json();

				const requestExamMenu = { label: `คำร้องขอสอบ${eduData.education_level === "ปริญญาโท" ? "ประมวลความรู้" : "วัดคุณสมบัติ"}`, icon: IconClipboardText, links: "/student/RequestExam" };

				setMenu([requestExamMenu, ...baseMenu]);
			} catch (err) {
				console.error("Error fetching education level:", err);
				setMenu(baseMenu);
			}
		})();
	}, []);

	return <UserLayout item={menu} />;
};

export default Student;
