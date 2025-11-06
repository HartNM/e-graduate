//คำร้องขอสอบประมวลความรู้/วัดคุณสมบัติ
import { useState, useEffect, useMemo } from "react";
import { Box, Text, Table, Button, TextInput, Space, ScrollArea, Group, Select, Flex, Stepper, Pill } from "@mantine/core";
import { useParams } from "react-router-dom";
import ModalAdd from "../component/Modal/ModalAdd";
import ModalApprove from "../component/Modal/ModalApprove";
import ModalPay from "../component/Modal/ModalPay";
import ModalInform from "../component/Modal/ModalInform";
import ModalCheckCourse from "../component/Modal/ModalCheckCourse";
import Pdfg01 from "../component/PDF/Pdfg01";
import { useForm } from "@mantine/form";
import { jwtDecode } from "jwt-decode";

const RequestExam = () => {
	const token = localStorage.getItem("token");

	const payload = useMemo(() => {
		return jwtDecode(token);
	}, [token]);
	const role = payload.role;
	const user_id = payload.user_id;
	const name = payload.name;
	/* console.log(role, user_id, name); */

	// Modal Info
	const [inform, setInform] = useState({ open: false, type: "", message: "", timeout: 3000 });
	const notify = (type, message, timeout = 3000) => setInform({ open: true, type, message, timeout });
	const close = () => setInform((s) => ({ ...s, open: false }));
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
	const [request, setRequest] = useState(null);
	const [search, setSearch] = useState("");
	const { type } = useParams();
	const [selectedType, setSelectedType] = useState("");
	const [latestRequest, setLatestRequest] = useState(true);

	const [missingCoures, setMissingCoures] = useState([]);

	const form = useForm({
		initialValues: {},
		validate: {},
	});

	useEffect(() => {
		setSelectedType(type);
	}, [type]);

	const [term, setTerm] = useState([]);
	const [selectedTerm, setSelectedTerm] = useState("");

	useEffect(() => {
		const getProfile = async () => {
			try {
				const req = await fetch("http://localhost:8080/api/profile", {
					method: "GET",
					headers: { Authorization: `Bearer ${token}` },
				});
				const res = await req.json();
				if (!req.ok) throw new Error(res.message);
				setUser(res);
				console.log(res);
			} catch (e) {
				notify("error", e.message);
				console.error(e);
			}
		};
		getProfile();

		const getTerm = async () => {
			try {
				const termInfoReq = await fetch("http://localhost:8080/api/allRequestExamInfo", {
					method: "POST",
					headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
				});
				const termInfodata = await termInfoReq.json();
				if (!termInfoReq.ok) throw new Error(termInfodata.message);
				setTerm(termInfodata.map((item) => item.term));
				console.log(termInfodata);

				const today = new Date();
				// หา term ที่อยู่ในช่วง open-close
				let currentTerm = termInfodata.find((item) => {
					const open = new Date(item.term_open_date);
					const close = new Date(item.term_close_date);
					return today >= open && today <= close;
				});
				if (!currentTerm && termInfodata.length > 0) {
					// ถ้าไม่เจอ currentTerm → เลือกเทอมล่าสุดจาก close_date
					currentTerm = [...termInfodata].sort((a, b) => new Date(b.term_close_date) - new Date(a.term_close_date))[0];
				}
				if (currentTerm) {
					setSelectedTerm(currentTerm.term);
				} else {
					// แจ้งเตือน หรือ set ค่า default ถ้าไม่มีเทอมเลย
					console.warn("ไม่พบข้อมูลเทอม");
					// setSelectedTerm(null); // หรือค่า default
				}
			} catch (e) {
				notify("error", e.message);
				console.error("Error fetching allRequestExamInfo:", e);
			}
		};
		getTerm();
	}, []);

	useEffect(() => {
		if (!selectedTerm) return;
		console.log(selectedTerm);

		const getRequest = async () => {
			try {
				const requestReq = await fetch("http://localhost:8080/api/requestExamAll", {
					method: "POST",
					headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
					body: JSON.stringify({ term: selectedTerm }),
				});
				const requestData = await requestReq.json();
				if (!requestReq.ok) throw new Error(requestData.message);
				setRequest(requestData);

				console.log("all request :", requestData);
			} catch (e) {
				notify("error", e.message);
				console.error("Error fetching requestExamAll:", e);
			}
		};
		getRequest();
	}, [selectedTerm]);

	const [openKQ, setOpenKQ] = useState(null);
	useEffect(() => {
		if (request === null || role !== "student") return;
		console.log("student");

		const fetchStudentData = async () => {
			try {
				const checkOpenKQRes = await fetch("http://localhost:8080/api/checkOpenKQ", {
					method: "POST",
					headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
				});
				const checkOpenKQData = await checkOpenKQRes.json();
				setOpenKQ(checkOpenKQData.status);
				if (!checkOpenKQRes.ok) throw new Error(checkOpenKQData.message);

				if (user_id === "674140101") {
					const registrationRes = await fetch("http://localhost:8080/api/allStudyGroupIdCourseRegistration", {
						method: "POST",
						headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
					});
					const registrationData = await registrationRes.json();
					if (!registrationRes.ok) throw new Error(registrationData.message);
					/* if (!registrationData) throw new Error("รอเจ้าหน้าที่ประจำสาขากรอกรายวิชาบังคับ"); */
					console.log("ที่ต้องลง :", registrationData);

					const registerCoursesRes = await fetch("https://mua.kpru.ac.th/FrontEnd_Tabian/apiforall/ListSubjectPass", {
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify({ ID_NO: user_id }),
					});
					const registerCoursesData = await registerCoursesRes.json();
					if (!registerCoursesRes.ok) throw new Error(registerCoursesData.message);
					console.log("ที่ลง :", registerCoursesData);

					const allCodes = registerCoursesData.map((c) => c.SJCODE);
					const missing = registrationData.course_id.filter((code) => !allCodes.includes(code));
					console.log("ที่ขาด :", missing);

					if (missing.length > 0) {
						const res = await fetch("https://mua.kpru.ac.th/FrontEnd_Tabian/apiforall/ListSubjectAll");
						const subjects = await res.json();

						const subjMap = new Map(subjects.map((s) => [s.SUBJCODE, s.SUBJNAME]));
						const coursesData = missing.map((course_id) => ({
							course_id,
							course_name: subjMap.get(course_id) || "ไม่พบข้อมูล",
						}));
						console.log("รายวิชาที่ขาด :", coursesData);

						setMissingCoures(coursesData);
						setOpenCheckCourse(true);
						return;
					}
				}

				const countFailOrAbsent = request.filter((row) => row.exam_results === "ไม่ผ่าน" || row.exam_results === "ขาดสอบ").length;
				if (!request.length) {
					console.log("ลำดับ : 1 ไม่มีคำร้อง (เปิด)");
					setLatestRequest(false);
				} else if (countFailOrAbsent > 2) {
					console.log("ลำดับ : 2 ไม่ผ่านเกิน 3 ครั้ง (ปิด)");
					setLatestRequest(true);
					throw new Error("สอบไม่ผ่านเกิน 3 ครั้ง");
				} else if (selectedTerm === request[0].term) {
					console.log("ลำดับ : 3 เทอมนี้ลงแล้ว (ปิด)");
					setLatestRequest(true);
				} else if (request[0].exam_results === "ไม่ผ่าน" || request[0].exam_results === "ขาดสอบ") {
					console.log("ลำดับ : 4 รอบที่แล้วไม่ผ่าน (เปิด)");
					setLatestRequest(false);
				} else {
					console.log("ลำดับ : 5 (ปิด)");
					setLatestRequest(true);
				}
			} catch (e) {
				notify("error", e.message, 10000);
				console.error(e);
			}
		};

		fetchStudentData();
		/* if (role === "student") {
			fetchStudentData();
		} */
	}, [request]);

	const handleOpenAdd = async () => {
		try {
			const req = await fetch("http://localhost:8080/api/studentInfo", {
				method: "GET",
				headers: { Authorization: `Bearer ${token}` },
			});
			const res = await req.json();
			if (!req.ok) throw new Error(res.message);
			form.setValues({ ...res, term: selectedTerm });
			setOpenAdd(true);
		} catch (e) {
			notify("error", e.message);
			console.error("Error fetching studentInfo:", e);
		}
	};

	const handleAdd = async () => {
		try {
			const requestRes = await fetch("http://localhost:8080/api/addRequestExam", {
				method: "POST",
				headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
				body: JSON.stringify(form.values),
			});
			const requestData = await requestRes.json();
			console.log(requestRes);
			console.log(requestData);
			if (!requestRes.ok) throw new Error(requestData.message);

			notify("success", requestData.message);

			setOpenAdd(false);
			setRequest((prev) => [...prev, { ...requestData.data, ...form.values }]);
			/* setLatestRequest(true); */
		} catch (e) {
			notify("error", e.message);
			console.error("Error fetching addRequestExam:", e);
		}
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
				body: JSON.stringify({ request_exam_id: item.request_exam_id, name: name, selected: selected, comment: comment }),
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
		try {
			const requestRes = await fetch("http://localhost:8080/api/payRequestExam", {
				method: "POST",
				headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
				body: JSON.stringify({ request_exam_id: item.request_exam_id, receipt_vol: "2564", receipt_No: "1", receipt_pay: "1000" }),
			});
			const requestData = await requestRes.json();
			if (!requestRes.ok) {
				throw new Error(requestData.message);
			}
			notify("success", requestData.message || "สำเร็จ");
			setOpenPay(false);
			console.log("ข้อมูลตอบกลับ ", requestData);

			setRequest((prev) => prev.map((row) => (row.request_exam_id === item.request_exam_id ? { ...row, ...requestData.data } : row)));
		} catch (e) {
			notify("error", e.message);
			console.error("Error fetching payRequestExam:", e);
		}
	};

	function sortRequests(data, role) {
		if (role === "student") return data;
		return [...data].sort((a, b) => {
			const orderA = Number(a.status) === 0 ? 1 : 0;
			const orderB = Number(b.status) === 0 ? 1 : 0;
			return orderA - orderB || Number(a.status) - Number(b.status);
		});
	}

	const sortedData = sortRequests(request ?? [], role);

	const filteredData = sortedData.filter((p) => {
		const matchesSearch = [p.student_name, p.student_id].join(" ").toLowerCase().includes(search.toLowerCase());
		const matchesType = selectedType ? p.request_type === selectedType : true;
		const matchesTerm = selectedTerm ? p.term === selectedTerm : true;
		if (role === "student") {
			return matchesSearch && matchesType;
		} else {
			return matchesSearch && matchesType && matchesTerm;
		}
	});

	const rows = filteredData.map((item) => (
		<Table.Tr key={item.request_exam_id}>
			<Table.Td>{item.student_name}</Table.Td>
			<Table.Td style={{ textAlign: "center" }}>{item.term}</Table.Td>
			{["advisor", "chairpersons"].includes(role) && <Table.Td>{item.request_type}</Table.Td>}
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
							{item.receipt_vol != null && (
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
			<ModalCheckCourse opened={openCheckCourse} onClose={() => setOpenCheckCourse(false)} missingCoures={missingCoures} type={user.education_level === "ปริญญาโท" ? "ประมวลความรู้" : "วัดคุณสมบัติ"} />
			<ModalInform opened={inform.open} onClose={close} message={inform.message} type={inform.type} timeout={inform.timeout} />
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
			<ModalPay opened={openPay} onClose={() => setOpenPay(false)} selectedRow={selectedRow} handlePay={handlePay} MoneyRegis={user.education_level === "ปริญญาโท" ? 1000 : 1500} type={`คำร้องขอสอบ${user.education_level === "ปริญญาโท" ? "ประมวลความรู้" : "วัดคุณสมบัติ"}`} />

			<Text size="1.5rem" fw={900} mb="md">
				{`คำร้องขอสอบ${type ? type : `${user.education_level ? `${user.education_level === "ปริญญาโท" ? "ประมวลความรู้" : "วัดคุณสมบัติ"}` : "ประมวลความรู้/วัดคุณสมบัติ"}`}`}
			</Text>
			<Group justify="space-between">
				<Box>
					<Flex align="flex-end" gap="sm">
						{role !== "student" && <TextInput placeholder="ค้นหา ชื่่อ รหัส" value={search} onChange={(e) => setSearch(e.target.value)} />}
						{(role === "chairpersons" || role === "advisor") && <Select placeholder="ชนิดคำขอ" data={["ขอสอบประมวลความรู้", "ขอสอบวัดคุณสมบัติ"]} value={selectedType} onChange={setSelectedType} />}
						{role !== "student" && <Select placeholder="เทอมการศึกษา" data={term} value={selectedTerm} onChange={setSelectedTerm} allowDeselect={false} />}
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
							<Table.Th>ชื่อ</Table.Th>
							<Table.Th>ภาคเรียน</Table.Th>
							{["advisor", "chairpersons"].includes(role) && <Table.Th>เรื่อง</Table.Th>}
							<Table.Th>สถานะ</Table.Th>
							<Table.Th>การดำเนินการ</Table.Th>
							{request?.some((it) => it.exam_results !== null) && <Table.Th>ผลสอบ</Table.Th>}
						</Table.Tr>
					</Table.Thead>
					<Table.Tbody>{rows}</Table.Tbody>
				</Table>
			</ScrollArea>
		</Box>
	);
};

export default RequestExam;
