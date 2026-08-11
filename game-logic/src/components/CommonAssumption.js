import React from 'react';
import KatexRenderer from './KatexRenderer'; // Import component mới

const CommonAssumption = ({ assumption }) => {
    const content = `
        <p>${assumption.intro}</p>
        <ul>
            ${assumption.rules.map(rule => `<li>${rule}</li>`).join('')}
        </ul>
    `;

    return (
        <div className="info-box common-assumption">
            <h2 className="section-title">Giả thiết chung</h2>
            {/* Dùng KatexRenderer để hiển thị nội dung */}
            <KatexRenderer htmlString={content} />
        </div>
    );
};

export default CommonAssumption;