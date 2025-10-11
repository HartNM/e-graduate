import { useEffect, useState } from "react";
import { Avatar, Group, Text, UnstyledButton, Select } from "@mantine/core";
import classes from "./UserButton.module.css";
import { jwtDecode } from "jwt-decode";
import { useNavigate } from "react-router-dom";

export function UserButton() {
	const navigate = useNavigate();
	const [userName, setUserName] = useState("");
	const [roles, setRoles] = useState([]);
	const [activeRole, setActiveRole] = useState("");

	// Mapping role -> label ภาษาไทย
	const roleLabels = {
		student: "นักศึกษา",
		advisor: "อาจารย์ที่ปรึกษาหมู่เรียน",
		research_advisor: "อาจารย์ที่ปรึกษาวิทยานิพนธ์/การค้นคว้าอิสระ",
		chairpersons: "ประธานกรรมการบัณฑิตศึกษา",
		officer_registrar: "เจ้าหน้าที่งานทะเบียน",
		officer_major: "เจ้าหน้าที่ประจำสาขา",
		dean: "คณบดี",
	};

	useEffect(() => {
		const fetchProfile = async () => {
			const token = localStorage.getItem("token");
			if (!token) return;
			try {
				const req = await fetch("http://localhost:8080/api/profile", {
					method: "GET",
					headers: { Authorization: `Bearer ${token}` },
				});
				const res = await req.json();
				if (!req.ok) throw new Error(res.message);
				setUserName(res.name);

				const decoded = jwtDecode(token);
				setRoles(decoded.roles || []);
				setActiveRole(decoded.role);
			} catch (err) {
				console.error("Failed to fetch profile or decode token:", err);
			}
		};

		fetchProfile();
	}, []);

	const handleSwitch = async (role) => {
		if (!role || role === activeRole) {
			return;
		}
		const res = await fetch("http://localhost:8080/api/switchRole", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${localStorage.getItem("token")}`,
			},
			body: JSON.stringify({ role }),
		});
		const data = await res.json();
		if (!res.ok) throw new Error(data.message);

		localStorage.setItem("token", data.token);

		// redirect ไป path ของ role
		if (role === "student") navigate("/student");
		if (role === "advisor") navigate("/advisor");
		if (role === "research_advisor") navigate("/research_advisor");
		if (role === "chairpersons") navigate("/chairpersons");
		if (role === "officer_registrar") navigate("/registrar-officer");
		if (role === "officer_major") navigate("/major-officer");
		if (role === "dean") navigate("/dean");
	};

	// สร้าง data สำหรับ Select: value = role key, label = ภาษาไทย
	const selectData = roles.map((r) => ({
		value: r,
		label: roleLabels[r] || r, // ถ้าไม่มี mapping ใช้ role เดิม
	}));

	return (
		<UnstyledButton className={classes.user}>
			<div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
				<Group align="center" spacing="sm">
					<Avatar radius="xl" />
					<Text size="sm" fw={500}>
						{userName}
					</Text>
				</Group>
				{activeRole !== "student" && <Select value={activeRole} onChange={handleSwitch} data={selectData} placeholder="เลือกบทบาท" style={{ width: "100%" }} size="xs" variant="default" />}
			</div>
		</UnstyledButton>
	);
}
