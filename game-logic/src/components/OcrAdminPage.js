import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '../firebase';
import {
  collection, query, where, onSnapshot, doc, updateDoc, setDoc, deleteDoc, serverTimestamp, Timestamp
} from 'firebase/firestore';

const OcrAdminPage = () => {
  const [user, loadingAuth] = useAuthState(auth);
  const navigate = useNavigate();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [notification, setNotification] = useState('');
  const [activeTab, setActiveTab] = useState('requests');
  const [pendingRequests, setPendingRequests] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [newEmail, setNewEmail] = useState('');

  useEffect(() => {
    if (loadingAuth) return;
    if (!user) { navigate('/login'); return; }
    user.getIdTokenResult(true).then((res) => {
      if (res.claims.role === 'admin') setIsAuthorized(true);
      else { alert('Không phải admin'); navigate('/'); }
    });
  }, [user, loadingAuth, navigate]);

  useEffect(() => {
    if (!isAuthorized || activeTab !== 'requests') return;
    const q = query(collection(db, "ocr_requests"), where("status", "==", "pending"));
    return onSnapshot(q, (snap) => setPendingRequests(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
  }, [isAuthorized, activeTab]);

  useEffect(() => {
    if (!isAuthorized || activeTab !== 'users') return;
    const q = query(collection(db, "users"));
    return onSnapshot(q, (snap) => setAllUsers(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
  }, [isAuthorized, activeTab]);

  const showNotification = (msg) => { setNotification(msg); setTimeout(() => setNotification(''), 4000); };

  const handleOcrAction = async (id, action) => {
    await updateDoc(doc(db, "ocr_requests", id), { status: action });
    showNotification(`Đã ${action === 'approved' ? 'duyệt' : 'từ chối'}`);
  };

  const handleTrialUpdate = async (uid, days) => {
    const u = allUsers.find(x => x.id === uid);
    if (!u) return;
    const old = u.trialExpiresAt?.toDate() || new Date();
    const neo = new Date(old);
    neo.setDate(neo.getDate() + days);
    await updateDoc(doc(db, "users", uid), { trialExpiresAt: Timestamp.fromDate(neo) });
    showNotification(`Đã ${days > 0 ? '+' : ''}${days} ngày cho ${u.email}`);
  };

  const handleAddUser = async () => {
    if (!newEmail) return;
    const uid = newEmail.replace(/[@.]/g, "_");
    const trialEnd = new Date(); trialEnd.setDate(trialEnd.getDate() + 180);
    await setDoc(doc(db, "users", uid), {
      email: newEmail,
      trialExpiresAt: Timestamp.fromDate(trialEnd),
      role: "user",
      createdAt: serverTimestamp()
    });
    setNewEmail('');
    showNotification(`Đã thêm ${newEmail}`);
  };

  const handleDeleteUser = async (uid, email) => {
    if (!window.confirm(`Xoá ${email}?`)) return;
    await deleteDoc(doc(db, "users", uid));
    showNotification(`Đã xoá ${email}`);
  };

  if (!isAuthorized) return <div className="container py-4 text-center"><h2>Đang xác thực...</h2></div>;

  return (
    <div className="container py-4">
      <h1 className="mb-4">Trang Quản Trị</h1>
      {notification && <div className="alert alert-success">{notification}</div>}

      <ul className="nav nav-tabs mb-3">
        <li className="nav-item">
          <button className={`nav-link ${activeTab === 'requests' ? 'active' : ''}`} onClick={() => setActiveTab('requests')}>Duyệt Yêu Cầu OCR</button>
        </li>
        <li className="nav-item">
          <button className={`nav-link ${activeTab === 'users' ? 'active' : ''}`} onClick={() => setActiveTab('users')}>Quản Lý Người Dùng</button>
        </li>
      </ul>

      {activeTab === 'requests' && (
        <div className="card">
          <div className="card-body">
            <h5 className="card-title">Các yêu cầu đang chờ duyệt</h5>
            {pendingRequests.length === 0 ? <p className="text-muted">Không có yêu cầu nào.</p> : (
              <div className="table-responsive">
                <table className="table table-hover align-middle">
                  <thead className="table-light"><tr><th>Ảnh</th><th>Người gửi</th><th>Prompt</th><th className="text-end">Hành động</th></tr></thead>
                  <tbody>
                    {pendingRequests.map(req => (
                      <tr key={req.id}>
                        <td><img src={`data:image/png;base64,${req.imageBase64}`} alt="" style={{width:100}} /></td>
                        <td>{req.userEmail}</td><td><small>{req.prompt}</small></td>
                        <td className="text-end">
                          <button className="btn btn-success btn-sm me-2" onClick={() => handleOcrAction(req.id, 'approved')}>Duyệt</button>
                          <button className="btn btn-danger btn-sm" onClick={() => handleOcrAction(req.id, 'rejected')}>Từ chối</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'users' && (
        <div className="card">
          <div className="card-body">
            <h5 className="card-title">Quản lý thời gian dùng thử</h5>
            <div className="mb-3">
              <input className="form-control w-auto d-inline" placeholder="Email mới" value={newEmail} onChange={e => setNewEmail(e.target.value)} />
              <button className="btn btn-primary btn-sm ms-2" onClick={handleAddUser}>+ Thêm</button>
            </div>
            {allUsers.length === 0 ? <p className="text-muted">Chưa có người dùng nào.</p> : (
              <div className="table-responsive">
                <table className="table table-hover align-middle">
                  <thead className="table-light"><tr><th>Email</th><th>Ngày hết hạn</th><th className="text-end">Gia hạn / Giảm hạn</th></tr></thead>
                  <tbody>
                    {allUsers.map(u => {
                      const expiryDate = u.trialExpiresAt?.toDate();
                      const isExpired = expiryDate < new Date();
                      return (
                        <tr key={u.id}>
                          <td>{u.email}</td>
                          <td className={isExpired ? 'text-danger fw-bold' : ''}>{expiryDate ? expiryDate.toLocaleDateString('vi-VN') : 'Chưa gia hạn'}</td>
                          <td className="text-end">
                            <button className="btn btn-sm btn-outline-primary me-2" onClick={() => handleTrialUpdate(u.id, 30)}>+30</button>
                            <button className="btn btn-sm btn-outline-primary me-2" onClick={() => handleTrialUpdate(u.id, 90)}>+90</button>
                            <button className="btn btn-sm btn-outline-warning me-2" onClick={() => handleTrialUpdate(u.id, -7)}>-7</button>
                            <button className="btn btn-sm btn-outline-danger" onClick={() => handleDeleteUser(u.id, u.email)}>🗑 Xoá</button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default OcrAdminPage;