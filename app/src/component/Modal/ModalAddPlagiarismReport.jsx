import { Modal, Box, TextInput, Flex, Button, Space, NumberInput, Grid, FileInput } from "@mantine/core";
import { DatePickerInput } from "@mantine/dates";

const ModalAdd = ({ opened, onClose, title, form, handleAdd }) => {
	const examTypeMap = {
		ขอสอบโครงร่างวิทยานิพนธ์: "โครงร่าง",
		ขอสอบโครงร่างการค้นคว้าอิสระ: "โครงร่าง",
		ขอสอบวิทยานิพนธ์: "",
		ขอสอบการค้นคว้าอิสระ: "",
	};
	return (
		<Modal opened={opened} onClose={onClose} title={title} centered size="800">
			<form onSubmit={form.onSubmit(handleAdd)}>
				<Grid type="container" breakpoints={{ md: "660px" }}>
					<Grid.Col span={{ base: 12, md: 6 }}>
						<TextInput label="ชื่อ-นามสกุล" disabled {...form.getInputProps("student_name")} />
						<TextInput label="รหัสประจำตัว" disabled {...form.getInputProps("student_id")} />
						<TextInput label="ระดับการศึกษา" disabled {...form.getInputProps("education_level")} />
						<TextInput label="หลักสูตร" disabled {...form.getInputProps("program")} />
						<TextInput label="สาขาวิชา" disabled {...form.getInputProps("major_name")} />
						<TextInput label="คณะ" disabled {...form.getInputProps("faculty_name")} />
						<TextInput label="ขอสอบ" disabled {...form.getInputProps("request_type")} />
						<TextInput label="อาจารย์ที่ปรึกษา" disabled {...form.getInputProps("thesis_advisor_name")} />
					</Grid.Col>
					<Grid.Col span={{ base: 12, md: 6 }}>
						<TextInput label="ชื่องานวิจัย" {...form.getInputProps("research_name")} />
						<NumberInput label="บทที่ 1 มีความคล้ายคลึง กับผลงานผู้อื่น ร้อยละ" min={0} max={100} suffix="%" {...form.getInputProps("chapter_1")} />
						<NumberInput label="บทที่ 2 มีความคล้ายคลึง กับผลงานผู้อื่น ร้อยละ" min={0} max={100} suffix="%" {...form.getInputProps("chapter_2")} />
						<NumberInput label="บทที่ 3 มีความคล้ายคลึง กับผลงานผู้อื่น ร้อยละ" min={0} max={100} suffix="%" {...form.getInputProps("chapter_3")} />
						{examTypeMap[form.values.request_type] === "" && (
							<>
								<NumberInput label="บทที่ 4 มีความคล้ายคลึง กับผลงานผู้อื่น ร้อยละ" min={0} max={100} suffix="%" {...form.getInputProps("chapter_4")} />
								<NumberInput label="บทที่ 5 มีความคล้ายคลึง กับผลงานผู้อื่น ร้อยละ" min={0} max={100} suffix="%" {...form.getInputProps("chapter_5")} />
							</>
						)}
						<DatePickerInput label="ตรวจสอบเมื่อวันที่" placeholder="เลื่อกวัน" firstDayOfWeek={0} valueFormat="DD MMMM YYYY" withAsterisk {...form.getInputProps("inspection_date")} />
						<FileInput accept="application/pdf" placeholder="Upload PDF files" label="ผลการตรวจสอบการคัดลอกผลงานทางวิชาการ" {...form.getInputProps("plagiarism_file")} />
						<FileInput accept="application/pdf" placeholder="Upload PDF files" label={`ไฟล์${form.values.request_type?.replace("ขอสอบ", "")} ฉบับสมบูรณ์มาด้วย`} {...form.getInputProps("full_report_file")} />
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
};

export default ModalAdd;
