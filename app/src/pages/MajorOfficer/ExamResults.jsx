//กรอกผลการสอบ
import { Box, Text, ScrollArea, Table, Flex, Group, Button, Space, Modal, Checkbox, TextInput } from "@mantine/core";
import { useState, useEffect } from "react";
import { useForm } from "@mantine/form";
import SignatureForm from "../../component/PDF/SignatureForm";

const ExamResults = () => {
	const [openModal, setOpenModal] = useState(false);

	const form = useForm({
		initialValues: {},
	});

	const allPeopleByGroup = {
		6841401: [
			{ id: 684140101, name: "น.ส. กนกพร ใจดี" },
			{ id: 684140102, name: "นาย ธนกฤต รุ่งเรือง" },
		],
		6842702: [
			{ id: 684270201, name: "น.ส. วิภาวี มั่นคง" },
			{ id: 684270202, name: "นาย สมชาย เก่งงาน" },
		],
		6841455: [

		]
	};

	const token = localStorage.getItem("token");
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
				console.error("Error fetching profile:", err);
			}
		};
		fetchProfile();
	}, []);
	const [reloadTable, setReloadTable] = useState(false);
	const [group, setGroup] = useState(null);
	useEffect(() => {
		if (!user) return;
		const fetchRequestExamInfoAll = async () => {
			try {
				const requestRes = await fetch("http://localhost:8080/api/AllExamResults", {
					method: "POST",
					headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
					body: JSON.stringify({ id: user.id }),
				});
				const requestData = await requestRes.json();
				if (!requestRes.ok) {
					throw new Error(requestData.message);
				}
				setGroup(requestData);
				console.log(requestData);
			} catch (err) {
				console.error("Error fetch AllExamResults:", err);
			}
			setReloadTable(false);
		};
		fetchRequestExamInfoAll();
	}, [user, reloadTable]);

	const [selectedGroupId, setSelectedGroupId] = useState(null);
	const handleOpenModal = (groupId) => {
		setSelectedGroupId(groupId);

		const initial = {};
		allPeopleByGroup[groupId].forEach((person) => {
			initial[person.id] = false; // boolean false
		});

		form.reset();
		form.setValues(initial); // รีเซ็ตค่าเฉพาะหมู่เรียน
		setOpenModal(true);
	};

	return (
		<Box>
			<Modal opened={openModal} onClose={() => setOpenModal(false)} title={`รายชื่อหมู่เรียน ${selectedGroupId}`} centered closeOnClickOutside={false}>
				{selectedGroupId && (
					<>
						<Table>
							<Table.Thead>
								<Table.Tr>
									<Table.Th>รหัส</Table.Th>
									<Table.Th>ชื่อ</Table.Th>
									<Table.Th>ผ่าน/ไม่ผ่าน</Table.Th>
								</Table.Tr>
							</Table.Thead>
							<Table.Tbody>
								{allPeopleByGroup[selectedGroupId].map((person) => (
									<Table.Tr key={person.id}>
										<Table.Td>{person.id}</Table.Td>
										<Table.Td>{person.name}</Table.Td>
										<Table.Td>
											<Checkbox {...form.getInputProps(person.id, { type: "checkbox" })} />
										</Table.Td>
									</Table.Tr>
								))}
							</Table.Tbody>
						</Table>

						<Group justify="flex-end" mt="md">
							<Button
								onClick={() => {
									console.log("Form values:", form.values);
									setOpenModal(false);
								}}
								color="green"
							>
								บันทึก
							</Button>
						</Group>
					</>
				)}
			</Modal>

			<Text size="1.5rem" fw={900} mb="md">
				กรอกผลการสอบ
			</Text>
			<Group justify="space-between">
				<Box>
					<Flex align="flex-end" gap="sm"></Flex>
				</Box>
				<SignatureForm data={group}/>
				{/* <Button>พิมรายชื่อ</Button> */}
			</Group>
			<Space h="md" />
			<ScrollArea type="scroll" offsetScrollbars style={{ borderRadius: "8px", border: "1px solid #e0e0e0" }}>
				<Table horizontalSpacing="sm" verticalSpacing="sm" highlightOnHover>
					<Table.Thead>
						<Table.Tr>
							<Table.Th>รหัสหมู่เรียน</Table.Th>
							<Table.Th>จัดการ</Table.Th>
						</Table.Tr>
					</Table.Thead>
					<Table.Tbody>
						{Object.keys(allPeopleByGroup).map((groupId) => (
							<Table.Tr key={groupId}>
								<Table.Td>{groupId}</Table.Td>
								<Table.Td>
									<Group>
										<Button color="yellow" size="xs" onClick={() => handleOpenModal(groupId)}>
											กรอก
										</Button>
									</Group>
								</Table.Td>
							</Table.Tr>
						))}
					</Table.Tbody>
				</Table>
			</ScrollArea>
		</Box>
	);
};

export default ExamResults;
