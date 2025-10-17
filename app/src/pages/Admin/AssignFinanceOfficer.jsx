//แต่งตั้งประธานกรรมการบัณฑิตศึกษาประจำสาขา
import { useState, useEffect } from "react";
import { Box, Text, TextInput, Table, Button, Modal, Space, ScrollArea, PasswordInput, Group, Select, Flex } from "@mantine/core";
import { useForm } from "@mantine/form";
import ModalInform from "../../component/Modal/ModalInform";

const AssignFinanceOfficer = () => {
	// Modal Info
	const [inform, setInform] = useState({ open: false, type: "", message: "" });
	const notify = (type, message) => setInform({ open: true, type, message });
	const close = () => setInform((s) => ({ ...s, open: false }));

	const [openModal, setOpenModal] = useState(false);
	const [modalType, setModalType] = useState(false);

	const [reloadTable, setReloadTable] = useState(false);
	const token = localStorage.getItem("token");

	const [assignFinanceOfficer, setAssignFinanceOfficer] = useState([]);

	const [FinanceOfficer, setFinanceOfficer] = useState([]);

	const save = [
		{ value: "6000000000001", label: "นายธนกร ศรีสุวรรณ" },
		{ value: "6000000000002", label: "นายปิยะพงษ์ ชาญชัย" },
		{ value: "6000000000003", label: "นางสาวศศิธร บุญเรือง" },
		{ value: "6000000000004", label: "นายอนันต์ รุ่งเรืองสกุล" },
		{ value: "6000000000005", label: "นายกิตติพงษ์ ศรีสวัสดิ์" },
		{ value: "6000000000006", label: "นางสุชาดา แก้วมณี" },
		{ value: "6000000000007", label: "นายธนกฤต พูนสุข" },
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
		},
	});

	useEffect(() => {
		const fetchRequestExamInfoAll = async () => {
			try {
				console.log("candidate :", save);

				const FinanceOfficerRes = await fetch("http://localhost:8080/api/allAssignFinanceOfficer", {
					method: "POST",
					headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
				});
				const FinanceOfficerData = await FinanceOfficerRes.json();
				if (!FinanceOfficerRes.ok) throw new Error(FinanceOfficerData.message);
				setAssignFinanceOfficer(FinanceOfficerData);
				console.log("FinanceOfficer :", FinanceOfficerData);

				const candidate_filtered = save.filter((person) => !FinanceOfficerData.some((item) => item.user_id === person.value));
				setFinanceOfficer(candidate_filtered);
				console.log("candidate_filtered :", candidate_filtered);
			} catch (e) {
				notify("error", e.message);
				console.error("Error fetch allAssignFinanceOfficer:", e);
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
			add: "http://localhost:8080/api/addAssignFinanceOfficer",
			delete: "http://localhost:8080/api/deleteAssignFinanceOfficer",
		};
		try {
			const req = await fetch(url[modalType], {
				method: "POST",
				headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
				body: JSON.stringify({ ...Form.values }),
			});
			const res = await req.json();
			if (!req.ok) {
				throw new Error(res.message);
			}
			notify("success", res.message);
			setReloadTable(true);
			setOpenModal(false);
		} catch (e) {
			notify("error", e.message);
			console.error("Error fetch AssignFinanceOfficer:", e);
		}
	};

	const classRows = assignFinanceOfficer.map((item) => (
		<Table.Tr key={item.user_id}>
			<Table.Td>{item.name}</Table.Td>
			<Table.Td>
				<Group>
					<Button color="red" size="xs" onClick={() => handleOpenDelete(item)}>
						ลบ
					</Button>
				</Group>
			</Table.Td>
		</Table.Tr>
	));

	return (
		<Box>
			<ModalInform opened={inform.open} onClose={close} message={inform.message} type={inform.type} />
			<Modal opened={openModal} onClose={() => setOpenModal(false)} title="กรอกข้อมูลประธานกรรมการบัณฑิตศึกษาประจำสาขาวิชา" centered>
				<form onSubmit={Form.onSubmit(handleSubmit)}>
					{modalType === "delete" ? (
						<TextInput label="ชื่อ" {...Form.getInputProps("name")} disabled={true} />
					) : (
						<Select
							label="ชื่อ"
							searchable
							data={FinanceOfficer}
							value={Form.values.FinanceOfficer_id}
							onChange={(value) => {
								Form.setFieldValue("user_id", value);
								const selected = FinanceOfficer.find((c) => c.value === value);
								Form.setFieldValue("name", selected ? selected.label : "");
							}}
						/>
					)}

					<Space h="md" />
					<Button color={modalType === "delete" ? "red" : "green"} type="submit" fullWidth>
						{modalType === "delete" ? "ลบ" : "บันทึก"}
					</Button>
				</form>
			</Modal>

			<Text size="1.5rem" fw={900} mb="md">
				AssignFinanceOfficer
			</Text>
			<Space h="xl" />
			<Box>
				<Flex justify="flex-end">
					<Button variant="filled" size="xs" onClick={() => handleOpenAdd()}>
						เพิ่มข้อมูล
					</Button>
				</Flex>
			</Box>
			<Space h="xl" />
			<ScrollArea type="scroll" offsetScrollbars style={{ borderRadius: "8px", border: "1px solid #e0e0e0" }}>
				<Table horizontalSpacing="sm" verticalSpacing="sm" highlightOnHover>
					<Table.Thead>
						<Table.Tr>
							<Table.Th>ชื่อ</Table.Th>
							<Table.Th>การดำเนินการ</Table.Th>
						</Table.Tr>
					</Table.Thead>
					<Table.Tbody>{classRows}</Table.Tbody>
				</Table>
			</ScrollArea>
		</Box>
	);
};

export default AssignFinanceOfficer;
