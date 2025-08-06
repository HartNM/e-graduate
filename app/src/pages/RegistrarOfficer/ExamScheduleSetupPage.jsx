//กำหนดวันสอบประมวลความรู้/สอบวัดคุณสมบัต
import { useState, useEffect } from "react";
import { Box, Text, ScrollArea, Table, Button, Modal, Group, Flex, Space } from "@mantine/core";
import { DatePickerInput } from "@mantine/dates";
import ModalInform from "../../component/Modal/ModalInform";

const ExamScheduleSetupPage = () => {
	const [reloadTable, setReloadTable] = useState(false);
	const [selectedRow, setSelectedRow] = useState(null);
	const [modalType, setModalType] = useState("");
	const [openedPickDate, setOpenPickDate] = useState(false);

	const token = localStorage.getItem("token");
	const [requestExamInfo, setRequestExamInfo] = useState([]);
	const [open_date, setOpen_date] = useState(null);
	const [close_date, setClose_date] = useState(null);
	const [exam_date, setExam_date] = useState(null);

	const [openError, setOpenError] = useState("");
	const [closeError, setCloseError] = useState("");
	const [examError, setExamError] = useState("");

	const [openInform, setOpenInform] = useState(false);
	const [informMessage, setInformMessage] = useState("");
	const [informtype, setInformtype] = useState("");

	useEffect(() => {
		const fetchRequestExamInfoAll = async () => {
			try {
				const requestRes = await fetch("http://localhost:8080/api/requestExamInfoAll", {
					method: "POST",
					headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
				});
				const requestData = await requestRes.json();
				setRequestExamInfo(requestData);
				console.log(requestData);
			} catch (err) {
				setInformtype("error");
				setInformMessage("เกิดข้อผิดพลาดในการเชื่อมต่อกับระบบ");
				setOpenInform(true);
				console.error("Error fetch requestExamInfoAll:", err);
			}
			setReloadTable(false);
		};
		fetchRequestExamInfoAll();
	}, [reloadTable]);

	const handleAddInfo = async () => {
		setOpenError("");
		setCloseError("");
		setExamError("");
		if (!open_date || !close_date || !exam_date) {
			if (!open_date) setOpenError("กรุณาระบุวันที่");
			if (!close_date) setCloseError("กรุณาระบุวันที่");
			if (!exam_date) setExamError("กรุณาระบุวันที่");
			return;
		}
		if (open_date > close_date) {
			setOpenError("วันเปิดต้องน้อยกว่าวันปิด");
			setCloseError("วันปิดต้องมากกว่าวันเปิด");
			return;
		}
		if (close_date > exam_date) {
			setCloseError("วันปิดต้องน้อยกว่าวันสอบ");
			setExamError("วันสอบต้องมากกว่าวันปิด");
			return;
		}
		try {
			const requestRes = await fetch("http://localhost:8080/api/addRequestExamInfo", {
				method: "POST",
				headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
				body: JSON.stringify({
					open_date: open_date,
					close_date: close_date,
					exam_date: exam_date,
				}),
			});
			const requestData = await requestRes.json();
			if (requestRes.ok) {
				setInformtype("success");
			} else {
				setInformtype("error");
			}
			setInformMessage(requestData.message);
			setOpenInform(true);
			setReloadTable(true);
			setOpenPickDate(false);
		} catch (err) {
			setInformtype("error");
			setInformMessage("เกิดข้อผิดพลาดในการเชื่อมต่อกับระบบ");
			setOpenInform(true);
			console.error("Error fetch addRequestExamInfo:", err);
		}
	};

	const handleEditInfo = async () => {
		setOpenError("");
		setCloseError("");
		setExamError("");
		if (open_date > close_date) {
			setOpenError("วันเปิดต้องน้อยกว่าวันปิด");
			setCloseError("วันปิดต้องมากกว่าวันเปิด");
			return;
		}
		if (close_date > exam_date) {
			setCloseError("วันปิดต้องน้อยกว่าวันสอบ");
			setExamError("วันสอบต้องมากกว่าวันปิด");
			return;
		}
		try {
			const requestRes = await fetch("http://localhost:8080/api/requestExamInfoEdit", {
				method: "POST",
				headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
				body: JSON.stringify({
					open_date: open_date,
					close_date: close_date,
					exam_date: exam_date,
					request_exam_info_id: selectedRow.request_exam_info_id,
				}),
			});
			const requestData = await requestRes.json();
			if (requestRes.ok) {
				setInformtype("success");
			} else {
				setInformtype("error");
			}
			setInformMessage(requestData.message);
			setOpenInform(true);
			setReloadTable(true);
			setOpenPickDate(false);
		} catch (err) {
			setInformtype("error");
			setInformMessage("เกิดข้อผิดพลาดในการเชื่อมต่อกับระบบ");
			setOpenInform(true);
			console.error("Error fetch addRequestExamInfo:", err);
		}
	};

	const Rows = requestExamInfo.map((item) => (
		<Table.Tr key={item.request_exam_info_id}>
			<Table.Td>{item.open_date}</Table.Td>
			<Table.Td>{item.close_date}</Table.Td>
			<Table.Td>{item.exam_date}</Table.Td>
			<Table.Td>
				<Group>
					<Button
						size="xs"
						onClick={() => {
							setSelectedRow(item);
							setOpenPickDate(true);
							setModalType("Edit");
							setOpen_date(new Date(item.open_date));
							setClose_date(new Date(item.close_date));
							setExam_date(new Date(item.exam_date));
							setOpenError("");
							setCloseError("");
							setExamError("");
						}}
					>
						แก้ไข
					</Button>
				</Group>
			</Table.Td>
		</Table.Tr>
	));
	return (
		<Box>
			<ModalInform opened={openInform} onClose={() => setOpenInform(false)} message={informMessage} type={informtype} />
			<Modal opened={openedPickDate} onClose={() => setOpenPickDate(false)} title={modalType === "Add" ? "กำหนดวันสอบประมวลความรู้/สอบวัดคุณสมบัต" : "แก้ไขวันสอบประมวลความรู้/สอบวัดคุณสมบัต"} centered>
				<Box>
					<DatePickerInput label="เลือกวันเปิดการยื่นคำร้อง" placeholder="เลือกวัน" firstDayOfWeek={0} valueFormat="DD MMMM YYYY" value={open_date} onChange={setOpen_date} error={openError} withAsterisk />
					<DatePickerInput label="เลือกวันปิดการยื่นคำร้อง" placeholder="เลือกวัน" firstDayOfWeek={0} valueFormat="DD MMMM YYYY" value={close_date} onChange={setClose_date} minDate={open_date} disabled={open_date ? false : true} error={closeError} withAsterisk />
					<DatePickerInput label="เลื่อกวันสอบ" placeholder="เลื่อกวัน" firstDayOfWeek={0} valueFormat="DD MMMM YYYY" value={exam_date} onChange={setExam_date} minDate={close_date} disabled={close_date ? false : true} error={examError} withAsterisk />
				</Box>
				<Space h="sm" />
				<Flex justify="flex-end">
					<Button
						size="xs"
						color="green"
						onClick={() => {
							if (modalType === "Add") {
								handleAddInfo();
							} else {
								handleEditInfo();
							}
						}}
					>
						บันทึก
					</Button>
				</Flex>
			</Modal>

			<Text size="1.5rem" fw={900} mb="md">
				กำหนดวันสอบประมวลความรู้/สอบวัดคุณสมบัต
			</Text>
			<Space h="xl" />
			<Box>
				<Flex justify="flex-end">
					<Button
						size="xs"
						onClick={() => {
							setOpenPickDate(true);
							setModalType("Add");
							setOpen_date(null);
							setClose_date(null);
							setExam_date(null);
							setOpenError("");
							setCloseError("");
							setExamError("");
						}}
					>
						กรอกข้อมูล
					</Button>
				</Flex>
			</Box>
			<Space h="xl" />
			<ScrollArea type="scroll" offsetScrollbars styles={{ viewport: { padding: 0 } }} style={{ borderRadius: "8px", border: "1px solid #e0e0e0" }}>
				<Table horizontalSpacing="sm" verticalSpacing="sm" highlightOnHover>
					<Table.Thead>
						<Table.Tr>
							<Table.Th>วันเปิดการยื่นคำร้อง</Table.Th>
							<Table.Th>วันปิดการยื่นคำร้อง</Table.Th>
							<Table.Th>วันสอบ</Table.Th>
							<Table.Th>จัดการ</Table.Th>
						</Table.Tr>
					</Table.Thead>
					<Table.Tbody>{Rows}</Table.Tbody>
				</Table>
			</ScrollArea>
		</Box>
	);
};

export default ExamScheduleSetupPage;
