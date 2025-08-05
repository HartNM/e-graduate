//แต่งตั้งประธานกรรมการบัณฑิตศึกษาประจำสาขา
import { useState, useEffect } from "react";
import { Box, Text, TextInput, Table, Button, Modal, Space, ScrollArea, PasswordInput, Group, Select } from "@mantine/core";

const AssignChairpersons = () => {
	const [reloadTable, setReloadTable] = useState(false);
	const token = localStorage.getItem("token");
	const [assignFacultyOfficer, setAssignFacultyOfficer] = useState([]);
	const [openModal, setOpenModal] = useState(false);
	const [modalType, setModalType] = useState(false);
	const [faculty, setFaculty] = useState([
		{ value: "14", label: "การบริหารการศึกษา" },
		{ value: "00", label: "ยุทธศาสตร์การบริหารและการพัฒนา" },
		{ value: "k2", label: "การจัดการสมัยใหม่" },
		{ value: "70", label: "รัฐประศาสนศาสตร์" },
		{ value: "ไม่รู้1", label: "วิทยาศาสตร์ศึกษา" },
	]);

	const [formData, setFormData] = useState({});
	const [errors, setErrors] = useState({
		chairpersons_id: "",
		chairpersons_name: "",
		major_id: "",
		password: "",
	});
	const handleChange = (field, value) => {
		setErrors((prev) => ({ ...prev, [field]: "" }));
		setFormData((prev) => ({ ...prev, [field]: value }));
	};

	useEffect(() => {
		const fetchRequestExamInfoAll = async () => {
			try {
				const requestRes = await fetch("http://localhost:8080/api/allAssignChairpersons", {
					method: "POST",
					headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
				});
				const requestData = await requestRes.json();
				setAssignFacultyOfficer(requestData);
				console.log(requestData);
			} catch (err) {
				console.error("Error fetch allAssignChairpersons:", err);
			}
		};
		fetchRequestExamInfoAll();
		setReloadTable(false);
	}, [reloadTable]);

	const majorMap = {
		14: "วิชาการบริหารการศึกษา",
		"00": "วิชายุทธศาสตร์การบริหารและการพัฒนา",
	};

	const classRows = assignFacultyOfficer.map((item) => (
		<Table.Tr key={item.chairpersons_id}>
			<Table.Td>{majorMap[item.major_id] || item.major_id}</Table.Td>
			<Table.Td>{item.chairpersons_name}</Table.Td>
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
		if (!formData.chairpersons_id || !formData.chairpersons_name || !formData.major_id || !formData.password) {
			if (!formData.chairpersons_id) {
				setErrors((prev) => ({ ...prev, chairpersons_id: "กรุณากรอกรหัสบัตร" }));
			}
			if (!formData.chairpersons_name) {
				setErrors((prev) => ({ ...prev, chairpersons_name: "กรุณากรอกชื่อ" }));
			}
			if (!formData.major_id) {
				setErrors((prev) => ({ ...prev, major_id: "กรุณาเลือกคณะ" }));
			}
			if (!formData.password) {
				setErrors((prev) => ({ ...prev, password: "กรุณากรอกรหัสผ่าน" }));
			}
			return;
		}
		console.log(formData.chairpersons_id, formData.chairpersons_name, formData.major_id, formData.password);

		try {
			await fetch("http://localhost:8080/api/addAssignChairpersons", {
				method: "POST",
				headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
				body: JSON.stringify({
					chairpersons_id: formData.chairpersons_id,
					chairpersons_name: formData.chairpersons_name,
					major_id: formData.major_id,
					password: formData.password,
				}),
			});
			setReloadTable(true);
			setOpenModal(false);
		} catch (err) {
			console.error("Error fetch addAssignChairpersons:", err);
		}
	};

	const handleOpenEdit = (item) => {
		setErrors({});
		setFormData({
			chairpersons_id: item.chairpersons_id,
			chairpersons_name: item.chairpersons_name,
			major_id: item.major_id,
		});
		setModalType("edit");
		setOpenModal(true);
	};

	const handleEditFacultyOfficer = async () => {
		if (!formData.chairpersons_name) {
			setErrors((prev) => ({ ...prev, chairpersons_name: "กรุณากรอกชื่อ" }));
			return;
		}
		try {
			await fetch("http://localhost:8080/api/editAssignChairpersons", {
				method: "POST",
				headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
				body: JSON.stringify({
					chairpersons_id: formData.chairpersons_id,
					chairpersons_name: formData.chairpersons_name,
					major_id: formData.major_id,
				}),
			});
			setReloadTable(true);
			setOpenModal(false);
		} catch (err) {
			console.error("Error fetch editAssignChairpersons:", err);
		}
	};
	return (
		<Box>
			<Modal opened={openModal} onClose={() => setOpenModal(false)} title="แต่งตั้งประธานกรรมการบัณฑิตศึกษาประจำสาขา" centered>
				<Box>
					<Select label="เลือกคณะ" data={faculty} value={formData.major_id || ""} onChange={(value) => handleChange("major_id", value)} error={errors.major_id}></Select>
					<TextInput
						label="รหัสบัตร"
						value={formData.chairpersons_id || ""}
						onChange={(e) => handleChange("chairpersons_id", e.currentTarget.value)}
						error={errors.chairpersons_id}
						disabled={modalType === "add" ? false : true}
						styles={{ input: { color: "#000" } }}
					/>
					<TextInput label="ชื่อ" value={formData.chairpersons_name || ""} onChange={(e) => handleChange("chairpersons_name", e.currentTarget.value)} error={errors.chairpersons_name} />
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

			<ScrollArea type="scroll" offsetScrollbars styles={{ viewport: { padding: 0 } }} style={{ borderRadius: "8px", border: "1px solid #e0e0e0" }}>
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
