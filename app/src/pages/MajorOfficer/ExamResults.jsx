//ผลการสอบประมวลความรู้/สอบวัดคุณสมบัติ
import { Box, Text, ScrollArea, Table, Group, Button, Space, Modal, Checkbox, Select } from "@mantine/core";
import { useState, useEffect } from "react";
import { useForm } from "@mantine/form";
import ModalInform from "../../component/Modal/ModalInform";
import PDFExamPrint from "../../component/PDF/PdfExamResultsPrint";
import * as XLSX from "xlsx";
const BASE_URL = import.meta.env.VITE_API_URL;

const ExamResults = () => {
	const [inform, setInform] = useState({ open: false, type: "", message: "" });
	const notify = (type, message) => setInform({ open: true, type, message });
	const close = () => setInform((s) => ({ ...s, open: false }));

	const [openModal, setOpenModal] = useState(false);
	const token = localStorage.getItem("token");
	const [term, setTerm] = useState([]);
	const [reloadTable, setReloadTable] = useState(false);
	const [group, setGroup] = useState([]);
	const [selectedTerm, setSelectedTerm] = useState("");
	const [selectedType, setSelectedType] = useState("");
	const [selectedGroupId, setSelectedGroupId] = useState("");
	const form = useForm({});

	const parseTerm = (termStr) => {
		const [semester, year] = termStr.split("/").map(Number);
		return year * 10 + semester;
	};
	const statusColor = { ผ่าน: "green", ไม่ผ่าน: "red", ขาดสอบ: "gray" };

	useEffect(() => {
		const fetchTerm = async () => {
			try {
				const res = await fetch(`${BASE_URL}/api/allRequestExamInfo`, {
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
		};
		fetchTerm();
	}, []);

	useEffect(() => {
		const fetchData = async () => {
			try {
				const res = await fetch(`${BASE_URL}/api/AllExamResults`, {
					method: "POST",
					headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
				});
				const data = await res.json();
				if (!res.ok) throw new Error(data.message);
				setGroup(data);
			} catch (e) {
				notify("error", e.message);
			}
			setReloadTable(false);
		};
		fetchData();
	}, [reloadTable]);

	const handleFormClick = (students) => {
		const groupId = students[0].study_group_id;
		const term = students[0].term;
		setSelectedGroupId({ [groupId]: { [term]: students } });
		const initial = {};
		students.forEach((s) => {
			initial[s.student_id] = s.exam_results ?? "ผ่าน";
		});
		form.setValues(initial);
	};

	const handleSaveExamResults = async () => {
		try {
			const req = await fetch(`${BASE_URL}/api/AddExamResults`, {
				method: "POST",
				headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
				body: JSON.stringify({ ...form.values, term: selectedTerm }),
			});
			const res = await req.json();
			if (!req.ok) throw new Error(res.message);
			notify("success", res.message);
			setOpenModal(false);
			setReloadTable(true);
			setSelectedGroupId("");
		} catch (e) {
			notify("error", e.message);
		}
	};

	const exportToExcel = (studentsToExport, fileName = "ผลการสอบ.xlsx") => {
		const dataForSheet = studentsToExport.map((s) => ({
			รหัสนักศึกษา: s.student_id,
			"ชื่อ-สกุล": s.name,
			ผลสอบ: s.exam_results,
			//วันที่สอบ: s.thesis_exam_date ? new Date(s.thesis_exam_date).toLocaleDateString("th-TH") : "",
			หมู่เรียน: s.study_group_id,
			เทอม: s.term,
		}));
		const ws = XLSX.utils.json_to_sheet(dataForSheet);
		const wb = XLSX.utils.book_new();
		XLSX.utils.book_append_sheet(wb, ws, "ผลการสอบ");
		XLSX.writeFile(wb, fileName);
	};

	const renderStudentRows = (selectedGroupId, form, statusColor, withCheckbox = false) => {
		return Object.values(selectedGroupId).flatMap((terms) =>
			Object.values(terms).flatMap((students) =>
				students.map((s) => (
					<Table.Tr key={s.student_id}>
						<Table.Td>{s.student_id}</Table.Td>
						<Table.Td>{s.name}</Table.Td>
						<Table.Td style={{ textAlign: "center" }}>
							{withCheckbox ? (
								<Group justify="center">
									{["ผ่าน", "ไม่ผ่าน", "ขาดสอบ"].map((status) => (
										<Checkbox key={status} color={statusColor[status]} checked={form.values[s.student_id] === status} onChange={() => form.setFieldValue(s.student_id, status)} label={status} />
									))}
								</Group>
							) : (
								<Text c={statusColor[form.values[s.student_id]]}>{form.values[s.student_id]}</Text>
							)}
						</Table.Td>
					</Table.Tr>
				))
			)
		);
	};
	return (
		<Box>
			<ModalInform opened={inform.open} onClose={close} message={inform.message} type={inform.type} />
			<Text size="1.5rem" fw={900} mb="md">
				กรอกผลการสอบประมวลความรู้/สอบวัดคุณสมบัติ
			</Text>

			{!selectedGroupId ? (
				<Box>
					<Group>
						<Select placeholder="ชนิดคำขอ" data={["ขอสอบประมวลความรู้", "ขอสอบวัดคุณสมบัติ"]} value={selectedType} onChange={setSelectedType} />
						<Select placeholder="เทอมการศึกษา" data={term} value={selectedTerm} onChange={setSelectedTerm} />
					</Group>
					<Space h="md" />
					<ScrollArea type="scroll" offsetScrollbars style={{ borderRadius: 8, border: "1px solid #e0e0e0" }}>
						<Table highlightOnHover>
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
										.filter((i) => (!selectedTerm || i.term === selectedTerm) && (!selectedType || i.request_type === selectedType))
										.sort((a, b) => parseTerm(b.term) - parseTerm(a.term))
										.reduce((acc, i) => {
											const key = `${i.study_group_id}-${i.term}`;
											if (!acc[key]) acc[key] = [];
											acc[key].push(i);
											return acc;
										}, {})
								).map(([key, students]) => {
									const allFilled = students.every((s) => s.exam_results != null);
									return (
										<Table.Tr key={key}>
											<Table.Td>{students[0].study_group_id}</Table.Td>
											<Table.Td>{students[0].term}</Table.Td>
											<Table.Td>{[...new Set(students.map((s) => s.request_type))].join(", ")}</Table.Td>
											<Table.Td>
												<Group>
													<Button size="xs" color={allFilled ? "yellow" : "blue"} onClick={() => handleFormClick(students)}>
														{allFilled ? "แก้ไข" : "กรอก"}
													</Button>
													<Button size="xs" onClick={() => PDFExamPrint(students)}>
														พิมพ์
													</Button>
													<Button size="xs" color="teal" onClick={() => exportToExcel(students, `ผลการสอบประมวลความรู้_วัดคุณสมบัติ_${students[0].study_group_id}.xlsx`)}>
														Export Excel
													</Button>
												</Group>
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
					<Group justify="flex-end">
						<Button color="red" onClick={() => setSelectedGroupId("")}>
							ยกเลิก
						</Button>
						<Button type="submit" color="green">
							บันทึก
						</Button>
					</Group>
					<Space h="md" />
					<ScrollArea type="scroll" offsetScrollbars style={{ borderRadius: 8, border: "1px solid #e0e0e0" }}>
						<Table highlightOnHover>
							<Table.Thead>
								<Table.Tr>
									<Table.Th>รหัสนักศึกษา</Table.Th>
									<Table.Th>ชื่อ</Table.Th>
									<Table.Th>ผลสอบ</Table.Th>
								</Table.Tr>
							</Table.Thead>
							<Table.Tbody>{renderStudentRows(selectedGroupId, form, statusColor, true)}</Table.Tbody>
						</Table>
					</ScrollArea>
				</form>
			)}

			<Modal opened={openModal} onClose={() => setOpenModal(false)} title="รายชื่อนักเรียน" centered closeOnClickOutside={false}>
				<Table>
					<Table.Thead>
						<Table.Tr>
							<Table.Th>รหัสนักเรียน</Table.Th>
							<Table.Th>ชื่อ-สกุล</Table.Th>
							<Table.Th style={{ textAlign: "center" }}>ผลสอบ</Table.Th>
						</Table.Tr>
					</Table.Thead>
					<Table.Tbody>{renderStudentRows(selectedGroupId, form, statusColor, false)}</Table.Tbody>
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
