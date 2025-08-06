import { Modal, Box, Text, TextInput, Checkbox, Stack, Space, Flex, Button } from "@mantine/core";

const ModalApprove = (props) => (
	<Modal opened={props.opened} onClose={props.onClose} title={props.selectedRow && "ลงความเห็น" + props.selectedRow.request_type} centered>
		{props.selectedRow && (
			<Box>
				<Text>คุณกำลังลงความเห็นสำหรับ: {props.selectedRow.student_name}</Text>
				<Space h="sm" />
				<Stack>
					<Checkbox checked={props.selected === "approve"} onChange={() => props.setSelected("approve")} label="เห็นควร" />
					<Checkbox checked={props.selected === "noapprove"} onChange={() => props.setSelected("noapprove")} label="ไม่เห็นควร" />
				</Stack>
				<Space h="sm" />
				<TextInput
					label="เนื่องจาก"
					value={props.comment}
					placeholder="เนื่องจาก"
					onChange={(event) => props.setComment(event.currentTarget.value)}
					error={props.selected === "noapprove" && props.error}
					disabled={props.selected === "approve"}
				/>
				<Space h="sm" />
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
