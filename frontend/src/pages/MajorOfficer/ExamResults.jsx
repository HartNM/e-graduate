//ผลการสอบประมวลความรู้/สอบวัดคุณสมบัติ
import { Box, Text, ScrollArea, Table, Group, Button, Space, Modal, Checkbox, Select } from "@mantine/core";
import { useState, useEffect, useMemo } from "react";
import { useForm } from "@mantine/form";
import { jwtDecode } from "jwt-decode";
import ModalInform from "../../component/Modal/ModalInform";
import PDFExamPrint from "../../component/PDF/PdfExamResultsPrint";
import * as XLSX from "xlsx";
const BASE_URL = import.meta.env.VITE_API_URL;

const ExamResults = () => {
	const token = localStorage.getItem("token");
	const { role } = useMemo(() => {
		if (!token) return { role: "" };
		try {
			return jwtDecode(token);
		} catch (error) {
			console.error("Invalid token:", error);
			return { role: "" };
		}
	}, [token]);

	const [inform, setInform] = useState({ open: false, type: "", message: "" });
	const notify = (type, message) => setInform({ open: true, type, message });
	const close = () => setInform((s) => ({ ...s, open: false }));
	const [openModal, setOpenModal] = useState(false);

	const [term, setTerm] = useState([]);
	const [reloadTable, setReloadTable] = useState(false);
	const [group, setGroup] = useState([]);
	const [selectedTerm, setSelectedTerm] = useState("");
	const [selectedType, setSelectedType] = useState("");
	const [selectedGroupId, setSelectedGroupId] = useState("");
	const [filterLevel, setFilterLevel] = useState("");

	const form = useForm({});

	const parseTerm = (termStr) => {
		const [semester, year] = termStr.split("/").map(Number);
		return year * 10 + semester;
	};
	const statusColor = { ผ่าน: "green", ไม่ผ่าน: "red", ขาดสอบ: "gray" };

	useEffect(() => {
		const getTerm = async () => {
			try {
				const termInfoReq = await fetch(`${BASE_URL}/api/allTerm`, {
					method: "POST",
					headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
				});
				const termInfodata = await termInfoReq.json();
				if (!termInfoReq.ok) throw new Error(termInfodata.message);

				setTerm(termInfodata.termList);
				setSelectedTerm(termInfodata.currentTerm);
			} catch (e) {
				notify("error", e.message);
				console.error("Error fetching allRequestExamInfo:", e);
			}
		};
		getTerm();
	}, []);

	useEffect(() => {
		const fetchData = async () => {
			try {
				const res = await fetch(`${BASE_URL}/api/AllExamResults`, {
					method: "POST",
					headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
					body: JSON.stringify({ term: selectedTerm }),
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
	}, [reloadTable, selectedTerm]);

	const filteredGroups = useMemo(() => {
		const grouped = group
			.filter((i) => {
				const matchesTerm = !selectedTerm || i.term === selectedTerm;
				const matchesType = !selectedType || i.request_type === selectedType;

				let matchesLevel = true;
				if (filterLevel && filterLevel !== "") {
					const groupIdStr = String(i.study_group_id);
					const subCode = groupIdStr.substring(2, 5);
					if (filterLevel === "ปริญญาเอก") {
						matchesLevel = subCode === "427";
					} else if (filterLevel === "ปริญญาโท") {
						matchesLevel = subCode !== "427";
					}
				}
				return matchesTerm && matchesType && matchesLevel;
			})
			.sort((a, b) => parseTerm(b.term) - parseTerm(a.term))
			.reduce((acc, i) => {
				const key = `${i.study_group_id}-${i.term}`;
				if (!acc[key]) acc[key] = [];
				acc[key].push(i);
				return acc;
			}, {});

		return Object.entries(grouped);
	}, [group, selectedTerm, selectedType, filterLevel]);

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

	const exportToExcel = (studentsToExport) => {
		if (!studentsToExport || studentsToExport.length === 0) {
			notify("error", "ไม่มีข้อมูลสำหรับ Export");
			return;
		}

		const firstRow = studentsToExport[0];
		const term = firstRow.term || "-";
		const studyGroup = firstRow.study_group_id || "-";
		const requestType = firstRow.request_type.replace("ขอสอบ", "") || "-";
		const major_name = firstRow.major_name || "-";

		const mainHeader = [[`ผลการสอบ${requestType} สาขา${major_name} หมู่เรียน ${studyGroup} ปีการศึกษา ${term}`]];
		const subHeader = [["รหัสนักศึกษา", "ชื่อ-สกุล", "ผลสอบ"]];
		const dataRows = studentsToExport.map((s) => [s.student_id, s.name, s.exam_results || "-"]);

		const ws = XLSX.utils.aoa_to_sheet([]);

		XLSX.utils.sheet_add_aoa(ws, mainHeader, { origin: "A1" });
		XLSX.utils.sheet_add_aoa(ws, subHeader, { origin: "A2" });
		XLSX.utils.sheet_add_aoa(ws, dataRows, { origin: "A3" });

		ws["!merges"] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 2 } }];
		ws["!cols"] = [{ wch: 15 }, { wch: 25 }, { wch: 10 }];

		const fileName = `ผลการสอบ${requestType}_${studyGroup}_${term}.xlsx`;
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
				)),
			),
		);
	};

	return (
		<Box>
			<ModalInform opened={inform.open} onClose={close} message={inform.message} type={inform.type} />
			<Text size="1.5rem" fw={900} mb="md">
				{role === "officer_major" ? "กรอก" : "พิมพ์"}ผลการสอบประมวลความรู้/สอบวัดคุณสมบัติ
			</Text>

			{!selectedGroupId ? (
				<Box>
					<Group>
						<Select placeholder="ชนิดคำขอ" data={["ขอสอบประมวลความรู้", "ขอสอบวัดคุณสมบัติ"]} value={selectedType} onChange={setSelectedType} clearable />
						<Select placeholder="เทอมการศึกษา" data={term} value={selectedTerm} allowDeselect={false} onChange={setSelectedTerm} style={{ width: 80 }} />
						{/* {role === "officer_major" && <Select placeholder="ระดับการศึกษา" data={["ปริญญาโท", "ปริญญาเอก"]} value={filterLevel} onChange={setFilterLevel} clearable style={{ width: 150 }} />} */}
					</Group>
					<Space h="md" />
					<ScrollArea type="scroll" offsetScrollbars style={{ borderRadius: 8, border: "1px solid #e0e0e0" }}>
						<Table highlightOnHover>
							<Table.Thead>
								<Table.Tr>
									<Table.Th>รหัสหมู่เรียน</Table.Th>
									<Table.Th>เทอมการศึกษา</Table.Th>
									<Table.Th>คำขอ</Table.Th>
									<Table.Th style={{ textAlign: "center" }}>ดำเนินการ</Table.Th>
								</Table.Tr>
							</Table.Thead>
							<Table.Tbody>
								{filteredGroups.map(([key, students]) => {
									const allFilled = students.every((s) => s.exam_results != null);
									return (
										<Table.Tr key={key}>
											<Table.Td>{students[0].study_group_id}</Table.Td>
											<Table.Td>{students[0].term}</Table.Td>
											<Table.Td>{[...new Set(students.map((s) => s.request_type))].join(", ")}</Table.Td>
											<Table.Td>
												<Group justify="center">
													{role === "officer_major" && (
														<Button size="xs" color={allFilled ? "yellow" : "blue"} onClick={() => handleFormClick(students)}>
															{allFilled ? "จัดการผลสอบ" : "กรอก"}
														</Button>
													)}
													<Button size="xs" onClick={() => PDFExamPrint(students)}>
														พิมพ์
													</Button>
													<Button size="xs" color="teal" onClick={() => exportToExcel(students)}>
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
									<Table.Th style={{ textAlign: "center" }}>ผลสอบ</Table.Th>
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
				<Group grow mt="md">
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
