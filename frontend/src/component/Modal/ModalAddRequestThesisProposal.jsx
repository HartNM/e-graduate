import { Modal, TextInput, Flex, Button, Space, Grid, Text, Checkbox, Select, Group, LoadingOverlay, Box } from "@mantine/core";
import { useState, useEffect } from "react";
import { DatePickerInput } from "@mantine/dates";
const BASE_URL = import.meta.env.VITE_API_URL;

const ModalAddRequestThesisProposal = ({ opened, onClose, title, form, handleAdd }) => {
	const [advisors, setAdvisors] = useState([]);
	const [loading, setLoading] = useState(false);
	const token = localStorage.getItem("token");

	useEffect(() => {
		if (opened) {
			const fetchAdvisors = async () => {
				setLoading(true);
				try {
					const majorsRes = await fetch(`${BASE_URL}/api/majors`, {
						method: "POST",
						headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
					});
					const majorsData = await majorsRes.json();
					if (!majorsRes.ok) throw new Error(majorsData.message);

					const selectedMajor = majorsData.find((m) => m.major_id === form.values.major_id);
					if (selectedMajor) {
						const facultyMembersRes = await fetch(`${BASE_URL}/api/get-faculty-members/${selectedMajor.id_fac}`, {
							method: "GET",
							headers: { "Content-Type": "application/json" },
						});

						const facultyMembersData = await facultyMembersRes.json();
						if (!facultyMembersRes.ok) throw new Error("ไม่สามารถดึงข้อมูลบุคลากรได้");

						setAdvisors(
							facultyMembersData.map((member) => ({
								value: member.employee_id,
								label: `${member.prename_full_tha}${member.first_name_tha} ${member.last_name_tha}`.trim(),
							}))
						);
					}
				} catch (e) {
					console.error("Error fetching advisors:", e);
				} finally {
					setLoading(false);
				}
			};
			fetchAdvisors();
		}
	}, [opened, token]);

	return (
		<Modal opened={opened} onClose={onClose} title={title} centered size="800">
			<Box pos="relative">
				<LoadingOverlay visible={loading} zIndex={1000} overlayProps={{ radius: "sm", blur: 2 }} />
				<form onSubmit={form.onSubmit(handleAdd)}>
					<Grid breakpoints={{ md: "660px" }}>
						<Grid.Col span={{ base: 12, md: 6 }}>
							<TextInput label="ชื่อ-นามสกุล" disabled {...form.getInputProps("student_name")} />
							<TextInput label="รหัสประจำตัว" disabled {...form.getInputProps("student_id")} />
							<TextInput label="ระดับการศึกษา" disabled {...form.getInputProps("education_level")} />
							<TextInput label="หลักสูตร" disabled {...form.getInputProps("program")} />
							<TextInput label="สาขาวิชา" disabled {...form.getInputProps("major_name")} />
							<TextInput label="คณะ" disabled {...form.getInputProps("faculty_name")} />
						</Grid.Col>
						<Grid.Col span={{ base: 12, md: 6 }}>
							<Text>เลือกชนิดโครงร่างงานวิจัย</Text>
							<Group direction="column" spacing="xs">
								<Checkbox checked={form.values.request_type === "วิทยานิพนธ์"} onChange={() => form.setFieldValue("request_type", "วิทยานิพนธ์")} label="วิทยานิพนธ์" />
								<Checkbox checked={form.values.request_type === "การค้นคว้าอิสระ"} onChange={() => form.setFieldValue("request_type", "การค้นคว้าอิสระ")} label="การค้นคว้าอิสระ" />
								{form.errors.request_type && (
									<Text c="red" size="sm">
										{form.errors.request_type}
									</Text>
								)}
							</Group>
							<Space h="md" />
							<TextInput label="ชื่องานวิจัย" placeholder="กรอกชื่องานวิจัย" {...form.getInputProps("research_name")} />
							<Select label="เลือกอาจารย์ที่ปรึกษางานวิจัย" placeholder="เลือกอาจารย์" data={advisors} searchable {...form.getInputProps("thesis_advisor_id")} />
						</Grid.Col>
					</Grid>
					<Space h="lg" />
					<Flex justify="flex-end">
						<Button type="submit" color="green">
							บันทึก
						</Button>
					</Flex>
				</form>
			</Box>
		</Modal>
	);
};

export default ModalAddRequestThesisProposal;
