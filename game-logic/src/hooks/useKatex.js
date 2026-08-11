// src/hooks/useKatex.js

import { useEffect, useRef } from 'react';

// Hook này sẽ tự động chạy KaTeX trên một element DOM bất kỳ
// Bằng cách bỏ trống dependency array, nó sẽ chạy lại sau mỗi lần component render
const useKatex = () => {
    const ref = useRef(null);

    useEffect(() => {
        if (ref.current && window.renderMathInElement) {
            window.renderMathInElement(ref.current, {
                delimiters: [
                    { left: '$$', right: '$$', display: true },
                    { left: '$', right: '$', display: false },
                    { left: '\\[', right: '\\]', display: true },
                    { left: '\\(', right: '\\)', display: false }
                ],
                throwOnError: false
            });
        }
    }); // <--- Chú ý: Không có mảng dependency [] ở đây

    return ref;
};

export default useKatex;