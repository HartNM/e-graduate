//กรอกผลการสอบ
import { Box, Text, ScrollArea, Table, Flex, Group, Button, Space, Modal, Checkbox, TextInput } from "@mantine/core";
import { useState, useEffect } from "react";
import { useForm } from "@mantine/form";

const ExamResults = () => {
	const [openModal, setOpenModal] = useState(false);
	const token = localStorage.getItem("token");
	const [user, setUser] = useState("");

	const form = useForm({
		initialValues: {},
	});

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
	const [group, setGroup] = useState([]);

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

				/* form.setValues(Object.fromEntries(Object.entries(requestData).flatMap(([groupId, students]) => students.map((s) => [s.id, s.exam_results ?? null])))); */
				form.setValues(
					Object.fromEntries(
						Object.entries(requestData).flatMap(
							([groupId, students]) => students.map((s) => [s.id, s.exam_results]) // ค่า default = "ผ่าน"
						)
					)
				);
			} catch (err) {
				console.error("Error fetch AllExamResults:", err);
			}
			setReloadTable(false);
		};
		fetchRequestExamInfoAll();
	}, [user, reloadTable]);

	const handleOpenModal = (groupId) => {
		setSelectedGroupId({ [groupId]: group[groupId] });
		const initial = {};
		group[groupId].forEach((student) => {
			initial[student.id] = student.exam_results === null ? "ผ่าน" : student.exam_results;
		});
		form.reset();
		form.setValues(initial);
	};

	const handleSaveExamResults = async () => {
		console.log("Form values:", form.values);
		try {
			const res = await fetch("http://localhost:8080/api/AddExamResults", {
				method: "POST",
				headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
				body: JSON.stringify(form.values),
			});
			setOpenModal(false);
			setReloadTable(true);
			setSelectedGroupId("");
		} catch (err) {
			console.error("Error fetching AddCourseRegistration:", err);
		}
	};

	const [selectedGroupId, setSelectedGroupId] = useState("");
	return (
		<Box>
			{!selectedGroupId ? (
				<Box>
					<Text size="1.5rem" fw={900} mb="md">
						กรอกผลการสอบ
					</Text>
					<ScrollArea type="scroll" offsetScrollbars style={{ borderRadius: "8px", border: "1px solid #e0e0e0" }}>
						<Table horizontalSpacing="sm" verticalSpacing="sm" highlightOnHover>
							<Table.Thead>
								<Table.Tr>
									<Table.Th>รหัสหมู่เรียน</Table.Th>
									<Table.Th>ดำเนินการ</Table.Th>
								</Table.Tr>
							</Table.Thead>
							<Table.Tbody>
								{Object.entries(group).map(([groupId, students]) => {
									const allFilled = students.every((student) => student.exam_results !== null);
									return (
										<Table.Tr key={groupId}>
											<Table.Td>{groupId}</Table.Td>
											<Table.Td>
												<Button size="xs" color={allFilled && "yellow"} onClick={() => handleOpenModal(groupId)}>
													{allFilled ? "แก้ไข" : "กรอก"}
												</Button>
											</Table.Td>
										</Table.Tr>
									);
								})}
							</Table.Tbody>
						</Table>
					</ScrollArea>
				</Box>
			) : (
				<form onSubmit={form.onSubmit(() => setOpenModal(true))}>
					<Text size="1.5rem" fw={900} mb="md">
						กรอกผลการสอบ
					</Text>
					<Group justify="space-between">
						<Box></Box>
						<Group>
							<Button color="red" onClick={() => setSelectedGroupId("")}>
								ยกเลิก
							</Button>
							<Button type="submit" color="green">
								บันทึก
							</Button>
						</Group>
					</Group>
					<Space h="md" />
					<ScrollArea type="scroll" offsetScrollbars style={{ borderRadius: "8px", border: "1px solid #e0e0e0" }}>
						<Table horizontalSpacing="sm" verticalSpacing="sm" highlightOnHover>
							<Table.Thead>
								<Table.Tr>
									<Table.Th>รหัสนักศึกษา</Table.Th>
									<Table.Th>ชื่อ</Table.Th>
									<Table.Th>ผลสอบ</Table.Th>
								</Table.Tr>
							</Table.Thead>
							<Table.Tbody>
								{Object.entries(selectedGroupId).map(([groupId, students]) =>
									students.map((student) => (
										<Table.Tr key={student.id}>
											<Table.Td>{student.id}</Table.Td>
											<Table.Td>{student.name}</Table.Td>
											<Table.Td>
												<Group justify="center" align="center">
													{/* <Checkbox color="green" checked={form.values[student.id] === true} onChange={() => form.setFieldValue(student.id, true)} label="ผ่าน" />
													<Checkbox color="red" checked={form.values[student.id] === false} onChange={() => form.setFieldValue(student.id, false)} label="ไม่ผ่าน" /> */}
													<Checkbox color="green" checked={form.values[student.id] === "ผ่าน"} onChange={() => form.setFieldValue(student.id, "ผ่าน")} label="ผ่าน" />
													<Checkbox color="red" checked={form.values[student.id] === "ไม่ผ่าน"} onChange={() => form.setFieldValue(student.id, "ไม่ผ่าน")} label="ไม่ผ่าน" />
													<Checkbox color="gray" checked={form.values[student.id] === "ขาดสอบ"} onChange={() => form.setFieldValue(student.id, "ขาดสอบ")} label="ขาดสอบ" />
												</Group>
												{form.errors[student.id] && (
													<Box justify="center" align="center" style={{ color: "red", fontSize: 12 }}>
														{form.errors[student.id]}
													</Box>
												)}
											</Table.Td>
										</Table.Tr>
									))
								)}
							</Table.Tbody>
						</Table>
					</ScrollArea>
				</form>
			)}

			<Modal opened={openModal} onClose={() => setOpenModal(false)} title={`รายชื่อนักเรียน`} centered closeOnClickOutside={false}>
				<Table>
					<Table.Thead>
						<Table.Tr>
							<Table.Th>รหัสนักเรียน</Table.Th>
							<Table.Th>ชื่อ-สกุล</Table.Th>
							<Table.Th style={{ textAlign: "center" }}>ผลสอบ</Table.Th>
						</Table.Tr>
					</Table.Thead>
					<Table.Tbody>
						{Object.entries(selectedGroupId).map(([groupId, students]) =>
							students.map((student) => (
								<Table.Tr key={student.id}>
									<Table.Td>{student.id}</Table.Td>
									<Table.Td>{student.name}</Table.Td>
									<Table.Td style={{ textAlign: "center" }}>
										{/* {form.values[student.id] === true && <Text c="green">ผ่าน</Text>}
										{form.values[student.id] === false && <Text c="red">ไม่ผ่าน</Text>} */}

										{form.values[student.id] === "ผ่าน" && <Text c="green">ผ่าน</Text>}
										{form.values[student.id] === "ไม่ผ่าน" && <Text c="red">ไม่ผ่าน</Text>}
										{form.values[student.id] === "ขาดสอบ" && <Text c="gray">ขาดสอบ</Text>}
									</Table.Td>
								</Table.Tr>
							))
						)}
					</Table.Tbody>
				</Table>
				<Group grow>
					<Button color="yellow" onClick={() => setOpenModal(false)}>
						แก้ไข
					</Button>
					<Button color="green" onClick={() => (setOpenModal(false), handleSaveExamResults())}>
						บันทึก
					</Button>
				</Group>
			</Modal>
		</Box>
	);
};

export default ExamResults;
