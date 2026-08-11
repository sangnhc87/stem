import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db, functions } from '../firebase';
import { httpsCallable } from 'firebase/functions';
import { collection, query, where, onSnapshot, doc, getDoc, getDocs } from 'firebase/firestore';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import Swal from 'sweetalert2';
import GameApp from '../GameApp';

// ==================================================================
//    Component con: Quản lý Yêu cầu Tham gia (chỉ dành cho giáo viên)
// ==================================================================
const JoinRequestsManager = ({ groupId, teacherId }) => {
    const [requests, setRequests] = useState([]);
    const [users, setUsers] = useState(new Map());

    useEffect(() => {
        if (!teacherId) return;

        const q = query(
            collection(db, 'joinRequests'), 
            where('teacherId', '==', teacherId), 
            where('status', '==', 'pending')
        );

        const unsub = onSnapshot(q, async (snapshot) => {
            const newRequests = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
            setRequests(newRequests);

            if (newRequests.length > 0) {
                const studentIds = newRequests.map(req => req.studentId);
                const newUsersToFetch = studentIds.filter(id => !users.has(id));

                if (newUsersToFetch.length > 0) {
                    const usersQuery = query(collection(db, 'users'), where('__name__', 'in', newUsersToFetch));
                    const userDocs = await getDocs(usersQuery);
                    setUsers(prevUsers => {
                        const updatedUsers = new Map(prevUsers);
                        userDocs.forEach(doc => updatedUsers.set(doc.id, doc.data()));
                        return updatedUsers;
                    });
                }
            }
        });
        return () => unsub();
    }, [teacherId, users]);

    const handleRequest = async (requestId, studentId, approve) => {
        const actionText = approve ? "Duyệt" : "Từ chối";
        try {
            Swal.fire({ title: `Đang ${actionText.toLowerCase()}...`, allowOutsideClick: false, didOpen: () => Swal.showLoading() });
            const processRequest = httpsCallable(functions, 'processJoinRequest');
            await processRequest({
                requestId,
                studentId,
                groupId,
                approve
            });
            Swal.fire('Thành công', `${actionText} yêu cầu thành công!`, 'success');
        } catch (err) {
            console.error(`Lỗi khi ${actionText.toLowerCase()} yêu cầu:`, err);
            Swal.fire('Lỗi', `Không thể ${actionText.toLowerCase()} yêu cầu. ${err.message}`, 'error');
        }
    };

    if (requests.length === 0) return null;

    return (
        <div className="card mb-4 border-warning">
            <div className="card-header bg-warning-subtle">
                <h5 className="mb-0">Yêu cầu chờ duyệt ({requests.length})</h5>
            </div>
            <ul className="list-group list-group-flush">
                {requests.map(req => {
                    const student = users.get(req.studentId);
                    return (
                        <li key={req.id} className="list-group-item d-flex justify-content-between align-items-center flex-wrap gap-2">
                            <span className="d-flex align-items-center">
                                <img src={student?.photoURL || 'https://via.placeholder.com/30'} alt={student?.displayName} width="30" height="30" className="rounded-circle me-2" />
                                {student?.displayName || 'Đang tải...'}
                            </span>
                            <div>
                                <button className="btn btn-sm btn-success me-2" onClick={() => handleRequest(req.id, req.studentId, true)}>Duyệt</button>
                                <button className="btn btn-sm btn-danger" onClick={() => handleRequest(req.id, req.studentId, false)}>Từ chối</button>
                            </div>
                        </li>
                    );
                })}
            </ul>
        </div>
    );
};


