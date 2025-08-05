// client/src/App.js
import React, { useEffect, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from 'styled-components';
import { useTranslation } from 'react-i18next';
import { GlobalStyle } from './styles/GlobalStyles';
import { theme } from './styles/theme';

// Layouts and Auth
import DashboardLayout from './components/layout/DashboardLayout';
import PublicLayout from './components/layout/PublicLayout';
import ProtectedRoute from './components/auth/ProtectedRoute';

// Course-related pages
import CourseViewPage from './pages/dashboard/CourseViewPage'; 
import LessonContentPage from './pages/dashboard/LessonContentPage'; 
import QuizPage from './pages/dashboard/QuizPage';
import ScoreCardPage from './pages/dashboard/ScoreCardPage';
import CertificatePage from './pages/dashboard/CertificatePage';

// Standalone Pages
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import VerifyPhonePage from './pages/VerifyPhonePage';
import VerifyEmailPage from './pages/VerifyEmailPage';
import TermsOfServicePage from './pages/TermsOfServicePage';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import VerificationPage from './pages/VerificationPage';

// Dashboard Pages
import DashboardPage from './pages/DashboardPage';
import GenerateCoursePage from './pages/dashboard/generate-course/GenerateCoursePage';
import PreGeneratedPage from './pages/dashboard/PreGeneratedPage';
import MyCoursesPage from './pages/dashboard/MyCoursesPage'; 
import MyCertificatesPage from './pages/dashboard/MyCertificatesPage';
import MyStudyGroupsPage from './pages/dashboard/MyStudyGroupsPage';
import HelpSupportPage from './pages/dashboard/HelpSupportPage';
import SeekConnectPage from './pages/dashboard/SeekConnectPage';
import EventsPage from './pages/dashboard/EventsPage';
import BlogsPage from './pages/dashboard/BlogsPage';
import NotificationsPage from './pages/dashboard/NotificationsPage';
import ProfilePage from './pages/dashboard/ProfilePage';
import SubscriptionHistoryPage from './pages/dashboard/SubscriptionHistoryPage';

function App() {
  const { i18n } = useTranslation();

  useEffect(() => {
    document.body.dir = i18n.dir();
  }, [i18n, i18n.language]);

  return (
    <ThemeProvider theme={theme}>
      <GlobalStyle />
      <Suspense fallback={<div>Loading...</div>}>
        <Router>
          <Routes>
            {/* PUBLIC ROUTES */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/verify-phone" element={<VerifyPhonePage />} />
            <Route path="/verify-email" element={<VerifyEmailPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
            <Route path="/verify/:courseId/:userId" element={<VerificationPage />} />
            
            <Route element={<PublicLayout />}>
              <Route path="/public/terms-of-service" element={<TermsOfServicePage />} />
              <Route path="/public/privacy-policy" element={<PrivacyPolicyPage />} />
            </Route>

            {/* PROTECTED ROUTES */}
            <Route element={<ProtectedRoute />}>
              <Route element={<DashboardLayout />}>
                <Route path="/" element={<DashboardPage />} />
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/generate-course" element={<GenerateCoursePage />} />
                <Route path="/pre-generated" element={<PreGeneratedPage />} />
                <Route path="/my-courses" element={<MyCoursesPage />} /> 
                <Route path="/my-certificates" element={<MyCertificatesPage />} />
                <Route path="/my-study-groups" element={<MyStudyGroupsPage />} />
                <Route path="/help-support" element={<HelpSupportPage />} />
                <Route path="/seek-connect" element={<SeekConnectPage />} />
                <Route path="/events" element={<EventsPage />} />
                <Route path="/blogs" element={<BlogsPage />} />
                <Route path="/notifications" element={<NotificationsPage />} />
                <Route path="/subscription-history" element={<SubscriptionHistoryPage />} />
                <Route path="/terms-of-service" element={<TermsOfServicePage />} /> 
                <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
                
                {/* --- THIS IS THE ONLY ADDITION --- */}
                <Route path="/profile" element={<ProfilePage />} />
              </Route>

              <Route path="/course/:courseId" element={<CourseViewPage />}>
                <Route path="lesson/:subtopicId/:lessonId" element={<LessonContentPage />} />
              </Route>

              <Route path="/course/:courseId/quiz" element={<QuizPage />} />
              <Route path="/course/:courseId/score" element={<ScoreCardPage />} />
              <Route path="/course/:courseId/certificate" element={<CertificatePage />} />
            </Route>

            <Route path="*" element={<LoginPage />} />
          </Routes>
        </Router>
      </Suspense>
    </ThemeProvider>
  );
}

export default App;