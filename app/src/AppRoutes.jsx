import { Routes, Route, BrowserRouter } from "react-router-dom";
import { lazy, Suspense } from "react";
import LoadingScreen from "./component/LoadingScreen.jsx";

const NotFound = lazy(() => import("./pages/NotFound"));
const AuthenticationForm = lazy(() => import("./pages/AuthenticationTitle/login.jsx"));

const RequestExam = lazy(() => import("./component/RequestExam.jsx"));
const RequestExamCancel = lazy(() => import("./component/RequestExamCancel.jsx"));
const RequestEngTest = lazy(() => import("./component/RequestEngTest.jsx"));
const RequestThesisProposal = lazy(() => import("./component/RequestThesisProposal.jsx"));
const PostponeProposalExam = lazy(() => import("./component/PostponeProposalExam.jsx"));
const RequestThesisDefense = lazy(() => import("./component/RequestThesisDefense.jsx"));
const PostponeDefenseExam = lazy(() => import("./component/PostponeDefenseExam.jsx"));
const PlagiarismReport = lazy(() => import("./component/PlagiarismReport.jsx"));
const RequestGraduation = lazy(() => import("./component/RequestGraduation.jsx"));
const PlagiarismProposal = lazy(() => import("./component/PlagiarismProposal.jsx"));
const PlagiarismDefense = lazy(() => import("./component/PlagiarismDefense.jsx"));

const Chairpersons = lazy(() => import("./pages/chairpersons/Chairpersons.jsx"));

const Advisor = lazy(() => import("./pages/Advisor/Advisor.jsx"));

const Research_advisor = lazy(() => import("./pages/research_advisor/research_advisor.jsx"));

const RegistrarOfficer = lazy(() => import("./pages/RegistrarOfficer/RegistrarOfficer.jsx"));
const ExamScheduleSetupPage = lazy(() => import("./pages/RegistrarOfficer/ExamScheduleSetupPage.jsx"));
const AssignMajorOfficer = lazy(() => import("./pages/RegistrarOfficer/AssignMajorOfficer.jsx"));
const ExamResultsPrint = lazy(() => import("./pages/RegistrarOfficer/ExamResultsPrint.jsx"));
const ExamProposalResultsPrint = lazy(() => import("./pages/RegistrarOfficer/ExamProposalResultsPrint.jsx"));
const ExamDefenseResultsPrint = lazy(() => import("./pages/RegistrarOfficer/ExamDefenseResultsPrint.jsx"));

const Student = lazy(() => import("./pages/student/Student.jsx"));

const Dean = lazy(() => import("./pages/dean/dean.jsx"));

