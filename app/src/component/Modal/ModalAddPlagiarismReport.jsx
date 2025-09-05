import { Modal, Box, TextInput, Flex, Button, Space, NumberInput, Grid } from "@mantine/core";
import { DatePickerInput } from "@mantine/dates";

const ModalAdd = ({ opened, onClose, title, AddForm, handleAdd }) => (
	<Modal opened={opened} onClose={onClose} title={title} centered size="800">
		<form onSubmit={AddForm.onSubmit(handleAdd)}>
			<Grid type="container" breakpoints={{ md: "660px" }}>
				<Grid.Col span={{ base: 12, md: 6 }}>
					<TextInput label="ชื่อ-นามสกุล" disabled {...AddForm.getInputProps("student_name")} />
					<TextInput label="รหัสประจำตัว" disabled {...AddForm.getInputProps("student_id")} />
					<TextInput label="ระดับการศึกษา" disabled {...AddForm.getInputProps("education_level")} />
					<TextInput label="หลักสูตร" disabled {...AddForm.getInputProps("program")} />
					<TextInput label="สาขาวิชา" disabled {...AddForm.getInputProps("major_name")} />
					<TextInput label="คณะ" disabled {...AddForm.getInputProps("faculty_name")} />
				</Grid.Col>
				<Grid.Col span={{ base: 12, md: 6 }}>
					<NumberInput label="บทที่ 1 มีความคล้ายคลึง กับผลงานผู้อื่น ร้อยละ" min={0} max={100} suffix="%" {...AddForm.getInputProps("chapter_1")} />
					<NumberInput label="บทที่ 2 มีความคล้ายคลึง กับผลงานผู้อื่น ร้อยละ" min={0} max={100} suffix="%" {...AddForm.getInputProps("chapter_2")} />
					<NumberInput label="บทที่ 3 มีความคล้ายคลึง กับผลงานผู้อื่น ร้อยละ" min={0} max={100} suffix="%" {...AddForm.getInputProps("chapter_3")} />
					<NumberInput label="บทที่ 4 มีความคล้ายคลึง กับผลงานผู้อื่น ร้อยละ" min={0} max={100} suffix="%" {...AddForm.getInputProps("chapter_4")} />
					<NumberInput label="บทที่ 5 มีความคล้ายคลึง กับผลงานผู้อื่น ร้อยละ" min={0} max={100} suffix="%" {...AddForm.getInputProps("chapter_5")} />
					<DatePickerInput label="ตรวจสอบเมื่อวันที่" placeholder="เลื่อกวัน" firstDayOfWeek={0} valueFormat="DD MMMM YYYY" withAsterisk {...AddForm.getInputProps("inspection_date")} />
				</Grid.Col>
			</Grid>
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
