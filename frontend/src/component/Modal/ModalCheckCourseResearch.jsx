import React from "react"; // อย่าลืม import React เพื่อใช้ Fragment
import { Modal, Box, Text, List, ThemeIcon, Title } from "@mantine/core";

const ModalCheckCourse = ({ opened, onClose, missingCoures, type }) => (
	<Modal
		opened={opened}
		onClose={onClose}
		title={
			<Box className="flex items-center gap-2">
				<Title order={4} c="red">
					ท่านลงทะเบียนไม่สมบูรณ์
				</Title>
			</Box>
		}
		centered
	>
		<Box>
			<Text mb="sm" c="dimmed">
				คุณยังขาดการลงทะเบียนในรายวิชาต่อไปนี้ {type}
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
					<React.Fragment key={index}>
						{/* รายวิชา */}
						<List.Item>
							<Text fw={500}>
								{item.course_id} {item.course_name}
							</Text>
						</List.Item>

						{index < missingCoures.length - 1 && (
							<List.Item icon={<Box w={20} />}>
								<Text size="sm" c="dimmed">
									หรือ
								</Text>
							</List.Item>
						)}
					</React.Fragment>
				))}
			</List>
		</Box>
	</Modal>
);

export default ModalCheckCourse;
