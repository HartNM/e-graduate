import { Modal, Box, TextInput, Textarea, Flex, Button } from "@mantine/core";

const ModalAddCancel = (props) => (
	<Modal opened={props.opened} onClose={props.onClose} title="ยกเลิกคำร้อง" centered>
		{props.selectedRow && (
			<Box>
				<TextInput label="ชื่อ" disabled value={props.selectedRow.student_name} />
				<TextInput label="รหัสประจำตัว" disabled value={props.selectedRow.student_id} />
				<TextInput label="ระดับ" disabled value={props.selectedRow.education_level} />
				<TextInput label="หลักสูตร" disabled value={props.selectedRow.program} />
				<TextInput label="สาขา" disabled value={props.selectedRow.major_name} />
				<TextInput label="คณะ" disabled value={props.selectedRow.faculty_name} />
				<TextInput label="คำร้อง" disabled value={props.selectedRow.request_type} />
				<Textarea label="เนื่องจาก" required autosize minRows={2} value={props.reason} onChange={(e) => props.setReason(e.currentTarget.value)} error={props.error} />
				<Flex justify="flex-end">
					<Button color="green" onClick={() => props.handleAddCancel(props.selectedRow)}>
						บันทึก
					</Button>
				</Flex>
			</Box>
		)}
	</Modal>
);

export default ModalAddCancel;
