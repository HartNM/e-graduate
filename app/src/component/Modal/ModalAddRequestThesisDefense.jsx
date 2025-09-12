import { Modal, TextInput, Flex, Button, Space, Grid, Text, Checkbox, Select, Group } from "@mantine/core";
import { useState, useEffect } from "react";
import { DatePickerInput } from "@mantine/dates";

const ModalAddRequestThesisProposal = ({ opened, onClose, title, form, handleAdd }) => {
	const [advisors, setAdvisors] = useState([]);
	const token = localStorage.getItem("token");

	useEffect(() => {
		if (opened) {
			const fetchAdvisors = async () => {
				try {
					const res = await fetch("http://localhost:8080/api/getAdvisors", {
						method: "POST",
						headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
					});
					const data = await res.json();
					if (!res.ok) throw new Error(data.message);
					setAdvisors(data.map((a) => ({ value: a.user_id, label: a.name })));
				} catch (e) {
					console.error("Error fetching advisors:", e);
				}
			};

			fetchAdvisors();
		}
	}, [opened, token]);

	return (
		<Modal opened={opened} onClose={onClose} title={title} centered size="800">
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
						<DatePickerInput label="เลือกวันที่สอบ" placeholder="เลื่อกวัน" firstDayOfWeek={0} valueFormat="DD MMMM YYYY" withAsterisk {...form.getInputProps("thesis_exam_date")} />
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

export default ModalAddRequestThesisProposal;
