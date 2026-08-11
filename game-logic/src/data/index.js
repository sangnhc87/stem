// src/data/index.js

import mh18_cluster from './quiz-sets/mh18';
import mh19_cluster from './quiz-sets/mh19';

// Ví dụ về một câu hỏi đơn
const single_question_01 = {
  id: 'SINGLE_01',
  // Không có commonAssumption
  questions: [
    {
      questionText: `Trong React, hook nào dùng để quản lý state trong một functional component?`,
      choices: [
        { text: "useEffect", value: "A" },
        { text: "useState", value: "B" },
        { text: "useContext", value: "C" },
      ],
      correctAnswer: "B",
      points_correct: 5,
      points_incorrect: -2,
      penalty_minutes: 0, // Không phạt thời gian
      show_solution: true,
      solution: `<p><strong>useState</strong> là hook cơ bản để thêm state (trạng thái) vào functional components.</p>`
    }
  ]
};


export const quizData = [
  // Màn chơi 1: Chứa cả câu hỏi chùm và câu hỏi đơn
  {
    id: 'DE_THI_TONG_HOP_01',
    title: 'Đề Thi Tổng Hợp Số 1',
    clusters: [
      mh18_cluster,       // Cụm 1 (có giả thiết chung)
      single_question_01, // Cụm 2 (là một câu hỏi đơn, không có giả thiết chung)
      mh19_cluster,       // Cụm 3 (lại là một câu hỏi chùm)
    ]
  },
  // Màn chơi 2: Chỉ chứa một cụm
  {
    id: 'DE_THI_02',
    title: 'Đề Thi Logic Số 2',
    clusters: [ mh19_cluster ]
  }
];