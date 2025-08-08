//นักศึกษา
import { useEffect, useState } from "react";
import { IconGauge } from "@tabler/icons-react";
import UserLayout from "../../layout/userLayout.jsx";

const Student = () => {
	const [menu, setMenu] = useState([]);
	const token = localStorage.getItem("token");

	useEffect(() => {
		const fetchEducationLevel = async () => {
			try {
				const eduRes = await fetch("http://localhost:8080/api/studentInfo", {
					method: "GET",
					headers: { Authorization: `Bearer ${token}` },
				});
				const eduData = await eduRes.json();

				const menuItem = { label: `คำร้องขอสอบ${eduData.request_type}`, icon: IconGauge, links: "/student/requestList" };
				setMenu([menuItem]);
			} catch (err) {
				console.error("Error fetching education level:", err);
			}
		};
		fetchEducationLevel();
	}, []);
	return <UserLayout item={menu} />;
};

export default Student;
