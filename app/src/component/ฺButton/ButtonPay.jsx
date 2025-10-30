import { useMemo } from "react";

const PayButton = ({ Usernames, MoneyRegis, stop_date, type }) => {

	const paymentUrl = useMemo(() => {
		return `https://e-payment.kpru.ac.th/pay/typepayment?comp=81914&orderRef1=${Usernames}&amount=${MoneyRegis}&endDate=${stop_date}&urlredirect=http://localhost:3000/student/RequestExam`;
	}, [Usernames, MoneyRegis, stop_date,]);

	return (
		<a type="button" className="btn btn-warning btn-lg btn-block" href={paymentUrl} target="_blank" rel="noopener noreferrer">
			ชำระเงิน {type} ยอดเงินที่ต้องชำระ {Number(MoneyRegis).toLocaleString()} บาท
			<br />
			<img src="https://e-payment.kpru.ac.th/pay/public/images/Visa_Mastercard_jcb.jpg" alt="payment credit" />
			<img src="https://e-payment.kpru.ac.th/pay/public/images/logo_ktb_next.png" alt="krungthai Next" />
			<img src="https://e-payment.kpru.ac.th/pay/public/images/promtpay1.png" style={{ width: "100px" }} alt="promtpay" />
			<br />
			ผ่านช่องทางออนไลน์
		</a>
	);
};

export default PayButton;
