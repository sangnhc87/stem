import React, { useState } from 'react';
import { CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import { clsx } from 'clsx';
import ParsedContent from '../ParsedContent';

const MultipleChoice = ({ question, options, correctAnswer, explanation, onRegenerate }) => {
    const [selected, setSelected] = useState(null);
    const [isSubmitted, setIsSubmitted] = useState(false);

    const handleSubmit = () => {
        if (selected !== null) {
            setIsSubmitted(true);
        }
    };

    const handleReset = () => {
        setSelected(null);
        setIsSubmitted(false);
    };

    const isCorrect = selected === correctAnswer;

    return (
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm my-6 relative group">
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

            <div className="space-y-3">
                {options.map((option, index) => {
                    const isSelected = selected === index;
                    const isAnswer = index === correctAnswer;

                    let stateClass = "border-gray-200 hover:bg-gray-50";
                    if (isSubmitted) {
                        if (isAnswer) stateClass = "bg-green-50 border-green-500 text-green-700";
                        else if (isSelected && !isCorrect) stateClass = "bg-red-50 border-red-500 text-red-700";
                        else stateClass = "opacity-50";
                    } else if (isSelected) {
                        stateClass = "border-blue-500 bg-blue-50 text-blue-700";
                    }

                    return (
                        <button
                            key={index}
                            onClick={() => !isSubmitted && setSelected(index)}
                            disabled={isSubmitted}
                            className={clsx(
                                "w-full text-left p-4 rounded-lg border-2 transition-all flex items-center justify-between",
                                stateClass
                            )}
                        >
                            <div className="flex items-center gap-3">
                                <span className="w-6 h-6 rounded-full border-2 flex items-center justify-center text-sm font-bold">
                                    {String.fromCharCode(65 + index)}
                                </span>
                                <ParsedContent content={option} />
                            </div>

                            {isSubmitted && isAnswer && <CheckCircle className="w-5 h-5 text-green-600" />}
                            {isSubmitted && isSelected && !isCorrect && <XCircle className="w-5 h-5 text-red-600" />}
                        </button>
                    );
                })}
            </div>

            <div className="mt-6 flex items-center gap-4">
                {!isSubmitted ? (
                    <button
                        onClick={handleSubmit}
                        disabled={selected === null}
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

            {isSubmitted && (
                <div className={clsx("mt-4 p-4 rounded-lg", isCorrect ? "bg-green-50" : "bg-red-50")}>
                    <p className={clsx("font-bold mb-1", isCorrect ? "text-green-800" : "text-red-800")}>
                        {isCorrect ? "Chính xác!" : "Chưa chính xác"}
                    </p>
                    {explanation && (
                        <div className="text-gray-700 mt-2">
                            <span className="font-medium">Giải thích: </span>
                            <ParsedContent content={explanation} />
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default MultipleChoice;
