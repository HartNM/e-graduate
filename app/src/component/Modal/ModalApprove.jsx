import { Modal, Box, Text, TextInput, Checkbox, Stack, Space, Flex, Button } from "@mantine/core";

const ModalApprove = (props) => (
	<Modal opened={props.opened} onClose={props.onClose} title={props.selectedRow && (props.role === "officer_registrar" ? "ตรวจสอบคำ" : "ลงความเห็น") + props.selectedRow.request_type} centered>
		{props.selectedRow && (
			<Box style={{ display: "flex", flexDirection: "column", height: 227, justifyContent: "space-between" }}>
				<Box>
					<Text>
						คุณกำลัง{props.role === "officer_registrar" ? "ตรวจสอบ" : "ลงความเห็น"}สำหรับ: {props.selectedRow.student_name}
					</Text>
					<Space h="sm" />
					<Stack>
						<Checkbox checked={props.selected === "approve"} onChange={() => props.setSelected("approve")} label={props.role === "officer_registrar" ? "ผ่านการตรวจสอบ" : "เห็นควร"} />
						<Checkbox checked={props.selected === "noapprove"} onChange={() => props.setSelected("noapprove")} label={props.role === "officer_registrar" ? "ไม่ผ่านการตรวจสอบ" : "ไม่เห็นควร"} />
					</Stack>
					<Space h="sm" />
					{props.selected !== "approve" && <TextInput label="เนื่องจาก" value={props.comment} placeholder="เนื่องจาก" onChange={(event) => props.setComment(event.currentTarget.value)} error={props.selected === "noapprove" && props.error} disabled={props.selected === "approve"} />}
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
