import { useState, useEffect } from "react";
import { Button, Group, Paper, PasswordInput, Stack, Text, TextInput, Center, Image, LoadingOverlay, Container, Title, Box, rem } from "@mantine/core";
import { useForm } from "@mantine/form";
import { useNavigate } from "react-router-dom";
import { IconUser, IconLock } from "@tabler/icons-react"; // npm install @tabler/icons-react
import myImage from "../../assets/images/logo.png";
import ModalInform from "../../component/Modal/ModalInform";

const BASE_URL = import.meta.env.VITE_API_URL;

const AuthenticationForm = () => {
	const navigate = useNavigate();
	const [loading, setLoading] = useState(false);
	const [openInform, setOpenInform] = useState(false);
	const [informMessage, setInformMessage] = useState("");
	const [informtype, setInformtype] = useState("");

	const loginForm = useForm({
		initialValues: {
			username: "",
			password: "",
		},
		validate: {
			username: (value) => (value.trim().length > 0 ? null : "กรุณากรอกชื่อผู้ใช้"),
			password: (value) => (value.trim().length > 0 ? null : "กรุณากรอกรหัสผ่าน"),
		},
	});

	useEffect(() => {
		localStorage.removeItem("token");
	}, []);

	const handleLogin = async () => {
		try {
			setLoading(true);
			const response = await fetch(`${BASE_URL}/api/login`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(loginForm.values),
			});
			const data = await response.json();
			if (!response.ok) {
				throw new Error(data.message || "เกิดข้อผิดพลาดในการเชื่อมต่อ");
			}
			localStorage.setItem("token", data.token);
			setInformMessage(data.message);
			setInformtype("success");
			setTimeout(() => {
				if (data.role === "student") {
					navigate("/student");
				} else {
					navigate("/personnel");
				}
			}, 1000);
		} catch (error) {
			console.error("Login error:", error);
			setInformMessage(error.message);
			setInformtype("error");
		} finally {
			setLoading(false);
			setOpenInform(true);
		}
	};

	return (
		<Box
			style={{
				minHeight: "100vh",
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
				// พื้นหลังแบบ Gradient ไล่โทนสีฟ้า-เทา
				background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
				padding: rem(20),
			}}
		>
			<ModalInform opened={openInform} onClose={() => setOpenInform(false)} message={informMessage} type={informtype} />

			<Container size={420} w="100%">
				<Paper radius="lg" p={40} withBorder shadow="xl" style={{ position: "relative", overflow: "hidden" }}>
					<LoadingOverlay visible={loading} zIndex={1000} overlayProps={{ radius: "sm", blur: 2 }} />

					<Stack align="center" gap="md">
						<Image src={myImage} h={160} w="auto" fit="contain" alt="University Logo" />

						<Box mb="xl">
							<Title order={3} ta="center" fw={700} c="blue.9">
								ระบบสารสนเทศบัณฑิตศึกษา
							</Title>
							<Text ta="center" size="sm" c="dimmed" fw={500}>
								มหาวิทยาลัยราชภัฏกำแพงเพชร
							</Text>
						</Box>
					</Stack>

					<form onSubmit={loginForm.onSubmit(handleLogin)}>
						<Stack gap="md">
							<TextInput label="ชื่อผู้ใช้" placeholder="ชื่อผู้ใช้ของคุณ" size="md" radius="md" leftSection={<IconUser size={18} stroke={1.5} />} {...loginForm.getInputProps("username")} />

							<PasswordInput label="รหัสผ่าน" placeholder="รหัสผ่านของคุณ" size="md" radius="md" leftSection={<IconLock size={18} stroke={1.5} />} {...loginForm.getInputProps("password")} />

							<Button type="submit" fullWidth size="md" radius="md" mt="xl" variant="filled" color="blue.8" style={{ transition: "transform 0.1s ease" }} active={{ transform: "scale(0.98)" }}>
								เข้าสู่ระบบ
							</Button>
						</Stack>
					</form>

					{/* <Text ta="center" size="xs" c="dimmed" mt="xl">
						&copy; {new Date().getFullYear()} Kamphaeng Phet Rajabhat University
					</Text> */}
				</Paper>
			</Container>
		</Box>
	);
};

export default AuthenticationForm;
