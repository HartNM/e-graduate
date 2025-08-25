//แต่งตั้งประธานกรรมการบัณฑิตศึกษาประจำสาขา
import { useState, useEffect } from "react";
import { Box, Text, TextInput, Table, Button, Modal, Space, ScrollArea, PasswordInput, Group, Select } from "@mantine/core";
import { useForm } from "@mantine/form";
import ModalInform from "../../component/Modal/ModalInform";

const AssignChairpersons = () => {
	const [openModal, setOpenModal] = useState(false);
	const [modalType, setModalType] = useState(false);

	const [openInform, setOpenInform] = useState(false);
	const [informMessage, setInformMessage] = useState("");
	const [informtype, setInformtype] = useState("");

	const [reloadTable, setReloadTable] = useState(false);
	const token = localStorage.getItem("token");

	const [assignChairpersons, setAssignChairpersons] = useState([]);
	const [major, setMajor] = useState(["การบริหารการศึกษา", "ยุทธศาสตร์การบริหารและการพัฒนา", "การจัดการสมัยใหม่", "รัฐประศาสนศาสตร์", "วิทยาศาสตร์ศึกษา"]);
	const Form = useForm({
		initialValues: {
			chairpersons_id: "",
			chairpersons_name: "",
			major_name: "",
			password: "",
		},
		validate: {
			chairpersons_id: (value) => (value.trim().length > 0 ? null : "กรุณากรอกรหัสบัตร"),
			chairpersons_name: (value) => (value.trim().length > 0 ? null : "กรุณากรอกชื่อ"),
			major_name: (value) => (value.trim().length > 0 ? null : "กรุณาเลือกคณะ"),
			password: (value) => {
				if (modalType === "delete" || modalType === "edit") return null;
				return value.trim().length > 0 ? null : "กรุณากรอกรหัสผ่าน";
			},
		},
	});

	const [user, setUser] = useState("");

	useEffect(() => {
		const fetchProfile = async () => {
			try {
				const profileRes = await fetch("http://localhost:8080/api/profile", {
					method: "GET",
					headers: { Authorization: `Bearer ${token}` },
				});
				const profileData = await profileRes.json();
				setUser(profileData);
				console.log(profileData);
			} catch (err) {
				setInformtype("error");
				setInformMessage("เกิดข้อผิดพลาดในการเชื่อมต่อกับระบบ");
				setOpenInform(true);
				console.error("Error fetching profile:", err);
			}
		};
		fetchProfile();
	}, []);

	useEffect(() => {
		if (!user) return;
		const fetchRequestExamInfoAll = async () => {
			try {
				const requestRes = await fetch("http://localhost:8080/api/allAssignChairpersons", {
					method: "POST",
					headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
					body: JSON.stringify({ id: user.id }),
				});
				const requestData = await requestRes.json();
				if (!requestRes.ok) {
					throw new Error(requestData.message);
				}
				setAssignChairpersons(requestData);
				console.log(requestData);
			} catch (err) {
				setInformtype("error");
				setInformMessage(err.message);
				setOpenInform(true);
				console.error("Error fetch allAssignChairpersons:", err);
			}
			setReloadTable(false);
		};
		fetchRequestExamInfoAll();
	}, [user, reloadTable]);

	const handleOpenAdd = () => {
		Form.reset();
		Form.setValues({ major_name: user.id });
		setModalType("add");
		setOpenModal(true);
	};

	const handleOpenEdit = (item) => {
		Form.setValues(item);
		setModalType("edit");
		setOpenModal(true);
	};

	const handleOpenDelete = (item) => {
		Form.setValues(item);
		setModalType("delete");
		setOpenModal(true);
	};

	const handleSubmit = async () => {
		console.log("qweqweqwe");

		const url = {
			add: "http://localhost:8080/api/addAssignChairpersons",
			edit: "http://localhost:8080/api/editAssignChairpersons",
			delete: "http://localhost:8080/api/deleteAssignChairpersons",
		};
		try {
			const requestRes = await fetch(url[modalType], {
				method: "POST",
				headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
				body: JSON.stringify(Form.values),
			});
			const requestData = await requestRes.json();
			if (!requestRes.ok) {
				throw new Error(requestData.message);
			}
			setInformtype("success");
			setInformMessage(requestData.message);
			setOpenInform(true);
			setReloadTable(true);
			setOpenModal(false);
		} catch (err) {
			setInformtype("error");
			setInformMessage(err.message);
			setOpenInform(true);
			console.error("Error fetch deleteAssignChairpersons:", err);
		}
	};

	const classRows = assignChairpersons.map((item) => (
		<Table.Tr key={item.chairpersons_id}>
			<Table.Td>{item.major_name}</Table.Td>
			<Table.Td>{item.chairpersons_name}</Table.Td>
			<Table.Td>
				<Group>
					<Button color="yellow" size="xs" onClick={() => handleOpenEdit(item)}>
						แก้ไข
					</Button>
					<Button color="red" size="xs" onClick={() => handleOpenDelete(item)}>
						ลบ
					</Button>
				</Group>
			</Table.Td>
		</Table.Tr>
	));

	return (
		<Box>
			<ModalInform opened={openInform} onClose={() => setOpenInform(false)} message={informMessage} type={informtype} />
			<Modal opened={openModal} onClose={() => setOpenModal(false)} title="แต่งตั้งประธานกรรมการบัณฑิตศึกษาประจำสาขา" centered>
				<form onSubmit={Form.onSubmit(handleSubmit)}>
					<Select label="สาขา" data={major} {...Form.getInputProps("major_name")} disabled></Select>
					<TextInput label="รหัสบัตร" {...Form.getInputProps("chairpersons_id")} disabled={modalType === "add" ? false : true} />
					<TextInput label="ชื่อ" {...Form.getInputProps("chairpersons_name")} disabled={modalType === "delete" ? true : false} />
					{modalType === "add" && <PasswordInput label="รหัสผ่าน" {...Form.getInputProps("password")} />}
					<Space h="md" />
					<Button color={modalType === "delete" ? "red" : "green"} type="submit" fullWidth>
						{modalType === "delete" ? "ลบ" : "บันทึก"}
					</Button>
				</form>
			</Modal>

			<Text size="1.5rem" fw={900} mb="md">
				แต่งตั้งประธานกรรมการบัณฑิตศึกษา
			</Text>
			<Space h="xl" />
			<Group justify="space-between">
				<Box></Box>
				<Box>
					<Button variant="filled" size="xs" onClick={() => handleOpenAdd()}>
						เพิ่ม
					</Button>
				</Box>
			</Group>
			<Space h="xl" />
			<ScrollArea type="scroll" offsetScrollbars style={{ borderRadius: "8px", border: "1px solid #e0e0e0" }}>
				<Table horizontalSpacing="sm" verticalSpacing="sm" highlightOnHover>
					<Table.Thead>
						<Table.Tr>
							<Table.Th>สาขา</Table.Th>
							<Table.Th>อาจารย์</Table.Th>
							<Table.Th>การดำเนินการ</Table.Th>
						</Table.Tr>
					</Table.Thead>
					<Table.Tbody>{classRows}</Table.Tbody>
				</Table>
			</ScrollArea>
		</Box>
	);
};

export default AssignChairpersons;
