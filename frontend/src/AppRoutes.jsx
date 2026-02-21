import { Routes, Route, BrowserRouter, Navigate } from "react-router-dom";
import { lazy, Suspense } from "react";
import LoadingScreen from "./component/LoadingScreen.jsx";

const NotFound = lazy(() => import("./pages/NotFound"));
const AuthenticationForm = lazy(() => import("./pages/AuthenticationTitle/login.jsx"));
const Personnel = lazy(() => import("./pages/personnel.jsx"));
const Manual = lazy(() => import("./pages/Manual.jsx"));

const RequestExam = lazy(() => import("./pages/RequestExam.jsx"));
const RequestExamCancel = lazy(() => import("./pages/RequestExamCancel.jsx"));
const RequestEngTest = lazy(() => import("./pages/RequestEngTest.jsx"));
const RequestThesisProposal = lazy(() => import("./pages/RequestThesisProposal.jsx"));
const RequestThesisDefense = lazy(() => import("./pages/RequestThesisDefense.jsx"));

const Chairpersons = lazy(() => import("./pages/chairpersons/Chairpersons.jsx"));

const Advisor = lazy(() => import("./pages/Advisor/Advisor.jsx"));

const Research_advisor = lazy(() => import("./pages/research_advisor/research_advisor.jsx"));

const RegistrarOfficer = lazy(() => import("./pages/RegistrarOfficer/RegistrarOfficer.jsx"));
const CourseRegistrationR = lazy(() => import("./pages/RegistrarOfficer/CourseRegistrationR.jsx"));
const ExamScheduleSetupPage = lazy(() => import("./pages/RegistrarOfficer/ExamScheduleSetupPage.jsx"));
const AssignMajorOfficer = lazy(() => import("./pages/RegistrarOfficer/AssignMajorOfficer.jsx"));

const Student = lazy(() => import("./pages/student/Student.jsx"));

const Dean = lazy(() => import("./pages/dean/dean.jsx"));

const MajorOfficer = lazy(() => import("./pages/MajorOfficer/MajorOfficer.jsx"));
const PrintExam = lazy(() => import("./pages/MajorOfficer/PrintExam.jsx"));
const PrintEngTest = lazy(() => import("./pages/MajorOfficer/PrintEngTest.jsx"));
const PrintThesisProposal = lazy(() => import("./pages/MajorOfficer/PrintThesisProposal.jsx"));
const PrintThesisDefense = lazy(() => import("./pages/MajorOfficer/PrintThesisDefense.jsx"));
const ExamResults = lazy(() => import("./pages/MajorOfficer/ExamResults.jsx"));
const ExamProposalResults = lazy(() => import("./pages/MajorOfficer/ExamProposalResults.jsx"));
const ExamDefenseResults = lazy(() => import("./pages/MajorOfficer/ExamDefenseResults.jsx"));
const CourseRegistrationM = lazy(() => import("./pages/MajorOfficer/CourseRegistrationM.jsx"));
const AssignChairpersons = lazy(() => import("./pages/MajorOfficer/AssignChairpersons.jsx"));

function AppRoutes() {
	return (
		<BrowserRouter>
			<Suspense fallback={<LoadingScreen />}>
				<Routes>
					<Route path="*" element={<NotFound />} />
					<Route path="/" element={<Navigate to="/login" replace />} />
					<Route path="/login" element={<AuthenticationForm />} />
					<Route path="/personnel" element={<Personnel />} />

					<Route path="/registrar-officer" element={<RegistrarOfficer />}>
						<Route path="CourseRegistration" element={<CourseRegistrationR />} />
						<Route path="RequestExam/:type" element={<RequestExam />} />
						<Route path="RequestEngTest" element={<RequestEngTest />} />
						<Route path="RequestThesisProposal" element={<RequestThesisProposal />} />
						<Route path="RequestThesisDefense" element={<RequestThesisDefense />} />
						<Route path="ExamScheduleSetupPage" element={<ExamScheduleSetupPage />} />
						<Route path="assign-major-officer" element={<AssignMajorOfficer />} />

						<Route path="ExamResults" element={<ExamResults />} />
						<Route path="ExamProposalResults" element={<ExamProposalResults />} />
						<Route path="ExamDefenseResults" element={<ExamDefenseResults />} />

						<Route path="Manual" element={<Manual />} />
					</Route>
					<Route path="/student" element={<Student />}>
						<Route path="RequestExam" element={<RequestExam />} />
						<Route path="RequestExamCancel" element={<RequestExamCancel />} />
						<Route path="RequestEngTest" element={<RequestEngTest />} />
						<Route path="RequestThesisProposal" element={<RequestThesisProposal />} />
						<Route path="RequestThesisDefense" element={<RequestThesisDefense />} />

						<Route path="Manual" element={<Manual />} />
					</Route>
					<Route path="/advisor" element={<Advisor />}>
						<Route path="RequestExam" element={<RequestExam />} />
						<Route path="RequestExamCancel" element={<RequestExamCancel />} />
						<Route path="RequestEngTest" element={<RequestEngTest />} />

						<Route path="Manual" element={<Manual />} />
					</Route>
					<Route path="/research_advisor" element={<Research_advisor />}>
						<Route path="RequestThesisProposal" element={<RequestThesisProposal />} />
						<Route path="RequestThesisDefense" element={<RequestThesisDefense />} />

						<Route path="Manual" element={<Manual />} />
					</Route>
					<Route path="/chairpersons" element={<Chairpersons />}>
						<Route path="RequestExam" element={<RequestExam />} />
						<Route path="RequestExamCancel" element={<RequestExamCancel />} />
						<Route path="RequestEngTest" element={<RequestEngTest />} />
						<Route path="RequestThesisProposal" element={<RequestThesisProposal />} />
						<Route path="RequestThesisDefense" element={<RequestThesisDefense />} />

						<Route path="Manual" element={<Manual />} />
					</Route>
					<Route path="/dean" element={<Dean />}>
						<Route path="RequestExamCancel" element={<RequestExamCancel />} />

						<Route path="Manual" element={<Manual />} />
					</Route>
					<Route path="/major-officer" element={<MajorOfficer />}>
						<Route path="PrintExam" element={<PrintExam />} />
						<Route path="PrintEngTest" element={<PrintEngTest />} />
						<Route path="PrintThesisProposal" element={<PrintThesisProposal />} />
						<Route path="PrintThesisDefense" element={<PrintThesisDefense />} />

						<Route path="RequestExam" element={<RequestExam />} />
						<Route path="RequestEngTest" element={<RequestEngTest />} />
						<Route path="RequestThesisProposal" element={<RequestThesisProposal />} />
						<Route path="RequestThesisDefense" element={<RequestThesisDefense />} />

						<Route path="ExamResults" element={<ExamResults />} />
						<Route path="ExamProposalResults" element={<ExamProposalResults />} />
						<Route path="ExamDefenseResults" element={<ExamDefenseResults />} />

						<Route path="CourseRegistration" element={<CourseRegistrationM />} />
						<Route path="AssignChairpersons" element={<AssignChairpersons />} />

						<Route path="Manual" element={<Manual />} />
					</Route>
				</Routes>
			</Suspense>
		</BrowserRouter>
	);
}

export default AppRoutes;
