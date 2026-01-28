import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ChevronRight, Book, PenTool, Layout, ChevronDown, ChevronLeft, PanelLeftClose, PanelLeftOpen, Search } from 'lucide-react';
import { curriculum } from '../data/curriculum';
import MathDisplay from '../components/MathDisplay';
import ParsedContent from '../components/ParsedContent';
import { Definition, Theorem, Property, Note } from '../components/content/RichText';
import MultipleChoice from '../components/exercise/MultipleChoice';
import TrueFalse from '../components/exercise/TrueFalse';
import ShortAnswer from '../components/exercise/ShortAnswer';
import { clsx } from 'clsx';

const LessonView = () => {
    const { grade, chapterId, lessonId } = useParams();
    const [activeTab, setActiveTab] = useState('theory');
    const [activeTopicId, setActiveTopicId] = useState(null);
    const [isTopicSidebarOpen, setIsTopicSidebarOpen] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    // Helper to find data
    const chapter = curriculum[grade]?.find(c => c.id === chapterId);
    const lesson = chapter?.lessons?.find(l => l.id === lessonId);

    const [exercises, setExercises] = useState([]);
    const activeTopic = lesson?.topics?.find(t => t.id === activeTopicId);

    // Set default active topic and load exercises
    useEffect(() => {
        if (lesson?.topics?.length > 0) {
            if (!activeTopicId) {
                setActiveTopicId(lesson.topics[0].id);
            }
        } else {
            setActiveTopicId(null);
        }
    }, [lessonId, lesson]);

    // Update exercises when active topic changes
    useEffect(() => {
        if (activeTopic?.content?.exercises) {
            // Deep copy to avoid mutating original data
            setExercises(JSON.parse(JSON.stringify(activeTopic.content.exercises)));
            setSearchQuery(''); // Reset search when topic changes
        } else {
            setExercises([]);
        }
    }, [activeTopic]);

    // Filter exercises based on search query
    const filteredExercises = exercises.filter(ex =>
        ex.question.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleRegenerate = (index) => {
        const currentEx = exercises[index];

        // Simple randomization logic for demo purposes
        // In a real app, this would use a generator function from the data
        let newEx = { ...currentEx };

        // Demo: Randomize numbers for specific patterns
        if (currentEx.question.includes('nam') && currentEx.question.includes('nữ')) {
            // Pattern: "Một lớp có X nam và Y nữ..."
            const nam = Math.floor(Math.random() * 10) + 15; // 15-25
            const nu = Math.floor(Math.random() * 10) + 10; // 10-20
            const total = nam + nu;

            newEx.question = `Một lớp có $${nam}$ nam và $${nu}$ nữ. Có bao nhiêu cách chọn ra một học sinh đi dự đại hội?`;
            newEx.options = [
                `${total}`,
                `${nam * nu}`,
                `${nam}`,
                `${nu}`
            ];
            newEx.correctAnswer = 0;
            newEx.explanation = `Áp dụng quy tắc cộng: $${nam} + ${nu} = ${total}$ cách.`;
        } else if (currentEx.question.includes('P(A)') && currentEx.question.includes('P(B)') && currentEx.question.includes('P(AB)')) {
            // Pattern: "Cho P(A) = x, P(B) = y, P(AB) = z. Tính P(A|B)."

            // Generate valid probabilities
            // P(AB) <= P(A) and P(AB) <= P(B)
            // P(A), P(B) in (0, 1]

            const pA = Number((Math.random() * 0.4 + 0.3).toFixed(2)); // 0.3 - 0.7
            const pB = Number((Math.random() * 0.4 + 0.3).toFixed(2)); // 0.3 - 0.7

            // P(AB) must be less than min(pA, pB)
            const maxPAB = Math.min(pA, pB);
            const pAB = Number((Math.random() * (maxPAB - 0.1) + 0.05).toFixed(2)); // 0.05 - (max - 0.1)

            const result = (pAB / pB).toFixed(4);
            const resultDisplay = parseFloat(result); // Remove trailing zeros if any

            newEx.question = `Cho $P(A) = ${pA}, P(B) = ${pB}, P(AB) = ${pAB}$. Tính $P(A|B)$.`;
            newEx.correctAnswer = String(resultDisplay);
            newEx.explanation = `$P(A|B) = \\frac{P(AB)}{P(B)} = \\frac{${pAB}}{${pB}} \\approx ${resultDisplay}$.`;

        } else if (currentEx.question.includes('Gieo một con xúc xắc cân đối hai lần')) {
            // Pattern: "Gieo một con xúc xắc cân đối hai lần. Biết tổng số chấm của hai lần gieo là S. Tính xác suất để lần 1 gieo được mặt K chấm."
            // S in [4, 5, 6, 7, 8, 9, 10] (to ensure enough combinations)
            const S = Math.floor(Math.random() * 7) + 4;

            // Find valid pairs (i, j) such that i + j = S
            const pairs = [];
            for (let i = 1; i <= 6; i++) {
                for (let j = 1; j <= 6; j++) {
                    if (i + j === S) pairs.push([i, j]);
                }
            }
            const nB = pairs.length;

            // Choose a target face K from the valid first throws
            const validFirstThrows = [...new Set(pairs.map(p => p[0]))];
            const K = validFirstThrows[Math.floor(Math.random() * validFirstThrows.length)];

            // Count favorable outcomes
            const nAB = pairs.filter(p => p[0] === K).length;

            // Calculate probability
            const prob = nAB / nB;

            // Generate options
            const correctOpt = `${nAB}/${nB}`;
            const wrong1 = `${nAB}/${36}`;
            const wrong2 = `${nB}/36`;
            const wrong3 = `${nAB + 1}/${nB}`;

            const opts = [correctOpt, wrong1, wrong2, wrong3];
            // Shuffle options
            for (let i = opts.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [opts[i], opts[j]] = [opts[j], opts[i]];
            }

            newEx.question = `Gieo một con xúc xắc cân đối hai lần. Biết tổng số chấm của hai lần gieo là ${S}. Tính xác suất để lần 1 gieo được mặt ${K} chấm.`;
            newEx.options = opts;
            newEx.correctAnswer = opts.indexOf(correctOpt);
            newEx.explanation = `Gọi $B$ là biến cố tổng là ${S}: $B = \\{${pairs.map(p => `(${p[0]},${p[1]})`).join(', ')}\\} \\Rightarrow n(B) = ${nB}$.\nGọi $A$ là biến cố lần 1 ra ${K} chấm. $A \\cap B = \\{${pairs.filter(p => p[0] === K).map(p => `(${p[0]},${p[1]})`).join(', ')}\\} \\Rightarrow n(A \\cap B) = ${nAB}$.\n$P(A|B) = \\frac{${nAB}}{${nB}}$.`;

        } else if (currentEx.question.includes('thích Toán') && currentEx.question.includes('thích Văn')) {
            // Pattern: "Lớp có N HS, nA thích Toán, nB thích Văn, nAB thích cả hai..."
            const nAB = Math.floor(Math.random() * 5) + 10; // 10-15
            const nAOnly = Math.floor(Math.random() * 10) + 10; // 10-20
            const nBOnly = Math.floor(Math.random() * 10) + 5; // 5-15
            const nNone = Math.floor(Math.random() * 5) + 1; // 1-5

            const nA = nAOnly + nAB;
            const nB = nBOnly + nAB;
            const N = nAOnly + nBOnly + nAB + nNone;

            // Calculate P(V|T) = P(TV)/P(T) = n(TV)/n(T) = nAB / nA
            const prob = (nAB / nA).toFixed(2);

            newEx.question = `Một lớp có ${N} học sinh, trong đó ${nA} em thích Toán, ${nB} em thích Văn và ${nAB} em thích cả hai môn. Chọn ngẫu nhiên một học sinh. Biết học sinh đó thích Toán, tính xác suất để học sinh đó cũng thích Văn.`;
            newEx.correctAnswer = String(prob);
            newEx.explanation = `Gọi $T$ là thích Toán, $V$ là thích Văn.\n$P(T) = ${nA}/${N}$, $P(TV) = ${nAB}/${N}$.\n$P(V|T) = \\frac{P(TV)}{P(T)} = \\frac{${nAB}/${N}}{${nA}/${N}} = \\frac{${nAB}}{${nA}} \\approx ${prob}$.`;

        } else if (currentEx.question.includes('mạch điện')) {
            // Pattern: Circuit reliability
            const pA = Number((Math.random() * 0.1 + 0.05).toFixed(2)); // 0.05 - 0.15
            const pB = Number((Math.random() * 0.1 + 0.1).toFixed(2)); // 0.1 - 0.2

            const pBothFail = Number((pA * pB).toFixed(4));
            const pGood = Number(((1 - pA) * (1 - pB)).toFixed(4));
            const pFail = Number((1 - pGood).toFixed(4));
            const pParallelFail = pBothFail; // Parallel fails only if both fail

            newEx.question = `Một mạch điện gồm 2 linh kiện A và B mắc nối tiếp. Xác suất hỏng trong một khoảng thời gian t của A là ${pA}, của B là ${pB}. Các linh kiện hỏng độc lập nhau. Xét tính đúng sai:`;
            newEx.statements = [
                `Xác suất cả hai linh kiện cùng hỏng là ${pBothFail}.`,
                `Xác suất mạch hoạt động tốt (cả 2 không hỏng) là ${pGood}.`,
                `Xác suất mạch bị hỏng (ít nhất 1 linh kiện hỏng) là ${pFail}.`,
                `Nếu mắc song song thì xác suất mạch hỏng là ${pParallelFail}.`
            ];
            // In this generator, we always generate correct statements for simplicity, 
            // but in a real app we might want to randomize true/false status too.
            // For now, let's keep them all true as per the template.
            newEx.correctAnswers = [true, true, true, true];
            newEx.explanation = `a) $P(H_A \\cap H_B) = ${pA} \\cdot ${pB} = ${pBothFail}$. Đúng.\nb) $P(\\overline{H_A}) = ${1 - pA}, P(\\overline{H_B}) = ${1 - pB} \\Rightarrow P(\\text{Tốt}) = ${1 - pA} \\cdot ${1 - pB} = ${pGood}$. Đúng.\nc) $P(\\text{Hỏng}) = 1 - P(\\text{Tốt}) = 1 - ${pGood} = ${pFail}$. Đúng.\nd) Mắc song song hỏng khi cả 2 cùng hỏng: ${pA} \\cdot ${pB} = ${pParallelFail}$. Đúng.`;

        } else if (currentEx.type === 'mcq') {
            // Shuffle options for generic MCQ
            const opts = [...currentEx.options];
            const correctOpt = opts[currentEx.correctAnswer];

            // Fisher-Yates shuffle
            for (let i = opts.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [opts[i], opts[j]] = [opts[j], opts[i]];
            }

            newEx.options = opts;
            newEx.correctAnswer = opts.indexOf(correctOpt);
        }

        // Update state
        const newExercises = [...exercises];
        newExercises[index] = newEx;
        setExercises(newExercises);
    };

    const renderContentBlock = (block, index) => {
        switch (block.type) {
            case 'definition':
                return <Definition key={index} title={block.title}><ParsedContent content={block.text} /></Definition>;
            case 'theorem':
                return <Theorem key={index} title={block.title}><ParsedContent content={block.text} /></Theorem>;
            case 'property':
                return <Property key={index} title={block.title}><ParsedContent content={block.text} /></Property>;
            case 'note':
                return <Note key={index} title={block.title}><ParsedContent content={block.text} /></Note>;
            case 'example':
                return (
                    <div key={index} className="bg-gray-50 p-4 rounded-lg border border-gray-200 my-4">
                        <span className="font-bold text-gray-900">Ví dụ: </span>
                        <ParsedContent content={block.text} />
                    </div>
                );
            default:
                return <div key={index} className="my-2"><ParsedContent content={block.text} /></div>;
        }
    };

    if (!lesson) return <div>Bài học không tồn tại</div>;

    const tabs = [
        { id: 'theory', label: 'Lý thuyết', icon: Book },
        { id: 'practice', label: 'Luyện tập', icon: PenTool },
    ];

    return (
        <div className="space-y-6">
            {/* Breadcrumbs */}
            <div className="flex items-center gap-2 text-sm text-gray-500">
                <Link to={`/grade/${grade}`} className="hover:text-blue-600">Toán {grade}</Link>
                <ChevronRight className="w-4 h-4" />
                <span className="truncate max-w-[200px]">{chapter.title}</span>
                <ChevronRight className="w-4 h-4" />
                <span className="font-medium text-gray-900">{lesson.title}</span>
            </div>

            <div className="flex flex-col lg:flex-row gap-6">
                {/* Topic Sidebar (Desktop) & Sticky Dropdown (Mobile) */}
                <div className={clsx(
                    "transition-all duration-300 ease-in-out flex-shrink-0",
                    isTopicSidebarOpen ? "lg:w-1/4" : "lg:w-10"
                )}>
                    {/* Mobile Sticky Dropdown */}
                    <div className="lg:hidden sticky top-0 z-20 bg-white shadow-sm border border-gray-200 rounded-lg mb-4">
                        <div className="relative">
                            <select
                                value={activeTopicId || ''}
                                onChange={(e) => setActiveTopicId(e.target.value)}
                                className="w-full appearance-none bg-transparent py-3 pl-4 pr-10 font-medium text-gray-900 focus:outline-none"
                            >
                                {lesson.topics?.map((topic) => (
                                    <option key={topic.id} value={topic.id}>
                                        {topic.title}
                                    </option>
                                ))}
                            </select>
                            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-500">
                                <ChevronDown className="w-5 h-5" />
                            </div>
                        </div>
                    </div>

                    {/* Desktop Sidebar */}
                    <div className="hidden lg:block bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden sticky top-6">
                        <div className={clsx(
                            "bg-gray-50 border-b border-gray-200 flex items-center",
                            isTopicSidebarOpen ? "p-4 justify-between" : "p-2 justify-center"
                        )}>
                            {isTopicSidebarOpen && (
                                <div className="flex items-center gap-2">
                                    <Layout className="w-5 h-5 text-gray-600" />
                                    <h3 className="font-bold text-gray-800">Các dạng bài</h3>
                                </div>
                            )}
                            <button
                                onClick={() => setIsTopicSidebarOpen(!isTopicSidebarOpen)}
                                className="p-1 hover:bg-gray-200 rounded text-gray-600 transition-colors"
                                title={isTopicSidebarOpen ? "Thu gọn" : "Mở rộng"}
                            >
                                {isTopicSidebarOpen ? <PanelLeftClose className="w-5 h-5" /> : <PanelLeftOpen className="w-5 h-5" />}
                            </button>
                        </div>

                        {isTopicSidebarOpen && (
                            <div className="p-2 space-y-1 max-h-[calc(100vh-200px)] overflow-y-auto">
                                {lesson.topics?.map((topic) => (
                                    <button
                                        key={topic.id}
                                        onClick={() => setActiveTopicId(topic.id)}
                                        className={clsx(
                                            "w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                                            activeTopicId === topic.id
                                                ? "bg-blue-50 text-blue-700"
                                                : "text-gray-600 hover:bg-gray-50"
                                        )}
                                    >
                                        {topic.title}
                                    </button>
                                )) || <div className="p-4 text-sm text-gray-500">Chưa có dạng bài nào.</div>}
                            </div>
                        )}
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden min-h-[600px]">
                        {activeTopic ? (
                            <>
                                {/* Header */}
                                <div className="p-6 border-b border-gray-200 bg-gray-50">
                                    <h2 className="text-xl font-bold text-gray-900">{activeTopic.title}</h2>
                                </div>

                                {/* Tabs */}
                                <div className="flex border-b border-gray-200 overflow-x-auto">
                                    {tabs.map((tab) => {
                                        const Icon = tab.icon;
                                        return (
                                            <button
                                                key={tab.id}
                                                onClick={() => setActiveTab(tab.id)}
                                                className={clsx(
                                                    'flex items-center gap-2 px-6 py-4 font-medium text-sm transition-colors border-b-2 whitespace-nowrap',
                                                    activeTab === tab.id
                                                        ? 'border-blue-600 text-blue-600 bg-blue-50/50'
                                                        : 'border-transparent text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                                )}
                                            >
                                                <Icon className="w-4 h-4" />
                                                {tab.label}
                                            </button>
                                        );
                                    })}
                                </div>

                                {/* Content */}
                                <div className="p-6">
                                    {activeTab === 'theory' && (
                                        <div className="w-full">
                                            {activeTopic.content?.theory?.map((block, idx) => renderContentBlock(block, idx)) || (
                                                <p className="text-gray-500 italic">Nội dung lý thuyết đang cập nhật...</p>
                                            )}
                                        </div>
                                    )}

                                    {activeTab === 'practice' && (
                                        <div className="w-full space-y-8">
                                            {/* Search Bar */}
                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                    <Search className="h-5 w-5 text-gray-400" />
                                                </div>
                                                <input
                                                    type="text"
                                                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                                    placeholder="Tìm kiếm bài tập (ví dụ: 'xúc xắc', 'bi đỏ', 'khó')..."
                                                    value={searchQuery}
                                                    onChange={(e) => setSearchQuery(e.target.value)}
                                                />
                                            </div>

                                            {filteredExercises.map((ex, idx) => {
                                                // Find original index for regeneration
                                                const originalIndex = exercises.indexOf(ex);
                                                return (
                                                    <div key={`${idx}-${JSON.stringify(ex)}`}> {/* Force re-render on change */}
                                                        <div className="font-bold text-gray-500 mb-2">Câu {idx + 1}</div>
                                                        {ex.type === 'mcq' && (
                                                            <MultipleChoice
                                                                question={ex.question}
                                                                options={ex.options}
                                                                correctAnswer={ex.correctAnswer}
                                                                explanation={ex.explanation}
                                                                onRegenerate={() => handleRegenerate(originalIndex)}
                                                            />
                                                        )}
                                                        {ex.type === 'tf' && (
                                                            <TrueFalse
                                                                question={ex.question}
                                                                statements={ex.statements}
                                                                correctAnswers={ex.correctAnswers}
                                                                explanation={ex.explanation}
                                                                onRegenerate={() => handleRegenerate(originalIndex)}
                                                            />
                                                        )}
                                                        {ex.type === 'short' && (
                                                            <ShortAnswer
                                                                question={ex.question}
                                                                correctAnswer={ex.correctAnswer}
                                                                explanation={ex.explanation}
                                                                onRegenerate={() => handleRegenerate(originalIndex)}
                                                            />
                                                        )}
                                                    </div>
                                                );
                                            }) || (
                                                    <div className="text-center py-12">
                                                        <p className="text-gray-500">
                                                            {exercises.length > 0
                                                                ? "Không tìm thấy bài tập nào phù hợp."
                                                                : "Chưa có bài tập nào cho dạng này."}
                                                        </p>
                                                    </div>
                                                )}
                                        </div>
                                    )}
                                </div>
                            </>
                        ) : (
                            <div className="flex items-center justify-center h-full text-gray-500">
                                Chọn một dạng bài để xem nội dung
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LessonView;
