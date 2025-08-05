// App.jsx
import { MantineProvider, createTheme, TextInput, Modal, Select, ScrollArea, Table } from "@mantine/core";
import { DatesProvider } from "@mantine/dates";
import "@mantine/core/styles.css";
import "@mantine/dates/styles.css";
import AppRoutes from "./AppRoutes";
import "dayjs/locale/th";
import { useColorScheme } from "@mantine/hooks";

const theme = createTheme({
	components: {
		TextInput: TextInput.extend({
			styles: {
				input: {
					color: "light-dark(#000, #fff)",
				},
			},
		}),
		Modal: Modal.extend({
			defaultProps: {
				overlayProps: {
					backgroundOpacity: 0.55,
					blur: 3,
				},
			},
		}),
		Select: Select.extend({
			styles: { input: { color: "black" } },
		}),
		ScrollArea: ScrollArea.extend({
			styles: { viewport: { padding: 0 } },
		}),
		Table: Table.extend({
			styles: {
				th: {
					textAlign: "center",
				},
			},
		}),
	},
});

export default function App() {
	return (
		<MantineProvider theme={theme}>
			<DatesProvider settings={{ locale: "th" }}>
				<AppRoutes />
			</DatesProvider>
		</MantineProvider>
	);
}
