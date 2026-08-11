// File: TeacherRoute.js
import React, { useState, useEffect } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from './firebase';

const TeacherRoute = ({ children }) => {
    const [user, loadingAuth] = useAuthState(auth);
    const [claims, setClaims] = useState(null);
    const [isCheckingClaims, setIsCheckingClaims] = useState(true);
    const { teacherSlug } = useParams();

    useEffect(() => {
        if (loadingAuth) return;
        if (!user) {
            setIsCheckingClaims(false);
            return;
        }

        const checkUserClaims = async () => {
            try {
                // Force refresh token to get the latest claims
                const idTokenResult = await user.getIdTokenResult(true);
                setClaims(idTokenResult.claims);
            } catch (error) {
                console.error("Lỗi khi lấy claims:", error);
                setClaims({}); // Set empty claims on error
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

    // Kiểm tra quyền từ claims của token
    const isAuthorized = claims && (claims.role === 'admin' || claims.role === 'teacher');

    if (!isAuthorized) {
        const redirectTo = teacherSlug ? `/${teacherSlug}` : "/";
        return <Navigate to={redirectTo} replace />;
    }

    return children;
};

export default TeacherRoute;