import { useState } from "react";
import { Button, Group, Paper, PasswordInput, Stack, Text, TextInput, Center, Space, Image, LoadingOverlay } from "@mantine/core";
import { useForm } from "@mantine/form";
import { useNavigate } from "react-router-dom";
import myImage from "../../assets/logo.png";
import ModalInform from "../../component/Modal/ModalInform";

const AuthenticationForm = () => {
	const navigate = useNavigate();
	const [loading, setLoading] = useState(false);
	const [modalOpen, setModalOpen] = useState(false);
	const [modalMessage, setModalMessage] = useState("");
	const [type, setType] = useState("");

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
		let data;
		try {
			const response = await fetch("http://localhost:8080/api/login", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(loginForm.values),
			});

			data = await response.json();
			if (response.ok && data.token) {
				localStorage.setItem("token", data.token);
				setModalMessage(data.message)
				setType("success");
				setTimeout(() => {
					switch (data.role) {
						case "student":
							navigate("/student");
							break;
						case "dean":
							navigate("/dean");
							break;
						case "officer_faculty":
							navigate("/faculty-officer");
							break;
						case "chairpersons":
							navigate("/graduate-committee-chair");
							break;
						case "officer_registrar":
							navigate("/registrar-officer");
							break;
						case "advisor":
							navigate("/advisor");
							break;
						default:
							navigate("/");
					}
					/* window.location.reload(); */
				}, 1000);
			} else {
				setType("error");
			}
		} catch (error) {
			setType("error");
			console.error("Login error:", error);
		}
		setLoading(false);
		setModalMessage(data.message || "เกิดข้อผิดพลาดจากเซิร์ฟเวอร์");
		setModalOpen(true);
	};

	return (
		<>
			<Center bg="#e9ecef" h="100vh">
				<Paper radius="md" p="lg" withBorder style={{ maxWidth: 400, minWidth: 400, margin: "auto" }}>
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
			<ModalInform opened={modalOpen} onClose={() => setModalOpen(false)} message={modalMessage} type={type} />
		</>
	);
};

export default AuthenticationForm;
