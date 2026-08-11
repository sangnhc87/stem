import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import './Game.css';

const SUBJECTS = [
    { name: "📚 Bách Khoa Tri Thức", file: "/data/bach-khoa.json", icon: "🌐", desc: "Kiến thức tổng hợp đa lĩnh vực", color: "#6c5ce7" },
    { name: "🏛️ Văn Minh Nhân Loại", file: "/data/van-minh-nhan-loai.json", icon: "🔮", desc: "Lịch sử, thần thoại & khoa học", color: "#e17055" },
    { name: "🌍 Khám Phá Thế Giới", file: "/data/kham-pha-the-gioi.json", icon: "🧭", desc: "100 câu đa dạng lĩnh vực", color: "#00b894" },
    { name: "🦁 Thế Giới Động Vật", file: "/data/the-gioi-dong-vat.json", icon: "🐾", desc: "100 câu độc lạ về động vật", color: "#ff9f43" },
    { name: "Kiến Thức Tổng Hợp 1", file: "/data/de_tong_hop.json", icon: "🌍", desc: "Đa dạng lĩnh vực", color: "#00cec9" },
    { name: "Kiến Thức Tổng Hợp 2", file: "/data/dia_sinh_van.json", icon: "📚", desc: "Xã hội & Tự nhiên", color: "#0984e3" },
    { name: "Kiến Thức Tổng Hợp 3", file: "/data/sinh_dia.json", icon: "🌱", desc: "Thế giới quanh ta", color: "#55efc4" },
    { name: "Hay & Lạ (Phần 1)", file: "/data/hay-la1.json", icon: "✨", desc: "Sự thật thú vị", color: "#fdcb6e" },
    { name: "Hay & Lạ (Phần 2)", file: "/data/hay-la2.json", icon: "🤯", desc: "Kỷ lục Guinness", color: "#e84393" },
    { name: "Hay & Lạ (Phần 3)", file: "/data/hay-la3.json", icon: "🛸", desc: "Bí ẩn thế giới", color: "#74b9ff" },
    { name: "Hay & Lạ (Phần 4)", file: "/data/hay-la4.json", icon: "🧬", desc: "Khoa học vui", color: "#a29bfe" },
    { name: "Hay & Lạ (Phần 5)", file: "/data/hay-la5.json", icon: "🍕", desc: "Đời sống", color: "#ff7675" },
    { name: "Hay & Lạ (Phần 6)", file: "/data/hay-la6.json", icon: "🎪", desc: "Chuyện lạ", color: "#fab1a0" },
    { name: "Hay & Lạ (Phần 7)", file: "/data/hay-la7.json", icon: "🧩", desc: "Hack não", color: "#fd79a8" },
    { name: "Hay & Lạ (Phần 8)", file: "/data/hay-la8.json", icon: "🎭", desc: "Tổng hợp siêu dị", color: "#636e72" },
    { name: "Tổng Hợp (Gói 1)", file: "/data/tong_hop1.json", icon: "🎓", desc: "Kiến thức chung", color: "#2d3436" }
];

const MAX_TIME = 15;

