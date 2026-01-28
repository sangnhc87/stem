import React, { useState } from 'react';
import { CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import { clsx } from 'clsx';
import MathDisplay from '../MathDisplay';
import ParsedContent from '../ParsedContent';

const TrueFalse = ({ question, statements, correctAnswers, explanation, onRegenerate }) => {
    // state: { [index]: boolean | null } (true = True, false = False, null = unselected)
    const [userAnswers, setUserAnswers] = useState({});
    const [isSubmitted, setIsSubmitted] = useState(false);

    const handleSelect = (index, value) => {
        if (isSubmitted) return;
        setUserAnswers(prev => ({ ...prev, [index]: value }));
    };

    const handleSubmit = () => {
        setIsSubmitted(true);
    };

    const handleReset = () => {
        setUserAnswers({});
        setIsSubmitted(false);
    };

    const allAnswered = statements.length > 0 && statements.every((_, idx) => userAnswers[idx] !== undefined);

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

            <div className="space-y-4">
                {statements.map((stmt, index) => {
                    const userAnswer = userAnswers[index];
                    const isCorrect = userAnswer === correctAnswers[index];

                    return (
                        <div key={index} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-gray-50 rounded-lg border border-gray-100">
                            <div className="flex-1">
                                <span className="font-bold mr-2">{String.fromCharCode(97 + index)})</span>
                                <ParsedContent content={stmt} />
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => handleSelect(index, true)}
                                    disabled={isSubmitted}
                                    className={clsx(
                                        "px-4 py-1.5 rounded-md font-medium text-sm transition-colors border",
                                        userAnswer === true
                                            ? "bg-blue-600 text-white border-blue-600"
                                            : "bg-white text-gray-600 border-gray-300 hover:bg-gray-100"
                                    )}
                                >
                                    Đúng
                                </button>
                                <button
                                    onClick={() => handleSelect(index, false)}
                                    disabled={isSubmitted}
                                    className={clsx(
                                        "px-4 py-1.5 rounded-md font-medium text-sm transition-colors border",
                                        userAnswer === false
                                            ? "bg-blue-600 text-white border-blue-600"
                                            : "bg-white text-gray-600 border-gray-300 hover:bg-gray-100"
                                    )}
                                >
                                    Sai
                                </button>

                                {isSubmitted && (
                                    <div className="w-6 flex justify-center">
                                        {isCorrect ? (
                                            <CheckCircle className="w-5 h-5 text-green-600" />
                                        ) : (
                                            <XCircle className="w-5 h-5 text-red-600" />
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="mt-6 flex items-center gap-4">
                {!isSubmitted ? (
                    <button
                        onClick={handleSubmit}
                        disabled={!allAnswered}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        Kiểm tra
                    </button>
                ) : (
                    <button
                        onClick={handleReset}
                        className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                    >
                        Làm lại
                    </button>
                )}
            </div>

            {isSubmitted && explanation && (
                <div className="mt-4 p-4 bg-blue-50 rounded-lg text-blue-900">
                    <span className="font-bold">Giải thích: </span>
                    <ParsedContent content={explanation} />
                </div>
            )}
        </div>
    );
};

export default TrueFalse;
