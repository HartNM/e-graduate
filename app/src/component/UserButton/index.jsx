import { useEffect, useState } from "react";
import { Avatar, Group, Text, UnstyledButton } from "@mantine/core";
import classes from "./UserButton.module.css";

export function UserButton() {
	const [user, setUser] = useState("");

	const token = localStorage.getItem("token");
	useEffect(() => {
		const fetchProfile = async () => {
			try {
				const res = await fetch("http://localhost:8080/api/profile", {
					method: "GET",
					headers: { Authorization: `Bearer ${token}` },
				});
				if (!res.ok) {
					throw new Error("Failed to fetch profile");
				}
				const data = await res.json();
				setUser(data.name);
				console.log(data.name);
			} catch (err) {
				console.error("Error fetching profile:", err);
			}
		};
		fetchProfile();
	}, []);

	return (
		<UnstyledButton className={classes.user}>
			<Group>
				<Avatar radius="xl" />
				<div style={{ flex: 1 }}>
					<Text size="sm" fw={500}>
						{user}
					</Text>
				</div>
			</Group>
		</UnstyledButton>
	);
}
