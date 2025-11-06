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

	const [selectedTerm, setSelectedTerm] = useState("");
	const [selectedType, setSelectedType] = useState("");
	const [selectedStatus, setSelectedStatus] = useState(JSON.stringify([5]));

	const statusData = [
		{ value: JSON.stringify([5]), label: "อนุญาต" }, // เก็บ Array เป็น string
		{ value: JSON.stringify([6]), label: "ไม่อนุญาต" },
		{ value: JSON.stringify([1, 2, 3, 4]), label: "กำลังดำเนินการ" },
	];

	useEffect(() => {
		const getTerm = async () => {
			try {
				const termInfoReq = await fetch("http://localhost:8080/api/allRequestExamInfo", {
					method: "POST",
					headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
				});
				const termInfodata = await termInfoReq.json();
				if (!termInfoReq.ok) throw new Error(termInfodata.message);
				setTerm(termInfodata.map((item) => item.term));
				console.log(termInfodata);

				const today = new Date();
				// หา term ที่อยู่ในช่วง open-close
				let currentTerm = termInfodata.find((item) => {
					const open = new Date(item.term_open_date);
					const close = new Date(item.term_close_date);
					return today >= open && today <= close;
				});
				if (!currentTerm && termInfodata.length > 0) {
					// ถ้าไม่เจอ currentTerm → เลือกเทอมล่าสุดจาก close_date
					currentTerm = [...termInfodata].sort((a, b) => new Date(b.term_close_date) - new Date(a.term_close_date))[0];
				}
				if (currentTerm) {
					setSelectedTerm(currentTerm.term);
				} else {
					// แจ้งเตือน หรือ set ค่า default ถ้าไม่มีเทอมเลย
					console.warn("ไม่พบข้อมูลเทอม");
					// setSelectedTerm(null); // หรือค่า default
				}
			} catch (e) {
				notify("error", e.message);
				console.error("Error fetching allRequestExamInfo:", e);
			}
		};
		getTerm();
	}, []);

	useEffect(() => {
		if (!selectedTerm) return;
		console.log(selectedTerm);

		const getRequest = async () => {
			try {
				const requestReq = await fetch("http://localhost:8080/api/allExamEligibleListPrint", {
					method: "POST",
					headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
					body: JSON.stringify({ term: selectedTerm }),
				});
				const requestData = await requestReq.json();
				if (!requestReq.ok) throw new Error(requestData.message);
				setGroup(requestData);

				console.log("all request :", requestData);
			} catch (e) {
				notify("error", e.message);
				console.error("Error fetching requestExamAll:", e);
			}
		};
		getRequest();
	}, [selectedTerm]);

	const filteredGroup = (() => {
		let statusNumbersToFilter = null;

		if (selectedStatus) {
			try {
				statusNumbersToFilter = JSON.parse(selectedStatus);
			} catch (e) {
				console.error("Error parsing selectedStatus:", e);
			}
		}

		if (!selectedType && !selectedTerm && !selectedStatus) {
			return group;
		}

		return Object.fromEntries(
			Object.entries(group)
				.map(([groupId, students]) => [
					groupId,
					students.filter((student) => {
						const studentStatusNumber = parseInt(student.status, 10);

						const termMatch = !selectedTerm || student.term === selectedTerm;
						const typeMatch = !selectedType || student.request_type === selectedType;

						const statusMatch = !selectedStatus || (statusNumbersToFilter && statusNumbersToFilter.includes(studentStatusNumber));

						return termMatch && typeMatch && statusMatch;
					}),
				])
				.filter(([groupId, students]) => students.length > 0)
		);
	})();

	/* const filteredGroup =
		selectedType || selectedTerm || selectedStatus
			? Object.fromEntries(
					Object.entries(group).map(([groupId, students]) => [
						groupId,
						students.filter((student) => {
							return (!selectedTerm || student.term === selectedTerm) && (!selectedType || student.request_type === selectedType);
						}),
					])
			  )
			: group; */

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
					<Select placeholder="สถานะ" data={statusData} value={selectedStatus} onChange={setSelectedStatus} />
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
							<Table.Th>สถานะ</Table.Th>
						</Table.Tr>
					</Table.Thead>
					<Table.Tbody>
						{Object.entries(filteredGroup).map(([groupId, students]) =>
							students.map((student) => (
								<Table.Tr key={student.id}>
									<Table.Td>{student.term}</Table.Td>
									<Table.Td>{student.name}</Table.Td>
									<Table.Td>{student.request_type}</Table.Td>
									<Table.Td>{student.status_text}</Table.Td>
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
