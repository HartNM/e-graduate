//แต่งตั้งเจ้าหน้าที่ประจำสาขา
import { useState, useEffect } from "react";
import { Box, Text, TextInput, Table, Button, Modal, Space, ScrollArea, Group, Select, Flex } from "@mantine/core";
import { useForm } from "@mantine/form";
import ModalInform from "../../component/Modal/ModalInform";
const BASE_URL = import.meta.env.VITE_API_URL;

const AssignMajorOfficer = () => {
	// Modal Info
	const [inform, setInform] = useState({ open: false, type: "", message: "" });
	const notify = (type, message) => setInform({ open: true, type, message });
	const close = () => setInform((s) => ({ ...s, open: false }));

	const [reloadTable, setReloadTable] = useState(false);
	const token = localStorage.getItem("token");
	const [assignMajorOfficer, setAssignMajorOfficer] = useState([]);
	const [openModal, setOpenModal] = useState(false);
	const [modalType, setModalType] = useState(false);

	const Form = useForm({
		initialValues: {
			user_id: "",
			name: "",
			major_id: "",
			password: "123456",
		},
		validate: {
			user_id: (value) => (value.trim().length > 0 ? null : "กรุณาเลือกชื่อ"),
			major_id: (value) => (value.trim().length > 0 ? null : "กรุณาเลือกสาขา"),
		},
	});

	// --- State สำหรับ Dropdown ---
	const [majorsData, setMajorsData] = useState([]); // 1. เก็บข้อมูลดิบของ "สาขา" (ที่มี id_fac)
	const [majorOptions, setMajorOptions] = useState([]); // 2. เก็บข้อมูล "สาขา" ที่แปลงแล้ว (สำหรับ Select 1)
	const [memberOptions, setMemberOptions] = useState([]); // 3. เก็บข้อมูล "บุคลากร" ที่แปลงแล้ว (สำหรับ Select 2)
	const [allAssignedOfficers, setAllAssignedOfficers] = useState([]); // 4. เก็บข้อมูล "คนที่ถูกแต่งตั้งแล้ว" (สำหรับกรอง)
	const [isLoadingMembers, setIsLoadingMembers] = useState(false); // 5. สถานะโหลด Select 2

	useEffect(() => {
		const fetchInitialData = async () => {
			try {
				const MajorOfficerRes = await fetch(`${BASE_URL}/api/allAssignMajorOfficer`, {
					method: "POST",
					headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
				});
				const MajorOfficerData = await MajorOfficerRes.json();
				if (!MajorOfficerRes.ok) throw new Error(MajorOfficerData.message);
				setAssignMajorOfficer(MajorOfficerData); // << สำหรับตาราง
				setAllAssignedOfficers(MajorOfficerData);
				console.log("MajorOfficer :", MajorOfficerData);

				const majorsRes = await fetch(`${BASE_URL}/api/majors`, {
					method: "POST",
					headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
				});
				const majorsData = await majorsRes.json();
				if (!majorsRes.ok) throw new Error(majorsData.message);
				setMajorsData(majorsData);

				const majorOptions = majorsData.map((m) => ({
					value: m.major_id,
					label: m.major_name,
				}));

				setMajorOptions(majorOptions);
				console.log("marjor :", majorOptions);
				console.log("Majors (Raw Data):", majorsData);
			} catch (e) {
				notify("error", e.message);
				console.error("Error fetch requestExamInfoAll:", e);
			}
			setReloadTable(false);
		};
		fetchInitialData();
	}, [reloadTable, token]);

	const handleOpenAdd = () => {
		Form.reset();
		setMemberOptions([]);
		setModalType("add");
		setOpenModal(true);
	};

	const handleOpenDelete = (item) => {
		Form.setValues(item);
		setMemberOptions([]);
		setModalType("delete");
		setOpenModal(true);
	};

	const handleSubmit = async () => {
		const url = {
			add: `${BASE_URL}/api/addAssignMajorOfficer`,
			delete: `${BASE_URL}/api/deleteAssignMajorOfficer`,
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
			if (!requestRes.ok) throw new Error(requestData.message);
			notify("success", requestData.message);
			setReloadTable(true);
			setOpenModal(false);
		} catch (e) {
			notify("error", e.message);
			console.error("Error fetch deleteAssignChairpersons:", e);
		}
	};
	const handleMajorChange = async (selectedMajorId) => {
		// 1. อัปเดตฟอร์ม (ทำโดย Form.getInputProps... อยู่แล้ว แต่ทำซ้ำเพื่อความชัดเจน)
		Form.setFieldValue("major_id", selectedMajorId);

		// ✅ 2. เคลียร์ค่าเก่าของ Select 2
		Form.setFieldValue("user_id", "");
		Form.setFieldValue("name", "");
		setMemberOptions([]);

		console.log(Form.values);

		if (!selectedMajorId) return; // ถ้าผู้ใช้ลบ (เลือก "ว่าง") ก็หยุด

		// 3. ค้นหา id_fac จากข้อมูลดิบ
		const selectedMajor = majorsData.find((m) => m.major_id === selectedMajorId);

		// ⚠️ จุดสำคัญ: ต้องมี id_fac
		if (!selectedMajor || !selectedMajor.id_fac) {
			console.error("ไม่พบ id_fac สำหรับสาขานี้:", selectedMajor);
			notify("error", "สาขานี้ไม่มีข้อมูล id_fac");
			return;
		}

		const id_fac = selectedMajor.id_fac;
		console.log(`Fetching members for id_fac: ${id_fac}`);
		setIsLoadingMembers(true); // เริ่มหมุน...

		try {
			// 4. Fetch รายชื่อคนจาก id_fac
			const res = await fetch(`/git-proxy/FrontEnd_Admission/admissionnew2022/loadMember/${id_fac}`, {
				method: "GET",
				headers: { "Content-Type": "application/json" },
			});
			const data = await res.json();
			if (!res.ok) throw new Error("ดึงข้อมูลบุคลากรไม่สำเร็จ");

			// 5. แปลงข้อมูล
			const formattedMembers = data.map((item) => ({
				value: item.employee_id,
				label: `${item.prename_full_tha}${item.first_name_tha} ${item.last_name_tha}`.trim(),
			}));

			// 6. กรองคนที่ "ยังว่าง" (ไม่ได้ถูกแต่งตั้งใน *ทุก* สาขา)
			const availableMembers = formattedMembers.filter((person) => !allAssignedOfficers.some((assigned) => assigned.user_id === person.value));

			setMemberOptions(availableMembers);
			console.log("Available Members:", availableMembers);
		} catch (e) {
			notify("error", e.message);
		} finally {
			setIsLoadingMembers(false); // หยุดหมุน
		}
	};

	const classRows = assignMajorOfficer.map((item) => {
		// ใช้ majorOptions ที่เรามีอยู่แล้ว
		const major = majorOptions.find((m) => m.value === item.major_id);
		return (
			<Table.Tr key={item.user_id}>
				<Table.Td>{major ? major.label : "-"}</Table.Td>
				<Table.Td>{item.name}</Table.Td>
				<Table.Td>
					<Group>
						<Button color="red" size="xs" onClick={() => handleOpenDelete(item)}>
							ลบ
						</Button>
					</Group>
				</Table.Td>
			</Table.Tr>
		);
	});

	return (
		<Box>
			<ModalInform opened={inform.open} onClose={close} message={inform.message} type={inform.type} />
			<Modal opened={openModal} onClose={() => setOpenModal(false)} title="กรอกข้อมูลเจ้าหน้าที่ประจำสาขาวิชา" centered>
				<Box>
					<form onSubmit={Form.onSubmit(handleSubmit)}>
						<Select
							label="เลือกสาขา"
							data={majorOptions}
							value={Form.values.major_id} // 1. กำหนด value เอง
							onChange={handleMajorChange} // 2. กำหนด onChange เอง
							error={Form.errors.major_id} // 3. กำหนด error เอง
							disabled={modalType === "delete"}
							placeholder="เลือกสาขา"
						/>

						{modalType === "delete" ? (
							<TextInput label="ชื่อ" {...Form.getInputProps("name")} disabled={true} />
						) : (
							<Select
								label="ชื่อ"
								searchable
								data={memberOptions}
								placeholder={isLoadingMembers ? "กำลังโหลด..." : "กรุณาเลือกสาขาก่อน"}
								disabled={isLoadingMembers || !Form.values.major_id}
								value={Form.values.user_id} // 1. กำหนด value เอง
								error={Form.errors.user_id} // 3. กำหนด error เอง
								// 2. กำหนด onChange เอง
								onChange={(value) => {
									Form.setFieldValue("user_id", value);
									const selected = memberOptions.find((c) => c.value === value);
									Form.setFieldValue("name", selected ? selected.label : "");
								}}
							/>
						)}
						<Space h="md" />
						<Button color={modalType === "delete" ? "red" : "green"} type="submit" fullWidth>
							{modalType === "delete" ? "ลบ" : "บันทึก"}
						</Button>
					</form>
				</Box>
			</Modal>

			<Text size="1.5rem" fw={900} mb="md">
				กรอกข้อมูลเจ้าหน้าที่ประจำสาขาวิชา
			</Text>
			<Space h="xl" />
			<Group justify="space-between">
				<Box></Box>
				<Box>
					<Button variant="filled" size="xs" onClick={() => handleOpenAdd()}>
						เพิ่ม
					</Button>
				</Box>
			</Group>
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

export default AssignMajorOfficer;
