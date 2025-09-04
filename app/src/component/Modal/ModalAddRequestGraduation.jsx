import { Modal, Box, TextInput, Flex, Button, Space, NumberInput } from "@mantine/core";

const ModalAdd = ({ opened, onClose, title, AddForm, handleAdd }) => (
	<Modal opened={opened} onClose={onClose} title={title} centered>
		<form onSubmit={AddForm.onSubmit(handleAdd)}>
			<TextInput label="ชื่อ-นามสกุล" disabled {...AddForm.getInputProps("student_name")} />
			<TextInput label="รหัสประจำตัว" disabled {...AddForm.getInputProps("student_id")} />
			<TextInput label="ระดับการศึกษา" disabled {...AddForm.getInputProps("education_level")} />
			<TextInput label="หลักสูตร" disabled {...AddForm.getInputProps("program")} />
			<TextInput label="สาขาวิชา" disabled {...AddForm.getInputProps("major_name")} />
			<TextInput label="คณะ" disabled {...AddForm.getInputProps("faculty_name")} />
			<NumberInput label="บทที่ 1 มีความคล้ายคลึง กับผลงานผู้อื่น ร้อยละ" min={0} max={100} suffix="%" {...AddForm.getInputProps("Chapter_1")} />
			<NumberInput label="บทที่ 2 มีความคล้ายคลึง กับผลงานผู้อื่น ร้อยละ" min={0} max={100} suffix="%" {...AddForm.getInputProps("Chapter_2")} />
			<NumberInput label="บทที่ 3 มีความคล้ายคลึง กับผลงานผู้อื่น ร้อยละ" min={0} max={100} suffix="%" {...AddForm.getInputProps("Chapter_3")} />
			<NumberInput label="บทที่ 4 มีความคล้ายคลึง กับผลงานผู้อื่น ร้อยละ" min={0} max={100} suffix="%" {...AddForm.getInputProps("Chapter_4")} />
			<NumberInput label="บทที่ 5 มีความคล้ายคลึง กับผลงานผู้อื่น ร้อยละ" min={0} max={100} suffix="%" {...AddForm.getInputProps("Chapter_5")} />

			<Space h="lg" />
			<Flex justify="flex-end">
				<Button type="submit" color="green">
					บันทึก
				</Button>
			</Flex>
		</form>
	</Modal>
);

export default ModalAdd;
