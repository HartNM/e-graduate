//กำหนดวันสอบประมวลความรู้/สอบวัดคุณสมบัติ
import { useState, useEffect } from "react";
import { Box, Text, ScrollArea, Table, Button, Modal, Group, Flex, Space, TextInput } from "@mantine/core";
import { DatePickerInput } from "@mantine/dates";
import ModalInform from "../../component/Modal/ModalInform";
import { useForm } from "@mantine/form";

const ExamScheduleSetupPage = () => {
	const [reloadTable, setReloadTable] = useState(false);
	const [modalType, setModalType] = useState("");
	const [openedPickDate, setOpenPickDate] = useState(false);

	const token = localStorage.getItem("token");
	const [requestExamInfo, setRequestExamInfo] = useState([]);

	const [openInform, setOpenInform] = useState(false);
	const [informMessage, setInformMessage] = useState("");
	const [informtype, setInformtype] = useState("");

	const Form = useForm({
		initialValues: {
			term: "",
			term_open_date: null,
			term_close_date: null,
			KQ_open_date: null,
			KQ_close_date: null,
			KQ_exam_date: null,
			ET_exam_date: null,
		},
		validate: {
			term: (value) => (/^\d+\/\d+$/.test(value.trim()) ? null : "กรุณากรอกในรูปแบบ เช่น 1/68"),
			term_open_date: (value) => (value ? null : "กรุณาระบุวันที่"),
			term_close_date: (value) => (value ? null : "กรุณาระบุวันที่"),
			KQ_open_date: (value) => (value ? null : "กรุณาระบุวันที่"),
			KQ_close_date: (value) => {
				if (!value) return "กรุณาระบุวันที่";
				if (Form.values.KQ_open_date && value < Form.values.KQ_open_date) {
					return "วันที่ปิดต้องไม่น้อยกว่าวันเปิด";
				}
				return null;
			},
			KQ_exam_date: (value) => {
				if (!value) return "กรุณาระบุวันที่";
				if (Form.values.KQ_close_date && value < Form.values.KQ_close_date) {
					return "วันที่สอบต้องไม่น้อยกว่าวันปิด";
				}
				return null;
			},
			ET_exam_date: (value) => (value ? null : "กรุณาระบุวันที่"),
		},
	});

	useEffect(() => {
		const fetchRequestExamInfoAll = async () => {
			try {
				const requestRes = await fetch("http://localhost:8080/api/allRequestExamInfo", {
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

	const handleSubmit = async () => {
		const url = {
			add: "http://localhost:8080/api/addRequestExamInfo",
			edit: "http://localhost:8080/api/editRequestExamInfo",
			delete: "http://localhost:8080/api/deleteRequestExamInfo",
		};
		try {
			const requestRes = await fetch(url[modalType], {
				method: "POST",
				headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
				body: JSON.stringify(Form.values),
			});
			const requestData = await requestRes.json();
			if (!requestRes.ok) throw new Error(requestData.message);
			setInformtype("success");
			setInformMessage(requestData.message);
			setOpenInform(true);
			setReloadTable(true);
			setOpenPickDate(false);
		} catch (err) {
			setInformtype("error");
			setInformMessage(err.message);
			setOpenInform(true);
			console.error("Error fetch addRequestExamInfo:", err);
		}
	};
	const formatThaiDate = (date) => {
		if (!date) return "";

		const d = new Date(date); // รองรับทั้ง Date object หรือ string
		const day = String(d.getDate()).padStart(2, "0");
		const month = String(d.getMonth() + 1).padStart(2, "0");
		const year = d.getFullYear() + 543; // แปลงเป็น พ.ศ.

		return `${day}/${month}/${year}`;
	};
	const Rows = requestExamInfo.map((item, index) => (
		<Table.Tr key={item.request_exam_info_id}>
			<Table.Td>{item.term}</Table.Td>
			<Table.Td>{formatThaiDate(item.KQ_open_date)}</Table.Td>
			<Table.Td>{formatThaiDate(item.KQ_close_date)}</Table.Td>
			<Table.Td>{formatThaiDate(item.KQ_exam_date)}</Table.Td>
			<Table.Td>
				<Group>
					<Button
						size="xs"
						color="yellow"
						onClick={() => {
							Form.setValues(item);
							setOpenPickDate(true);
							setModalType("edit");
						}}
					>
						แก้ไข
					</Button>
					<Button
						size="xs"
						color="red"
						onClick={() => {
							Form.setValues(item);
							setOpenPickDate(true);
							setModalType("delete");
						}}
					>
						ลบ
					</Button>
				</Group>
			</Table.Td>
		</Table.Tr>
	));

	return (
		<Box>
			<ModalInform opened={openInform} onClose={() => setOpenInform(false)} message={informMessage} type={informtype} />
			<Modal opened={openedPickDate} onClose={() => setOpenPickDate(false)} title={modalType === "delete" ? "ลบวันสอบประมวลความรู้/สอบวัดคุณสมบัติ" : "กำหนดวันสอบประมวลความรู้/สอบวัดคุณสมบัติ"} centered>
				<form onSubmit={Form.onSubmit(handleSubmit)}>
					<TextInput label="ปีการศึกษา" {...Form.getInputProps("term")} disabled={modalType === "delete" ? true : false} />
					<DatePickerInput label="วันเปิดภาคเรียน" firstDayOfWeek={0} valueFormat="DD MMMM YYYY" {...Form.getInputProps("term_open_date")} disabled={modalType === "delete" ? true : false} />
					<DatePickerInput label="วันปิดภาคเรียน" firstDayOfWeek={0} valueFormat="DD MMMM YYYY" {...Form.getInputProps("term_close_date")} disabled={modalType === "delete" ? true : false} />
					<DatePickerInput label="วันเปิดยื่นคำร้องสอบประมวลความรู้/สอบวัดคุณสมบัติ" firstDayOfWeek={0} valueFormat="DD MMMM YYYY" {...Form.getInputProps("KQ_open_date")} disabled={modalType === "delete" ? true : false} />
					<DatePickerInput label="วันปิดยื่นคำร้องสอบประมวลความรู้/สอบวัดคุณสมบัติ" firstDayOfWeek={0} valueFormat="DD MMMM YYYY" minDate={Form.values.KQ_open_date} {...Form.getInputProps("KQ_close_date")} disabled={modalType === "delete" ? true : false} />
					<DatePickerInput label="วันสอบประมวลความรู้/สอบวัดคุณสมบัติ" firstDayOfWeek={0} valueFormat="DD MMMM YYYY" minDate={Form.values.KQ_close_date} {...Form.getInputProps("KQ_exam_date")} disabled={modalType === "delete" ? true : false} />
					<DatePickerInput label="วันสอบความรู้ทางภาษาอังกฤษ" firstDayOfWeek={0} valueFormat="DD MMMM YYYY" {...Form.getInputProps("ET_exam_date")} disabled={modalType === "delete" ? true : false} />
					<Space h="md" />
					<Button color={modalType === "delete" ? "red" : "green"} type="submit" fullWidth>
						{modalType === "delete" ? "ลบ" : "บันทึก"}
					</Button>
				</form>
			</Modal>

			<Text size="1.5rem" fw={900} mb="md">
				กำหนดวันสอบประมวลความรู้/สอบวัดคุณสมบัติ
			</Text>
			<Space h="xl" />
			<Box>
				<Flex justify="flex-end">
					<Button
						size="xs"
						onClick={() => {
							Form.reset();
							setOpenPickDate(true);
							setModalType("add");
						}}
					>
						กรอกข้อมูล
					</Button>
				</Flex>
			</Box>
			<Space h="xl" />
			<ScrollArea type="scroll" offsetScrollbars style={{ borderRadius: "8px", border: "1px solid #e0e0e0" }}>
				<Table horizontalSpacing="sm" verticalSpacing="sm" highlightOnHover>
					<Table.Thead>
						<Table.Tr>
							<Table.Th>ปีการศึกษา</Table.Th>
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
