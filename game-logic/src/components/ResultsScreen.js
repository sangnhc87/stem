// src/components/ResultsScreen.js
import React from 'react';
import Leaderboard from './Leaderboard';

const ResultsScreen = ({ 
  score, 
  totalPoints, 
  onBackToMenu, 
  onPlayAgain,
  quizId,
  groupId,
  currentUserId 
}) => {
  const percentage = totalPoints > 0 ? Math.round((score / totalPoints) * 100) : 0;

  return (
    <div className="screen-container">
      <h1>Hoàn Thành!</h1>
      <div className="card text-center mb-4" style={{ width: '22rem' }}>
        <div className="card-body">
          <h5 className="card-title">Điểm số cuối cùng của bạn</h5>
          <p className="card-text fs-1 fw-bold text-primary">
            {score}
          </p>
          <p className="card-text fs-5">trên tổng số {totalPoints} điểm có thể đạt được</p>
          <p className="card-text text-muted">({percentage}%)</p>
          <button onClick={onPlayAgain} className="btn btn-success me-2">
            Chơi lại
          </button>
          <button onClick={onBackToMenu} className="btn btn-secondary">
            Chọn màn khác
          </button>
        </div>
      </div>

      {/* ✅ HIỂN THỊ BẢNG XẾP HẠNG */}
      {quizId && groupId && currentUserId && (
        <div className="mt-4">
          <Leaderboard 
            quizId={quizId} 
            groupId={groupId} 
            currentUserId={currentUserId} 
          />
        </div>
      )}
    </div>
  );
};

export default ResultsScreen;