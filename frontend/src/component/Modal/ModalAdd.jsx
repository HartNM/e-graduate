import { useState, useEffect } from "react";
import { Modal, Box, TextInput, Flex, Button, Space, Checkbox, Text } from "@mantine/core";

const ModalAdd = ({ opened, onClose, title, form, handleAdd }) => {
	const [isConfirmed, setIsConfirmed] = useState(false);

	useEffect(() => {
		if (opened) {
			setIsConfirmed(false);
		}
	}, [opened]);

	return (
		<Modal opened={opened} onClose={onClose} title={title} centered>
			<Box>
				<TextInput label="ชื่อ-นามสกุล" disabled value={form.student_name} />
				<TextInput label="รหัสนักศึกษา" disabled value={form.student_id} />
				<TextInput label="ระดับการศึกษา" disabled value={form.education_level} />
				<TextInput label="หลักสูตร" disabled value={form.program} />
				<TextInput label="สาขาวิชา" disabled value={form.major_name} />
				<TextInput label="คณะ" disabled value={form.faculty_name} />

				<Space h="lg" />

				<Text c="red" size="sm" mb="xs">
					* กรุณาตรวจสอบข้อมูลก่อนบันทึก
				</Text>

				<Checkbox label="กรณีที่ขอยกเลิกคำร้องจะไม่สามารถขอเงินคืนได้ทุกกรณี" checked={isConfirmed} onChange={(event) => setIsConfirmed(event.currentTarget.checked)} color="red" style={{ cursor: "pointer" }} />

				<Space h="lg" />

				<Flex justify="flex-end">
					<Button color="green" onClick={() => handleAdd()} disabled={!isConfirmed}>
						บันทึก
					</Button>
				</Flex>
			</Box>
		</Modal>
	);
};

export default ModalAdd;
