//NavbarNested
import { Box, ScrollArea, Select } from "@mantine/core";
import { IconLogout } from "@tabler/icons-react";
import { LinksGroup } from "../NavbarLinksGroup/NavbarLinksGroup.jsx";
import { UserButton } from "../UserButton/UserButton.jsx";
import classes from "./Navbar.module.css";
import { Text } from "@mantine/core";
import { useNavigate } from "react-router-dom";

export function NavbarNested(menu) {
	const links = menu.menu.map((item) => <LinksGroup {...item} key={item.label} />);
	const navigate = useNavigate();

	const handleLogout = () => {
		navigate("/login");
	};

	return (
		<nav className={classes.nav}>
			<Box>
				<UserButton />
			</Box>

			<ScrollArea style={{ flex: 1 }}>
				<Box>{links}</Box>
			</ScrollArea>

			<Box className={classes.footer}>
				<Text className={classes.logout} onClick={handleLogout}>
					<IconLogout className={classes.linkIcon} stroke={1.5} />
					<span>ออกจากระบบ</span>
				</Text>
			</Box>
		</nav>
	);
}
