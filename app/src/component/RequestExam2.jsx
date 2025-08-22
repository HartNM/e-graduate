// RequestExam.jsx (refactor ตัวอย่าง)
import { useEffect, useMemo, useState, useCallback } from "react";
import { Box, Text, Table, Button, TextInput, Space, ScrollArea, Group, Select } from "@mantine/core";
import { useSearchParams } from "react-router-dom";

// Modals (ใช้ของเดิม)
import ModalApprove from "../component/Modal/ModalApprove";
import ModalInfo from "../component/Modal/ModalInfo";
import ModalAddCancel from "../component/Modal/ModalAddCancel";
import ModalAdd from "../component/Modal/ModalAdd";
import ModalCheck from "../component/Modal/ModalCheck";
import ModalPay from "../component/Modal/ModalPay";
import ModalInform from "../component/Modal/ModalInform";
import Pdfg01 from "../component/PDF/Pdfg01";

// ---------- constants & utils ----------
const API_BASE = "";
const MSG = {
	NETWORK_ERROR: "เกิดข้อผิดพลาดในการเชื่อมต่อกับระบบ",
};

const api = async (path, { method = "GET", token, body } = {}) => {
	const res = await fetch(`http://localhost:8080/api${path}`, {
		method,
		headers: {
			...(body ? { "Content-Type": "application/json" } : {}),
			...(token ? { Authorization: `Bearer ${token}` } : {}),
		},
		body: body ? JSON.stringify(body) : undefined,
	});
	// พยายามอ่าน JSON เสมอเพื่อดึง message ออกมา
	let data;
	try {
		data = await res.json();
	} catch {
		data = {};
	}
	if (!res.ok) throw { status: res.status, ...data };
	return data;
};

// รวมการแจ้งเตือน
const useNotify = () => {
	const [inform, setInform] = useState({ open: false, type: "", message: "" });
	const notify = (type, message) => setInform({ open: true, type, message });
	const close = () => setInform((s) => ({ ...s, open: false }));
	return { inform, notify, closeInform: close };
};

// รวมสถานะเปิดปิดโมดัลแบบ key-based
const useModals = () => {
	const [modals, setModals] = useState({}); // { approve:{open:true,payload:{}}, ... }
	const open = (name, payload) => setModals((m) => ({ ...m, [name]: { open: true, payload } }));
	const close = (name) => setModals((m) => ({ ...m, [name]: { ...m[name], open: false } }));
	const get = (name) => modals[name] || { open: false, payload: null };
	return { open, close, get };
};

// normalize สถานะเป็นตัวเลข
const toNum = (v) => (typeof v === "string" ? Number(v) : v);

// สิทธิ์/การแสดงผลตาม role
const roleCan = {
	student: {
		canPay: (s) => s === 4,
		canPrintReceipt: (s) => s === 5,
		canAddRequest: (list) => list.every((it) => toNum(it.status) === 6) || list.some((it) => it.exam_results === false),
	},
	advisor: { canApprove: (s) => s === 1 },
	chairpersons: { canApprove: (s) => s === 2 },
	officer_registrar: { canApprove: (s) => s === 3 },
	dean: { canApprove: (s) => false }, // เติมตามจริง
};

// ---------- sub components ----------
const StatusCell = ({ item }) => {
	const s = toNum(item.status);
	if (s <= 4) {
		// ใช้ข้อความเดียว ไม่ต้องซ้ำหลาย <Stepper.Step>
		return <Text ta="center">{item.status_text}</Text>;
	}
	if (s === 5) {
		return (
			<Text c="green" ta="center" fw={600}>
				{item.status_text}
			</Text>
		);
	}
	if (s === 6) {
		const who = !item.advisor_approvals ? "อาจารย์ที่ปรึกษา" : !item.chairpersons_approvals ? "ประธานหลักสูตร" : !item.registrar_approvals ? "เจ้าหน้าที่ทะเบียน" : "";
		return (
			<Box ta="center">
				<Text c="red" fw={600}>
					{item.status_text}
				</Text>
				{who && <Text size="xs">{who}</Text>}
			</Box>
		);
	}
	return <Text ta="center">{item.status_text}</Text>;
};

const ActionButtons = ({ item, user, onOpen }) => {
	const s = toNum(item.status);
	const r = user?.role;

	if (r === "student") {
		return (
			<Group>
				<Pdfg01 data={item} />
				{roleCan.student.canPay(s) && (
					<Button size="xs" color="green" onClick={() => onOpen("pay", item)}>
						ชำระค่าธรรมเนียม
					</Button>
				)}
				{roleCan.student.canPrintReceipt(s) && (
					<Button size="xs" color="green">
						พิมพ์ใบเสร็จ
					</Button>
				)}
			</Group>
		);
	}

	// roles อื่น ๆ
	const canApprove = (r === "advisor" && s > 1) || (r === "chairpersons" && s > 2) || (r === "officer_registrar" && s > 3);

	return (
		<Group>
			<Pdfg01 data={item} {...(canApprove ? {} : { showType: "view" })} />
			{roleCan[r]?.canApprove?.(s) && (
				<Button size="xs" color="green" onClick={() => onOpen("approve", item)}>
					{r === "officer_registrar" ? "ตรวจสอบ" : "ลงความเห็น"}
				</Button>
			)}
		</Group>
	);
};

