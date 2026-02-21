import { createContext, useState, useContext } from "react";

const BadgeContext = createContext();

export const BadgeProvider = ({ children }) => {
	const [updateTrigger, setUpdateTrigger] = useState(0);

	const refreshBadges = () => {
		setUpdateTrigger((prev) => prev + 1);
	};

	return <BadgeContext.Provider value={{ updateTrigger, refreshBadges }}>{children}</BadgeContext.Provider>;
};

// Hook สำหรับเรียกใช้ในหน้าต่างๆ
export const useBadge = () => useContext(BadgeContext);
