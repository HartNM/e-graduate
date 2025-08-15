//ตารางคำร้องขอ
import { useState, useEffect } from "react";
import { Box, Text, Table, Button, TextInput, Space, ScrollArea, Group, Select, Flex, Stepper, Pill, Tooltip } from "@mantine/core";

import ModalApprove from "../component/Modal/ModalApprove";
import ModalInfo from "../component/Modal/ModalInfo";
import ModalAddCancel from "../component/Modal/ModalAddCancel";
import ModalAdd from "../component/Modal/ModalAdd";
import ModalCheck from "../component/Modal/ModalCheck";
import ModalPay from "../component/Modal/ModalPay";
import ModalInform from "../component/Modal/ModalInform";
import Pdfg01 from "../component/PDF/pdfg01";

const RequestList = () => {
	// Modal states
	const [openInform, setOpenInform] = useState(false);
	const [openInfo, setOpenInfo] = useState(false);
	const [openAdd, setOpenAdd] = useState(false);
	const [openApprove, setOpenApprove] = useState(false);
	const [openApproveState, setOpenApproveState] = useState(false);
	const [openAddCancel, setOpenAddCancel] = useState(false);
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
	const [informMessage, setInformMessage] = useState("");
	const [informtype, setInformtype] = useState("");

	useEffect(() => {
		const fetchProfile = async () => {
			try {
				const profileRes = await fetch("http://localhost:8080/api/profile", {
					method: "GET",
					headers: { Authorization: `Bearer ${token}` },
				});
				const profileData = await profileRes.json();
				setUser(profileData);
				console.log(profileData);
			} catch (err) {
				setInformtype("error");
				setInformMessage("เกิดข้อผิดพลาดในการเชื่อมต่อกับระบบ");
				setOpenInform(true);
				console.error("Error fetching profile:", err);
			}
		};
		fetchProfile();
	}, []);

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
				setRequestExam(requestData);
				console.log(requestData);
			} catch (err) {
				setInformtype("error");
				setInformMessage("เกิดข้อผิดพลาดในการเชื่อมต่อกับระบบ");
				setOpenInform(true);
				console.error("Error fetching requestExamAll:", err);
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
			setFormData(requestData);
			setOpenAdd(true);
		} catch (err) {
			setInformtype("error");
			setInformMessage("เกิดข้อผิดพลาดในการเชื่อมต่อกับระบบ");
			setOpenInform(true);
			console.error("Error fetching studentInfo:", err);
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
			if (requestRes.ok) {
				setInformtype("success");
			} else {
				setInformtype("error");
			}
			setInformMessage(requestData.message);
			setOpenInform(true);
			setOpenAdd(false);
			setReloadTable(true);
		} catch (err) {
			setInformtype("error");
			setInformMessage("เกิดข้อผิดพลาดในการเชื่อมต่อกับระบบ");
			setOpenInform(true);
			console.error("Error fetching addRequestExam:", err);
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
				body: JSON.stringify({
					request_exam_id: item.request_exam_id,
					name: user.name,
					role: user.role,
					selected: selected,
					comment: comment,
				}),
			});
			const requestData = await requestRes.json();
			if (requestRes.ok) {
				setInformtype("success");
			} else {
				setInformtype("error");
			}
			setInformMessage(requestData.message);
			setOpenInform(true);
			setSelected("approve");
			setComment("");
			setOpenApprove(false);
			setReloadTable(true);
		} catch (err) {
			setInformtype("error");
			setInformMessage("เกิดข้อผิดพลาดในการเชื่อมต่อกับระบบ");
			setOpenInform(true);
			console.error("Error fetching approveRequestExam:", err);
		}
	};

	const handlePay = async (item) => {
		try {
			const requestRes = await fetch("http://localhost:8080/api/payRequestExam", {
				method: "POST",
				headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
				body: JSON.stringify({
					request_exam_id: item.request_exam_id,
					receipt_vol_No: "10/54",
				}),
			});
			const requestData = await requestRes.json();
			if (requestRes.ok) {
				setInformtype("success");
			} else {
				setInformtype("error");
			}
			setInformMessage(requestData.message);
			setOpenInform(true);
			setOpenPay(false);
			setReloadTable(true);
		} catch (err) {
			setInformtype("error");
			setInformMessage("เกิดข้อผิดพลาดในการเชื่อมต่อกับระบบ");
			setOpenInform(true);
			console.error("Error fetching payRequestExam:", err);
		}
	};

	const handleAddCancel = async (item) => {
		if (!reason.trim()) {
			setError("กรุณากรอกเหตุผล");
			return;
		}
		try {
			const requestRes = await fetch("http://localhost:8080/api/cancelRequestExam", {
				method: "POST",
				headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
				body: JSON.stringify({
					request_exam_id: item.request_exam_id,
					reason: reason,
				}),
			});
			const requestData = await requestRes.json();
			if (requestRes.ok) {
				setInformtype("success");
			} else {
				setInformtype("error");
			}
			setInformMessage(requestData.message);
			setOpenInform(true);
			setReason("");
			setOpenAddCancel(false);
			setReloadTable(true);
		} catch (err) {
			setInformtype("error");
			setInformMessage("เกิดข้อผิดพลาดในการเชื่อมต่อกับระบบ");
			setOpenInform(true);
			console.error("Error fetching cancelRequestExam:", err);
		}
	};

	const handleCancel = async (item) => {
		if (selected === "noapprove" && comment.trim() === "") {
			setError("กรุณาระบุเหตุผล");
			return;
		}
		try {
			const requestRes = await fetch("http://localhost:8080/api/cancelApproveRequestExam", {
				method: "POST",
				headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
				body: JSON.stringify({
					request_cancel_exam_id: item.cancel_list[0].request_cancel_exam_id,
					request_exam_id: item.request_exam_id,
					name: user.name,
					role: user.role,
					selected: selected,
					comment_cancel: comment,
				}),
			});
			const requestData = await requestRes.json();
			if (requestRes.ok) {
				setInformtype("success");
			} else {
				setInformtype("error");
			}
			setSelected("approve");
			setInformMessage(requestData.message);
			setOpenInform(true);
			setComment("");
			setOpenApprove(false);
			setReloadTable(true);
		} catch (err) {
			setInformtype("error");
			setInformMessage("เกิดข้อผิดพลาดในการเชื่อมต่อกับระบบ");
			setOpenInform(true);
			console.error("Error fetching cancelApproveRequestExam:", err);
		}
	};

	const handleInfo = async (item) => {
		console.log(item);
		try {
			const res = await fetch("http://localhost:8080/api/pdfRequestExam", {
				method: "POST",
				headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
				body: JSON.stringify({ item }),
			});
			const blob = await res.blob();
			const url = URL.createObjectURL(blob);
			window.open(url, "_blank");
		} catch (err) {
			console.error("Error fetching pdfRequestExam:", err);
		}
	};
	const [selectedType, setSelectedType] = useState("");
	const filteredData = requestExam.filter((p) => {
		const matchesSearch = [p.student_name, p.student_id].join(" ").toLowerCase().includes(search.toLowerCase());
		const matchesType = selectedType ? p.request_type === selectedType : true;
		return matchesSearch && matchesType;
	});
	const rows = filteredData.map((item) => (
		<Table.Tr key={item.request_exam_id}>
			{/* <Table.Td>{item.request_exam_id}</Table.Td>
			<Table.Td>{item.request_date}</Table.Td> */}
			<Table.Td>{item.student_name}</Table.Td>
			{(user.role === "advisor" || user.role === "officer_registrar" || user.role === "chairpersons" || user.role === "dean") && <Table.Td>{item.request_type}</Table.Td>}

			<Table.Td style={{ textAlign: "center" }}>
				{item.status <= 4 && (
					<>
						{/* <Tooltip label={item.status_text}></Tooltip> */}
						<Stepper active={item.status - 1} iconSize={20} styles={{ separator: { marginLeft: -4, marginRight: -4 }, stepIcon: { fontSize: 10 } }}>
							<Stepper.Step>{item.status_text}</Stepper.Step>
							<Stepper.Step>{item.status_text}</Stepper.Step>
							<Stepper.Step>{item.status_text}</Stepper.Step>
							<Stepper.Step>{item.status_text}</Stepper.Step>
						</Stepper>
					</>
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

				{item.status > 6 && <Pill>{item.status_text}</Pill>}
			</Table.Td>

			<Table.Td>
				<Group>
					{user.role === "student" && (
						<>
							<Pdfg01 data={item} />
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
									{/* <Button
										size="xs"
										color="red"
										onClick={() => {
											setSelectedRow(item);
											setOpenAddCancel(true);
										}}
									>
										ขอยกเลิก
									</Button> */}
									<Button size="xs" color="green">
										พิมพ์ใบเสร็จ
									</Button>
								</>
							)}
						</>
					)}
					{user.role !== "student" && ((user.role === "advisor" && item.status > "1") || (user.role === "chairpersons" && item.status > "2") || (user.role === "officer_registrar" && item.status > "3") ? <Pdfg01 data={item} /> : <Pdfg01 data={item} showType="view" />)}
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
					{/* {((user.role === "advisor" && item.status === "7") || (user.role === "chairpersons" && item.status === "8") || (user.role === "dean" && item.status === "9")) && (
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
					)} */}
				</Group>
			</Table.Td>
			<Table.Td style={{ textAlign: "center" }}>{item.exam_results === null ? "" : item.exam_results ? "ผ่าน" : "ไม่ผ่าน"}</Table.Td>
		</Table.Tr>
	));

	return (
		<Box>
			<ModalInform opened={openInform} onClose={() => setOpenInform(false)} message={informMessage} type={informtype} />
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
				handleCancel={handleCancel}
				role={user.role}
			/>
			<ModalInfo opened={openInfo} onClose={() => setOpenInfo(false)} selectedRow={selectedRow} />
			<ModalAddCancel opened={openAddCancel} onClose={() => setOpenAddCancel(false)} selectedRow={selectedRow} reason={reason} setReason={setReason} error={error} handleAddCancel={handleAddCancel} />
			<ModalAdd opened={openAdd} onClose={() => setOpenAdd(false)} formData={formData} handleAdd={handleAdd} />
			<ModalCheck opened={openCheck} onClose={() => setOpenCheck(false)} selected={selected} setSelected={setSelected} comment={comment} setComment={setComment} error={error} />
			<ModalPay opened={openPay} onClose={() => setOpenPay(false)} selectedRow={selectedRow} handlePay={handlePay} />

			<Text size="1.5rem" fw={900} mb="md">
				คำร้องขอสอบ{user.education_level}
			</Text>
			<Group justify="space-between">
				<Box>
					<Flex align="flex-end" gap="sm">
						<TextInput placeholder="ค้นหาชื่่อ รหัส" value={search} onChange={(e) => setSearch(e.target.value)} />
						{(user.role === "officer_registrar" || user.role === "chairpersons" || user.role === "dean") && (
							<Select
								placeholder="ชนิดคำขอ"
								data={["ขอสอบประมวลความรู้", "ขอสอบวัดคุณสมบัติ"]}
								value={selectedType} // default selection
								onChange={setSelectedType}
							/>
						)}
					</Flex>
				</Box>
				<Box>
					{user.role === "student" && (
						<Button onClick={() => handleOpenAdd()} disabled={!requestExam.every((item) => item.status === "6")}>
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
							{/* <Table.Th>#</Table.Th>
							<Table.Th>วันที่</Table.Th> */}
							<Table.Th style={{ minWidth: 100 }}>ชื่อ</Table.Th>
							{(user.role === "advisor" || user.role === "officer_registrar" || user.role === "chairpersons" || user.role === "dean") && <Table.Th style={{ minWidth: 100 }}>เรื่อง</Table.Th>}
							<Table.Th style={{ minWidth: 110 }}>สถานะ</Table.Th>
							<Table.Th style={{ minWidth: 100 }}>การดำเนินการ</Table.Th>
							{requestExam.some((item) => item.exam_results !== null) && <Table.Th style={{ minWidth: 110 }}>ผลสอบ</Table.Th>}
						</Table.Tr>
					</Table.Thead>
					<Table.Tbody>{rows}</Table.Tbody>
				</Table>
			</ScrollArea>
		</Box>
	);
};

export default RequestList;
