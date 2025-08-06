import { useState } from "react";
import { IconChevronRight } from "@tabler/icons-react";
import { Box, Collapse, Group, Text, ThemeIcon, UnstyledButton } from "@mantine/core";
import classes from "./NavbarLinksGroup.module.css";
import { Link } from "react-router-dom";

export function LinksGroup({ icon: Icon, label, initiallyOpened, links }) {
	const hasLinks = Array.isArray(links);
	const [opened, setOpened] = useState(initiallyOpened || false);

	const items = (hasLinks ? links : []).map((link) => (
		<Text component={Link} to={link.link} className={classes.link} key={link.label}>
			{link.label}{" "}
		</Text>
	));

	return (
		<>
			<UnstyledButton onClick={() => setOpened((o) => !o)} className={classes.control}>
				{hasLinks ? (
					<Group justify="space-between" gap={0} className={classes.mainlink}>
						<Box style={{ display: "flex", alignItems: "center" ,flex: 1}}>
							<ThemeIcon variant="light" size={30}>
								<Icon size={18} />
							</ThemeIcon>
							<Text ml="md">{label}</Text>
						</Box>
						{hasLinks && <IconChevronRight className={classes.chevron} stroke={1.5} size={16} style={{ transform: opened ? "rotate(-90deg)" : "none" }} />}
					</Group>
				) : (
					<Group justify="space-between" gap={0} className={classes.mainlink} component={Link} to={links}>
						<Box style={{ display: "flex", alignItems: "center" ,flex: 1}}>
							<ThemeIcon variant="light" size={30}>
								<Icon size={18} />
							</ThemeIcon>
							<Text ml="md">{label}</Text>
						</Box>
					</Group>
				)}
			</UnstyledButton>
			{hasLinks ? <Collapse in={opened}>{items}</Collapse> : null}
		</>
	);
}

export function NavbarLinksGroup(data) {
	return (
		<Box mih={220} p="md">
			<LinksGroup {...data} />
		</Box>
	);
}
