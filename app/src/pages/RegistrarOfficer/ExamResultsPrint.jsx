//กรอกผลการสอบ
import { Box, Text, ScrollArea, Table, Group, Space, Select } from "@mantine/core";
import { useState, useEffect } from "react";
import SignatureForm from "../../component/PDF/SignatureForm";

const ExamResultsPrint = () => {
	const token = localStorage.getItem("token");
	const [user, setUser] = useState("");
	const [reloadTable, setReloadTable] = useState(false);
	const [group, setGroup] = useState([]);

	useEffect(() => {
		const fetchRequestExamInfoAll = async () => {
			try {
				const requestRes = await fetch("http://localhost:8080/api/AllExamResultsPrint", {
					method: "POST",
					headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
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
	}, [ reloadTable]);

	const [selectedTerm, setSelectedTerm] = useState("");
	const [selectedType, setSelectedType] = useState("");

	const filteredGroup =
		selectedType || selectedTerm
			? Object.fromEntries(
					Object.entries(group).map(([groupId, students]) => [
						groupId,
						students.filter((student) => {
							return (!selectedTerm || student.term === selectedTerm) && (!selectedType || student.request_type === selectedType);
						}),
					])
			  )
			: group;

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
					<SignatureForm data={filteredGroup} />
				</Box>
			</Group>
			<Space h="md" />

			<ScrollArea type="scroll" offsetScrollbars style={{ borderRadius: "8px", border: "1px solid #e0e0e0" }}>
				<Table horizontalSpacing="sm" verticalSpacing="sm" highlightOnHover>
					<Table.Thead>
						<Table.Tr>
							<Table.Th>เทอมการศึกษา</Table.Th>
							<Table.Th>ชื่อ</Table.Th>
							<Table.Th>คำขอ</Table.Th>
						</Table.Tr>
					</Table.Thead>
					<Table.Tbody>
						{Object.entries(filteredGroup).map(([groupId, students]) =>
							students.map((student) => (
								<Table.Tr key={student.id}>
									<Table.Td>{student.term}</Table.Td>
									<Table.Td>{student.name}</Table.Td>
									<Table.Td>{student.request_type}</Table.Td>
								</Table.Tr>
							))
						)}
					</Table.Tbody>
				</Table>
			</ScrollArea>
		</Box>
	);
};

export default ExamResultsPrint;
