// src/layouts/MainLayout.js

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext'; // ✨ BƯỚC 1: Import hook để lấy thông tin user
import { logout } from '../firebase';

// ==================================================================
//                            COMPONENT NAVBAR
// ==================================================================
const Navbar = () => {
  const { user, userInfo, loading } = useUser(); // ✨ BƯỚC 2: Dùng hook để lấy thông tin user và slug
  const navigate = useNavigate();

  const handleLogout = () => {
    logout().then(() => {
      navigate('/'); // Điều hướng về trang chủ sau khi đăng xuất
    });
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-light shadow-sm" style={{ backgroundColor: '#ecf0f1' }}>
      <div className="container-fluid px-md-5">
        <Link className="navbar-brand" to="/" style={{ color: '#3498db', fontWeight: 700 }}>
          Logic Siêu Trí Tuệ
        </Link>
        <div className="d-flex align-items-center">
          {loading ? (
            <div className="spinner-border spinner-border-sm" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          ) : user ? (
            <>
              <img src={user.photoURL} alt={user.displayName} width="35" height="35" className="rounded-circle me-2" />
              <span className="navbar-text me-3 d-none d-sm-block">{user.displayName}</span>
              
              {/* ✨ BƯỚC 3: Tạo link dashboard chính xác dựa trên role và slug ✨ */}
              {userInfo?.role === 'teacher' && userInfo?.groupSlug && (
                <Link 
                  to={`/dashboard/${userInfo.groupSlug}`} 
                  className="btn btn-outline-primary btn-sm me-2"
                >
                  Quản lý
                </Link>
              )}
              {userInfo?.role === 'admin' && (
                <Link to="/admin" className="btn btn-outline-danger btn-sm me-2">
                  Super Admin
                </Link>
              )}
              
              <button className="btn btn-outline-secondary btn-sm" onClick={handleLogout}>
                Đăng xuất
              </button>
            </>
          ) : (
            <Link to="/" className="btn btn-primary">Đăng nhập</Link>
          )}
        </div>
      </div>
    </nav>
  );
};


// ==================================================================
//                            COMPONENT FOOTER
// ==================================================================
// Mảng chứa các câu nói truyền động lực song ngữ
const motivationalQuotes = [
  "Hôm nay bạn nỗ lực, ngày mai bạn tỏa sáng. / Work hard today, shine tomorrow.",
  "Chinh phục tri thức, kiến tạo tương lai. / Conquer knowledge, build your future.",
  "Đừng sợ mắc lỗi, hãy sợ không cố gắng. / Don't fear mistakes, fear not trying.",
  "Mỗi câu hỏi là một bước tiến tới thành công. / Every question is a step toward success.",
  "Kiến thức là sức mạnh. Hãy trang bị cho mình! / Knowledge is power. Equip yourself!",
  "Tương lai được tạo nên bởi những gì bạn làm hôm nay. / The future is built by what you do today.",
  "Học tập là cuộc phiêu lưu của trí tuệ. / Learning is an adventure of the mind.",
  "Không có con đường nào dẫn đến thành công mà không đi qua nỗ lực. / There’s no path to success without effort.",
  "Mỗi ngày học là một ngày tiến bộ. / Every day you learn is a day you grow.",
  "Bạn giỏi hơn bạn nghĩ rất nhiều! / You’re much smarter than you think!",
  "Thành công bắt đầu từ niềm tin vào chính mình. / Success begins with believing in yourself.",
  "Học không phải để hơn người khác, mà để hơn chính mình hôm qua. / Learn not to beat others, but to beat your past self.",
  "Chỉ cần kiên trì, mọi ước mơ đều có thể đạt được. / With perseverance, every dream is possible.",
  "Từng bài học nhỏ là viên gạch xây nên tương lai lớn. / Each lesson is a brick for your bright future.",
  "Không ai sinh ra đã giỏi – mọi thành công đều bắt đầu từ sự chăm chỉ. / No one is born great — success starts with effort.",
  "Cố gắng thêm một chút, kết quả sẽ khác biệt rất nhiều. / A little more effort makes a big difference.",
  "Học tập hôm nay – dẫn lối ngày mai. / Learn today – lead tomorrow.",
  "Tri thức là chìa khóa mở ra mọi cánh cửa. / Knowledge is the key to every door.",
  "Đừng đợi cảm hứng, hãy bắt đầu và cảm hứng sẽ đến. / Don’t wait for inspiration, start and it will come.",
  "Mỗi giọt mồ hôi hôm nay là nụ cười ngày mai. / Every drop of sweat today is a smile tomorrow.",
  "Thất bại chỉ là bài học để thành công hơn. / Failure is just a lesson for greater success.",
  "Bạn không cần hoàn hảo, chỉ cần không bỏ cuộc. / You don’t have to be perfect, just don’t give up.",
  "Ước mơ không tự thành hiện thực – hành động mới là chìa khóa. / Dreams don’t come true by themselves – action does.",
  "Đọc một trang hôm nay, bạn tiến xa hơn một bước ngày mai. / One page today, one step forward tomorrow.",
  "Mỗi ngày trôi qua là cơ hội để bạn tốt hơn. / Each day is a chance to be better.",
  "Không có bài toán nào khó, chỉ có người chưa chịu tìm cách giải. / There’s no hard problem, only an unsolved one.",
  "Tương lai thuộc về người dám học hỏi. / The future belongs to those who learn.",
  "Sách là người bạn trung thành nhất. / Books are your most loyal friends.",
  "Học hỏi là đầu tư không bao giờ lỗ. / Learning is the best investment.",
  "Hãy để đam mê dẫn lối cho bạn. / Let passion lead your path.",
  "Mỗi giờ học là một viên ngọc của tương lai. / Every study hour is a gem of your future.",
  "Thầy cô mở cửa tri thức, bạn phải bước vào. / Teachers open the door, you must enter yourself.",
  "Kiên trì là cây cầu nối giữa ước mơ và hiện thực. / Perseverance bridges dreams and reality.",
  "Nếu bạn không học hôm nay, ngày mai bạn sẽ hối tiếc. / If you don’t study today, you’ll regret tomorrow.",
  "Thay vì than khó, hãy bắt đầu từng bước nhỏ. / Instead of saying it’s hard, start with small steps.",
  "Càng học, càng thấy thế giới rộng lớn hơn. / The more you learn, the bigger the world becomes.",
  "Mỗi sáng thức dậy là cơ hội để làm tốt hơn hôm qua. / Each morning is a chance to do better than yesterday.",
  "Dù đi chậm, đừng bao giờ dừng lại. / Go slow if you must, but never stop.",
  "Học tập là hành trình, không phải điểm đến. / Learning is a journey, not a destination.",
  "Đam mê + Nỗ lực = Thành công. / Passion + Effort = Success."
];

const Footer = () => {
  const [quote, setQuote] = useState(motivationalQuotes[0]);

  useEffect(() => {
    const interval = setInterval(() => {
      const randomIndex = Math.floor(Math.random() * motivationalQuotes.length);
      setQuote(motivationalQuotes[randomIndex]);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <footer className="footer text-center mt-auto py-3" style={{ backgroundColor: '#ecf0f1' }}>
      <div className="container" style={{ height: '2rem' }}>
        <span key={quote} className="motivational-text">
          {`${quote} ⏳`}
        </span>
      </div>
    </footer>
  );
};


// ==================================================================
//                         COMPONENT MAINLAYOUT
// ==================================================================
const MainLayout = ({ children }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar />
      <main className="container-fluid my-4 px-md-5">
        {children}
      </main>
      <Footer />
    </div>
  );
};

export default MainLayout;