import { Modal, Box, TextInput, Flex, Button, Space, NumberInput, Grid } from "@mantine/core";

const ModalAdd = ({ opened, onClose, title, form, handleAdd }) => (
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
					<Box mt="md" mb="sm" fw={500}>
						วุฒิเดิมในระดับปริญญาตรี
					</Box>
					<Grid breakpoints={{ md: "660px" }}>
						<Grid.Col span={{ base: 12, md: 6 }}>
							<TextInput label="สาขา" {...form.getInputProps("bachelor_major")} />
						</Grid.Col>
						<Grid.Col span={{ base: 12, md: 6 }}>
							<TextInput label="มหาวิทยาลัย" {...form.getInputProps("bachelor_university")} />
						</Grid.Col>
					</Grid>
					{form.values.education_level === "ปริญญาเอก" && (
						<Box mt="md" mb="sm" fw={500}>
							วุฒิเดิมในระดับปริญญาโท
							<Grid breakpoints={{ md: "660px" }}>
								<Grid.Col span={{ base: 12, md: 6 }}>
									<TextInput label="สาขา" {...form.getInputProps("master_major")} />
								</Grid.Col>
								<Grid.Col span={{ base: 12, md: 6 }}>
									<TextInput label="มหาวิทยาลัย" {...form.getInputProps("master_university")} />
								</Grid.Col>
							</Grid>
						</Box>
					)}
				</Grid.Col>

				<Grid.Col span={{ base: 12, md: 6 }}>
					<Box mt="md" mb="sm" fw={500}>
						ที่อยู่สามารถติดต่อได้
					</Box>
					<Grid breakpoints={{ md: "660px" }}>
						<Grid.Col span={{ base: 12, md: 4 }}>
							<TextInput label="บ้านเลขที่" {...form.getInputProps("contact_house_no")} />
						</Grid.Col>
						<Grid.Col span={{ base: 12, md: 4 }}>
							<TextInput label="หมู่ที่" {...form.getInputProps("contact_moo")} />
						</Grid.Col>
						<Grid.Col span={{ base: 12, md: 4 }}>
							<TextInput label="ถนน" {...form.getInputProps("contact_road")} />
						</Grid.Col>
						<Grid.Col span={{ base: 12, md: 4 }}>
							<TextInput label="ตำบล" {...form.getInputProps("contact_subdistrict")} />
						</Grid.Col>
						<Grid.Col span={{ base: 12, md: 4 }}>
							<TextInput label="อำเภอ" {...form.getInputProps("contact_district")} />
						</Grid.Col>
						<Grid.Col span={{ base: 12, md: 4 }}>
							<TextInput label="จังหวัด" {...form.getInputProps("contact_province")} />
						</Grid.Col>
						<Grid.Col span={{ base: 12, md: 4 }}>
							<TextInput label="รหัสไปรษณีย์" {...form.getInputProps("contact_zipcode")} onInput={(e) => (e.target.value = e.target.value.replace(/[^0-9]/g, ""))} />
						</Grid.Col>
						<Grid.Col span={{ base: 12, md: 4 }}>
							<TextInput label="โทรศัพท์" {...form.getInputProps("contact_phone")} onInput={(e) => (e.target.value = e.target.value.replace(/[^0-9]/g, ""))} />
						</Grid.Col>
					</Grid>

					<Box mt="md" mb="sm" fw={500}>
						สถานที่ทำงานปัจจุบัน
					</Box>
					<Grid breakpoints={{ md: "660px" }}>
						<Grid.Col span={{ base: 12, md: 6 }}>
							<TextInput label="สถานที่ทำงาน" {...form.getInputProps("work_name")} />
						</Grid.Col>
						<Grid.Col span={{ base: 12, md: 3 }}>
							<TextInput label="หมู่ที่" {...form.getInputProps("work_moo")} />
						</Grid.Col>
						<Grid.Col span={{ base: 12, md: 3 }}>
							<TextInput label="ถนน" {...form.getInputProps("work_road")} />
						</Grid.Col>
						<Grid.Col span={{ base: 12, md: 4 }}>
							<TextInput label="ตำบล" {...form.getInputProps("work_subdistrict")} />
						</Grid.Col>
						<Grid.Col span={{ base: 12, md: 4 }}>
							<TextInput label="อำเภอ" {...form.getInputProps("work_district")} />
						</Grid.Col>
						<Grid.Col span={{ base: 12, md: 4 }}>
							<TextInput label="จังหวัด" {...form.getInputProps("work_province")} />
						</Grid.Col>
						<Grid.Col span={{ base: 12, md: 4 }}>
							<TextInput label="รหัสไปรษณีย์" {...form.getInputProps("work_zipcode")} onInput={(e) => (e.target.value = e.target.value.replace(/[^0-9]/g, ""))} />
						</Grid.Col>
						<Grid.Col span={{ base: 12, md: 4 }}>
							<TextInput label="โทรศัพท์" {...form.getInputProps("work_phone")} onInput={(e) => (e.target.value = e.target.value.replace(/[^0-9]/g, ""))} />
						</Grid.Col>
						<Grid.Col span={{ base: 12, md: 12 }}>
							<TextInput label="สังกัดหน่วยงาน" {...form.getInputProps("work_department")} />
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
