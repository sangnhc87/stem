import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ChevronDown, ChevronRight, BookOpen, FileText } from 'lucide-react';
import { curriculum } from '../data/curriculum';
import { clsx } from 'clsx';

const GradeDashboard = () => {
    const { grade } = useParams();
    const chapters = curriculum[grade] || [];
    const [expandedChapter, setExpandedChapter] = useState(chapters[0]?.id);

    const toggleChapter = (id) => {
        setExpandedChapter(expandedChapter === id ? null : id);
    };

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Chương trình Toán {grade}</h1>
                    <p className="text-gray-600 mt-2">Chọn bài học để bắt đầu</p>
                </div>
            </div>

            <div className="space-y-4">
                {chapters.map((chapter) => (
                    <div key={chapter.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                        <button
                            onClick={() => toggleChapter(chapter.id)}
                            className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
                                    <BookOpen className="w-4 h-4" />
                                </div>
                                <span className="font-bold text-gray-800 text-lg">{chapter.title}</span>
                            </div>
                            {expandedChapter === chapter.id ? (
                                <ChevronDown className="w-5 h-5 text-gray-400" />
                            ) : (
                                <ChevronRight className="w-5 h-5 text-gray-400" />
                            )}
                        </button>

                        {expandedChapter === chapter.id && (
                            <div className="border-t border-gray-100 bg-gray-50/50">
                                {chapter.lessons.map((lesson) => (
                                    <Link
                                        key={lesson.id}
                                        to={`/grade/${grade}/chapter/${chapter.id}/lesson/${lesson.id}`}
                                        className="flex items-center gap-3 p-4 pl-16 hover:bg-blue-50 hover:text-blue-700 transition-colors group border-b border-gray-100 last:border-0"
                                    >
                                        <FileText className="w-4 h-4 text-gray-400 group-hover:text-blue-500" />
                                        <span className="text-gray-700 group-hover:text-blue-700 font-medium">
                                            {lesson.title}
                                        </span>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default GradeDashboard;
