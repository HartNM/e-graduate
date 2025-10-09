import { Modal, TextInput, Flex, Button, Space, Textarea } from "@mantine/core";
import { DatePickerInput } from "@mantine/dates";

const ModalAddRequestThesisProposal = ({ opened, onClose, title, form, handleAdd }) => {
	
	return (
		<Modal opened={opened} onClose={onClose} title={title} centered>
			<form onSubmit={form.onSubmit(handleAdd)}>
				<TextInput label="ชื่อ-นามสกุล" disabled {...form.getInputProps("student_name")} />
				<TextInput label="รหัสประจำตัว" disabled {...form.getInputProps("student_id")} />
				<TextInput label="ระดับการศึกษา" disabled {...form.getInputProps("education_level")} />
				<TextInput label="หลักสูตร" disabled {...form.getInputProps("program")} />
				<TextInput label="สาขาวิชา" disabled {...form.getInputProps("major_name")} />
				<TextInput label="คณะ" disabled {...form.getInputProps("faculty_name")} />
				<Textarea label="เนื่องจาก" minRows={2} {...form.getInputProps("reason")} />
				<DatePickerInput label="เลือกวันที่สอบใหม่" placeholder="เลื่อกวัน" firstDayOfWeek={0} valueFormat="DD MMMM YYYY" minDate={form.values.thesis_exam_date} withAsterisk {...form.getInputProps("thesis_exam_date")} />
				<Space h="lg" />
				<Flex justify="flex-end">
					<Button type="submit" color="green">
						บันทึก
					</Button>
				</Flex>
			</form>
		</Modal>
	);
};

export default ModalAddRequestThesisProposal;
