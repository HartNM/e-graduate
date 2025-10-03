import { Box, ScrollArea, Select } from "@mantine/core";
import { IconLogout } from "@tabler/icons-react";
import { LinksGroup } from "../NavbarLinksGroup";
import { UserButton } from "../UserButton";
import classes from "./Navbar.module.css";
import { Text } from "@mantine/core";
import { useNavigate } from "react-router-dom";

export function NavbarNested(menu) {
	const links = menu.menu.map((item) => <LinksGroup {...item} key={item.label} />);
	const navigate = useNavigate();

	return (
		<nav className={classes.nav}>
			<Box>
				<UserButton />
			</Box>

			<ScrollArea style={{ flex: 1 }}>
				<Box>{links}</Box>
			</ScrollArea>

			<Box className={classes.footer}>
				<Text
					className={classes.link}
					onClick={() => {
						navigate("/login");
					}}
					style={{ cursor: "pointer" }}
				>
					<IconLogout className={classes.linkIcon} stroke={1.5} />
					<span>Logout</span>
				</Text>
			</Box>
		</nav>
	);
}
