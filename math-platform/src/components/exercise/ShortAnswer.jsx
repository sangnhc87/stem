import React, { useState } from 'react';
import { CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import { clsx } from 'clsx';
import ParsedContent from '../ParsedContent';

const ShortAnswer = ({ question, correctAnswer, explanation, onRegenerate }) => {
    const [userAnswer, setUserAnswer] = useState('');
    const [isSubmitted, setIsSubmitted] = useState(false);

    const handleSubmit = () => {
        if (userAnswer.trim()) {
            setIsSubmitted(true);
        }
    };

    const handleReset = () => {
        setUserAnswer('');
        setIsSubmitted(false);
    };

    // Simple string matching for now. Can be enhanced for numeric tolerance.
    const isCorrect = userAnswer.trim().toLowerCase() === String(correctAnswer).trim().toLowerCase();

    return (
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm my-6 relative">
            <div className="flex justify-between items-start gap-4 mb-4">
                <div className="font-medium text-lg text-gray-900 flex-1">
                    <ParsedContent content={question} />
                </div>
                {onRegenerate && (
                    <button
                        onClick={onRegenerate}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                        title="Tạo bài tương tự"
                    >
                        <RefreshCw className="w-5 h-5" />
                    </button>
                )}
            </div>

            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                <div className="flex-1 w-full sm:w-auto">
                    <input
                        type="text"
                        value={userAnswer}
                        onChange={(e) => !isSubmitted && setUserAnswer(e.target.value)}
                        placeholder="Nhập câu trả lời của bạn..."
                        disabled={isSubmitted}
                        className={clsx(
                            "w-full px-4 py-2 rounded-lg border-2 outline-none transition-colors",
                            isSubmitted
                                ? isCorrect
                                    ? "border-green-500 bg-green-50 text-green-900"
                                    : "border-red-500 bg-red-50 text-red-900"
                                : "border-gray-200 focus:border-blue-500"
                        )}
                    />
                </div>

                {!isSubmitted ? (
                    <button
                        onClick={handleSubmit}
                        disabled={!userAnswer.trim()}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
                    >
                        Kiểm tra
                    </button>
                ) : (
                    <button
                        onClick={handleReset}
                        className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors whitespace-nowrap"
                    >
                        Làm lại
                    </button>
                )}
            </div>

            {isSubmitted && (
                <div className="mt-4">
                    <div className="flex items-center gap-2 mb-2">
                        {isCorrect ? (
                            <div className="flex items-center gap-2 text-green-700 font-bold">
                                <CheckCircle className="w-5 h-5" /> Chính xác!
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 text-red-700 font-bold">
                                <XCircle className="w-5 h-5" /> Chưa chính xác
                            </div>
                        )}
                    </div>

                    {!isCorrect && (
                        <div className="text-gray-700 mb-2">
                            Đáp án đúng: <span className="font-bold">{correctAnswer}</span>
                        </div>
                    )}

                    {explanation && (
                        <div className="p-4 bg-blue-50 rounded-lg text-blue-900">
                            <span className="font-bold">Giải thích: </span>
                            <ParsedContent content={explanation} />
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default ShortAnswer;
