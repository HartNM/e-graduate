import { Modal, Box, TextInput, Flex, Button, Space, NumberInput, Grid } from "@mantine/core";

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
					<Box mt="md" mb="sm" fw={500}>
						วุฒิเดิมในระดับปริญญาตรี
					</Box>
					<Grid>
						<Grid.Col span={{ base: 12, md: 6 }}>
							<TextInput label="สาขา" {...AddForm.getInputProps("bachelor_major")} />
						</Grid.Col>
						<Grid.Col span={{ base: 12, md: 6 }}>
							<TextInput label="มหาวิทยาลัย" {...AddForm.getInputProps("bachelor_university")} />
						</Grid.Col>
					</Grid>
					{AddForm.values.education_level === "ปริญญาเอก" && (
						<Box mt="md" mb="sm" fw={500}>
							วุฒิเดิมในระดับปริญญาโท
							<Grid>
								<Grid.Col span={{ base: 12, md: 6 }}>
									<TextInput label="สาขา" {...AddForm.getInputProps("master_major")} />
								</Grid.Col>
								<Grid.Col span={{ base: 12, md: 6 }}>
									<TextInput label="มหาวิทยาลัย" {...AddForm.getInputProps("master_university")} />
								</Grid.Col>
							</Grid>
						</Box>
					)}
				</Grid.Col>

				<Grid.Col span={{ base: 12, md: 6 }}>
					<Box mt="md" mb="sm" fw={500}>
						ที่อยู่สามารถติดต่อได้
					</Box>
					<Grid>
						<Grid.Col span={{ base: 12, md: 4 }}>
							<TextInput label="บ้านเลขที่" {...AddForm.getInputProps("contact_house_no")} />
						</Grid.Col>
						<Grid.Col span={{ base: 12, md: 4 }}>
							<TextInput label="หมู่ที่" {...AddForm.getInputProps("contact_moo")} />
						</Grid.Col>
						<Grid.Col span={{ base: 12, md: 4 }}>
							<TextInput label="ถนน" {...AddForm.getInputProps("contact_road")} />
						</Grid.Col>
						<Grid.Col span={{ base: 12, md: 4 }}>
							<TextInput label="ตำบล" {...AddForm.getInputProps("contact_subdistrict")} />
						</Grid.Col>
						<Grid.Col span={{ base: 12, md: 4 }}>
							<TextInput label="อำเภอ" {...AddForm.getInputProps("contact_district")} />
						</Grid.Col>
						<Grid.Col span={{ base: 12, md: 4 }}>
							<TextInput label="จังหวัด" {...AddForm.getInputProps("contact_province")} />
						</Grid.Col>
						<Grid.Col span={{ base: 12, md: 4 }}>
							<NumberInput label="รหัสไปรษณีย์" hideControls {...AddForm.getInputProps("contact_zipcode")} />
						</Grid.Col>
						<Grid.Col span={{ base: 12, md: 4 }}>
							<NumberInput label="โทรศัพท์" hideControls {...AddForm.getInputProps("contact_phone")} />
						</Grid.Col>
					</Grid>

					<Box mt="md" mb="sm" fw={500}>
						สถานที่ทำงานปัจจุบัน
					</Box>
					<Grid>
						<Grid.Col span={{ base: 12, md: 6 }}>
							<TextInput label="สถานที่ทำงาน" {...AddForm.getInputProps("work_name")} />
						</Grid.Col>
						<Grid.Col span={{ base: 12, md: 3 }}>
							<TextInput label="หมู่ที่" {...AddForm.getInputProps("work_moo")} />
						</Grid.Col>
						<Grid.Col span={{ base: 12, md: 3 }}>
							<TextInput label="ถนน" {...AddForm.getInputProps("work_road")} />
						</Grid.Col>
						<Grid.Col span={{ base: 12, md: 4 }}>
							<TextInput label="ตำบล" {...AddForm.getInputProps("work_subdistrict")} />
						</Grid.Col>
						<Grid.Col span={{ base: 12, md: 4 }}>
							<TextInput label="อำเภอ" {...AddForm.getInputProps("work_district")} />
						</Grid.Col>
						<Grid.Col span={{ base: 12, md: 4 }}>
							<TextInput label="จังหวัด" {...AddForm.getInputProps("work_province")} />
						</Grid.Col>
						<Grid.Col span={{ base: 12, md: 4 }}>
							<NumberInput label="รหัสไปรษณีย์" hideControls {...AddForm.getInputProps("work_zipcode")} />
						</Grid.Col>
						<Grid.Col span={{ base: 12, md: 4 }}>
							<NumberInput label="โทรศัพท์" hideControls {...AddForm.getInputProps("work_phone")} />
						</Grid.Col>
						<Grid.Col span={{ base: 12, md: 12 }}>
							<TextInput label="สังกัดหน่วยงาน" {...AddForm.getInputProps("work_department")} />
						</Grid.Col>
					</Grid>
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
