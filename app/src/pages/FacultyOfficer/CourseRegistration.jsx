import { useState, useEffect } from "react";
import { Box, Text, ScrollArea, Table, Space, Button, Modal, MultiSelect, Group, Flex, Select, TextInput } from "@mantine/core";

const major_id = [
	{ value: "14", label: "การบริหารการศึกษา" },
	{ value: "00", label: "ยุทธศาสตร์การบริหารและการพัฒนา" },
	{ value: "k2", label: "การจัดการสมัยใหม่" },
	{ value: "70", label: "รัฐประศาสนศาสตร์" },
	{ value: "ไม่รู้1", label: "วิทยาศาสตร์ศึกษา" },
];

const subjectCodes = [
	{ value: "1012110", label: "1012110 ชื่อวิชา 1" },
	{ value: "2033215", label: "2033215 ชื่อวิชา 2" },
	{ value: "1151423", label: "1151423 ชื่อวิชา 3" },
	{ value: "3022511", label: "3022511 ชื่อวิชา 4" },
	{ value: "1101312", label: "1101312 ชื่อวิชา 5" },
	{ value: "2212419", label: "2212419 ชื่อวิชา 6" },
	{ value: "3051120", label: "3051120 ชื่อวิชา 7" },
	{ value: "1201214", label: "1201214 ชื่อวิชา 8" },
	{ value: "2132317", label: "2132317 ชื่อวิชา 9" },
	{ value: "1401518", label: "1401518 ชื่อวิชา 10" },
];

const CourseRegistration = () => {
	const [openCoures, setOpenCoures] = useState(false);
	const [modalType, setModalType] = useState("");
	const [selectedMajor, setSelectedMajor] = useState(null);
	const [selectedGroup, setSelectedGroup] = useState("");
	const [selectedSubjects, setSelectedSubjects] = useState([]);
	const [selectedRow, setSelectedRow] = useState([]);
	const [tableData, setTableData] = useState([]);
	const [reloadTable, setReloadTable] = useState(false);
	const token = localStorage.getItem("token");

	useEffect(() => {
		const fetchProfileAndData = async () => {
			try {
				const Data = await fetch("http://localhost:8080/api/AllCourseRegistration", {
					method: "POST",
					headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
				});
				const resData = await Data.json();
				setTableData(resData);
				console.log(resData);
			} catch (err) {
				console.error("Error fetching AllCourseRegistration:", err);
			}
			setReloadTable(false);
		};

		fetchProfileAndData();
	}, [reloadTable]);

	const handleOpenCoures = (item) => {
		setSelectedRow(item);
		setSelectedSubjects(item.course_id || []);
		setSelectedMajor(item.major_id || null);
		setSelectedGroup(item.study_group_id || "");
		setOpenCoures(true);
	};

	const handleSaveSubjects = async () => {
		console.log(selectedMajor, selectedGroup, selectedSubjects);
		try {
			const requestRes = await fetch("http://localhost:8080/api/AddCourseRegistration", {
				method: "POST",
				headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
				body: JSON.stringify({
					selectedMajor: selectedMajor,
					selectedGroup: selectedGroup,
					selectedSubjects: selectedSubjects,
				}),
			});

			setOpenCoures(false);
			setReloadTable(true);
		} catch (err) {
			console.error("Error fetching AddCourseRegistration:", err);
		}
	};

	const handleEditSubjects = async () => {
		try {
			const requestRes = await fetch("http://localhost:8080/api/EditCourseRegistration", {
				method: "POST",
				headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
				body: JSON.stringify({
					id: selectedRow.id,
					selectedSubjects: selectedSubjects,
				}),
			});

			setOpenCoures(false);
			setReloadTable(true);
		} catch (err) {
			console.error("Error fetching AddCourseRegistration:", err);
		}
	};

	const getMajorLabel = (id) => {
		const found = major_id.find((opt) => opt.value === id);
		return found ? found.label : id;
	};

	const classRows = tableData.map((item) => (
		<Table.Tr key={item.id}>
			<Table.Td>{getMajorLabel(item.major_id)}</Table.Td>
			<Table.Td>{item.study_group_id}</Table.Td>
			<Table.Td>
				<Group>
					<Button
						size="xs"
						onClick={() => {
							setModalType("Edit");
							handleOpenCoures(item);
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
			<Modal opened={openCoures} onClose={() => setOpenCoures(false)} title="กรอกข้อมูลรายวิชาประจำสาขา" centered closeOnClickOutside={false}>
				<Box>
					<Select
						label="สาขาวิชา"
						placeholder="เลือกหรือพิมพ์สาขา"
						searchable
						nothingFoundMessage="ไม่มีสาขานี้"
						data={major_id}
						value={selectedMajor}
						onChange={setSelectedMajor}
						disabled={modalType === "Edit" ? true : false}
					/>
					{/* <Select
						label="หมู่เรียน"
						placeholder="เลือกหรือพิมพ์หมู่เรียน"
						searchable
						nothingFoundMessage="ไม่มีหมู่เรียนนี้"
						data={["6313201", "6313202"]}
						value={selectedGroup}
						onChange={setSelectedGroup}
						disabled={modalType === "Edit" ? true : false}
					/> */}
					<TextInput label="หมู่เรียน" placeholder="พิมพ์หมู่เรียน" value={selectedGroup} onChange={(e) => setSelectedGroup(e.currentTarget.value)} disabled={modalType === "Edit" ? true : false} />
					<MultiSelect
						label="รหัสวิชาที่ต้องเรียน"
						placeholder="เลือกหรือพิมพ์รหัสวิชา"
						data={subjectCodes}
						value={selectedSubjects}
						onChange={setSelectedSubjects}
						searchable
						clearable
						checkIconPosition="right"
						nothingFoundMessage="ไม่มีรหัสวิชานี้"
					/>
					<Button
						mt="md"
						onClick={() => {
							modalType === "Edit" ? handleEditSubjects() : handleSaveSubjects();
						}}
					>
						บันทึก
					</Button>
				</Box>
			</Modal>

			<Text size="1.5rem" fw={900} mb="md">
				กรอกข้อมูลรายวิชาประจำสาขา
			</Text>

			<Space h="xl" />

			<Box>
				<Flex justify="flex-end">
					<Button
						size="xs"
						onClick={() => {
							setModalType("Add");
							handleOpenCoures("");
						}}
					>
						เพิ่มข้อมูล
					</Button>
				</Flex>
			</Box>

			<Space h="xl" />

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
