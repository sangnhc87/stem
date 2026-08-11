import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { auth, db, functions } from '../firebase';
import { httpsCallable } from 'firebase/functions';
import { useAuthState } from 'react-firebase-hooks/auth';
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  getDocs,
  updateDoc,
  deleteDoc,
  writeBatch,
} from 'firebase/firestore';
import Leaderboard from './Leaderboard';
import Swal from 'sweetalert2';
// 👇 Import Modal từ react-bootstrap
import { Modal } from 'react-bootstrap';

const TeacherDashboard = () => {
  const { teacherSlug } = useParams();
  const navigate = useNavigate();
  const [user, loadingAuth] = useAuthState(auth);

  // State xác thực và quyền
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [userClaims, setUserClaims] = useState(null);

  // State dữ liệu của lớp học
  const [group, setGroup] = useState(null);
  const [quizzes, setQuizzes] = useState([]);
  const [students, setStudents] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [pendingUsers, setPendingUsers] = useState(new Map());

  // State giao diện và chức năng
  const [notification, setNotification] = useState('');
  const [activeTab, setActiveTab] = useState('students');
  const [searchTerm, setSearchTerm] = useState('');
  const [welcomeMessage, setWelcomeMessage] = useState('');
  const [deleteStartDate, setDeleteStartDate] = useState('');
  const [deleteEndDate, setDeleteEndDate] = useState('');
  const [viewingLeaderboardFor, setViewingLeaderboardFor] = useState(null);

  // useEffect 1: Xác thực quyền truy cập
  useEffect(() => {
    if (loadingAuth) return;
    if (!user) {
      navigate('/login');
      return;
    }

    user.getIdTokenResult(true)
      .then((idTokenResult) => {
        const claims = idTokenResult.claims;
        if (claims.role === 'admin' || claims.role === 'teacher') {
          setUserClaims(claims);
          setIsAuthorized(true);
        } else {
          Swal.fire('Truy cập bị từ chối', 'Bạn không có quyền vào trang này.', 'error');
          navigate('/');
        }
      })
      .catch((error) => {
        console.error('Lỗi xác thực quyền:', error);
        Swal.fire('Lỗi', 'Không thể xác thực quyền của bạn.', 'error');
        navigate('/');
      });
  }, [user, loadingAuth, navigate]);

  // useEffect 2: Tải tất cả dữ liệu cần thiết cho dashboard
  useEffect(() => {
    if (!isAuthorized || !user) return;

    let unsubQuizzes = () => {};
    let unsubStudents = () => {};
    let unsubRequests = () => {};

    const fetchData = async () => {
      try {
        const groupsQuery = query(collection(db, 'groups'), where('slug', '==', teacherSlug));
        const groupSnapshot = await getDocs(groupsQuery);

        if (groupSnapshot.empty) {
          Swal.fire('Lỗi', 'Không tìm thấy lớp học này.', 'error');
          return navigate('/');
        }

        const groupDoc = groupSnapshot.docs[0];
        const groupData = { id: groupDoc.id, ...groupDoc.data() };

        if (userClaims.role === 'teacher' && groupData.teacherId !== user.uid) {
          Swal.fire('Truy cập bị từ chối', 'Bạn không có quyền quản lý lớp học này.', 'error');
          return navigate(`/${teacherSlug}`);
        }

        setGroup(groupData);
        setWelcomeMessage(groupData.welcomeMessage || `Chào mừng đến lớp học của ${groupData.name}`);

        const qQuery = query(collection(db, 'quizzes'), where('groupId', '==', groupDoc.id));
        unsubQuizzes = onSnapshot(qQuery, (snap) =>
          setQuizzes(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
        );

        const sQuery = query(collection(db, 'users'), where('groupId', '==', groupDoc.id));
        unsubStudents = onSnapshot(sQuery, (snap) =>
          setStudents(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
        );

        const requestsQuery = query(
          collection(db, 'joinRequests'),
          where('teacherId', '==', user.uid),
          where('status', '==', 'pending')
        );
        unsubRequests = onSnapshot(requestsQuery, async (snap) => {
          const reqs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
          setPendingRequests(reqs);

          if (reqs.length > 0) {
            const studentIds = reqs.map((r) => r.studentId);
            const newUsersToFetch = studentIds.filter((id) => !pendingUsers.has(id));
            if (newUsersToFetch.length > 0) {
              const usersQuery = query(collection(db, 'users'), where('__name__', 'in', newUsersToFetch));
              const userSnaps = await getDocs(usersQuery);
              setPendingUsers((prevUsers) => {
                const updated = new Map(prevUsers);
                userSnaps.forEach((d) => updated.set(d.id, { id: d.id, ...d.data() }));
                return updated;
              });
            }
          } else {
            setPendingUsers(new Map());
          }
        });
      } catch (error) {
        console.error('Lỗi khi tải trang quản lý:', error);
        Swal.fire('Lỗi tải dữ liệu', `Đã xảy ra lỗi: ${error.message}`, 'error');
      }
    };

    fetchData();

    return () => {
      unsubQuizzes();
      unsubStudents();
      unsubRequests();
    };
  }, [isAuthorized, userClaims, user, teacherSlug, navigate]);

  // --- CÁC HÀM XỬ LÝ ---

  const showNotification = (message) => {
    setNotification(message);
    setTimeout(() => setNotification(''), 4000);
  };

  const handleProcessRequest = async (request, approve) => {
    const actionText = approve ? 'Duyệt' : 'Từ chối';
    if (!group) return;
    try {
      Swal.fire({ title: `Đang ${actionText.toLowerCase()}...`, allowOutsideClick: false, didOpen: () => Swal.showLoading() });
      const processRequest = httpsCallable(functions, 'processJoinRequest');
      await processRequest({
        requestId: request.id,
        studentId: request.studentId,
        groupId: group.id,
        approve: approve,
      });
      Swal.close();
      showNotification(`Đã ${actionText.toLowerCase()} yêu cầu thành công.`);
    } catch (err) {
      console.error(`Lỗi khi ${actionText.toLowerCase()} yêu cầu:`, err);
      Swal.fire('Lỗi', `Không thể ${actionText.toLowerCase()} yêu cầu. ${err.message}`, 'error');
    }
  };

  const handleToggleAutoApprove = async () => {
    if (!group) return;
    const newValue = !group.autoApproveStudents;
    
    const confirmText = newValue 
      ? 'Bật tự động duyệt? Học sinh mới sẽ được chấp nhận ngay lập tức.'
      : 'Tắt tự động duyệt? Bạn sẽ phải duyệt từng học sinh thủ công.';
    
    const result = await Swal.fire({
      title: newValue ? 'Bật tự động duyệt?' : 'Tắt tự động duyệt?',
      text: confirmText,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: newValue ? 'Bật' : 'Tắt',
      cancelButtonText: 'Hủy'
    });
    
    if (!result.isConfirmed) return;
    
    try {
      await updateDoc(doc(db, 'groups', group.id), { autoApproveStudents: newValue });
      Swal.fire({
        icon: 'success',
        title: newValue ? 'Đã bật tự động duyệt!' : 'Đã tắt tự động duyệt!',
        text: newValue ? 'Học sinh mới sẽ được tự động chấp nhận.' : 'Bạn sẽ cần duyệt học sinh thủ công.',
        timer: 2000,
        showConfirmButton: false
      });
    } catch (error) {
      Swal.fire('Lỗi', 'Không thể cập nhật cài đặt: ' + error.message, 'error');
    }
  };

  const handleUpdateWelcomeMessage = async () => {
    if (!group || !welcomeMessage.trim()) {
      showNotification('Vui lòng nhập thông điệp chào mừng hợp lệ.');
      return;
    }
    await updateDoc(doc(db, 'groups', group.id), { welcomeMessage: welcomeMessage.trim() });
    showNotification('Đã cập nhật thông điệp chào mừng! ✅');
  };

  const handleDeleteQuiz = async (quizId, title) => {
    const result = await Swal.fire({
      title: `Bạn chắc chắn muốn xóa "${title}"?`,
      text: 'Toàn bộ lịch sử thi của bộ câu hỏi này cũng sẽ bị xóa. Hành động này không thể hoàn tác!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Vâng, xóa nó!',
      cancelButtonText: 'Hủy',
    });
    if (result.isConfirmed) {
      try {
        Swal.fire({ title: 'Đang xóa...', html: 'Vui lòng chờ.', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
        const batch = writeBatch(db);
        batch.delete(doc(db, 'quizzes', quizId));
        const scoresQuery = query(collection(db, 'scores'), where('quizId', '==', quizId));
        const scoresSnapshot = await getDocs(scoresQuery);
        scoresSnapshot.forEach((scoreDoc) => batch.delete(scoreDoc.ref));
        await batch.commit();
        Swal.fire('Đã xóa!', `Bộ câu hỏi "${title}" và dữ liệu liên quan đã được xóa.`, 'success');
      } catch (error) {
        console.error('Lỗi khi xóa quiz và scores:', error);
        Swal.fire('Lỗi', 'Không thể xóa bộ câu hỏi.', 'error');
      }
    }
  };

  const handleDeleteDataByDateRange = async () => {
    if (!group || !deleteStartDate || !deleteEndDate) {
      return Swal.fire('Thiếu thông tin', 'Vui lòng chọn cả ngày bắt đầu và ngày kết thúc.', 'warning');
    }
    const { value: confirmationText } = await Swal.fire({
      title: '⚠️ HÀNH ĐỘNG NGUY HIỂM ⚠️',
      html: `Bạn sắp <b>XÓA VĨNH VIỄN</b> toàn bộ lịch sử thi của học viên trong lớp từ ngày <b>${deleteStartDate}</b> đến <b>${deleteEndDate}</b>. <br/><br/>Hành động này <b>KHÔNG THỂ HOÀN TÁC</b>. <br/><br/>Để xác nhận, nhập "<b>XÓA</b>" vào ô bên dưới:`,
      input: 'text',
      inputPlaceholder: 'Nhập XÓA để xác nhận',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Tôi hiểu và xác nhận XÓA',
      confirmButtonColor: '#d33',
      cancelButtonText: 'Hủy bỏ',
      inputValidator: (value) => (value !== 'XÓA' ? 'Bạn cần nhập chính xác từ "XÓA"!' : null),
    });
    if (confirmationText !== 'XÓA') return;
    try {
      Swal.fire({
        title: 'Đang xử lý...',
        html: 'Hệ thống đang tìm và xóa dữ liệu...',
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(),
      });
      const start = new Date(deleteStartDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(deleteEndDate);
      end.setHours(23, 59, 59, 999);
      const q = query(
        collection(db, 'scores'),
        where('groupId', '==', group.id),
        where('timestamp', '>=', start),
        where('timestamp', '<=', end)
      );
      const querySnapshot = await getDocs(q);
      if (querySnapshot.empty) {
        return Swal.fire('Không có dữ liệu', 'Không tìm thấy dữ liệu thi nào trong khoảng thời gian đã chọn.', 'info');
      }
      const batch = writeBatch(db);
      querySnapshot.forEach((doc) => batch.delete(doc.ref));
      await batch.commit();
      Swal.fire('Thành công!', `Đã xóa thành công ${querySnapshot.size} mục dữ liệu.`, 'success');
    } catch (error) {
      console.error('Lỗi khi xóa dữ liệu:', error);
      Swal.fire('Đã xảy ra lỗi', 'Không thể hoàn tất việc xóa dữ liệu.', 'error');
    }
  };

  const handleDeleteStudent = async (studentId, studentName) => {
    const result = await Swal.fire({
      title: `Bạn chắc chắn muốn xóa học sinh "${studentName}"?`,
      text: 'Học sinh này sẽ bị xóa vĩnh viễn khỏi lớp và hệ thống. Không thể hoàn tác!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      confirmButtonText: 'Vâng, tôi hiểu và muốn xóa!',
      cancelButtonText: 'Hủy',
    });

    if (result.isConfirmed) {
      Swal.fire({ title: 'Đang xóa...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
      try {
        const deleteStudentFunc = httpsCallable(functions, 'deleteStudentByTeacher');
        await deleteStudentFunc({ studentId: studentId });
        Swal.fire('Đã xóa!', `Học sinh "${studentName}" đã được xóa khỏi lớp.`, 'success');
      } catch (error) {
        console.error('Lỗi khi gọi Cloud Function deleteStudentByTeacher:', error);
        Swal.fire('Lỗi!', `Không thể xóa học sinh. ${error.message}`, 'error');
      }
    }
  };

  const filteredStudents = useMemo(
    () =>
      students.filter((student) => {
        const term = searchTerm.toLowerCase();
        const displayName = student.displayName?.toLowerCase() || '';
        const email = student.email?.toLowerCase() || '';
        return displayName.includes(term) || email.includes(term);
      }),
    [students, searchTerm]
  );
// ... (ngay sau khối useMemo, trước lệnh return)

  // ------------------------------------------------------------------
  // ✅ BƯỚC 1: CÁC HÀM HỖ TRỢ TẢI FILE .TXT
  // ------------------------------------------------------------------

  // Helper 1: Tải file (hàm này đã có trong QuizEditor.js)
  const downloadFile = (blob, fileName) => {
      try {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url; a.download = fileName;
          document.body.appendChild(a); a.click(); document.body.removeChild(a);
          URL.revokeObjectURL(url);
          Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: `Đã bắt đầu tải file ${fileName}`, showConfirmButton: false, timer: 3000 });
      } catch (error) {
          Swal.fire('Lỗi', 'Không thể tải file.', 'error');
      }
  };

  // Helper 2: Chuyển đổi HTML (câu hỏi/lựa chọn) về text
  const parseHtmlToText = (html) => {
      if (!html) return '';
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = html;
      
      // Thử lấy nội dung từ các thẻ <p> nếu có
      const paragraphs = tempDiv.querySelectorAll('p');
      if (paragraphs.length > 0) {
          return Array.from(paragraphs).map(p => p.textContent || '').join('\n');
      }
      
      // Fallback: lấy toàn bộ text content (bao gồm cả KaTeX)
      return tempDiv.textContent || '';
  };

  // Helper 3: Hàm chuyển đổi chính từ JSON sang TXT
  const convertQuizJsonToTxt = (quizJson) => {
      const lines = [];
      lines.push(`# TIÊU ĐỀ: ${quizJson.title || 'Chưa có tiêu đề'}`);
      if (quizJson.password) {
          lines.push(`MAT_KHAU: ${quizJson.password}`);
      }
      lines.push(''); // Dòng trống

      quizJson.clusters.forEach((cluster, cIdx) => {
          lines.push(`## Cụm ${cIdx + 1}: Giả thiết chung`);
          
          // Chuyển đổi Giả thiết chung (HTML) về dạng >
          const tempDiv = document.createElement('div');
          tempDiv.innerHTML = cluster.commonAssumption?.intro || '';
          const assumptionLines = Array.from(tempDiv.children).map(child => `> ${child.textContent || ''}`);
          lines.push(...assumptionLines);
          lines.push('');

          cluster.questions.forEach((q, qIdx) => {
              lines.push(`${qIdx + 1}. ${parseHtmlToText(q.questionText)}`);
              
              if (q.type === 'multiple_choice' || !q.type) {
                  q.choices.forEach(ch => {
                      const marker = (q.correctAnswer === ch.value) ? '[x]' : '';
                      const choiceText = parseHtmlToText(ch.text); // Dùng lại helper
                      lines.push(`    - (${ch.value}) ${marker || ''} ${choiceText}`);
                  });
              }
              // Bạn có thể thêm logic xuất file cho loại 'fill_in_the_blank' hoặc 'ordering' ở đây nếu muốn

              // Metadata
              lines.push(`    Điểm: ${q.points_correct}, ${q.points_incorrect}`);
              lines.push(`    Phạt: ${q.penalty_minutes} phút`);
              
              // Lời giải (giữ nguyên HTML vì parser của chúng ta hỗ trợ)
              if (q.solution) {
                  // Tách lời giải thành các dòng và thụt đầu dòng
                  const solutionLines = q.solution.split('\n').map(line => line.trim());
                  const firstLine = solutionLines.shift() || ''; // Lấy dòng đầu tiên
                  lines.push(`    Giải thích: ${firstLine}`);
                  if (solutionLines.length > 0) {
                       lines.push(...solutionLines.map(line => `    ${line}`));
                  }
              }

              lines.push('    ---'); // Dấu phân cách
              lines.push(''); // Dòng trống
          });
      });

      return lines.join('\n');
  };

  // Helper 4: Hàm xử lý sự kiện click
  const handleDownloadQuizAsTxt = async (quizMeta) => {
      if (!quizMeta || !quizMeta.downloadURL) {
          Swal.fire('Lỗi', 'Không tìm thấy dữ liệu đề thi.', 'error');
          return;
      }

      Swal.fire({ 
          title: 'Đang chuẩn bị file...', 
          html: `Đang tải nội dung từ <b>${quizMeta.title}</b>`,
          allowOutsideClick: false, 
          didOpen: () => Swal.showLoading() 
      });

      try {
          // 1. Tải file JSON đầy đủ từ storage
          const response = await fetch(quizMeta.downloadURL);
          if (!response.ok) throw new Error('Không thể tải file JSON gốc.');
          const quizContent = await response.json();
          
          // 2. Chuyển đổi JSON sang định dạng TXT
          const txtContent = convertQuizJsonToTxt(quizContent);
          
          // 3. Tạo Blob và tải về
          const blob = new Blob([txtContent], { type: 'text/plain;charset=utf-8' });
          
          // Tạo tên file an toàn (vd: "bài_thi_logic" -> "bai_thi_logic.txt")
          const safeFileName = (quizMeta.title || 'de_thi').replace(/[^a-z0-9]/gi, '_').toLowerCase();
          
          downloadFile(blob, `${safeFileName}.txt`);
          
          Swal.close(); // Tắt loading, downloadFile đã có toast riêng

      } catch (error) {
          console.error("Lỗi khi tải file .txt:", error);
          Swal.fire('Lỗi', `Không thể tạo file .txt. ${error.message}`, 'error');
      }
  };

  // ------------------------------------------------------------------
  // ✅ KẾT THÚC PHẦN THÊM MỚI
  // ------------------------------------------------------------------

  if (loadingAuth || !isAuthorized || !group) {
    return (
      <div className="screen-container d-flex justify-content-center align-items-center vh-100">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Đang tải và kiểm tra quyền...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <h1 className="mb-0">Trang quản lý: {group.name}</h1>
        <Link to={`/${teacherSlug}`} className="btn btn-outline-primary">
          <i className="fa-solid fa-eye me-2"></i>Xem trang học sinh
        </Link>
      </div>
      {notification && <div className="alert alert-success">{notification}</div>}

      <ul className="nav nav-pills mb-3">
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === 'quizzes' ? 'active' : ''}`}
            onClick={() => setActiveTab('quizzes')}
          >
            📚 Quản lý Câu hỏi
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link position-relative ${activeTab === 'students' ? 'active' : ''}`}
            onClick={() => setActiveTab('students')}
          >
            🎓 Quản lý Học viên
            {pendingRequests.length > 0 && (
              <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
                {pendingRequests.length}
                <span className="visually-hidden">yêu cầu mới</span>
              </span>
            )}
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            ⚙️ Cài đặt Lớp học
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === 'data' ? 'active' : ''}`}
            onClick={() => setActiveTab('data')}
          >
            🗑️ Quản lý Dữ liệu
          </button>
        </li>
      </ul>

      {activeTab === 'quizzes' && (
        <div className="card">
          <div className="card-body">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="card-title mb-0">Kho câu hỏi của bạn</h5>
              <button className="btn btn-success" onClick={() => navigate(`/dashboard/${teacherSlug}/quiz/new`)}>
                <i className="fa-solid fa-plus me-2"></i>Soạn Bộ câu hỏi mới
              </button>
            </div>
            <div className="table-responsive">
              <table className="table table-hover align-middle">
                <thead>
                  <tr>
                    <th>Tên bộ câu hỏi</th>
                    <th className="text-end">Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {quizzes.length === 0 && (
                    <tr>
                      <td colSpan="2">Chưa có bộ câu hỏi nào.</td>
                    </tr>
                  )}
                  {quizzes.map((q) => (
                    <tr key={q.id}>
                      <td>{q.title}</td>
                      <td className="text-end">
                        <button
                          className="btn btn-sm btn-info me-2"
                          onClick={() => {
                            if (!group?.id) {
                              Swal.fire('Lỗi tải dữ liệu', 'Dữ liệu lớp chưa sẵn sàng. Vui lòng thử lại sau 2 giây.', 'warning');
                              return;
                            }
                            setViewingLeaderboardFor(q);
                          }}
                        >
                          🏆 BXH
                        </button>
                        {/* ✅ THÊM: Nút Vào Thi cho giáo viên trong dashboard */}
                        <button 
                          className="btn btn-sm btn-outline-primary me-2" 
                          onClick={() => {
                            // Navigate đến lobby để test (vì GameApp ở đó)
                            navigate(`/${teacherSlug}`);
                            // Hoặc set state nếu integrate GameApp ở đây, nhưng giữ đơn giản
                            setTimeout(() => {
                              // Giả sử setSelectedQuiz ở lobby, nhưng vì navigate, cần adjust nếu cần
                              console.log('Chuyển đến lobby để test quiz:', q.id);
                            }, 500);
                          }} 
                          title="Test bộ câu hỏi"
                        >
                          <i className="fas fa-play me-1"></i>Vào thi
                        </button>
                        <button className="btn btn-sm btn-warning me-2" onClick={() => navigate(`/dashboard/${teacherSlug}/quiz/${q.id}`)}>
                          Sửa
                        </button>
                        {/* ✅ THÊM NÚT TẢI TXT VÀO ĐÂY */}
                        <button 
                          className="btn btn-sm btn-outline-secondary me-2" 
                          onClick={() => handleDownloadQuizAsTxt(q)}
                          title="Tải về file .txt"
                        >
                          <i className="fa-solid fa-file-arrow-down me-1"></i> Tải .txt
                        </button>
                        <button className="btn btn-sm btn-danger" onClick={() => handleDeleteQuiz(q.id, q.title)}>
                          Xóa
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'students' && (
        <div className="card">
          <div className="card-body">
            {pendingRequests.length > 0 && (
              <div className="mb-4 p-3 border border-warning rounded bg-warning-subtle">
                <h5 className="card-title text-warning-emphasis">Yêu cầu đang chờ duyệt ({pendingRequests.length})</h5>
                <div className="table-responsive">
                  <table className="table table-hover align-middle mb-0">
                    <tbody>
                      {pendingRequests.map((request) => {
                        const student = pendingUsers.get(request.studentId);
                        if (!student)
                          return (
                            <tr key={request.id}>
                              <td colSpan="2">Đang tải thông tin...</td>
                            </tr>
                          );
                        return (
                          <tr key={request.id}>
                            <td>
                              <img src={student.photoURL} alt={student.displayName} width="30" height="30" className="rounded-circle me-2" />
                              {student.displayName || student.email}
                            </td>
                            <td className="text-end">
                              <button className="btn btn-sm btn-success me-2" onClick={() => handleProcessRequest(request, true)}>
                                Duyệt
                              </button>
                              <button className="btn btn-sm btn-outline-danger" onClick={() => handleProcessRequest(request, false)}>
                                Từ chối
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <h5 className="card-title">Danh sách học viên chính thức ({students.length})</h5>
            <div className="my-3 p-3 border rounded bg-light">
              <div className="row g-2 align-items-center">
                <div className="col-lg-5">
                  <div className="input-group">
                    <span className="input-group-text">
                      <i className="fa-solid fa-search"></i>
                    </span>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Tìm theo tên hoặc email..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
                <div className="col-lg-7 d-flex align-items-center justify-content-start justify-content-lg-end flex-wrap gap-2">
                  <div className="form-check form-switch fs-5" title="Bật để tự động chấp nhận học viên mới">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      role="switch"
                      id="autoApproveSwitch"
                      checked={group.autoApproveStudents || false}
                      onChange={handleToggleAutoApprove}
                      style={{ cursor: 'pointer', width: '3em', height: '1.5em' }}
                    />
                    <label className="form-check-label fw-bold" htmlFor="autoApproveSwitch" style={{ cursor: 'pointer' }}>
                      {group.autoApproveStudents ? '✅ Tự động duyệt: BẬT' : '⏸️ Tự động duyệt: TẮT'}
                    </label>
                  </div>
                </div>
              </div>
            </div>
            <div className="table-responsive">
              <table className="table table-hover align-middle">
                <thead>
                  <tr>
                    <th>Học viên</th>
                    <th className="text-end">Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.length === 0 && (
                    <tr>
                      <td colSpan="2">Chưa có học viên nào trong lớp.</td>
                    </tr>
                  )}
                  {filteredStudents.map((student) => (
                    <tr key={student.id}>
                      <td>
                        <img src={student.photoURL} alt={student.displayName} width="30" height="30" className="rounded-circle me-2" />
                        {student.displayName || student.email}
                      </td>
                      <td className="text-end">
                        <button
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => handleDeleteStudent(student.id, student.displayName)}
                          title={`Xóa học sinh ${student.displayName}`}
                        >
                          <i className="fa-solid fa-user-slash"></i>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="card">
          <div className="card-body">
            <h5 className="card-title">Cài đặt Thông điệp Chào mừng 👋</h5>
            <p className="card-text">Tùy chỉnh văn bản hiển thị trên trang chính của lớp học.</p>
            <div className="p-3 border rounded bg-light">
              <div className="mb-3">
                <label htmlFor="welcomeMessage" className="form-label">Thông điệp chào mừng:</label>
                <textarea
                  id="welcomeMessage"
                  className="form-control"
                  rows="2"
                  placeholder={`Mặc định: Chào mừng đến lớp học của ${group.name}`}
                  value={welcomeMessage}
                  onChange={(e) => setWelcomeMessage(e.target.value)}
                />
              </div>
              <button className="btn btn-primary" onClick={handleUpdateWelcomeMessage}>
                Lưu thay đổi
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'data' && (
        <div className="card border-danger">
          <div className="card-header bg-danger text-white">
            <h5 className="mb-0">Vùng nguy hiểm: Xóa Dữ liệu Thi</h5>
          </div>
          <div className="card-body">
            <p className="card-text">Chức năng này cho phép bạn xóa vĩnh viễn điểm số và lịch sử làm bài của tất cả học viên trong một khoảng thời gian nhất định.</p>
            <div className="row g-3 align-items-center p-3 border rounded bg-light">
              <div className="col-md-auto">
                <label htmlFor="deleteStartDate" className="form-label fw-bold">Xóa từ ngày:</label>
              </div>
              <div className="col-md-3">
                <input
                  type="date"
                  id="deleteStartDate"
                  className="form-control"
                  value={deleteStartDate}
                  onChange={(e) => setDeleteStartDate(e.target.value)}
                />
              </div>
              <div className="col-md-auto">
                <label htmlFor="deleteEndDate" className="form-label fw-bold">Đến ngày:</label>
              </div>
              <div className="col-md-3">
                <input
                  type="date"
                  id="deleteEndDate"
                  className="form-control"
                  value={deleteEndDate}
                  onChange={(e) => setDeleteEndDate(e.target.value)}
                />
              </div>
              <div className="col-md-auto">
                <button
                  className="btn btn-danger"
                  onClick={handleDeleteDataByDateRange}
                  disabled={!deleteStartDate || !deleteEndDate}
                >
                  <i className="fa-solid fa-trash-can me-2"></i>Xóa Dữ liệu
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ✅ MODAL BẢNG XẾP HẠNG - ĐÃ DÙNG REACT-BOOTSTRAP */}
      <Modal
        show={!!viewingLeaderboardFor}
        onHide={() => setViewingLeaderboardFor(null)}
        size="lg"
        centered
        backdrop="static"
        keyboard={false}
      >
        <Modal.Header closeButton>
          <Modal.Title>Bảng xếp hạng: {viewingLeaderboardFor?.title || ''}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {viewingLeaderboardFor && group && (
            <Leaderboard quizId={viewingLeaderboardFor.id} groupId={group.id} />
          )}
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default TeacherDashboard;