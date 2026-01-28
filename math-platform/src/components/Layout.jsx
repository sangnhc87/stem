
import React, { useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { BookOpen, Home, GraduationCap, Menu, User, ChevronLeft, ChevronRight } from 'lucide-react';
import { clsx } from 'clsx';

const Layout = () => {
    const location = useLocation();
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    const navItems = [
        { path: '/', label: 'Trang chủ', icon: Home },
        { path: '/grade/10', label: 'Toán 10', icon: GraduationCap },
        { path: '/grade/11', label: 'Toán 11', icon: GraduationCap },
        { path: '/grade/12', label: 'Toán 12', icon: GraduationCap },
    ];

    return (
        <div className="min-h-screen bg-gray-50 flex transition-all duration-300">
            {/* Sidebar */}
            <aside
                className={clsx(
                    "bg-white border-r border-gray-200 hidden md:flex flex-col transition-all duration-300 relative",
                    isSidebarOpen ? "w-64" : "w-20"
                )}
            >
                <div className="p-6 border-b border-gray-200 flex items-center gap-2 overflow-hidden whitespace-nowrap">
                    <BookOpen className="w-8 h-8 text-blue-600 flex-shrink-0" />
                    <span className={clsx("text-xl font-bold text-gray-800 transition-opacity duration-300", isSidebarOpen ? "opacity-100" : "opacity-0")}>
                        MathPlatform
                    </span>
                </div>

                <button
                    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                    className="absolute -right-3 top-20 bg-white border border-gray-200 rounded-full p-1 shadow-sm hover:bg-gray-50 z-10"
                >
                    {isSidebarOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </button>

                <nav className="flex-1 p-4 space-y-1 overflow-hidden">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = location.pathname === item.path;
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={clsx(
                                    'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors whitespace-nowrap',
                                    isActive
                                        ? 'bg-blue-50 text-blue-700 font-medium'
                                        : 'text-gray-600 hover:bg-gray-100'
                                )}
                                title={!isSidebarOpen ? item.label : ''}
                            >
                                <Icon className="w-5 h-5 flex-shrink-0" />
                                <span className={clsx("transition-opacity duration-300", isSidebarOpen ? "opacity-100" : "opacity-0")}>
                                    {item.label}
                                </span>
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-gray-200 overflow-hidden">
                    <button className="flex items-center gap-3 w-full px-4 py-3 text-gray-600 hover:bg-gray-100 rounded-lg whitespace-nowrap">
                        <User className="w-5 h-5 flex-shrink-0" />
                        <span className={clsx("transition-opacity duration-300", isSidebarOpen ? "opacity-100" : "opacity-0")}>
                            Đăng nhập
                        </span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col">
                <header className="bg-white border-b border-gray-200 p-4 md:hidden flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <BookOpen className="w-6 h-6 text-blue-600" />
                        <span className="font-bold text-gray-800">MathPlatform</span>
                    </div>
                    <button className="p-2 text-gray-600">
                        <Menu className="w-6 h-6" />
                    </button>
                </header>

                <div className="flex-1 p-6 overflow-auto">
                    <div className="w-full">
                        <Outlet />
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Layout;
