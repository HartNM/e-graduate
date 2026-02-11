import { Button, Group } from "@mantine/core";

const PrintReceipt = ({ item }) => {
	if (!item.student_id || !item.receipt_vol || !item.receipt_No) return null;

	let rulePdfUrl;
	let ruleFileName;
	if (item.education_level === "ปริญญาโท") {
		rulePdfUrl = "/pdf/ระเบียบ-การรับจ่ายเงิน ป.โท_61.pdf";
		ruleFileName = "ระเบียบการเงิน_ป.โท.pdf";
	} else {
		rulePdfUrl = "/pdf/ประกาศการเก็บเงินป.เอก.pdf";
		ruleFileName = "ประกาศการเก็บเงิน_ป.เอก.pdf";
	}

	item.student_id = "664140101";

	const receiptUrl = `https://e-finance.kpru.ac.th/receipt_research?customer_id=${item.student_id}&receipt_book=${item.receipt_vol}&receipt_no=${item.receipt_No}&type=u`;

	return (
		<Group style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
			<Button component="a" href={receiptUrl} target="_blank" variant="filled" color="green" size="xs">
				พิมพ์ใบเสร็จ
			</Button>

			<Button component="a" href={rulePdfUrl} download={ruleFileName} variant="filled" color="green" size="xs">
				โหลดระเบียบฯ
			</Button>
		</Group>
	);
};

export default PrintReceipt;
