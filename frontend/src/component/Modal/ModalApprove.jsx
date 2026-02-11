import { Modal, Box, Text, TextInput, Checkbox, Stack, Space, Flex, Button } from "@mantine/core";

const ModalApprove = (props) => (
	<Modal opened={props.opened} onClose={props.onClose} title={props.title} centered>
		{props.selectedRow && (
			<Box style={{ display: "flex", flexDirection: "column", height: 250, justifyContent: "space-between" }}>
				<Box>
					<Text>{props.selectedRow.student_name}</Text>
					<Space h="sm" />
					<Stack>
						<Checkbox checked={props.selected === "approve"} onChange={() => props.setSelected("approve")} label={props.role === "officer_registrar" ? "ผ่านการตรวจสอบ" : "เห็นควรอนุญาต"} />
						<Checkbox checked={props.selected === "noapprove"} onChange={() => props.setSelected("noapprove")} label={props.role === "officer_registrar" ? "ไม่ผ่านการตรวจสอบ" : "ไม่อนุญาต"} />
					</Stack>
					<Space h="sm" />
					{props.selected !== "approve" && (
						<TextInput
							label="เนื่องจาก"
							required
							maxLength={90} // จำกัด 80 ตัวอักษร
							description={`${props.comment?.length || 0}/90 ตัวอักษร`}
							Value={props.comment}
							placeholder="เนื่องจาก"
							onChange={(event) => props.setComment(event.currentTarget.value)}
							error={props.selected === "noapprove" && props.error}
							disabled={props.selected === "approve"}
						/>
					)}
					<Space h="sm" />
				</Box>
				<Flex justify="flex-end">
					<Button
						size="xs"
						color="green"
						onClick={() => {
							props.openApproveState === "add" ? props.handleApprove(props.selectedRow) : props.handleCancel(props.selectedRow);
						}}
					>
						บันทึก
					</Button>
				</Flex>
			</Box>
		)}
	</Modal>
);

export default ModalApprove;
