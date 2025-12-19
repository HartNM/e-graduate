//userLayout
import { useEffect } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { AppShell, Box, Burger, Text, Image, Space } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { NavbarNested } from "../component/Navbar/Navbar.jsx";
import myImage from "../assets/logo.png";
import { jwtDecode } from "jwt-decode";

const UserLayout = (item) => {
	const navigate = useNavigate();
	const [opened, { toggle }] = useDisclosure();
	const location = useLocation();

	useEffect(() => {
		toggle(false);
	}, [location]);

	const token = localStorage.getItem("token");

	const decoded = jwtDecode(token);
	const now = Date.now() / 1000; // วินาทีปัจจุบัน
	if (decoded.exp && decoded.exp < now) {
		return navigate("/login");
	}

	return (
		<AppShell header={{ height: 70 }} navbar={{ width: 300, breakpoint: "sm", collapsed: { mobile: !opened } }} padding="md" style={{ backgroundColor: "var(--mantine-color-gray-0)" }}>
			<AppShell.Header px="md" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid var(--mantine-color-gray-2)", boxShadow: "0 2px 4px rgba(0,0,0,0.02)" }}>
				<Box style={{ display: "flex", alignItems: "center" }}>
					<Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
					<Image src={myImage} h={45} w="auto" fit="contain" />
					<Space w="md" />
					<Text>ระบบสารสนเทศบัณฑิตศึกษา</Text>
				</Box>
			</AppShell.Header>

			<AppShell.Navbar p="0">
				<NavbarNested menu={item.item} />
			</AppShell.Navbar>

			<AppShell.Main>
				<Box
					style={{
						backgroundColor: "#fff",
						minHeight: "calc(100vh - 120px)",
						borderRadius: "16px",
						border: "1px solid var(--mantine-color-gray-2)",
						boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03)",
						padding: "24px",
					}}
				>
					<Outlet />
				</Box>
			</AppShell.Main>
		</AppShell>
	);
};

export default UserLayout;
