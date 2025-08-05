import React from "react";
import { Modal, Box, Text, Divider } from "@mantine/core";

const ModalInfo = (props) => (
	<Modal opened={props.opened} onClose={props.onClose} title={props.selectedRow && "ข้อมูลคำร้อง" + props.selectedRow.request_type} centered>
		{props.selectedRow && (
			<Box>
				<Text>ชื่อ: {props.selectedRow.student_name}</Text>
				<Text>รหัสนักศึกษา: {props.selectedRow.student_id}</Text>
				<Text>คณะ: {props.selectedRow.faculty_name}</Text>
				<Text>สาขา: {props.selectedRow.major_name}</Text>
				<Text>ประเภทคำร้อง: {props.selectedRow.request_type}</Text>
				<Text>วันที่ยื่นคำร้อง: {props.selectedRow.request_date}</Text>
				<Text>สถานะ: {props.selectedRow.status_text}</Text>
				{props.selectedRow.comment && <Text>ความเห็น {props.selectedRow.comment}</Text>}

				{props.selectedRow.advisor_approvals_name && (
					<>
						<Divider my="xs" label="การอนุมัติ" />
						<Text>
							{props.selectedRow.advisor_approvals ? "อนุมัติ " : "ไม่อนุมัติ "}
							{props.selectedRow.advisor_approvals_name}
						</Text>
					</>
				)}
				{props.selectedRow.chairpersons_approvals_name && (
					<Text>
						{props.selectedRow.chairpersons_approvals ? "อนุมัติ " : "ไม่อนุมัติ "}
						{props.selectedRow.chairpersons_approvals_name}
					</Text>
				)}
				{props.selectedRow.registrar_approvals_name && (
					<Text>
						{props.selectedRow.registrar_approvals ? "อนุมัติ " : "ไม่อนุมัติ "}
						{props.selectedRow.registrar_approvals_name}
					</Text>
				)}

				{props.selectedRow.ever_cancel && props.selectedRow.cancel_list.length > 0 && (
					<>
						{props.selectedRow.cancel_list
							.slice()
							.reverse()
							.map((item, index) => (
								<Box key={item.request_cancel_exam_id} mt="sm">
									<Divider my="xs" label={`ขอยกเลิก ${index + 1}`} />
									<Text>เนื่องจาก {item.reason}</Text>
									{item.advisor_cancel_name && (
										<Text>
											{item.advisor_cancel ? "อนุมัติ " : "ไม่อนุมัติ "} {item.advisor_cancel_name}
										</Text>
									)}
									{item.chairpersons_cancel_name && (
										<Text>
											{item.chairpersons_cancel ? "อนุมัติ " : "ไม่อนุมัติ "} {item.chairpersons_cancel_name}
										</Text>
									)}
									{item.dean_cancel_name && (
										<Text>
											{item.dean_cancel_name ? "อนุมัติ " : "ไม่อนุมัติ "} {item.dean_cancel_name}
										</Text>
									)}
									{item.comment && <Text>ไม่อนุมัติเนื่องจาก {item.comment}</Text>}
								</Box>
							))}
					</>
				)}
			</Box>
		)}
	</Modal>
);

export default ModalInfo;
