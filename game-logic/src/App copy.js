import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from './firebase';
import { doc, getDoc } from 'firebase/firestore';

import MainLayout from './layouts/MainLayout';
import AdminPage from './components/AdminPage';
import TeacherDashboard from './components/TeacherDashboard';
import GameApp from './GameApp';
import TeacherLobby from './components/TeacherLobby';
import QuizEditor from './components/QuizEditor';

// Component TeacherRoute đã được viết rất tốt, giữ nguyên nó
const TeacherRoute = ({ children }) => {
    const [user, loading] = useAuthState(auth);
    const [userData, setUserData] = useState(null);
    const [isLoadingData, setIsLoadingData] = useState(true); // Thêm state loading riêng

    useEffect(() => {
        const fetchUserData = async () => {
            if (user) {
                try {
                    const userSnap = await getDoc(doc(db, 'users', user.uid));
                    if (userSnap.exists()) {
                        setUserData(userSnap.data());
                    } else {
                        // Xử lý trường hợp user đã auth nhưng chưa có document trong 'users'
                        setUserData({ role: 'student' }); // Mặc định là student nếu không có dữ liệu
                    }
                } catch (error) {
                    console.error("Permission denied when fetching user data in TeacherRoute:", error);
                    // Có thể chuyển hướng đến trang lỗi ở đây
                } finally {
                    setIsLoadingData(false);
                }
            } else if (!loading) {
                // Nếu không có user và auth không còn loading -> quá trình hoàn tất
                setIsLoadingData(false);
            }
        };
        fetchUserData();
    }, [user, loading]);

    // Chờ cả auth và fetch data hoàn tất
    if (loading || isLoadingData) {
        return <div className="screen-container"><h1>Đang tải...</h1></div>;
    }
    
    const isAuthorized = user && userData && (userData.role === 'admin' || userData.role === 'teacher');
    
    if (!isAuthorized) {
        // Chuyển hướng nếu không được phép
        return <Navigate to="/" replace />;
    }
    
    // Render component con nếu đã được xác thực và có quyền
    return children;
};

// Component ProtectedRoute (cần được định nghĩa rõ ràng)
// Giả sử nó chỉ kiểm tra đăng nhập cho admin
const ProtectedRoute = ({ children }) => {
    const [user, loading] = useAuthState(auth);
    // Bạn cũng cần logic tương tự TeacherRoute ở đây nếu cần kiểm tra role 'admin'
    if (loading) {
        return <div className="screen-container"><h1>Đang tải...</h1></div>;
    }
    if (!user) {
        return <Navigate to="/login" replace />; // Chuyển đến trang login nếu chưa đăng nhập
    }
    // Ở đây có thể thêm logic kiểm tra role admin nếu cần
    return children;
};


// ----- COMPONENT APP CHÍNH (ĐÃ ĐƯỢC DỌN DẸP) -----
// Không còn bất kỳ useEffect hay useState nào để lấy dữ liệu ở đây
function App() {
  return (
    <MainLayout>
      <Routes>
        {/* Routes cho Super Admin */}
        <Route path="/admin/*" element={<ProtectedRoute><AdminPage /></ProtectedRoute>} />
        <Route path="/admin/quiz/new" element={<ProtectedRoute><QuizEditor /></ProtectedRoute>} />
        <Route path="/admin/quiz/:quizId" element={<ProtectedRoute><QuizEditor /></ProtectedRoute>} />

        {/* Routes cho Giáo viên */}
        <Route path="/dashboard/:teacherSlug" element={<TeacherRoute><TeacherDashboard /></TeacherRoute>} />
        <Route path="/dashboard/:teacherSlug/quiz/new" element={<TeacherRoute><QuizEditor /></TeacherRoute>} />
        <Route path="/dashboard/:teacherSlug/quiz/:quizId" element={<TeacherRoute><QuizEditor /></TeacherRoute>} />
        
        {/* Routes Công khai */}
        <Route path="/:teacherSlug" element={<TeacherLobby />} />
        <Route path="/" element={<GameApp />} />
      </Routes>
    </MainLayout>
  );
}

export default App;