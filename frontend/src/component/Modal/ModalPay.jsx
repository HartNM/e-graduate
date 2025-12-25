import { Modal, Box, Text, Group, Image, Stack, Flex, Button } from "@mantine/core";
const API_BASE_URL = import.meta.env.VITE_API_URL;

const ModalPay = ({ opened, onClose, selectedRow, handlePay, MoneyRegis, stop_date }) => {
	const returnUrl = typeof window !== "undefined" ? `${window.location.origin}/student/RequestExam` : "";

	const paymentLink = selectedRow ? `${API_BASE_URL}/api/payment/redirect?student_id=${selectedRow.student_id}&amount=${MoneyRegis}&endDate=${stop_date}&urlredirect=${returnUrl}` : "#";
	
	return (
		<Modal opened={opened} onClose={onClose} title="ชำระค่าธรรมเนียม" centered size="500">
			{selectedRow && (
				<Box>
					<a href={paymentLink} style={{ textDecoration: "none" }}>
						<Stack align="center" gap="md">
							<Text fz="lg" fw={500} c="blue.7" td="underline">
								ชำระเงิน {selectedRow?.request_type} ยอดเงินที่ต้องชำระ {Number(MoneyRegis).toLocaleString()} บาท
							</Text>
							<Group justify="center" gap="md">
								<Image src={`${API_BASE_URL}/api/payment/image/Visa_Mastercard_jcb.jpg`} alt="payment credit" h={30} w="auto" />
								<Image src={`${API_BASE_URL}/api/payment/image/logo_ktb_next.png`} alt="krungthai Next" h={35} w="auto" />
								<Image src={`${API_BASE_URL}/api/payment/image/promtpay1.png`} alt="promtpay" h={30} w="auto" />
							</Group>
							<Text fz="md" c="blue.7" td="underline">
								ผ่านช่องทางออนไลน์
							</Text>
						</Stack>
					</a>
					<Flex justify="flex-end" mt="md">
						<Button color="green" onClick={() => handlePay(selectedRow)}>
							ทดสอบชำระค่าธรรมเนียม
						</Button>
					</Flex>
				</Box>
			)}
		</Modal>
	);
};

export default ModalPay;
