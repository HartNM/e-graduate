import { useState, useEffect, useMemo, useCallback } from "react";
import debounce from "lodash.debounce";
import { Box, Text, ScrollArea, Table, Space, Button, Modal, MultiSelect, Group, Flex, Select, TextInput, NumberInput } from "@mantine/core";
import { useForm } from "@mantine/form";
import ModalInform from "../../component/Modal/ModalInform";

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

	const Form = useForm({
		initialValues: {
			major_id: "",
			study_group_id: "",
			course_first: [],
			course_last: [],
		},
		validate: {
			study_group_id: (value) => {
				if (value === "" || value == null) return "กรุณากรอกหมู่เรียน";
				if (String(value).length !== 7) return "หมู่เรียนต้องมีจำนวน 7 ตัวอักษร";
				return null;
			},

			course_first: (value) => (value.length > 0 ? null : "กรุณาเลือกรหัสวิชา"),
			course_last: (value) => (value.length > 0 ? null : "กรุณาเลือกรหัสวิชา"),
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
						uniqueSubjectsMap.set(item.SUBJCODE, item);
					}
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

	const [majors, setMajors] = useState([]);
	useEffect(() => {
		const fetchMajorNameAndData = async () => {
			try {
				const req1 = await fetch(`${BASE_URL}/api/allMajorCourseRegistration`, {
					method: "POST",
					headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
					body: JSON.stringify({ usage: [2, 3] }),
				});
				const res1 = await req1.json();
				if (!req1.ok) throw new Error(res1.message);
				console.log(res1);

				setTableData(res1);

				const req2 = await fetch(`${BASE_URL}/api/majors`, {
					method: "POST",
					headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
				});
				const res2 = await req2.json();

				const selectData = res2.map((item) => ({
					value: item.major_id,
					label: item.major_name,
				}));
				console.log(selectData);
				setMajors(selectData);
			} catch (e) {
				notify("error", e.message);
				console.log(e);
			}
		};
		fetchMajorNameAndData();
		setReloadTable(false);
	}, [reloadTable]);

	const handleOpenAdd = () => {
		Form.setValues({ major_id: "", study_group_id: "", course_first: [], course_last: [] });
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
				body: JSON.stringify({ ...Form.values, usage: [2, 3] }),
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

	const [selectedMajor, setSelectedMajor] = useState("");
	const filteredData = tableData.filter((p) => {
		const matchesMajor = selectedMajor ? p.major_id === selectedMajor : true;
		return matchesMajor;
	});

	const classRows = filteredData.map((item, index) => (
		<Table.Tr key={index}>
			<Table.Td>{majors.find((m) => m.value === item.major_id)?.label || item.major_id}</Table.Td>
			<Table.Td>{item.study_group_id}</Table.Td>
			<Table.Td style={{ whiteSpace: "pre-line", textAlign: "left" }}>
				{item.course_first.map((id, index) => {
					const found = fullCourses.find((c) => c.value === id);
					const text = found ? found.label : id;
					return <div key={index}>{text}</div>;
				})}
				{item.course_last.map((id, index) => {
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

	const [data, setData] = useState([]);

	const handleSearchChange = useCallback(
		debounce((query) => {
			if (!query) return setData(fullCourses.slice(0, 0));
			const filtered = fullCourses.filter((item) => (item?.value || "").toLowerCase().includes(query.toLowerCase()) || (item?.label || "").toLowerCase().includes(query.toLowerCase())).slice(0, 50);
			setData(filtered);
		}, 300),
		[fullCourses]
	);

	return (
		<Box>
			<ModalInform opened={inform.open} onClose={close} message={inform.message} type={inform.type} />
			<Modal opened={openCourses} onClose={() => setOpenCourses(false)} title="กรอกข้อมูลรายวิชา" centered closeOnClickOutside={false}>
				<Box>
					<form onSubmit={Form.onSubmit(handleSubmit)}>
						<Select label="สาขา" data={majors} value={Form.values.major_id} onChange={(value) => Form.setFieldValue("major_id", value)} disabled={modalType === "add" ? false : true} />
						<NumberInput label="หมู่เรียน" hideControls {...Form.getInputProps("study_group_id")} disabled={modalType === "add" ? false : true} />
						<MultiSelect label="รหัสวิชาวิทยานิพนธ์และการค้นคว้าอิสระ ตัวแรก" searchable hidePickedOptions data={data} onSearchChange={handleSearchChange} {...Form.getInputProps("course_first")} disabled={modalType === "delete"} />
						<MultiSelect label="รหัสวิชาวิทยานิพนธ์และการค้นคว้าอิสระ ตัวสุดท้าย" searchable hidePickedOptions data={data} onSearchChange={handleSearchChange} {...Form.getInputProps("course_last")} disabled={modalType === "delete"} />
						<Space h="md" />
						<Button color={modalType === "delete" ? "red" : "green"} type="submit" fullWidth>
							{modalType === "delete" ? "ลบ" : "บันทึก"}
						</Button>
					</form>
				</Box>
			</Modal>
			<Text size="1.5rem" fw={900} mb="md">
				กรอกข้อมูลรายวิชาบังคับสำหรับสอบวิทยานิพนธ์/การค้นคว้าอิสระ
			</Text>
			<Space h="sm" />
			<Group justify="space-between">
				<Box>
					<Flex align="flex-end" gap="sm">
						<Select placeholder="สาขา" data={majors} value={selectedMajor} onChange={(value) => setSelectedMajor(value)} />
					</Flex>
				</Box>
				<Box>
					<Flex justify="flex-end">
						<Button variant="filled" onClick={() => handleOpenAdd()}>
							เพิ่มข้อมูล
						</Button>
					</Flex>
				</Box>
			</Group>

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
