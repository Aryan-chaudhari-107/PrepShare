import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ToastProvider } from "./context/ToastContext";

import { FeedPage } from "./pages/FeedPage";
import { ReportDetailPage } from "./pages/ReportDetailPage";
import { DraftReportPage } from "./pages/DraftReportPage";
import { ProfilePage } from "./pages/ProfilePage";
import { CompletedQuestionsPage } from "./pages/CompletedQuestionsPage";
import { BookmarksPage } from "./pages/BookmarksPage";
import { NotificationsPage } from "./pages/NotificationsPage";
import { DraftsArchivePage } from "./pages/DraftsArchivePage";
import { MessagesPage } from "./pages/MessagesPage";
import { NotFoundPage } from "./pages/NotFoundPage";

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            {/* Primary Feed (Stitch Dashboard Feed) */}
            <Route path="/" element={<FeedPage />} />

            {/* Post Detail (Stitch Post Detail Split-Panel) */}
            <Route path="/posts/:postId" element={<ReportDetailPage />} />

            {/* Create Post Wizard (Stitch Create Post) */}
            <Route path="/draft" element={<DraftReportPage />} />

            {/* User Profile (Stitch User Profile) */}
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/users/:userId" element={<ProfilePage />} />

            {/* Messages (Stitch Messages UI with honest status) */}
            <Route path="/messages" element={<MessagesPage />} />

            {/* Solved Questions */}
            <Route path="/completed-questions" element={<CompletedQuestionsPage />} />

            {/* Bookmarks */}
            <Route path="/bookmarks" element={<BookmarksPage />} />

            {/* Notifications */}
            <Route path="/notifications" element={<NotificationsPage />} />

            {/* Drafts Repository */}
            <Route path="/drafts" element={<DraftsArchivePage />} />

            {/* 404 Page */}
            <Route path="/404" element={<NotFoundPage />} />
            <Route path="*" element={<Navigate to="/404" replace />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;

