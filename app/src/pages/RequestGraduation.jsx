//คำร้องขอสำเร็จการศึกษาระดับบัณฑิตศึกษา
import { useState, useEffect } from "react";
import { Box, Text, Table, Button, TextInput, Space, ScrollArea, Group, Select, Flex, Stepper, Pill } from "@mantine/core";
import { useForm } from "@mantine/form";
import ModalAddRequestGraduation from "../component/Modal/ModalAddRequestGraduation";
import ModalApprove from "../component/Modal/ModalApprove";
import ModalPay from "../component/Modal/ModalPay";
import ModalInform from "../component/Modal/ModalInform";
import Pdfg01 from "../component/PDF/Pdfg05";
import { jwtDecode } from "jwt-decode";
const BASE_URL = import.meta.env.VITE_API_URL;

const RequestGraduation = () => {
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
	// Modal states
	const [openAdd, setOpenAdd] = useState(false);
	const [openApprove, setOpenApprove] = useState(false);
	const [openApproveState, setOpenApproveState] = useState(false);
	const [openPay, setOpenPay] = useState(false);
	// Form states
	const [selectedRow, setSelectedRow] = useState(null);
	const [selected, setSelected] = useState("approve");
	const [comment, setComment] = useState("");
	const [error, setError] = useState("");
	// System states
	const [user, setUser] = useState("");
	//student //advisor //chairpersons //officer_registrar
	const [request, setRequest] = useState([]);
	const [search, setSearch] = useState("");

	const form = useForm({
		initialValues: {
			student_name: "",
			study_group_id: "",
			student_id: "",
			education_level: "",
			program: "",
			major_name: "",
			faculty_name: "",

			bachelor_major: "",
			bachelor_university: "",
			master_major: "",
			master_university: "",

			contact_house_no: "",
			contact_moo: "",
			contact_road: "",
			contact_subdistrict: "",
			contact_district: "",
			contact_province: "",
			contact_zipcode: "",
			contact_phone: "",

			work_name: "",
			work_moo: "",
			work_road: "",
			work_subdistrict: "",
			work_district: "",
			work_province: "",
			work_zipcode: "",
			work_phone: "",
			work_department: "",
		},
		validate: {
			bachelor_major: (value) => (value.trim() === "" ? "กรุณากรอกสาขาป.ตรี" : null),
			bachelor_university: (value) => (value.trim() === "" ? "กรุณากรอกมหาวิทยาลัยป.ตรี" : null),
			master_major: (value, values) => (values.education_level === "ปริญญาเอก" && value.trim() === "" ? "กรุณากรอกสาขาป.โท" : null),
			master_university: (value, values) => (values.education_level === "ปริญญาเอก" && value.trim() === "" ? "กรุณากรอกมหาวิทยาลัยป.โท" : null),

			contact_house_no: (value) => (value.trim() === "" ? "กรุณากรอกบ้านเลขที่" : null),
			contact_moo: (value) => (value.trim() === "" ? "กรุณากรอกหมู่ที่" : null),
			contact_road: (value) => (value.trim() === "" ? "กรุณากรอกถนน" : null),
			contact_subdistrict: (value) => (value.trim() === "" ? "กรุณากรอกตำบล" : null),
			contact_district: (value) => (value.trim() === "" ? "กรุณากรอกอำเภอ" : null),
			contact_province: (value) => (value.trim() === "" ? "กรุณากรอกจังหวัด" : null),
			contact_zipcode: (value) => (value === "" ? "กรุณากรอกรหัสไปรษณีย์" : null),
			contact_phone: (value) => (value.trim() === "" ? "กรุณากรอกเบอร์โทร" : null),

			work_name: (value) => (value.trim() === "" ? "กรุณากรอกสถานที่ทำงาน" : null),
			work_moo: (value) => (value.trim() === "" ? "กรุณากรอกหมู่ที่" : null),
			work_road: (value) => (value.trim() === "" ? "กรุณากรอกถนน" : null),
			work_subdistrict: (value) => (value.trim() === "" ? "กรุณากรอกตำบล" : null),
			work_district: (value) => (value.trim() === "" ? "กรุณากรอกอำเภอ" : null),
			work_province: (value) => (value.trim() === "" ? "กรุณากรอกจังหวัด" : null),
			work_zipcode: (value) => (value === "" ? "กรุณากรอกรหัสไปรษณีย์" : null),
			work_phone: (value) => (value.trim() === "" ? "กรุณากรอกเบอร์โทร" : null),
			work_department: (value) => (value.trim() === "" ? "กรุณากรอกหน่วยงาน" : null),
		},
	});

	useEffect(() => {
		const getProfile = async () => {
			try {
				const requestRes = await fetch(`${BASE_URL}/api/profile`, {
					method: "GET",
					headers: { Authorization: `Bearer ${token}` },
				});
				const requestData = await requestRes.json();
				if (!requestRes.ok) throw new Error(requestData.message);
				setUser(requestData);
				console.log(requestData);
			} catch (e) {
				notify("error", e.message || "เกิดข้อผิดพลาดในการเชื่อมต่อกับระบบ");
				console.error("Error fetching profile:", e);
			}
		};
		if (role === "student") getProfile();
	}, [token]);

	const [latestRequest, setLatestRequest] = useState(null);

	useEffect(() => {
		const fetchRequestExam = async () => {
			try {
				const requestRes = await fetch(`${BASE_URL}/api/allRequestGraduation`, {
					method: "POST",
					headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
				});
				const requestData = await requestRes.json();
				if (!requestRes.ok) throw new Error(requestData.message);
				setRequest(requestData);
				console.log(requestData);

				const ThesisDefenseRes = await fetch(`${BASE_URL}/api/allRequestThesisDefense`, {
					method: "POST",
					headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
				});
				const ThesisDefenseData = await ThesisDefenseRes.json();
				if (!ThesisDefenseRes.ok) throw new Error(ThesisDefenseData.message);
				console.log(ThesisDefenseData);

				if (ThesisDefenseData[0]?.status === "5" && ThesisDefenseData[0]?.exam_results === "ผ่าน") {
					if (requestData[0]?.status === "6" || requestData[0]?.status === undefined) {
						setLatestRequest(false);
					} else {
						setLatestRequest(true);
					}
				} else {
					setLatestRequest(true);
				}
			} catch (e) {
				notify("error", e.message || "เกิดข้อผิดพลาดในการเชื่อมต่อกับระบบ");
				console.error("Error fetching allRequestGraduation:", e);
			}
		};
		fetchRequestExam();
	}, []);

	const handleOpenAdd = async () => {
		try {
			const requestRes = await fetch(`${BASE_URL}/api/studentInfo`, {
				method: "GET",
				headers: { Authorization: `Bearer ${token}` },
			});
			const requestData = await requestRes.json();
			if (!requestRes.ok) throw new Error(requestData.message);
			form.reset();
			form.setValues(requestData);
			setOpenAdd(true);
		} catch (e) {
			notify("error", e.message || "เกิดข้อผิดพลาดในการเชื่อมต่อกับระบบ");
			console.error("Error fetching studentInfo:", e);
		}
	};

	const handleAdd = async () => {
		try {
			const requestRes = await fetch(`${BASE_URL}/api/addRequestGraduation`, {
				method: "POST",
				headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
				body: JSON.stringify(form.values),
			});
			const requestData = await requestRes.json();
			if (!requestRes.ok) throw new Error(requestData.message);
			notify("success", requestData.message || "สำเร็จ");
			setOpenAdd(false);

			setRequest((prev) => {
				// ✅ ถ้ามี id แปลว่า update → แก้ไขข้อมูลแถวเดิม
				if (form.values.request_graduation_id) {
					return prev.map((item) => (item.request_graduation_id === form.values.request_graduation_id ? { ...item, ...requestData.data, ...form.values } : item));
				}

				// ✅ ถ้าไม่มี id แปลว่า insert → เพิ่มบรรทัดใหม่
				return [...prev, { ...requestData.data, ...form.values }];
			});

			setLatestRequest({ ...requestData.data, ...form.values });
		} catch (e) {
			notify("error", e.message || "เกิดข้อผิดพลาดในการเชื่อมต่อกับระบบ");
			console.error("Error fetching addRequestGraduation:", e);
		}
	};

	const handleOpenEdit = async (item) => {
		form.setValues(item);
		setOpenAdd(true);
	};

	const handleApprove = async (item) => {
		if (selected === "noapprove" && comment.trim() === "") {
			setError("กรุณาระบุเหตุผล");
			return;
		}
		console.log(item);

		try {
			const requestRes = await fetch(`${BASE_URL}/api/approveRequestGraduation`, {
				method: "POST",
				headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
				body: JSON.stringify({ request_graduation_id: item.request_graduation_id, name: user.name, role: role, selected: selected, comment: comment }),
			});
			const requestData = await requestRes.json();
			if (!requestRes.ok) throw new Error(requestData.message);
			notify("success", requestData.message || "สำเร็จ");
			setSelected("approve");
			setComment("");
			setOpenApprove(false);
			setRequest((prev) => prev.map((row) => (row.request_graduation_id === item.request_graduation_id ? { ...row, ...requestData.data } : row)));
		} catch (e) {
			notify("error", e.message || "เกิดข้อผิดพลาดในการเชื่อมต่อกับระบบ");
			console.error("Error fetching approveRequestGraduation:", e);
		}
	};

	const handlePay = async (item) => {
		try {
			const requestRes = await fetch(`${BASE_URL}/api/payRequestGraduation`, {
				method: "POST",
				headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
				body: JSON.stringify({ request_graduation_id: item.request_graduation_id, receipt_vol: "154", receipt_No: "4", receipt_pay: "1000" }),
			});
			const requestData = await requestRes.json();
			if (!requestRes.ok) {
				throw new Error(requestData.message);
			}
			notify("success", requestData.message || "สำเร็จ");
			setOpenPay(false);
			setRequest((prev) => prev.map((row) => (row.request_graduation_id === item.request_graduation_id ? { ...row, ...requestData.data } : row)));
		} catch (e) {
			notify("error", e.message || "เกิดข้อผิดพลาดในการเชื่อมต่อกับระบบ");
			console.error("Error fetching payRequestGraduation:", e);
		}
	};

	function sortRequests(data, role) {
		if (role === "student") return data;
		return data.sort((a, b) => {
			const orderA = Number(a.status) === 0 ? 1 : 0;
			const orderB = Number(b.status) === 0 ? 1 : 0;
			return orderA - orderB || Number(a.status) - Number(b.status);
		});
	}

	const sortedData = sortRequests(request, role);

	const filteredData = sortedData.filter((p) => {
		const matchesSearch = [p.student_name, p.student_id].join(" ").toLowerCase().includes(search.toLowerCase());
		return matchesSearch;
	});

	const rows = filteredData.map((item) => (
		<Table.Tr key={item.request_graduation_id}>
			<Table.Td>{item.student_name}</Table.Td>
			{["advisor", "officer_registrar", "chairpersons"].includes(role) && <Table.Td>{item.request_type}</Table.Td>}
			<Table.Td style={{ textAlign: "center" }}>
				{item.status <= 4 && item.status > 0 && (
					<Stepper active={item.status === "4" ? item.status - 2 : item.status - 1} iconSize={20} styles={{ separator: { marginLeft: -4, marginRight: -4 }, stepIcon: { fontSize: 10 } }}>
						{[...Array(3)].map((_, i) => (
							<Stepper.Step key={i}>
								<Pill>{item.status_text}</Pill>
							</Stepper.Step>
						))}
					</Stepper>
				)}
				{(item.status == 0 || item.status > 6) && (
					<Pill variant="filled" style={{ backgroundColor: "#ffcccc", color: "#b30000" }}>
						{item.status_text}
					</Pill>
				)}
				{item.status == 5 && (
					<Pill variant="filled" style={{ backgroundColor: "#ccffcc", color: "#006600" }}>
						{item.status_text}
					</Pill>
				)}
				{item.status == 6 && (
					<>
						<Pill variant="filled" style={{ backgroundColor: "#ffcccc", color: "#b30000" }}>
							{item.status_text}
						</Pill>
						<br />
						{!item.advisor_approvals && "อาจารย์ที่ปรึกษา"}
						{item.advisor_approvals && !item.chairpersons_approvals && "ประธานหลักสูตร"}
					</>
				)}
			</Table.Td>
			<Table.Td style={{ maxWidth: "150px" }}>
				<Group>
					{role === "student" && (
						<>
							{item.status != 5 && (
								<Button size="xs" color="yellow" onClick={() => handleOpenEdit(item)}>
									แก้ไข
								</Button>
							)}
							{item.status === "4" && (
								<Button
									size="xs"
									color="green"
									onClick={() => {
										setSelectedRow(item);
										setOpenPay(true);
									}}
								>
									ชำระค่าธรรมเนียม
								</Button>
							)}
							{(item.status == 5 || item.status == 0 || item.status > 6) && (
								<Button size="xs" color="green">
									พิมพ์ใบเสร็จ
								</Button>
							)}
						</>
					)}
					<Pdfg01 data={item} showType={item.status == 0 ? undefined : (role === "advisor" && item.status <= 1) || (role === "chairpersons" && item.status <= 2) || (role === "officer_registrar" && item.status <= 3) ? "view" : undefined} />
					{((role === "advisor" && item.status == 1) || (role === "chairpersons" && item.status == 2) || (role === "officer_registrar" && item.status == 3)) && (
						<Button
							size="xs"
							color="green"
							onClick={() => {
								setSelectedRow(item);
								setOpenApproveState("add");
								setOpenApprove(true);
							}}
						>
							{role === "officer_registrar" ? "ตรวจสอบ" : "ลงความเห็น"}
						</Button>
					)}
				</Group>
			</Table.Td>
		</Table.Tr>
	));

	return (
		<Box>
			<ModalInform opened={inform.open} onClose={close} message={inform.message} type={inform.type} />
			<ModalApprove
				opened={openApprove}
				onClose={() => setOpenApprove(false)}
				selectedRow={selectedRow}
				selected={selected}
				setSelected={setSelected}
				comment={comment}
				setComment={setComment}
				error={error}
				openApproveState={openApproveState}
				handleApprove={handleApprove}
				role={role}
				title={`คำร้องขอสำเร็จการศึกษาระดับบัณฑิตศึกษา`}
			/>
			<ModalAddRequestGraduation opened={openAdd} onClose={() => setOpenAdd(false)} form={form} handleAdd={handleAdd} title={`เพิ่มคำร้องขอสำเร็จการศึกษาระดับบัณฑิตศึกษา`} />
			<ModalPay opened={openPay} onClose={() => setOpenPay(false)} selectedRow={selectedRow} handlePay={handlePay} />

			<Text size="1.5rem" fw={900} mb="md">
				คำร้องขอสำเร็จการศึกษาระดับบัณฑิตศึกษา
			</Text>
			<Group justify="space-between">
				<Box>
					<Flex align="flex-end" gap="sm">
						{role !== "student" && <TextInput placeholder="ค้นหาชื่่อ รหัส" value={search} onChange={(e) => setSearch(e.target.value)} />}{" "}
					</Flex>
				</Box>
				<Box>
					{role === "student" && (
						<Button onClick={() => handleOpenAdd()} disabled={latestRequest ? latestRequest.status !== "0" && latestRequest.status !== "6" && latestRequest.exam_results !== false : false}>
							เพิ่มคำร้อง
						</Button>
					)}
				</Box>
			</Group>
			<Space h="md" />
			<ScrollArea type="scroll" offsetScrollbars style={{ borderRadius: "8px", border: "1px solid #e0e0e0" }}>
				<Table horizontalSpacing="sm" verticalSpacing="sm" highlightOnHover>
					<Table.Thead>
						<Table.Tr>
							<Table.Th style={{ minWidth: 100 }}>ชื่อ</Table.Th>
							{["advisor", "officer_registrar", "chairpersons"].includes(role) && <Table.Th style={{ minWidth: 100 }}>เรื่อง</Table.Th>}
							<Table.Th style={{ minWidth: 110 }}>สถานะ</Table.Th>
							<Table.Th>การดำเนินการ</Table.Th>
						</Table.Tr>
					</Table.Thead>
					<Table.Tbody>{rows}</Table.Tbody>
				</Table>
			</ScrollArea>
		</Box>
	);
};

export default RequestGraduation;
