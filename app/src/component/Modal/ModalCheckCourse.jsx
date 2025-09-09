import { Modal, Box, Text } from "@mantine/core";

const ModalCheckCourse = ({ opened, onClose, missingCoures }) => (
	<Modal opened={opened} onClose={onClose} title="ลงทะเบียนเรียนไม่ครบตามหลักสูตร" centered>
		<Box>
			{missingCoures.map((label, index) => (
				<Text key={index}>{label}</Text>
			))}
		</Box>
	</Modal>
);

export default ModalCheckCourse;
