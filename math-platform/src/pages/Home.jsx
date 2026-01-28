import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen, Brain, Calculator } from 'lucide-react';

const Home = () => {
    return (
        <div className="space-y-12">
            <section className="text-center space-y-6 py-12">
                <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight">
                    Hệ thống Toán Phổ Thông <span className="text-blue-600">Toàn Diện</span>
                </h1>
                <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                    Nền tảng học tập thông minh với lý thuyết chi tiết, bài tập tự luyện, và đề thi ngẫu nhiên cho học sinh lớp 10, 11, 12.
                </p>
                <div className="flex justify-center gap-4">
                    <Link to="/grade/10" className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2">
                        Bắt đầu học ngay <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>
            </section>

            <section className="grid md:grid-cols-3 gap-8">
                <FeatureCard
                    icon={BookOpen}
                    title="Lý thuyết chuẩn SGK"
                    description="Hệ thống bài giảng bám sát chương trình giáo dục phổ thông mới, trình bày trực quan, dễ hiểu."
                />
                <FeatureCard
                    icon={Calculator}
                    title="Bài tập đa dạng"
                    description="Kho bài tập phong phú từ cơ bản đến nâng cao, có lời giải chi tiết và phân loại rõ ràng."
                />
                <FeatureCard
                    icon={Brain}
                    title="Luyện tập thông minh"
                    description="Hệ thống tạo đề ngẫu nhiên giúp bạn rèn luyện kỹ năng làm bài và kiểm tra kiến thức."
                />
            </section>
        </div>
    );
};

const FeatureCard = ({ icon: Icon, title, description }) => (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4 text-blue-600">
            <Icon className="w-6 h-6" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
        <p className="text-gray-600">{description}</p>
    </div>
);

export default Home;
