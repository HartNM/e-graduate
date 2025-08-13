import { useState } from "react";
import { Button, Group, Paper, PasswordInput, Stack, Text, TextInput, Center, Space, Image, LoadingOverlay } from "@mantine/core";
import { useForm } from "@mantine/form";
import { useNavigate } from "react-router-dom";
import myImage from "../../assets/logo.png";
import ModalInform from "../../component/Modal/ModalInform";

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
			username: (value) => (value.trim().length > 0 ? null : "กรอกชื่อผู้ใช้"),
			password: (value) => (value.trim().length > 0 ? null : "กรอกรหัสผ่าน"),
		},
	});

	const handleLogin = async () => {
		setLoading(true);
		try {
			const response = await fetch("http://localhost:8080/api/login", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(loginForm.values),
			});
			const data = await response.json();
			if (!response.ok) {
				throw new Error(data.message);
			}
			localStorage.setItem("token", data.token);
			setInformMessage(data.message);
			setInformtype("success");
			setTimeout(() => {
				const routeMap = {
					student: "/student",
					dean: "/dean",
					officer_major: "/major-officer",
					chairpersons: "/graduate-committee-chair",
					officer_registrar: "/registrar-officer",
					advisor: "/advisor",
				};
				navigate(routeMap[data.role] || "/");
			}, 1000);
		} catch (error) {
			console.error("Login error:", error);
			setInformtype("error");
			setInformMessage(error.message);
		} finally {
			setLoading(false);
			setOpenInform(true);
		}
	};

	return (
		<Center bg="#e9ecef" h="100vh">
			<ModalInform opened={openInform} onClose={() => setOpenInform(false)} message={informMessage} type={informtype} />
			<Paper radius="md" p="lg" withBorder style={{ maxWidth: 400, minWidth: 400 }}>
				<LoadingOverlay visible={loading} zIndex={1000} overlayProps={{ radius: "sm", blur: 2 }} />
				<Space h="xl" />
				<Center>
					<Image src={myImage} h={200} w="auto" fit="contain" />
				</Center>
				<Space h="xl" />
				<Center style={{ flexDirection: "column" }}>
					<Text size="lg" fw={500}>
						ระบบสารสนเทศบัณฑิตศึกษา
					</Text>
					<Text size="lg" fw={500}>
						มหาวิทยาลัยราชภัฏกําแพงเพชร
					</Text>
				</Center>
				<Space h="xl" />
				<form onSubmit={loginForm.onSubmit(handleLogin)}>
					<Stack>
						<TextInput label="ชื่อผู้ใช้" placeholder="ชื่อผู้ใช้ของคุณ" radius="md" {...loginForm.getInputProps("username")} />
						<PasswordInput label="รหัสผ่าน" placeholder="รหัสผ่านของคุณ" radius="md" {...loginForm.getInputProps("password")} />
					</Stack>
					<Group mt="xl">
						<Button type="submit" fullWidth>
							Login
						</Button>
					</Group>
				</form>
			</Paper>
		</Center>
	);
};

export default AuthenticationForm;
