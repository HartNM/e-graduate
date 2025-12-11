import { Modal, Box, Text, Group, Image, Stack, Flex, Button } from "@mantine/core";

const ModalPay = ({ opened, onClose, selectedRow, handlePay, MoneyRegis, stop_date }) => {
	/* console.log(selectedRow?.student_id, MoneyRegis, stop_date); */

	return (
		<Modal opened={opened} onClose={onClose} title="ชำระค่าธรรมเนียม" centered size="500">
			{selectedRow && (
				<Box>
					<a href={`/epayment-proxy/pay/typepayment?comp= &orderRef1=${selectedRow?.student_id}&amount=${MoneyRegis}&endDate=${stop_date}&urlredirect=http://localhost:3000/student/RequestExam`}>
						<Stack align="center" gap="md">
							<Text fz="lg" fw={500} c="blue.7" td="underline">
								ชำระเงิน {selectedRow?.request_type} ยอดเงินที่ต้องชำระ {Number(MoneyRegis).toLocaleString()} บาท
							</Text>
							<Group justify="center" gap="md">
								<Image src="/epayment-proxy/pay/public/images/Visa_Mastercard_jcb.jpg" alt="payment credit" h={30} w="auto" />
								<Image src="/epayment-proxy/pay/public/images/logo_ktb_next.png" alt="krungthai Next" h={35} w="auto" />
								<Image src="/epayment-proxy/pay/public/images/promtpay1.png" alt="promtpay" h={30} w="auto" />
							</Group>
							<Text fz="md" c="blue.7" td="underline">
								ผ่านช่องทางออนไลน์
							</Text>
						</Stack>
					</a>
					{/* <Flex justify="flex-end" mt="md">
						<Button color="green" onClick={() => handlePay(selectedRow)}>
							ชำระค่าธรรมเนียม
						</Button>
					</Flex> */}
				</Box>
			)}
		</Modal>
	);
};

export default ModalPay;
