import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, functions } from '../firebase';
import { httpsCallable } from 'firebase/functions';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '../firebase'; // Import db nếu cần

const StudentJoin = () => {
    const { slug } = useParams();
    const [currentUser, loadingAuth] = useAuthState(auth);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    const handleRequestJoin = async () => {
        if (!currentUser) {
            setMessage('Vui lòng đăng nhập để gửi yêu cầu.');
            return;
        }
        if (loading) return;
        setLoading(true);
        setMessage('');
        try {
            const getGroupId = httpsCallable(functions, 'getGroupIdBySlug');
            const { data } = await getGroupId({ slug });
            await addDoc(collection(db, 'joinRequests'), {
                studentId: currentUser.uid,
                groupId: data.groupId,
                status: 'pending',
                timestamp: Timestamp.now()
            });
            setMessage('Yêu cầu đã gửi! Chờ giáo viên duyệt.');
        } catch (err) {
            console.error('Lỗi gửi yêu cầu:', err);
            setMessage('Lỗi: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    if (loadingAuth) return <div>Đang tải...</div>;

    return (
        <div className="container py-4">
            <h2>Tham gia lớp qua đường dẫn /{slug}</h2>
            <p>Vui lòng gửi yêu cầu để giáo viên duyệt.</p>
            <button className="btn btn-primary" onClick={handleRequestJoin} disabled={loading || !currentUser}>
                {loading ? 'Đang gửi...' : 'Gửi yêu cầu tham gia'}
            </button>
            {message && <div className={`alert mt-3 ${message.includes('Lỗi') ? 'alert-danger' : 'alert-success'}`}>{message}</div>}
        </div>
    );
};

export default StudentJoin;