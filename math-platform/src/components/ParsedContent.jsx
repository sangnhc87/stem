import React from 'react';
import MathDisplay from './MathDisplay';

const ParsedContent = ({ content }) => {
    if (!content) return null;
    if (typeof content !== 'string') return content;

    // Split by $$...$$ (block) or $...$ (inline)
    // The regex captures the delimiters to help identify them
    const parts = content.split(/(\$\$[\s\S]*?\$\$|\$[\s\S]*?\$)/g);

    return (
        <span>
            {parts.map((part, index) => {
                if (part.startsWith('$$') && part.endsWith('$$')) {
                    // Block math
                    const math = part.slice(2, -2);
                    return <MathDisplay key={index} block={true}>{math}</MathDisplay>;
                } else if (part.startsWith('$') && part.endsWith('$')) {
                    // Inline math
                    const math = part.slice(1, -1);
                    return <MathDisplay key={index} block={false}>{math}</MathDisplay>;
                } else {
                    // Plain text - handle newlines and difficulty tags
                    return (
                        <span key={index}>
                            {part.split('\n').map((line, i) => {
                                // Check for difficulty tags at the start of the line
                                const difficultyMatch = line.match(/^\[(Dễ|Trung bình|Khó|Rất khó)\]/);
                                let content = line;
                                let badge = null;

                                if (difficultyMatch) {
                                    const level = difficultyMatch[1];
                                    content = line.replace(difficultyMatch[0], '').trim();

                                    let colorClass = "bg-gray-100 text-gray-800";
                                    if (level === 'Dễ') colorClass = "bg-green-100 text-green-800 border-green-200";
                                    if (level === 'Trung bình') colorClass = "bg-blue-100 text-blue-800 border-blue-200";
                                    if (level === 'Khó') colorClass = "bg-orange-100 text-orange-800 border-orange-200";
                                    if (level === 'Rất khó') colorClass = "bg-red-100 text-red-800 border-red-200";

                                    badge = (
                                        <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold mr-2 border ${colorClass}`}>
                                            {level}
                                        </span>
                                    );
                                }

                                return (
                                    <React.Fragment key={i}>
                                        {i > 0 && <br />}
                                        {badge}
                                        {content}
                                    </React.Fragment>
                                );
                            })}
                        </span>
                    );
                }
            })}
        </span>
    );
};

export default ParsedContent;
