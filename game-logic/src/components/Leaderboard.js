// src/components/Leaderboard.js
import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, onSnapshot, where } from 'firebase/firestore';

const formatTime = (seconds) => {
  if (isNaN(seconds) || seconds < 0) return "00:00";
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
};

const getRankClasses = (rank) => {
  if (rank === 1) return 'bg-warning text-dark';
  if (rank === 2) return 'bg-secondary text-white';
  if (rank === 3) return 'bg-bronze text-white';
  return 'bg-light text-dark';
};

const Leaderboard = ({ quizId, groupId, currentUserId }) => {
  const [topScores, setTopScores] = useState([]);
  const [currentUserRank, setCurrentUserRank] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!quizId || !groupId) {
      setTopScores([]);
      setCurrentUserRank(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    
    // Lấy TẤT CẢ điểm của quiz này trong nhóm
    const q = query(
      collection(db, "scores"),
      where("quizId", "==", quizId),
      where("groupId", "==", groupId)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const allScores = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // ✅ GỘP THEO USER: Chỉ giữ kết quả TỐT NHẤT (điểm cao nhất, thời gian ngắn nhất)
      const bestScoresMap = new Map();
      allScores.forEach(score => {
        const existing = bestScoresMap.get(score.userId);
        if (!existing) {
          bestScoresMap.set(score.userId, score);
        } else {
          // So sánh: điểm cao hơn thì thay thế
          if (score.score > existing.score) {
            bestScoresMap.set(score.userId, score);
          } 
          // Nếu điểm bằng nhau, chọn thời gian ngắn hơn
          else if (score.score === existing.score && score.durationSeconds < existing.durationSeconds) {
            bestScoresMap.set(score.userId, score);
          }
        }
      });

      // Chuyển thành mảng và sắp xếp
      let finalScores = Array.from(bestScoresMap.values());
      finalScores.sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return a.durationSeconds - b.durationSeconds;
      });

      // Tính rank (xử lý điểm bằng nhau)
      let rank = 1;
      for (let i = 0; i < finalScores.length; i++) {
        if (i > 0) {
          const prev = finalScores[i - 1];
          const curr = finalScores[i];
          if (curr.score !== prev.score || curr.durationSeconds !== prev.durationSeconds) {
            rank = i + 1;
          }
        }
        finalScores[i].computedRank = rank;
      }

      // Lấy top 10 để hiển thị
      setTopScores(finalScores.slice(0, 10));

      // Tìm rank của học sinh hiện tại
      if (currentUserId) {
        const currentUser = finalScores.find(s => s.userId === currentUserId);
        setCurrentUserRank(currentUser ? currentUser.computedRank : null);
      }

      setLoading(false);
    }, (error) => {
      console.error("Lỗi khi tải BXH:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [quizId, groupId, currentUserId]);

  if (loading) {
    return (
      <div className="info-box mt-4 text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Đang tải BXH...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="info-box mt-4">
      <style>{`
        .bg-bronze { background-color: #cd7f32 !important; }
        .rank-badge {
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          font-weight: bold;
          flex-shrink: 0;
        }
      `}</style>

      <h2 className="section-title mb-3">Bảng Xếp Hạng</h2>

      {/* ✅ HIỂN THỊ VỊ TRÍ CỦA HỌC SINH HIỆN TẠI */}
      {currentUserId && currentUserRank && (
        <div className="alert alert-info d-flex align-items-center mb-3">
          <i className="fas fa-user me-2"></i>
          <strong>Bạn đang xếp hạng #{currentUserRank}</strong>
          {currentUserRank > 10 && (
            <span className="ms-2 text-muted">(Ngoài top 10)</span>
          )}
        </div>
      )}

      <div className="list-group">
        {topScores.length === 0 ? (
          <div className="list-group-item text-center py-3">
            Chưa có ai thi bài này.
          </div>
        ) : (
          topScores.map((entry) => (
            <div
              key={entry.id}
              className={`list-group-item d-flex align-items-center p-2 ${
                entry.userId === currentUserId ? 'bg-light-primary border border-primary' : ''
              }`}
            >
              <div className={`rank-badge ${getRankClasses(entry.computedRank)}`}>
                {entry.computedRank}
              </div>
              <div className="ms-2 fw-semibold flex-grow-1">
                {entry.displayName || 'Ẩn danh'}
                {entry.userId === currentUserId && (
                  <span className="badge bg-primary ms-2">Bạn</span>
                )}
              </div>
              <div className="d-flex gap-2">
                <span className="badge bg-primary">{entry.score || 0}đ</span>
                <span className="badge bg-info">
                  <i className="fas fa-clock fa-xs me-1"></i>
                  {formatTime(entry.durationSeconds)}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="mt-2 text-muted small text-center">
        Xếp hạng theo điểm cao → thời gian ngắn.
      </div>
    </div>
  );
};

export default Leaderboard;