import { useState } from "react";
import { Modal, Box, TextInput, Textarea, Flex, Button, Space, Checkbox, Text } from "@mantine/core";

const ModalAddCancel = (props) => {
	const [isConfirmed, setIsConfirmed] = useState(false);

	return (
		<Modal opened={props.opened} onClose={props.onClose} title={`คำร้องขอยกเลิกสอบ${props.selectedRow?.education_level === "ปริญญาโท" ? "ประมวลความรู้" : "วัดคุณสมบัติ"}`} centered>
			{props.selectedRow && (
				<Box>
					<TextInput label="ชื่อ" disabled value={props.selectedRow.student_name} />
					<TextInput label="รหัสนักศึกษา" disabled value={props.selectedRow.student_id} />
					<TextInput label="ระดับ" disabled value={props.selectedRow.education_level} />
					<TextInput label="หลักสูตร" disabled value={props.selectedRow.program} />
					<TextInput label="สาขา" disabled value={props.selectedRow.major_name} />
					<TextInput label="คณะ" disabled value={props.selectedRow.faculty_name} />
					<TextInput
						label="เนื่องจาก"
						required
						maxLength={90} // จำกัด 80 ตัวอักษร
						description={`${props.reason?.length || 0}/90 ตัวอักษร`}
						value={props.reason}
						onChange={(e) => props.setReason(e.currentTarget.value)}
						error={props.error}
					/>

					<Space h="lg" />

					<Text c="red" size="sm" mb="xs">
						* กรุณาตรวจสอบข้อมูลก่อนบันทึก
					</Text>

					<Checkbox label="กรณีที่ขอยกเลิกคำร้องจะไม่สามารถขอเงินคืนได้ทุกกรณี" checked={isConfirmed} onChange={(event) => setIsConfirmed(event.currentTarget.checked)} color="red" style={{ cursor: "pointer" }} />

					<Space h="lg" />

					<Flex justify="flex-end">
						<Button color="green" onClick={() => props.handleAddCancel(props.selectedRow)} disabled={!isConfirmed}>
							บันทึก
						</Button>
					</Flex>
				</Box>
			)}
		</Modal>
	);
};

export default ModalAddCancel;
