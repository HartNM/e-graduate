import { useState, useEffect } from "react";
import { Box, Text, ScrollArea, Table, Space, Button, Modal, MultiSelect, Group, Flex, Select, TextInput, NumberInput } from "@mantine/core";
import { useForm } from "@mantine/form";
import ModalInform from "../../component/Modal/ModalInform";

const CourseRegistration = () => {
	const token = localStorage.getItem("token");
	const payloadBase64 = token.split(".")[1];
	const payload = JSON.parse(atob(payloadBase64));
	const user_id = payload.user_id;
	// Modal Info
	const [inform, setInform] = useState({ open: false, type: "", message: "" });
	const notify = (type, message) => setInform({ open: true, type, message });
	const close = () => setInform((s) => ({ ...s, open: false }));
	// System
	const [tableData, setTableData] = useState([]);
	const [reloadTable, setReloadTable] = useState(false);
	const [modalType, setModalType] = useState("");
	const [openCoures, setOpenCoures] = useState(false);
	const [coures, setCoures] = useState([
		{ value: "1065201", label: "1065201 หลักการ ทฤษฎีและปฏิบัติทางการบริหารการศึกษา" },
		{ value: "1065202", label: "1065202 ผู้นำทางวิชาการและการพัฒนาหลักสูตร " },
		{ value: "1065204", label: "1065204 การบริหารทรัพยากรทางการศึกษา" },
		{ value: "1065206", label: "1065206 ภาวะผู้นำทางการบริหารการศึกษา" },
		{ value: "1065208", label: "1065208 การประกันคุณภาพการศึกษา" },
		{ value: "1065222", label: "1065222 การฝึกปฏิบัติงานการบริหารการศึกษาและบริหารสถานศึกษา" },
		{ value: "1065231", label: "1065231 คุณธรรม จริยธรรมและจรรยาบรรณวิชาชีพทางการศึกษา สำหรับนักบริหารการศึกษา และผู้บริหารการศึกษา" },
		{ value: "1065232", label: "1065232 การบริหารงานวิชาการ กิจการและกิจกรรมนักเรียน" },
		{ value: "1066205", label: "1066205 ความเป็นนักบริหารมืออาชีพ" },
	]);

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
		setOpenCoures(true);
	};
	const handleOpenEdit = (item) => {
		Form.setValues(item);
		setModalType("edit");
		setOpenCoures(true);
	};
	const handleOpenDelete = (item) => {
		Form.setValues(item);
		setModalType("delete");
		setOpenCoures(true);
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
			setOpenCoures(false);
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
			<Modal opened={openCoures} onClose={() => setOpenCoures(false)} title="กรอกข้อมูลรายวิชาประจำสาขา" centered closeOnClickOutside={false}>
				<Box>
					<form onSubmit={Form.onSubmit(handleSubmit)}>
						<Text size="2xl" fw={800}>
							สาขา{Form.values.major_name}
						</Text>
						<NumberInput label="หมู่เรียน" hideControls disabled={modalType === "add" ? false : true} {...Form.getInputProps("study_group_id")} />
						<MultiSelect label="รหัสวิชาที่ต้องเรียน" searchable hidePickedOptions data={coures} disabled={modalType === "delete" ? true : false} {...Form.getInputProps("course_id")} />
						<Space h="md" />
						<Button color={modalType === "delete" ? "red" : "green"} type="submit" fullWidth>
							{modalType === "delete" ? "ลบ" : "บันทึก"}
						</Button>
					</form>
				</Box>
			</Modal>
			<Text size="1.5rem" fw={900} mb="md">
				กรอกข้อมูลรายวิชาประจำสาขา{Form.values.major_name}
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
