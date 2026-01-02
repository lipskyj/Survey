import Home from './pages/Home';
import ActivityDescription from './pages/ActivityDescription';
import Audience from './pages/Audience';
import GradeRange from './pages/GradeRange';
import EventType from './pages/EventType';
import ContentFocus from './pages/ContentFocus';
import EvaluationGoal from './pages/EvaluationGoal';
import SuccessDefinition from './pages/SuccessDefinition';
import ProfileSummary from './pages/ProfileSummary';
import GenerateSurvey from './pages/GenerateSurvey';
import SurveyEditor from './pages/SurveyEditor';
import EditQuestion from './pages/EditQuestion';
import AddQuestion from './pages/AddQuestion';
import PublishShare from './pages/PublishShare';
import RespondIntro from './pages/RespondIntro';
import RespondQuestion from './pages/RespondQuestion';
import RespondComplete from './pages/RespondComplete';
import SurveyManagement from './pages/SurveyManagement';
import ResultsOverview from './pages/ResultsOverview';
import ResultsByQuestion from './pages/ResultsByQuestion';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Home": Home,
    "ActivityDescription": ActivityDescription,
    "Audience": Audience,
    "GradeRange": GradeRange,
    "EventType": EventType,
    "ContentFocus": ContentFocus,
    "EvaluationGoal": EvaluationGoal,
    "SuccessDefinition": SuccessDefinition,
    "ProfileSummary": ProfileSummary,
    "GenerateSurvey": GenerateSurvey,
    "SurveyEditor": SurveyEditor,
    "EditQuestion": EditQuestion,
    "AddQuestion": AddQuestion,
    "PublishShare": PublishShare,
    "RespondIntro": RespondIntro,
    "RespondQuestion": RespondQuestion,
    "RespondComplete": RespondComplete,
    "SurveyManagement": SurveyManagement,
    "ResultsOverview": ResultsOverview,
    "ResultsByQuestion": ResultsByQuestion,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};