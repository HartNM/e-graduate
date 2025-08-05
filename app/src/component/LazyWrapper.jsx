// ./component/LazyWrapper.jsx
import { Suspense } from "react";
import LoadingScreen from "./LoadingScreen";

const LazyWrapper = ({ children }) => {
  return <Suspense fallback={<LoadingScreen />}>{children}</Suspense>;
};

export default LazyWrapper;
