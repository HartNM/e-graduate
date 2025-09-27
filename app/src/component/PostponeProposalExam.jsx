//คำร้องขอเลื่อนสอบโครงร่างวิทยานิพนธ์/การค้นคว้าอิสระ
import { useState, useEffect } from "react";
import { Box, Text, Table, Button, TextInput, Space, ScrollArea, Group, Select, Flex, Stepper, Pill } from "@mantine/core";
import ModalAddPostponeProposalExam from "../component/Modal/ModalAddPostponeProposalExam";
import ModalApprove from "../component/Modal/ModalApprove";
import ModalInform from "../component/Modal/ModalInform";
import Pdfg07 from "../component/PDF/Pdfg08";
import { useForm } from "@mantine/form";

const PostponeProposalExam = () => {
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
	// Form states
	const [selectedRow, setSelectedRow] = useState(null);
	const [selected, setSelected] = useState("approve");
	const [comment, setComment] = useState("");
	const [error, setError] = useState("");
	// System states
	const [user, setUser] = useState("");
	//student //advisor //chairpersons //officer_registrar //dean
	const [request, setRequest] = useState([]);
	const [search, setSearch] = useState("");

	const formAdd = useForm({
		initialValues: {
			student_name: "",
			student_id: "",
			education_level: "",
			program: "",
			major_name: "",
			faculty_name: "",
			reason: "",
			thesis_exam_date: "",
		},
		validate: {
			reason: (value) => (value.trim() === "" ? "กรุณากรอกเหตุผล" : null),
			thesis_exam_date: (v) => {
				if (!v) return "กรุณาระบุวันที่สอบ";
			},
		},
	});

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

	const [latestRequest, setLatestRequest] = useState(true);
	const [buttonAdd, setButtonAdd] = useState(true);

	useEffect(() => {
		const fetchLatestRequestThesisProposal = async () => {
			try {
				const requestRes = await fetch("http://localhost:8080/api/allRequestThesisProposal", {
					method: "POST",
					headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
					body: JSON.stringify({ lastRequest: true }),
				});
				const requestData = await requestRes.json();
				if (!requestRes.ok) throw new Error(requestData	.message);
				setLatestRequest(requestData[0]);
				if (requestData[0]?.status === "6") {
					setButtonAdd(false);
				} else {
					setButtonAdd(true);
				}
			} catch (e) {
				notify("error", e.message);
				console.error("Error fetching requestExamAll:", e);
			}
		};
		if (role === "student") {
			fetchLatestRequestThesisProposal();
		}

		const fetchRequestExamCancel = async () => {
			try {
				const requestRes = await fetch("http://localhost:8080/api/allPostponeProposalExam", {
					method: "POST",
					headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
				});
				const requestData = await requestRes.json();
				if (!requestRes.ok) throw new Error(requestData.message);
				console.log(requestData);
				setRequest(requestData);
			} catch (e) {
				notify("error", e.message);
				console.error("Error fetching AllRequestExamCancel:", e);
			}
		};
		fetchRequestExamCancel();
	}, []);

	const handleOpenAdd = async () => {
		try {
			const requestRes = await fetch("http://localhost:8080/api/studentInfo", {
				method: "GET",
				headers: { Authorization: `Bearer ${token}` },
			});
			const requestData = await requestRes.json();
			if (!requestRes.ok) throw new Error(requestData.message);
			formAdd.reset();
			formAdd.setValues({ ...latestRequest, ...requestData });
			setOpenAdd(true);
		} catch (e) {
			notify("error", e.message);
			console.error("Error fetching studentInfo:", e);
		}
	};

	const handleAdd = async () => {
		try {
			const requestRes = await fetch("http://localhost:8080/api/addPostponeProposalExam", {
				method: "POST",
				headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
				body: JSON.stringify(formAdd.values),
			});
			const requestData = await requestRes.json();
			if (!requestRes.ok) throw new Error(requestData.message);
			setRequest((prev) => [...prev, { ...formAdd.values, ...requestData.data }]);

			notify("success", requestData.message || "สำเร็จ");
			setButtonAdd(true);
			setOpenAdd(false);
		} catch (e) {
			notify("error", e.message);
			console.error("Error fetching cancelRequestExam:", e);
		}
	};

	const handleApprove = async (item) => {
		if (selected === "noapprove" && comment.trim() === "") {
			setError("กรุณาระบุเหตุผล");
			return;
		}
		try {
			const requestRes = await fetch("http://localhost:8080/api/approvePostponeProposalExam", {
				method: "POST",
				headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
				body: JSON.stringify({
					postpone_proposal_exam_id: item.postpone_proposal_exam_id,
					request_thesis_proposal_id: item.request_thesis_proposal_id,
					thesis_exam_date: item.thesis_exam_date,
					name: user.name,
					selected: selected,
					comment: comment,
				}),
			});
			const requestData = await requestRes.json();
			if (!requestRes.ok) throw new Error(requestData.message);
			notify("success", requestData.message || "สำเร็จ");
			setSelected("approve");
			setComment("");
			setOpenApprove(false);
			setRequest((prev) => prev.map((row) => (row.postpone_proposal_exam_id === item.postpone_proposal_exam_id ? { ...row, ...requestData.data } : row)));
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
		return matchesSearch;
	});

	const rows = filteredData.map((item) => (
		<Table.Tr key={item.postpone_proposal_exam_id}>
			<Table.Td>{item.student_name}</Table.Td>
			<Table.Td style={{ textAlign: "center" }}>
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
				{item.status > 6 && <Pill>{item.status_text}</Pill>}
			</Table.Td>
			<Table.Td style={{ maxWidth: "150px" }}>
				<Group>
					<Pdfg07 data={item} showType={item.status == 5 || item.status == 6 ? undefined : (role === "advisor" && item.status == 7) || (role === "chairpersons" && item.status == 8) ? "view" : undefined} />
					{((role === "advisor" && item.status === "7") || (role === "chairpersons" && item.status === "8")) && (
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
			<ModalAddPostponeProposalExam opened={openAdd} onClose={() => setOpenAdd(false)} form={formAdd} handleAdd={handleAdd} title={`เพิ่มคำร้องขอสอบโครงร่างวิทยานิพนธ์/การค้นคว้าอิสระ`} />
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
				handleCancel={handleApprove}
				role={role}
				title={`ลงความเห็นคำร้องขอเลื่อนสอบโครงร่างวิทยานิพนธ์/การค้นคว้าอิสระ`}
			/>

			<Text size="1.5rem" fw={900} mb="md">
				คำร้องขอเลื่อนสอบโครงร่างวิทยานิพนธ์/การค้นคว้าอิสระ
			</Text>
			<Group justify="space-between">
				<Box>
					<Flex align="flex-end" gap="sm">
						{role !== "student" && <TextInput placeholder="ค้นหาชื่่อ รหัส" value={search} onChange={(e) => setSearch(e.target.value)} />}
					</Flex>
				</Box>
				<Box>
					{role === "student" && (
						<>
							<Button onClick={() => handleOpenAdd()} disabled={buttonAdd} /* disabled={!((latestRequest?.status === "1" || latestRequest?.status === "2" || latestRequest?.status === "3" || latestRequest?.status === "4" || latestRequest?.status === "5") && latestRequest?.exam_results === null)} */>
								เพิ่มคำร้อง
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
							<Table.Th>ชื่อ</Table.Th>
							<Table.Th>สถานะ</Table.Th>
							<Table.Th>การดำเนินการ</Table.Th>
						</Table.Tr>
					</Table.Thead>
					<Table.Tbody>{rows}</Table.Tbody>
				</Table>
			</ScrollArea>
		</Box>
	);
};

export default PostponeProposalExam;
