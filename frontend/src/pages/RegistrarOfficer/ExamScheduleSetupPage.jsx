import { useState, useEffect } from "react";
import { Box, Text, ScrollArea, Table, Button, Modal, Group, Flex, Space, TextInput, Divider, Grid } from "@mantine/core";
import { DatePickerInput } from "@mantine/dates";
import ModalInform from "../../component/Modal/ModalInform";
import { useForm } from "@mantine/form";
const BASE_URL = import.meta.env.VITE_API_URL;

const ExamScheduleSetupPage = () => {
	const [reloadTable, setReloadTable] = useState(false);
	const [modalType, setModalType] = useState("");
	const [openedPickDate, setOpenPickDate] = useState(false);

	const token = localStorage.getItem("token");
	// state สำหรับเก็บข้อมูลที่จัดกลุ่มแล้ว เพื่อแสดงในตาราง
	const [groupedRequestExamInfo, setGroupedRequestExamInfo] = useState([]);

	const [openInform, setOpenInform] = useState(false);
	const [informMessage, setInformMessage] = useState("");
	const [informtype, setInformtype] = useState("");

	const Form = useForm({
		initialValues: {
			term: "",
			// เก็บ ID แยกกันสำหรับแต่ละกลุ่ม (ใช้ตอน Edit/Delete)
			id_old: null,
			id_new: null,

			group_old: {
				term_date_range: [null, null],
				KQ_date_range: [null, null],
				KQ_exam_date: [null, null],
				ET_exam_date: null,
			},

			group_new: {
				term_date_range: [null, null],
				KQ_date_range: [null, null],
				KQ_exam_date: [null, null],
				ET_exam_date: null,
			},
		},
		validate: {
			term: (value) => (/^\d+\/\d+$/.test(value.trim()) ? null : "กรุณากรอกในรูปแบบ เช่น 1/68"),
			// --- Validate กลุ่มปี ระหว่างปี 57-66 ---
			"group_old.term_date_range": (value) => {
				if (!value[0] || !value[1]) return "กรุณาระบุช่วงวันเปิด-ปิดภาคเรียน (ปี ระหว่างปี 57-66)";
				return null;
			},
			"group_old.KQ_date_range": (value) => {
				if (!value[0] || !value[1]) return "กรุณาระบุช่วงวันเปิด-ปิดยื่นคำร้อง (ปี ระหว่างปี 57-66)";
				return null;
			},
			"group_old.KQ_exam_date": (value, values) => {
				if (!value[0]) return "กรุณาระบุวันที่สอบ";
				if (values.group_old.KQ_date_range[1] && value[0] < values.group_old.KQ_date_range[1]) {
					return "วันที่สอบต้องไม่น้อยกว่าวันปิดยื่นคำร้อง";
				}
				return null;
			},

			// --- Validate กลุ่มปี ตั้งแต่ปี 67 ---
			"group_new.term_date_range": (value) => {
				if (!value[0] || !value[1]) return "กรุณาระบุช่วงวันเปิด-ปิดภาคเรียน (ปี ตั้งแต่ปี 67)";
				return null;
			},
			"group_new.KQ_date_range": (value) => {
				if (!value[0] || !value[1]) return "กรุณาระบุช่วงวันเปิด-ปิดยื่นคำร้อง (ปี ตั้งแต่ปี 67)";
				return null;
			},
			"group_new.KQ_exam_date": (value, values) => {
				if (!value[0]) return "กรุณาระบุวันที่สอบ";
				if (values.group_new.KQ_date_range[1] && value[0] < values.group_new.KQ_date_range[1]) {
					return "วันที่สอบต้องไม่น้อยกว่าวันปิดยื่นคำร้อง";
				}
				return null;
			},
		},
	});

	// ฟังก์ชันจัดกลุ่มข้อมูลจาก Backend (Flat Array) -> Frontend (Grouped by Term)
	const processData = (data) => {
		const groups = {};

		data.forEach((item) => {
			const term = item.term;
			if (!groups[term]) {
				groups[term] = {
					term: term,
					data_old: null, // เก็บข้อมูลดิบของ ระหว่างปี 57-66
					data_new: null, // เก็บข้อมูลดิบของ ตั้งแต่ปี 67
				};
			}

			if (item.year_book === "ระหว่างปี 57-66") {
				groups[term].data_old = item;
			} else if (item.year_book === "ตั้งแต่ปี 67") {
				groups[term].data_new = item;
			}
		});

		// แปลง Object เป็น Array เพื่อเอาไป map ใน Table
		return Object.values(groups);
	};

	useEffect(() => {
		const fetchRequestExamInfoAll = async () => {
			try {
				const requestRes = await fetch(`${BASE_URL}/api/allRequestExamInfo`, {
					method: "POST",
					headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
					// ไม่ส่ง body หรือส่ง {} เพื่อดึงทั้งหมด
					body: JSON.stringify({}),
				});
				const requestData = await requestRes.json();

				// จัดกลุ่มข้อมูลก่อน set state
				const grouped = processData(requestData);
				setGroupedRequestExamInfo(grouped);
				console.log("Grouped Data:", grouped);
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
			add: `${BASE_URL}/api/addRequestExamInfo`,
			edit: `${BASE_URL}/api/editRequestExamInfo`,
			delete: `${BASE_URL}/api/deleteRequestExamInfo`,
		};

		// เตรียมข้อมูลชุดที่ 1: ปี ระหว่างปี 57-66
		const payloadOld = {
			request_exam_info_id: Form.values.id_old, // ส่ง ID ไปถ้ามี (สำหรับ Edit/Delete)
			term: Form.values.term,
			year_book: "ระหว่างปี 57-66", // *** ระบุ year_book

			term_open_date: Form.values.group_old.term_date_range[0],
			term_close_date: Form.values.group_old.term_date_range[1],
			KQ_open_date: Form.values.group_old.KQ_date_range[0],
			KQ_close_date: Form.values.group_old.KQ_date_range[1],
			KQ_exam_date: Form.values.group_old.KQ_exam_date[0],
			KQ_exam_end_date: Form.values.group_old.KQ_exam_date[1],
			ET_exam_date: Form.values.group_old.ET_exam_date,
		};

		// เตรียมข้อมูลชุดที่ 2: ปี ตั้งแต่ปี 67
		const payloadNew = {
			request_exam_info_id: Form.values.id_new, // ส่ง ID ไปถ้ามี
			term: Form.values.term,
			year_book: "ตั้งแต่ปี 67", // *** ระบุ year_book

			term_open_date: Form.values.group_new.term_date_range[0],
			term_close_date: Form.values.group_new.term_date_range[1],
			KQ_open_date: Form.values.group_new.KQ_date_range[0],
			KQ_close_date: Form.values.group_new.KQ_date_range[1],
			KQ_exam_date: Form.values.group_new.KQ_exam_date[0],
			KQ_exam_end_date: Form.values.group_new.KQ_exam_date[1],
			ET_exam_date: Form.values.group_new.ET_exam_date,
		};

		try {
			const requests = [];

			if (modalType === "delete") {
				// กรณีลบ: ลบทั้งสองอัน (ถ้ามี id)
				if (payloadOld.request_exam_info_id) {
					requests.push(
						fetch(url.delete, {
							method: "POST",
							headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
							body: JSON.stringify({ request_exam_info_id: payloadOld.request_exam_info_id }),
						})
					);
				}
				if (payloadNew.request_exam_info_id) {
					requests.push(
						fetch(url.delete, {
							method: "POST",
							headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
							body: JSON.stringify({ request_exam_info_id: payloadNew.request_exam_info_id }),
						})
					);
				}
			} else {
				// กรณี Add หรือ Edit: ยิง 2 requests พร้อมกัน

				// Request 1: Old
				requests.push(
					fetch(url[modalType], {
						method: "POST",
						headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
						body: JSON.stringify(payloadOld),
					})
				);

				// Request 2: New
				requests.push(
					fetch(url[modalType], {
						method: "POST",
						headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
						body: JSON.stringify(payloadNew),
					})
				);
			}

			// รอให้เสร็จทุก Request
			await Promise.all(requests);

			setInformtype("success");
			setInformMessage(modalType === "delete" ? "ลบข้อมูลเรียบร้อยแล้ว" : "บันทึกข้อมูลเรียบร้อยแล้ว");
			setOpenInform(true);
			setReloadTable(true);
			setOpenPickDate(false);
		} catch (err) {
			setInformtype("error");
			setInformMessage(err.message || "เกิดข้อผิดพลาด");
			setOpenInform(true);
			console.error("Error submit:", err);
		}
	};

	const formatThaiDate = (date) => {
		if (!date) return "";
		const d = new Date(date);
		const day = String(d.getDate()).padStart(2, "0");
		const month = String(d.getMonth() + 1).padStart(2, "0");
		const year = d.getFullYear() + 543;
		return `${day}/${month}/${year}`;
	};

	// Helper ในการ map ข้อมูลลง Form
	const handleEditOrDeleteClick = (item, type) => {
		Form.setValues({
			term: item.term,

			// Map ID
			id_old: item.data_old?.request_exam_info_id || null,
			id_new: item.data_new?.request_exam_info_id || null,

			// Map Group Old (ถ้าไม่มีข้อมูลให้เป็นค่าว่าง)
			group_old: item.data_old
				? {
						term_date_range: [item.data_old.term_open_date, item.data_old.term_close_date],
						KQ_date_range: [item.data_old.KQ_open_date, item.data_old.KQ_close_date],
						KQ_exam_date: [item.data_old.KQ_exam_date, item.data_old.KQ_exam_end_date],
						ET_exam_date: item.data_old.ET_exam_date ? new Date(item.data_old.ET_exam_date) : null,
				  }
				: { term_date_range: [null, null], KQ_date_range: [null, null], KQ_exam_date: [null, null], ET_exam_date: null },

			// Map Group New
			group_new: item.data_new
				? {
						term_date_range: [item.data_new.term_open_date, item.data_new.term_close_date],
						KQ_date_range: [item.data_new.KQ_open_date, item.data_new.KQ_close_date],
						KQ_exam_date: [item.data_new.KQ_exam_date, item.data_new.KQ_exam_end_date],
						ET_exam_date: item.data_new.ET_exam_date ? new Date(item.data_new.ET_exam_date) : null,
				  }
				: { term_date_range: [null, null], KQ_date_range: [null, null], KQ_exam_date: [null, null], ET_exam_date: null },
		});

		setOpenPickDate(true);
		setModalType(type);
	};

	const formatDateRange = (start, end) => {
		if (!start || !end) return "-";
		return `${formatThaiDate(start)} - ${formatThaiDate(end)}`;
	};

	const renderYearBookColumn = (item) => {
		const labelOld = item.data_old?.year_book || "ระหว่างปี 57-66";
		const labelNew = item.data_new?.year_book || "ตั้งแต่ปี 67";

		return (
			<div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
				<Text size="xs" c="dimmed" fw={700}>
					{labelOld}
				</Text>
				<Text size="xs" c="blue" fw={700}>
					{labelNew}
				</Text>
			</div>
		);
	};

	const renderDualRowCell = (item, type) => {
		let textOld = "-";
		let textNew = "-";

		if (type === "term_date") {
			if (item.data_old) textOld = formatDateRange(item.data_old.term_open_date, item.data_old.term_close_date);
			if (item.data_new) textNew = formatDateRange(item.data_new.term_open_date, item.data_new.term_close_date);
		} else if (type === "KQ_date") {
			if (item.data_old) textOld = formatDateRange(item.data_old.KQ_open_date, item.data_old.KQ_close_date);
			if (item.data_new) textNew = formatDateRange(item.data_new.KQ_open_date, item.data_new.KQ_close_date);
		} else if (type === "KQ_exam") {
			if (item.data_old) textOld = item.data_old.KQ_exam_end_date ? formatDateRange(item.data_old.KQ_exam_date, item.data_old.KQ_exam_end_date) : formatThaiDate(item.data_old.KQ_exam_date);
			if (item.data_new) textNew = item.data_new.KQ_exam_end_date ? formatDateRange(item.data_new.KQ_exam_date, item.data_new.KQ_exam_end_date) : formatThaiDate(item.data_new.KQ_exam_date);
		} else if (type === "ET_exam") {
			if (item.data_old) textOld = formatThaiDate(item.data_old.ET_exam_date) || "-";
			if (item.data_new) textNew = formatThaiDate(item.data_new.ET_exam_date) || "-";
		}

		return (
			<div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
				{/* แถวบน: เก่า */}
				<Text size="xs" c="dimmed">
					{textOld}
				</Text>
				{/* แถวล่าง: ใหม่ */}
				<Text size="xs" c="blue">
					{textNew}
				</Text>
			</div>
		);
	};

	const Rows = groupedRequestExamInfo.map((item, index) => (
		<Table.Tr key={index}>
			<Table.Td style={{ textAlign: "center" }}>
				<Text fw={700} mt={4}>
					{item.term}
				</Text>
			</Table.Td>
			<Table.Td style={{ minWidth: "80px" }}>{renderYearBookColumn(item)}</Table.Td>
			<Table.Td>{renderDualRowCell(item, "term_date")}</Table.Td>
			<Table.Td>{renderDualRowCell(item, "KQ_date")}</Table.Td>
			<Table.Td>{renderDualRowCell(item, "KQ_exam")}</Table.Td>
			<Table.Td>{renderDualRowCell(item, "ET_exam")}</Table.Td>
			<Table.Td style={{ verticalAlign: "top" }}>
				<Group gap="xs" justify="center">
					<Button size="xs" color="yellow" onClick={() => handleEditOrDeleteClick(item, "edit")}>
						แก้ไข
					</Button>
					<Button size="xs" color="red" onClick={() => handleEditOrDeleteClick(item, "delete")}>
						ลบ
					</Button>
				</Group>
			</Table.Td>
		</Table.Tr>
	));

	return (
		<Box>
			<ModalInform opened={openInform} onClose={() => setOpenInform(false)} message={informMessage} type={informtype} />
			<Modal opened={openedPickDate} onClose={() => setOpenPickDate(false)} title={"กรอกข้อมูลภาคเรียน"} size="xl" centered>
				<form onSubmit={Form.onSubmit(handleSubmit)}>
					<TextInput label="ภาคเรียน" placeholder="เช่น 1/69" mb="md" maxLength={4} {...Form.getInputProps("term")} disabled={modalType === "delete" || modalType === "edit"} />

					<Divider my="sm" labelPosition="center" />

					<Grid gutter="xl">
						{/* --- คอลัมน์ซ้าย: ปี ระหว่างปี 57-66 --- */}
						<Grid.Col span={6}>
							<Text fw={700} c="dimmed" mb="sm" ta="center">
								ระหว่างปี 57-66
							</Text>
							<DatePickerInput type="range" label="วันเปิด-ปิดภาคเรียน" firstDayOfWeek={0} valueFormat="DD MMMM YYYY" {...Form.getInputProps("group_old.term_date_range")} disabled={modalType === "delete"} />
							<DatePickerInput type="range" label="วันเปิด-ปิดยื่นคำร้องสอบฯ" firstDayOfWeek={0} valueFormat="DD MMMM YYYY" mt="sm" {...Form.getInputProps("group_old.KQ_date_range")} disabled={modalType === "delete"} />
							<DatePickerInput type="range" allowSingleDateInRange label="วันสอบประมวลความรู้ฯ" firstDayOfWeek={0} valueFormat="DD MMMM YYYY" mt="sm" minDate={Form.values.group_old.KQ_date_range?.[1]} {...Form.getInputProps("group_old.KQ_exam_date")} disabled={modalType === "delete"} />
							<DatePickerInput label="วันสอบความรู้ภาษาอังกฤษ" firstDayOfWeek={0} valueFormat="DD MMMM YYYY" mt="sm" {...Form.getInputProps("group_old.ET_exam_date")} disabled={modalType === "delete"} />
						</Grid.Col>

						{/* --- คอลัมน์ขวา: ปี ตั้งแต่ปี 67 --- */}
						<Grid.Col span={6} style={{ borderLeft: "1px solid #eee" }}>
							<Text fw={700} c="blue" mb="sm" ta="center">
								ตั้งแต่ปี 67
							</Text>
							<DatePickerInput type="range" label="วันเปิด-ปิดภาคเรียน" firstDayOfWeek={0} valueFormat="DD MMMM YYYY" {...Form.getInputProps("group_new.term_date_range")} disabled={modalType === "delete"} />
							<DatePickerInput type="range" label="วันเปิด-ปิดยื่นคำร้องสอบฯ" firstDayOfWeek={0} valueFormat="DD MMMM YYYY" mt="sm" {...Form.getInputProps("group_new.KQ_date_range")} disabled={modalType === "delete"} />
							<DatePickerInput type="range" allowSingleDateInRange label="วันสอบประมวลความรู้ฯ" firstDayOfWeek={0} valueFormat="DD MMMM YYYY" mt="sm" minDate={Form.values.group_new.KQ_date_range?.[1]} {...Form.getInputProps("group_new.KQ_exam_date")} disabled={modalType === "delete"} />
							<DatePickerInput label="วันสอบความรู้ภาษาอังกฤษ" firstDayOfWeek={0} valueFormat="DD MMMM YYYY" mt="sm" {...Form.getInputProps("group_new.ET_exam_date")} disabled={modalType === "delete"} />
						</Grid.Col>
					</Grid>

					<Space h="md" />
					<Button color={modalType === "delete" ? "red" : "green"} type="submit" fullWidth mt="md">
						{modalType === "delete" ? "ลบ" : "บันทึก"}
					</Button>
				</form>
			</Modal>

			<Text size="1.5rem" fw={900} mb="md">
				กรอกข้อมูลภาคเรียน
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
							<Table.Th>ภาคเรียน</Table.Th>
							<Table.Th>หลักสูตร</Table.Th>
							<Table.Th>วันเปิด-ปิดภาคเรียน</Table.Th>
							<Table.Th>วันเปิด-ปิดยื่นคำร้องสอบฯ</Table.Th>
							<Table.Th>วันสอบประมวลความรู้ฯ</Table.Th>
							<Table.Th>วันสอบความรู้ภาษาอังกฤษ</Table.Th>
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

/* //กำหนดวันสอบประมวลความรู้/สอบวัดคุณสมบัติ
import { useState, useEffect } from "react";
import { Box, Text, ScrollArea, Table, Button, Modal, Group, Flex, Space, TextInput } from "@mantine/core";
import { DatePickerInput } from "@mantine/dates";
import ModalInform from "../../component/Modal/ModalInform";
import { useForm } from "@mantine/form";
const BASE_URL = import.meta.env.VITE_API_URL;

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
			request_exam_info_id: null,
			term: "",
			term_date_range: [null, null],
			KQ_date_range: [null, null],
			KQ_exam_date: [null, null],
			ET_exam_date: null,
		},
		validate: {
			term: (value) => (/^\d+\/\d+$/.test(value.trim()) ? null : "กรุณากรอกในรูปแบบ เช่น 1/68"),
			term_date_range: (value) => {
				if (!value[0] || !value[1]) return "กรุณาระบุช่วงวันเปิด-ปิดภาคเรียน";
				return null;
			},
			KQ_date_range: (value) => {
				if (!value[0] || !value[1]) return "กรุณาระบุช่วงวันเปิด-ปิดยื่นคำร้อง";
				return null;
			},
			KQ_exam_date: (value) => {
				if (!value[0]) return "กรุณาระบุวันที่สอบ";
				if (Form.values.KQ_date_range[1] && value[0] < Form.values.KQ_date_range[1]) {
					return "วันที่สอบต้องไม่น้อยกว่าวันปิดยื่นคำร้อง";
				}
				return null;
			},
			ET_exam_date: (value) => (value ? null : "กรุณาระบุวันที่"),
		},
	});

	useEffect(() => {
		const fetchRequestExamInfoAll = async () => {
			try {
				const requestRes = await fetch(`${BASE_URL}/api/allRequestExamInfo`, {
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
			add: `${BASE_URL}/api/addRequestExamInfo`,
			edit: `${BASE_URL}/api/editRequestExamInfo`,
			delete: `${BASE_URL}/api/deleteRequestExamInfo`,
		};

		const payload = {
			request_exam_info_id: Form.values.request_exam_info_id,
			term: Form.values.term,
			ET_exam_date: Form.values.ET_exam_date,

			// แปลง term_date_range [start, end] กลับไปเป็น 2 field
			term_open_date: Form.values.term_date_range[0],
			term_close_date: Form.values.term_date_range[1],

			// แปลง KQ_date_range [start, end] กลับไปเป็น 2 field
			KQ_open_date: Form.values.KQ_date_range[0],
			KQ_close_date: Form.values.KQ_date_range[1],

			// แปลง KQ_exam_date [start, end] กลับไปเป็น 2 field
			// (KQ_exam_end_date จะเป็น null ถ้าผู้ใช้เลือกวันเดียว)
			KQ_exam_date: Form.values.KQ_exam_date[0],
			KQ_exam_end_date: Form.values.KQ_exam_date[1],
		};

		const body = modalType === "delete" ? JSON.stringify({ request_exam_info_id: Form.values.request_exam_info_id }) : JSON.stringify(payload);

		try {
			const requestRes = await fetch(url[modalType], {
				method: "POST",
				headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
				body: body,
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
			<Table.Td style={{ textAlign: "center" }}>{item.term}</Table.Td>
			<Table.Td>
				{formatThaiDate(item.term_open_date)} - {formatThaiDate(item.term_close_date)}
			</Table.Td>
			<Table.Td>
				{formatThaiDate(item.KQ_open_date)} - {formatThaiDate(item.KQ_close_date)}
			</Table.Td>
			<Table.Td>
				{formatThaiDate(item.KQ_exam_date)}
				{item.KQ_exam_end_date ? ` - ${formatThaiDate(item.KQ_exam_end_date)}` : ""}
			</Table.Td>
			<Table.Td>{formatThaiDate(item.ET_exam_date)}</Table.Td>
			<Table.Td>
				<Group>
					<Button
						size="xs"
						color="yellow"
						onClick={() => {
							Form.setValues({ ...item, ["term_date_range"]: [item.term_open_date, item.term_close_date], ["KQ_date_range"]: [item.KQ_open_date, item.KQ_close_date], ["KQ_exam_date"]: [item.KQ_exam_date, item.KQ_exam_end_date] });
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
							Form.setValues({ ...item, ["term_date_range"]: [item.term_open_date, item.term_close_date], ["KQ_date_range"]: [item.KQ_open_date, item.KQ_close_date], ["KQ_exam_date"]: [item.KQ_exam_date, item.KQ_exam_end_date] });
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
			<Modal opened={openedPickDate} onClose={() => setOpenPickDate(false)} title={"กรอกข้อมูลภาคเรียน"} centered>
				<form onSubmit={Form.onSubmit(handleSubmit)}>
					<TextInput label="ภาคเรียน" {...Form.getInputProps("term")} disabled={modalType === "delete" ? true : false} />

					<DatePickerInput type="range" label="วันเปิด-ปิดภาคเรียน" firstDayOfWeek={0} valueFormat="DD MMMM YYYY" {...Form.getInputProps("term_date_range")} disabled={modalType === "delete" ? true : false} />

					<DatePickerInput type="range" label="วันเปิด-ปิดยื่นคำร้องสอบประมวลความรู้/วัดคุณสมบัติ/ความรู้ทางภาษาอังกฤษ" firstDayOfWeek={0} valueFormat="DD MMMM YYYY" {...Form.getInputProps("KQ_date_range")} disabled={modalType === "delete" ? true : false} />

					<DatePickerInput type="range" allowSingleDateInRange label="วันสอบประมวลความรู้/วัดคุณสมบัติ" firstDayOfWeek={0} valueFormat="DD MMMM YYYY" minDate={Form.values.KQ_date_range[1]} {...Form.getInputProps("KQ_exam_date")} disabled={modalType === "delete" ? true : false} />

					<DatePickerInput label="วันสอบความรู้ทางภาษาอังกฤษ" firstDayOfWeek={0} valueFormat="DD MMMM YYYY" {...Form.getInputProps("ET_exam_date")} disabled={modalType === "delete" ? true : false} />
					<Space h="md" />
					<Button color={modalType === "delete" ? "red" : "green"} type="submit" fullWidth>
						{modalType === "delete" ? "ลบ" : "บันทึก"}
					</Button>
				</form>
			</Modal>

			<Text size="1.5rem" fw={900} mb="md">
				กรอกข้อมูลภาคเรียน
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
							<Table.Th>ภาคเรียน</Table.Th>
							<Table.Th>วันเปิด-ปิดภาคเรียน</Table.Th>
							<Table.Th>วันเปิด-ปิดการยื่นคำร้องขอสอบประมวลความรู้/สอบวัดคุณสมบัติ/สอบความรู้ทางภาษาอังกฤษ</Table.Th>
							<Table.Th>วันสอบประมวลความรู้/สอบวัดคุณสมบัติ</Table.Th>
							<Table.Th>วันสอบความรู้ทางภาษาอังกฤษ</Table.Th>
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
 */
