import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import GradeDashboard from './pages/GradeDashboard';
import LessonView from './pages/LessonView';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="grade/:grade" element={<GradeDashboard />} />
          <Route path="grade/:grade/chapter/:chapterId/lesson/:lessonId" element={<LessonView />} />
          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
