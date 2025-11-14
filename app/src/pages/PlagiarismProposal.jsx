//รายงานผลตรวจสอบการคัดลอก โครงร่างวิทยานิพนธ์/การค้นคว้าอิสระ
import { useState, useEffect } from "react";
import { Box, Text, Table, Button, TextInput, Space, ScrollArea, Group, Select, Flex, Stepper, Pill } from "@mantine/core";
import { useForm } from "@mantine/form";
import { useParams } from "react-router-dom";
import ModalAddRequestGraduation from "../component/Modal/ModalAddPlagiarismReport";
import ModalApprove from "../component/Modal/ModalApprove";
import ModalInform from "../component/Modal/ModalInform";
import Pdfg06 from "../component/PDF/Pdfg06";
const BASE_URL = import.meta.env.VITE_API_URL;

const PlagiarismReport = () => {
	const token = localStorage.getItem("token");
	const payloadBase64 = token.split(".")[1];
	const payload = JSON.parse(atob(payloadBase64));
	const role = payload.role;
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
	const [user, setUser] = useState("");
	//student //advisor //chairpersons //officer_registrar
	const [request, setRequest] = useState([]);
	const [search, setSearch] = useState("");
	const { type } = useParams();

	const validateChapter = (value) => {
		if (value === null || value === "") return "ห้ามเว้นว่าง";
		if (value < 0 || value > 100) return "กรอก 0-100 เท่านั้น";
		return null;
	};

	const form = useForm({
		initialValues: {
			student_name: "",
			study_group_id: "",
			student_id: "",
			education_level: "",
			program: "",
			major_name: "",
			faculty_name: "",
			research_name: "",
			chapter_1: 0,
			chapter_2: 0,
			chapter_3: 0,
			inspection_date: null,
			plagiarism_file: null,
			full_report_file: null,
		},
		validate: (values) => {
			const errors = {};
			if (!(values.research_name || "").trim()) {
				errors.research_name = "กรุณากรอกชื่อวิจัย";
			}
			if (!values.inspection_date) {
				errors.inspection_date = "กรุณาระบุวันที่ปิด";
			}
			let fieldsToCheck = ["chapter_1", "chapter_2", "chapter_3"];
			fieldsToCheck.forEach((field) => {
				const error = validateChapter(values[field]);
				if (error) errors[field] = error;
			});
			if (!(values.plagiarism_file instanceof File)) {
				errors.plagiarism_file = "กรุณาอัปโหลดไฟล์ตรวจสอบ";
			}
			if (!(values.full_report_file instanceof File)) {
				errors.full_report_file = "กรุณาอัปโหลดไฟล์รายงานฉบับเต็ม";
			}
			return errors;
		},
	});

	useEffect(() => {
		const fetchProfile = async () => {
			try {
				const requestRes = await fetch(`${BASE_URL}/api/profile`, {
					method: "GET",
					headers: { Authorization: `Bearer ${token}` },
				});
				const requestData = await requestRes.json();
				if (!requestRes.ok) throw new Error(requestData.message);
				setUser(requestData);
				console.log(requestData);
			} catch (e) {
				notify("error", e.message || "เกิดข้อผิดพลาดในการเชื่อมต่อกับระบบ");
				console.error("Error fetching profile:", e);
			}
		};
		fetchProfile();
	}, [token]);

	const [latestRequest, setLatestRequest] = useState(true);

	useEffect(() => {
		const fetchRequestExam = async () => {
			try {
				const requestRes = await fetch(`${BASE_URL}/api/AllPlagiarismProposal`, {
					method: "POST",
					headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
				});
				const requestData = await requestRes.json();
				if (!requestRes.ok) throw new Error(requestData.message);
				setRequest(requestData);
				if (role == "student") {
					const lastThesisProposalRes = await fetch(`${BASE_URL}/api/allRequestThesisProposal`, {
						method: "POST",
						headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
						body: JSON.stringify({ lastRequest: true }),
					});
					const lastThesisProposalData = await lastThesisProposalRes.json();
					if (!lastThesisProposalRes.ok) throw new Error(lastThesisProposalData.message);

					if (lastThesisProposalData.length == 1) {
						if (requestData[0]?.status < 6) {
							setLatestRequest(true);
						} else {
							setLatestRequest(false);
						}
					} else {
						setLatestRequest(true);
					}
				}
			} catch (e) {
				notify("error", e.message || "เกิดข้อผิดพลาดในการเชื่อมต่อกับระบบ");
				console.error("Error fetching AllPlagiarismProposal:", e);
			}
		};
		fetchRequestExam();
	}, []);

	const handleOpenAdd = async () => {
		try {
			const InfoRes = await fetch(`${BASE_URL}/api/studentInfo`, {
				method: "GET",
				headers: { Authorization: `Bearer ${token}` },
			});
			const InfoData = await InfoRes.json();
			if (!InfoRes.ok) throw new Error(InfoData.message);

			const ThesisProposalRes = await fetch(`${BASE_URL}/api/allRequestThesisProposal`, {
				method: "POST",
				headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
				body: JSON.stringify({ lastRequest: true }),
			});
			const ThesisProposalData = await ThesisProposalRes.json();
			if (!ThesisProposalRes.ok) throw new Error(ThesisProposalData.message);
			form.reset();
			form.setValues({ ...InfoData, ...ThesisProposalData[0] });
			setOpenAdd(true);
		} catch (e) {
			notify("error", e.message || "เกิดข้อผิดพลาดในการเชื่อมต่อกับระบบ");
			console.error("Error fetching studentInfo:", e);
		}
	};

	const handleAdd = async () => {
		try {
			const formData = new FormData();
			Object.entries(form.values).forEach(([key, value]) => {
				if (value instanceof Date) formData.append(key, value.toISOString());
				else if (value instanceof File) formData.append(key, value, value.name);
				else formData.append(key, value ?? "");
			});
			const requestRes = await fetch(`${BASE_URL}/api/addPlagiarismProposal`, {
				method: "POST",
				headers: { Authorization: `Bearer ${token}` },
				body: formData,
			});
			if (!requestRes.ok) throw new Error(requestData.message);
			const requestData = await requestRes.json();
			notify("success", requestData.message);
			setLatestRequest(true);
			setOpenAdd(false);
			setRequest((prev) => [...prev, { ...form.values, ...requestData.data }]);
		} catch (e) {
			notify("error", e.message || "เกิดข้อผิดพลาดในการเชื่อมต่อกับระบบ");
			console.error("Error fetching addPlagiarismProposal:", e);
		}
	};

	const handleApprove = async (item) => {
		if (selected === "noapprove" && comment.trim() === "") {
			setError("กรุณาระบุเหตุผล");
			return;
		}
		try {
			const requestRes = await fetch(`${BASE_URL}/api/approvePlagiarismProposal`, {
				method: "POST",
				headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
				body: JSON.stringify({ plagiarism_report_id: item.plagiarism_report_id, selected: selected, comment: comment }),
			});
			const requestData = await requestRes.json();
			if (!requestRes.ok) throw new Error(requestData.message);
			notify("success", requestData.message);
			setSelected("approve");
			setComment("");
			setOpenApprove(false);
			setRequest((prev) => prev.map((row) => (row.plagiarism_report_id === item.plagiarism_report_id ? { ...row, ...requestData.data } : row)));
		} catch (e) {
			notify("error", e.message || "เกิดข้อผิดพลาดในการเชื่อมต่อกับระบบ");
			console.error("Error fetching approvePlagiarismProposal:", e);
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
		return matchesSearch;
	});

	const rows = filteredData.map((item) => (
		<Table.Tr key={item.plagiarism_report_id}>
			<Table.Td>{item.student_name}</Table.Td>
			<Table.Td>{item.request_thesis_type.replace("ขอสอบ", "")}</Table.Td>
			<Table.Td style={{ textAlign: "center" }}>
				{item.status <= 4 && item.status > 0 && (
					<Stepper active={item.status - 1} iconSize={20} styles={{ separator: { marginLeft: -4, marginRight: -4 }, stepIcon: { fontSize: 10 } }}>
						{[...Array(2)].map((_, i) => (
							<Stepper.Step key={i}>
								<Pill>{item.status_text}</Pill>
							</Stepper.Step>
						))}
					</Stepper>
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
					</>
				)}
			</Table.Td>
			<Table.Td style={{ maxWidth: "150px" }}>
				<Group>
					<Pdfg06 data={item} showType={item.status == 0 ? undefined : (role === "advisor" && item.status <= 1) || (role === "chairpersons" && item.status <= 2) || (role === "officer_registrar" && item.status <= 3) ? "view" : undefined} />
					{((role === "research_advisor" && item.status == 1) || (role === "chairpersons" && item.status == 2) || (role === "officer_registrar" && item.status == 3)) && (
						<Button
							size="xs"
							color="green"
							onClick={() => {
								setSelectedRow(item);
								setOpenApproveState("add");
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
				handleApprove={handleApprove}
				role={role}
				title={`ลงความเห็นรายงานผลการตรวจสอบการคัดลอกผลงานทางวิชาการ`}
			/>
			<ModalAddRequestGraduation opened={openAdd} onClose={() => setOpenAdd(false)} form={form} handleAdd={handleAdd} title={`เพิ่มรายงานผลการตรวจสอบการคัดลอกผลงานทางวิชาการ`} />
			<Text size="1.5rem" fw={900} mb="md">
				รายงานผลตรวจสอบการคัดลอก โครงร่างวิทยานิพนธ์/การค้นคว้าอิสระ
			</Text>
			<Group justify="space-between">
				<Box>
					<Flex align="flex-end" gap="sm">
						{role !== "student" && <TextInput placeholder="ค้นหาชื่่อ รหัส" value={search} onChange={(e) => setSearch(e.target.value)} />}
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
							<Table.Th style={{ minWidth: 100 }}>ชนิด</Table.Th>
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

export default PlagiarismReport;
