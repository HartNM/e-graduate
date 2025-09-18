import { Modal, Box, Text, List, ThemeIcon, Title } from "@mantine/core";

const ModalCheckCourse = ({ opened, onClose, missingCoures }) => (
	<Modal
		opened={opened}
		onClose={onClose}
		title={
			<Box className="flex items-center gap-2">
				<Title order={4} c="red">
					ลงทะเบียนเรียนไม่ครบตามหลักสูตร
				</Title>
			</Box>
		}
		centered
	>
		<Box>
			<Text mb="sm" c="dimmed">
				คุณยังขาดการลงทะเบียนในรายวิชาต่อไปนี้
			</Text>

			<List
				spacing="sm"
				icon={
					<ThemeIcon color="blue" size={20} radius="xl">
						•
					</ThemeIcon>
				}
			>
				{missingCoures.map((item, index) => (
					<List.Item key={index}>
						<Text fw={500}>
							{item.course_id} {item.course_name}
						</Text>
					</List.Item>
				))}
			</List>
		</Box>
	</Modal>
);

export default ModalCheckCourse;
