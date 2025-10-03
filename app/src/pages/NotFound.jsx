import React from "react";
import { Container, Title, Text, Button, Group } from "@mantine/core";
import { useNavigate } from "react-router-dom";

const NotFound = () => {
	const navigate = useNavigate();

	return (
		<Container style={{ textAlign: "center", marginTop: "80px" }}>
			<Title order={1} style={{ fontSize: "48px", marginBottom: "16px" }}>
				404 - Page Not Found
			</Title>
			<Text size="lg" color="dimmed">
				ขออภัย ไม่พบหน้าที่คุณกำลังค้นหา
			</Text>
			<Group justify="center" mt="xl">
        <Button onClick={() => navigate("/login")}>กลับหน้าหลัก</Button>
      </Group>
		</Container>
	);
};

export default NotFound;
