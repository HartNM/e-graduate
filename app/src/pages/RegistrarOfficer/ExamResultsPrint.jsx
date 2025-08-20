//กรอกผลการสอบ
import { Box, Text, ScrollArea, Table, Group, Space, Select, Button } from "@mantine/core";
import { useState, useEffect } from "react";
import PDFExamResultsPrint from "../../component/PDF/PdfExamResultsPrint";

const ExamResultsPrint = () => {
	const token = localStorage.getItem("token");
	const [reloadTable, setReloadTable] = useState(false);
	const [group, setGroup] = useState([]);
	const [term, setTerm] = useState([]);
	const [selectedTerm, setSelectedTerm] = useState("");
	const [selectedType, setSelectedType] = useState("");

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

			try {
				const requestRes = await fetch("http://localhost:8080/api/allRequestExamInfo", {
					method: "POST",
					headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
				});
				const requestData = await requestRes.json();
				if (!requestRes.ok) {
					throw new Error(requestData.message);
				}
				const terms = requestData.map((item) => item.term);
				setTerm(terms);
				setSelectedTerm(terms[0]);
			} catch (err) {
				console.error("Error fetch allRequestExamInfo:", err);
			}
			setReloadTable(false);
		};
		fetchRequestExamInfoAll();
	}, [reloadTable]);

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
				พิมพ์ผลการสอบ
			</Text>
			<Group justify="space-between">
				<Group>
					<Select placeholder="ชนิดคำขอ" data={["ขอสอบประมวลความรู้", "ขอสอบวัดคุณสมบัติ"]} value={selectedType} onChange={setSelectedType} />
					<Select placeholder="เทอมการศึกษา" data={term} value={selectedTerm} onChange={setSelectedTerm} />
				</Group>
			</Group>
			<Space h="md" />
			<ScrollArea type="scroll" offsetScrollbars style={{ borderRadius: "8px", border: "1px solid #e0e0e0" }}>
				<Table horizontalSpacing="sm" verticalSpacing="sm" highlightOnHover>
					<Table.Thead>
						<Table.Tr>
							<Table.Th>รหัสหมู่เรียน</Table.Th>
							<Table.Th>เทอมการศึกษา</Table.Th>
							<Table.Th>คำขอ</Table.Th>
							<Table.Th>ดำเนินการ</Table.Th>
						</Table.Tr>
					</Table.Thead>
					<Table.Tbody>
						{Object.entries(filteredGroup).map(([groupId, students]) => {
							const termGroups = [...new Set(students.map((s) => s.term))].sort((a, b) => {
								const [termA, yearA] = a.split("/").map(Number);
								const [termB, yearB] = b.split("/").map(Number);

								if (yearA !== yearB) return yearB - yearA; // ปีใหม่สุดก่อน
								return termB - termA; // เทอมมากไปน้อย
							});

							return termGroups.map((term) => {
								const reqType = students.find((s) => s.term === term)?.request_type;
								return (
									<Table.Tr key={`${groupId}-${term}`}>
										<Table.Td>{groupId}</Table.Td>
										<Table.Td>{term}</Table.Td>
										<Table.Td>{reqType}</Table.Td>
										<Table.Td>
											<PDFExamResultsPrint data={{ [groupId]: students.filter((s) => s.term === term) }} />
										</Table.Td>
									</Table.Tr>
								);
							});
						})}
					</Table.Tbody>
				</Table>
			</ScrollArea>
		</Box>
	);
};

export default ExamResultsPrint;
