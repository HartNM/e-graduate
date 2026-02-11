import { Modal, Box, Text, Group, Image, Stack, Flex, Button } from "@mantine/core";
const API_BASE_URL = import.meta.env.VITE_API_URL;

import visaLogo from "../../assets/images/Visa_Mastercard_jcb.jpg";
import ktbLogo from "../../assets/images/logo_ktb_next.png";
import promptPayLogo from "../../assets/images/promtpay1.png";

const ModalPay = ({ opened, onClose, selectedRow, handlePay, MoneyRegis, stop_date }) => {
	const returnUrl = typeof window !== "undefined" ? `${window.location.origin}/student/RequestExam` : "";

	const getTodayMidnight = () => {
		const date = new Date();
		date.setHours(23, 59, 59, 0);

		const pad = (num) => String(num).padStart(2, "0");
		const year = date.getFullYear();
		const month = pad(date.getMonth() + 1);
		const day = pad(date.getDate());
		const hours = pad(date.getHours());
		const minutes = pad(date.getMinutes());
		const seconds = pad(date.getSeconds());

		return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
	};

	const todayStopDate = getTodayMidnight();

	const paymentLink = selectedRow ? `${API_BASE_URL}/api/payment/redirect?student_id=${selectedRow.student_id}&amount=${MoneyRegis}&endDate=${todayStopDate}&urlredirect=${returnUrl}` : "#";

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
								<Image src={visaLogo} alt="payment credit" h={30} w="auto" />
								<Image src={ktbLogo} alt="krungthai Next" h={35} w="auto" />
								<Image src={promptPayLogo} alt="promtpay" h={30} w="auto" />
							</Group>
						</Stack>
					</a>
					<Stack align="center" gap="md">
						<Text fz="md" c="blue.7" td="underline" onClick={() => handlePay(selectedRow)}>
							ผ่านช่องทางออนไลน์
						</Text>
					</Stack>
					{/* <Flex justify="flex-end" mt="md">
						<Button color="green" onClick={() => handlePay(selectedRow)}>
							ทดสอบชำระค่าธรรมเนียม
						</Button>
					</Flex> */}
				</Box>
			)}
		</Modal>
	);
};

export default ModalPay;
