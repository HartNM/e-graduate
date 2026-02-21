// main.jsx
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import { BadgeProvider } from "./context/BadgeContext";

ReactDOM.createRoot(document.getElementById("root")).render(
	<React.StrictMode>
		<BadgeProvider>
			<App />
		</BadgeProvider>
	</React.StrictMode>,
);
