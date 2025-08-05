import { Modal, Box, TextInput, Flex, Button, Space } from "@mantine/core";

const ModalAdd = (props) => (
	<Modal opened={props.opened} onClose={props.onClose} title={`เพิ่มคำร้องขอสอบ${props.formData.request_type}`} centered>
		<Box>
			<TextInput label="ชื่อ-นามสกุล" disabled value={props.formData.student_name} />
			<TextInput label="รหัสประจำตัว" disabled value={props.formData.student_id} />
			<TextInput label="ระดับการศึกษา" disabled value={props.formData.education_level} />
			<TextInput label="หลักสูตร" disabled value={props.formData.program} />
			<TextInput label="สาขาวิชา" disabled value={props.formData.major_name} />
			<TextInput label="คณะ" disabled value={props.formData.faculty_name} />
			<TextInput label="คำร้อง" disabled value={props.formData.request_type} />
			<Space h="lg" />
			<Flex justify="flex-end">
				<Button color="green" onClick={() => props.handleAdd()}>
					บันทึก
				</Button>
			</Flex>
		</Box>
	</Modal>
);

export default ModalAdd;
