import { useEffect, useState } from "react";
import { Avatar, Group, Text, UnstyledButton } from "@mantine/core";
import classes from "./UserButton.module.css";
import { useNavigate } from "react-router-dom";

export function UserButton() {
	const [user, setUser] = useState("");
	const navigate = useNavigate();

	const token = localStorage.getItem("token");
	useEffect(() => {
		if (!token) {
			navigate("/login");
			return;
		}
		fetch("http://localhost:8080/api/profile", {
			method: "GET",
			headers: { Authorization: `Bearer ${token}` },
		})
			.then((res) => {
				if (res.status === 401 || res.status === 403) {
					localStorage.removeItem("token");
					navigate("/login");
					return;
				}
				if (!res.ok) throw new Error("Failed to fetch profile");
				return res.json();
			})
			.then((data) => setUser(data.name))
			.catch((err) => console.error("Error fetching profile:", err));
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
