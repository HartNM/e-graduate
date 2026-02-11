import { Modal, Box, TextInput, Flex, Button, Space } from "@mantine/core";

const ModalAdd = ({ opened, onClose, title, form, handleAdd }) => (
	<Modal opened={opened} onClose={onClose} title={title} centered>
		<Box>
			<TextInput label="ชื่อ-นามสกุล" disabled value={form.student_name} />
			<TextInput label="รหัสประจำตัว" disabled value={form.student_id} />
			<TextInput label="ระดับการศึกษา" disabled value={form.education_level} />
			<TextInput label="หลักสูตร" disabled value={form.program} />
			<TextInput label="สาขาวิชา" disabled value={form.major_name} />
			<TextInput label="คณะ" disabled value={form.faculty_name} />
			<Space h="lg" />
			<Flex justify="flex-end">
				<Button color="green" onClick={() => handleAdd()}>
					บันทึก
				</Button>
			</Flex>
		</Box>
	</Modal>
);

export default ModalAdd;
