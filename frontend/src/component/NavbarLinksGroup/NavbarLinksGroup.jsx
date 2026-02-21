import { useState } from "react";
import { IconChevronRight } from "@tabler/icons-react";
import { Box, Collapse, Group, Text, ThemeIcon, UnstyledButton, Badge } from "@mantine/core";
import classes from "./NavbarLinksGroup.module.css";
import { Link, useLocation } from "react-router-dom";

export function LinksGroup({ icon: Icon, label, initiallyOpened, links, badge }) {
	// links: อาจเป็น Array (เมนูย่อย) หรือ String (Link ปลายทาง) ขึ้นอยู่กับข้อมูลที่ส่งมา
	const hasLinks = Array.isArray(links);
	const location = useLocation();

	// เช็คว่าควรเปิดเมนูค้างไว้ไหม
	const shouldOpen = hasLinks ? links.some((subLink) => subLink.link === location.pathname) : false;
	const [opened, setOpened] = useState(initiallyOpened || shouldOpen);

	// สร้างรายการเมนูย่อย (ถ้ามี)
	const items = (hasLinks ? links : []).map((subLink) => (
		<Text component={Link} to={subLink.link} className={classes.link} data-active={location.pathname === subLink.link || undefined} key={subLink.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingRight: "1rem" }}>
			<span>{subLink.label}</span>
			{subLink.badge > 0 && (
				<Badge size="xs" circle color="red">
					{subLink.badge}
				</Badge>
			)}
		</Text>
	));

	return (
		<>
			<UnstyledButton
				// 🟢 จุดสำคัญ 1: ถ้ามีลูกให้เป็นปุ่มกด toggle, ถ้าไม่มีลูกให้เป็น Link เปลี่ยนหน้า
				component={hasLinks ? "button" : Link}
				to={!hasLinks ? links : undefined} // ถ้าเป็น Link ให้ใช้ค่า links เป็น path
				// 🟢 จุดสำคัญ 2: สั่งเปิด/ปิดเฉพาะตอนที่มีเมนูย่อย
				onClick={() => {
					if (hasLinks) setOpened((o) => !o);
				}}
				className={classes.control}
				data-active={(!hasLinks && location.pathname === links) || undefined} // Highlight เมนูแม่ถ้าอยู่ที่หน้านั้น
			>
				<Group justify="space-between" gap={0} className={classes.mainlink}>
					<Box style={{ display: "flex", alignItems: "center", flex: 1 }}>
						<ThemeIcon variant="light" size={30}>
							<Icon size={18} />
						</ThemeIcon>
						<Box ml="md">{label}</Box>
					</Box>

					{/* แสดง Badge และลูกศร */}
					<Group gap="xs">
						{badge > 0 && (
							<Badge size="xs" variant="filled" color="red" circle>
								{badge}
							</Badge>
						)}
						{/* แสดงลูกศรเฉพาะเมื่อมีเมนูย่อย */}
						{hasLinks && <IconChevronRight className={classes.chevron} stroke={1.5} size={16} style={{ transform: opened ? "rotate(-90deg)" : "none" }} />}
					</Group>
				</Group>
			</UnstyledButton>

			{/* แสดงเมนูย่อยเมื่อเปิด */}
			{hasLinks ? <Collapse in={opened}>{items}</Collapse> : null}
		</>
	);
}
