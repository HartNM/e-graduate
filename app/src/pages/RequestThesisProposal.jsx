// คำร้องขอสอบโครงร่างวิทยานิพนธ์/การค้นคว้าอิสระ
import { useState, useEffect, useMemo } from "react";
import { Box, Text, Table, Button, TextInput, Space, ScrollArea, Group, Select, Flex, Stepper, Pill } from "@mantine/core";
import { useParams } from "react-router-dom";
import ModalAddRequestThesisProposal from "../component/Modal/ModalAddRequestThesisProposal";
import ModalApprove from "../component/Modal/ModalApprove";
import ModalPay from "../component/Modal/ModalPay";
import ModalInform from "../component/Modal/ModalInform";
import Pdfg01 from "../component/PDF/Pdfg03-04";
import { useForm } from "@mantine/form";
import { jwtDecode } from "jwt-decode";
import ModalCheckCourse from "../component/Modal/ModalCheckCourse";
const BASE_URL = import.meta.env.VITE_API_URL;

const RequestThesisProposal = () => {
	const token = localStorage.getItem("token");
	const { role, user_id, name, education_level } = useMemo(() => {
		if (!token) return { role: "", user_id: "", name: "", education_level: "" };
		try {
			return jwtDecode(token);
		} catch (error) {
			console.error("Invalid token:", error);
			return { role: "", user_id: "", name: "", education_level: "" };
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
			thesis_exam_date: null,
		},
		validate: {
			request_type: (value) => (value === "" ? "กรุณาเลือกชนิดโครงร่างงานวิจัย" : null),
			research_name: (value) => (value === "" ? "กรุณากรอกชื่องานวิจัย" : null),
			thesis_advisor_id: (value) => (value === "" ? "กรุณาเลือกอาจารย์ที่ปรึกษางานวิจัย" : null),
			/* thesis_exam_date: (v) => {
				if (!v) return "กรุณาระบุวันที่สอบ";
			}, */
		},
	});

	const [term, setTerm] = useState([]);
	const [selectedTerm, setSelectedTerm] = useState("");

	const [actualCurrentTerm, setActualCurrentTerm] = useState("");
	const [paymentCloseDate, setPaymentCloseDate] = useState(null);

	useEffect(() => {
		const getTerm = async () => {
			try {
				const termInfoReq = await fetch(`${BASE_URL}/api/allRequestExamInfo`, {
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

				if (currentTerm) {
					setActualCurrentTerm(currentTerm.term);
					console.log("เทอมปัจจุบัน", currentTerm.term);

					const options = {
						day: "2-digit", // วันที่ 2 หลัก
						month: "2-digit", // เดือน 2 หลัก
						year: "numeric", // ปี
						calendar: "buddhist", // ใช้ปฏิทินพุทธ (พ.ศ.)
						numberingSystem: "latn", // ใช้เลขอารบิก
						timeZone: "Asia/Bangkok", // ระบุไทม์โซนเพื่อให้ได้วันที่ถูกต้อง
					};

					const formattedDate = new Intl.DateTimeFormat("th-TH", options).format(new Date(currentTerm.term_close_date));

					setPaymentCloseDate(formattedDate);
					console.log("วันสุดท้ายชำระค่าธรรมเนียม", formattedDate);
				} else {
					setActualCurrentTerm("");
				}

				if (!currentTerm && termInfodata.length > 0) {
					// ถ้าไม่เจอ currentTerm → เลือกเทอมล่าสุดจาก close_date
					currentTerm = [...termInfodata].sort((a, b) => new Date(b.term_close_date) - new Date(a.term_close_date))[0];
				}
				setSelectedTerm(currentTerm.term);
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

		const fetchRequestExam = async () => {
			try {
				const ThesisProposalRes = await fetch(`${BASE_URL}/api/allRequestThesisProposal`, {
					method: "POST",
					headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
					body: JSON.stringify({ term: selectedTerm }),
				});
				const ThesisProposalData = await ThesisProposalRes.json();
				if (!ThesisProposalRes.ok) throw new Error(ThesisProposalData.message);
				setRequest(ThesisProposalData);

				if (role === "student") {
					/* if (user_id === "674140101") {
					} */
					{
						/* const requestReq = await fetch(`${BASE_URL}/api/requestExamAll`, {
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
						} */

						const registrationRes = await fetch(`${BASE_URL}/api/allStudyGroupIdCourseRegistration`, {
							method: "POST",
							headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
							body: JSON.stringify({ usage: [2] }),
						});
						const registrationData = await registrationRes.json();
						if (!registrationRes.ok) throw new Error(registrationData.message);
						console.log("ที่ต้องลง :", registrationData);
						/* ---------------------------------------------------------------------------------------- */
						/* const registerCoursesRes = await fetch("/mua-proxy/FrontEnd_Tabian/apiforall/ListSubjectPass", {
							method: "POST",
							headers: { "Content-Type": "application/json" },
							body: JSON.stringify({ ID_NO: user_id }),
						}); 

						const registerCoursesData = await registerCoursesRes.json();
						if (!registerCoursesRes.ok) throw new Error(registerCoursesData.message);
						console.log("ที่ลง :", registerCoursesData);

						const allCodes = registerCoursesData.map((c) => c.SJCODE); */
						/* ---------------------------------------------------------------------------------------- */
						/* let allRegisteredCourses = []; // ตัวแปรเก็บรายวิชาที่ลงทะเบียนทั้งหมด (ทุกเทอมรวมกัน)
						let hasData = true;

						// หาปีเริ่มต้นจากรหัสนักศึกษา (เช่น 674140116 -> เริ่มปี 2567)
						let loopYear = 2500 + parseInt(user_id.toString().substring(0, 2));
						let loopTerm = 1;

						console.log(`เริ่มดึงข้อมูลตั้งแต่ปี: ${loopYear}`);

						while (hasData) {
							const currentLoopTermStr = `${loopTerm}/${loopYear}`;

							// ยิง API ดึงข้อมูลทีละเทอม
							const registerCoursesRes = await fetch("/mua-proxy/FrontEnd_Tabian/apiforall/ListRegister", {
								method: "POST",
								headers: { "Content-Type": "application/json" },
								body: JSON.stringify({ ID_NO: user_id, TERM: currentLoopTermStr }),
							});

							const registerCoursesData = await registerCoursesRes.json();

							if (!registerCoursesRes.ok) {
								console.error(`Error fetching term ${currentLoopTermStr}:`, registerCoursesData.message);
								break; // หรือ handle error ตามต้องการ
							}

							// ตรวจสอบว่ามีข้อมูลหรือไม่
							if (Array.isArray(registerCoursesData) && registerCoursesData.length > 0) {
								console.log(`ดึงข้อมูลเทอม ${currentLoopTermStr} สำเร็จ:`, registerCoursesData.length, "วิชา");

								// เอาข้อมูลมาต่อรวมกัน
								allRegisteredCourses = [...allRegisteredCourses, ...registerCoursesData];

								// ขยับไปเทอมถัดไป
								loopTerm++;
								if (loopTerm > 3) {
									loopTerm = 1;
									loopYear++;
								}
							} else {
								// ถ้าได้ [] (ว่างเปล่า) ให้หยุด Loop
								console.log(`เทอม ${currentLoopTermStr} ไม่มีข้อมูล -> จบการดึงข้อมูล`);
								hasData = false;
							}
						} */

						const response = await fetch(`${BASE_URL}/api/get-all-courses`, {
							// URL ของ Backend คุณ
							method: "POST",
							headers: { "Content-Type": "application/json" },
							body: JSON.stringify({ user_id: user_id }),
						});
						const result = await response.json();

						/* const currentLoopTermStr = `${loopTerm}/${loopYear}`;
						console.log("user_id", user_id);
						console.log("currentLoopTermStr", currentLoopTermStr);

						const registerCoursesRes = await fetch("https://mua.kpru.ac.th/FrontEnd_Tabian/apiforall/ListRegister", {
							method: "POST",
							headers: { "Content-Type": "application/json" },
							body: JSON.stringify({ ID_NO: 664140101, TERM: 2/2568 }),
						});

						const registerCoursesData = await registerCoursesRes.json();
						allRegisteredCourses = [...registerCoursesData]; */

						console.log("รายวิชาที่ลงทั้งหมด (ทุกเทอม):", result.data);

						const allCodes = result.data.map((c) => c.SJCODE);

						const missing = registrationData.course_first.filter((code) => !allCodes.includes(code));
						console.log("ที่ขาด :", missing);

						if (missing.length > 1) {
							const res = await fetch("/mua-proxy/FrontEnd_Tabian/apiforall/ListSubjectAll");
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

					/* if (ThesisProposalData[0]?.status === "6" || ThesisProposalData[0]?.status === undefined) {
						setLatestRequest(false);
					} else {
						setLatestRequest(true);
					} */

					if (!ThesisProposalData.length) {
						console.log("ลำดับ : 1 ไม่มีคำร้อง (เปิด)");
						setLatestRequest(false);
					} else if (selectedTerm === ThesisProposalData[0].term) {
						console.log("ลำดับ : 2 เทอมนี้ลงแล้ว (ปิด)");
						setLatestRequest(true);
					} else if (ThesisProposalData[0].exam_results === "ไม่ผ่าน" || ThesisProposalData[0].exam_results === "ขาดสอบ") {
						console.log("ลำดับ : 3 รอบที่แล้วไม่ผ่าน (เปิด)");
						setLatestRequest(false);
					} else {
						console.log("ลำดับ : 4 (ปิด)");
						setLatestRequest(true);
					}
				}
			} catch (e) {
				notify("error", e.message);
				console.error("Error fetching allRequestThesisProposal:", e);
			}
		};
		fetchRequestExam();
	}, [selectedTerm]);

	const handleOpenAdd = async () => {
		try {
			const requestRes = await fetch(`${BASE_URL}/api/studentInfo`, {
				method: "GET",
				headers: { Authorization: `Bearer ${token}` },
			});
			const requestData = await requestRes.json();
			if (!requestRes.ok) throw new Error(requestData.message);
			form.setValues({ request_type: "", thesis_advisor_id: "", thesis_exam_date: null });
			form.setValues(requestData);
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
				body: JSON.stringify({ request_thesis_proposal_id: item.request_thesis_proposal_id, receipt_vol: "154", receipt_No: "4", receipt_pay: education_level === "ปริญญาโท" ? 2000 : 5000 }),
			});
			const requestData = await requestRes.json();
			if (!requestRes.ok) {
				throw new Error(requestData.message);
			}
			notify("success", requestData.message || "สำเร็จ");
			setOpenPay(false);
			setRequest((prev) => prev.map((row) => (row.request_thesis_proposal_id === item.request_thesis_proposal_id ? { ...row, ...requestData.data } : row)));
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

	const rows = filteredData.map((item) => (
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
						{!item.advisor_approvals && "อาจารย์ที่ปรึกษา"}
						{item.advisor_approvals && !item.chairpersons_approvals && "ประธานหลักสูตร"}
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
									disabled={item.term !== actualCurrentTerm}
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
					{((role === "research_advisor" && item.status == 1) || (role === "chairpersons" && item.status == 2) || (role === "officer_registrar" && item.status == 3)) && (
						<Button
							size="xs"
							color="green"
							onClick={() => {
								setSelectedRow(item);
								setOpenApproveState("add");
								setOpenApprove(true);
							}}
							disabled={item.term !== actualCurrentTerm}
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
			<ModalAddRequestThesisProposal opened={openAdd} onClose={() => setOpenAdd(false)} form={form} handleAdd={handleAdd} title={`เพิ่มคำร้องขอสอบโครงร่างวิทยานิพนธ์/การค้นคว้าอิสระ`} />
			<ModalPay opened={openPay} onClose={() => setOpenPay(false)} selectedRow={selectedRow} handlePay={handlePay} MoneyRegis={education_level === "ปริญญาโท" ? 2000 : 5000} type={`คำร้องขอสอบโครงร่างวิทยานิพนธ์/การค้นคว้าอิสระ`} stop_date={paymentCloseDate} />
			<Text size="1.5rem" fw={900} mb="md">
				คำร้องขอสอบโครงร่างวิทยานิพนธ์/การค้นคว้าอิสระ
			</Text>
			<Group justify="space-between">
				<Box>
					<Flex align="flex-end" gap="sm">
						{role !== "student" && <TextInput placeholder="ค้นหาชื่่อ รหัส" value={search} onChange={(e) => setSearch(e.target.value)} />}
						<Select placeholder="เทอมการศึกษา" data={term} value={selectedTerm} onChange={setSelectedTerm} allowDeselect={false} />
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
