import { Button } from "@mantine/core";
import { PDFDocument } from "pdf-lib";

const PrintReceipt = ({ item }) => {
	if (!item.student_id || !item.receipt_vol || !item.receipt_No) return null;
	const Url = `https://e-finance.kpru.ac.th/receipt_research?customer_id=${item.student_id}&receipt_book=${item.receipt_vol}&receipt_no=${item.receipt_No}&type=u`;

	/* const downloadIcon = (
		<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
			<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
			<polyline points="7 10 12 15 17 10"></polyline>
			<line x1="12" y1="15" x2="12" y2="3"></line>
		</svg>
	); */

	return (
		<Button
			component="a"
			href={Url}
			target="_blank"
			rel="noopener noreferrer"
			variant="filled"
			color="green"
			size="xs"
			/* leftSection={downloadIcon} */
		>
			ดาวน์โหลดใบเสร็จ
		</Button>
	);
};

export default PrintReceipt;
