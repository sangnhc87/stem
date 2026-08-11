import React, { useState, useEffect, useRef, useMemo } from 'react';
import { auth, db } from '../firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import CommonAssumption from './CommonAssumption';
import ProgressBar from './ProgressBar';
import KatexRenderer from './KatexRenderer'; // ✅ CHỈ CẦN DÙNG COMPONENT NÀY
import Leaderboard from './Leaderboard';
// import HtmlKatexRenderer from './HtmlKatexRenderer'; // ❌ BỎ DÒNG NÀY

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

// `onFinish` gốc được truyền từ component cha để đóng màn hình game
const GameScreen = ({ questionSet, groupId, onFinish: originalOnFinish }) => {
    const user = auth.currentUser;

    // === Khôi phục tiến trình từ sessionStorage (chống reload gian lận) ===
    const storageKey = useMemo(() =>
        user ? `game_progress_${questionSet.id}_${user.uid}` : null
    , [questionSet.id, user]);

    const [savedProgress] = useState(() => {
        if (!storageKey) return null;
        try {
            const saved = sessionStorage.getItem(storageKey);
            if (saved) {
                const data = JSON.parse(saved);
                if (data.quizId === questionSet.id) return data;
            }
        } catch (e) {}
        return null;
    });

    const [currentClusterIndex, setCurrentClusterIndex] = useState(savedProgress?.clusterIndex ?? 0);
    const [currentIndex, setCurrentIndex] = useState(savedProgress?.questionIndex ?? 0);
    const [totalScore, setTotalScore] = useState(savedProgress?.score ?? 0);
    const [selectedAnswer, setSelectedAnswer] = useState(savedProgress?.selectedAnswer ?? null);
    const [fillInAnswer, setFillInAnswer] = useState(savedProgress?.fillInAnswer ?? '');
    const [isCorrectlyAnswered, setIsCorrectlyAnswered] = useState(savedProgress?.isCorrectlyAnswered ?? false);
    const [isLocked, setIsLocked] = useState(savedProgress?.isLocked ?? false);
    const [isPenalized, setIsPenalized] = useState(false);
    const [penaltyTimer, setPenaltyTimer] = useState(0);
    const [showSolution, setShowSolution] = useState(false);
    const [animationState, setAnimationState] = useState('fade-in');
    const [cumulativeTime, setCumulativeTime] = useState(savedProgress?.cumulativeTime ?? 0);

    const [userData, setUserData] = useState(null);
    const didRestoreRef = useRef(!!savedProgress);
    const timerIntervalRef = useRef(null);
    const questionStartTimeRef = useRef(Date.now());

    // === Chế độ Giáo viên xem KEY ẩn (Phím K) ===
    const [isTeacherKeyMode, setIsTeacherKeyMode] = useState(false);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'k' || e.key === 'K') {
                if (['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) return;
                setIsTeacherKeyMode(prev => !prev);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    const currentCluster = questionSet.clusters[currentClusterIndex];
    const currentQuestion = currentCluster.questions[currentIndex];

    useEffect(() => {
        if (!user) return;
        const fetchUserData = async () => {
            const userDocRef = doc(db, 'users', user.uid);
            const userSnap = await getDoc(userDocRef);
            if (userSnap.exists()) {
                setUserData(userSnap.data());
            }
        };
        fetchUserData();
    }, [user]);

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
        // Nếu đang khôi phục tiến trình từ sessionStorage → không reset
        if (didRestoreRef.current) {
            didRestoreRef.current = false;
            // Khôi phục penalty timer nếu đang bị phạt khi reload
            if (savedProgress?.isPenalized && savedProgress?.answeredAt) {
                const elapsed = Math.floor((Date.now() - savedProgress.answeredAt) / 1000);
                const remaining = Math.max(0, (savedProgress.penaltyTimer || 0) - elapsed);
                if (remaining > 0) {
                    setIsPenalized(true);
                    setPenaltyTimer(remaining);
                }
            }
            return;
        }
        setSelectedAnswer(null);
        setFillInAnswer('');
        setIsCorrectlyAnswered(false);
        setIsLocked(false);
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
            Swal.fire({ title: 'Hết thời gian phạt!', text: 'Bấm "Tiếp Theo" để sang câu tiếp.', icon: 'info' });
        }
        return () => clearInterval(timerIntervalRef.current);
    }, [isPenalized, penaltyTimer]);

    // ✅ HÀM MỚI: Dùng setDoc để cập nhật điểm hiệu quả
    const updateScoreInFirestore = async (currentScore, timeSoFar, isFinal = false) => {
        if (!user || !questionSet.id) {
            console.warn('Không thể cập nhật điểm: Thiếu thông tin user hoặc quizId.');
            return;
        }

        const scoreDocId = `${user.uid}_${questionSet.id}`;
        const scoreDocRef = doc(db, 'scores', scoreDocId);

        try {
            const payload = {
                userId: user.uid,
                displayName: user.displayName || 'Anonymous',
                photoURL: user.photoURL || null,
                quizId: questionSet.id,
                quizTitle: questionSet.title,
                groupId: groupId || null,
                score: currentScore,
                durationSeconds: Math.round(timeSoFar),
                completedQuestions: completedQuestions + (isFinal ? 0 : 1),
                timestamp: serverTimestamp(),
                isFinal: isFinal,
            };
            
            await setDoc(scoreDocRef, payload, { merge: true });
        } catch (error) {
            console.error("Lỗi khi cập nhật điểm:", error);
            if (isFinal) {
                Swal.fire('Lỗi lưu điểm', `Không thể lưu kết quả cuối cùng: ${error.message}`, 'error');
            }
        }
    };

    // Lưu tiến trình vào sessionStorage (chống reload gian lận)
    const saveProgress = (clusterIdx, questionIdx, score, cumTime, locked = false, correctlyAnswered = false, answer = null, fillAnswer = '', penalized = false, pTimer = 0) => {
        if (!storageKey) return;
        sessionStorage.setItem(storageKey, JSON.stringify({
            quizId: questionSet.id,
            clusterIndex: clusterIdx,
            questionIndex: questionIdx,
            score,
            cumulativeTime: cumTime,
            isLocked: locked,
            isCorrectlyAnswered: correctlyAnswered,
            selectedAnswer: answer,
            fillInAnswer: fillAnswer,
            isPenalized: penalized,
            penaltyTimer: pTimer,
            answeredAt: Date.now()
        }));
    };

    const handleNext = async () => {
        setAnimationState('fade-out');
        
        setTimeout(async () => {
            const isLastQuestionInCluster = currentIndex === currentCluster.questions.length - 1;
            const isLastCluster = currentClusterIndex === questionSet.clusters.length - 1;

            if (isLastQuestionInCluster && isLastCluster) {
                // Xóa tiến trình khi hoàn thành bài thi
                if (storageKey) sessionStorage.removeItem(storageKey);
                await updateScoreInFirestore(totalScore, cumulativeTime, true);
                originalOnFinish(totalScore, cumulativeTime);
            } else if (isLastQuestionInCluster) {
                const nextCluster = currentClusterIndex + 1;
                saveProgress(nextCluster, 0, totalScore, cumulativeTime);
                Swal.close();
                setCurrentClusterIndex(prev => prev + 1);
                setCurrentIndex(0);
            } else {
                const nextQ = currentIndex + 1;
                saveProgress(currentClusterIndex, nextQ, totalScore, cumulativeTime);
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
            correctAudio.play().catch(e => { });
            newScore += (currentQuestion.points_correct || 10);
            setIsCorrectlyAnswered(true);
            Swal.fire({ title: 'Chính xác!', icon: 'success' });
        } else {
            incorrectAudio.play().catch(e => { });
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
        setIsLocked(true); // Khóa câu hỏi — không cho chọn lại

        // Lưu tiến trình ngay sau khi trả lời (chống reload giữa chừng)
        const penaltyDur = isCorrect ? 0 : ((currentQuestion.penalty_minutes || 0) * 60);
        const isMultiChoice = (currentQuestion.type === 'multiple_choice' || !currentQuestion.type);
        saveProgress(
            currentClusterIndex, currentIndex, newScore, newCumulativeTime,
            true, isCorrect,
            isMultiChoice ? userAnswer : null,
            isMultiChoice ? '' : userAnswer,
            !isCorrect && penaltyDur > 0, penaltyDur
        );

        await updateScoreInFirestore(newScore, newCumulativeTime, false);
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

                    {/* ✅ SỬA: Dùng KatexRenderer cho câu hỏi */}
                    <KatexRenderer htmlString={currentQuestion.questionText} />

                    {(currentQuestion.type === 'multiple_choice' || !currentQuestion.type) ? (
                        <div className="choice-grid quizlet-style clean compact">
                            {currentQuestion.choices.map((choice) => (
                                <label key={choice.value} className={`choice-card ${selectedAnswer === choice.value ? 'selected' : ''} ${isCorrectlyAnswered ? (choice.value === currentQuestion.correctAnswer ? 'correct' : 'incorrect') : ''} ${isLocked && !isCorrectlyAnswered && selectedAnswer === choice.value ? 'incorrect' : ''}`}>
                                    <input type="radio" name={`q-${currentIndex}`} value={choice.value} checked={selectedAnswer === choice.value} onChange={() => setSelectedAnswer(choice.value)} disabled={isLocked} />
                                    <div className="choice-card-content">
                                        <div className="choice-letter-wrapper">
                                            <span className="choice-card-value" data-letter={choice.value}>
                                                {choice.value}
                                                {isTeacherKeyMode && choice.value === currentQuestion.correctAnswer && (
                                                    <span style={{ color: '#6c5ce7', marginLeft: '3px', fontWeight: 'bold' }}>•</span>
                                                )}
                                            </span>
                                        </div>
                                        <div className="choice-text-body">
                                            {choice.imageUrl && (<img src={choice.imageUrl} alt={`Lựa chọn ${choice.value}`} className="choice-card-image" />)}
                                            {/* Đây là chỗ dùng KatexRenderer đúng */}
                                            <KatexRenderer htmlString={choice.text} />
                                            {isTeacherKeyMode && choice.value === currentQuestion.correctAnswer && (
                                                <span style={{ color: '#6c5ce7', marginLeft: '6px', fontWeight: 'bold' }}>•</span>
                                            )}
                                        </div>
                                    </div>
                                </label>
                            ))}
                        </div>
                    ) : (
                        <div className="my-3">
                            <input type="text" className="form-control form-control-lg" placeholder="Nhập đáp án của bạn..." value={fillInAnswer} onChange={(e) => setFillInAnswer(e.target.value)} disabled={isLocked} />
                            {isTeacherKeyMode && (
                                <div className="mt-2 p-2 bg-light border border-primary rounded text-primary">
                                    🔑 <strong>Đáp án đúng:</strong> {currentQuestion.correctAnswer}
                                </div>
                            )}
                        </div>
                    )}

                    {isTeacherKeyMode && (
                        <div style={{ position: 'fixed', bottom: '15px', right: '15px', background: 'rgba(108, 92, 231, 0.9)', color: '#fff', padding: '6px 14px', borderRadius: '18px', fontSize: '12px', fontWeight: 'bold', zIndex: 9999, boxShadow: '0 3px 12px rgba(0,0,0,0.2)' }}>
                            🔑 Teacher Key Mode: ACTIVE (Nhấn phím K để ẩn)
                        </div>
                    )}

                    {isPenalized && <TimerDisplay seconds={penaltyTimer} />}

                    <div className="game-actions mt-3">
                        {!isLocked && (
                            <button className="btn btn-success" onClick={handleCheckAnswer} disabled={!selectedAnswer && !fillInAnswer}>Kiểm Tra</button>
                        )}
                        {isLocked && isPenalized && (
                            <p className="text-danger mt-2 fw-bold">⏳ Chờ hết thời gian phạt để tiếp tục...</p>
                        )}
                        {isLocked && !isPenalized && (
                            <>
                                <button className="btn btn-primary" onClick={handleNext}>
                                    {(completedQuestions + 1 === totalQuestions) ? 'Xem Kết Quả' : 'Tiếp Theo'}
                                </button>
                                {isCorrectlyAnswered && currentQuestion.show_solution && (
                                    <button className="btn btn-info ms-2" onClick={() => setShowSolution(!showSolution)}>
                                        {showSolution ? 'Ẩn lời giải' : 'Xem lời giải'}
                                    </button>
                                )}
                            </>
                        )}
                    </div>

                    {/* ✅ SỬA: Dùng KatexRenderer cho lời giải */}
                    {isCorrectlyAnswered && showSolution && currentQuestion.solution && (
                        <div className="solution-container mt-3 card card-body">
                            <KatexRenderer htmlString={currentQuestion.solution} />
                        </div>
                    )}
                </div>
            </div>
            <aside className="game-sidebar">
                {currentCluster.questions.length > 1 && currentCluster.commonAssumption?.intro && (
                    <CommonAssumption assumption={currentCluster.commonAssumption} />
                )}
                <div className="info-box mt-3 text-center">
                    <h3>Tổng Điểm</h3>
                    <p className="fs-1 fw-bold text-primary">{totalScore}</p>
                </div>
                {groupId && questionSet.id && (
                    <Leaderboard
                        quizId={questionSet.id}
                        groupId={groupId}
                    />
                )}
            </aside>
        </div>
    );
};

export default GameScreen;

