import React, { useEffect, useState } from "react";
import { 
  collection, 
  onSnapshot, 
  updateDoc, 
  doc, 
  deleteDoc, 
  Timestamp, 
  getDoc
} from "firebase/firestore";
import { db } from "../firebase";

// Component Modal xác nhận tùy chỉnh
const ConfirmModal = ({ show, onConfirm, onCancel, message }) => {
  if (!show) {
    return null;
  }

  const modalStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1100,
  };

  const contentStyle = {
    backgroundColor: 'white',
    padding: '2rem',
    borderRadius: '8px',
    boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
    textAlign: 'center',
    maxWidth: '400px',
  };

  return (
    <div style={modalStyle} onClick={onCancel}>
      <div style={contentStyle} onClick={(e) => e.stopPropagation()}>
        <p className="mb-4">{message}</p>
        <div className="d-flex justify-content-center gap-2">
          <button className="btn btn-secondary" onClick={onCancel}>Huỷ</button>
          <button className="btn btn-danger" onClick={onConfirm}>Xác nhận Xoá</button>
        </div>
      </div>
    </div>
  );
};


const DeviceAdminPage = () => {
  const [groups, setGroups] = useState({}); // {gmail: [devices...]}
  const [notify, setNotify] = useState("");
  const [deleteRequest, setDeleteRequest] = useState(null); // State cho modal
  const [searchQuery, setSearchQuery] = useState(""); // <<-- THÊM STATE CHO TÌM KIẾM

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "devices"), (snap) => {
      const map = {};
      snap.docs.forEach((d) => {
        const data = d.data();
        if (!map[data.gmail]) map[data.gmail] = [];
        map[data.gmail].push({ id: d.id, ...data });
      });
      setGroups(map);
    });
    return unsub;
  }, []);

  // Hàm hiển thị thông báo
  const show = (msg) => { 
    setNotify(msg); 
    setTimeout(() => setNotify(""), 3000); 
  };

  const handleTrial = async (deviceId, days) => {
    try {
      const deviceRef = doc(db, "devices", deviceId);
      const docSnap = await getDoc(deviceRef);

      if (docSnap.exists()) {
        const currentData = docSnap.data();
        const oldDate = currentData.trialExpiresAt ? currentData.trialExpiresAt.toDate() : new Date();
        const newDate = new Date(oldDate);
        newDate.setDate(newDate.getDate() + days);
        
        await updateDoc(deviceRef, { trialExpiresAt: Timestamp.fromDate(newDate) });
        show(`Đã ${days > 0 ? '+' : ''}${days} ngày cho thiết bị.`);
      } else {
        show(`Lỗi: Không tìm thấy thiết bị với ID: ${deviceId}`);
        console.error("No such document!");
      }
    } catch (error) {
      show("Đã có lỗi xảy ra khi cập nhật.");
      console.error("Error updating document: ", error);
    }
  };

  const handleDeleteDevice = async () => {
    if (!deleteRequest) return;
    try {
      await deleteDoc(doc(db, "devices", deleteRequest));
      show("Đã xoá thiết bị thành công.");
    } catch (error) {
      show("Lỗi: Không thể xoá thiết bị.");
      console.error("Error deleting device: ", error);
    } finally {
      setDeleteRequest(null);
    }
  };

  const handleTrialGroup = (gmail, days) => {
    groups[gmail].forEach((d) => handleTrial(d.id, days));
  };
  
  const requestDeleteDevice = (deviceId) => {
    setDeleteRequest(deviceId);
  };

  // <<-- LỌC DANH SÁCH DỰA TRÊN TÌM KIẾM
  const filteredEntries = Object.entries(groups).filter(([gmail]) =>
    gmail.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="container py-4" style={{ fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif" }}>
      <ConfirmModal 
        show={!!deleteRequest}
        onConfirm={handleDeleteDevice}
        onCancel={() => setDeleteRequest(null)}
        message="Bạn có chắc muốn xoá thiết bị này? Thao tác này không thể hoàn tác."
      />
      
      <h1 className="mb-4">Quản lý thiết bị (theo Gmail)</h1>
      
      {/* <<-- THÊM THANH TÌM KIẾM */}
      <div className="mb-4">
        <input
          type="text"
          className="form-control"
          placeholder="Tìm kiếm theo Gmail (ví dụ: sang)..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {notify && (
        <div 
          className="alert alert-success position-fixed top-0 start-50 translate-middle-x mt-3" 
          style={{ zIndex: 1050, minWidth: '300px' }}
        >
          {notify}
        </div>
      )}

      {Object.keys(groups).length === 0 && <p className="text-muted">Chưa có thiết bị nào được đăng ký.</p>}
      
      {/* <<-- HIỂN THỊ THÔNG BÁO KHI KHÔNG CÓ KẾT QUẢ TÌM KIẾM */}
      {filteredEntries.length === 0 && searchQuery && <p className="text-muted text-center mt-4">Không tìm thấy tài khoản nào khớp.</p>}

      {/* <<-- DÙNG DANH SÁCH ĐÃ LỌC ĐỂ HIỂN THỊ */}
      {filteredEntries.map(([gmail, devices]) => (
        <div key={gmail} className="card mb-4 shadow-sm">
          <div className="card-header d-flex justify-content-between align-items-center bg-light">
            <strong className="text-primary">{gmail}</strong> 
            <span className="badge bg-primary rounded-pill">{devices.length} máy</span>
          </div>
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead>
                  <tr>
                    <th className="ps-3">Device ID</th>
                    <th>Ngày hết hạn</th>
                    <th className="text-end pe-3">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {devices.map((d) => {
                    const exp = d.trialExpiresAt?.toDate();
                    const isExpired = exp && exp < new Date();
                    const timeLeft = exp ? Math.ceil((exp - new Date()) / (1000 * 60 * 60 * 24)) : null;
                    
                    let rowClass = '';
                    let statusText = '';
                    if (isExpired) {
                      rowClass = 'table-danger';
                      statusText = ` (Đã hết hạn ${Math.abs(timeLeft)} ngày)`;
                    } else if (timeLeft !== null && timeLeft <= 7) {
                      rowClass = 'table-warning';
                      statusText = ` (Còn ${timeLeft} ngày)`;
                    }

                    return (
                      <tr key={d.id} className={rowClass}>
                        <td className="ps-3"><small className="font-monospace">{d.id}</small></td>
                        <td>
                          {exp ? exp.toLocaleDateString("vi-VN") : "N/A"}
                          {statusText && <span className="fw-bold">{statusText}</span>}
                        </td>
                        <td className="text-end pe-3">
                          <div className="btn-group btn-group-sm">
                            <button className="btn btn-outline-primary" onClick={() => handleTrial(d.id, 30)}>+30</button>
                            <button className="btn btn-outline-primary" onClick={() => handleTrial(d.id, 90)}>+90</button>
                            <button className="btn btn-outline-warning" onClick={() => handleTrial(d.id, -7)}>-7</button>
                            <button className="btn btn-outline-danger" onClick={() => requestDeleteDevice(d.id)}>🗑️</button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
          <div className="card-footer d-flex justify-content-end gap-2 bg-light">
            <span className="me-2 text-muted">Cả nhóm:</span>
            <button className="btn btn-sm btn-success" onClick={() => handleTrialGroup(gmail, 30)}>+30 ngày</button>
            <button className="btn btn-sm btn-success" onClick={() => handleTrialGroup(gmail, 90)}>+90 ngày</button>
            <button className="btn btn-sm btn-warning" onClick={() => handleTrialGroup(gmail, -7)}>-7 ngày</button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default DeviceAdminPage;

