import { useState, useEffect, useMemo } from "react";
import { Box, Text, ScrollArea, Table, Space, Button, Modal, MultiSelect, Group, Flex, Select, TextInput, NumberInput } from "@mantine/core";
import { useForm } from "@mantine/form";
import ModalInform from "../../component/Modal/ModalInform";
import AsyncCourseSelect from "./AsyncCourseSelect";
import { jwtDecode } from "jwt-decode";
const BASE_URL = import.meta.env.VITE_API_URL;

const CourseRegistration = () => {
	const token = localStorage.getItem("token");
	const { role, user_id, name, education_level, major_ids } = useMemo(() => {
		if (!token) return { role: "", user_id: "", name: "", education_level: "", major_ids: "" };
		try {
			return jwtDecode(token);
		} catch (error) {
			console.error("Invalid token:", error);
			return { role: "", user_id: "", name: "", education_level: "", major_ids: "" };
		}
	}, [token]);

	// Modal Info
	const [inform, setInform] = useState({ open: false, type: "", message: "" });
	const notify = (type, message) => setInform({ open: true, type, message });
	const close = () => setInform((s) => ({ ...s, open: false }));
	// System
	const [tableData, setTableData] = useState([]);
	const [reloadTable, setReloadTable] = useState(false);
	const [modalType, setModalType] = useState("");
	const [openCourses, setOpenCourses] = useState(false);
	const [courses, setCourses] = useState([]);

	const Form = useForm({
		initialValues: {
			major_id: "",
			major_name: "",
			study_group_id: "",
			course_id: [],
		},
		validate: {
			study_group_id: (value) => {
				if (value === "" || value == null) return "กรุณากรอกหมู่เรียน";
				if (String(value).length !== 7) return "หมู่เรียนต้องมีจำนวน 7 ตัวอักษร";
				return null;
			},

			course_id: (value) => (value.length > 0 ? null : "กรุณาเลือกรหัสวิชา"),
		},
	});

	const [fullCourses, setFullCourses] = useState([]);
	useEffect(() => {
		const fetchAll = async () => {
			try {
				const ListSubjectAll = await fetch("/mua-proxy/FrontEnd_Tabian/apiforall/ListSubjectAll");
				const subjects = await ListSubjectAll.json();

				const uniqueSubjectsMap = new Map();

				subjects.forEach((item) => {
					if (!uniqueSubjectsMap.has(item.SUBJCODE)) {
						// ถ้ายังไม่มี ให้เก็บ
						uniqueSubjectsMap.set(item.SUBJCODE, item);
					} /* else {
						// ถ้ามีแล้ว (แสดงว่าเป็นตัวซ้ำ)
						const existing = uniqueSubjectsMap.get(item.SUBJCODE); // ดึงตัวเก่าออกมาดู

						console.group(`⚠️ พบวิชาซ้ำ: ${item.SUBJCODE}`);
						console.log("1. ตัวที่ถูกเก็บไว้ (First found):", existing);
						console.log("2. ตัวที่ซ้ำและถูกข้าม (Duplicate):", item);
						console.groupEnd();
					} */
				});

				const uniqueSubjects = Array.from(uniqueSubjectsMap.values());

				const formattedSubjects = uniqueSubjects.map((item) => ({
					value: item.SUBJCODE,
					label: `${item.SUBJCODE} - ${item.SUBJNAME}`,
				}));

				console.log(formattedSubjects);
				setFullCourses(formattedSubjects);
			} catch (e) {
				console.error(e);
			}
		};
		fetchAll();
	}, []);

	useEffect(() => {
		const fetchMajorNameAndData = async () => {
			try {
				const req1 = await fetch(`${BASE_URL}/api/allMajorCourseRegistration`, {
					method: "POST",
					headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
				});
				const res1 = await req1.json();
				if (!req1.ok) throw new Error(res1.message);
				setTableData(res1);

				/* const req2 = await fetch(`${BASE_URL}/api/officerGetMajor_id`, {
					method: "POST",
					headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
					body: JSON.stringify({ user_id }),
				});
				const res2 = await req2.json();
				if (!req2.ok) throw new Error(res2.message); */

				const req3 = await fetch(`${BASE_URL}/api/major_idGetMajor_name`, {
					method: "POST",
					headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
					body: JSON.stringify({ major_id: major_ids[0] }),
				});
				const res3 = await req3.json();
				if (!req3.ok) throw new Error(res3.message);

				Form.setValues({ major_id: major_ids[0], major_name: res3.major_name });
			} catch (e) {
				notify("error", e.message);
				console.log(e);
			}
		};
		fetchMajorNameAndData();
		setReloadTable(false);
	}, [reloadTable]);

	const handleOpenAdd = () => {
		Form.setValues({ study_group_id: "", course_id: [] });
		setModalType("add");
		setOpenCourses(true);
	};
	const handleOpenEdit = (item) => {
		Form.setValues(item);
		setModalType("edit");
		setOpenCourses(true);
	};
	const handleOpenDelete = (item) => {
		Form.setValues(item);
		setModalType("delete");
		setOpenCourses(true);
	};

	const handleSubmit = async () => {
		const url = {
			add: `${BASE_URL}/api/addCourseRegistration`,
			edit: `${BASE_URL}/api/editCourseRegistration`,
			delete: `${BASE_URL}/api/deleteCourseRegistration`,
		};
		try {
			const req = await fetch(url[modalType], {
				method: "POST",
				headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
				body: JSON.stringify(Form.values),
			});
			const res = await req.json();
			if (!req.ok) {
				throw new Error(res.message);
			}
			notify("success", res.message);
			setOpenCourses(false);
			setReloadTable(true);
		} catch (e) {
			notify("error", e.message);
			console.log(e);
		}
	};

	const classRows = tableData.map((item, index) => (
		<Table.Tr key={index}>
			<Table.Td>{Form.values.major_name}</Table.Td>
			<Table.Td>{item.study_group_id}</Table.Td>
			<Table.Td style={{ whiteSpace: "pre-line", textAlign: "left" }}>
				{item.course_id.map((id, index) => {
					const found = fullCourses.find((c) => c.value === id);
					const text = found ? found.label : id;
					return <div key={index}>{text}</div>;
				})}
			</Table.Td>

			<Table.Td>
				<Group>
					<Button color="green" size="xs" onClick={() => handleOpenEdit(item)}>
						แก้ไข
					</Button>
					<Button color="red" size="xs" onClick={() => handleOpenDelete(item)}>
						ลบ
					</Button>
				</Group>
			</Table.Td>
		</Table.Tr>
	));

	return (
		<Box>
			<ModalInform opened={inform.open} onClose={close} message={inform.message} type={inform.type} />
			<Modal opened={openCourses} onClose={() => setOpenCourses(false)} title="กรอกข้อมูลรายวิชาสำหรับสอบประมวลความรู้/สอบวัดคุณสมบัติ" centered closeOnClickOutside={false}>
				<Box>
					<form onSubmit={Form.onSubmit(handleSubmit)}>
						<Text size="2xl" fw={800}>
							สาขา{Form.values.major_name}
						</Text>
						<NumberInput label="หมู่เรียน" hideControls disabled={modalType === "add" ? false : true} {...Form.getInputProps("study_group_id")} />
						<AsyncCourseSelect form={Form} disabled={modalType === "delete"} fullCourses={fullCourses} />
						<Space h="md" />
						<Button color={modalType === "delete" ? "red" : "green"} type="submit" fullWidth>
							{modalType === "delete" ? "ลบ" : "บันทึก"}
						</Button>
					</form>
				</Box>
			</Modal>
			<Text size="1.5rem" fw={900} mb="md">
				กรอกข้อมูลรายวิชา{/* สำหรับสอบประมวลความรู้/สอบวัดคุณสมบัติ */}บังคับ
			</Text>
			<Space h="sm" />
			<Box>
				<Flex justify="flex-end">
					<Button variant="filled" onClick={() => handleOpenAdd()}>
						เพิ่มข้อมูล
					</Button>
				</Flex>
			</Box>
			<Space h="sm" />
			<ScrollArea type="scroll" offsetScrollbars style={{ borderRadius: "8px", border: "1px solid #e0e0e0" }}>
				<Table horizontalSpacing="sm" verticalSpacing="sm" highlightOnHover>
					<Table.Thead>
						<Table.Tr>
							<Table.Th>สาขา</Table.Th>
							<Table.Th>หมู่เรียน</Table.Th>
							<Table.Th>รายวิชา</Table.Th>
							<Table.Th>การดำเนินการ</Table.Th>
						</Table.Tr>
					</Table.Thead>
					<Table.Tbody>{classRows}</Table.Tbody>
				</Table>
			</ScrollArea>
		</Box>
	);
};

export default CourseRegistration;