const MajorOfficer = lazy(() => import("./pages/MajorOfficer/MajorOfficer.jsx"));
const AssignChairpersons = lazy(() => import("./pages/MajorOfficer/AssignChairpersons.jsx"));
const CourseRegistration = lazy(() => import("./pages/MajorOfficer/CourseRegistration.jsx"));
const ExamEligibleListPrint = lazy(() => import("./pages/MajorOfficer/ExamEligibleListPrint.jsx"));
const ExamResults = lazy(() => import("./pages/MajorOfficer/ExamResults.jsx"));
const ExamProposalResults = lazy(() => import("./pages/MajorOfficer/ExamProposalResults.jsx"));
const ExamDefenseResults = lazy(() => import("./pages/MajorOfficer/ExamDefenseResults.jsx"));
function AppRoutes() {
	return (
		<BrowserRouter>
			<Suspense fallback={<LoadingScreen />}>
				<Routes>
					<Route path="*" element={<NotFound />} />
					<Route path="/login" element={<AuthenticationForm />} />

					<Route path="/registrar-officer" element={<RegistrarOfficer />}>
						<Route path="RequestExam/:type" element={<RequestExam />} />
						<Route path="RequestEngTest" element={<RequestEngTest />} />
						<Route path="RequestThesisProposal" element={<RequestThesisProposal />} />
						<Route path="RequestThesisDefense" element={<RequestThesisDefense />} />
						<Route path="ExamScheduleSetupPage" element={<ExamScheduleSetupPage />} />
						<Route path="assign-major-officer" element={<AssignMajorOfficer />} />
						<Route path="ExamResultsPrint" element={<ExamResultsPrint />} />
						<Route path="ExamProposalResultsPrint" element={<ExamProposalResultsPrint />} />
						<Route path="ExamDefenseResultsPrint" element={<ExamDefenseResultsPrint />} />
					</Route>

					<Route path="/student" element={<Student />}>
						<Route path="RequestExam" element={<RequestExam />} />
						<Route path="RequestExamCancel" element={<RequestExamCancel />} />
						<Route path="RequestEngTest" element={<RequestEngTest />} />
						<Route path="RequestThesisProposal" element={<RequestThesisProposal />} />
						<Route path="PostponeProposalExam" element={<PostponeProposalExam />} />
						<Route path="RequestThesisDefense" element={<RequestThesisDefense />} />
						<Route path="PostponeDefenseExam" element={<PostponeDefenseExam />} />
						<Route path="PlagiarismReport" element={<PlagiarismReport />} />
						<Route path="RequestGraduation" element={<RequestGraduation />} />
						<Route path="PlagiarismProposal" element={<PlagiarismProposal />} />
						<Route path="PlagiarismDefense" element={<PlagiarismDefense />} />
					</Route>

					<Route path="/advisor" element={<Advisor />}>
						<Route path="RequestExam" element={<RequestExam />} />
						<Route path="RequestExamCancel" element={<RequestExamCancel />} />
						<Route path="RequestEngTest" element={<RequestEngTest />} />
						<Route path="RequestThesisProposal" element={<RequestThesisProposal />} />
						<Route path="PostponeProposalExam" element={<PostponeProposalExam />} />
						<Route path="RequestThesisDefense" element={<RequestThesisDefense />} />
						<Route path="PostponeDefenseExam" element={<PostponeDefenseExam />} />
						<Route path="PlagiarismReport" element={<PlagiarismReport />} />
						<Route path="RequestGraduation" element={<RequestGraduation />} />
						<Route path="PlagiarismProposal" element={<PlagiarismProposal />} />
						<Route path="PlagiarismDefense" element={<PlagiarismDefense />} />
					</Route>

					<Route path="/research_advisor" element={<Research_advisor />}>
						<Route path="RequestThesisProposal" element={<RequestThesisProposal />} />
						<Route path="PostponeProposalExam" element={<PostponeProposalExam />} />
						<Route path="RequestThesisDefense" element={<RequestThesisDefense />} />
						<Route path="PostponeDefenseExam" element={<PostponeDefenseExam />} />
						<Route path="PlagiarismReport" element={<PlagiarismReport />} />
						<Route path="RequestGraduation" element={<RequestGraduation />} />
						<Route path="PlagiarismProposal" element={<PlagiarismProposal />} />
						<Route path="PlagiarismDefense" element={<PlagiarismDefense />} />
					</Route>

					<Route path="/chairpersons" element={<Chairpersons />}>
						<Route path="RequestExam" element={<RequestExam />} />
						<Route path="RequestExamCancel" element={<RequestExamCancel />} />
						<Route path="RequestEngTest" element={<RequestEngTest />} />
						<Route path="RequestThesisProposal" element={<RequestThesisProposal />} />
						<Route path="PostponeProposalExam" element={<PostponeProposalExam />} />
						<Route path="RequestThesisDefense" element={<RequestThesisDefense />} />
						<Route path="PostponeDefenseExam" element={<PostponeDefenseExam />} />
						<Route path="PlagiarismReport" element={<PlagiarismReport />} />
						<Route path="RequestGraduation" element={<RequestGraduation />} />
						<Route path="PlagiarismProposal" element={<PlagiarismProposal />} />
						<Route path="PlagiarismDefense" element={<PlagiarismDefense />} />
					</Route>

					<Route path="/dean" element={<Dean />}>
						<Route path="RequestExam" element={<RequestExam />} />
						<Route path="RequestExamCancel" element={<RequestExamCancel />} />
					</Route>

					<Route path="/major-officer" element={<MajorOfficer />}>
						<Route path="CourseRegistration" element={<CourseRegistration />} />
						<Route path="AssignChairpersons" element={<AssignChairpersons />} />
						<Route path="ExamEligibleListPrint" element={<ExamEligibleListPrint />} />
						<Route path="ExamResults" element={<ExamResults />} />
						<Route path="ExamProposalResults" element={<ExamProposalResults />} />
						<Route path="ExamDefenseResults" element={<ExamDefenseResults />} />
					</Route>
				</Routes>
			</Suspense>
		</BrowserRouter>
	);
}

export default AppRoutes;
