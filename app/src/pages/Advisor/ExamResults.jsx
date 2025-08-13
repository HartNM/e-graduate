//กรอกผลการสอบ
import { Box, Text, ScrollArea, Table, Flex, Group, Button, Space } from "@mantine/core";
import React from "react";

const ExamResults = () => {
	return (
		<Box>
			<Text size="1.5rem" fw={900} mb="md">
				กรอกผลการสอบ
			</Text>
			<Group justify="space-between">
				<Box>
					<Flex align="flex-end" gap="sm"></Flex>
				</Box>
				<Box>
					<Button>กรอกผลการสอบ</Button>
				</Box>
			</Group>
			<Space h="md" />
			<ScrollArea type="scroll" offsetScrollbars style={{ borderRadius: "8px", border: "1px solid #e0e0e0" }}>
				<Table horizontalSpacing="sm" verticalSpacing="sm" highlightOnHover>
					<Table.Thead>
						<Table.Tr>
							<Table.Th>ชื่อ</Table.Th>
							<Table.Th>ผลการชอบ</Table.Th>
							<Table.Th>สถานะ</Table.Th>
							<Table.Th>การดำเนินการ</Table.Th>
						</Table.Tr>
					</Table.Thead>
					<Table.Tbody>{}</Table.Tbody>
				</Table>
			</ScrollArea>
		</Box>
	);
};

export default ExamResults;
