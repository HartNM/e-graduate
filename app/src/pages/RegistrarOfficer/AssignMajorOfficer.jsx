//แต่งตั้งเจ้าหน้าที่ประจำคณะ
import { useState, useEffect } from "react";
import { Box, Text, TextInput, Table, Button, Modal, Space, ScrollArea, PasswordInput, Group, Select, Flex } from "@mantine/core";
import { useForm } from "@mantine/form";
import ModalInform from "../../component/Modal/ModalInform";

const AssignMajorOfficer = () => {
	// Modal Info
	const [inform, setInform] = useState({ open: false, type: "", message: "" });
	const notify = (type, message) => setInform({ open: true, type, message });
	const close = () => setInform((s) => ({ ...s, open: false }));

	const [reloadTable, setReloadTable] = useState(false);
	const token = localStorage.getItem("token");
	const [assignMajorOfficer, setAssignMajorOfficer] = useState([]);
	const [openModal, setOpenModal] = useState(false);
	const [modalType, setModalType] = useState(false);


	const save = [
		{ value: "1000000000001", label: "นายกิตติพงษ์ วัฒนากูล" },
		{ value: "1000000000002", label: "นางสาวธนพร สุขเจริญ" },
		{ value: "1000000000003", label: "นายวรากร ศรีสวัสดิ์" },
		{ value: "1000000000004", label: "นางสุภาพร จิตต์ภักดี" },
		{ value: "1000000000005", label: "นางสาวพิมพ์ชนก แสงสุวรรณ" },
		{ value: "1000000000006", label: "นายณัฐวุฒิ เกษมสุข" },
		{ value: "1000000000007", label: "นางรัตนาวดี มีศิลป์" },
	];

	const Form = useForm({
		initialValues: {
			user_id: "",
			name: "",
			major_id: "",
			password: "123456",
		},
		validate: {
			name: (value) => (value.trim().length > 0 ? null : "กรุณากรอกชื่อ"),
			major_id: (value) => (value.trim().length > 0 ? null : "กรุณาเลือกสาขา"),
		},
	});

	const [majorName, setMajorName] = useState([]);
	const [MajorOfficer, setMajorOfficer] = useState([]);

	useEffect(() => {
		const fetchRequestExamInfoAll = async () => {
			try {
				console.log("candidate :", save);

				const MajorOfficerRes = await fetch("http://localhost:8080/api/allAssignMajorOfficer", {
					method: "POST",
					headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
				});
				const MajorOfficerData = await MajorOfficerRes.json();
				if (!MajorOfficerRes.ok) throw new Error(MajorOfficerData.message);
				setAssignMajorOfficer(MajorOfficerData);
				console.log("MajorOfficer :", MajorOfficerData);

				const majorsRes = await fetch("http://localhost:8080/api/majors", {
					method: "POST",
					headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
				});
				const majorsData = await majorsRes.json();
				if (!majorsRes.ok) throw new Error(majorsData.message);
				const majorOptions = majorsData.map((m) => ({
					value: m.major_id,
					label: m.major_name,
				}));
				setMajorName(majorOptions);
				console.log("marjor :", majorOptions);

				const candidate_filtered = save.filter((person) => !MajorOfficerData.some((item) => item.user_id === person.value));
				setMajorOfficer(candidate_filtered);
				console.log("candidate_filtered :", candidate_filtered);
			} catch (e) {
				notify("error", e.message);
				console.error("Error fetch requestExamInfoAll:", e);
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

	const handleOpenDelete = (item) => {
		Form.setValues(item);
		setModalType("delete");
		setOpenModal(true);
	};

	const handleSubmit = async () => {
		const url = {
			add: "http://localhost:8080/api/addAssignMajorOfficer",
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
			if (!requestRes.ok) throw new Error(requestData.message);
			notify("success", requestData.message);
			setReloadTable(true);
			setOpenModal(false);
		} catch (e) {
			notify("error", e.message);
			console.error("Error fetch deleteAssignChairpersons:", e);
		}
	};

	const classRows = assignMajorOfficer.map((item) => {
		const major = majorName.find((m) => m.value === item.major_id);
		return (
			<Table.Tr key={item.user_id}>
				<Table.Td>{major ? major.label : "-"}</Table.Td>
				<Table.Td>{item.name}</Table.Td>
				<Table.Td>
					<Group>
						<Button color="red" size="xs" onClick={() => handleOpenDelete(item)}>
							ลบ
						</Button>
					</Group>
				</Table.Td>
			</Table.Tr>
		);
	});

	return (
		<Box>
			<ModalInform opened={inform.open} onClose={close} message={inform.message} type={inform.type} />
			<Modal opened={openModal} onClose={() => setOpenModal(false)} title="กรอกข้อมูลเจ้าหน้าที่ประจำสาขาวิชา" centered>
				<Box>
					<form onSubmit={Form.onSubmit(handleSubmit)}>
						<Select label="เลือกสาขา" data={majorName} {...Form.getInputProps("major_id")} disabled={modalType === "delete" ? true : false}></Select>
						{modalType === "delete" ? (
							<TextInput label="ชื่อ" {...Form.getInputProps("name")} disabled={true} />
						) : (
							<Select
								label="ชื่อ"
								searchable
								data={MajorOfficer}
								value={Form.values.user_id}
								onChange={(value) => {
									Form.setFieldValue("user_id", value);
									const selected = MajorOfficer.find((c) => c.value === value);
									Form.setFieldValue("name", selected ? selected.label : "");
								}}
							/>
						)}
						<Space h="md" />
						<Button color={modalType === "delete" ? "red" : "green"} type="submit" fullWidth>
							{modalType === "delete" ? "ลบ" : "บันทึก"}
						</Button>
					</form>
				</Box>
			</Modal>

			<Text size="1.5rem" fw={900} mb="md">
				กรอกข้อมูลเจ้าหน้าที่ประจำสาขาวิชา
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
