import { useState, useEffect } from "react";
import axios from "axios";
import { useBadge } from "../context/BadgeContext";

const useMenuWithBadge = (initialMenu) => {
	const [menuItems, setMenuItems] = useState(initialMenu);
	const BASE_URL = import.meta.env.VITE_API_URL;
	const token = localStorage.getItem("token");

	const { updateTrigger } = useBadge();

	useEffect(() => {
		if (!token) return;

		const fetchAllCounts = async () => {
			try {
				const updatedMenuItems = await Promise.all(
					initialMenu.map(async (item) => {
						// 🟢 กรณีที่ 1: มีเมนูย่อย (links เป็น Array)
						if (item.links && Array.isArray(item.links)) {
							const subLinksWithCounts = await Promise.all(
								item.links.map(async (subLink) => {
									// เช็คว่ามี type ให้ดึงข้อมูลหรือไม่
									if (subLink.type) {
										try {
											const res = await axios.get(`${BASE_URL}/api/countRequest`, {
												params: {
													type: subLink.type,
													status: subLink.status, // ส่ง status ไปด้วย (ถ้ามี)
												},
												headers: { Authorization: `Bearer ${token}` },
											});
											return { ...subLink, badge: res.data.count || 0 };
										} catch (e) {
											return { ...subLink, badge: 0 };
										}
									}
									return subLink;
								}),
							);

							// รวมยอด Badge ของลูกๆ มาโชว์ที่เมนูแม่
							const totalCount = subLinksWithCounts.reduce((sum, sl) => sum + (sl.badge || 0), 0);

							return {
								...item,
								links: subLinksWithCounts,
								badge: totalCount,
							};
						}

						// 🟢 กรณีที่ 2: เป็นเมนูชั้นเดียว (links เป็น String) แต่มี type
						if (item.type) {
							try {
								const res = await axios.get(`${BASE_URL}/api/countRequest`, {
									params: {
										type: item.type,
										status: item.status,
									},
									headers: { Authorization: `Bearer ${token}` },
								});
								return { ...item, badge: res.data.count || 0 };
							} catch (e) {
								return { ...item, badge: 0 };
							}
						}

						// กรณีไม่มีการดึงข้อมูล
						return item;
					}),
				);

				setMenuItems(updatedMenuItems);
			} catch (error) {
				console.error("Error fetching badges:", error);
			}
		};

		fetchAllCounts();
	}, [initialMenu, BASE_URL, token, updateTrigger]);

	return menuItems;
};

export default useMenuWithBadge;
