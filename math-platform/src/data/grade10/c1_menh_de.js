export const c1_menh_de = {
    id: "c1",
    title: "Chương 1: Mệnh đề và Tập hợp",
    lessons: [
        {
            id: "l1",
            title: "Bài 1: Mệnh đề",
            topics: [
                {
                    id: "t1",
                    title: "Dạng 1: Nhận biết mệnh đề",
                    content: {
                        theory: [
                            {
                                type: 'definition',
                                title: 'Định nghĩa Mệnh đề',
                                text: 'Mệnh đề là một khẳng định đúng hoặc sai. Một mệnh đề không thể vừa đúng vừa sai.'
                            },
                            {
                                type: 'note',
                                title: 'Chú ý',
                                text: 'Các câu hỏi, câu cảm thán không phải là mệnh đề.'
                            }
                        ],
                        exercises: [
                            {
                                type: 'mcq',
                                question: 'Trong các câu sau, câu nào là mệnh đề?',
                                options: [
                                    'Hôm nay trời đẹp quá!',
                                    'Bạn có khỏe không?',
                                    'Số 15 là số nguyên tố.',
                                    'Hãy làm bài tập về nhà!'
                                ],
                                correctAnswer: 2,
                                explanation: 'Câu C là một khẳng định sai (15 chia hết cho 3), nên nó là mệnh đề. Các câu còn lại là câu cảm thán, câu hỏi, câu cầu khiến.'
                            },
                            {
                                type: 'tf',
                                question: 'Xét tính đúng sai của các phát biểu sau:',
                                statements: [
                                    'Số 2 là số nguyên tố chẵn duy nhất.',
                                    'Hình vuông không phải là hình chữ nhật.',
                                    'Tổng 3 góc trong một tam giác bằng $180^\\circ$.',
                                    'Số $\\pi$ là số hữu tỉ.'
                                ],
                                correctAnswers: [true, false, true, false],
                                explanation: 'a) Đúng. b) Sai, hình vuông là hình chữ nhật đặc biệt. c) Đúng. d) Sai, $\\pi$ là số vô tỉ.'
                            }
                        ]
                    }
                },
                {
                    id: "t2",
                    title: "Dạng 2: Mệnh đề phủ định",
                    content: {
                        theory: [
                            {
                                type: 'definition',
                                title: 'Mệnh đề phủ định',
                                text: 'Cho mệnh đề $P$. Mệnh đề "Không phải $P$" được gọi là mệnh đề phủ định của $P$, ký hiệu là $\\overline{P}$.'
                            }
                        ],
                        exercises: [
                            {
                                type: 'mcq',
                                question: 'Phủ định của mệnh đề "Mọi số tự nhiên đều không âm" là:',
                                options: [
                                    'Mọi số tự nhiên đều âm.',
                                    'Có ít nhất một số tự nhiên âm.',
                                    'Có ít nhất một số tự nhiên không âm.',
                                    'Mọi số tự nhiên đều bằng 0.'
                                ],
                                correctAnswer: 1,
                                explanation: 'Phủ định của "với mọi" là "tồn tại".'
                            },
                            {
                                type: 'short',
                                question: 'Cho tập hợp $A = \\{1; 2; 3\\}$. Số tập con của $A$ là bao nhiêu?',
                                correctAnswer: '8',
                                explanation: 'Số tập con của tập hợp có $n$ phần tử là $2^n$. Ở đây $2^3 = 8$.'
                            }
                        ]
                    }
                }
            ]
        },
        {
            id: "l2",
            title: "Bài 2: Tập hợp",
            topics: [
                {
                    id: "t1",
                    title: "Dạng 1: Khái niệm tập hợp",
                    content: {
                        theory: [
                            {
                                type: 'definition',
                                title: 'Tập hợp',
                                text: 'Tập hợp là một khái niệm cơ bản của toán học, dùng để chỉ một nhóm các đối tượng nào đó.'
                            }
                        ]
                    }
                }
            ]
        },
        { id: "l3", title: "Bài 3: Các phép toán trên tập hợp", topics: [] }
    ]
};
