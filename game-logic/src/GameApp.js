import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp, collection, query, where, onSnapshot } from 'firebase/firestore';
import StartScreen from './components/StartScreen';
import GameScreen from './components/GameScreen';
import ResultsScreen from './components/ResultsScreen';
import LoginScreen from './components/LoginScreen';
import Swal from 'sweetalert2';
import 'katex/dist/katex.min.css';

// Hàm parseTxtToQuizJson giữ nguyên, không có log nhạy cảm
const parseTxtToQuizJson = (txtContent) => {
  const quiz = { title: 'Chưa có tiêu đề', clusters: [] };
  const cleanContent = txtContent.split('\n').filter(line => !line.trim().startsWith('//')).join('\n');
  
  const passwordMatch = cleanContent.match(/MAT_KHAU:\s*(.*)/);
  if (passwordMatch) {
    quiz.password = passwordMatch[1].trim();
  }
  
  const titleMatch = cleanContent.match(/TIEU_DE:\s*(.*)/);
  if (titleMatch) quiz.title = titleMatch[1].trim();
  
  const clusterBlocks = cleanContent.split('CUM_CAU_HOI_BAT_DAU');
  clusterBlocks.slice(1).forEach(block => {
    const cluster = { commonAssumption: { intro: '', rules: [] }, questions: [] };
    const assumptionMatch = block.match(/GIA_THIET:\s*(.*)/);
    if (assumptionMatch) cluster.commonAssumption.intro = assumptionMatch[1].trim();
    const ruleMatches = [...block.matchAll(/QUY_TAC:\s*(.*)/g)];
    cluster.commonAssumption.rules = ruleMatches.map(match => match[1].trim());
    const questionBlocks = block.split('CAU_HOI_BAT_DAU');
    questionBlocks.slice(1).forEach(qBlock => {
      const question = { type: 'multiple_choice', choices: [] };
      const getVal = (key) => {
        const match = qBlock.match(new RegExp(`${key}:\\s*([\\s\\S]*?)(?=\\n[A-Z_]{2,}|CAU_HOI_KET_THUC|CUM_CAU_HOI_KET_THUC|$)`));
        return match ? match[1].trim() : null;
      }
      question.questionText = getVal('CAU_HOI');
      question.type = getVal('LOAI') === 'DIEN_DAP_AN' ? 'fill_in_the_blank' : 'multiple_choice';
      if (question.type === 'multiple_choice') {
        const choiceMatches = [...qBlock.matchAll(/LUA_CHON:\s*([A-Z])\.\s*(.*)/g)];
        question.choices = choiceMatches.map(m => ({ value: m[1], text: m[2].trim() }));
      }
      question.correctAnswer = getVal('DAP_AN');
      question.points_correct = Number(getVal('DIEM_DUNG') || 10);
      question.points_incorrect = Number(getVal('DIEM_SAI') || 0);
      question.penalty_minutes = Number(getVal('PHUT_PHAT') || 0);
      question.show_solution = getVal('HIEN_GIAI')?.toUpperCase() === 'CO';
      question.solution = getVal('LOI_GIAI') || '';
      cluster.questions.push(question);
    });
    quiz.clusters.push(cluster);
  });
  return quiz;
};

