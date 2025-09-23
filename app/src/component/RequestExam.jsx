//ตารางคำร้องขอ
import { useState, useEffect } from "react";
import { Box, Text, Table, Button, TextInput, Space, ScrollArea, Group, Select, Flex, Stepper, Pill } from "@mantine/core";
import { useParams } from "react-router-dom";
import ModalAdd from "./Modal/ModalAdd";
import ModalApprove from "./Modal/ModalApprove";
import ModalPay from "./Modal/ModalPay";
import ModalInform from "./Modal/ModalInform";
import ModalCheckCourse from "./Modal/ModalCheckCourse";
import Pdfg01 from "./PDF/Pdfg01";
import { useForm } from "@mantine/form";

const RequestExam = () => {
	const token = localStorage.getItem("token");
	const payloadBase64 = token.split(".")[1];
	const payload = JSON.parse(atob(payloadBase64));
	const role = payload.role;
	const user_id = payload.user_id;
	// Modal Info
	const [inform, setInform] = useState({ open: false, type: "", message: "" });
	const notify = (type, message) => setInform({ open: true, type, message });
	const close = () => setInform((s) => ({ ...s, open: false }));
	const [timeout, setTimeout] = useState(3000);
	// Modal states
	const [openAdd, setOpenAdd] = useState(false);
	const [openApprove, setOpenApprove] = useState(false);
	const [openApproveState, setOpenApproveState] = useState(false);
	const [openPay, setOpenPay] = useState(false);
	const [openCheckCourse, setOpenCheckCourse] = useState(false);
	// Form states
	const [selectedRow, setSelectedRow] = useState(null);
	const [selected, setSelected] = useState("approve");
	const [comment, setComment] = useState("");
	const [error, setError] = useState("");
	// System states
	const [user, setUser] = useState("");
	const [request, setRequest] = useState([]);
	const [search, setSearch] = useState("");
	const { type } = useParams();
	const [selectedType, setSelectedType] = useState("");
	const [latestRequest, setLatestRequest] = useState(true);

	const [missingCoures, setMissingCoures] = useState([]);

	const form = useForm({
		initialValues: {},
		validate: {},
	});

	/* const [registerCourses, setRegisterCourses] = useState([]); */
	const [registerCoursesData, setRegisterCourses] = useState(() => (user_id === "684270201" ? ["1065208R", "1065222R", "1065208R", "1065222R", "1066205R"] : ["1065208R", "1066205R", "1065222R", "1065204R", "1065232R", "1065202R", "1065201R", "1065206R", "1065208R", "1065231R"]));

	useEffect(() => {
		setSelectedType(type);
	}, [type]);

	useEffect(() => {
		const fetchProfile = async () => {
			try {
				const req = await fetch("http://localhost:8080/api/profile", {
					method: "GET",
					headers: { Authorization: `Bearer ${token}` },
				});
				const res = await req.json();
				if (!req.ok) throw new Error(res.message);
				setUser(res);
			} catch (e) {
				notify("error", e.message);
				console.error("Error fetchProfile:", e);
			}
		};
		const fetchRequestExam = async () => {
			try {
				const req = await fetch("http://localhost:8080/api/requestExamAll", {
					method: "POST",
					headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
				});
				const res = await req.json();
				if (!req.ok) throw new Error(res.message);
				setRequest(res);

				const countFailOrAbsent = res.filter((row) => row.exam_results === "ไม่ผ่าน" || row.exam_results === "ขาดสอบ").length;
				if (!res.length) setLatestRequest(false);
				else if (countFailOrAbsent > 2) setLatestRequest(true);
				else if (res[0].exam_results === "ไม่ผ่าน" || res[0].exam_results === "ขาดสอบ") setLatestRequest(false);
				else setLatestRequest(res[0]);
			} catch (e) {
				notify("error", e.message);
				console.error("Error fetching requestExamAll:", e);
			}
		};
		const fetchStudentData = async () => {
			try {
				const res = await fetch("http://localhost:8080/api/check_openKQ", {
					method: "POST",
					headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
				});
				const data = await res.json();
				if (!res.ok) throw new Error(data.message);
				if (data.message) throw new Error(data.message);
				console.log(data);

				const registrationRes = await fetch("http://localhost:8080/api/allStudyGroupIdCourseRegistration", {
					method: "POST",
					headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
				});
				const registrationData = await registrationRes.json();
				if (!registrationData) throw new Error("รอเจ้าหน้าที่กรอกราย วิชาที่ต้องเรียน");
				if (!registrationRes.ok) throw new Error(registrationData.message);
				console.log(registrationData);

				/* const registerCoursesRes = await fetch("http://mua.kpru.ac.th/FrontEnd_Tabian/apiforall/ListSubjectPass", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						ID_NO: user_id,
					}),
				});
				const registerCoursesData = await registerCoursesRes.json();
				if (!registerCoursesRes.ok) throw new Error(registerCoursesData.message); 
				console.log(registerCoursesData);

				const allCodes = registerCoursesData.map((c) => c.SJCODE);
				const missing = registrationData.course_id.filter((code) => !allCodes.includes(code));
				console.log(missing);*/

				const missing = registrationData.course_id.filter((code) => !registerCoursesData.includes(code));
				console.log(missing);

				if (missing.length > 0) {
					const coursesRes = await fetch("http://localhost:8080/api/Course", {
						method: "POST",
						headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
						body: JSON.stringify({ course_id: missing }),
					});
					const coursesData = await coursesRes.json();
					if (!coursesRes.ok) throw new Error(coursesData.message);

					/* const res = await fetch("http://mua.kpru.ac.th/FrontEnd_Tabian/apiforall/ListSubjectAll");
					const subjects = await res.json();
					console.log(subjects);
					const subjMap = new Map(subjects.map((s) => [s.SUBJCODE, s.SUBJNAME]));
					const coursesData = missing.map((course_id) => ({
						course_id,
						course_name: subjMap.get(course_id) || "ไม่พบข้อมูล",
					})); */

					console.log(coursesData);
					setMissingCoures(coursesData);
					setOpenCheckCourse(true);
					return;
				}
				fetchRequestExam();
			} catch (e) {
				setTimeout(10000)
				notify("error", e.message);
				console.error("Error fetching CourseCheck:", e);
			}
		};
		fetchProfile();
		if (role === "student") {
			user_id === "684270201" ? fetchStudentData() : fetchRequestExam();
			/* user_id === "674140101" ? fetchStudentData() : fetchRequestExam(); */
		} else {
			fetchRequestExam();
		}
	}, []);

	const handleOpenAdd = async () => {
		setTimeout(3000)
		try {
			const req = await fetch("http://localhost:8080/api/studentInfo", {
				method: "GET",
				headers: { Authorization: `Bearer ${token}` },
			});
			const res = await req.json();
			if (!req.ok) throw new Error(res.message);
			form.setValues(res);
			setOpenAdd(true);
		} catch (e) {
			notify("error", e.message);
			console.error("Error fetching studentInfo:", e);
		}
	};

	const handleAdd = async () => {
		setTimeout(3000)
		try {
			const requestRes = await fetch("http://localhost:8080/api/addRequestExam", {
				method: "POST",
				headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
				body: JSON.stringify(form.values),
			});
			const requestData = await requestRes.json();
			if (!requestRes.ok) throw new Error(requestData.message);
			notify("success", requestData.message || "สำเร็จ");
			setOpenAdd(false);
			setRequest((prev) => [...prev, { ...requestData.data, ...form.values }]);
			setLatestRequest(true);
		} catch (e) {
			notify("error", e.message);
			console.error("Error fetching addRequestExam:", e);
		}
	};

	const handleApprove = async (item) => {
		setTimeout(3000)
		if (selected === "noapprove" && comment.trim() === "") {
			setError("กรุณาระบุเหตุผล");
			return;
		}
		try {
			const requestRes = await fetch("http://localhost:8080/api/approveRequestExam", {
				method: "POST",
				headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
				body: JSON.stringify({ request_exam_id: item.request_exam_id, name: user.name, selected: selected, comment: comment }),
			});
			const requestData = await requestRes.json();
			if (!requestRes.ok) throw new Error(requestData.message);
			notify("success", requestData.message || "สำเร็จ");
			setSelected("approve");
			setComment("");
			setOpenApprove(false);
			setRequest((prev) => prev.map((row) => (row.request_exam_id === item.request_exam_id ? { ...row, ...requestData.data } : row)));
		} catch (e) {
			notify("error", e.message);
			console.error("Error fetching approveRequestExam:", e);
		}
	};

	const handlePay = async (item) => {
		setTimeout(3000)
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
			notify("error", e.message);
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

	const sortedData = sortRequests(request, role);

	const filteredData = sortedData.filter((p) => {
		const matchesSearch = [p.student_name, p.student_id].join(" ").toLowerCase().includes(search.toLowerCase());
		const matchesType = selectedType ? p.request_type === selectedType : true;
		return matchesSearch && matchesType;
	});

	const rows = filteredData.map((item) => (
		<Table.Tr key={item.request_exam_id}>
			<Table.Td>{item.student_name}</Table.Td>
			<Table.Td style={{ textAlign: "center" }}>{item.term}</Table.Td>
			{["advisor", "officer_registrar", "chairpersons"].includes(role) && <Table.Td>{item.request_type}</Table.Td>}
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
						{item.advisor_approvals && !item.chairpersons_approvals && "ประธานกรรมการปะจำสาขาวิชา"}
						{item.advisor_approvals && item.chairpersons_approvals && !item.registrar_approvals && "เจ้าหน้าที่ทะเบียน"}
					</>
				)}
			</Table.Td>
			<Table.Td style={{ maxWidth: "150px" }}>
				<Group>
					{role === "student" && (
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
							{item.receipt_vol_No != null && (
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
			{item.exam_results !== null && (
				<Table.Td style={{ textAlign: "center" }}>
					{item.exam_results === "ผ่าน" && <Text c="green">ผ่าน</Text>}
					{item.exam_results === "ไม่ผ่าน" && <Text c="red">ไม่ผ่าน</Text>}
					{item.exam_results === "ขาดสอบ" && <Text c="gray">ขาดสอบ</Text>}
				</Table.Td>
			)}
		</Table.Tr>
	));

	return (
		<Box>
			<ModalCheckCourse opened={openCheckCourse} onClose={() => setOpenCheckCourse(false)} missingCoures={missingCoures} />
			<ModalInform opened={inform.open} onClose={close} message={inform.message} type={inform.type} timeout={timeout} />
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
				title={`${role === "officer_registrar" ? "ตรวจสอบ" : "ลงความเห็น"}คำร้องขอสอบ${user.education_level === "ปริญญาโท" ? "ประมวลความรู้" : "วัดคุณสมบัติ"}`}
			/>
			<ModalAdd opened={openAdd} onClose={() => setOpenAdd(false)} form={form.values} handleAdd={handleAdd} title={`เพิ่มคำร้องขอสอบ${user.education_level === "ปริญญาโท" ? "ประมวลความรู้" : "วัดคุณสมบัติ"}`} />
			<ModalPay opened={openPay} onClose={() => setOpenPay(false)} selectedRow={selectedRow} handlePay={handlePay} />

			<Text size="1.5rem" fw={900} mb="md">
				{`คำร้องขอสอบ${type ? type : `${user.education_level ? `${user.education_level === "ปริญญาโท" ? "ประมวลความรู้" : "วัดคุณสมบัติ"}` : "ประมวลความรู้/วัดคุณสมบัติ"}`}`}
			</Text>
			<Group justify="space-between">
				<Box>
					<Flex align="flex-end" gap="sm">
						{role !== "student" && <TextInput placeholder="ค้นหาชื่่อ รหัส" value={search} onChange={(e) => setSearch(e.target.value)} />}
						{role === "chairpersons" && <Select placeholder="ชนิดคำขอ" data={["ขอสอบประมวลความรู้", "ขอสอบวัดคุณสมบัติ"]} value={selectedType} onChange={setSelectedType} />}
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
							<Table.Th style={{ minWidth: 100 }}>ภาคเรียน</Table.Th>
							{["advisor", "officer_registrar", "chairpersons"].includes(role) && <Table.Th style={{ minWidth: 100 }}>เรื่อง</Table.Th>}
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

export default RequestExam;
