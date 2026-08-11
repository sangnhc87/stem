// File: ProtectedRoute.js
import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from './firebase';

const ProtectedRoute = ({ children }) => {
    const [user, loadingAuth] = useAuthState(auth);
    const [claims, setClaims] = useState(null);
    const [isCheckingClaims, setIsCheckingClaims] = useState(true);

    useEffect(() => {
        if (loadingAuth) return;
        if (!user) {
            setIsCheckingClaims(false);
            return;
        }

        const checkUserClaims = async () => {
            try {
                const idTokenResult = await user.getIdTokenResult(true);
                setClaims(idTokenResult.claims);
            } catch (error) {
                console.error("Lỗi khi lấy claims:", error);
                setClaims({});
            } finally {
                setIsCheckingClaims(false);
            }
        };

        checkUserClaims();
    }, [user, loadingAuth]);

    if (loadingAuth || isCheckingClaims) {
        return <div className="screen-container d-flex justify-content-center align-items-center vh-100"><div className="spinner-border text-primary" role="status"><span className="visually-hidden">Đang kiểm tra quyền...</span></div></div>;
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    // Chỉ cho phép truy cập nếu claim role là 'admin'
    const isAuthorized = claims && claims.role === 'admin';

    if (!isAuthorized) {
        return <Navigate to="/" replace />;
    }

    return children;
};

export default ProtectedRoute;