const SieuTriTueGame = () => {
    const [screen, setScreen] = useState('menu'); // menu, loading, game, result
    const [currentQuestions, setCurrentQuestions] = useState([]);
    const [currentQIndex, setCurrentQIndex] = useState(0);
    const [score, setScore] = useState(0);
    const [streak, setStreak] = useState(0);
    const [isAnswered, setIsAnswered] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [timeLeft, setTimeLeft] = useState(MAX_TIME);
    const [currentSubjectFile, setCurrentSubjectFile] = useState("");
    const [progress, setProgress] = useState(0);
    const [finalScore, setFinalScore] = useState(0);
    const [highScoreMsg, setHighScoreMsg] = useState("");
    const [shuffledAnswers, setShuffledAnswers] = useState([]);

    const timerRef = useRef(null);
    const audioCtxRef = useRef(null);

    // Initialize Audio Context
    const initAudio = () => {
        if (!audioCtxRef.current) {
            audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (audioCtxRef.current.state === 'suspended') {
            audioCtxRef.current.resume();
        }
    };

    const playSound = (type) => {
        initAudio();
        const ctx = audioCtxRef.current;
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();
        osc.connect(gainNode);
        gainNode.connect(ctx.destination);
        const now = ctx.currentTime;

        if (type === 'correct') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(600, now);
            osc.frequency.exponentialRampToValueAtTime(1200, now + 0.1);
            gainNode.gain.setValueAtTime(0.1, now);
            gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
            osc.start(now); osc.stop(now + 0.5);
        } else if (type === 'wrong') {
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(150, now);
            osc.frequency.linearRampToValueAtTime(100, now + 0.3);
            gainNode.gain.setValueAtTime(0.1, now);
            gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
            osc.start(now); osc.stop(now + 0.3);
        } else if (type === 'click') {
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(300, now);
            gainNode.gain.setValueAtTime(0.05, now);
            gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
            osc.start(now); osc.stop(now + 0.05);
        } else if (type === 'win') {
            playSound('correct');
            setTimeout(() => playSound('correct'), 150);
            setTimeout(() => playSound('correct'), 300);
        }
    };

    const shuffleArray = (arr) => {
        return [...arr].sort(() => Math.random() - 0.5);
    };

    const loadQuizData = async (filePath, index) => {
        playSound('click');
        setProgress(((index + 1) / SUBJECTS.length) * 100);
        setCurrentSubjectFile(filePath);
        setScreen('loading');

        try {
            const res = await fetch(filePath);
            if (!res.ok) throw new Error("File not found");
            const data = await res.json();
            setCurrentQuestions(shuffleArray(data));
            setTimeout(() => {
                startGame();
            }, 500);
        } catch (error) {
            alert("Lỗi: Không tải được file JSON. " + error.message);
            setScreen('menu');
        }
    };

    const startGame = () => {
        setCurrentQIndex(0);
        setScore(0);
        setStreak(0);
        setIsPaused(false);
        setScreen('game');
    };

    // Update UI when question changes
    useEffect(() => {
        if (screen === 'game' && currentQuestions.length > 0) {
            resetState();
            const q = currentQuestions[currentQIndex];
            setShuffledAnswers(shuffleArray([...q.answers]));
            // startTimer(MAX_TIME); // Timer disabled at user request
        }
    }, [currentQIndex, screen, currentQuestions]);

    const resetState = () => {
        setIsAnswered(false);
        setIsPaused(false);
        setTimeLeft(MAX_TIME);
    };

    const startTimer = (initialTime) => {
        setTimeLeft(initialTime);
        if (timerRef.current) clearInterval(timerRef.current);

        timerRef.current = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 0.1) {
                    clearInterval(timerRef.current);
                    timeOut();
                    return 0;
                }
                return prev - 0.1;
            });
        }, 100);
    };

    // Handle pause/resume to stop/start timer
    useEffect(() => {
        if (isPaused || isAnswered || screen !== 'game') {
            if (timerRef.current) clearInterval(timerRef.current);
        } else {
            // Timer disabled at user request
            /*
            if (timeLeft > 0) {
                timerRef.current = setInterval(() => {
                    setTimeLeft(prev => {
                        if (prev <= 0.1) {
                            clearInterval(timerRef.current);
                            timeOut();
                            return 0;
                        }
                        return prev - 0.1;
                    });
                }, 100);
            }
            */
        }
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [isPaused, isAnswered, screen]);


    const timeOut = () => {
        if (isAnswered) return;
        playSound('wrong');
        setIsAnswered(true);
        setStreak(0);
    };

    const togglePause = () => {
        playSound('click');
        setIsPaused(!isPaused);
    };

    const revealAnswer = () => {
        if (isAnswered || isPaused) return;
        playSound('click');
        setIsAnswered(true);
        setStreak(0);
    };

    const selectAnswer = (ans) => {
        if (isAnswered || isPaused) return;
        setIsAnswered(true);

        if (ans.correct === "true" || ans.correct === true) {
            playSound('correct');
            setScore(prev => prev + 10 + (streak * 2));
            setStreak(prev => prev + 1);
            confetti({ particleCount: 60, spread: 70, origin: { y: 0.7 }, colors: ['#6c5ce7', '#00b894'] });
        } else {
            playSound('wrong');
            setStreak(0);
        }
    };

    const nextQuestion = () => {
        playSound('click');
        if (currentQIndex < currentQuestions.length - 1) {
            setCurrentQIndex(prev => prev + 1);
        } else {
            showResult();
        }
    };

    const showResult = () => {
        playSound('win');
        setFinalScore(score);
        setScreen('result');

        const key = `highscore_${currentSubjectFile}`;
        const oldHigh = localStorage.getItem(key) || 0;
        if (score > oldHigh) {
            localStorage.setItem(key, score);
            setHighScoreMsg(`🏆 Kỷ lục mới! (Cũ: ${oldHigh})`);
            confetti({ particleCount: 300, spread: 150, origin: { y: 0.6 } });
        } else {
            setHighScoreMsg(`Kỷ lục của bạn: ${oldHigh}`);
        }
    };

    const goHome = () => {
        playSound('click');
        setProgress(0);
        setScreen('menu');
    };

    const replay = () => {
        playSound('click');
        setCurrentQuestions(shuffleArray(currentQuestions));
        startGame();
    };

    return (
        <div className="sieu-tri-tue-wrapper">
            <ul className="circles">
                <li></li><li></li><li></li><li></li><li></li>
                <li></li><li></li><li></li><li></li><li></li>
            </ul>

            <div className="stt-game-container">
                {screen === 'menu' && (
                    <div id="menu-screen">
                        <h1 className="stt-screen-title">🧠 Siêu Trí Tuệ</h1>
                        <p className="screen-subtitle">Chọn bộ đề để thử thách bản thân 🎯</p>
                        <div className="stt-progress-container">
                            <div className="stt-progress-bar" style={{ width: `${progress}%` }}></div>
                        </div>
                        <div className="grid-menu">
                            {SUBJECTS.map((sub, index) => (
                                <div
                                    key={index}
                                    className="subject-card"
                                    onClick={() => loadQuizData(sub.file, index)}
                                    style={{
                                        '--card-color': sub.color || '#6c5ce7',
                                        '--card-gradient': `linear-gradient(135deg, ${sub.color}20 0%, ${sub.color}05 100%)`
                                    }}
                                >
                                    <div className="card-accent" style={{ background: sub.color }}></div>
                                    <div className="icon" style={{
                                        background: `linear-gradient(135deg, ${sub.color}30 0%, ${sub.color}10 100%)`,
                                        color: sub.color
                                    }}>{sub.icon}</div>
                                    <div className="card-content">
                                        <h3>{sub.name}</h3>
                                        <span>{sub.desc}</span>
                                    </div>
                                    <div className="card-arrow">→</div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {screen === 'loading' && (
                    <div id="loading-screen">
                        <div className="loader"></div>
                        <p>Đang tải dữ liệu...</p>
                    </div>
                )}

                {screen === 'game' && (
                    <div id="game-screen" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                        <button className="btn-home" onClick={goHome} title="Thoát">🏠</button>

                        {isPaused && (
                            <div className="pause-overlay">
                                <h2>⏸️ Đang Tạm Dừng</h2>
                                <p>Nghỉ ngơi một chút rồi chiến tiếp nhé!</p>
                                <button className="btn-control btn-resume" onClick={togglePause}>▶️ Tiếp Tục</button>
                            </div>
                        )}

                        <div className="game-top-bar" style={{ justifyContent: 'flex-end', gap: '10px' }}>
                            <button className="tool-btn btn-hint" onClick={revealAnswer} disabled={isAnswered}>💡 Xem Đáp Án</button>
                            <button className="tool-btn" onClick={togglePause}>⏸️ Tạm Dừng</button>
                        </div>

                        <div className="header-info">
                            <span>Câu {currentQIndex + 1}/{currentQuestions.length}</span>
                            <div className={`streak-badge ${streak > 1 ? 'show' : ''}`}>🔥 Streak: {streak}</div>
                            <span>Điểm: {score}</span>
                        </div>

                        {/* Timer hidden at user request */}
                        {/* 
                        <div className="timer-container">
                            <div
                                className={`timer-bar ${timeLeft <= 5 ? 'danger' : ''}`}
                                style={{ width: `${(timeLeft / MAX_TIME) * 100}%` }}
                            ></div>
                        </div>
                        */}

                        <div className="question-area">
                            <div className="question-text">
                                {currentQuestions[currentQIndex]?.question}
                            </div>
                            <div className="options-list">
                                {shuffledAnswers.map((ans, idx) => {
                                    let className = 'btn-option';
                                    if (isAnswered) {
                                        if (ans.correct === "true" || ans.correct === true) {
                                            className += ' correct';
                                        } else if (ans === shuffledAnswers.find(a => (a.correct === "true" || a.correct === true))) {
                                            // This condition is wrong in loop. 
                                            // Logic: if answered, show correct. If this specific button was clicked and wrong, show wrong.
                                            // But I don't track which specific wrong button was clicked in state easily without more state.
                                            // The original code used DOM class modification.
                                            // In React, I should probably track `selectedAnswerIndex` or similar.
                                            // But for simplicity, I'll just highlight correct answers and fade others.
                                            // Wait, original code: if correct, add correct. If wrong, add wrong to clicked, and correct to correct one.
                                        }
                                    }

                                    // Let's refine the class logic.
                                    // I need to know if THIS button was clicked if it was wrong.
                                    // I'll add `selectedAnswer` state.
                                    return (
                                        <AnswerButton
                                            key={idx}
                                            ans={ans}
                                            isAnswered={isAnswered}
                                            onSelect={() => selectAnswer(ans)}
                                        />
                                    );
                                })}
                            </div>
                        </div>

                        <div className="controls">
                            {isAnswered && (
                                <button className="btn-control" onClick={nextQuestion}>
                                    {currentQIndex === currentQuestions.length - 1 ? "Xem Kết Quả 🏆" : "Tiếp Theo ➜"}
                                </button>
                            )}
                        </div>
                    </div>
                )}

                {screen === 'result' && (
                    <div id="result-screen">
                        <h2>🏁 Hoàn Thành!</h2>
                        <p>Tổng điểm của bạn:</p>
                        <h1 style={{ fontSize: '80px', color: 'var(--accent)', margin: '20px 0' }}>{finalScore}</h1>
                        <p style={{ color: 'var(--correct)', fontWeight: 800, fontSize: '20px' }}>{highScoreMsg}</p>
                        <div className="controls">
                            <button className="btn-control btn-secondary" onClick={goHome}>Menu Chính</button>
                            <button className="btn-control" onClick={replay}>Chơi Lại</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

// Helper component for buttons to handle their own "wrong" state if clicked
const AnswerButton = ({ ans, isAnswered, onSelect }) => {
    const [clicked, setClicked] = useState(false);

    useEffect(() => {
        if (!isAnswered) setClicked(false);
    }, [isAnswered]);

    const handleClick = () => {
        if (!isAnswered) {
            setClicked(true);
            onSelect();
        }
    };

    let className = 'btn-option';
    if (isAnswered) {
        if (ans.correct === "true" || ans.correct === true) {
            className += ' correct';
        } else if (clicked) {
            className += ' wrong';
        } else {
            // Opacity for unselected wrong answers
            // In original: btn.style.opacity = '0.5';
            // I'll add inline style or class
        }
    }

    return (
        <button
            className={className}
            onClick={handleClick}
            style={{ opacity: isAnswered && !clicked && (ans.correct !== "true" && ans.correct !== true) ? 0.5 : 1 }}
        >
            <span>{ans.text}</span>
        </button>
    );
};

export default SieuTriTueGame;
