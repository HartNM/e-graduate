//ตารางคำร้องขอ
import { useState, useEffect } from "react";
import { Box, Text, Table, Button, TextInput, Space, ScrollArea, Group, Select, Flex, Stepper, Pill } from "@mantine/core";
import { useParams } from "react-router-dom";
import ModalAddCancel from "../component/Modal/ModalAddCancel";
import ModalApprove from "../component/Modal/ModalApprove";
import ModalInform from "../component/Modal/ModalInform";
import Pdfg07 from "../component/PDF/Pdfg07";

const RequestExamCancel = () => {
	const token = localStorage.getItem("token");
	const payloadBase64 = token.split(".")[1];
	const payload = JSON.parse(atob(payloadBase64));
	const role = payload.role;
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
	//student //advisor //chairpersons //officer_registrar //dean
	const [request, setRequest] = useState([]);
	const [search, setSearch] = useState("");
	const { type } = useParams();
	const [selectedType, setSelectedType] = useState("");

	useEffect(() => {
		const fetchProfile = async () => {
			try {
				const requestRes = await fetch("http://localhost:8080/api/profile", {
					method: "GET",
					headers: { Authorization: `Bearer ${token}` },
				});
				const requestData = await requestRes.json();
				if (!requestRes.ok) throw new Error(requestData.message);
				setUser(requestData);
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
	const [reloadTable, setReloadTable] = useState(false);
	useEffect(() => {
		const fetchRequestExam = async () => {
			try {
				const requestExamRes = await fetch("http://localhost:8080/api/requestExamAll", {
					method: "POST",
					headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
					body: JSON.stringify({ lastRequest: true }),
				});
				const requestExamData = await requestExamRes.json();
				if (!requestExamRes.ok) throw new Error(requestExamData.message);
				console.log(requestExamData[0]);

				const CheckOpenRECRes = await fetch("http://localhost:8080/api/CheckOpenREC", {
					method: "POST",
					headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
				});
				const CheckOpenRECData = await CheckOpenRECRes.json();
				if (!CheckOpenRECRes.ok) throw new Error(CheckOpenRECData.message);
				console.log(CheckOpenRECData[0]);

				if (CheckOpenRECData[0]?.status) {
					setLatestRequest(requestExamData[0]);
				} else {
					setLatestRequest(true);
				}
			} catch (e) {
				notify("error", e.message);
				console.error("Error fetching requestExamAll:", e);
			}
		};
		if (role === "student") {
			fetchRequestExam();
		}
		const fetchRequestExamCancel = async () => {
			try {
				const requestRes = await fetch("http://localhost:8080/api/AllRequestExamCancel", {
					method: "POST",
					headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
				});
				const requestData = await requestRes.json();
				if (!requestRes.ok) throw new Error(requestData.message);
				setRequest(requestData);
			} catch (e) {
				notify("error", e.message);
				console.error("Error fetching AllRequestExamCancel:", e);
			}
		};
		fetchRequestExamCancel();
		setReloadTable(false);
	}, [reloadTable]);

	const handleOpenAddCancel = async () => {
		try {
			const requestRes = await fetch("http://localhost:8080/api/studentInfo", {
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
			const requestRes = await fetch("http://localhost:8080/api/AddRequestExamCancel", {
				method: "POST",
				headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
				body: JSON.stringify({ reason: reason, request_type: `ขอยกเลิกการเข้าสอบ${user.education_level === "ปริญญาโท" ? "ประมวลความรู้" : "วัดคุณสมบัติ"}` }),
			});
			const requestData = await requestRes.json();
			if (!requestRes.ok) throw new Error(requestData.message);
			notify("success", requestData.message || "สำเร็จ");
			setOpenAddCancel(false);
			setReloadTable(true);
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
			const requestRes = await fetch("http://localhost:8080/api/ApproveRequestExamCancel", {
				method: "POST",
				headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
				body: JSON.stringify({
					request_cancel_exam_id: item.request_cancel_exam_id,
					request_exam_id: item.request_exam_id,
					name: user.name,
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

	const sortedData = sortRequests(request, role);

	const filteredData = sortedData.filter((p) => {
		const matchesSearch = [p.student_name, p.student_id].join(" ").toLowerCase().includes(search.toLowerCase());
		const matchesType = selectedType ? p.request_type === selectedType : true;
		return matchesSearch && matchesType;
	});

	const rows = filteredData.map((item) => (
		<Table.Tr key={item.request_cancel_exam_id}>
			<Table.Td>{item.student_name}</Table.Td>
			{["advisor", "chairpersons", "dean"].includes(role) && <Table.Td>{role === "dean" ? `ขอยกเลิก${item.request_type.replace("ขอ", "")}` : item.request_type}</Table.Td>}
			<Table.Td style={{ textAlign: "center" }}>
				{item.status == 0 && (
					<Pill variant="filled" style={{ backgroundColor: "#ccffcc", color: "#006600" }}>
						{item.status_text}
					</Pill>
				)}
				{item.status == 5 && (
					<Pill variant="filled" style={{ backgroundColor: "#ffcccc", color: "#b30000" }}>
						{item.status_text}
					</Pill>
				)}
				{item.status > 6 && <Pill>{item.status_text}</Pill>}
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
						{role === "chairpersons" && <Select placeholder="ชนิดคำขอ" data={["ขอยกเลิกการเข้าสอบประมวลความรู้", "ขอยกเลิกการเข้าสอบวัดคุณสมบัติ"]} value={selectedType} onChange={setSelectedType} />}
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
							{["advisor", "chairpersons", "dean"].includes(role) && <Table.Th style={{ minWidth: 100 }}>เรื่อง</Table.Th>}
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
