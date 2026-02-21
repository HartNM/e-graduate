import { useState, useEffect } from "react";
import { Modal, Box, TextInput, Flex, Button, Space, Checkbox, Text } from "@mantine/core";

const ModalAddCancel = ({ opened, onClose, selectedRow, reason, setReason, error, handleAddCancel }) => {
	const [isConfirmed, setIsConfirmed] = useState(false);
	const [submitting, setSubmitting] = useState(false);
	useEffect(() => {
		if (opened) {
			setIsConfirmed(false);
			setSubmitting(false);
		}
	}, [opened]);

	const handleSave = async () => {
		setSubmitting(true);
		try {
			await handleAddCancel(selectedRow);
		} finally {
			setSubmitting(false);
		}
	};

	return (
		<Modal opened={opened} onClose={onClose} title={`คำร้องขอยกเลิกสอบ${selectedRow?.education_level === "ปริญญาโท" ? "ประมวลความรู้" : "วัดคุณสมบัติ"}`} centered>
			{selectedRow && (
				<Box>
					<TextInput label="ชื่อ" disabled value={selectedRow.student_name} />
					<TextInput label="รหัสนักศึกษา" disabled value={selectedRow.student_id} />
					<TextInput label="ระดับ" disabled value={selectedRow.education_level} />
					<TextInput label="หลักสูตร" disabled value={selectedRow.program} />
					<TextInput label="สาขา" disabled value={selectedRow.major_name} />
					<TextInput label="คณะ" disabled value={selectedRow.faculty_name} />
					<TextInput label="เนื่องจาก" required maxLength={90} description={`${reason?.length || 0}/90 ตัวอักษร`} value={reason} onChange={(e) => setReason(e.currentTarget.value)} error={error} />

					<Space h="lg" />

					<Text c="red" size="sm" mb="xs">
						* กรุณาตรวจสอบข้อมูลก่อนบันทึก
					</Text>

					<Checkbox label="กรณีที่ขอยกเลิกคำร้องจะไม่สามารถขอเงินคืนได้ทุกกรณี" checked={isConfirmed} onChange={(event) => setIsConfirmed(event.currentTarget.checked)} color="red" style={{ cursor: "pointer" }} />

					<Space h="lg" />

					<Flex justify="flex-end">
						<Button color="green" onClick={handleSave} disabled={!isConfirmed || submitting} loading={submitting}>
							บันทึก
						</Button>
					</Flex>
				</Box>
			)}
		</Modal>
	);
};

export default ModalAddCancel;
