import { useEffect } from "react";
import { Modal, Center, Text } from "@mantine/core";
import { IconCircleCheck, IconCircleX } from "@tabler/icons-react";
import "../../styles/ModalInform.css"; // นำเข้า CSS แยก หรือใช้ style ใน component ก็ได้

const ModalInform = ({ opened, onClose, message, type = "success", timeout = 3000 }) => {
	useEffect(() => {
		if (opened) {
			const timer = setTimeout(() => {
				onClose();
			}, timeout);
			return () => clearTimeout(timer);
		}
	}, [opened, timeout, onClose]);

	const icon = type === "success" ? <IconCircleCheck size={256} color="green" className="icon-bounce" /> : <IconCircleX size={256} color="red" className="icon-shake" />;

	return (
		<Modal
			opened={opened}
			onClose={onClose}
			withCloseButton={false}
			centered
			size="auto"
			zIndex={9999}
			styles={{
				content: {
					width: "400px",
					height: "400px",
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					textAlign: "center",
				},
			}}
		>
			<Center style={{ flexDirection: "column", gap: "1rem" }}>
				{icon}
				<Text size="xl" fw={600}>
					{message}
				</Text>
			</Center>
		</Modal>
	);
};

export default ModalInform;