// ---------- main ----------
export default function RequestList() {
	const token = localStorage.getItem("token");
	const [user, setUser] = useState(null);
	const [list, setList] = useState([]);
	const [search, setSearch] = useState("");
	const [selectedType, setSelectedType] = useState("");
	const [selected, setSelected] = useState("approve");
	const [comment, setComment] = useState("");
	const [reason, setReason] = useState("");
	const [error, setError] = useState("");

	const [params] = useSearchParams();
	const typeFromUrl = params.get("type");

	const { inform, notify, closeInform } = useNotify();
	const modals = useModals();

	// ดึงโปรไฟล์
	useEffect(() => {
		(async () => {
			try {
				const profile = await api("/profile", { token });
				setUser(profile);
			} catch {
				notify("error", MSG.NETWORK_ERROR);
			}
		})();
	}, [token]); // ดึงครั้งเดียว

	// ดึงรายการ ตาม user
	const reload = useCallback(async () => {
		if (!user) return;
		try {
			const data = await api("/requestExamAll", {
				method: "POST",
				token,
				body: { role: user.role, id: user.id },
			});
			setList(data);
		} catch {
			notify("error", MSG.NETWORK_ERROR);
		}
	}, [user, token, notify]);

	useEffect(() => {
		reload();
	}, [reload]);

	// กรองข้อมูล (รวม selectedType + type จาก URL + search)
	const filtered = useMemo(() => {
		return (list || []).filter((p) => {
			const matchesSearch = [p.student_name, p.student_id].join(" ").toLowerCase().includes(search.toLowerCase());
			const matchesTypeUrl = typeFromUrl ? p.request_type === typeFromUrl : true;
			const matchesTypeSelect = selectedType ? p.request_type === selectedType : true;
			return matchesSearch && matchesTypeUrl && matchesTypeSelect;
		});
	}, [list, search, typeFromUrl, selectedType]);

	// ---- handlers (สั้นด้วย api() + notify()) ----
	const handleOpenAdd = async () => {
		try {
			const data = await api("/studentInfo", { token });
			modals.open("add", data);
		} catch {
			notify("error", MSG.NETWORK_ERROR);
		}
	};

	const handleAdd = async (formData) => {
		try {
			const res = await api("/addRequestExam", { method: "POST", token, body: formData });
			notify("success", res.message || "สำเร็จ");
			modals.close("add");
			reload();
		} catch (e) {
			notify("error", e.message || MSG.NETWORK_ERROR);
		}
	};

	const handleApprove = async (item) => {
		if (selected === "noapprove" && !comment.trim()) {
			setError("กรุณาระบุเหตุผล");
			return;
		}
		try {
			const res = await api("/approveRequestExam", {
				method: "POST",
				token,
				body: { request_exam_id: item.request_exam_id, name: user.name, role: user.role, selected, comment },
			});
			notify("success", res.message || "สำเร็จ");
			setSelected("approve");
			setComment("");
			modals.close("approve");
			reload();
		} catch (e) {
			notify("error", e.message || MSG.NETWORK_ERROR);
		}
	};

	const handlePay = async (item) => {
		try {
			const res = await api("/payRequestExam", {
				method: "POST",
				token,
				body: { request_exam_id: item.request_exam_id, receipt_vol_No: "10/54" },
			});
			notify("success", res.message || "สำเร็จ");
			modals.close("pay");
			reload();
		} catch (e) {
			notify("error", e.message || MSG.NETWORK_ERROR);
		}
	};

	const handleAddCancel = async (item) => {
		if (!reason.trim()) {
			setError("กรุณากรอกเหตุผล");
			return;
		}
		try {
			const res = await api("/cancelRequestExam", {
				method: "POST",
				token,
				body: { request_exam_id: item.request_exam_id, reason },
			});
			notify("success", res.message || "สำเร็จ");
			setReason("");
			modals.close("cancelAdd");
			reload();
		} catch (e) {
			notify("error", e.message || MSG.NETWORK_ERROR);
		}
	};

	const handleCancel = async (item) => {
		if (selected === "noapprove" && !comment.trim()) {
			setError("กรุณาระบุเหตุผล");
			return;
		}
		try {
			const res = await api("/cancelApproveRequestExam", {
				method: "POST",
				token,
				body: {
					request_cancel_exam_id: item.cancel_list?.[0]?.request_cancel_exam_id,
					request_exam_id: item.request_exam_id,
					name: user.name,
					role: user.role,
					selected,
					comment_cancel: comment,
				},
			});
			notify("success", res.message || "สำเร็จ");
			setSelected("approve");
			setComment("");
			modals.close("approve");
			reload();
		} catch (e) {
			notify("error", e.message || MSG.NETWORK_ERROR);
		}
	};

	// ---- rows ----
	const rows = useMemo(
		() =>
			filtered.map((item) => (
				<Table.Tr key={item.request_exam_id}>
					<Table.Td>{item.student_name}</Table.Td>
					{["advisor", "officer_registrar", "chairpersons", "dean"].includes(user?.role) && <Table.Td>{item.request_type}</Table.Td>}
					<Table.Td>
						<StatusCell item={item} />
					</Table.Td>
					<Table.Td>
						<ActionButtons item={item} user={user} onOpen={(name, payload) => modals.open(name, payload)} />
					</Table.Td>
					{filtered.some((x) => x.exam_results !== null) && (
						<Table.Td ta="center">
							{item.exam_results === true && <Text c="green">ผ่าน</Text>}
							{item.exam_results === false && <Text c="red">ไม่ผ่าน</Text>}
						</Table.Td>
					)}
				</Table.Tr>
			)),
		[filtered, user]
	);

	// ---- UI ----
	return (
		<Box>
			<ModalInform opened={inform.open} onClose={closeInform} message={inform.message} type={inform.type} />

			{/* ดึง payload จาก modals.get("...").payload */}
			<ModalApprove
				opened={modals.get("approve").open}
				onClose={() => modals.close("approve")}
				selectedRow={modals.get("approve").payload}
				selected={selected}
				setSelected={setSelected}
				comment={comment}
				setComment={setComment}
				error={error}
				openApproveState="add"
				handleApprove={handleApprove}
				handleCancel={handleCancel}
				role={user?.role}
			/>
			<ModalInfo opened={modals.get("info").open} onClose={() => modals.close("info")} selectedRow={modals.get("info").payload} />
			<ModalAddCancel opened={modals.get("cancelAdd").open} onClose={() => modals.close("cancelAdd")} selectedRow={modals.get("cancelAdd").payload} reason={reason} setReason={setReason} error={error} handleAddCancel={handleAddCancel} />
			<ModalAdd opened={modals.get("add").open} onClose={() => modals.close("add")} formData={modals.get("add").payload || {}} handleAdd={handleAdd} />
			<ModalCheck opened={modals.get("check").open} onClose={() => modals.close("check")} selected={selected} setSelected={setSelected} comment={comment} setComment={setComment} error={error} />
			<ModalPay opened={modals.get("pay").open} onClose={() => modals.close("pay")} selectedRow={modals.get("pay").payload} handlePay={handlePay} />

			<Text size="1.5rem" fw={900} mb="md">
				คำร้องขอสอบ{user?.education_level}
			</Text>

			<Group justify="space-between">
				<Group align="flex-end" gap="sm">
					<TextInput placeholder="ค้นหาชื่่อ รหัส" value={search} onChange={(e) => setSearch(e.target.value)} />
					{["chairpersons", "dean"].includes(user?.role) && <Select placeholder="ชนิดคำขอ" data={["ขอสอบประมวลความรู้", "ขอสอบวัดคุณสมบัติ"]} value={selectedType} onChange={setSelectedType} />}
				</Group>

				{user?.role === "student" && (
					<Button onClick={handleOpenAdd} disabled={!roleCan.student.canAddRequest(list)}>
						เพิ่มคำร้อง
					</Button>
				)}
			</Group>

			<Space h="md" />
			<ScrollArea type="scroll" offsetScrollbars style={{ borderRadius: 8, border: "1px solid #e0e0e0" }}>
				<Table horizontalSpacing="sm" verticalSpacing="sm" highlightOnHover>
					<Table.Thead>
						<Table.Tr>
							<Table.Th style={{ minWidth: 100 }}>ชื่อ</Table.Th>
							{["advisor", "officer_registrar", "chairpersons", "dean"].includes(user?.role) && <Table.Th style={{ minWidth: 100 }}>เรื่อง</Table.Th>}
							<Table.Th style={{ minWidth: 110 }}>สถานะ</Table.Th>
							<Table.Th style={{ minWidth: 100 }}>การดำเนินการ</Table.Th>
							{filtered.some((it) => it.exam_results !== null) && <Table.Th style={{ minWidth: 110 }}>ผลสอบ</Table.Th>}
						</Table.Tr>
					</Table.Thead>
					<Table.Tbody>{rows}</Table.Tbody>
				</Table>
			</ScrollArea>
		</Box>
	);
}