function GameApp({ selectedQuiz, groupId, onReturnToLobby }) {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [allQuizzes, setAllQuizzes] = useState([]);
  const [gameState, setGameState] = useState('start');
  const [finalScore, setFinalScore] = useState(0);
  const [activeQuiz, setActiveQuiz] = useState(null);
  const [isLoadingGame, setIsLoadingGame] = useState(false);
  const gameInitRef = useRef(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setLoading(true);
      let unsubQuizzes = () => {};
      if (currentUser) {
        const idTokenResult = await currentUser.getIdTokenResult(true);
        const claims = idTokenResult.claims;
        const userRef = doc(db, 'users', currentUser.uid);
        const userSnap = await getDoc(userRef);
        let userData = userSnap.data();
        if (!userSnap.exists()) {
          const newUserPayload = { 
            email: currentUser.email, displayName: currentUser.displayName, photoURL: currentUser.photoURL, 
            role: 'student', status: 'approved', groupId: groupId || null
          };
          await setDoc(userRef, newUserPayload);
          userData = newUserPayload;
        }
        const fullUser = { ...currentUser, ...userData, claims: claims };
        setUser(fullUser);
        const q = groupId && fullUser.groupId === groupId
          ? query(collection(db, 'quizzes'), where('groupId', '==', groupId))
          : (claims.role === 'admin' || claims.role === 'teacher')
          ? query(collection(db, 'quizzes'))
          : query(collection(db, 'quizzes'), where('groupId', '==', null));
        unsubQuizzes = onSnapshot(q, (snapshot) => {
          setAllQuizzes(snapshot.docs.map(doc => ({id: doc.id, ...doc.data()})));
        }, (error) => console.error("Lỗi khi tải quizzes:", error));
      } else {
        setUser(null);
        const q = query(collection(db, 'quizzes'), where('groupId', '==', null));
        unsubQuizzes = onSnapshot(q, (snapshot) => {
          setAllQuizzes(snapshot.docs.map(doc => ({id: doc.id, ...doc.data()})));
        });
      }
      setLoading(false);
      return () => unsubQuizzes();
    });
    return () => unsubscribe();
  }, [groupId]);

  useEffect(() => {
    if (user && user.claims && (user.claims.role === 'teacher' || user.claims.role === 'admin')) {
      if (window.location.pathname === '/' && !window.location.pathname.includes('/teacher/')) {
        if (user.claims.role === 'admin') {
          navigate('/admin');
        } else if (user.claims.role === 'teacher' && user.groupId) {
          const findAndRedirectTeacher = async () => {
            const groupRef = doc(db, 'groups', user.groupId);
            const groupSnap = await getDoc(groupRef);
            if (groupSnap.exists()) {
              const slug = groupSnap.data().slug;
              if (slug) navigate(`/dashboard/${slug}`);
            }
          };
          findAndRedirectTeacher();
        }
      }
    }
  }, [user, navigate]);

  useEffect(() => {
    if (selectedQuiz && !gameInitRef.current) {
      gameInitRef.current = true;
      setIsLoadingGame(true);
      handleStartGame(selectedQuiz)
        .finally(() => {
          gameInitRef.current = false;
          setIsLoadingGame(false);
        });
    }
    if (!selectedQuiz) {
      gameInitRef.current = false;
    }
  }, [selectedQuiz]);

  const handleStartGame = async (quizMeta) => {
    if (!quizMeta || !quizMeta.downloadURL) {
      Swal.fire('Lỗi', 'Thông tin bộ câu hỏi không đầy đủ.', 'error');
      if (onReturnToLobby) onReturnToLobby();
      return;
    }
    const now = new Date();
    let openTime = quizMeta.openTime ? (quizMeta.openTime.toDate ? quizMeta.openTime.toDate() : new Date(quizMeta.openTime._seconds * 1000)) : null;
    let closeTime = quizMeta.closeTime ? (quizMeta.closeTime.toDate ? quizMeta.closeTime.toDate() : new Date(quizMeta.closeTime._seconds * 1000)) : null;

    if (openTime && !isNaN(openTime) && now < openTime) {
      Swal.fire({ icon: 'info', title: 'Chưa đến giờ làm bài!', html: `Mở vào lúc: <br><b>${openTime.toLocaleString('vi-VN')}</b>` });
      if (onReturnToLobby) onReturnToLobby();
      return;
    }
    if (closeTime && !isNaN(closeTime) && now > closeTime) {
      Swal.fire({ icon: 'error', title: 'Đã hết thời gian làm bài!', html: `Đóng vào lúc: <br><b>${closeTime.toLocaleString('vi-VN')}</b>` });
      if (onReturnToLobby) onReturnToLobby();
      return;
    }

    try {
      let enteredPassword = null;
      if (quizMeta.hasPassword) {
        const result = await Swal.fire({
          title: 'Yêu cầu mật khẩu',
          html: `Bộ câu hỏi <b>"${quizMeta.title}"</b> được bảo vệ bởi mật khẩu.`,
          input: 'password', inputPlaceholder: 'Nhập mật khẩu...',
          showCancelButton: true, confirmButtonText: 'Bắt đầu', cancelButtonText: 'Hủy'
        });
        if (!result.isConfirmed || !result.value) {
          if (onReturnToLobby) onReturnToLobby();
          return;
        }
        enteredPassword = result.value;
      }
      Swal.fire({ title: 'Đang tải đề thi...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });

      // Kiểm tra xem học sinh đã làm bài này chưa (chống gian lận)
      if (user) {
          const scoreDocId = `${user.uid}_${quizMeta.id}`;
          const existingScore = await getDoc(doc(db, 'scores', scoreDocId));
          if (existingScore.exists() && existingScore.data().isFinal) {
              Swal.fire({
                  icon: 'warning',
                  title: 'Đã hoàn thành!',
                  text: 'Bạn đã làm bài thi này rồi. Không thể làm lại.',
              });
              if (onReturnToLobby) onReturnToLobby();
              return;
          }
      }

      const response = await fetch(quizMeta.downloadURL);
      if (!response.ok) {
        throw new Error(`Lỗi mạng khi tải file, status: ${response.status}`);
      }
      const fileContent = await response.text();
      const quizContent = quizMeta.fileType === 'txt' ? parseTxtToQuizJson(fileContent) : JSON.parse(fileContent);
      quizContent.id = quizMeta.id;

      if (quizMeta.hasPassword && quizContent.password !== enteredPassword) {
        Swal.fire('Sai mật khẩu!', 'Mật khẩu bạn nhập không chính xác.', 'error');
        if (onReturnToLobby) onReturnToLobby();
        return;
      }
      
      setActiveQuiz(quizContent);
      setGameState('playing');
      setTimeout(() => {
        Swal.close();
      }, 100);
    } catch (error) {
      console.error('Lỗi khi bắt đầu game:', error);
      Swal.fire('Lỗi Tải Đề!', `Không thể xử lý được file đề thi. Vui lòng kiểm tra lại cấu trúc file. (Chi tiết: ${error.message})`, 'error');
      if (onReturnToLobby) onReturnToLobby();
    }
  };

  const handleFinishGame = async (score, duration) => {
    setFinalScore(score);
    setGameState('results');
    if (user && activeQuiz) {
      // Xóa tiến trình sessionStorage
      const progressKey = `game_progress_${activeQuiz.id}_${user.uid}`;
      sessionStorage.removeItem(progressKey);

      const scoreDocId = `${user.uid}_${activeQuiz.id}`;
      await setDoc(doc(db, 'scores', scoreDocId), {
        userId: user.uid, quizId: activeQuiz.id, groupId: groupId || user.groupId || null,
        displayName: user.displayName, photoURL: user.photoURL, score: score,
        durationSeconds: duration, timestamp: serverTimestamp(), isFinal: true
      });
    }
  };
  
  const handlePlayAgain = () => {
    Swal.fire({
      icon: 'info',
      title: 'Không thể làm lại',
      text: 'Bài thi chỉ được làm một lần duy nhất.',
    });
  };

  const handleBackToMenu = () => {
    setActiveQuiz(null); 
    setGameState('start');
    setIsLoadingGame(false);
    if (onReturnToLobby) {
      onReturnToLobby();
    }
  };

  const renderContent = () => {
    if (loading) {
      return <div className="screen-container"><h1>Đang tải...</h1></div>;
    }
    if (!user) {
      return <LoginScreen />;
    }
    if (user.status === 'pending' && user.role === 'teacher') {
      return <div className="screen-container"><h1>Tài khoản giáo viên đang chờ duyệt.</h1></div>;
    }
    if (user.status === 'disabled') {
      return <div className="screen-container"><h1>Tài khoản đã bị khóa.</h1></div>;
    }
    if (user.claims && (user.claims.role === 'teacher' || user.claims.role === 'admin') && window.location.pathname === '/') {
      return <div className="screen-container"><h1>Đang chuyển đến trang quản lý...</h1></div>;
    }

    switch (gameState) {
      case 'playing':
        // Thêm một check an toàn trước khi render GameScreen
        if (!activeQuiz) {
            return <div className="screen-container"><h1>Đang chuẩn bị...</h1></div>;
        }
        return <GameScreen questionSet={activeQuiz} groupId={groupId} onFinish={handleFinishGame} />;
      
      case 'results':
        const totalPoints = activeQuiz?.clusters.reduce((s, c) => s + c.questions.reduce((qs, q) => qs + (q.points_correct || 10), 0), 0) || 0;
        return (
          <ResultsScreen 
            score={finalScore} totalPoints={totalPoints} onBackToMenu={handleBackToMenu} 
            onPlayAgain={handlePlayAgain} quizId={activeQuiz.id} groupId={groupId}
            currentUserId={user.uid}
          />
        );
      
      default: // 'start'
        if (selectedQuiz || isLoadingGame) {
          return (
            <div className="screen-container text-center py-5">
              <div className="spinner-border text-primary mb-3" role="status">
                <span className="visually-hidden">Đang tải đề thi...</span>
              </div>
              <h3>Đang chuẩn bị bài thi...</h3>
              <p className="text-muted">Vui lòng chờ, không đóng tab.</p>
            </div>
          );
        }
        return <StartScreen quizData={allQuizzes} onStartGame={handleStartGame} />;
    }
  };

  return renderContent();
}

export default GameApp;