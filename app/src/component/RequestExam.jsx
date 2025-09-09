//ตารางคำร้องขอ
import { useState, useEffect } from "react";
import { Box, Text, Table, Button, TextInput, Space, ScrollArea, Group, Select, Flex, Stepper, Pill } from "@mantine/core";
import { useParams } from "react-router-dom";
import ModalAdd from "../component/Modal/ModalAdd";
import ModalApprove from "../component/Modal/ModalApprove";
import ModalPay from "../component/Modal/ModalPay";
import ModalInform from "../component/Modal/ModalInform";
import ModalCheckCourse from "../component/Modal/ModalCheckCourse";
import Pdfg01 from "../component/PDF/Pdfg01";

const RequestExam = () => {
	// Modal Info
	const [inform, setInform] = useState({ open: false, type: "", message: "" });
	const notify = (type, message) => setInform({ open: true, type, message });
	const close = () => setInform((s) => ({ ...s, open: false }));
	// Modal states
	const [openAdd, setOpenAdd] = useState(false);
	const [openApprove, setOpenApprove] = useState(false);
	const [openApproveState, setOpenApproveState] = useState(false);
	const [openPay, setOpenPay] = useState(false);
	const [openCheckCourse, setOpenCheckCourse] = useState(false);
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

	const [registerCoures, setRegisterCoures] = useState(["1065201", "1065202", "1065204", "1065206", "1066205", "1065232"]);
	const [missingCoures, setMissingCoures] = useState([]);
/* 	const [coures, setCoures] = useState([
		{ value: "1065201", label: "1065201 หลักการ ทฤษฎีและปฏิบัติทางการบริหารการศึกษา" },
		{ value: "1065202", label: "1065202 ผู้นำทางวิชาการและการพัฒนาหลักสูตร " },
		{ value: "1065204", label: "1065204 การบริหารทรัพยากรทางการศึกษา" },
		{ value: "1065206", label: "1065206 ภาวะผู้นำทางการบริหารการศึกษา" },
		{ value: "1065208", label: "1065208 การประกันคุณภาพการศึกษา" },
		{ value: "1065222", label: "1065222 การฝึกปฏิบัติงานการบริหารการศึกษาและบริหารสถานศึกษา" },
		{ value: "1065231", label: "1065231 คุณธรรม จริยธรรมและจรรยาบรรณวิชาชีพทางการศึกษา สำหรับนักบริหารการศึกษา และผู้บริหารการศึกษา" },
		{ value: "1065232", label: "1065232 การบริหารงานวิชาการ กิจการและกิจกรรมนักเรียน" },
		{ value: "1066205", label: "1066205 ความเป็นนักบริหารมืออาชีพ" },
	]); */

	useEffect(() => {
		const fetchProfile = async () => {
			try {
				const req = await fetch("http://localhost:8080/api/profile", {
					method: "GET",
					headers: { Authorization: `Bearer ${token}` },
				});
				const res = await req.json();
				if (!req.ok) {
					throw new Error(res.message);
				}
				setUser(res);
			} catch (e) {
				notify("error", e.message);
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
		if (user.role === "student") {
			(async () => {
				try {
					const req = await fetch("http://localhost:8080/api/allStudyGroupIdCourseRegistration", {
						method: "POST",
						headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
						body: JSON.stringify({ id: user.id }),
					});
					const res = await req.json();
					if (!req.ok) throw new Error(res.message);
					const courseRes = await fetch("http://localhost:8080/api/Course", {
						method: "POST",
						headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
						body: JSON.stringify({ course_id: res.course_id }), // ส่ง array ของ course_id
					});
					const courseData = await courseRes.json();
					const missingLabels = res.course_id
						.filter((code) => !registerCoures.includes(code))
						.map((code) => {
							const course = courseData.find((c) => c.course_id === code);
							return course ? `${course.course_id} ${course.course_name}` : code;
						});
					if (missingLabels.length) {
						setMissingCoures(missingLabels);
						setOpenCheckCourse(true);
					}
				} catch (e) {
					notify("error", e.message);
					console.error("Error fetching AllCourseRegistration:", e);
				}
				/* try {
					const req = await fetch("http://localhost:8080/api/allStudyGroupIdCourseRegistration", {
						method: "POST",
						headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
						body: JSON.stringify({ id: user.id }),
					});
					const res = await req.json();
					if (!req.ok) throw new Error(res.message);
					const missingLabels = res.course_id.filter((code) => !registerCoures.includes(code)).map((code) => coures.find((c) => c.value === code)?.label || code);
					if (missingLabels.length) {
						setMissingCoures(missingLabels);
						setOpenCheckCourse(true);
					}
				} catch (e) {
					notify("error", e.message);
					console.error("Error fetching AllCourseRegistration:", e);
				} */
			})();
		}
		(async () => {
			try {
				const req = await fetch("http://localhost:8080/api/requestExamAll", {
					method: "POST",
					headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
					body: JSON.stringify({ role: user.role, id: user.id }),
				});
				const res = await req.json();
				if (!req.ok) throw new Error(res.message);
				setRequest(res);
				setLatestRequest(res[0]);
			} catch (e) {
				notify("error", e.message);
				console.error("Error fetching requestExamAll:", e);
			}
		})();
	}, [user]);

	const handleOpenAdd = async () => {
		try {
			const req = await fetch("http://localhost:8080/api/studentInfo", {
				method: "GET",
				headers: { Authorization: `Bearer ${token}` },
			});
			const res = await req.json();
			if (!req.ok) throw new Error(res.message);
			setFormData(res);
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
			notify("error", e.message);
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

	const sortedData = sortRequests(request, user.role);

	const filteredData = sortedData.filter((p) => {
		const matchesSearch = [p.student_name, p.student_id].join(" ").toLowerCase().includes(search.toLowerCase());
		const matchesType = selectedType ? p.request_type === selectedType : true;
		return matchesSearch && matchesType;
	});

	const rows = filteredData.map((item) => (
		<Table.Tr key={item.request_exam_id}>
			<Table.Td>{item.student_name}</Table.Td>
			<Table.Td style={{ textAlign: "center" }}>{item.term}</Table.Td>
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
						{item.advisor_approvals && !item.chairpersons_approvals && "ประธานกรรมการปะจำสาขาวิชา"}
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
			<ModalAdd opened={openAdd} onClose={() => setOpenAdd(false)} formData={formData} handleAdd={handleAdd} title={`เพิ่มคำร้องขอสอบ${user.education_level === "ปริญญาโท" ? "ประมวลความรู้" : "วัดคุณสมบัติ"}`} />
			<ModalPay opened={openPay} onClose={() => setOpenPay(false)} selectedRow={selectedRow} handlePay={handlePay} />

			<Text size="1.5rem" fw={900} mb="md">
				{`คำร้องขอสอบ${user.education_level ? `${user.education_level === "ปริญญาโท" ? "ประมวลความรู้" : "วัดคุณสมบัติ"}` : ""}${type ? type : "ประมวลความรู้/สอบวัดคุณสมบัติ"}`}
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
							<Table.Th style={{ minWidth: 100 }}>ภาคเรียน</Table.Th>
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

export default RequestExam;
