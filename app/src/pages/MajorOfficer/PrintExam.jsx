//กรอกผลการสอบ
import { Box, Text, ScrollArea, Table, Group, Space, Select } from "@mantine/core";
import { useState, useEffect } from "react";
import PdfPrintExam from "../../component/PDF/PdfPrintExam";
import ModalInform from "../../component/Modal/ModalInform";

const PrintExam = () => {
	const [inform, setInform] = useState({ open: false, type: "", message: "" });
	const notify = (type, message) => setInform({ open: true, type, message });
	const close = () => setInform((s) => ({ ...s, open: false }));

	const token = localStorage.getItem("token");

	const [term, setTerm] = useState([]);

	const [selectedTerm, setSelectedTerm] = useState("");
	const [selectedType, setSelectedType] = useState("");

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

	const [request, setRequest] = useState([]);

	useEffect(() => {
		if (!selectedTerm) return;
		console.log(selectedTerm);

		const getRequest = async () => {
			try {
				const requestReq = await fetch("http://localhost:8080/api/allPrintExam", {
					method: "POST",
					headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
					body: JSON.stringify({ term: selectedTerm }),
				});
				const requestData = await requestReq.json();
				if (!requestReq.ok) throw new Error(requestData.message);
				setRequest(requestData);

				console.log("all request :", requestData);
			} catch (e) {
				notify("error", e.message);
				console.error("Error fetching requestExamAll:", e);
			}
		};
		getRequest();
	}, [selectedTerm]);

	const filteredData = request.filter((p) => {
		const matchesType = selectedType ? p.request_type === selectedType : true;
		return matchesType;
	});

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
					<PdfPrintExam data={filteredData} />
				</Box>
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
							<Table.Tr key={item.request_exam_id}>
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
