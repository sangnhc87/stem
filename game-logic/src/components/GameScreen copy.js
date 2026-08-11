import React, { useState, useEffect, useRef, useMemo } from 'react';
import { auth, db } from '../firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import CommonAssumption from './CommonAssumption';
import ProgressBar from './ProgressBar';
import KatexRenderer from './KatexRenderer';
import Leaderboard from './Leaderboard';

const Swal = window.Swal;
const correctAudio = new Audio('/correct.mp3');
const incorrectAudio = new Audio('/incorrect.mp3');

const TimerDisplay = ({ seconds }) => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return (
    <div className="penalty-timer">
      <i className="fa-solid fa-clock penalty-timer-icon"></i>
      <span className="penalty-timer-text">Thời gian phạt còn lại:</span>
      <span className="penalty-timer-time">
        {minutes.toString().padStart(2, '0')}:{remainingSeconds.toString().padStart(2, '0')}
      </span>
    </div>
  );
};

const GameScreen = ({ questionSet, onFinish }) => {
    const [currentClusterIndex, setCurrentClusterIndex] = useState(0);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [totalScore, setTotalScore] = useState(0);
    const [selectedAnswer, setSelectedAnswer] = useState(null);
    const [fillInAnswer, setFillInAnswer] = useState('');
    const [isCorrectlyAnswered, setIsCorrectlyAnswered] = useState(false);
    const [isPenalized, setIsPenalized] = useState(false);
    const [penaltyTimer, setPenaltyTimer] = useState(0);
    const [showSolution, setShowSolution] = useState(false);
    const [animationState, setAnimationState] = useState('fade-in');
    const [cumulativeTime, setCumulativeTime] = useState(0);
    
    const timerIntervalRef = useRef(null);
    const questionStartTimeRef = useRef(Date.now());

    const currentCluster = questionSet.clusters[currentClusterIndex];
    const currentQuestion = currentCluster.questions[currentIndex];

    const { totalQuestions, completedQuestions } = useMemo(() => {
        const total = questionSet.clusters.reduce((sum, cluster) => sum + cluster.questions.length, 0);
        const completedInPreviousClusters = questionSet.clusters
          .slice(0, currentClusterIndex)
          .reduce((sum, cluster) => sum + cluster.questions.length, 0);
        return {
          totalQuestions: total,
          completedQuestions: completedInPreviousClusters + currentIndex,
        };
    }, [questionSet.clusters, currentClusterIndex, currentIndex]);
    
    useEffect(() => {
        setSelectedAnswer(null);
        setFillInAnswer('');
        setIsCorrectlyAnswered(false);
        setShowSolution(false);
        setIsPenalized(false);
        setPenaltyTimer(0);
        clearInterval(timerIntervalRef.current);
        setAnimationState('fade-in');
        questionStartTimeRef.current = Date.now();
    }, [currentClusterIndex, currentIndex]);

    useEffect(() => {
        if (isPenalized && penaltyTimer > 0) {
          timerIntervalRef.current = setInterval(() => setPenaltyTimer(t => t - 1), 1000);
        } else if (penaltyTimer === 0 && isPenalized) {
          setIsPenalized(false);
          Swal.fire({ title: 'Hết thời gian phạt!', text: 'Bạn có thể thử lại.', icon: 'info' });
        }
        return () => clearInterval(timerIntervalRef.current);
    }, [isPenalized, penaltyTimer]);

    const handleNext = () => {
        setAnimationState('fade-out');
        setTimeout(() => {
          const isLastQuestionInCluster = currentIndex === currentCluster.questions.length - 1;
          const isLastCluster = currentClusterIndex === questionSet.clusters.length - 1;
          if (isLastQuestionInCluster && isLastCluster) {
            onFinish(totalScore, cumulativeTime);
          } else if (isLastQuestionInCluster) {
            Swal.close();
            setCurrentClusterIndex(prev => prev + 1);
            setCurrentIndex(0);
          } else {
            setCurrentIndex(prev => prev + 1);
          }
        }, 500);
    };
    
    const handleCheckAnswer = async () => {
        const isMultipleChoice = (currentQuestion.type === 'multiple_choice' || !currentQuestion.type);
        let userAnswer = isMultipleChoice ? selectedAnswer : fillInAnswer.trim();
        if (!userAnswer) {
          Swal.fire({ title: 'Chưa trả lời!', text: 'Vui lòng chọn hoặc điền đáp án.', icon: 'warning' });
          return;
        }
    
        const timeTaken = (Date.now() - questionStartTimeRef.current) / 1000;
        const newCumulativeTime = cumulativeTime + timeTaken;
        setCumulativeTime(newCumulativeTime);
    
        let isCorrect = false;
        if (isMultipleChoice) {
            isCorrect = userAnswer === currentQuestion.correctAnswer;
        } else {
            const correctAnswers = (currentQuestion.correctAnswer || '').split(',').map(ans => ans.trim().toLowerCase());
            isCorrect = correctAnswers.includes(userAnswer.toLowerCase());
        }
        
        let newScore = totalScore;
        if (isCorrect) {
          correctAudio.play().catch(e => console.error("Lỗi âm thanh:", e));
          newScore += (currentQuestion.points_correct || 10);
          setIsCorrectlyAnswered(true);
          Swal.fire({ title: 'Chính xác!', icon: 'success' });
        } else {
          incorrectAudio.play().catch(e => console.error("Lỗi âm thanh:", e));
          newScore += (currentQuestion.points_incorrect || 0);
          const penaltyDuration = (currentQuestion.penalty_minutes || 0) * 60;
          if (penaltyDuration > 0) {
            setPenaltyTimer(penaltyDuration);
            setIsPenalized(true);
            Swal.fire({ title: 'Sai rồi!', text: `Bạn bị phạt ${currentQuestion.penalty_minutes} phút.`, icon: 'error' });
          } else {
             Swal.fire({ title: 'Sai rồi!', icon: 'error' });
          }
        }
        setTotalScore(newScore);
    
        const user = auth.currentUser;
        if (user) {
          const leaderboardRef = doc(db, 'leaderboard', user.uid);
          await setDoc(leaderboardRef, { displayName: user.displayName, photoURL: user.photoURL, score: newScore, totalTimeSeconds: newCumulativeTime, lastPlayed: serverTimestamp() }, { merge: true });
        }
    };

    return (
        <div className={`game-container ${animationState}`}>
            <div className="game-main">
                <ProgressBar current={completedQuestions} total={totalQuestions} />
                <div className="info-box question-box">
                    <h2 className="section-title">Câu {completedQuestions + 1} / {totalQuestions}</h2>
                    
                    {currentQuestion.imageUrl && (
                        <div className="text-center mb-3">
                            <img src={currentQuestion.imageUrl} alt="Hình ảnh câu hỏi" className="img-fluid rounded" style={{ maxHeight: '300px' }} />
                        </div>
                    )}
                    
                    <KatexRenderer htmlString={`<p>${currentQuestion.questionText}</p>`} />
                    
                    {(currentQuestion.type === 'multiple_choice' || !currentQuestion.type) ? (
  <div className="choice-grid quizlet-style clean compact">
    {currentQuestion.choices.map((choice) => (
      <label
        key={choice.value}
        className={`choice-card 
          ${selectedAnswer === choice.value ? 'selected' : ''} 
          ${isCorrectlyAnswered 
            ? (choice.value === currentQuestion.correctAnswer ? 'correct' : 'incorrect') 
            : ''}`}
      >
        <input 
          type="radio" 
          name={`q-${currentIndex}`} 
          value={choice.value} 
          checked={selectedAnswer === choice.value} 
          onChange={() => setSelectedAnswer(choice.value)} 
          disabled={isPenalized || isCorrectlyAnswered}
        />

        <div className="choice-card-content">
          {/* Chữ cái góc trên trái */}
          <div className="choice-letter-wrapper">
            <span className="choice-card-value" data-letter={choice.value}>
              {choice.value}
            </span>
          </div>

          {/* Nội dung câu lựa chọn */}
          <div className="choice-text-body">
            {choice.imageUrl && (
              <img
                src={choice.imageUrl}
                alt={`Lựa chọn ${choice.value}`}
                className="choice-card-image"
              />
            )}
            <KatexRenderer htmlString={choice.text} />
          </div>
        </div>
      </label>
    ))}
  </div>
) : (
  /* Fill-in giữ nguyên */
  <div className="my-3">
    <input
      type="text"
      className="form-control form-control-lg"
      placeholder="Nhập đáp án của bạn..."
      value={fillInAnswer}
      onChange={(e) => setFillInAnswer(e.target.value)}
      disabled={isPenalized || isCorrectlyAnswered}
    />
  </div>
)}

                    
                    {isPenalized && <TimerDisplay seconds={penaltyTimer} />}
                    
                    <div className="game-actions mt-3">
                        {!isCorrectlyAnswered && (
                            <button className="btn btn-success" onClick={handleCheckAnswer} disabled={isPenalized || (!selectedAnswer && !fillInAnswer)}>
                                Kiểm Tra
                            </button>
                        )}
                        {isCorrectlyAnswered && (
                            <>
                                <button className="btn btn-primary" onClick={handleNext}>
                                    {(completedQuestions + 1 === totalQuestions) ? 'Xem Kết Quả' : 'Tiếp Theo'}
                                </button>
                                {currentQuestion.show_solution && (
                                    <button className="btn btn-info ms-2" onClick={() => setShowSolution(!showSolution)}>
                                        {showSolution ? 'Ẩn lời giải' : 'Xem lời giải'}
                                    </button>
                                )}
                            </>
                        )}
                    </div>
                    
                    {isCorrectlyAnswered && showSolution && currentQuestion.solution && (
                        <div className="solution-container mt-3 card card-body">
                            <KatexRenderer htmlString={currentQuestion.solution} />
                        </div>
                    )}
                </div>
            </div>
            <aside className="game-sidebar">
                {/* Chỉ hiển thị Giả thiết chung khi cụm có > 1 câu hỏi VÀ có nội dung */}
                {currentCluster.questions.length > 1 && currentCluster.commonAssumption?.intro && (
                    <CommonAssumption assumption={currentCluster.commonAssumption} />
                )}
                <div className="info-box mt-3 text-center">
                    <h3>Tổng Điểm</h3>
                    <p className="fs-1 fw-bold text-primary">{totalScore}</p>
                </div>
                <Leaderboard />
            </aside>
        </div>
    );
};

export default GameScreen;

