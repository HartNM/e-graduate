//พิมพ์ใบรายชื่อผู้มีสิทธิสอบความรู้ทางภาษาอังกฤษ
import { Box, Text, ScrollArea, Table, Group, Space, Select, Button, TextInput } from "@mantine/core";
import { useState, useEffect, useMemo } from "react";
import * as XLSX from "xlsx";
import PdfPrintExam from "../../component/PDF/PdfPrintExam";
import ModalInform from "../../component/Modal/ModalInform";
const BASE_URL = import.meta.env.VITE_API_URL;

const PrintExam = () => {
	const [inform, setInform] = useState({ open: false, type: "", message: "" });
	const notify = (type, message) => setInform({ open: true, type, message });
	const close = () => setInform((s) => ({ ...s, open: false }));

	const token = localStorage.getItem("token");

	const [term, setTerm] = useState([]);
	const [selectedTerm, setSelectedTerm] = useState("");
	const [search, setSearch] = useState("");
	const [request, setRequest] = useState([]);
	const [filterLevel, setFilterLevel] = useState("");

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
		if (!selectedTerm) return;

		const getRequest = async () => {
			try {
				const requestReq = await fetch(`${BASE_URL}/api/allRequestEngTest`, {
					method: "POST",
					headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
					body: JSON.stringify({ term: selectedTerm }),
				});
				const requestData = await requestReq.json();
				if (!requestReq.ok) throw new Error(requestData.message);
				setRequest(requestData);
			} catch (e) {
				notify("error", e.message);
				console.error("Error fetching requestExamAll:", e);
			}
		};
		getRequest();
	}, [selectedTerm]);

	const filteredData = useMemo(() => {
		return request.filter((p) => {
			const filterStatus = p.status === "5";
			const matchesSearch = [p.student_name, p.student_id].join(" ").toLowerCase().includes(search.toLowerCase());

			let matchesLevel = true;
			if (filterLevel !== "") {
				const groupId = String(p.study_group_id);
				const subCode = groupId.substring(2, 5);

				if (filterLevel === "ปริญญาเอก") {
					matchesLevel = subCode === "427";
				} else if (filterLevel === "ปริญญาโท") {
					matchesLevel = subCode !== "427";
				}
			}

			return filterStatus && matchesSearch && matchesLevel;
		});
	}, [request, search, filterLevel]);

	const handleExport = () => {
		const mainHeader = [[`รายชื่อผู้มีสิทธิสอบความรู้ทางภาษาอังกฤษ ปีการศึกษา ${selectedTerm}`]];
		const subHeader = [["รหัสนักศึกษา", "ชื่อ-สกุล", "คำขอ", "สาขาวิชา", "ระดับการศึกษา"]];

		const dataRows = filteredData.map((item) => [item.student_id, item.student_name, item.request_type, item.major_name, item.education_level]);

		const ws = XLSX.utils.aoa_to_sheet([]);
		XLSX.utils.sheet_add_aoa(ws, mainHeader, { origin: "A1" });
		XLSX.utils.sheet_add_aoa(ws, subHeader, { origin: "A2" });
		XLSX.utils.sheet_add_aoa(ws, dataRows, { origin: "A3" });

		ws["!merges"] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 4 } }];

		const fileName = `รายชื่อผู้มีสิทธิสอบความรู้ทางภาษาอังกฤษ_${selectedTerm}.xlsx`;
		const wb = XLSX.utils.book_new();
		XLSX.utils.book_append_sheet(wb, ws, "StudentsData");
		XLSX.writeFile(wb, fileName);
	};

	return (
		<Box>
			<ModalInform opened={inform.open} onClose={close} message={inform.message} type={inform.type} />
			<Text size="1.5rem" fw={900} mb="md">
				พิมพ์ใบรายชื่อผู้มีสิทธิสอบความรู้ทางภาษาอังกฤษ
			</Text>
			<Group justify="space-between">
				<Group>
					<TextInput placeholder="ค้นหา ชื่่อ รหัสนักศึกษา" value={search} onChange={(e) => setSearch(e.target.value)} />
					<Select placeholder="เทอมการศึกษา" data={term} value={selectedTerm} allowDeselect={false} onChange={setSelectedTerm} style={{ width: 80 }}/>
					<Select placeholder="ระดับการศึกษา" data={["ปริญญาโท", "ปริญญาเอก"]} value={filterLevel} onChange={setFilterLevel} clearable style={{ width: 150 }} />
				</Group>
				<Group>
					<Button size="xs" color="green" onClick={handleExport} disabled={filteredData.length === 0}>
						Export Excel
					</Button>
					<PdfPrintExam data={filteredData} typeRQ={"2"} />
				</Group>
			</Group>

			<Space h="md" />
			<ScrollArea type="scroll" offsetScrollbars style={{ borderRadius: "8px", border: "1px solid #e0e0e0" }}>
				<Table horizontalSpacing="sm" verticalSpacing="sm" highlightOnHover>
					<Table.Thead>
						<Table.Tr>
							<Table.Th>รหัสนักศึกษา</Table.Th>
							<Table.Th>ชื่อ</Table.Th>
							<Table.Th>คำขอ</Table.Th>
						</Table.Tr>
					</Table.Thead>
					<Table.Tbody>
						{filteredData.map((item) => (
							<Table.Tr key={item.request_eng_test_id}>
								<Table.Td>{item.student_id}</Table.Td>
								<Table.Td>{item.student_name}</Table.Td>
								<Table.Td>{item.request_type}</Table.Td>
							</Table.Tr>
						))}
					</Table.Tbody>
				</Table>
			</ScrollArea>
		</Box>
	);
};

export default PrintExam;
