import React from 'react';

// Hàm nhỏ để kiểm tra trạng thái của đề thi
const getQuizStatus = (quiz) => {
    const now = new Date();
    const openTime = quiz.openTime ? quiz.openTime.toDate() : null;
    const closeTime = quiz.closeTime ? quiz.closeTime.toDate() : null;

    if (openTime && now < openTime) {
        return { status: 'locked', message: `Mở lúc: ${openTime.toLocaleTimeString('vi-VN')} ${openTime.toLocaleDateString('vi-VN')}` };
    }
    if (closeTime && now > closeTime) {
        return { status: 'closed', message: `Đã đóng lúc: ${closeTime.toLocaleTimeString('vi-VN')} ${closeTime.toLocaleDateString('vi-VN')}` };
    }
    return { status: 'open', message: '' };
};


const StartScreen = ({ quizData, onStartGame }) => {
  return (
    <div className="screen-container">
      <h1>Chọn Màn Chơi</h1>
      <div className="level-selection">
        {quizData.map((set) => {
            const { status, message } = getQuizStatus(set);
            const isDisabled = status === 'locked' || status === 'closed';

            return (
                <div key={set.id} className="quiz-selection-item" style={{ marginBottom: '1rem' }}>
                    <button
                        className={`btn btn-lg ${isDisabled ? 'btn-secondary' : 'btn-primary'}`}
                        onClick={() => onStartGame(set)}
                        disabled={isDisabled}
                        style={{ cursor: isDisabled ? 'not-allowed' : 'pointer', width: '100%', maxWidth: '400px' }}
                    >
                        {set.title}
                        {set.hasPassword && <i className="fa-solid fa-lock ms-2" title="Yêu cầu mật khẩu"></i>}
                        {status === 'locked' && <i className="fa-solid fa-clock ms-2" title="Chưa mở"></i>}
                        {status === 'closed' && <i className="fa-solid fa-circle-xmark ms-2" title="Đã đóng"></i>}
                    </button>
                    {message && <small className="quiz-status-message d-block mt-1 text-muted">{message}</small>}
                </div>
            );
        })}
      </div>
    </div>
  );
};

export default StartScreen;