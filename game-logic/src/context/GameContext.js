// src/context/GameContext.js
import React, { createContext, useReducer } from 'react';

export const GameContext = createContext();

// Reducer để quản lý các hành động phức tạp
const gameReducer = (state, action) => {
    switch (action.type) {
        case 'ADD_TEAM':
            return { ...state, teams: [...state.teams, { name: action.payload, score: 0 }] };
        case 'UPDATE_SCORE':
            const newTeams = state.teams.map(team => 
                team.name === action.payload.teamName 
                    ? { ...team, score: team.score + action.payload.points }
                    : team
            );
            return { ...state, teams: newTeams };
        case 'SET_CURRENT_TEAM':
            return { ...state, currentTeamIndex: (state.currentTeamIndex + 1) % state.teams.length };
        default:
            return state;
    }
};

export const GameProvider = ({ children }) => {
    const initialState = {
        teams: [], // Ví dụ: [{name: 'Đội A', score: 0}, {name: 'Đội B', score: 0}]
        currentTeamIndex: 0,
        leaderboard: []
    };
    const [state, dispatch] = useReducer(gameReducer, initialState);

    // Lưu leaderboard vào localStorage để không bị mất khi tải lại trang
    const saveToLeaderboard = (teamName, finalScore) => {
        const board = JSON.parse(localStorage.getItem('leaderboard')) || [];
        board.push({ name: teamName, score: finalScore, date: new Date().toISOString() });
        board.sort((a, b) => b.score - a.score); // Sắp xếp điểm từ cao đến thấp
        localStorage.setItem('leaderboard', JSON.stringify(board.slice(0, 10))); // Lưu top 10
    };

    return (
        <GameContext.Provider value={{ gameState: state, gameDispatch: dispatch, saveToLeaderboard }}>
            {children}
        </GameContext.Provider>
    );
};