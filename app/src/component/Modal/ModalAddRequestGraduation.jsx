import { useState, useEffect } from "react";
import { Modal, Box, TextInput, Flex, Button, Space, Select, Grid } from "@mantine/core";

const ModalAdd = ({ opened, onClose, title, form, handleAdd }) => {
	const [provinceData, setProvinceData] = useState([]);
	const [location, setLocation] = useState({
		contact: { districts: [], subdistricts: [] },
		work: { districts: [], subdistricts: [] },
	});

	useEffect(() => {
		(async () => {
			const res = await fetch("https://raw.githubusercontent.com/kongvut/thai-province-data/refs/heads/master/api/latest/province_with_district_and_sub_district.json");
			const data = await res.json();
			setProvinceData(data.sort((a, b) => a.name_th.localeCompare(b.name_th, "th")));
		})();
	}, []);

	useEffect(() => {
		if (!provinceData.length) return;

		const initLocation = (type) => {
			const province = provinceData.find((p) => p.name_th === form.values[`${type}_province`]);
			const district = province?.districts.find((d) => d.name_th === form.values[`${type}_district`]);
			setLocation((prev) => ({
				...prev,
				[type]: {
					districts: province?.districts || [],
					subdistricts: district?.sub_districts || [],
				},
			}));
		};

		initLocation("contact");
		initLocation("work");
	}, [provinceData, opened]);

	// ฟังก์ชันรวม ใช้ได้ทั้ง contact / work
	const handleLocation = (type, level, id) => {
		console.log(type, level, id);

		if (level === "province") {
			const province = provinceData.find((p) => String(p.id) === id);
			form.setValues({
				[`${type}_province`]: province?.name_th || "",
				[`${type}_district`]: "",
				[`${type}_subdistrict`]: "",
				[`${type}_zipcode`]: "",
			});
			setLocation((prev) => ({
				...prev,
				[type]: { districts: province?.districts || [], subdistricts: [] },
			}));
		} else if (level === "district") {
			const district = location[type].districts.find((d) => String(d.id) === id);
			form.setValues({
				[`${type}_district`]: district?.name_th || "",
				[`${type}_subdistrict`]: "",
				[`${type}_zipcode`]: "",
			});
			setLocation((prev) => ({
				...prev,
				[type]: { ...prev[type], subdistricts: district?.sub_districts || [] },
			}));
		} else if (level === "subdistrict") {
			const sd = location[type].subdistricts.find((s) => String(s.id) === id);
			form.setValues({
				[`${type}_subdistrict`]: sd?.name_th || "",
				[`${type}_zipcode`]: sd?.zip_code ?? "",
			});
		}
	};

	const renderSelects = (type, labelPrefix = "") => (
		<>
			<Grid.Col span={{ base: 12, md: 4 }}>
				<Select
					label={`${labelPrefix}จังหวัด`}
					placeholder="เลือกจังหวัด"
					data={provinceData.map((p) => ({ value: String(p.id), label: p.name_th }))}
					value={provinceData.find((p) => p.name_th === form.values[`${type}_province`])?.id?.toString() || ""}
					onChange={(v) => handleLocation(type, "province", v)}
				/>
			</Grid.Col>
			<Grid.Col span={{ base: 12, md: 4 }}>
				<Select
					label={`${labelPrefix}อำเภอ`}
					placeholder="เลือกอำเภอ"
					data={location[type].districts.map((d) => ({ value: String(d.id), label: d.name_th }))}
					value={location[type].districts.find((d) => d.name_th === form.values[`${type}_district`])?.id?.toString() || ""}
					onChange={(v) => handleLocation(type, "district", v)}
					disabled={!location[type].districts.length}
				/>
			</Grid.Col>
			<Grid.Col span={{ base: 12, md: 4 }}>
				<Select
					label={`${labelPrefix}ตำบล`}
					placeholder="เลือกตำบล"
					data={location[type].subdistricts.map((s) => ({ value: String(s.id), label: s.name_th }))}
					value={location[type].subdistricts.find((s) => s.name_th === form.values[`${type}_subdistrict`])?.id?.toString() || ""}
					onChange={(v) => handleLocation(type, "subdistrict", v)}
					disabled={!location[type].subdistricts.length}
				/>
			</Grid.Col>
			<Grid.Col span={{ base: 12, md: 4 }}>
				<TextInput label={`${labelPrefix}รหัสไปรษณีย์`} readOnly {...form.getInputProps(`${type}_zipcode`)} />
			</Grid.Col>
		</>
	);

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

							{renderSelects("contact")}

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

							{renderSelects("work")}

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
