//คำร้องขอสอบความรู้ทางภาษาอังกฤษ
import { useState, useEffect, useMemo } from "react";
import { Box, Text, Table, Button, TextInput, Space, ScrollArea, Group, Flex, Stepper, Pill, Select } from "@mantine/core";
import ModalApprove from "../component/Modal/ModalApprove";
import ModalAdd from "../component/Modal/ModalAddEngTest";
import ModalPay from "../component/Modal/ModalPay";
import ModalInform from "../component/Modal/ModalInform";
import PdfButton from "../component/PDF/PdfButton";
import { useForm } from "@mantine/form";
import { jwtDecode } from "jwt-decode";
import PrintReceipt from "../component/button/printReceipt";
const BASE_URL = import.meta.env.VITE_API_URL;

const RequestEngTest = () => {
	const token = localStorage.getItem("token");
	const { role, user_id, name } = useMemo(() => {
		if (!token) return { role: "", user_id: "", name: "" };
		try {
			return jwtDecode(token);
		} catch (error) {
			console.error("Invalid token:", error);
			return { role: "", user_id: "", name: "" };
		}
	}, [token]);
	// Modal notify
	const [inform, setInform] = useState({ open: false, type: "", message: "" });
	const notify = (type, message) => setInform({ open: true, type, message });
	const close = () => setInform((s) => ({ ...s, open: false }));
	// useState
	const [openAdd, setOpenAdd] = useState(false);
	const [openApprove, setOpenApprove] = useState(false);
	const [openApproveState, setOpenApproveState] = useState(false);
	const [openPay, setOpenPay] = useState(false);
	const [selectedRow, setSelectedRow] = useState(null);
	const [selected, setSelected] = useState("approve");
	const [comment, setComment] = useState("");
	const [error, setError] = useState("");
	const [search, setSearch] = useState("");
	const [latestRequest, setLatestRequest] = useState(true);
	const [request, setRequest] = useState(null);
	const [term, setTerm] = useState([]);
	const [selectedTerm, setSelectedTerm] = useState("");
	const [openKQ, setOpenKQ] = useState(null);
	const [actualCurrentTerm, setActualCurrentTerm] = useState("");
	const [paymentCloseDate, setPaymentCloseDate] = useState(null);
	//useForm
	const form = useForm({});

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

					setActualCurrentTerm(myStatus.currentTerm);
					setSelectedTerm(myStatus.currentTerm);
					setOpenKQ(myStatus.isOpen);
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

	useEffect(() => {
		if (!selectedTerm) return;
		if (request != null && role === "student") return;
		console.log(selectedTerm);

		const getRequest = async () => {
			try {
				const requestReq = await fetch(`${BASE_URL}/api/allRequestEngTest`, {
					method: "POST",
					headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
					body: JSON.stringify({ term: selectedTerm }),
				});
				const requestData = await requestReq.json();
				if (!requestReq.ok) throw new Error(requestData.message);
				setRequest(requestData);

				console.log(requestData);
			} catch (e) {
				notify("error", e.message);
				console.error("Error fetching allRequestEngTest:", e);
			}
		};
		getRequest();
	}, [selectedTerm]);

	useEffect(() => {
		if (request === null || role !== "student" || openKQ === null) return;
		console.log("student");

		const fetchStudentData = async () => {
			try {
				if (openKQ === false) {
					throw new Error("ยังไม่เปิดให้ยื่นคำร้องในขณะนี้");
				}

				if (!request.length) {
					console.log("ลำดับ : 1 ไม่มีคำร้อง (เปิด)");
					setLatestRequest(false);
				} else {
					console.log("ลำดับ : 2 มีคำร้อง (ปิด)");
					setLatestRequest(true);
				}
			} catch (e) {
				notify("error", e.message, 10000);
				console.error(e);
			}
		};
		fetchStudentData();
	}, [request, openKQ, selectedTerm]);

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
			notify("error", e.message || "เกิดข้อผิดพลาดในการเชื่อมต่อกับระบบ");
			console.error("Error fetching studentInfo:", e);
		}
	};

	const handleAdd = async () => {
		try {
			const requestRes = await fetch(`${BASE_URL}/api/addRequestEngTest`, {
				method: "POST",
				headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
				body: JSON.stringify(form.values),
			});
			const requestData = await requestRes.json();
			if (!requestRes.ok) throw new Error(requestData.message);
			notify("success", requestData.message || "สำเร็จ");
			setOpenAdd(false);
			setLatestRequest(true);
			setRequest((prev) => [...prev, { ...form.values, ...requestData.data }]);
			setSelectedTerm(actualCurrentTerm);
		} catch (e) {
			notify("error", e.message || "เกิดข้อผิดพลาดในการเชื่อมต่อกับระบบ");
			console.error("Error fetching addRequestEngTest:", e);
		}
	};

	const handleApprove = async (item) => {
		if (selected === "noapprove" && comment.trim() === "") {
			setError("กรุณาระบุเหตุผล");
			return;
		}
		try {
			const requestRes = await fetch(`${BASE_URL}/api/approveRequestEngTest`, {
				method: "POST",
				headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
				body: JSON.stringify({ request_eng_test_id: item.request_eng_test_id, name: name, role: role, selected: selected, comment: comment }),
			});
			const requestData = await requestRes.json();
			if (!requestRes.ok) throw new Error(requestData.message);
			notify("success", requestData.message || "สำเร็จ");
			setSelected("approve");
			setComment("");
			setOpenApprove(false);
			setRequest((prev) => prev.map((row) => (row.request_eng_test_id === item.request_eng_test_id ? { ...row, ...requestData.data } : row)));
		} catch (e) {
			notify("error", e.message || "เกิดข้อผิดพลาดในการเชื่อมต่อกับระบบ");
			console.error("Error fetching approveRequestEngTest:", e);
		}
	};

	const handlePay = async (item) => {
		try {
			const requestRes = await fetch(`${BASE_URL}/api/payRequestEngTest`, {
				method: "POST",
				headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
				body: JSON.stringify({ request_eng_test_id: item.request_eng_test_id, receipt_vol: "2569/RRT005", receipt_No: "1", receipt_pay: "1000" }),
			});
			const requestData = await requestRes.json();
			if (!requestRes.ok) throw new Error(requestData.message);
			notify("success", requestData.message || "สำเร็จ");
			setOpenPay(false);
			setRequest((prev) => prev.map((row) => (row.request_eng_test_id === item.request_eng_test_id ? { ...row, ...requestData.data } : row)));
		} catch (e) {
			notify("error", e.message || "เกิดข้อผิดพลาดในการเชื่อมต่อกับระบบ");
			console.error("Error fetching payRequestEngTest:", e);
		}
	};

	function sortRequests(data, role) {
		if (role === "student") return data;
		return data.sort((a, b) => Number(a.status) - Number(b.status));
	}

	const sortedData = sortRequests(request || [], role);

	const filteredData = sortedData?.filter((p) => {
		const matchesSearch = [p.student_name, p.student_id].join(" ").toLowerCase().includes(search.toLowerCase());
		const matchesTerm = selectedTerm ? p.term === selectedTerm : true;
		return matchesSearch && matchesTerm;
	});

	const rows = filteredData?.map((item) => {
		const studentYear = parseInt(String(item.student_id).substring(0, 2));
		const targetStatus = studentYear >= 67 ? statusNew : statusOld;
		const isRowOpen = targetStatus?.isOpen;
		const rowCurrentTerm = targetStatus?.currentTerm;

		return (
			<Table.Tr key={item.request_eng_test_id}>
				<Table.Td>{item.student_name}</Table.Td>
				<Table.Td>{item.term}</Table.Td>
				<Table.Td>ขอสอบความรู้ทางภาษาอังกฤษ</Table.Td>
				<Table.Td style={{ textAlign: "center" }}>
					{item.status < 5 && item.status > 0 && (
						<Stepper active={item.status - 1} iconSize={20} styles={{ separator: { marginLeft: -4, marginRight: -4 }, stepIcon: { fontSize: 10 } }}>
							{[...Array(4)].map((_, i) => (
								<Stepper.Step key={i}>
									<Pill>{item.status_text}</Pill>
								</Stepper.Step>
							))}
						</Stepper>
					)}
					{item.status == 0 && (
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
					{item.status > 6 && <Text>{item.status_text}</Text>}
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
										disabled={!isRowOpen || item.term !== rowCurrentTerm}
									>
										ชำระค่าธรรมเนียม
									</Button>
								)}
								{item.receipt_vol != null && <PrintReceipt item={item} />}
							</>
						)}
						<PdfButton data={item} showType={item.status == 0 ? undefined : (role === "advisor" && item.status <= 1) || (role === "chairpersons" && item.status <= 2) || (role === "officer_registrar" && item.status <= 3) ? "view" : undefined} />
						{((role === "advisor" && item.status === "1") || (role === "chairpersons" && item.status === "2") || (role === "officer_registrar" && item.status === "3")) && (
							<Button
								size="xs"
								color="green"
								onClick={() => {
									setSelectedRow(item);
									setOpenApproveState("add");
									setOpenApprove(true);
								}}
								disabled={!isRowOpen || item.term !== rowCurrentTerm}
							>
								{role === "officer_registrar" ? "ตรวจสอบ" : "ลงความเห็น"}
							</Button>
						)}
					</Group>
				</Table.Td>
			</Table.Tr>
		);
	});

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
				title={"ลงความเห็นคำร้องขอสอบความรู้ทางภาษาอังกฤษ"}
			/>
			<ModalAdd opened={openAdd} onClose={() => setOpenAdd(false)} form={form.values} handleAdd={handleAdd} title={"เพิ่มคำร้องขอสอบความรู้ทางภาษาอังกฤษ"} />
			<ModalPay opened={openPay} onClose={() => setOpenPay(false)} selectedRow={selectedRow} handlePay={handlePay} MoneyRegis={1000} type={`คำร้องขอสอบความรู้ทางภาษาอังกฤษ`} stop_date={paymentCloseDate} />

			<Text size="1.5rem" fw={900} mb="md">
				คำร้องขอสอบความรู้ทางภาษาอังกฤษ
			</Text>
			<Group justify="space-between">
				<Box>
					<Flex align="flex-end" gap="sm">
						{role !== "student" && <TextInput placeholder="ค้นหา ชื่่อ รหัสนักศึกษา" value={search} onChange={(e) => setSearch(e.target.value)} />}
						<Select placeholder="เทอมการศึกษา" data={term} value={selectedTerm} onChange={setSelectedTerm} allowDeselect={false} style={{ width: 80 }}/>
					</Flex>
				</Box>
				<Box>
					{role === "student" && (
						<Button onClick={() => handleOpenAdd()} disabled={openKQ === false || latestRequest}>
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

export default RequestEngTest;
