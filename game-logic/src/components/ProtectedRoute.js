// src/components/ProtectedRoute.js
import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';

const ProtectedRoute = ({ children }) => {
  const [user, loading] = useAuthState(auth);
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    const fetchUserData = async () => {
      if (user) {
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          setUserData(userSnap.data());
        }
      }
    };
    fetchUserData();
  }, [user]);

  if (loading || (user && !userData)) {
    return <div className="screen-container"><h1>Đang tải...</h1></div>;
  }

  // Nếu không đăng nhập hoặc không phải admin, chuyển hướng về trang chủ
  if (!user || userData?.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  // Nếu là admin, hiển thị nội dung trang
  return children;
};

export default ProtectedRoute;