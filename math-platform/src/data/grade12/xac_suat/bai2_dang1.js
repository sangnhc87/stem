export const bai2_dang1 = {
    id: "t1",
    title: "Dạng 1: Tính xác suất theo định nghĩa cổ điển",
    content: {
        theory: [
            {
                type: 'definition',
                title: 'Xác suất cổ điển',
                text: 'Xác suất của biến cố $A$, ký hiệu $P(A)$, được tính bằng công thức: $P(A) = \\frac{n(A)}{n(\\Omega)}$, trong đó $n(A)$ là số phần tử của biến cố $A$ và $n(\\Omega)$ là số phần tử của không gian mẫu.'
            }
        ],
        exercises: [
            {
                type: 'tf',
                question: 'Gieo một con xúc xắc cân đối và đồng chất. Xét tính đúng sai của các phát biểu sau:',
                statements: [
                    'Không gian mẫu có 6 phần tử.',
                    'Xác suất để ra mặt chẵn là 0.5.',
                    'Xác suất để ra mặt số 7 là 1/6.',
                    'Xác suất để ra mặt có số chấm nhỏ hơn 3 là 1/3.'
                ],
                correctAnswers: [true, true, false, true],
                explanation: 'a) Đúng $\\{1,2,3,4,5,6\\}$. b) Đúng $\\{2,4,6\\}$ (3/6). c) Sai, không có mặt 7 (xác suất = 0). d) Đúng $\\{1,2\\}$ (2/6 = 1/3).'
            },
            {
                type: 'mcq',
                question: 'Rút ngẫu nhiên một lá bài từ bộ bài 52 lá. Xác suất để rút được lá Át (Ace) là bao nhiêu?',
                options: [
                    '1/13',
                    '1/52',
                    '1/4',
                    '4/13'
                ],
                correctAnswer: 0,
                explanation: 'Có 4 lá Át trong bộ 52 lá. Xác suất là $4/52 = 1/13$.'
            }
        ]
    }
};
