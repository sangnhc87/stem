import React from 'react';
import { loginWithGoogle } from '../firebase';

const LoginScreen = () => {
  return (
    <div className="screen-container">
      <div className="card text-center p-4 shadow-lg">
        <div className="card-body">
          <h1 className="card-title mb-4">Logic Siêu Trí Tuệ</h1>
          <p className="card-text mb-4">Vui lòng đăng nhập để bắt đầu chơi và lưu điểm số.</p>
          <button className="btn btn-danger btn-lg" onClick={loginWithGoogle}>
            <i className="fab fa-google me-2"></i>
            Đăng nhập với Google
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;