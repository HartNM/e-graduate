import { useState, useEffect } from "react";
import { Modal, Box, TextInput, Flex, Button, Space, Select, Grid } from "@mantine/core";

const ModalAdd = ({ opened, onClose, title, form, handleAdd }) => {
	const [provinces, setProvinces] = useState([]);
	const [districts, setDistricts] = useState([]);
	const [subDistricts, setSubDistricts] = useState([]);

	// โหลดจังหวัดทั้งหมดครั้งเดียว
	useEffect(() => {
		(async () => {
			try {
				const res = await fetch("https://raw.githubusercontent.com/kongvut/thai-province-data/refs/heads/master/api/latest/province_with_district_and_sub_district.json");
				const data = await res.json();
				data.sort((a, b) => (a.name_th || "").localeCompare(b.name_th || "", "th"));
				setProvinces(data);
			} catch (err) {
				console.error(err);
			}
		})();
	}, []);

	// เลือกจังหวัด
	const handleProvinceChange = (provinceId) => {
		if (!provinceId) return;

		const province = provinces.find((p) => String(p.id) === provinceId);
		form.setFieldValue("contact_province", province?.name_th || "");

		// reset ค่าอื่น
		form.setFieldValue("contact_district", "");
		form.setFieldValue("contact_subdistrict", "");
		form.setFieldValue("contact_zipcode", "");

		// โหลดอำเภอ
		const ds = (province?.districts || []).sort((a, b) => (a.name_th || "").localeCompare(b.name_th || "", "th"));
		setDistricts(ds);
		setSubDistricts([]);
	};

	// เลือกอำเภอ
	const handleDistrictChange = (districtId) => {
		if (!districtId) return;

		const district = districts.find((d) => String(d.id) === districtId);
		form.setFieldValue("contact_district", district?.name_th || "");

		// reset ตำบล / รหัสไปรษณีย์
		form.setFieldValue("contact_subdistrict", "");
		form.setFieldValue("contact_zipcode", "");

		// โหลดตำบล
		const sds = (district?.sub_districts || []).sort((a, b) => (a.name_th || "").localeCompare(b.name_th || "", "th"));
		setSubDistricts(sds);
	};

	// เลือกตำบล
	const handleSubDistrictChange = (subDistrictId) => {
		if (!subDistrictId) return;

		const sd = subDistricts.find((s) => String(s.id) === subDistrictId);
		form.setFieldValue("contact_subdistrict", sd?.name_th || "");
		form.setFieldValue("contact_zipcode", sd?.zip_code ?? "");
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
								<Select
									label="จังหวัด"
									placeholder="เลือกจังหวัด"
									data={provinces.map((p) => ({
										value: String(p.id),
										label: p.name_th,
									}))}
									value={provinces.find((p) => p.name_th === form.values.contact_province)?.id?.toString() || ""}
									onChange={(val) => handleProvinceChange(val)}
								/>
							</Grid.Col>

							<Grid.Col span={{ base: 12, md: 4 }}>
								<Select
									label="อำเภอ"
									placeholder="เลือกอำเภอ"
									data={districts.map((d) => ({
										value: String(d.id),
										label: d.name_th,
									}))}
									value={districts.find((d) => d.name_th === form.values.contact_district)?.id?.toString() || ""}
									onChange={(val) => handleDistrictChange(val)}
									disabled={districts.length === 0}
								/>
							</Grid.Col>

							<Grid.Col span={{ base: 12, md: 4 }}>
								<Select
									label="ตำบล"
									placeholder="เลือกตำบล"
									data={subDistricts.map((s) => ({
										value: String(s.id),
										label: s.name_th,
									}))}
									value={subDistricts.find((s) => s.name_th === form.values.contact_subdistrict)?.id?.toString() || ""}
									onChange={(val) => handleSubDistrictChange(val)}
									disabled={subDistricts.length === 0}
								/>
							</Grid.Col>

							<Grid.Col span={{ base: 12, md: 4 }}>
								<TextInput label="รหัสไปรษณีย์" readOnly {...form.getInputProps("contact_zipcode")} />
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
};

export default ModalAdd;
