import Home from './pages/Home';
import ActivityDescription from './pages/ActivityDescription';
import Audience from './pages/Audience';
import GradeRange from './pages/GradeRange';
import EventType from './pages/EventType';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Home": Home,
    "ActivityDescription": ActivityDescription,
    "Audience": Audience,
    "GradeRange": GradeRange,
    "EventType": EventType,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};