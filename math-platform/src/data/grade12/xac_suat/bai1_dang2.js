export const bai1_dang2 = {
    id: "t2",
    title: "Dạng 2: Hoán vị - Chỉnh hợp - Tổ hợp",
    content: {
        theory: [
            {
                type: 'definition',
                title: 'Hoán vị',
                text: 'Số các hoán vị của tập hợp có $n$ phần tử là $P_n = n!$.'
            },
            {
                type: 'definition',
                title: 'Chỉnh hợp',
                text: 'Số các chỉnh hợp chập $k$ của $n$ phần tử là $A_n^k = \\frac{n!}{(n-k)!}$.'
            },
            {
                type: 'definition',
                title: 'Tổ hợp',
                text: 'Số các tổ hợp chập $k$ của $n$ phần tử là $C_n^k = \\frac{n!}{k!(n-k)!}$.'
            }
        ],
        exercises: [
            {
                type: 'mcq',
                question: 'Có bao nhiêu cách chọn ra 3 học sinh từ một tổ gồm 10 học sinh để đi lao động?',
                options: [
                    '$A_{10}^3$',
                    '$C_{10}^3$',
                    '$10^3$',
                    '$3^{10}$'
                ],
                correctAnswer: 1,
                explanation: 'Chọn 3 người từ 10 người, không phân biệt thứ tự nên dùng Tổ hợp $C_{10}^3$.'
            },
            {
                type: 'short',
                question: 'Có bao nhiêu cách xếp 5 người vào một bàn tròn có 5 ghế?',
                correctAnswer: '24',
                explanation: 'Số hoán vị vòng quanh của 5 phần tử là $(5-1)! = 4! = 24$.'
            }
        ]
    }
};