// ==================================================================
//                        Component chính: TeacherLobby
// ==================================================================
const TeacherLobby = () => {
    const { teacherSlug } = useParams();
    const navigate = useNavigate();
    const [currentUser, loadingAuth] = useAuthState(auth);
    const [teacherQuizzes, setTeacherQuizzes] = useState([]);
    const [lobbyData, setLobbyData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedQuiz, setSelectedQuiz] = useState(null);
    
    const [isMember, setIsMember] = useState(false);
    const [isPending, setIsPending] = useState(false);
    
    const handleReturnToLobby = () => setSelectedQuiz(null);

const formatDateTime = (timestamp) => {
    if (!timestamp) return null;
    try {
        let date;
        if (typeof timestamp.toDate === 'function') {
            // Dạng Timestamp gốc từ Firestore (khi dùng onSnapshot)
            date = timestamp.toDate();
        } else if (timestamp._seconds) {
            // ✅ Dạng object từ Cloud Function (đây là phần sửa)
            date = new Date(timestamp._seconds * 1000);
        } else {
            // Dạng chuỗi hoặc số (dự phòng)
            date = new Date(timestamp);
        }

        // Kiểm tra lại lần nữa xem date có hợp lệ không
        if (isNaN(date.getTime())) {
            return 'Ngày không hợp lệ';
        }

        return date.toLocaleString('vi-VN', { 
            day: '2-digit', 
            month: '2-digit', 
            year: 'numeric', 
            hour: '2-digit', 
            minute: '2-digit' 
        });
    } catch (err) {
        console.warn('Lỗi format date:', err);
        return 'Không xác định';
    }
};

    const renderMath = (text) => {
        if (!text) return text;
        return text.replace(/\$([^$]+)\$/g, (match, math) => {
            try {
                return katex.renderToString(math, { throwOnError: false, displayMode: false });
            } catch (err) {
                console.warn('Lỗi render math:', err);
                return match;
            }
        });
    };

    useEffect(() => {
        if (loadingAuth) return;

        const fetchLobbyData = async () => {
            if (!teacherSlug) {
                setError("Không có thông tin lớp học.");
                setLoading(false);
                return;
            }
            try {
                // Gọi HTTP function thay vì callable function
                const functionURL = 'https://asia-southeast1-gamelogic4u.cloudfunctions.net/getLobbyDataBySlugHTTP';
                const response = await fetch(functionURL, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ slug: teacherSlug })
                });
                
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                const result = await response.json();
                setLobbyData(result.data);
                setTeacherQuizzes(result.data.quizzes || []);
            } catch (err) {
                console.error('Lỗi fetch lobby:', err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchLobbyData();
    }, [teacherSlug, loadingAuth]);
    
    useEffect(() => {
        if (!currentUser || !lobbyData?.groupId) {
            setIsMember(false);
            setIsPending(false);
            return;
        }
        
        // ✅ Nếu là giáo viên của lớp này, skip hết các check
        if (lobbyData.teacherId === currentUser.uid) {
            setIsMember(true); // Giáo viên được coi là "member" để vào được
            setIsPending(false);
            return;
        }
        
        let unsubscribe = () => {};

        const checkMembership = async () => {
            const userDocRef = doc(db, 'users', currentUser.uid);
            const userDoc = await getDoc(userDocRef);
            
            if (userDoc.exists() && userDoc.data().groupId === lobbyData.groupId) {
                setIsMember(true);
                setIsPending(false);
            } else {
                setIsMember(false);
                const q = query(
                    collection(db, 'joinRequests'), 
                    where('studentId', '==', currentUser.uid), 
                    where('groupId', '==', lobbyData.groupId), 
                    where('status', '==', 'pending')
                );
                unsubscribe = onSnapshot(q, (snapshot) => setIsPending(!snapshot.empty));
            }
        };
        
        checkMembership();
        return () => unsubscribe();

    }, [currentUser, lobbyData]);

    const handleJoinRequest = async () => {
        if (!lobbyData?.groupId) {
            Swal.fire('Lỗi', 'Không tìm thấy thông tin lớp học.', 'error');
            return;
        }
        
        const confirmResult = await Swal.fire({
            title: 'Xin vào lớp học?',
            text: `Gửi yêu cầu tham gia lớp của ${lobbyData.teacher?.displayName || 'giáo viên'}?`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Gửi yêu cầu',
            cancelButtonText: 'Hủy'
        });
        
        if (!confirmResult.isConfirmed) return;
        
        try {
            Swal.fire({ title: 'Đang gửi yêu cầu...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
            const createJoinRequest = httpsCallable(functions, 'createJoinRequest');
            await createJoinRequest({ groupId: lobbyData.groupId });
            
            // Đợi 500ms để Firestore update
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // Reload membership status
            const userDocRef = doc(db, 'users', currentUser.uid);
            const userDoc = await getDoc(userDocRef);
            
            if (userDoc.exists() && userDoc.data().groupId === lobbyData.groupId) {
                // Đã được auto-approve
                setIsMember(true);
                setIsPending(false);
                await Swal.fire({
                    icon: 'success',
                    title: '🎉 Chào mừng!',
                    text: 'Bạn đã được chấp nhận vào lớp!',
                    confirmButtonText: 'Bắt đầu học'
                });
                window.location.reload();
            } else {
                // Chờ duyệt
                setIsPending(true);
                Swal.fire({
                    icon: 'info',
                    title: 'Yêu cầu đã gửi!',
                    html: `<p>Yêu cầu của bạn đã được gửi tới <b>${lobbyData.teacher?.displayName}</b></p><p class="text-muted">Vui lòng chờ giáo viên duyệt.</p>`,
                    confirmButtonText: 'Đã hiểu'
                });
            }
        } catch (err) {
            console.error('Lỗi khi gửi yêu cầu:', err);
            Swal.fire({
                icon: 'error',
                title: 'Có lỗi xảy ra',
                text: err.message || 'Không thể gửi yêu cầu. Vui lòng thử lại.',
                confirmButtonText: 'Đóng'
            });
        }
    };
    
    if (loading) return (
        <div className="container py-4 text-center">
            <div className="spinner-border text-primary" role="status"><span className="visually-hidden">Loading...</span></div>
            <h3 className="mt-3">Đang tải...</h3>
        </div>
    );
    if (error) return (
        <div className="container py-4 text-center">
            <h3 className="text-danger">Lỗi: {error}</h3>
            <button className="btn btn-secondary mt-2" onClick={() => window.location.reload()}>Thử lại</button>
        </div>
    );

    const isTeacherOfThisClass = currentUser && lobbyData?.teacherId === currentUser.uid;

    // ==================================================================
    //                        PHẦN SỬA LỖI LOGIC
    // ==================================================================
    return (
        <div className="container py-4">
            {selectedQuiz ? (
                // --- KHI ĐÃ CHỌN QUIZ, CHỈ HIỂN THỊ GAME ---
                <GameApp 
                    selectedQuiz={selectedQuiz} 
                    groupId={lobbyData?.groupId}
                    onReturnToLobby={handleReturnToLobby}
                />
            ) : (
                // --- KHI CHƯA CHỌN QUIZ, HIỂN THỊ GIAO DIỆN LOBBY ---
                <>
                    <div className="d-flex align-items-center mb-4">
                        <i className="fas fa-chalkboard-teacher text-primary me-3" style={{ fontSize: '2rem' }}></i>
                        <h2 className="mb-0 fw-bold text-gradient">Lớp của <span className="text-primary">{lobbyData?.teacher?.displayName || 'Giáo viên'}</span></h2>
                    </div>

                    {currentUser && (
                        <div className="text-center mb-4">
                            {isTeacherOfThisClass ? (
                                <div>
                                    <button className="btn btn-primary btn-lg" onClick={() => navigate(`/dashboard/${teacherSlug}`)}>
                                        <i className="fas fa-tachometer-alt me-2"></i>Quản lý lớp học
                                    </button>
                                    <p className="text-muted mt-2">Bạn là giáo viên của lớp này</p>
                                </div>
                            ) : isMember ? (
                                <div className="alert alert-success shadow-sm">
                                    <h5 className="alert-heading"><i className="fas fa-check-circle me-2"></i>Chào mừng bạn!</h5>
                                    <p className="mb-0">Bạn là thành viên của lớp học này. Chọn bộ câu hỏi bên dưới để bắt đầu!</p>
                                </div>
                            ) : isPending ? (
                                <div className="alert alert-warning shadow-sm">
                                    <h5 className="alert-heading"><i className="fas fa-clock me-2"></i>Đang chờ duyệt</h5>
                                    <p className="mb-0">Yêu cầu tham gia của bạn đã được gửi tới giáo viên. Vui lòng chờ phản hồi.</p>
                                </div>
                            ) : (
                                <div>
                                    <button 
                                        className="btn btn-lg btn-success shadow" 
                                        onClick={handleJoinRequest}
                                    >
                                        <i className="fas fa-user-plus me-2"></i>Xin vào lớp học
                                    </button>
                                    <p className="text-muted mt-2">Bạn cần tham gia lớp để làm bài kiểm tra</p>
                                </div>
                            )}
                        </div>
                    )}
                    
                    {!currentUser && (
                        <div className="alert alert-info text-center">
                            <i className="fas fa-info-circle me-2"></i>
                            Vui lòng đăng nhập để tham gia lớp học và làm bài kiểm tra
                        </div>
                    )}
                    
                    {isTeacherOfThisClass && <JoinRequestsManager groupId={lobbyData.groupId} teacherId={lobbyData.teacherId} />}
                    
                    <div className="row mb-4">
                        <div className="col-12">
                            <h3 className="mb-3"><i className="fas fa-book-open me-2 text-info"></i>Bộ câu hỏi</h3>
                            {teacherQuizzes.length === 0 ? (
                                <div className="alert alert-info">Chưa có bộ câu hỏi nào.</div>
                            ) : (
                                <div className="row">
                                    {teacherQuizzes.map(q => {
                                        const openTimeStr = formatDateTime(q.openTime);
                                        const closeTimeStr = formatDateTime(q.closeTime);
                                        const hasTime = openTimeStr || closeTimeStr;
                                        const timeText = hasTime ? (
                                            <small className="text-muted d-block mt-1">
                                                {openTimeStr && `Mở: ${openTimeStr}`}
                                                {openTimeStr && closeTimeStr && ' | '}
                                                {closeTimeStr && `Đóng: ${closeTimeStr}`}
                                            </small>
                                        ) : null;

                                        return (
                                            <div key={q.id} className="col-md-6 col-lg-4 mb-3">
                                                <div className="card h-100 shadow-sm border-0">
                                                    <div className="card-body d-flex flex-column">
                                                        <div className="flex-grow-1">
                                                            <h5 className="card-title fw-bold" dangerouslySetInnerHTML={{ __html: renderMath(q.title || 'Untitled') }}></h5>
                                                            <p className="card-text text-muted small">{q.description || 'Chưa có mô tả'}</p>
                                                            {timeText}
                                                        </div>
                                                        <div className="d-flex justify-content-between align-items-center mt-3">
                                                            <div className="d-flex align-items-center">
                                                                <span className="badge bg-primary me-1">{q.questionCount || q.questions?.length || 0} câu</span>
                                                                {q.hasPassword && <i className="fas fa-lock text-warning" title="Yêu cầu mật khẩu"></i>}
                                                            </div>
                                                            {isTeacherOfThisClass ? (
                                                                <div className="btn-group" role="group">
                                                                    <button className="btn btn-outline-primary btn-sm" onClick={() => setSelectedQuiz(q)} title="Test bộ câu hỏi">
                                                                        <i className="fas fa-play me-1"></i>Vào thi
                                                                    </button>
                                                                    <button className="btn btn-outline-success btn-sm" onClick={() => navigate(`/dashboard/${teacherSlug}/quiz/${q.id}`)} title="Chỉnh sửa">
                                                                        <i className="fas fa-edit me-1"></i>Sửa
                                                                    </button>
                                                                </div>
                                                            ) : (
                                                                <button className="btn btn-primary btn-sm" onClick={() => setSelectedQuiz(q)} disabled={!isMember}><i className="fas fa-play me-1"></i>Vào thi</button>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default TeacherLobby;