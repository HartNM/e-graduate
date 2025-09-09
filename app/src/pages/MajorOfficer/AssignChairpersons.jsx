//แต่งตั้งประธานกรรมการบัณฑิตศึกษาประจำสาขา
import { useState, useEffect } from "react";
import { Box, Text, TextInput, Table, Button, Modal, Space, ScrollArea, PasswordInput, Group, Select, Flex } from "@mantine/core";
import { useForm } from "@mantine/form";
import ModalInform from "../../component/Modal/ModalInform";

const AssignChairpersons = () => {
	// Modal Info
	const [inform, setInform] = useState({ open: false, type: "", message: "" });
	const notify = (type, message) => setInform({ open: true, type, message });
	const close = () => setInform((s) => ({ ...s, open: false }));

	const [openModal, setOpenModal] = useState(false);
	const [modalType, setModalType] = useState(false);

	const [reloadTable, setReloadTable] = useState(false);
	const token = localStorage.getItem("token");

	const [assignChairpersons, setAssignChairpersons] = useState([]);

	const [chairpersons, setChairpersons] = useState([
		{ value: "4000000000007", label: "นายกิตติพงษ์ ศรีสวัสดิ์" },
		{ value: "4000000000008", label: "นางสุชาดา แก้วมณี" },
		{ value: "4000000000009", label: "นายธนกฤต พูนสุข" },
	]);
	const save = [
		{ value: "4000000000007", label: "นายกิตติพงษ์ ศรีสวัสดิ์" },
		{ value: "4000000000008", label: "นางสุชาดา แก้วมณี" },
		{ value: "4000000000009", label: "นายธนกฤต พูนสุข" },
	];

	const Form = useForm({
		initialValues: {
			chairpersons_id: "",
			chairpersons_name: "",
			major_name: "",
			password: "123456",
		},
		validate: {
			chairpersons_name: (value) => (value.trim().length > 0 ? null : "กรุณากรอกชื่อ"),
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
			} catch (e) {
				notify("error", e.message);
				console.error("Error fetching profile:", e);
			}
		};
		fetchProfile();
	}, []);

	useEffect(() => {
		if (!user) return;
		const fetchRequestExamInfoAll = async () => {
			try {
				setChairpersons(save);
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
				const assignedIds = assignChairpersons.map((item) => item.chairpersons_id);
				setChairpersons((prev) => prev.filter((c) => !assignedIds.includes(c.value)));
			} catch (e) {
				notify("error", e.message);
				console.error("Error fetch allAssignChairpersons:", e);
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

	const handleOpenDelete = (item) => {
		Form.setValues(item);
		setModalType("delete");
		setOpenModal(true);
	};

	const handleSubmit = async () => {
		const url = {
			add: "http://localhost:8080/api/addAssignChairpersons",
			delete: "http://localhost:8080/api/deleteAssignChairpersons",
		};
		try {
			const req = await fetch(url[modalType], {
				method: "POST",
				headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
				body: JSON.stringify(Form.values),
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
			console.error("Error fetch AssignChairpersons:", e);
		}
	};

	const classRows = assignChairpersons.map((item) => (
		<Table.Tr key={item.chairpersons_id}>
			<Table.Td>{item.major_name}</Table.Td>
			<Table.Td>{item.chairpersons_name}</Table.Td>
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
			<Modal opened={openModal} onClose={() => setOpenModal(false)} title="แต่งตั้งประธานกรรมการบัณฑิตศึกษาประจำสาขา" centered>
				<form onSubmit={Form.onSubmit(handleSubmit)}>
					<Text>สาขา{user.id}</Text>
					{modalType === "delete" ? (
						<TextInput label="ชื่อ" {...Form.getInputProps("chairpersons_name")} disabled={true} />
					) : (
						<Select
							label="ชื่อ"
							searchable
							data={chairpersons}
							value={Form.values.chairpersons_id}
							onChange={(value) => {
								Form.setFieldValue("chairpersons_id", value);
								const selected = chairpersons.find((c) => c.value === value);
								Form.setFieldValue("chairpersons_name", selected ? selected.label : "");
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
				กรอกข้อมูลประธานกรรมการบัณฑิตศึกษาประจำสาขาวิชา
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
