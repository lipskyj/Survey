import AIInsights from './pages/AIInsights';
import ActivityDescription from './pages/ActivityDescription';
import AddQuestion from './pages/AddQuestion';
import AdminPrompts from './pages/AdminPrompts';
import Audience from './pages/Audience';
import BackgroundQuestions from './pages/BackgroundQuestions';
import ContentFocus from './pages/ContentFocus';
import EditQuestion from './pages/EditQuestion';
import EvaluationGoal from './pages/EvaluationGoal';
import EventType from './pages/EventType';
import ExportData from './pages/ExportData';
import GenerateSurvey from './pages/GenerateSurvey';
import GenerateSurveyMultiple from './pages/GenerateSurveyMultiple';
import GradeRange from './pages/GradeRange';
import Home from './pages/Home';
import MeasurementTargets from './pages/MeasurementTargets';
import ProfileSummary from './pages/ProfileSummary';
import PublishShare from './pages/PublishShare';
import RespondComplete from './pages/RespondComplete';
import RespondIntro from './pages/RespondIntro';
import RespondQuestion from './pages/RespondQuestion';
import ResultsByQuestion from './pages/ResultsByQuestion';
import ResultsOverview from './pages/ResultsOverview';
import SuccessDefinition from './pages/SuccessDefinition';
import SurveyEditor from './pages/SurveyEditor';
import SurveyLanguage from './pages/SurveyLanguage';
import SurveyManagement from './pages/SurveyManagement';
import SurveyType from './pages/SurveyType';
import __Layout from './Layout.jsx';


export const PAGES = {
    "AIInsights": AIInsights,
    "ActivityDescription": ActivityDescription,
    "AddQuestion": AddQuestion,
    "AdminPrompts": AdminPrompts,
    "Audience": Audience,
    "BackgroundQuestions": BackgroundQuestions,
    "ContentFocus": ContentFocus,
    "EditQuestion": EditQuestion,
    "EvaluationGoal": EvaluationGoal,
    "EventType": EventType,
    "ExportData": ExportData,
    "GenerateSurvey": GenerateSurvey,
    "GenerateSurveyMultiple": GenerateSurveyMultiple,
    "GradeRange": GradeRange,
    "Home": Home,
    "MeasurementTargets": MeasurementTargets,
    "ProfileSummary": ProfileSummary,
    "PublishShare": PublishShare,
    "RespondComplete": RespondComplete,
    "RespondIntro": RespondIntro,
    "RespondQuestion": RespondQuestion,
    "ResultsByQuestion": ResultsByQuestion,
    "ResultsOverview": ResultsOverview,
    "SuccessDefinition": SuccessDefinition,
    "SurveyEditor": SurveyEditor,
    "SurveyLanguage": SurveyLanguage,
    "SurveyManagement": SurveyManagement,
    "SurveyType": SurveyType,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};