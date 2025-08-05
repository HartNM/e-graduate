//แต่งตั้งเจ้าหน้าที่ประจำคณะ
import { useState, useEffect } from "react";
import { Box, Text, TextInput, Table, Button, Modal, Space, ScrollArea, PasswordInput, Group, Select } from "@mantine/core";

const AssignFacultyOfficer = () => {
	const [reloadTable, setReloadTable] = useState(false);
	const token = localStorage.getItem("token");
	const [assignFacultyOfficer, setAssignFacultyOfficer] = useState([]);
	const [openModal, setOpenModal] = useState(false);
	const [modalType, setModalType] = useState(false);
	const [faculty, setFaculty] = useState(["คณะครุศาสตร์", "คณะวิทยาการจัดการ", "คณะเทคโนโลยีอุตสาหกรรม", "คณะวิทยาศาสตร์และเทคโนโลยี", "คณะมนุษยศาสตร์และสังคมศาสตร์", "คณะพยาบาลศาสตร์"]);

	const [formData, setFormData] = useState({});
	const [errors, setErrors] = useState({});
	const handleChange = (field, value) => {
		setErrors((prev) => ({ ...prev, [field]: "" }));
		setFormData((prev) => ({ ...prev, [field]: value }));
	};

	useEffect(() => {
		const fetchRequestExamInfoAll = async () => {
			try {
				const requestRes = await fetch("http://localhost:8080/api/allAssignFacultyOfficer", {
					method: "POST",
					headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
				});
				const requestData = await requestRes.json();
				setAssignFacultyOfficer(requestData);
				console.log(requestData);
			} catch (err) {
				console.error("Error fetch requestExamInfoAll:", err);
			}
		};
		fetchRequestExamInfoAll();
		setReloadTable(false);
	}, [reloadTable]);

	const classRows = assignFacultyOfficer.map((item) => (
		<Table.Tr key={item.officer_faculty_id}>
			<Table.Td>{item.faculty_name}</Table.Td>
			<Table.Td>{item.officer_faculty_name}</Table.Td>
			<Table.Td>
				<Button variant="filled" color="indigo" size="xs" onClick={() => handleOpenEdit(item)}>
					แก้ไข
				</Button>
			</Table.Td>
		</Table.Tr>
	));

	const handleOpenAdd = () => {
		setErrors({});
		setFormData({});
		setModalType("add");
		setOpenModal(true);
	};

	const handleAddFacultyOfficer = async () => {
		if (!formData.faculty_name || !formData.officer_faculty_id || !formData.officer_faculty_name || !formData.password) {
			if (!formData.faculty_name) {
				setErrors((prev) => ({ ...prev, faculty_name: "กรุณาเลือกคณะ" }));
			}
			if (!formData.officer_faculty_id) {
				setErrors((prev) => ({ ...prev, officer_faculty_id: "กรุณากรอกรหัสบัตร" }));
			}
			if (!formData.officer_faculty_name) {
				setErrors((prev) => ({ ...prev, officer_faculty_name: "กรุณากรอกชื่อ" }));
			}
			if (!formData.password) {
				setErrors((prev) => ({ ...prev, password: "กรุณากรอกรหัสผ่าน" }));
			}
			return;
		}
		try {
			await fetch("http://localhost:8080/api/addAssignFacultyOfficer", {
				method: "POST",
				headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
				body: JSON.stringify({
					faculty_name: formData.faculty_name,
					officer_faculty_id: formData.officer_faculty_id,
					officer_faculty_name: formData.officer_faculty_name,
					password: formData.password,
				}),
			});
			setReloadTable(true);
			setOpenModal(false);
		} catch (err) {
			console.error("Error fetch addAssignFacultyOfficer:", err);
		}
	};

	const handleOpenEdit = (item) => {
		setErrors({});
		setFormData({
			officer_faculty_id: item.officer_faculty_id,
			officer_faculty_name: item.officer_faculty_name,
			faculty_name: item.faculty_name,
		});
		setModalType("edit");
		setOpenModal(true);
	};

	const handleEditFacultyOfficer = async () => {
		if (!formData.officer_faculty_name) {
			setErrors((prev) => ({ ...prev, officer_faculty_name: "กรุณากรอกชื่อ" }));
			return;
		}
		try {
			await fetch("http://localhost:8080/api/editAssignFacultyOfficer", {
				method: "POST",
				headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
				body: JSON.stringify({
					faculty_name: formData.faculty_name,
					officer_faculty_id: formData.officer_faculty_id,
					officer_faculty_name: formData.officer_faculty_name,
				}),
			});
			setReloadTable(true);
			setOpenModal(false);
		} catch (err) {
			console.error("Error fetch addAssignFacultyOfficer:", err);
		}
	};
	return (
		<Box>
			<Modal opened={openModal} onClose={() => setOpenModal(false)} title="แต่งตั้งเจ้าหน้าที่ประจำคณะ" centered>
				<Box>
					<Select label="เลือกคณะ" data={faculty} value={formData.faculty_name || ""} onChange={(value) => handleChange("faculty_name", value)} error={errors.faculty_name}></Select>
					<TextInput
						label="รหัสบัตร"
						value={formData.officer_faculty_id || ""}
						onChange={(e) => handleChange("officer_faculty_id", e.currentTarget.value)}
						error={errors.officer_faculty_id}
						disabled={modalType === "add" ? false : true}
						styles={{ input: { color: "#000" } }}
					/>
					<TextInput label="ชื่อ" value={formData.officer_faculty_name || ""} onChange={(e) => handleChange("officer_faculty_name", e.currentTarget.value)} error={errors.officer_faculty_name} />
					{modalType === "add" && <PasswordInput label="รหัสผ่าน" value={formData.password || ""} onChange={(e) => handleChange("password", e.currentTarget.value)} error={errors.password} />}
					<Space h="md" />
					<Button
						variant="filled"
						color="green"
						size="xs"
						onClick={() => {
							modalType === "add" ? handleAddFacultyOfficer() : handleEditFacultyOfficer();
						}}
					>
						บันทึก
					</Button>
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

			<ScrollArea type="scroll" offsetScrollbars styles={{ viewport: { padding: 0 } }} style={{ borderRadius: "8px", border: "1px solid #e0e0e0" }}>
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
