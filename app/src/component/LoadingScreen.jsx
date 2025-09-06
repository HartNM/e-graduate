import { Center, Loader, Stack, Text } from "@mantine/core";

const LoadingScreen = () => {
	return (
		<Center h="100vh">
			<Stack align="center" spacing="sm">
				<Loader color="blue" size="lg" />
				<Text size="lg" fw={500}>
					กำลังโหลดข้อมูล...
				</Text>
			</Stack>
		</Center>
	);
};

export default LoadingScreen;