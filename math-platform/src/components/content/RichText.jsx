import React from 'react';
import { Book, Award, Info, AlertCircle } from 'lucide-react';
import { clsx } from 'clsx';

const ContentBlock = ({ title, children, icon: Icon, colorClass, bgClass, borderClass }) => (
    <div className={clsx("rounded-lg border-l-4 p-4 my-4", bgClass, borderClass)}>
        <div className="flex items-center gap-2 mb-2">
            <Icon className={clsx("w-5 h-5", colorClass)} />
            <h4 className={clsx("font-bold text-lg", colorClass)}>{title}</h4>
        </div>
        <div className="text-gray-800 leading-relaxed">
            {children}
        </div>
    </div>
);

export const Definition = ({ title = "Định nghĩa", children }) => (
    <ContentBlock
        title={title}
        icon={Book}
        colorClass="text-green-700"
        bgClass="bg-green-50"
        borderClass="border-green-500"
    >
        {children}
    </ContentBlock>
);

export const Theorem = ({ title = "Định lý", children }) => (
    <ContentBlock
        title={title}
        icon={Award}
        colorClass="text-blue-700"
        bgClass="bg-blue-50"
        borderClass="border-blue-500"
    >
        {children}
    </ContentBlock>
);

export const Property = ({ title = "Tính chất", children }) => (
    <ContentBlock
        title={title}
        icon={Info}
        colorClass="text-orange-700"
        bgClass="bg-orange-50"
        borderClass="border-orange-500"
    >
        {children}
    </ContentBlock>
);

export const Note = ({ title = "Chú ý", children }) => (
    <ContentBlock
        title={title}
        icon={AlertCircle}
        colorClass="text-yellow-700"
        bgClass="bg-yellow-50"
        borderClass="border-yellow-500"
    >
        {children}
    </ContentBlock>
);
