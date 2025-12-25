import { useEffect, useState } from "react";
import { Avatar, Group, Text, UnstyledButton, Select, Box } from "@mantine/core";
import classes from "./UserButton.module.css";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
const BASE_URL = import.meta.env.VITE_API_URL;

export function UserButton() {
	const navigate = useNavigate();
	const [userName, setUserName] = useState("");
	const [roles, setRoles] = useState([]);
	const [activeRole, setActiveRole] = useState("");

	// Mapping role -> label ภาษาไทย
	const roleLabels = {
		admin: "admin",
		student: "นักศึกษา",
		advisor: "อาจารย์ที่ปรึกษาหมู่เรียน",
		research_advisor: "อาจารย์ที่ปรึกษาวิทยานิพนธ์/การค้นคว้าอิสระ",
		chairpersons: "ประธานกรรมการบัณฑิตศึกษา",
		officer_registrar: "เจ้าหน้าที่งานทะเบียน",
		officer_major: "เจ้าหน้าที่ประจำสาขา",
		dean: "คณบดี",
	};

	const navigateToRoleDashboard = (role) => {
		switch (role) {
			case "student":
				navigate("/student");
				break;
			case "admin":
				navigate("/admin");
				break;
			case "advisor":
				navigate("/advisor");
				break;
			case "research_advisor":
				navigate("/research_advisor");
				break;
			case "chairpersons":
				navigate("/chairpersons");
				break;
			case "officer_registrar":
				navigate("/registrar-officer");
				break;
			case "officer_major":
				navigate("/major-officer");
				break;
			case "dean":
				navigate("/dean");
				break;
			default:
				console.warn(`No navigation path defined for role: ${role}`);
				navigate("/");
		}
	};

	useEffect(() => {
		const fetchProfile = async () => {
			const token = localStorage.getItem("token");
			if (!token) return;
			try {
				const decoded = jwtDecode(token);

				console.log(decoded);
				setRoles(decoded.roles || []);
				setActiveRole(decoded.role);
				setUserName(decoded.name);

				if (decoded.role) {
					navigateToRoleDashboard(decoded.role);
				}
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
		const res = await fetch(`${BASE_URL}/api/switchRole`, {
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

		navigateToRoleDashboard(role);
	};

	// สร้าง data สำหรับ Select: value = role key, label = ภาษาไทย
	const selectData = roles.map((r) => ({
		value: r,
		label: roleLabels[r] || r, // ถ้าไม่มี mapping ใช้ role เดิม
	}));

	return (
		<Box style={{ borderBottom: "1px solid var(--mantine-color-gray-2)" }}>
			<UnstyledButton className={classes.user} style={{ width: "100%", padding: "12px"/* , borderRadius: "12px", backgroundColor: "var(--mantine-color-gray-0)"  */}}>
				<Group>
					{/* <Avatar src={null} alt={userName} color="blue" radius="xl">
						{userName?.charAt(0)}
					</Avatar> */}
					<Avatar color="blue" radius="xl" />
					<div style={{ flex: 1 }}>
						<Text size="sm" fw={600} c="dark">
							{userName}
						</Text>
					</div>
				</Group>
				{activeRole !== "student" && <Select mt="md" value={activeRole} onChange={handleSwitch} data={selectData} size="xs" radius="md" placeholder="เลือกบทบาท"/>}
			</UnstyledButton>
		</Box>
	);
}
