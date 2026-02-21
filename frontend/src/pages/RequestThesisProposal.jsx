// คำร้องขอสอบโครงร่างวิทยานิพนธ์/การค้นคว้าอิสระ
import { useState, useEffect, useMemo } from "react";
import { Box, Text, Table, Button, TextInput, Space, ScrollArea, Group, Select, Flex, Stepper, Pill } from "@mantine/core";
import { useParams } from "react-router-dom";
import ModalAddRequestThesisProposal from "../component/Modal/ModalAddRequestThesisProposal";
import ModalApprove from "../component/Modal/ModalApprove";
import ModalPay from "../component/Modal/ModalPay";
import ModalInform from "../component/Modal/ModalInform";
// import Pdfg01 from "../component/PDF/Pdfg03-04";
import PdfButton from "../component/PDF/PdfButton";
import { useForm } from "@mantine/form";
import { jwtDecode } from "jwt-decode";
import ModalCheckCourse from "../component/Modal/ModalCheckCourseResearch";
import PrintReceipt from "../component/button/printReceipt";
const BASE_URL = import.meta.env.VITE_API_URL;
import { useBadge } from "../context/BadgeContext";

const RequestThesisProposal = () => {
	const { refreshBadges } = useBadge();
	const token = localStorage.getItem("token");
	const { role, user_id, name, education_level, employee_id } = useMemo(() => {
		if (!token) return { role: "", user_id: "", name: "", education_level: "", employee_id: "" };
		try {
			return jwtDecode(token);
		} catch (error) {
			console.error("Invalid token:", error);
			return { role: "", user_id: "", name: "", education_level: "", employee_id: "" };
		}
	}, [token]);
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
	//student //advisor //chairpersons //officer_registrar
	const [request, setRequest] = useState(null);
	const [search, setSearch] = useState("");

	const form = useForm({
		initialValues: {
			student_name: "",
			student_id: "",
			education_level: "",
			program: "",
			major_name: "",
			faculty_name: "",
			request_type: "",
			research_name: "",
			thesis_advisor_id: "",
			thesis_advisor_id_second: "",
		},
		validate: {
			research_name: (value) => (value === "" ? "กรุณากรอกชื่องานวิจัย" : null),
			thesis_advisor_id: (value) => (value === "" ? "กรุณาเลือกอาจารย์ที่ปรึกษางานวิจัย" : null),
		},
	});

	const [term, setTerm] = useState([]);
	const [selectedTerm, setSelectedTerm] = useState("");

	const [actualCurrentTerm, setActualCurrentTerm] = useState("");
	const [paymentCloseDate, setPaymentCloseDate] = useState(null);

	const [statusNew, setStatusNew] = useState(null);
	const [statusOld, setStatusOld] = useState(null);

	useEffect(() => {
		const getTerm = async () => {
			try {
				const termInfoReq = await fetch(`${BASE_URL}/api/allTerm`, {
					method: "POST",
					headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
				});
				const termInfodata = await termInfoReq.json();
				if (!termInfoReq.ok) throw new Error(termInfodata.message);

				setTerm(termInfodata.termList);

				setStatusNew(termInfodata.statusNew);
				setStatusOld(termInfodata.statusOld);

				if (role === "student" && user_id) {
					const yearStr = String(user_id).substring(0, 2);
					const yearInt = parseInt(yearStr, 10);

					let myStatus = null;

					if (yearInt >= 67) {
						myStatus = termInfodata.statusNew;
					} else {
						myStatus = termInfodata.statusOld;
					}

					// Set State ตามสถานะที่ได้
					setActualCurrentTerm(myStatus.currentTerm);
					setSelectedTerm(myStatus.currentTerm);
					// setOpenKQ(myStatus.isOpen);
					setPaymentCloseDate(myStatus.closeDate);
				} else {
					setSelectedTerm(termInfodata.currentTerm);
				}
			} catch (e) {
				notify("error", e.message);
				console.error("Error fetching allRequestExamInfo:", e);
			}
		};
		getTerm();
	}, []);

	const [latestRequest, setLatestRequest] = useState(true);
	const [missingCoures, setMissingCoures] = useState([]); // รายวิชาที่ขาด
	const [openCheckCourse, setOpenCheckCourse] = useState(false);

	useEffect(() => {
		if (!selectedTerm) return;
		if (request != null && role === "student") return;

		const getRequest = async () => {
			try {
				const ThesisProposalRes = await fetch(`${BASE_URL}/api/allRequestThesisProposal`, {
					method: "POST",
					headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
					body: JSON.stringify({ term: selectedTerm }),
				});
				const ThesisProposalData = await ThesisProposalRes.json();
				if (!ThesisProposalRes.ok) throw new Error(ThesisProposalData.message);
				setRequest(ThesisProposalData);
				console.log("all request :", ThesisProposalData);
			} catch (e) {
				notify("error", e.message);
				console.error("Error fetching requestExamAll:", e);
			}
		};
		getRequest();
	}, [selectedTerm]);

	useEffect(() => {
		if (request === null || role !== "student") return;
		const fetchRequestExam = async () => {
			try {
				const requestReq = await fetch(`${BASE_URL}/api/requestExamAll`, {
					method: "POST",
					headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
					body: JSON.stringify({ term: selectedTerm }),
				});
				const requestData = await requestReq.json();
				if (!requestReq.ok) throw new Error(requestData.message);
				console.log("requestData", requestData);

				if (requestData.length > 0) {
					const latestRequest = requestData.reduce((prev, current) => (Number(prev.request_exam_id) > Number(current.request_exam_id) ? prev : current));
					console.log("ผลการสอบล่าสุด:", latestRequest.exam_results);
					if (latestRequest.exam_results === "ไม่ผ่าน" || latestRequest.exam_results === "ขาดสอบ" || latestRequest.exam_results === null) {
						throw new Error("ยังสอบประมวลความรู้/วัดคุณสมบัติ ไม่ผ่าน");
					}
				} else {
					throw new Error("ยังสอบประมวลความรู้/วัดคุณสมบัติ ไม่ผ่าน");
				}

				const registrationRes = await fetch(`${BASE_URL}/api/allStudyGroupIdCourseRegistration`, {
					method: "POST",
					headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
					body: JSON.stringify({ usage: [2] }),
				});
				const registrationData = await registrationRes.json();
				if (!registrationRes.ok) throw new Error(registrationData.message);
				console.log("ที่ต้องลง :", registrationData);

				const response = await fetch(`${BASE_URL}/api/get-all-courses`, {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ user_id: user_id, term: actualCurrentTerm }),
				});
				const result = await response.json();
				console.log("รายวิชาที่ลงทั้งหมด (ทุกเทอม):", result.data);

				const allCodes = result.data.map((c) => c.SJCODE);

				const missing = registrationData.course_first.filter((code) => !allCodes.includes(code));
				console.log("ที่ขาด :", missing);

				const limit = education_level === "ปริญญาโท" ? 1 : 0;

				if (missing.length > limit) {
					const res = await fetch(`${BASE_URL}/api/get-all-subjects`);
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
				} else {
					const taken = registrationData.course_first.filter((code) => allCodes.includes(code));
					console.log("ที่ลง :", taken);

					const hasIndependentStudy = result.data.some((course) => {
						const courseName = course.COUSE_NAME || course.SUBJNAME || course.SJNAME || "";
						return taken.includes(course.SJCODE) && courseName.includes("ค้นคว้าอิสระ");
					});

					const requestTypeResult = hasIndependentStudy ? "การค้นคว้าอิสระ" : "วิทยานิพนธ์";
					console.log("Auto-setting request_type to:", requestTypeResult);

					form.setFieldValue("request_type", requestTypeResult);
				}

				if (!request.length) {
					console.log("ลำดับ : 1 ไม่มีคำร้อง (เปิด)");
					setLatestRequest(false);
				} else if (selectedTerm === request[0].term) {
					console.log("ลำดับ : 2 เทอมนี้ลงแล้ว (ปิด)");
					setLatestRequest(true);
				} else if (request[0].exam_results === "ไม่ผ่าน" || request[0].exam_results === "ขาดสอบ") {
					console.log("ลำดับ : 3 รอบที่แล้วไม่ผ่าน (เปิด)");
					setLatestRequest(false);
				} else {
					console.log("ลำดับ : 4 (ปิด)");
					setLatestRequest(true);
				}
			} catch (e) {
				notify("error", e.message);
				console.error(e);
			}
		};
		fetchRequestExam();
	}, [request]);

	const handleOpenAdd = async () => {
		try {
			const requestRes = await fetch(`${BASE_URL}/api/student/${user_id}`, {
				method: "GET",
				headers: { Authorization: `Bearer ${token}` },
			});
			const requestData = await requestRes.json();
			if (!requestRes.ok) throw new Error(requestData.message);

			form.setValues({ ...requestData, term: actualCurrentTerm });
			setOpenAdd(true);
		} catch (e) {
			notify("error", e.message);
			console.error("Error fetching studentInfo:", e);
		}
	};

	const handleAdd = async () => {
		try {
			const requestRes = await fetch(`${BASE_URL}/api/addRequestThesisProposal`, {
				method: "POST",
				headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
				body: JSON.stringify(form.values),
			});
			const requestData = await requestRes.json();
			if (!requestRes.ok) throw new Error(requestData.message);
			notify("success", requestData.message);
			setOpenAdd(false);
			setRequest((prev) => [...prev, { ...requestData.data, ...form.values }]);
			setLatestRequest(true);
			setSelectedTerm(actualCurrentTerm);
			refreshBadges();
		} catch (e) {
			notify("error", e.message);
			console.error("Error fetching addRequestThesisProposal:", e);
		}
	};

	const handleApprove = async (item) => {
		if (selected === "noapprove" && comment.trim() === "") {
			setError("กรุณาระบุเหตุผล");
			return;
		}
		try {
			const requestRes = await fetch(`${BASE_URL}/api/approveRequestThesisProposal`, {
				method: "POST",
				headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
				body: JSON.stringify({ request_thesis_proposal_id: item.request_thesis_proposal_id, name: name, role: role, selected: selected, comment: comment }),
			});
			const requestData = await requestRes.json();
			if (!requestRes.ok) {
				throw new Error(requestData.message);
			}
			notify("success", requestData.message || "สำเร็จ");
			setSelected("approve");
			setComment("");
			setOpenApprove(false);
			setRequest((prev) => prev.map((row) => (row.request_thesis_proposal_id === item.request_thesis_proposal_id ? { ...row, ...requestData.data } : row)));
			refreshBadges();
		} catch (e) {
			notify("error", e.message);
			console.error("Error fetching approveRequestThesisProposal:", e);
		}
	};

	const handlePay = async (item) => {
		try {
			const requestRes = await fetch(`${BASE_URL}/api/payRequestThesisProposal`, {
				method: "POST",
				headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
				body: JSON.stringify({ request_thesis_proposal_id: item.request_thesis_proposal_id, receipt_vol: "2569/RRT005", receipt_No: "1", receipt_pay: education_level === "ปริญญาโท" ? 2000 : 5000 }),
			});
			const requestData = await requestRes.json();
			if (!requestRes.ok) {
				throw new Error(requestData.message);
			}
			notify("success", requestData.message || "สำเร็จ");
			setOpenPay(false);
			setRequest((prev) => prev.map((row) => (row.request_thesis_proposal_id === item.request_thesis_proposal_id ? { ...row, ...requestData.data } : row)));
			refreshBadges();
		} catch (e) {
			notify("error", e.message);
			console.error("Error fetching payRequestThesisProposal:", e);
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

	const sortedData = sortRequests(request ?? [], role);

	const filteredData = sortedData?.filter((p) => {
		const matchesSearch = [p.student_name, p.student_id].join(" ").toLowerCase().includes(search.toLowerCase());
		const matchesTerm = selectedTerm ? p.term === selectedTerm : true;
		return matchesSearch && matchesTerm;
	});

	const rows = filteredData.map((item) => {
		const studentYear = parseInt(String(item.student_id).substring(0, 2));
		const targetStatus = studentYear >= 67 ? statusNew : statusOld;
		const rowCurrentTerm = targetStatus?.currentTerm;

		let isShowApproveButton = false;

		if (role === "research_advisor" && item.status == 1) {
			// เช็คว่าเป็น Main หรือ Second
			const isMainAdvisor = String(item.thesis_advisor_id) === String(employee_id);
			const isSecondAdvisor = String(item.thesis_advisor_id_second) === String(employee_id);

			// แสดงปุ่มก็ต่อเมื่อ (เป็นตัวจริง และ ยังไม่อนุมัติ) หรือ (เป็นตัวรอง และ ยังไม่อนุมัติ)
			if ((isMainAdvisor && !item.advisor_approvals) || (isSecondAdvisor && !item.advisor_approvals_second)) {
				isShowApproveButton = true;
			}
		} else if (role === "chairpersons" && item.status == 2) {
			// ประธานหลักสูตร (ปกติเช็คแค่ Status ก็พอ เพราะเปลี่ยนสถานะทันที)
			isShowApproveButton = true;
		} else if (role === "officer_registrar" && item.status == 3) {
			// เจ้าหน้าที่ทะเบียน
			isShowApproveButton = true;
		}

		return (
			<Table.Tr key={item.request_thesis_proposal_id}>
				<Table.Td>{item.student_name}</Table.Td>
				<Table.Td>{item.request_type}</Table.Td>
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
							{!item.advisor_approvals && "อาจารย์ที่ปรึกษาหลัก"}
							{item.advisor_approvals && item.advisor_approvals_id_second && !item.advisor_approvals_second && "อาจารย์ที่ปรึกษารอง"}
							{item.advisor_approvals && (item.advisor_approvals_id_second ? item.advisor_approvals_second : true) && !item.chairpersons_approvals && "ประธานหลักสูตร"}
							{item.advisor_approvals && (item.advisor_approvals_id_second ? item.advisor_approvals_second : true) && item.chairpersons_approvals && !item.registrar_approvals && "เจ้าหน้าที่ทะเบียน"}
							{/* {!item.advisor_approvals && "อาจารย์ที่ปรึกษา"}
							{item.advisor_approvals && !item.chairpersons_approvals && "ประธานหลักสูตร"}
							{item.advisor_approvals && item.chairpersons_approvals && !item.registrar_approvals && "เจ้าหน้าที่ทะเบียน"} */}
						</>
					)}
				</Table.Td>
				<Table.Td style={{ maxWidth: "150px" }}>
					<Group style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
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
										disabled={item.term !== rowCurrentTerm}
									>
										ชำระค่าธรรมเนียม
									</Button>
								)}
								{item.receipt_vol != null && <PrintReceipt item={item} />}
							</>
						)}

						<PdfButton data={item} showType={item.status == 0 ? undefined : (role === "advisor" && item.status <= 1) || (role === "chairpersons" && item.status <= 2) || (role === "officer_registrar" && item.status <= 3) ? "view" : undefined} />

						{isShowApproveButton && (
							<Button
								size="xs"
								color="green"
								onClick={() => {
									setSelectedRow(item);
									setOpenApproveState("add");
									setOpenApprove(true);
								}}
								disabled={item.term !== rowCurrentTerm}
							>
								{role === "officer_registrar" ? "ตรวจสอบ" : "ลงความเห็น"}
							</Button>
						)}
						{/* {((role === "research_advisor" && item.status == 1) || (role === "chairpersons" && item.status == 2) || (role === "officer_registrar" && item.status == 3)) && (
							<Button
								size="xs"
								color="green"
								onClick={() => {
									setSelectedRow(item);
									setOpenApproveState("add");
									setOpenApprove(true);
								}}
								disabled={item.term !== rowCurrentTerm}
							>
								{role === "officer_registrar" ? "ตรวจสอบ" : "ลงความเห็น"}
							</Button>
						)} */}
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
		);
	});

	return (
		<Box>
			<ModalCheckCourse opened={openCheckCourse} onClose={() => setOpenCheckCourse(false)} missingCoures={missingCoures} type={`จึงจะสามารถยื่นคำร้องขอสอบโครงร่างวิทยานิพนธ์/การค้นคว้าอิสระ`} />
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
				title={`${role === "officer_registrar" ? "ตรวจสอบ" : "ลงความเห็น"}คำร้องขอสอบโครงร่าง${education_level === "ปริญญาโท" ? "วิทยานิพนธ์" : "การค้นคว้าอิสระ"}`}
			/>
			<ModalAddRequestThesisProposal opened={openAdd} onClose={() => setOpenAdd(false)} form={form} handleAdd={handleAdd} title={`เพิ่มคำร้องขอสอบโครงร่าง${form.values.request_type || (education_level === "ปริญญาโท" ? "วิทยานิพนธ์/การค้นคว้าอิสระ" : "วิทยานิพนธ์")}`} />
			<ModalPay opened={openPay} onClose={() => setOpenPay(false)} selectedRow={selectedRow} handlePay={handlePay} MoneyRegis={education_level === "ปริญญาโท" ? 2000 : 5000} type={`คำร้องขอสอบโครงร่างวิทยานิพนธ์/การค้นคว้าอิสระ`} stop_date={paymentCloseDate} />
			<Text size="1.5rem" fw={900} mb="md">
				คำร้องขอสอบ{role === "student" ? form?.values.request_type : "วิทยานิพนธ์/การค้นคว้าอิสระ"}
			</Text>
			<Group justify="space-between">
				<Box>
					<Flex align="flex-end" gap="sm">
						{role !== "student" && <TextInput placeholder="ค้นหา ชื่่อ รหัสนักศึกษา" value={search} onChange={(e) => setSearch(e.target.value)} />}
						<Select placeholder="เทอมการศึกษา" data={term} value={selectedTerm} onChange={setSelectedTerm} allowDeselect={false} style={{ width: 80 }} />
					</Flex>
				</Box>
				<Box>
					{role === "student" && (
						<Button onClick={() => handleOpenAdd()} disabled={latestRequest}>
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
							<Table.Th style={{ minWidth: 100 }}>เรื่อง</Table.Th>
							<Table.Th style={{ minWidth: 110 }}>สถานะ</Table.Th>
							<Table.Th>การดำเนินการ</Table.Th>
							{request?.some((it) => it.exam_results !== null) && <Table.Th style={{ minWidth: 110 }}>ผลสอบ</Table.Th>}
						</Table.Tr>
					</Table.Thead>
					<Table.Tbody>{rows}</Table.Tbody>
				</Table>
			</ScrollArea>
		</Box>
	);
};

export default RequestThesisProposal;
