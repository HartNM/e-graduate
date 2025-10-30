import { Modal, Box, Flex, Button } from "@mantine/core";
/* import PayButton from "../ฺButton/ButtonPay"; */
import { useMemo } from "react";

const ModalPay = ({ opened, onClose, selectedRow, handlePay, MoneyRegis, stop_date }) => {
	const paymentUrl = useMemo(() => {
		return `https://e-payment.kpru.ac.th/pay/typepayment?comp=81914&orderRef1=${selectedRow?.student_id}&amount=${selectedRow?.receipt_pay}&endDate=${stop_date}&urlredirect=http://localhost:3000/student/RequestExam`;
	}, [selectedRow?.student_id, selectedRow?.receipt_pay, stop_date]);

	return (
		<Modal opened={opened} onClose={onClose} title="ชำระค่าธรรมเนียม" centered>
			{selectedRow && (
				<Box>
					<a type="button" className="btn btn-warning btn-lg btn-block" href={paymentUrl} target="_blank" rel="noopener noreferrer">
						ชำระเงิน {selectedRow?.request_type} ยอดเงินที่ต้องชำระ {Number(MoneyRegis).toLocaleString()} บาท
						<br />
						<img src="https://e-payment.kpru.ac.th/pay/public/images/Visa_Mastercard_jcb.jpg" alt="payment credit" />
						<img src="https://e-payment.kpru.ac.th/pay/public/images/logo_ktb_next.png" alt="krungthai Next" />
						<img src="https://e-payment.kpru.ac.th/pay/public/images/promtpay1.png" style={{ width: "100px" }} alt="promtpay" />
						<br />
						ผ่านช่องทางออนไลน์
					</a>
					{/* <PayButton Usernames={selectedRow?.student_id} MoneyRegis={selectedRow?.receipt_pay} stop_date="15/11/2568" type={selectedRow?.request_type} /> */}
					{/* <Flex justify="flex-end" mt="md">
					<Button color="green" onClick={() => handlePay(selectedRow)}>
						บันทึก
					</Button>
				</Flex> */}
				</Box>
			)}
		</Modal>
	);
};

export default ModalPay;
