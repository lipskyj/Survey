/**
 * pages.config.js - Page routing configuration
 * 
 * This file is AUTO-GENERATED. Do not add imports or modify PAGES manually.
 * Pages are auto-registered when you create files in the ./pages/ folder.
 * 
 * THE ONLY EDITABLE VALUE: mainPage
 * This controls which page is the landing page (shown when users visit the app).
 * 
 * Example file structure:
 * 
 *   import HomePage from './pages/HomePage';
 *   import Dashboard from './pages/Dashboard';
 *   import Settings from './pages/Settings';
 *   
 *   export const PAGES = {
 *       "HomePage": HomePage,
 *       "Dashboard": Dashboard,
 *       "Settings": Settings,
 *   }
 *   
 *   export const pagesConfig = {
 *       mainPage: "HomePage",
 *       Pages: PAGES,
 *   };
 * 
 * Example with Layout (wraps all pages):
 *
 *   import Home from './pages/Home';
 *   import Settings from './pages/Settings';
 *   import __Layout from './Layout.jsx';
 *
 *   export const PAGES = {
 *       "Home": Home,
 *       "Settings": Settings,
 *   }
 *
 *   export const pagesConfig = {
 *       mainPage: "Home",
 *       Pages: PAGES,
 *       Layout: __Layout,
 *   };
 *
 * To change the main page from HomePage to Dashboard, use find_replace:
 *   Old: mainPage: "HomePage",
 *   New: mainPage: "Dashboard",
 *
 * The mainPage value must match a key in the PAGES object exactly.
 */
import AIInsights from './pages/AIInsights';
import ActivityDescription from './pages/ActivityDescription';
import AddQuestion from './pages/AddQuestion';
import AdminPromptFeedback from './pages/AdminPromptFeedback';
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
import SurveyLength from './pages/SurveyLength';
import SurveyType from './pages/SurveyType';
import __Layout from './Layout.jsx';


export const PAGES = {
    "AIInsights": AIInsights,
    "ActivityDescription": ActivityDescription,
    "AddQuestion": AddQuestion,
    "AdminPromptFeedback": AdminPromptFeedback,
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
    "SurveyLength": SurveyLength,
    "SurveyType": SurveyType,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};