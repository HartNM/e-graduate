import { useEffect } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { AppShell, Box, Burger, Text, Image, Space } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { NavbarNested } from "../component/Navbar";
import myImage from "../assets/logo.png";
import { Suspense } from "react";
import LoadingScreen from "../component/LoadingScreen.jsx";
import { ActionIcon, useMantineColorScheme, useComputedColorScheme } from "@mantine/core";
import { IconSun, IconMoon } from "@tabler/icons-react";

const UserLayout = (item) => {
	const navigate = useNavigate();
	const [opened, { toggle }] = useDisclosure();
	const location = useLocation();

	useEffect(() => {
		toggle(false);
	}, [location]);

	useEffect(() => {
		const token = localStorage.getItem("token");
		if (!token) {
			navigate("/login");
		}
	}, [navigate]);

	const { setColorScheme } = useMantineColorScheme();
	const computedColorScheme = useComputedColorScheme("light", { getInitialValueInEffect: true });

	return (
		<AppShell header={{ height: 60 }} navbar={{ width: 300, breakpoint: "sm", collapsed: { mobile: !opened } }} padding="md" style={{ backgroundColor: "#f1f3f5" }}>
			<AppShell.Header style={{ display: "Flex", alignItems: "Center", justifyContent: "space-between" }}>
				<Box style={{ display: "Flex", alignItems: "Center", marginLeft: "20px" }}>
					<Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
					<Space w="md" hiddenFrom="sm" />
					<Image src={myImage} h="40" w="auto" fit="contain" />
					<Space w="md" />
					<Text>ระบบสารสนเทศบัณฑิตศึกษา</Text>
				</Box>
				<Box style={{ display: "Flex", alignItems: "Center", marginRight: "20px" }}>
					{/* <ActionIcon onClick={() => setColorScheme(computedColorScheme === "light" ? "dark" : "light")} variant="default" size="xl" aria-label="Toggle color scheme">
						<Box lightHidden>
							<IconSun stroke={1.5} />
						</Box>
						<Box darkHidden>
							<IconMoon stroke={1.5} />
						</Box>
					</ActionIcon> */}
				</Box>
			</AppShell.Header>

			<AppShell.Navbar>
				<NavbarNested menu={item.item} />
			</AppShell.Navbar>

			<AppShell.Main>
				<Box style={{ backgroundColor: "#fff", color: "#000000", border: "1px solid #e0e0e0", borderRadius: "8px", padding: "16px" }}>
					<Outlet />
				</Box>
			</AppShell.Main>
		</AppShell>
	);
};

export default UserLayout;
