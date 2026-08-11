import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db, functions } from '../firebase';
import { httpsCallable } from 'firebase/functions';
import { collection, onSnapshot, doc, query, where, deleteDoc, updateDoc, setDoc, addDoc, getDocs, writeBatch, Timestamp, deleteField } from 'firebase/firestore';

const Swal = window.Swal;

const AdminPage = () => {
    const [user, loadingAuth] = useAuthState(auth);
    const navigate = useNavigate();

    const [isAuthorized, setIsAuthorized] = useState(false);

    const [users, setUsers] = useState([]);
    const [groups, setGroups] = useState([]);
    const [publicQuizzes, setPublicQuizzes] = useState([]);
    const [settings, setSettings] = useState({ requireApproval: true });
    
    const [newGroupName, setNewGroupName] = useState('');
    const [newGroupSlug, setNewGroupSlug] = useState('');
    const [notification, setNotification] = useState('');
    
    const [globalStartDate, setGlobalStartDate] = useState('');
    const [globalEndDate, setGlobalEndDate] = useState('');

    const [deleteStartDate, setDeleteStartDate] = useState('');
    const [deleteEndDate, setDeleteEndDate] = useState('');
    const [selectedGroupIdForDelete, setSelectedGroupIdForDelete] = useState('');

    const [filter, setFilter] = useState('all');
    const [sortConfig, setSortConfig] = useState({ key: 'displayName', direction: 'ascending' });

    useEffect(() => {
        if (loadingAuth) return;
        if (!user) {
            navigate('/login');
            return;
        }

        user.getIdTokenResult(true)
            .then((idTokenResult) => {
                console.group("🕵️‍♂️ KIỂM TRA QUYỀN TRUY CẬP ADMIN");
                console.log("Email người dùng:", user.email);
                console.log("Toàn bộ claims trong token:", idTokenResult.claims);
                
                const userRole = idTokenResult.claims.role;
                console.log("Vai trò (role) tìm thấy:", userRole || "KHÔNG CÓ");

                if (userRole === 'admin') {
                    console.log("✅ KẾT QUẢ: Hợp lệ! Người dùng là admin. Cấp quyền truy cập.");
                    console.groupEnd();
                    setIsAuthorized(true);
                } else {
                    console.error("❌ KẾT QUẢ: Không hợp lệ! Quyền 'admin' không được tìm thấy trong token.");
                    console.groupEnd();
                    Swal.fire('Truy cập bị từ chối', 'Bạn không có quyền vào trang này.', 'error');
                    navigate('/');
                }
            })
            .catch((error) => {
                console.group("🕵️‍♂️ KIỂM TRA QUYỀN TRUY CẬP ADMIN");
                console.error("Lỗi nghiêm trọng khi gọi getIdTokenResult:", error);
                console.groupEnd();
                Swal.fire('Lỗi', 'Không thể xác thực quyền của bạn.', 'error');
                navigate('/');
            });
    }, [user, loadingAuth, navigate]);

    useEffect(() => {
        if (!isAuthorized) return;

        console.log("Authorization confirmed. Fetching data...");

        const unsubUsers = onSnapshot(collection(db, 'users'), (snap) => setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() }))));

        const unsubQuizzes = onSnapshot(query(collection(db, 'quizzes'), where('groupId', '==', null)), (snap) => setPublicQuizzes(snap.docs.map(d => ({ id: d.id, ...d.data() }))));

        const unsubGroups = onSnapshot(collection(db, 'groups'), (snap) => setGroups(snap.docs.map(d => ({ id: d.id, ...d.data() }))));

        const unsubSettings = onSnapshot(doc(db, 'settings', 'global'), (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                setSettings(data);
                setGlobalStartDate(data.leaderboardStartDate || '');
                setGlobalEndDate(data.leaderboardEndDate || '');
            }
        });

        return () => { 
            unsubQuizzes();
            unsubUsers();
            unsubGroups();
            unsubSettings();
        };
    }, [isAuthorized]);

    const showNotification = (message) => {
        setNotification(message);
        setTimeout(() => setNotification(''), 4000);
    };

    const handleSetTrialEndDate = async (userId, dateString) => {
        const userRef = doc(db, 'users', userId);
        try {
            if (dateString) {
                const endDate = new Date(dateString);
                endDate.setHours(23, 59, 59, 999);
                const newTimestamp = Timestamp.fromDate(endDate);
                await updateDoc(userRef, { trialEndDate: newTimestamp });
                showNotification('Đã cập nhật ngày hết hạn.');
            } else {
                await updateDoc(userRef, { trialEndDate: deleteField() });
                showNotification('Đã xóa ngày hết hạn.');
            }
        } catch (error) {
            console.error("Lỗi khi cập nhật ngày hết hạn:", error);
            Swal.fire('Lỗi!', 'Không thể cập nhật ngày hết hạn.', 'error');
        }
    };
    
    const sortedAndFilteredUsers = useMemo(() => {
        let filteredUsers = [...users];
        if (filter === 'teacher') {
            filteredUsers = filteredUsers.filter(user => user.role === 'teacher');
        }
        filteredUsers.sort((a, b) => {
            if (a[sortConfig.key] == null) return 1;
            if (b[sortConfig.key] == null) return -1;
            let aValue = a[sortConfig.key];
            let bValue = b[sortConfig.key];
            if (sortConfig.key === 'trialEndDate' && aValue.seconds && bValue.seconds) {
                 aValue = aValue.seconds;
                 bValue = bValue.seconds;
            }
            if (aValue < bValue) return sortConfig.direction === 'ascending' ? -1 : 1;
            if (aValue > bValue) return sortConfig.direction === 'ascending' ? 1 : -1;
            return 0;
        });
        return filteredUsers;
    }, [users, filter, sortConfig]);

    const requestSort = (key) => {
        let direction = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    const handleDeleteUser = async (userId, userName) => {
        const result = await Swal.fire({
            title: `Bạn chắc chắn muốn xóa "${userName}"?`,
            text: "Hành động này sẽ xóa vĩnh viễn tài khoản và không thể hoàn tác!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            confirmButtonText: 'Vâng, xóa người dùng này!',
            cancelButtonText: 'Hủy'
        });
        if (result.isConfirmed) {
            Swal.fire({ title: 'Đang xóa...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
            try {
                const deleteUserFunc = httpsCallable(functions, 'deleteUser');
                await deleteUserFunc({ uid: userId });
                Swal.fire('Đã xóa!', `Người dùng "${userName}" đã được xóa.`, 'success');
            } catch (error) {
                console.error("Lỗi khi gọi Cloud Function deleteUser:", error);
                Swal.fire('Lỗi!', `Không thể xóa người dùng. ${error.message}`, 'error');
            }
        }
    };

    const handleDeleteDataByDateRange = async () => {
        if (!selectedGroupIdForDelete || !deleteStartDate || !deleteEndDate) {
            Swal.fire('Thiếu thông tin', 'Vui lòng chọn Lớp học, ngày bắt đầu và ngày kết thúc.', 'warning');
            return;
        }
        const selectedGroup = groups.find(g => g.id === selectedGroupIdForDelete);
        const targetName = selectedGroup ? selectedGroup.name : "Bài thi Công khai";
        const { value: confirmationText } = await Swal.fire({
            title: '⚠️ HÀNH ĐỘNG CỰC KỲ NGUY HIỂM ⚠️',
            html: `Bạn sắp **XÓA VĨNH VIỄN** toàn bộ dữ liệu thi của "<b>${targetName}</b>" từ ngày <b>${deleteStartDate}</b> đến <b>${deleteEndDate}</b>. <br/><br/>Hành động này <b>KHÔNG THỂ HOÀN TÁC</b>. <br/><br/>Để xác nhận, vui lòng nhập chữ "<b>XÓA</b>" vào ô bên dưới:`,
            input: 'text', inputPlaceholder: 'Nhập XÓA để xác nhận', icon: 'warning', showCancelButton: true,
            confirmButtonText: 'Tôi hiểu rủi ro và xác nhận XÓA', confirmButtonColor: '#d33', cancelButtonText: 'Hủy bỏ',
            inputValidator: (value) => value !== 'XÓA' ? 'Bạn cần nhập chính xác từ "XÓA"!' : null
        });
        if (confirmationText !== 'XÓA') return;
        try {
            Swal.fire({ title: 'Đang xử lý...', html: `Hệ thống đang tìm và xóa dữ liệu của "<b>${targetName}</b>". Vui lòng chờ.`, allowOutsideClick: false, didOpen: () => Swal.showLoading() });
            const start = new Date(deleteStartDate); start.setHours(0, 0, 0, 0);
            const end = new Date(deleteEndDate); end.setHours(23, 59, 59, 999);
            const scoresRef = collection(db, 'scores'); 
            const groupIdCondition = selectedGroupIdForDelete === 'global' ? where('groupId', '==', null) : where('groupId', '==', selectedGroupIdForDelete);
            const q = query(scoresRef, groupIdCondition, where('timestamp', '>=', start), where('timestamp', '<=', end));
            const querySnapshot = await getDocs(q);
            const batch = writeBatch(db);
            let deletedCount = 0;
            querySnapshot.forEach((doc) => { batch.delete(doc.ref); deletedCount++; });
            if (deletedCount > 0) {
                await batch.commit();
                Swal.fire('Thành công!', `Đã xóa thành công ${deletedCount} mục dữ liệu của "${targetName}".`, 'success');
            } else {
                Swal.fire('Không có dữ liệu', `Không tìm thấy dữ liệu thi nào của "${targetName}" trong khoảng thời gian đã chọn.`, 'info');
            }
        } catch (error) {
            console.error("Lỗi khi xóa dữ liệu:", error);
            Swal.fire('Đã xảy ra lỗi', 'Không thể hoàn tất việc xóa dữ liệu. Vui lòng kiểm tra console.', 'error');
        }
    };
    
    const handleDeleteQuiz = async (quizId, title) => {
        const result = await Swal.fire({ title: `Xóa "${title}"?`, text: "Không thể hoàn tác!", icon: 'warning', showCancelButton: true, confirmButtonText: 'Vâng, xóa!' });
        if (result.isConfirmed) {
            await deleteDoc(doc(db, 'quizzes', quizId));
            Swal.fire('Đã xóa!', '', 'success');
        }
    };
    
    const handleCreateGroup = async (e) => {
        e.preventDefault();
        if (!newGroupName || !newGroupSlug) return;
        const q = query(collection(db, 'groups'), where('slug', '==', newGroupSlug));
        if (!(await getDocs(q)).empty) {
            Swal.fire('Lỗi', 'Đường dẫn (slug) này đã tồn tại.', 'error');
            return;
        }
        await addDoc(collection(db, 'groups'), { name: newGroupName, slug: newGroupSlug, teacherId: null, autoApproveStudents: false });
        showNotification(`Đã tạo lớp học "${newGroupName}".`);
        setNewGroupName('');
        setNewGroupSlug('');
    };
    
    const handleAssignTeacher = async (groupId, teacherId) => {
        const batch = writeBatch(db);
        const groupRef = doc(db, 'groups', groupId);
        const oldTeacherId = groups.find(g => g.id === groupId)?.teacherId;
        if (oldTeacherId) {
            const oldTeacherRef = doc(db, 'users', oldTeacherId);
            batch.update(oldTeacherRef, { groupId: null });
        }
        batch.update(groupRef, { teacherId: teacherId || null });
        if (teacherId) {
            const newTeacherRef = doc(db, 'users', teacherId);
            batch.update(newTeacherRef, { groupId: groupId });
        }
        await batch.commit();
        showNotification('Đã cập nhật giáo viên cho lớp học.');
    };
    
    const handleRoleChange = async (userId, newRole) => {
        // Giới hạn: Admin chỉ đổi role cho user chưa có group
        const userDoc = users.find(u => u.id === userId);
        if (userDoc.groupId) {
            Swal.fire('Lỗi', 'Không thể đổi role cho user đã vào lớp.', 'error');
            return;
        }
        await updateDoc(doc(db, 'users', userId), { role: newRole });
        showNotification(`Đã đổi role thành ${newRole}.`);
    };
    
    const handleStatusChange = async (userId, newStatus) => {
        const userDoc = users.find(u => u.id === userId);
        if (userDoc.role !== 'teacher') {
            Swal.fire('Lỗi', 'Admin chỉ duyệt status cho giáo viên.', 'error');
            return;
        }
        await updateDoc(doc(db, 'users', userId), { status: newStatus });
        showNotification(`Đã cập nhật status thành ${newStatus}.`);
    };
    
    const handleToggleApproval = async () => {
        const newSetting = !settings.requireApproval;
        await setDoc(doc(db, 'settings', 'global'), { requireApproval: newSetting }, { merge: true });
        showNotification('Đã thay đổi cài đặt duyệt thành viên.');
    };
    
    const handleGlobalDateFilterChange = async () => {
        await updateDoc(doc(db, 'settings', 'global'), { leaderboardStartDate: globalStartDate || null, leaderboardEndDate: globalEndDate || null });
        showNotification('Đã áp dụng bộ lọc cho Bảng Xếp Hạng Công khai!');
    };
    
    const handleClearGlobalDateFilter = async () => {
        await updateDoc(doc(db, 'settings', 'global'), { leaderboardStartDate: null, leaderboardEndDate: null });
        setGlobalStartDate('');
        setGlobalEndDate('');
        showNotification('Đã xóa bộ lọc Bảng Xếp Hạng Công khai.');
    };
    
    const availableTeachers = users.filter(u => u.role === 'teacher' && !u.groupId);
    
    const getTeacherName = (teacherId) => {
        if (!teacherId) return "Chưa có giáo viên";
        const teacher = users.find(u => u.id === teacherId);
        return teacher ? teacher.displayName : "Không tìm thấy";
    }

    if (loadingAuth || !isAuthorized) {
        return (
            <div className="container py-4 text-center">
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
                <h3 className="mt-3">Đang xác thực quyền truy cập...</h3>
            </div>
        );
    }

    return (
        <div className="container py-4">
            <h1 className="mb-4">Trang Quản Trị (Super Admin)</h1>
            {notification && <div className="alert alert-success">{notification}</div>}
            
            <div className="card mb-4">
                <div className="card-body">
                    <h5 className="card-title">Cài đặt chung</h5>
                    <div className="form-check form-switch fs-5">
                        <input className="form-check-input" type="checkbox" role="switch" id="approvalSwitch" checked={!!settings.requireApproval} onChange={handleToggleApproval}/>
                        <label className="form-check-label" htmlFor="approvalSwitch">Yêu cầu duyệt thành viên mới</label>
                    </div>
                </div>
            </div>
            <div className="card mb-4">
                <div className="card-body">
                    <h5 className="card-title">Cài đặt BXH Công khai (Toàn cục)</h5>
                    <p className="card-text text-muted">Áp dụng cho các bài thi không thuộc lớp học nào.</p>
                     <div className="row g-3 align-items-center">
                        <div className="col-auto"><label htmlFor="globalStartDate">Từ ngày</label></div>
                        <div className="col-auto"><input type="date" id="globalStartDate" className="form-control" value={globalStartDate} onChange={(e) => setGlobalStartDate(e.target.value)}/></div>
                        <div className="col-auto"><label htmlFor="globalEndDate">Đến ngày</label></div>
                        <div className="col-auto"><input type="date" id="globalEndDate" className="form-control" value={globalEndDate} onChange={(e) => setGlobalEndDate(e.target.value)}/></div>
                        <div className="col-auto"><button className="btn btn-primary" onClick={handleGlobalDateFilterChange}>Áp dụng</button><button className="btn btn-secondary ms-2" onClick={handleClearGlobalDateFilter}>Xem toàn thời gian</button></div>
                    </div>
                </div>
            </div>
            <div className="card border-danger mb-4">
                <div className="card-header bg-danger text-white"><h5 className="mb-0">Quản lý Dữ liệu Nâng cao</h5></div>
                <div className="card-body">
                    <p className="card-text">Xóa vĩnh viễn dữ liệu thi của một lớp học cụ thể hoặc các bài thi công khai.</p>
                    <div className="row g-3 align-items-center p-3 border rounded bg-light">
                        <div className="col-md-4"><label htmlFor="groupSelectDelete" className="form-label fw-bold">Chọn mục tiêu:</label><select id="groupSelectDelete" className="form-select" value={selectedGroupIdForDelete} onChange={e => setSelectedGroupIdForDelete(e.target.value)}><option value="">-- Chọn lớp học/mục --</option><option value="global">Bài thi Công khai (Toàn cục)</option>{groups.map(group => <option key={group.id} value={group.id}>{group.name}</option>)}</select></div>
                        <div className="col-md-2"><label htmlFor="deleteStartDate" className="form-label fw-bold">Từ ngày:</label><input type="date" id="deleteStartDate" className="form-control" value={deleteStartDate} onChange={(e) => setDeleteStartDate(e.target.value)}/></div>
                        <div className="col-md-2"><label htmlFor="deleteEndDate" className="form-label fw-bold">Đến ngày:</label><input type="date" id="deleteEndDate" className="form-control" value={deleteEndDate} onChange={(e) => setDeleteEndDate(e.target.value)}/></div>
                        <div className="col-md-auto align-self-end"><button className="btn btn-danger" onClick={handleDeleteDataByDateRange} disabled={!selectedGroupIdForDelete || !deleteStartDate || !deleteEndDate}><i className="fa-solid fa-trash-can me-2"></i>Xóa Dữ liệu</button></div>
                    </div>
                </div>
            </div>
            <div className="card mb-4">
                 <div className="card-body">
                    <h5 className="card-title">Quản lý Bộ câu hỏi Công khai</h5>
                     <div className="table-responsive">
                        <table className="table table-hover align-middle">
                            <thead><tr><th>Tên bộ câu hỏi</th><th className="text-end">Hành động</th></tr></thead>
                            <tbody>
                                {publicQuizzes.length === 0 && <tr><td colSpan="2">Chưa có bộ câu hỏi công khai nào.</td></tr>}
                                {publicQuizzes.map(q => (
                                    <tr key={q.id}>
                                        <td>{q.title}</td>
                                        <td className="text-end">
                                            <button className="btn btn-sm btn-outline-warning me-2" onClick={() => navigate(`/admin/quiz/${q.id}`)}>Sửa</button>
                                            <button className="btn btn-sm btn-outline-danger" onClick={() => handleDeleteQuiz(q.id, q.title)}>Xóa</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
            <div className="card mb-4">
                <div className="card-body">
                    <h5 className="card-title">Quản lý Lớp học</h5>
                    <form onSubmit={handleCreateGroup} className="row g-3 mb-4 p-3 border rounded">
                        <div className="col-md-5"><input type="text" className="form-control" placeholder="Tên Lớp học" value={newGroupName} onChange={e => setNewGroupName(e.target.value)} /></div>
                        <div className="col-md-5"><input type="text" className="form-control" placeholder="Đường dẫn (vd: lop-thay-an)" value={newGroupSlug} onChange={e => setNewGroupSlug(e.target.value.toLowerCase().replace(/\s+/g, '-'))} /></div>
                        <div className="col-md-2"><button type="submit" className="btn btn-success w-100">Tạo Lớp</button></div>
                    </form>
                    <div className="table-responsive">
                        <table className="table table-hover align-middle">
                            <thead className="table-light"><tr><th>Tên Lớp</th><th>Đường dẫn</th><th>Giáo viên</th><th>BXH Bắt đầu</th><th>BXH Kết thúc</th></tr></thead>
                            <tbody>
                                {groups.map(group => (
                                    <tr key={group.id}>
                                        <td>{group.name}</td>
                                        <td><a href={`/${group.slug}`} target="_blank" rel="noopener noreferrer">/{group.slug}</a></td>
                                        <td>
                                            <select className="form-select form-select-sm" value={group.teacherId || ''} onChange={(e) => handleAssignTeacher(group.id, e.target.value)}>
                                                <option value="">-- Chọn giáo viên --</option>
                                                {group.teacherId && !availableTeachers.some(t => t.id === group.teacherId) && <option value={group.teacherId}>{getTeacherName(group.teacherId)}</option>}
                                                {availableTeachers.map(teacher => (<option key={teacher.id} value={teacher.id}>{teacher.displayName}</option>))}
                                            </select>
                                        </td>
                                        <td>{group.leaderboardStartDate || 'Toàn thời gian'}</td>
                                        <td>{group.leaderboardEndDate || 'Toàn thời gian'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <div className="card">
                <div className="card-body">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                        <h5 className="card-title mb-0">Quản lý Người dùng ({sortedAndFilteredUsers.length})</h5>
                        <div className="d-flex gap-2">
                            <select className="form-select form-select-sm" value={filter} onChange={e => setFilter(e.target.value)}>
                                <option value="all">Hiển thị tất cả</option>
                                <option value="teacher">Chỉ hiển thị Giáo viên</option>
                            </select>
                            <button className="btn btn-outline-secondary btn-sm" onClick={() => requestSort('trialEndDate')}>
                                Sắp xếp theo Hạn dùng
                            </button>
                        </div>
                    </div>
                    <div className="table-responsive">
                        <table className="table table-hover align-middle">
                            <thead className="table-light">
                                <tr>
                                    <th>Người dùng</th>
                                    <th>Email</th>
                                    <th>Vai trò</th>
                                    <th>Trạng thái</th>
                                    <th>Ngày hết hạn (GV)</th>
                                    <th>Lớp học</th>
                                    <th>Admin Actions (GV)</th> {/* MỚI: Cột cho admin duyệt teacher */}
                                    <th className="text-end">Hành động</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sortedAndFilteredUsers.map(user => {
                                    const group = groups.find(g => g.id === user.groupId);
                                    const isExpired = user.trialEndDate && user.trialEndDate.toDate() < new Date();
                                    return (
                                        <tr key={user.id} className={isExpired ? 'table-danger' : ''}>
                                            <td><img src={user.photoURL} alt={user.displayName} width="30" height="30" className="rounded-circle me-2" />{user.displayName}</td>
                                            <td>{user.email}</td>
                                            <td>
                                                <select className="form-select form-select-sm" value={user.role || 'student'} onChange={(e) => handleRoleChange(user.id, e.target.value)}>
                                                    <option value="student">Student</option>
                                                    <option value="teacher">Teacher</option>
                                                    <option value="admin">Admin</option>
                                                </select>
                                            </td>
                                            <td>
                                                 <select className="form-select form-select-sm" value={user.status || 'pending'} onChange={(e) => handleStatusChange(user.id, e.target.value)}>
                                                    <option value="pending">Chờ duyệt</option>
                                                    <option value="approved">Đang hoạt động</option>
                                                    <option value="disabled">Vô hiệu hóa</option>
                                                </select>
                                            </td>
                                            <td>
                                                {user.role === 'teacher' && (
                                                    <input
                                                        type="date"
                                                        className="form-control form-control-sm"
                                                        value={user.trialEndDate ? user.trialEndDate.toDate().toISOString().split('T')[0] : ''}
                                                        onChange={(e) => handleSetTrialEndDate(user.id, e.target.value)}
                                                        title={isExpired ? "Tài khoản này đã hết hạn" : "Chọn để đặt ngày hết hạn"}
                                                    />
                                                )}
                                            </td>
                                            <td>{group ? group.name : (user.role === 'teacher' ? 'Chưa nhận lớp' : '---')}</td>
                                            <td> {/* MỚI: Nút duyệt chỉ cho teacher */}
                                                {user.role === 'teacher' && (
                                                    <button 
                                                        className={`btn btn-sm ${user.status === 'approved' ? 'btn-success' : 'btn-warning'}`}
                                                        onClick={() => handleStatusChange(user.id, user.status === 'approved' ? 'pending' : 'approved')}
                                                    >
                                                        {user.status === 'approved' ? 'Đã duyệt' : 'Duyệt GV'}
                                                    </button>
                                                )}
                                            </td>
                                            <td className="text-end">
                                                <button 
                                                    className="btn btn-sm btn-outline-danger"
                                                    onClick={() => handleDeleteUser(user.id, user.displayName)}
                                                    title={`Xóa người dùng ${user.displayName}`}
                                                >
                                                    <i className="fa-solid fa-trash-can"></i>
                                                </button>
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminPage;