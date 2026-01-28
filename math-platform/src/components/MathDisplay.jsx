import React, { useEffect, useRef } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

const MathDisplay = ({ block = false, children }) => {
    const containerRef = useRef(null);

    useEffect(() => {
        if (containerRef.current) {
            katex.render(String(children), containerRef.current, {
                throwOnError: false,
                displayMode: block,
            });
        }
    }, [children, block]);

    return <span ref={containerRef} />;
};

export default MathDisplay;
