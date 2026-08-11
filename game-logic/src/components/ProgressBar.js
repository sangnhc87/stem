import React from 'react';

const ProgressBar = ({ current, total }) => {
  const percentage = total > 0 ? (current / total) * 100 : 0;
  return (
    <div className="progress-bar-container">
      <div className="progress-bar-filler" style={{ width: `${percentage}%` }}>
        <span>{current} / {total}</span>
      </div>
    </div>
  );
};

export default ProgressBar;