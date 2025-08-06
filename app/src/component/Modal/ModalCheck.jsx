import { Modal, Box, Stack, Checkbox, Space, TextInput, Flex, Button } from "@mantine/core";

const ModalCheck = (props) => (
	<Modal opened={props.opened} onClose={props.onClose} title="ตรวจสอบ" centered>
		<Box>
			<Stack>
				<Checkbox checked={props.selected === "approve"} onChange={() => props.setSelected("approve")} label="อนุมัติ" />
				<Checkbox checked={props.selected === "noapprove"} onChange={() => props.setSelected("noapprove")} label="ไม่อนุมัติ" />
			</Stack>
			<Space h="sm" />
			<TextInput
				label="เนื่องจาก"
				placeholder="เนื่องจาก"
				disabled={props.selected === "approve"}
				value={props.comment}
				onChange={(e) => props.setComment(e.currentTarget.value)}
				error={props.selected === "noapprove" && props.error}
			/>
			<Flex justify="flex-end">
				<Button color="green" onClick={props.onClose}>
					บันทึก
				</Button>
			</Flex>
		</Box>
	</Modal>
);

export default ModalCheck;
