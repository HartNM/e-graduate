//กรอกผลการสอบ
import { Box, Text, ScrollArea, Table, Group, Space, Select, Button } from "@mantine/core";
import { useState, useEffect } from "react";
import PDFExamResultsPrint from "../../component/PDF/PdfExamResultsPrint";

const ExamResultsPrint = () => {
	const token = localStorage.getItem("token");
	const [group, setGroup] = useState([]);
	const [term, setTerm] = useState([]);
	const [dateExam, setDateExam] = useState([]);
	const [selectedTerm, setSelectedTerm] = useState("");
	const [selectedType, setSelectedType] = useState("");

	const parseTerm = (termStr) => {
		const [semester, year] = termStr.split("/").map(Number);
		return year * 10 + semester;
	};

	useEffect(() => {
		const fetchTermAndData = async () => {
			try {
				const res = await fetch("http://localhost:8080/api/allRequestExamInfo", {
					method: "POST",
					headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
				});
				const data = await res.json();
				if (!res.ok) throw new Error(data.message);
				setTerm(data.map((item) => item.term));
				setSelectedTerm(data[0]?.term);
				setDateExam(data[0].KQ_exam_date);
			} catch (e) {
				notify("error", e.message);
			}
			try {
				const res = await fetch("http://localhost:8080/api/allExamResultsPrint", {
					method: "POST",
					headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
				});
				const data = await res.json();
				if (!res.ok) throw new Error(data.message);
				setGroup(data);
			} catch (e) {
				notify("error", e.message);
			}
		};
		fetchTermAndData();
	}, []);

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
						{Object.entries(
							group
								.filter((item) => (!selectedTerm || item.term === selectedTerm) && (!selectedType || item.request_type === selectedType))
								.sort((a, b) => parseTerm(b.term) - parseTerm(a.term))
								.reduce((acc, item) => {
									const key = `${item.study_group_id}-${item.term}`;
									if (!acc[key]) acc[key] = [];
									acc[key].push(item);
									return acc;
								}, {})
						).map(([key, students]) => (
							<Table.Tr key={key}>
								<Table.Td>{students[0].study_group_id}</Table.Td>
								<Table.Td>{students[0].term}</Table.Td>
								<Table.Td>{[...new Set(students.map((s) => s.request_type))].join(", ")}</Table.Td>
								<Table.Td>
									<Button size="xs" onClick={() => PDFExamResultsPrint(students, dateExam)}>
										พิมพ์
									</Button>
								</Table.Td>
							</Table.Tr>
						))}
					</Table.Tbody>
				</Table>
			</ScrollArea>
		</Box>
	);
};

export default ExamResultsPrint;
