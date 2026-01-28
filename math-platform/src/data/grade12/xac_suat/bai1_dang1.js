export const bai1_dang1 = {
    id: "t1",
    title: "Dạng 1: Quy tắc cộng và Quy tắc nhân",
    content: {
        theory: [
            {
                type: 'definition',
                title: 'Quy tắc cộng',
                text: 'Giả sử một công việc có thể được thực hiện theo phương án $A$ hoặc phương án $B$. Có $m$ cách thực hiện phương án $A$ và $n$ cách thực hiện phương án $B$. Khi đó công việc có thể được thực hiện bởi $m + n$ cách.'
            },
            {
                type: 'definition',
                title: 'Quy tắc nhân',
                text: 'Giả sử một công việc bao gồm hai công đoạn $A$ và $B$. Công đoạn $A$ có $m$ cách thực hiện và công đoạn $B$ có $n$ cách thực hiện. Khi đó công việc có thể được thực hiện bởi $m \\cdot n$ cách.'
            }
        ],
        exercises: [
            {
                type: 'short',
                question: 'Từ thành phố A đến thành phố B có 3 con đường, từ B đến C có 4 con đường. Hỏi có bao nhiêu cách đi từ A đến C qua B?',
                correctAnswer: '12',
                explanation: 'Áp dụng quy tắc nhân: $3 \\times 4 = 12$ cách.'
            },
            {
                type: 'mcq',
                question: 'Một lớp có $20$ nam và $15$ nữ. Có bao nhiêu cách chọn ra một học sinh đi dự đại hội?',
                options: [
                    '35',
                    '300',
                    '20',
                    '15'
                ],
                correctAnswer: 0,
                explanation: 'Áp dụng quy tắc cộng: $20 + 15 = 35$ cách.'
            }
        ]
    }
};
