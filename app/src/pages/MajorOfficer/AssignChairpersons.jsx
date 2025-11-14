//แต่งตั้งประธานกรรมการบัณฑิตศึกษาประจำสาขา
import { useState, useEffect } from "react";
import { Box, Text, TextInput, Table, Button, Modal, Space, ScrollArea, PasswordInput, Group, Select, Flex } from "@mantine/core";
import { useForm } from "@mantine/form";
import ModalInform from "../../component/Modal/ModalInform";
const BASE_URL = import.meta.env.VITE_API_URL;

const AssignChairpersons = () => {
	// Modal Info
	const [inform, setInform] = useState({ open: false, type: "", message: "" });
	const notify = (type, message) => setInform({ open: true, type, message });
	const close = () => setInform((s) => ({ ...s, open: false }));

	const [openModal, setOpenModal] = useState(false);
	const [modalType, setModalType] = useState(false);
	const [majorName, setMajorName] = useState(null);

	const [reloadTable, setReloadTable] = useState(false);
	const token = localStorage.getItem("token");

	const [assignChairpersons, setAssignChairpersons] = useState([]); // State สำหรับตาราง
	const [chairpersons, setChairpersons] = useState([]); // State สำหรับ Select (Dropdown)

	// ✅ 1. State ใหม่: เก็บข้อมูลดิบของคนที่ถูกแต่งตั้ง "ทั้งหมด"
	const [allAssignedData, setAllAssignedData] = useState([]);
	// ✅ 2. State ใหม่: สำหรับคุมการ loading ของ Select
	const [isLoadingSelect, setIsLoadingSelect] = useState(false);

	// 🛑 3. ลบ const save = [...] (ข้อมูล hardcode) ทิ้งได้เลย
	// const save = [ ... ];

	const Form = useForm({
		initialValues: {
			user_id: "",
			name: "",
			major_id: "",
			password: "123456",
		},
		validate: {
			name: (value) => (value.trim().length > 0 ? null : "กรุณากรอกชื่อ"),
		},
	});

	useEffect(() => {
		const fetchTableData = async () => {
			try {
				// 1. ดึงข้อมูล Major (เหมือนเดิม)
				const marjorRes = await fetch(`${BASE_URL}/api/getMajor_name`, {
					method: "POST",
					headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
				});
				const marjorData = await marjorRes.json();
				setMajorName(marjorData);
				console.log("EFFECT (Table) - major:", marjorData);

				// 2. ดึงข้อมูลประธานที่ถูกแต่งตั้งไปแล้ว (สำหรับตาราง)
				const ChairpersonsRes = await fetch(`${BASE_URL}/api/allAssignChairpersons`, {
					method: "POST",
					headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
				});
				const ChairpersonsData = await ChairpersonsRes.json();
				if (!ChairpersonsRes.ok) throw new Error(ChairpersonsData.message);
				console.log("EFFECT (Table) - Chairpersons (Assigned):", ChairpersonsData);

				// ✅ 4. เก็บข้อมูลดิบไว้ใน State เพื่อใช้ตอนกด "เพิ่ม"
				setAllAssignedData(ChairpersonsData);

				// 5. กรองข้อมูลประธานเฉพาะ major นี้ (สำหรับตาราง)
				const Chairpersons_filtered = ChairpersonsData.filter((item) => item.major_id === marjorData.major_id);
				setAssignChairpersons(Chairpersons_filtered);
				console.log("EFFECT (Table) - Chairpersons filtered (This Major):", Chairpersons_filtered);

				// 🛑 6. ลบการ fetch 'loadMember' และการกรอง 'candidate_filtered' ออกจากตรงนี้
			} catch (e) {
				notify("error", e.message);
				console.error("Error fetch Table Data:", e);
			}
			setReloadTable(false);
		};
		fetchTableData();
	}, [reloadTable, token]); // ทำงานเมื่อ reloadTable หรือ token เปลี่ยน

	// -----------------------------------------------------------------
	// FUNCTION: ทำงานตอนกดปุ่ม "เพิ่มข้อมูล"
	// - เปิด Modal
	// - (ใหม่) Fetch ข้อมูลสำหรับ Select Dropdown
	// -----------------------------------------------------------------
	const handleOpenAdd = async () => {
		// ✅ 7. เปลี่ยนเป็น async
		Form.reset();
		setModalType("add");
		setOpenModal(true);
		setIsLoadingSelect(true); // ✅ 8. เริ่มหมุน...
		setChairpersons([]); // เคลียร์ค่าเก่า

		try {
			// ตรวจสอบว่ามีข้อมูลสาขาก่อน
			if (!majorName || !majorName.id_fac) {
				throw new Error("ยังโหลดข้อมูลสาขาไม่เสร็จ หรือไม่มี id_fac");
			}

			// ✅ 9. Fetch ข้อมูลบุคลากร (loadMember) "ณ ตอนนี้"
			const facultyMembersRes = await fetch(`https://git.kpru.ac.th/FrontEnd_Admission/admissionnew2022/loadMember/${majorName.id_fac}`);
			const facultyMembersData = await facultyMembersRes.json();
			if (!facultyMembersRes.ok) throw new Error("ไม่สามารถดึงข้อมูลบุคลากรได้");

			// แปลงข้อมูล
			const formattedMembers = facultyMembersData.map((member) => ({
				value: member.employee_id,
				label: `${member.prename_full_tha}${member.first_name_tha} ${member.last_name_tha}`.trim(),
			}));

			// ✅ 10. กรองคนที่ "ยังว่าง" โดยใช้ข้อมูล 'allAssignedData' จาก State
			const candidate_filtered = formattedMembers.filter((person) => !allAssignedData.some((item) => item.user_id === person.value));

			setChairpersons(candidate_filtered); // ✅ 11. อัปเดต Dropdown
			console.log("HANDLE OPEN ADD - Candidates for Select:", candidate_filtered);
		} catch (e) {
			notify("error", e.message);
			console.error("Error fetching data for select:", e);
			setOpenModal(false); // ปิด Modal ไปเลยถ้า fetch พลาด
		} finally {
			setIsLoadingSelect(false); // ✅ 12. หยุดหมุน
		}
	};

	const handleOpenDelete = (item) => {
		Form.setValues(item);
		setModalType("delete");
		setOpenModal(true);
	};

	const handleSubmit = async () => {
		const url = {
			add: `${BASE_URL}/api/addAssignChairpersons`,
			delete: `${BASE_URL}/api/deleteAssignChairpersons`,
		};
		try {
			const req = await fetch(url[modalType], {
				method: "POST",
				headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
				body: JSON.stringify({ ...Form.values, major_id: majorName.major_id }),
			});
			const res = await req.json();
			if (!req.ok) {
				throw new Error(res.message);
			}
			notify("success", res.message);
			setReloadTable(true);
			setOpenModal(false);
		} catch (e) {
			notify("error", e.message);
			console.error("Error fetch AssignChairpersons:", e);
		}
	};

	const classRows = assignChairpersons.map((item) => (
		<Table.Tr key={item.user_id}>
			{/* ✅ 13. เพิ่ม ? (Optional Chaining) ป้องกัน error ตอนโหลดครั้งแรก */}
			<Table.Td>{majorName?.major_name}</Table.Td>
			<Table.Td>{item.name}</Table.Td>
			<Table.Td>
				<Group>
					<Button color="red" size="xs" onClick={() => handleOpenDelete(item)}>
						ลบ
					</Button>
				</Group>
			</Table.Td>
		</Table.Tr>
	));

	return (
		<Box>
			{/* ... (ModalInform เหมือนเดิม) */}
			<Modal opened={openModal} onClose={() => setOpenModal(false)} title="กรอกข้อมูลประธานกรรมการบัณฑิตศึกษาประจำสาขาวิชา" centered>
				<form onSubmit={Form.onSubmit(handleSubmit)}>
					{/* ✅ 13. เพิ่ม ? ป้องกัน error */}
					<Text>สาขา{majorName?.major_name}</Text>

					{modalType === "delete" ? (
						<TextInput label="ชื่อ" {...Form.getInputProps("name")} disabled={true} />
					) : (
						<>
							<Select
								label="ชื่อ"
								searchable
								data={chairpersons}
								value={Form.values.user_id}
								onChange={(value) => {
									Form.setFieldValue("user_id", value);
									const selected = chairpersons.find((c) => c.value === value);
									Form.setFieldValue("name", selected ? selected.label : "");
								}}
								// ✅ 14. เพิ่ม disabled และ placeholder ตอนโหลด
								disabled={isLoadingSelect}
								placeholder={isLoadingSelect ? "กำลังโหลดรายชื่อ..." : "เลือกอาจารย์"}
							/>
						</>
					)}

					<Space h="md" />
					<Button color={modalType === "delete" ? "red" : "green"} type="submit" fullWidth>
						{modalType === "delete" ? "ลบ" : "บันทึก"}
					</Button>
				</form>
			</Modal>

			<Text size="1.5rem" fw={900} mb="md">
				กรอกข้อมูลประธานกรรมการบัณฑิตศึกษาประจำสาขาวิชา
			</Text>
			<Space h="xl" />
			<Box>
				<Flex justify="flex-end">
					<Button variant="filled" size="xs" onClick={() => handleOpenAdd()} disabled={!majorName}>
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
							<Table.Th>อาจารย์</Table.Th>
							<Table.Th>การดำเนินการ</Table.Th>
						</Table.Tr>
					</Table.Thead>
					<Table.Tbody>{classRows}</Table.Tbody>
				</Table>
			</ScrollArea>
		</Box>
	);
};

export default AssignChairpersons;
