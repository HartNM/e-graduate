//รายงานผลการตรวจสอบการคัดลอกผลงานทางวิชาการ
import { useState, useEffect } from "react";
import { Box, Text, Table, Button, TextInput, Space, ScrollArea, Group, Select, Flex, Stepper, Pill } from "@mantine/core";
import { useForm } from "@mantine/form";
import { useParams } from "react-router-dom";
import ModalAddRequestGraduation from "../component/Modal/ModalAddPlagiarismReport";
import ModalApprove from "../component/Modal/ModalApprove";
import ModalPay from "../component/Modal/ModalPay";
import ModalInform from "../component/Modal/ModalInform";
import Pdfg01 from "../component/PDF/Pdfg06";

const PlagiarismReport = () => {
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
	const [formData, setFormData] = useState({});
	const [selectedRow, setSelectedRow] = useState(null);
	const [selected, setSelected] = useState("approve");
	const [comment, setComment] = useState("");
	const [error, setError] = useState("");
	// System states
	const [user, setUser] = useState("");
	//student //advisor //chairpersons //officer_registrar
	const [request, setRequest] = useState([]);
	const [search, setSearch] = useState("");
	const token = localStorage.getItem("token");
	const { type } = useParams();
	const [selectedType, setSelectedType] = useState("");

	const validateChapter = (value) => {
		if (value === null || value === "") return "ห้ามเว้นว่าง";
		if (value < 0 || value > 100) return "กรอก 0-100 เท่านั้น";
		return null;
	};

	const AddForm = useForm({
		initialValues: {
			student_name: "",
			study_group_id: "",
			student_id: "",
			education_level: "",
			program: "",
			major_name: "",
			faculty_name: "",
			chapter_1: "",
			chapter_2: "",
			chapter_3: "",
			chapter_4: "",
			chapter_5: "",
			inspection_date: "",
		},
		validate: {
			chapter_1: validateChapter,
			chapter_2: validateChapter,
			chapter_3: validateChapter,
			chapter_4: validateChapter,
			chapter_5: validateChapter,
			inspection_date: (v) => {
				if (!v) return "กรุณาระบุวันที่ปิด";
			},
		},
	});

	useEffect(() => {
		const fetchProfile = async () => {
			try {
				const requestRes = await fetch("http://localhost:8080/api/profile", {
					method: "GET",
					headers: { Authorization: `Bearer ${token}` },
				});
				const requestData = await requestRes.json();
				if (!requestRes.ok) {
					throw new Error(requestData.message);
				}
				setUser(requestData);
				console.log(requestData);
			} catch (e) {
				notify("error", e.message || "เกิดข้อผิดพลาดในการเชื่อมต่อกับระบบ");
				console.error("Error fetching profile:", e);
			}
		};
		fetchProfile();
	}, [token]);

	useEffect(() => {
		setSelectedType(type);
	}, [type]);

	const [latestRequest, setLatestRequest] = useState(null);

	useEffect(() => {
		if (!user) return;
		const fetchRequestExam = async () => {
			try {
				const requestRes = await fetch("http://localhost:8080/api/requestExamAll", {
					method: "POST",
					headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
					body: JSON.stringify({ role: user.role, id: user.id }),
				});
				const requestData = await requestRes.json();
				if (!requestRes.ok) {
					throw new Error(requestData.message);
				}

				setRequest(requestData);
				console.log(requestData);
				setLatestRequest(requestData[0]);
				console.log(requestData[0]);
			} catch (e) {
				notify("error", e.message || "เกิดข้อผิดพลาดในการเชื่อมต่อกับระบบ");
				console.error("Error fetching requestExamAll:", e);
			}
		};
		fetchRequestExam();
	}, [user]);

	const handleOpenAdd = async () => {
		try {
			const requestRes = await fetch("http://localhost:8080/api/studentInfo", {
				method: "GET",
				headers: { Authorization: `Bearer ${token}` },
			});
			const requestData = await requestRes.json();
			if (!requestRes.ok) {
				throw new Error(requestData.message);
			}
			AddForm.reset();
			AddForm.setValues({
				student_name: requestData.student_name || "",
				student_id: requestData.student_id || "",
				study_group_id: requestData.study_group_id || "",
				education_level: requestData.education_level || "",
				program: requestData.program || "",
				major_name: requestData.major_name || "",
				faculty_name: requestData.faculty_name || "",
			});
			console.log(AddForm.values);
			setFormData(requestData);
			setOpenAdd(true);
		} catch (e) {
			notify("error", e.message || "เกิดข้อผิดพลาดในการเชื่อมต่อกับระบบ");
			console.error("Error fetching studentInfo:", e);
		}
	};

	const handleAdd = async () => {
		console.log(AddForm.values);
		console.log(formData);

		/* try {
			const requestRes = await fetch("http://localhost:8080/api/addRequestExam", {
				method: "POST",
				headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
				body: JSON.stringify(formData),
			});
			const requestData = await requestRes.json();
			if (!requestRes.ok) {
				throw new Error(requestData.message);
			}
			notify("success", requestData.message || "สำเร็จ");
			setOpenAdd(false);
			setRequest((prev) => [...prev, { ...requestData.data, ...formData }]);
			setLatestRequest({ ...requestData.data, ...formData });
		} catch (e) {
			notify("error", e.message || "เกิดข้อผิดพลาดในการเชื่อมต่อกับระบบ");
			console.error("Error fetching addRequestExam:", e);
		} */
	};

	const handleApprove = async (item) => {
		if (selected === "noapprove" && comment.trim() === "") {
			setError("กรุณาระบุเหตุผล");
			return;
		}
		try {
			const requestRes = await fetch("http://localhost:8080/api/approveRequestExam", {
				method: "POST",
				headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
				body: JSON.stringify({ request_exam_id: item.request_exam_id, name: user.name, role: user.role, selected: selected, comment: comment }),
			});
			const requestData = await requestRes.json();
			if (!requestRes.ok) {
				throw new Error(requestData.message);
			}
			notify("success", requestData.message || "สำเร็จ");
			setSelected("approve");
			setComment("");
			setOpenApprove(false);
			setRequest((prev) => prev.map((row) => (row.request_exam_id === item.request_exam_id ? { ...row, ...requestData.data } : row)));
		} catch (e) {
			notify("error", e.message || "เกิดข้อผิดพลาดในการเชื่อมต่อกับระบบ");
			console.error("Error fetching approveRequestExam:", e);
		}
	};

	const handlePay = async (item) => {
		try {
			const requestRes = await fetch("http://localhost:8080/api/payRequestExam", {
				method: "POST",
				headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
				body: JSON.stringify({ request_exam_id: item.request_exam_id, receipt_vol_No: "10/54" }),
			});
			const requestData = await requestRes.json();
			if (!requestRes.ok) {
				throw new Error(requestData.message);
			}
			notify("success", requestData.message || "สำเร็จ");
			setOpenPay(false);
			setRequest((prev) => prev.map((row) => (row.request_exam_id === item.request_exam_id ? { ...row, ...requestData.data } : row)));
		} catch (e) {
			notify("error", e.message || "เกิดข้อผิดพลาดในการเชื่อมต่อกับระบบ");
			console.error("Error fetching payRequestExam:", e);
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

	const sortedData = sortRequests(request, user.role);

	const filteredData = sortedData.filter((p) => {
		const matchesSearch = [p.student_name, p.student_id].join(" ").toLowerCase().includes(search.toLowerCase());
		const matchesType = selectedType ? p.request_type === selectedType : true;
		return matchesSearch && matchesType;
	});

	const rows = filteredData.map((item) => (
		<Table.Tr key={item.request_exam_id}>
			<Table.Td>{item.student_name}</Table.Td>
			{["advisor", "officer_registrar", "chairpersons"].includes(user?.role) && <Table.Td>{item.request_type}</Table.Td>}
			<Table.Td style={{ textAlign: "center" }}>
				{item.status <= 4 && item.status > 0 && (
					<Stepper active={item.status - 1} iconSize={20} styles={{ separator: { marginLeft: -4, marginRight: -4 }, stepIcon: { fontSize: 10 } }}>
						{[...Array(4)].map((_, i) => (
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
						{item.advisor_approvals && item.chairpersons_approvals && !item.registrar_approvals && "เจ้าหน้าที่ทะเบียน"}
					</>
				)}
			</Table.Td>
			<Table.Td style={{ maxWidth: "150px" }}>
				<Group>
					{user.role === "student" && (
						<>
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
					<Pdfg01 data={item} showType={item.status == 0 ? undefined : (user.role === "advisor" && item.status <= 1) || (user.role === "chairpersons" && item.status <= 2) || (user.role === "officer_registrar" && item.status <= 3) ? "view" : undefined} />
					{((user.role === "advisor" && item.status == 1) || (user.role === "chairpersons" && item.status == 2) || (user.role === "officer_registrar" && item.status == 3)) && (
						<Button
							size="xs"
							color="green"
							onClick={() => {
								setSelectedRow(item);
								setOpenApproveState("add");
								setOpenApprove(true);
							}}
						>
							{user.role === "officer_registrar" ? "ตรวจสอบ" : "ลงความเห็น"}
						</Button>
					)}
				</Group>
			</Table.Td>
			{item.exam_results !== null && (
				<Table.Td style={{ textAlign: "center" }}>
					{item.exam_results === true && <Text c="green">ผ่าน</Text>}
					{item.exam_results === false && <Text c="red">ไม่ผ่าน</Text>}
				</Table.Td>
			)}
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
				role={user.role}
				title={`${user.role === "officer_registrar" ? "ตรวจสอบ" : "ลงความเห็น"}คำร้องขอสอบ${user.education_level === "ปริญญาโท" ? "ประมวลความรู้" : "วัดคุณสมบัติ"}`}
			/>
			<ModalAddRequestGraduation opened={openAdd} onClose={() => setOpenAdd(false)} AddForm={AddForm} handleAdd={handleAdd} title={`เพิ่มคำร้องขอสอบ${user.education_level === "ปริญญาโท" ? "ประมวลความรู้" : "วัดคุณสมบัติ"}`} />
			<ModalPay opened={openPay} onClose={() => setOpenPay(false)} selectedRow={selectedRow} handlePay={handlePay} />

			<Text size="1.5rem" fw={900} mb="md">
				{`คำร้องขอสอบ${user.education_level ? `${user.education_level === "ปริญญาโท" ? "ประมวลความรู้" : "วัดคุณสมบัติ"}` : ""}`}
			</Text>
			<Group justify="space-between">
				<Box>
					<Flex align="flex-end" gap="sm">
						{user.role !== "student" && <TextInput placeholder="ค้นหาชื่่อ รหัส" value={search} onChange={(e) => setSearch(e.target.value)} />}
						{user.role === "chairpersons" && <Select placeholder="ชนิดคำขอ" data={["ขอสอบประมวลความรู้", "ขอสอบวัดคุณสมบัติ"]} value={selectedType} onChange={setSelectedType} />}
					</Flex>
				</Box>
				<Box>
					{user.role === "student" && (
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
							{["advisor", "officer_registrar", "chairpersons"].includes(user?.role) && <Table.Th style={{ minWidth: 100 }}>เรื่อง</Table.Th>}
							<Table.Th style={{ minWidth: 110 }}>สถานะ</Table.Th>
							<Table.Th>การดำเนินการ</Table.Th>
							{request.some((it) => it.exam_results !== null) && <Table.Th style={{ minWidth: 110 }}>ผลสอบ</Table.Th>}
						</Table.Tr>
					</Table.Thead>
					<Table.Tbody>{rows}</Table.Tbody>
				</Table>
			</ScrollArea>
		</Box>
	);
};

export default PlagiarismReport;
