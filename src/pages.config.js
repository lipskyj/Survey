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
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};