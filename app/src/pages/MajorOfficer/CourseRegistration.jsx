import { useState, useEffect } from "react";
import { Box, Text, ScrollArea, Table, Space, Button, Modal, MultiSelect, Group, Flex, Select, TextInput, NumberInput } from "@mantine/core";
import { useForm } from "@mantine/form";
import ModalInform from "../../component/Modal/ModalInform";
import AsyncCourseSelect from "./AsyncCourseSelect";
import { jwtDecode } from "jwt-decode";

const CourseRegistration = () => {
	const token = localStorage.getItem("token");
	/* const payloadBase64 = token.split(".")[1];
				const payload = JSON.parse(atob(payloadBase64)); */

	const payload = jwtDecode(token);
	const role = payload.role;
	const user_id = payload.user_id;
	console.log("token :", payload);
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
			study_group_id: (value) => (value !== "" ? null : "กรุณากรอกหมู่เรียน"),
			course_id: (value) => (value.length > 0 ? null : "กรุณาเลือกรหัสวิชา"),
		},
	});

	const [fullCourses, setFullCourses] = useState([]);
	useEffect(() => {
		const fetchAll = async () => {
			try {
				const ListSubjectAll = await fetch("https://mua.kpru.ac.th/FrontEnd_Tabian/apiforall/ListSubjectAll");
				const subjects = await ListSubjectAll.json();

				const formattedSubjects = subjects.map((item) => ({
					value: item.SUBJCODE,
					label: `${item.SUBJCODE} - ${item.SUBJNAME}`,
				}));

				console.log(formattedSubjects);
				setFullCourses(formattedSubjects);

				/* const allCourses = await fetch("http://localhost:8080/api/allCourses", {
					method: "POST",
					headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
				});
				console.log();

				const allCoursesData = await allCourses.json();
				if (!allCourses.ok) throw new Error(allCoursesData.message);
				console.log(allCoursesData);

				setFullCourses(allCoursesData); */
			} catch (e) {
				console.error(e);
			}
		};
		fetchAll();
	}, []);

	useEffect(() => {
		const fetchMajorNameAndData = async () => {
			try {
				const req1 = await fetch("http://localhost:8080/api/allMajorCourseRegistration", {
					method: "POST",
					headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
				});
				const res1 = await req1.json();
				if (!req1.ok) throw new Error(res1.message);
				setTableData(res1);
				const req2 = await fetch("http://localhost:8080/api/officerGetMajor_id", {
					method: "POST",
					headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
					body: JSON.stringify({ user_id }),
				});
				const res2 = await req2.json();
				if (!req2.ok) throw new Error(res2.message);
				const req3 = await fetch("http://localhost:8080/api/major_idGetMajor_name", {
					method: "POST",
					headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
					body: JSON.stringify({ major_id: res2.major_id }),
				});
				const res3 = await req3.json();
				if (!req3.ok) throw new Error(res3.message);
				Form.setValues({ major_id: res2.major_id, major_name: res3.major_name });
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
			add: "http://localhost:8080/api/addCourseRegistration",
			edit: "http://localhost:8080/api/editCourseRegistration",
			delete: "http://localhost:8080/api/deleteCourseRegistration",
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
				กรอกข้อมูลรายวิชาสำหรับสอบประมวลควา มรู้/สอบวัดคุณสมบัติ
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
