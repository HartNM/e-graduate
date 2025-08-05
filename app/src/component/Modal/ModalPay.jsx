import React from "react";
import { Modal, Box, Flex, Button } from "@mantine/core";

const ModalPay = (props) => (
	<Modal opened={props.opened} onClose={props.onClose} title="ชำระค่าธรรมเนียม" centered>
		{props.selectedRow && (
			<Box>
				<Flex justify="flex-end">
					<Button color="green" onClick={() => props.handlePay(props.selectedRow)}>
						บันทึก
					</Button>
				</Flex>
			</Box>
		)}
	</Modal>
);

export default ModalPay;
