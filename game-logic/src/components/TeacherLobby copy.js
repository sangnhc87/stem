import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db, functions } from '../firebase';
import { httpsCallable } from 'firebase/functions';
import { collection, query, where, onSnapshot, updateDoc, doc, getDoc, deleteDoc } from 'firebase/firestore';
import GameApp from '../GameApp'; // Giữ nguyên component cũ của bạn

const TeacherLobby = () => {
    const { teacherSlug } = useParams();
    const navigate = useNavigate();
    const [currentUser, loadingAuth] = useAuthState(auth);
    const [teacherQuizzes, setTeacherQuizzes] = useState([]);
    const [teacherInfo, setTeacherInfo] = useState(null);
    const [requests, setRequests] = useState([]);
    const [users, setUsers] = useState([]); // Để fetch tên student
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (loadingAuth) return;

        let unsubRequests;

        const fetchTeacherData = async () => {
            if (!teacherSlug) {
                setError("Không có thông tin lớp học.");
                setLoading(false);
                return;
            }
            try {
                const getLobbyData = httpsCallable(functions, 'getLobbyDataBySlug');
                const result = await getLobbyData({ slug: teacherSlug });
                setTeacherInfo(result.data.teacher);
                setTeacherQuizzes(result.data.quizzes || []);

                // Fetch requests chỉ nếu là teacher của lớp
                if (currentUser && result.data.teacherId === currentUser.uid) {
                    console.log('Setting up requests listener for teacher:', currentUser.uid, 'groupId:', result.data.groupId);
                    const q = query(collection(db, 'joinRequests'), 
                                    where('groupId', '==', result.data.groupId), 
                                    where('status', '==', 'pending'));
                    unsubRequests = onSnapshot(q, 
                        (snap) => {
                            const newRequests = snap.docs.map(d => ({ id: d.id, ...d.data() }));
                            // Fetch tên student async cho mỗi request
                            newRequests.forEach(async (req) => {
                                if (!users.find(u => u.id === req.studentId)) {
                                    try {
                                        const studentDoc = await getDoc(doc(db, 'users', req.studentId));
                                        if (studentDoc.exists()) {
                                            setUsers(prev => [...prev, { id: req.studentId, ...studentDoc.data() }]);
                                        }
                                    } catch (fetchErr) {
                                        console.error('Lỗi fetch student name:', fetchErr);
                                    }
                                }
                            });
                            setRequests(newRequests);
                        },
                        (snapshotError) => {
                            console.error('Lỗi load joinRequests:', snapshotError);
                            setError('Không thể tải yêu cầu tham gia: ' + snapshotError.message);
                            setRequests([]);
                        }
                    );
                } else {
                    console.log('Not teacher, skipping requests:', currentUser?.uid, result.data.teacherId);
                }
            } catch (err) {
                console.error('Lỗi fetch lobby:', err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchTeacherData();

        // Cleanup listener
        return () => {
            if (unsubRequests) {
                unsubRequests();
            }
        };
    }, [teacherSlug, loadingAuth, currentUser]);

    const getStudentName = (studentId) => {
        const student = users.find(u => u.id === studentId);
        return student ? student.displayName : studentId;
    };

    const handleApproveRequest = async (requestId, studentId, groupId) => {
        try {
            await updateDoc(doc(db, 'joinRequests', requestId), { status: 'approved' });
            const assignGroup = httpsCallable(functions, 'assignStudentToGroup');
            await assignGroup({ studentId, groupId });
            setRequests(prev => prev.filter(r => r.id !== requestId));
            // Optional: Xóa request sau approve
            // await deleteDoc(doc(db, 'joinRequests', requestId));
        } catch (err) {
            console.error('Lỗi approve:', err);
            alert('Lỗi khi duyệt yêu cầu.');
        }
    };

    const handleRejectRequest = async (requestId) => {
        try {
            await updateDoc(doc(db, 'joinRequests', requestId), { status: 'rejected' });
            setRequests(prev => prev.filter(r => r.id !== requestId));
            // Optional: Delete sau reject
            // await deleteDoc(doc(db, 'joinRequests', requestId));
        } catch (err) {
            console.error('Lỗi reject:', err);
            alert('Lỗi khi từ chối yêu cầu.');
        }
    };

    if (loading) return <div className="container py-4 text-center"><div className="spinner-border text-primary" role="status"><span className="visually-hidden">Loading...</span></div><h3>Đang tải...</h3></div>;
    if (error) return <div className="container py-4 text-center"><h3>Lỗi: {error}</h3></div>;

    return (
        <div className="container py-4">
            <h2>Lớp của {teacherInfo?.displayName || 'Giáo viên'}</h2>
            {/* Hiển thị quizzes - Đơn giản như ban đầu */}
            <div className="mb-4">
                <h3>Bộ câu hỏi</h3>
                {teacherQuizzes.length === 0 ? <p>Chưa có bộ câu hỏi.</p> : (
                    <ul>
                        {teacherQuizzes.map(q => <li key={q.id}>{q.title}</li>)}
                    </ul>
                )}
            </div>
            
            {/* Phần duyệt requests (chỉ hiển thị nếu là teacher) */}
            {currentUser && teacherInfo?.id === currentUser.uid && (
                <div className="card mb-4">
                    <div className="card-body">
                        <h3>Yêu cầu tham gia lớp ({requests.length})</h3>
                        {requests.length === 0 ? (
                            <p>Chưa có yêu cầu nào.</p>
                        ) : (
                            <ul className="list-group">
                                {requests.map(req => (
                                    <li key={req.id} className="list-group-item d-flex justify-content-between align-items-center">
                                        <span>Học sinh: {getStudentName(req.studentId)}</span>
                                        <div>
                                            <button className="btn btn-success btn-sm me-2" onClick={() => handleApproveRequest(req.id, req.studentId, req.groupId)}>
                                                Duyệt
                                            </button>
                                            <button className="btn btn-danger btn-sm" onClick={() => handleRejectRequest(req.id)}>
                                                Từ chối
                                            </button>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
            )}

            <GameApp />
        </div>
    );
};

export default TeacherLobby;