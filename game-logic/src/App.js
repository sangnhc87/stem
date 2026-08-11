// src/App.js

import React from 'react';
import { Routes, Route } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import TeacherRoute from './TeacherRoute';
import AdminPage from './components/AdminPage';
import TeacherDashboard from './components/TeacherDashboard';
import GameApp from './GameApp';
import TeacherLobby from './components/TeacherLobby';
import QuizEditor from './components/QuizEditor';
import StudentJoin from './components/StudentJoin';
import OcrAdminPage from './components/OcrAdminPage'; // ✨ IMPORT TRANG MỚI
import DeviceAdminPage from './components/DeviceAdminPage'; // thay OcrAdminPage
import SieuTriTueGame from './components/SieuTriTue/Game';
function App() {
  return (
    <MainLayout>
      <Routes>
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/adminocr" element={<DeviceAdminPage />} />
        <Route path="/admin/ocr" element={<OcrAdminPage />} /> {/* ✨ THÊM ROUTE MỚI */}
        <Route path="/dashboard/:teacherSlug" element={<TeacherRoute><TeacherDashboard /></TeacherRoute>} />
        <Route path="/dashboard/:teacherSlug/quiz/new" element={<TeacherRoute><QuizEditor /></TeacherRoute>} />
        <Route path="/dashboard/:teacherSlug/quiz/:quizId" element={<TeacherRoute><QuizEditor /></TeacherRoute>} />
        <Route path="/:teacherSlug" element={<TeacherLobby />} />
        <Route path="/group/:slug/join" element={<StudentJoin />} />
        <Route path="/sieu-tri-tue" element={<SieuTriTueGame />} />
        <Route path="/" element={<GameApp />} />
      </Routes>
    </MainLayout>
  );
}

export default App;