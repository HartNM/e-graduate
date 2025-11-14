//คำร้องขอยกเลิกประมวลความรู้/วัดคุณสมบัติ
import { useState, useEffect, useMemo } from "react";
import { Box, Text, Table, Button, TextInput, Space, ScrollArea, Group, Select, Flex, Stepper, Pill } from "@mantine/core";
import ModalAddCancel from "../component/Modal/ModalAddCancel";
import ModalApprove from "../component/Modal/ModalApprove";
import ModalInform from "../component/Modal/ModalInform";
import Pdfg07 from "../component/PDF/Pdfg07";
import { jwtDecode } from "jwt-decode";
const BASE_URL = import.meta.env.VITE_API_URL;

const RequestExamCancel = () => {
	const token = localStorage.getItem("token");
	const payload = useMemo(() => {
		return jwtDecode(token);
	}, [token]);
	const role = payload.role;
	const name = payload.name;
	// Modal Info
	const [inform, setInform] = useState({ open: false, type: "", message: "" });
	const notify = (type, message) => setInform({ open: true, type, message });
	const close = () => setInform((s) => ({ ...s, open: false }));
	// Modal states
	const [openApprove, setOpenApprove] = useState(false);
	const [openApproveState, setOpenApproveState] = useState(false);
	const [openAddCancel, setOpenAddCancel] = useState(false);
	// Form states
	const [selectedRow, setSelectedRow] = useState(null);
	const [selected, setSelected] = useState("approve");
	const [comment, setComment] = useState("");
	const [reason, setReason] = useState("");
	const [error, setError] = useState("");
	// System states
	const [user, setUser] = useState("");
	//student //advisor //chairpersons //officer_registrar  //dean
	const [request, setRequest] = useState(null);
	const [search, setSearch] = useState("");
	const [selectedType, setSelectedType] = useState("");

	const [term, setTerm] = useState([]);
	const [selectedTerm, setSelectedTerm] = useState("");

	useEffect(() => {
		const getProfile = async () => {
			try {
				const req = await fetch(`${BASE_URL}/api/profile`, {
					method: "GET",
					headers: { Authorization: `Bearer ${token}` },
				});
				const res = await req.json();
				if (!req.ok) throw new Error(res.message);
				console.log(res);
				setUser(res);
			} catch (e) {
				notify("error", e.message);
				console.error(e);
			}
		};
		getProfile();

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

	useEffect(() => {
		if (!selectedTerm) return;
		if (request != null && role === "student") return;
		console.log("เทอมนี้ ", selectedTerm);

		const getRequestCancel = async () => {
			try {
				const requestExamReq = await fetch(`${BASE_URL}/api/AllRequestExamCancel`, {
					method: "POST",
					headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
					body: JSON.stringify({ term: selectedTerm }),
				});
				const requestExamData = await requestExamReq.json();
				if (!requestExamReq.ok) throw new Error(requestExamData.message);
				setRequest(requestExamData);

				console.log("คำร้องทังหมด", requestExamData);
			} catch (e) {
				notify("error", e.message);
				console.error("Error fetching AllRequestExamCancel:", e);
			}
		};
		getRequestCancel();
	}, [selectedTerm]);

	const [latestRequest, setLatestRequest] = useState(null);

	useEffect(() => {
		const fetchRequestExam = async () => {
			try {
				const requestReq = await fetch(`${BASE_URL}/api/requestExamAll`, {
					method: "POST",
					headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
					body: JSON.stringify({ lastRequest: true }),
				});
				const requestData = await requestReq.json();
				if (!requestReq.ok) throw new Error(requestData.message);
				console.log(requestData[0]);

				const CheckOpenRECRes = await fetch(`${BASE_URL}/api/CheckOpenREC`, {
					method: "POST",
					headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
				});
				const CheckOpenRECData = await CheckOpenRECRes.json();
				if (!CheckOpenRECRes.ok) throw new Error(CheckOpenRECData.message);
				console.log("วันที่ :", CheckOpenRECData);
				setLatestRequest(requestData[0]);
			} catch (e) {
				notify("error", e.message);
				console.error("Error fetching requestExamAll:", e);
			}
		};

		if (role === "student") {
			fetchRequestExam();
		}
	}, []);

	const handleOpenAddCancel = async () => {
		try {
			const requestRes = await fetch(`${BASE_URL}/api/studentInfo`, {
				method: "GET",
				headers: { Authorization: `Bearer ${token}` },
			});
			const requestData = await requestRes.json();
			if (!requestRes.ok) throw new Error(requestData.message);
			setSelectedRow(requestData);
			setOpenAddCancel(true);
			setError("");
		} catch (e) {
			notify("error", e.message);
			console.error("Error fetching studentInfo:", e);
		}
	};

	const handleAddCancel = async () => {
		if (!reason.trim()) {
			setError("กรุณากรอกเหตุผล");
			return;
		}
		try {
			const requestRes = await fetch(`${BASE_URL}/api/AddRequestExamCancel`, {
				method: "POST",
				headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
				body: JSON.stringify({ reason: reason, request_type: `ขอยกเลิกการเข้าสอบ${user.education_level === "ปริญญาโท" ? "ประมวลความรู้" : "วัดคุณสมบัติ"}` }),
			});
			const requestData = await requestRes.json();
			if (!requestRes.ok) throw new Error(requestData.message);
			setLatestRequest(true);
			notify("success", requestData.message || "สำเร็จ");
			setOpenAddCancel(false);
			setRequest((prev) => [...prev, { ...selectedRow, ...requestData.data }]);
		} catch (e) {
			notify("error", e.message);
			console.error("Error fetching cancelRequestExam:", e);
		}
	};

	const handleCancel = async (item) => {
		if (selected === "noapprove" && comment.trim() === "") {
			setError("กรุณาระบุเหตุผล");
			return;
		}
		try {
			const requestRes = await fetch(`${BASE_URL}/api/ApproveRequestExamCancel`, {
				method: "POST",
				headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
				body: JSON.stringify({
					request_cancel_exam_id: item.request_cancel_exam_id,
					request_exam_id: item.request_exam_id,
					name: name,
					role: role,
					selected: selected,
					comment_cancel: comment,
				}),
			});
			const requestData = await requestRes.json();
			if (!requestRes.ok) throw new Error(requestData.message);
			notify("success", requestData.message || "สำเร็จ");
			setSelected("approve");
			setComment("");
			setOpenApprove(false);
			setRequest((prev) => prev.map((row) => (row.request_cancel_exam_id === item.request_cancel_exam_id ? { ...row, ...requestData.data } : row)));
		} catch (e) {
			notify("error", e.message);
			console.error("Error fetching cancelApproveRequestExam:", e);
		}
	};

	function sortRequests(data, role) {
		if (role === "student") return data;
		return data.sort((a, b) => {
			const getOrder = (s) => {
				if (Number(s) === 0) return 2;
				if (Number(s) === 5) return 1;
				return 0;
			};
			const orderA = getOrder(a.status);
			const orderB = getOrder(b.status);
			return orderA - orderB || Number(a.status) - Number(b.status);
		});
	}

	const sortedData = sortRequests(request || [], role);

	const filteredData = sortedData?.filter((p) => {
		const matchesSearch = [p.student_name, p.student_id].join(" ").toLowerCase().includes(search.toLowerCase());
		const matchesType = selectedType ? p.request_type === selectedType : true;
		const matchesTerm = selectedTerm ? p.term === selectedTerm : true;
		return matchesSearch && matchesType && matchesTerm;
	});

	const rows = filteredData?.map((item) => (
		<Table.Tr key={item.request_cancel_exam_id}>
			<Table.Td>{item.student_name}</Table.Td>
			<Table.Td>{item.term}</Table.Td>
			<Table.Td>{role === "dean" ? `ขอยกเลิก${item.request_type.replace("ขอ", "")}` : item.request_type}</Table.Td>
			<Table.Td style={{ textAlign: "center" }}>
				{item.status == 0 && (
					<Pill variant="filled" style={{ backgroundColor: "#ccffcc", color: "#006600" }}>
						{item.status_text}
					</Pill>
				)}
				{item.status == 5 && (
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
				{item.status > 6 && (
					<Stepper active={item.status - 7} iconSize={20} styles={{ separator: { marginLeft: -4, marginRight: -4 }, stepIcon: { fontSize: 10 } }}>
						{[...Array(3)].map((_, i) => (
							<Stepper.Step key={i}>
								<Pill>{item.status_text}</Pill>
							</Stepper.Step>
						))}
					</Stepper>
				)}
			</Table.Td>

			<Table.Td style={{ maxWidth: "150px" }}>
				<Group>
					<Pdfg07 data={item} showType={item.status == 5 || item.status == 0 ? undefined : (role === "advisor" && item.status <= 7) || (role === "chairpersons" && item.status <= 8) || (role === "dean" && item.status <= 9) ? "view" : undefined} />
					{((role === "advisor" && item.status === "7") || (role === "chairpersons" && item.status === "8") || (role === "dean" && item.status === "9")) && (
						<Button
							size="xs"
							color="green"
							onClick={() => {
								setSelectedRow(item);
								setOpenApproveState("cancel");
								setOpenApprove(true);
							}}
						>
							ลงความเห็น
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
				handleCancel={handleCancel}
				role={role}
				title={`ลงความเห็นคำร้องขอยกเลิกการเข้าสอบ${user.education_level === "ปริญญาโท" ? "ประมวลความรู้" : "วัดคุณสมบัติ"}`}
			/>
			<ModalAddCancel opened={openAddCancel} onClose={() => setOpenAddCancel(false)} selectedRow={selectedRow} reason={reason} setReason={setReason} error={error} handleAddCancel={handleAddCancel} />
			<Text size="1.5rem" fw={900} mb="md">
				{`คำร้องขอยกเลิกการเข้าสอบ${user.education_level ? `${user.education_level === "ปริญญาโท" ? "ประมวลความรู้" : "วัดคุณสมบัติ"}` : "ประมวลความรู้/สอบวัดคุณสมบัติ"}`}
			</Text>
			<Group justify="space-between">
				<Box>
					<Flex align="flex-end" gap="sm">
						{role !== "student" && <TextInput placeholder="ค้นหาชื่่อ รหัส" value={search} onChange={(e) => setSearch(e.target.value)} />}
						{role !== "student" && <Select placeholder="ชนิดคำขอ" data={["ขอยกเลิกการเข้าสอบประมวลความรู้", "ขอยกเลิกการเข้าสอบวัดคุณสมบัติ"]} value={selectedType} onChange={setSelectedType} />}
						<Select placeholder="เทอมการศึกษา" data={term} value={selectedTerm} onChange={setSelectedTerm} allowDeselect={false} />
					</Flex>
				</Box>
				<Box>
					{role === "student" && (
						<>
							<Button onClick={() => handleOpenAddCancel()} disabled={!((latestRequest?.status === "1" || latestRequest?.status === "2" || latestRequest?.status === "3" || latestRequest?.status === "4" || latestRequest?.status === "5") && latestRequest?.exam_results === null)}>
								ขอยกเลิก
							</Button>
						</>
					)}
				</Box>
			</Group>
			<Space h="md" />
			<ScrollArea type="scroll" offsetScrollbars style={{ borderRadius: "8px", border: "1px solid #e0e0e0" }}>
				<Table horizontalSpacing="sm" verticalSpacing="sm" highlightOnHover>
					<Table.Thead>
						<Table.Tr>
							<Table.Th style={{ minWidth: 100 }}>ชื่อ</Table.Th>
							<Table.Th>ภาคเรียน</Table.Th>
							<Table.Th style={{ minWidth: 100 }}>เรื่อง</Table.Th>
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

export default RequestExamCancel;
