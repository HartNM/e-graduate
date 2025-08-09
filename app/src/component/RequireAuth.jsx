import React from "react";
import { Navigate } from "react-router-dom";

const RequireAuth = ({ children }) => {
  const token = localStorage.getItem("token");

  if (!token) {
    // ถ้าไม่มี token, redirect ไป /login โดยไม่เก็บตำแหน่งเดิม
    return <Navigate to="/login" replace />;
  }

  // มี token ให้แสดงเนื้อหา
  return children;
};

export default RequireAuth;