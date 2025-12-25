import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
	plugins: [react()],
	server: {
		port: 3000,
		allowedHosts: true,
		/* proxy: {
			"/mua-proxy": {
				target: "https://mua.kpru.ac.th",
				changeOrigin: true,
				secure: false,
				rewrite: (path) => path.replace(/^\/mua-proxy/, ""),
			},

			"/git-proxy": {
				target: "https://git.kpru.ac.th",
				changeOrigin: true,
				secure: false,
				rewrite: (path) => path.replace(/^\/git-proxy/, ""),
			},

			"/epayment-proxy": {
				target: "https://e-payment.kpru.ac.th",
				changeOrigin: true,
				secure: false,
				rewrite: (path) => path.replace(/^\/epayment-proxy/, ""),
			},
		}, */
	},
	build: {
		chunkSizeWarningLimit: 1600,
	},
});
