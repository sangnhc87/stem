// src/data/quizData.js
export const quizData = [
  {
    id: 'MH18',
    title: 'Màn Chơi 1: Cuộc Thi Cắm Hoa (Chùm)',
    type: 'GROUP', // 'GROUP' cho câu chùm, 'SINGLE' cho câu đơn
    commonAssumption: {
      intro: '(MH18) ... trao cho năm bạn \\( \\M, \\N, \\P, \\Q, \\R \\).',
      rules: [
        '\\( \\N \\) hoặc \\( \\Q \\) được giải tư.',
        '\\( \\R \\) được giải cao hơn \\( \\M \\).',
        '\\( \\P \\) không được giải ba.',
      ],
    },
    questions: [
      {
        questionText: `Đáp án nào dưới đây có thể là thứ tự đúng?`,
        choices: [ /* ... các lựa chọn ... */ ],
        correctAnswer: "B",
        points_correct: 10,
        points_incorrect: -5, // Điểm phạt khi trả lời sai
        solution: `
          <p><strong>Lời Giải Chi Tiết:</strong></p>
          <p>Chúng ta sẽ kiểm tra từng đáp án dựa trên các giả thiết:</p>
          <ul>
            <li>A: ... Sai, vì R phải cao hơn M.</li>
            <li>B: ... Đúng, thỏa mãn tất cả điều kiện.</li>
            <li>C: ... Sai, vì R phải cao hơn M.</li>
            <li>D: ... Sai, vì P không được giải ba.</li>
          </ul>
          <p><strong>Đáp án đúng là B.</strong></p>
        `
      },
      // ... Các câu hỏi khác trong chùm
    ]
  },
  {
    id: 'SINGLE_01',
    title: 'Màn Chơi 2: Câu hỏi Đơn',
    type: 'SINGLE',
    questions: [
      {
        questionText: `Trong React, hook nào dùng để quản lý state trong một functional component?`,
        choices: [
            { text: "useEffect", value: "A" },
            { text: "useState", value: "B" },
            { text: "useContext", value: "C" },
            { text: "useReducer", value: "D" }
        ],
        correctAnswer: "B",
        points_correct: 5,
        points_incorrect: 0, // Không phạt
        solution: `<p><strong>useState</strong> là hook cơ bản để thêm state vào functional components.</p>`
      }
    ]
  }
];