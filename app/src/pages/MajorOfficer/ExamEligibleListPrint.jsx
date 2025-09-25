//กรอกผลการสอบ
import { Box, Text, ScrollArea, Table, Group, Space, Select } from "@mantine/core";
import { useState, useEffect } from "react";
import SignatureForm from "../../component/PDF/SignatureForm";
import ModalInform from "../../component/Modal/ModalInform";

const ExamEligibleListPrint = () => {
	const [inform, setInform] = useState({ open: false, type: "", message: "" });
	const notify = (type, message) => setInform({ open: true, type, message });
	const close = () => setInform((s) => ({ ...s, open: false }));

	const token = localStorage.getItem("token");

	const [term, setTerm] = useState([]);

	const [group, setGroup] = useState([]);
	useEffect(() => {
		const fetchTermAndData = async () => {
			try {
				const res = await fetch("http://localhost:8080/api/allRequestExamInfo", {
					method: "POST",
					headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
				});
				const data = await res.json();
				if (!res.ok) throw new Error(data.message);

				// เก็บ term ทั้งหมด
				setTerm(data.map((item) => item.term));

				// หาวันนี้
				const today = new Date();

				// หา term ที่อยู่ในช่วง open-close
				let currentTerm = data.find((item) => {
					const open = new Date(item.term_open_date);
					const close = new Date(item.term_close_date);
					return today >= open && today <= close;
				});

				if (!currentTerm && data.length > 0) {
					// ถ้าไม่เจอ currentTerm → เลือกเทอมล่าสุดจาก close_date
					currentTerm = [...data].sort((a, b) => new Date(b.term_close_date) - new Date(a.term_close_date))[0];
				}

				if (currentTerm) {
					setSelectedTerm(currentTerm.term);
				}
			} catch (e) {
				notify("error", e.message);
			}
			try {
				const res = await fetch("http://localhost:8080/api/allExamEligibleListPrint", {
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
			<ModalInform opened={inform.open} onClose={close} message={inform.message} type={inform.type} />

			<Text size="1.5rem" fw={900} mb="md">
				พิมพ์ใบรายชื่อผู้มีสิทธิสอบประมวลความรู้/สอบวัดคุณสมบัติ
			</Text>
			<Group justify="space-between">
				<Group>
					<Select placeholder="ชนิดคำขอ" data={["ขอสอบประมวลความรู้", "ขอสอบวัดคุณสมบัติ"]} value={selectedType} onChange={setSelectedType} />
					<Select placeholder="เทอมการศึกษา" data={term} value={selectedTerm} allowDeselect={false} onChange={setSelectedTerm} />
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

export default ExamEligibleListPrint;
