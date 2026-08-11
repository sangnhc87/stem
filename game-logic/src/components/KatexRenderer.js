import React, { useRef, useEffect, memo } from 'react';
// ❌ Bỏ import katex chính, vì chúng ta không dùng trực tiếp
// import katex from 'katex'; 

// ✅ THAY ĐỔI 1: Import đúng hàm renderMathInElement từ contrib/auto-render
import renderMathInElement from 'katex/dist/contrib/auto-render';
import 'katex/dist/katex.min.css';

// Bỏ hook 'useKatex'
// const useKatex = '../hooks/useKatex';

const KatexRendererComponent = ({ htmlString }) => {
    const containerRef = useRef(null);

    useEffect(() => {
        if (containerRef.current && htmlString) { 
            
            // Bước 1: Chèn chuỗi HTML
            containerRef.current.innerHTML = htmlString;
            
            // Bước 2: Chạy KaTeX
            try {
                // ✅ THAY ĐỔI 2: Gọi thẳng hàm renderMathInElement (không có 'katex.' ở trước)
                renderMathInElement(containerRef.current, {
                    delimiters: [
                        {left: "$$", right: "$$", display: true},
                        {left: "$", right: "$", display: false},
                        {left: "\\(", right: "\\)", display: false},
                        {left: "\\[", right: "\\]", display: true}
                    ],
                    throwOnError: false
                });
            } catch (error) {
                console.error("Lỗi render KaTeX:", error);
            }
        } else if (containerRef.current) {
            // Xóa nội dung cũ nếu chuỗi rỗng
            containerRef.current.innerHTML = '';
        }
    }, [htmlString]);

    return <div ref={containerRef} />;
};

export default memo(KatexRendererComponent);

