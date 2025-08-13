//แต่งตั้งเจ้าหน้าที่ประจำคณะ
import { useState, useEffect } from "react";
import { Box, Text, TextInput, Table, Button, Modal, Space, ScrollArea, PasswordInput, Group, Select, Flex } from "@mantine/core";
import { useForm } from "@mantine/form";
import ModalInform from "../../component/Modal/ModalInform";

const AssignMajorOfficer = () => {
	const [reloadTable, setReloadTable] = useState(false);
	const token = localStorage.getItem("token");
	const [assignMajorOfficer, setAssignMajorOfficer] = useState([]);
	const [openModal, setOpenModal] = useState(false);
	const [modalType, setModalType] = useState(false);
	const [major, setMajor] = useState(["การบริหารการศึกษา", "ยุทธศาสตร์การบริหารและการพัฒนา", "การจัดการสมัยใหม่", "รัฐประศาสนศาสตร์", "วิทยาศาสตร์ศึกษา"]);
	
	const [openInform, setOpenInform] = useState(false);
	const [informMessage, setInformMessage] = useState("");
	const [informtype, setInformtype] = useState("");

	const Form = useForm({
		initialValues: {
			officer_major_id: "",
			officer_major_name: "",
			major_name: "",
			password: "",
		},
		validate: {
			officer_major_id: (value) => (value.trim().length > 0 ? null : "กรุณากรอกรหัสบัตร"),
			officer_major_name: (value) => (value.trim().length > 0 ? null : "กรุณากรอกชื่อ"),
			major_name: (value) => (value.trim().length > 0 ? null : "กรุณาเลือกสาขา"),
			password: (value) => {
				if (modalType === "delete" || modalType === "edit") return null;
				return value.trim().length > 0 ? null : "กรุณากรอกรหัสผ่าน";
			},
		},
	});

	useEffect(() => {
		const fetchRequestExamInfoAll = async () => {
			try {
				const requestRes = await fetch("http://localhost:8080/api/allAssignMajorOfficer", {
					method: "POST",
					headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
				});
				const requestData = await requestRes.json();
				if (!requestRes.ok) {
					throw new Error(requestData.message);
				}
				setAssignMajorOfficer(requestData);
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
		Form.reset();
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
		const url = {
			add: "http://localhost:8080/api/addAssignMajorOfficer",
			edit: "http://localhost:8080/api/editAssignMajorOfficer",
			delete: "http://localhost:8080/api/deleteAssignMajorOfficer",
		};
		console.log(url[modalType]);
		console.log(Form.values);
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

	const classRows = assignMajorOfficer.map((item) => (
		<Table.Tr key={item.officer_major_id}>
			<Table.Td>{item.major_name}</Table.Td>
			<Table.Td>{item.officer_major_name}</Table.Td>
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
			<Modal opened={openModal} onClose={() => setOpenModal(false)} title="แต่งตั้งเจ้าหน้าที่ประจำสาขา" centered>
				<Box>
					<form onSubmit={Form.onSubmit(handleSubmit)}>
						<Select label="เลือกสาขา" data={major} {...Form.getInputProps("major_name")} disabled={modalType === "delete" ? true : false}></Select>
						<TextInput label="รหัสบัตร" {...Form.getInputProps("officer_major_id")} disabled={modalType === "add" ? false : true} />
						<TextInput label="ชื่อ" {...Form.getInputProps("officer_major_name")} disabled={modalType === "delete" ? true : false} />
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

export default AssignMajorOfficer;
