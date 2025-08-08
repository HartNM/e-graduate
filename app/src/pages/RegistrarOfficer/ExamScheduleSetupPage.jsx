//กำหนดวันสอบประมวลความรู้/สอบวัดคุณสมบัต
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
			term_year: "",
			open_date: null,
			close_date: null,
			exam_date: null,
		},
		validate: {
			term_year: (value) => (value.trim().length > 0 ? null : "กรุณาระบุปีการศึกษา"),
			open_date: (value) => (value ? null : "กรุณาระบุวันที่เปิด"),
			close_date: (value) => {
				if (!value) return "กรุณาระบุวันที่ปิด";
				if (Form.values.open_date && value < Form.values.open_date) {
					return "วันที่ปิดต้องไม่น้อยกว่าวันเปิด";
				}
				return null;
			},
			exam_date: (value) => {
				if (!value) return "กรุณาระบุวันที่สอบ";
				if (Form.values.close_date && value < Form.values.close_date) {
					return "วันที่สอบต้องไม่น้อยกว่าวันปิดรับ";
				}
				return null;
			},
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
		console.log(url[modalType]);
		console.log(Form.values);
		try {
			const requestRes = await fetch(url[modalType], {
				method: "POST",
				headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
				body: JSON.stringify(Form.values),
			});
			const requestData = await requestRes.json();
			if (!requestRes.ok) {
				throw new Error(requestData.message);
			}
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

	const Rows = requestExamInfo.map((item) => (
		<Table.Tr key={item.request_exam_info_id}>
			<Table.Td>{item.term_year}</Table.Td>
			<Table.Td>{item.open_date}</Table.Td>
			<Table.Td>{item.close_date}</Table.Td>
			<Table.Td>{item.exam_date}</Table.Td>
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
			<Modal opened={openedPickDate} onClose={() => setOpenPickDate(false)} title={modalType === "delete" ? "ลบวันสอบประมวลความรู้/สอบวัดคุณสมบัต" : "กำหนดวันสอบประมวลความรู้/สอบวัดคุณสมบัต"} centered>
				<form onSubmit={Form.onSubmit(handleSubmit)}>
					<TextInput label="ปีการศึกษา" placeholder="กรอกปีการศึกษา" withAsterisk {...Form.getInputProps("term_year")} />
					<DatePickerInput label="วันเปิดการยื่นคำร้อง" placeholder="เลือกวัน" firstDayOfWeek={0} valueFormat="DD MMMM YYYY" withAsterisk {...Form.getInputProps("open_date")} />
					<DatePickerInput label="วันปิดการยื่นคำร้อง" placeholder="เลือกวัน" firstDayOfWeek={0} valueFormat="DD MMMM YYYY" withAsterisk minDate={Form.values.open_date} disabled={Form.values.open_date ? false : true} {...Form.getInputProps("close_date")} />
					<DatePickerInput label="วันสอบ" placeholder="เลื่อกวัน" firstDayOfWeek={0} valueFormat="DD MMMM YYYY" withAsterisk minDate={Form.values.close_date} disabled={Form.values.close_date ? false : true} {...Form.getInputProps("exam_date")} />
					<Space h="md" />
					<Button color={modalType === "delete" ? "red" : "green"} type="submit" fullWidth>
						{modalType === "delete" ? "ลบ" : "บันทึก"}
					</Button>
				</form>
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
			<ScrollArea type="scroll" offsetScrollbars styles={{ viewport: { padding: 0 } }} style={{ borderRadius: "8px", border: "1px solid #e0e0e0" }}>
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
