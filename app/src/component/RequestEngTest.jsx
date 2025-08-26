//ตารางคำร้องขอ
import { useState, useEffect } from "react";
import { Box, Text, Table, Button, TextInput, Space, ScrollArea, Group, Flex, Stepper, Pill } from "@mantine/core";
import ModalApprove from "../component/Modal/ModalApprove";
import ModalAdd from "../component/Modal/ModalAdd";
import ModalCheck from "../component/Modal/ModalCheck";
import ModalPay from "../component/Modal/ModalPay";
import ModalInform from "../component/Modal/ModalInform";
import Pdfg02 from "../component/PDF/Pdfg02";

const RequestExam = () => {
	// Modal notify
	const [inform, setInform] = useState({ open: false, type: "", message: "" });
	const notify = (type, message) => setInform({ open: true, type, message });
	const close = () => setInform((s) => ({ ...s, open: false }));
	// Modal states
	const [openAdd, setOpenAdd] = useState(false);
	const [openApprove, setOpenApprove] = useState(false);
	const [openApproveState, setOpenApproveState] = useState(false);
	const [openPay, setOpenPay] = useState(false);
	const [openCheck, setOpenCheck] = useState(false);
	// Form states
	const [formData, setFormData] = useState({});
	const [selectedRow, setSelectedRow] = useState(null);
	const [selected, setSelected] = useState("approve");
	const [comment, setComment] = useState("");
	const [reason, setReason] = useState("");
	const [error, setError] = useState("");
	// System states
	const [user, setUser] = useState("");
	//student //advisor //chairpersons //officer_registrar //dean
	const [requestExam, setRequestExam] = useState([]);
	const [search, setSearch] = useState("");
	const [reloadTable, setReloadTable] = useState(false);
	const token = localStorage.getItem("token");
	const [dateExam, setDateExam] = useState("");

	useEffect(() => {
		const fetchExam_date = async () => {
			try {
				const requestRes = await fetch("http://localhost:8080/api/allRequestExamInfo", {
					method: "POST",
					headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
				});
				const requestData = await requestRes.json();
				if (!requestRes.ok) {
					throw new Error(requestData.message);
				}
				setDateExam(requestData[0].exam_date);
				console.log(requestData[0].exam_date);
			} catch (e) {
				notify("error", e.message || "เกิดข้อผิดพลาดในการเชื่อมต่อกับระบบ");
				console.error("Error fetch allRequestExamInfo:", e);
			}
		};
		fetchExam_date();
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
		if (!user) return;
		const fetchRequestExam = async () => {
			try {
				const requestRes = await fetch("http://localhost:8080/api/allRequestEngTest", {
					method: "POST",
					headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
					body: JSON.stringify({ role: user.role, id: user.id }),
				});
				const requestData = await requestRes.json();
				if (!requestRes.ok) {
					throw new Error(requestData.message);
				}
				setRequestExam(requestData);
				console.log(requestData);
			} catch (e) {
				notify("error", e.message || "เกิดข้อผิดพลาดในการเชื่อมต่อกับระบบ");
				console.error("Error fetching requestExamAll:", e);
			} finally {
				setReloadTable(false);
			}
		};
		fetchRequestExam();
	}, [user, reloadTable]);

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
			setFormData(requestData);
			setOpenAdd(true);
		} catch (e) {
			notify("error", e.message || "เกิดข้อผิดพลาดในการเชื่อมต่อกับระบบ");
			console.error("Error fetching studentInfo:", e);
		}
	};

	const handleAdd = async () => {
		try {
			const requestRes = await fetch("http://localhost:8080/api/addRequestEngTest", {
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
			setReloadTable(true);
		} catch (e) {
			notify("error", e.message || "เกิดข้อผิดพลาดในการเชื่อมต่อกับระบบ");
			console.error("Error fetching addRequestExam:", e);
		}
	};

	const handleApprove = async (item) => {
		if (selected === "noapprove" && comment.trim() === "") {
			setError("กรุณาระบุเหตุผล");
			return;
		}
		try {
			const requestRes = await fetch("http://localhost:8080/api/approveRequestEngTest", {
				method: "POST",
				headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
				body: JSON.stringify({ request_eng_test_id: item.request_eng_test_id, name: user.name, role: user.role, selected: selected, comment: comment }),
			});
			const requestData = await requestRes.json();
			if (!requestRes.ok) {
				throw new Error(requestData.message);
			}
			notify("success", requestData.message || "สำเร็จ");
			setSelected("approve");
			setComment("");
			setOpenApprove(false);
			setReloadTable(true);
		} catch (e) {
			notify("error", e.message || "เกิดข้อผิดพลาดในการเชื่อมต่อกับระบบ");
			console.error("Error fetching approveRequestExam:", e);
		}
	};

	const handlePay = async (item) => {
		try {
			const requestRes = await fetch("http://localhost:8080/api/payRequestEngTest", {
				method: "POST",
				headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
				body: JSON.stringify({ request_eng_test_id: item.request_eng_test_id, receipt_vol_No: "10/54" }),
			});
			const requestData = await requestRes.json();
			if (!requestRes.ok) {
				throw new Error(requestData.message);
			}
			notify("success", requestData.message || "สำเร็จ");
			setOpenPay(false);
			setReloadTable(true);
		} catch (e) {
			notify("error", e.message || "เกิดข้อผิดพลาดในการเชื่อมต่อกับระบบ");
			console.error("Error fetching payRequestExam:", e);
		}
	};

	const filteredData = requestExam.filter((p) => {
		const matchesSearch = [p.student_name, p.student_id].join(" ").toLowerCase().includes(search.toLowerCase());
		return matchesSearch;
	});

	const rows = filteredData
		.filter((item) => {
			return (
				item.status !== "6" ||
				(item.status === "6" && ((user.role === "chairpersons" && item.advisor_approvals && (!item.chairpersons_approvals || !item.registrar_approvals)) || (user.role === "officer_registrar" && item.advisor_approvals && item.chairpersons_approvals && !item.registrar_approvals)))
			);
		})
		.map((item) => (
			<Table.Tr key={item.request_eng_test_id}>
				<Table.Td>{item.student_name}</Table.Td>
				{["advisor", "officer_registrar", "chairpersons", "dean"].includes(user?.role) && <Table.Td>ขอทดสอบความรู้ทางภาษาอังกฤษ</Table.Td>}
				<Table.Td style={{ textAlign: "center" }}>
					{item.status <= 4 && item.status > 0 && (
						<>
							<Stepper active={item.status - 1} iconSize={20} styles={{ separator: { marginLeft: -4, marginRight: -4 }, stepIcon: { fontSize: 10 } }}>
								{[...Array(4)].map((_, i) => (
									<Stepper.Step key={i}>
										<Pill>{item.status_text}</Pill>
									</Stepper.Step>
								))}
							</Stepper>
						</>
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
								{item.status === "5" && (
									<>
										<Button size="xs" color="green">
											พิมพ์ใบเสร็จ
										</Button>
									</>
								)}
							</>
						)}
						<Pdfg02 data={item} exam_date={dateExam} showType={item.status == 0 ? undefined : (user.role === "advisor" && item.status <= 1) || (user.role === "chairpersons" && item.status <= 2) || (user.role === "officer_registrar" && item.status <= 3) ? "view" : undefined} />
						{((user.role === "advisor" && item.status === "1") || (user.role === "chairpersons" && item.status === "2") || (user.role === "officer_registrar" && item.status === "3")) && (
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
				title={"ลงความเห็นคำร้องขอทดสอบความรู้ทางภาษาอังกฤษ"}
			/>
			<ModalAdd opened={openAdd} onClose={() => setOpenAdd(false)} formData={formData} handleAdd={handleAdd} title={"เพิ่มคำร้องขอทดสอบความรู้ทางภาษาอังกฤษ"} />
			<ModalCheck opened={openCheck} onClose={() => setOpenCheck(false)} selected={selected} setSelected={setSelected} comment={comment} setComment={setComment} error={error} />
			<ModalPay opened={openPay} onClose={() => setOpenPay(false)} selectedRow={selectedRow} handlePay={handlePay} />

			<Text size="1.5rem" fw={900} mb="md">
				คำร้องขอทดสอบความรู้ทางภาษาอังกฤษ
			</Text>
			<Group justify="space-between">
				<Box>
					<Flex align="flex-end" gap="sm">
						<TextInput placeholder="ค้นหาชื่่อ รหัส" value={search} onChange={(e) => setSearch(e.target.value)} />
					</Flex>
				</Box>
				<Box>
					{user.role === "student" && (
						<Button onClick={() => handleOpenAdd()} disabled={!requestExam.some((item) => item.status === "0") && !requestExam.every((item) => item.status === "6")}>
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
							{["advisor", "officer_registrar", "chairpersons", "dean"].includes(user?.role) && <Table.Th style={{ minWidth: 100 }}>เรื่อง</Table.Th>}
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

export default RequestExam;
