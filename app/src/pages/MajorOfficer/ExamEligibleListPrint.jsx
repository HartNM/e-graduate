//กรอกผลการสอบ
import { Box, Text, ScrollArea, Table, Flex, Group, Button, Space, Modal, Checkbox, TextInput, Select } from "@mantine/core";
import { useState, useEffect } from "react";
import { useForm } from "@mantine/form";
import SignatureForm from "../../component/PDF/SignatureForm";

const ExamEligibleListPrint = () => {
	const token = localStorage.getItem("token");
	const [user, setUser] = useState("");
	const [reloadTable, setReloadTable] = useState(false);
	const [group, setGroup] = useState([]);

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

	const [selectedTerm, setSelectedTerm] = useState("");
	const [selectedType, setSelectedType] = useState("");

	// ก่อน return ของ component
	const filteredGroup = selectedType && selectedTerm ? Object.fromEntries(Object.entries(group).map(([groupId, students]) => [groupId, students.filter((student) => student.term === selectedTerm)])) : group;

	return (
		<Box>
			<Text size="1.5rem" fw={900} mb="md">
				พิมพ์ใบรายชื่อผู้มีสิทธิสอบ
			</Text>
			<Group justify="space-between">
				<Group>
					<Select placeholder="ชนิดคำขอ" data={["ขอสอบประมวลความรู้", "ขอสอบวัดคุณสมบัติ"]} value={selectedType} onChange={setSelectedType} />
					<Select placeholder="เทอมการศึกษา" data={["1/68", "2/68", "3/68"]} value={selectedTerm} onChange={setSelectedTerm} />
				</Group>
				<Box>
					<SignatureForm data={group} />
				</Box>
			</Group>
			<Space h="md" />
			{/* <ScrollArea type="scroll" offsetScrollbars style={{ borderRadius: "8px", border: "1px solid #e0e0e0" }}>
				<Table horizontalSpacing="sm" verticalSpacing="sm" highlightOnHover>
					<Table.Thead>
						<Table.Tr>
							<Table.Th>รหัสหมู่เรียน</Table.Th>
							<Table.Th>จัดการ</Table.Th>
						</Table.Tr>
					</Table.Thead>
					<Table.Tbody>
						{Object.keys(group).map((groupId) => (
							<Table.Tr key={groupId}>
								<Table.Td>{groupId}</Table.Td>
								<Table.Td>
									<Group>
										<SignatureForm data={{ [groupId]: group[groupId] }} />
									</Group>
								</Table.Td>
							</Table.Tr>
						))}
					</Table.Tbody>
				</Table>
			</ScrollArea> */}

			<ScrollArea type="scroll" offsetScrollbars style={{ borderRadius: "8px", border: "1px solid #e0e0e0" }}>
				<Table horizontalSpacing="sm" verticalSpacing="sm" highlightOnHover>
					<Table.Thead>
						<Table.Tr>
							<Table.Th>ชื่อ</Table.Th>
							{/* <Table.Th>จัดการ</Table.Th> */}
						</Table.Tr>
					</Table.Thead>
					<Table.Tbody>
						{selectedType &&
							selectedTerm &&
							Object.entries(group).map(([groupId, students]) =>
								students.map((student) => (
									<Table.Tr key={student.id}>
										<Table.Td>{student.name}</Table.Td>
									</Table.Tr>
								))
							)}
					</Table.Tbody>
				</Table>
			</ScrollArea>
		</Box>
	);
};

export default ExamEligibleListPrint;
