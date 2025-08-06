//แต่งตั้งเจ้าหน้าที่ประจำคณะ
import { useState, useEffect } from "react";
import { Box, Text, TextInput, Table, Button, Modal, Space, ScrollArea, PasswordInput, Group, Select, Flex } from "@mantine/core";
import { useForm } from "@mantine/form";
import ModalInform from "../../component/Modal/ModalInform";

const AssignFacultyOfficer = () => {
	const [reloadTable, setReloadTable] = useState(false);
	const token = localStorage.getItem("token");
	const [assignFacultyOfficer, setAssignFacultyOfficer] = useState([]);
	const [openModal, setOpenModal] = useState(false);
	const [modalType, setModalType] = useState(false);
	const [faculty, setFaculty] = useState(["คณะครุศาสตร์", "คณะวิทยาการจัดการ", "คณะเทคโนโลยีอุตสาหกรรม", "คณะวิทยาศาสตร์และเทคโนโลยี", "คณะมนุษยศาสตร์และสังคมศาสตร์", "คณะพยาบาลศาสตร์"]);

	const [openInform, setOpenInform] = useState(false);
	const [informMessage, setInformMessage] = useState("");
	const [informtype, setInformtype] = useState("");

	const Form = useForm({
		initialValues: {
			officer_faculty_id: "",
			officer_faculty_name: "",
			faculty_name: "",
			password: "",
		},
		validate: {
			officer_faculty_id: (value) => (value.trim().length > 0 ? null : "กรุณากรอกรหัสบัตร"),
			officer_faculty_name: (value) => (value.trim().length > 0 ? null : "กรุณากรอกชื่อ"),
			faculty_name: (value) => (value.trim().length > 0 ? null : "กรุณาเลือกคณะ"),
			password: (value) => (value.trim().length > 0 ? null : "กรุณากรอกรหัสผ่าน"),
		},
	});

	useEffect(() => {
		const fetchRequestExamInfoAll = async () => {
			try {
				const requestRes = await fetch("http://localhost:8080/api/allAssignFacultyOfficer", {
					method: "POST",
					headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
				});
				const requestData = await requestRes.json();
				if (!requestRes.ok) {
					throw new Error(requestData.message);
				}
				setAssignFacultyOfficer(requestData);
				console.log(requestData);
			} catch (error) {
				setInformtype("error");
				setInformMessage(error.message);
				setOpenInform(true);
				console.error("Error fetch requestExamInfoAll:", err);
			}
			setReloadTable(false);
		};
		fetchRequestExamInfoAll();
	}, [reloadTable]);

	const handleOpenAdd = () => {
		Form.setValues({
			officer_faculty_id: "",
			officer_faculty_name: "",
			faculty_name: "",
			password: "",
		});
		setModalType("add");
		setOpenModal(true);
	};

	const handleOpenEdit = (item) => {
		Form.setValues({
			officer_faculty_id: item.officer_faculty_id,
			officer_faculty_name: item.officer_faculty_name,
			faculty_name: item.faculty_name,
		});
		setModalType("edit");
		setOpenModal(true);
	};

	const handleOpenDelete = (item) => {
		Form.setValues({
			officer_faculty_id: item.officer_faculty_id,
			officer_faculty_name: item.officer_faculty_name,
			faculty_name: item.faculty_name,
		});
		setModalType("delete");
		setOpenModal(true);
	};

	const handleAddFacultyOfficer = async () => {
		try {
			const requestRes = await fetch("http://localhost:8080/api/addAssignFacultyOfficer", {
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

			setReloadTable(true);
			setOpenModal(false);
			setOpenInform(true);
		} catch (err) {
			setInformtype("error");
			setInformMessage(err.message);
			setOpenInform(true);
			console.error("Error fetch addAssignFacultyOfficer:", err);
		}
	};

	const handleEditFacultyOfficer = async () => {
		try {
			const requestRes = await fetch("http://localhost:8080/api/editAssignFacultyOfficer", {
				method: "POST",
				headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
				body: JSON.stringify(Form.values),
			});
			const requestData = await requestRes.json();
			if (!requestRes.ok) {
				throw new Error(requestData.message);
			}
			setInformMessage(requestData.message);
			setInformtype("success");
			setReloadTable(true);
			setOpenModal(false);
			setOpenInform(true);
		} catch (err) {
			console.error("Error fetch addAssignFacultyOfficer:", err);
			setInformtype("error");
			setInformMessage(err.message);
			setOpenInform(true);
		}
	};

	const handleDeleteFacultyOfficer = async () => {
		console.log("asd");
		try {
			const requestRes = await fetch("http://localhost:8080/api/deleteAssignFacultyOfficer", {
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

	const classRows = assignFacultyOfficer.map((item) => (
		<Table.Tr key={item.officer_faculty_id}>
			<Table.Td>{item.faculty_name}</Table.Td>
			<Table.Td>{item.officer_faculty_name}</Table.Td>
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

	const handleSubmit = () => {		
		if (modalType === "add") return Form.onSubmit(handleAddFacultyOfficer);
		if (modalType === "edit") return Form.onSubmit(handleEditFacultyOfficer);
		if (modalType === "delete") return Form.onSubmit(handleDeleteFacultyOfficer);
		return (e) => e.preventDefault();
	};

	return (
		<Box>
			<ModalInform opened={openInform} onClose={() => setOpenInform(false)} message={informMessage} type={informtype} />
			<Modal opened={openModal} onClose={() => setOpenModal(false)} title="แต่งตั้งเจ้าหน้าที่ประจำคณะ" centered>
				<Box>
					<form onSubmit={handleSubmit()}>
						<Select label="เลือกคณะ" data={faculty} {...Form.getInputProps("faculty_name")} disabled={modalType === "delete" ? true : false}></Select>
						<TextInput label="รหัสบัตร" {...Form.getInputProps("officer_faculty_id")} disabled={modalType === "add" ? false : true} />
						<TextInput label="ชื่อ" {...Form.getInputProps("officer_faculty_name")} disabled={modalType === "delete" ? true : false} />
						{modalType === "add" && <PasswordInput label="รหัสผ่าน" {...Form.getInputProps("password")} />}
						<Space h="md" />
						<Button color={modalType === "delete" ? "red" : "green"} type="submit" fullWidth>
							{modalType === "delete" ? "ลบ" : "บันทึก"}
						</Button>
					</form>
				</Box>
			</Modal>

			<Text size="1.5rem" fw={900} mb="md">
				แต่งตั้งเจ้าหน้าที่ประจำสาขา
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
							<Table.Th>คณะ</Table.Th>
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

export default AssignFacultyOfficer;
