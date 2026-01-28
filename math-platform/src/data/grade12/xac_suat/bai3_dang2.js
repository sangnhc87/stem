export const bai3_dang2 = {
    id: "t2",
    title: "Dạng 2: Sự độc lập của các biến cố",
    content: {
        theory: [
            {
                type: 'definition',
                title: 'Biến cố độc lập',
                text: 'Hai biến cố $A$ và $B$ được gọi là độc lập nếu việc xảy ra hay không xảy ra của biến cố này không ảnh hưởng tới xác suất xảy ra của biến cố kia. Khi đó: $P(AB) = P(A) \\cdot P(B)$.'
            },
            {
                type: 'example',
                title: 'Ví dụ 1 (Mức độ: Dễ)',
                text: 'Hai xạ thủ bắn độc lập vào bia. Xác suất trúng của A là 0.7, của B là 0.8. Tính xác suất để cả hai cùng trúng.\n\n**Giải:**\nVì độc lập nên:\n$P(AB) = P(A) \\cdot P(B) = 0.7 \\cdot 0.8 = 0.56$.'
            },
            {
                type: 'example',
                title: 'Ví dụ 2 (Mức độ: Trung bình)',
                text: 'Gieo 2 đồng xu cân đối. Tính xác suất để cả 2 đều ngửa.\n\n**Giải:**\nXác suất ngửa của mỗi đồng xu là $0.5$.\nVì 2 đồng xu độc lập:\n$P(NN) = 0.5 \\cdot 0.5 = 0.25$.'
            }
        ],
        exercises: [
            // Mức độ: Dễ
            {
                type: 'mcq',
                question: '[Dễ] Hai xạ thủ cùng bắn vào bia. Xác suất trúng đích của người thứ nhất là $0.8$, của người thứ hai là $0.7$. Tính xác suất để cả hai cùng trúng đích (giả sử hai người bắn độc lập).',
                options: ['0.56', '0.15', '0.94', '1.5'],
                correctAnswer: 0,
                explanation: 'Vì hai người bắn độc lập nên:\n$P(AB) = P(A) \\cdot P(B) = 0.8 \\cdot 0.7 = 0.56$.'
            },
            {
                type: 'mcq',
                question: '[Dễ] Gieo 2 đồng xu cân đối và đồng chất một cách độc lập. Xác suất để cả 2 đồng xu đều ngửa là:',
                options: ['1/2', '1/4', '1/3', '1/8'],
                correctAnswer: 1,
                explanation: 'Áp dụng quy tắc nhân cho biến cố độc lập:\n$P(NN) = P(N) \\cdot P(N) = 0.5 \\cdot 0.5 = 0.25 = 1/4$.'
            },
            {
                type: 'tf',
                question: '[Dễ] Cho hai biến cố $A$ và $B$ độc lập với $P(A) = 0.3, P(B) = 0.4$. Xét tính đúng sai:',
                statements: [
                    '$P(AB) = 0.12$.',
                    '$P(A \\cup B) = 0.7$.',
                    '$P(\\overline{A}B) = 0.28$.',
                    '$P(A|B) = 0.3$.'
                ],
                correctAnswers: [true, false, true, true],
                explanation: 'a) $P(AB) = 0.3 \\cdot 0.4 = 0.12$. Đúng.\n\nb) $P(A \\cup B) = P(A) + P(B) - P(AB) = 0.3 + 0.4 - 0.12 = 0.58$. Sai.\n\nc) $P(\\overline{A}B) = P(\\overline{A}) \\cdot P(B) = (1-0.3) \\cdot 0.4 = 0.7 \\cdot 0.4 = 0.28$. Đúng.\n\nd) $P(A|B) = P(A) = 0.3$ (do $A, B$ độc lập). Đúng.'
            },
            // Mức độ: Trung bình
            {
                type: 'short',
                question: '[Trung bình] Hai bạn An và Bình cùng làm bài thi. Xác suất làm được bài của An là $0.9$, của Bình là $0.8$. Tính xác suất để chỉ có đúng 1 bạn làm được bài.',
                correctAnswer: '0.26',
                explanation: 'Có 2 trường hợp xảy ra:\n1. An làm được, Bình không:\n$P_1 = 0.9 \\cdot (1 - 0.8) = 0.9 \\cdot 0.2 = 0.18$.\n\n2. An không làm được, Bình làm được:\n$P_2 = (1 - 0.9) \\cdot 0.8 = 0.1 \\cdot 0.8 = 0.08$.\n\nTổng xác suất:\n$P = 0.18 + 0.08 = 0.26$.'
            },
            {
                type: 'mcq',
                question: '[Trung bình] Một hộp có $5$ bi xanh, $5$ bi đỏ. Lấy lần lượt $2$ viên bi có hoàn lại. Xác suất để lấy được $2$ bi cùng màu là:',
                options: ['0.5', '0.25', '0.4', '0.6'],
                correctAnswer: 0,
                explanation: 'Vì lấy có hoàn lại nên 2 lần lấy độc lập.\n1. Xác suất 2 bi xanh:\n$P(XX) = 0.5 \\cdot 0.5 = 0.25$.\n\n2. Xác suất 2 bi đỏ:\n$P(DD) = 0.5 \\cdot 0.5 = 0.25$.\n\n3. Tổng xác suất:\n$P = 0.25 + 0.25 = 0.5$.'
            },
            // Mức độ: Khó
            {
                type: 'short',
                question: '[Khó] Ba người cùng bắn vào 1 bia. Xác suất trúng đích của 3 người lần lượt là $0.6, 0.7, 0.8$. Tính xác suất để có ít nhất 1 người bắn trúng.',
                correctAnswer: '0.976',
                explanation: 'Dùng biến cố đối: "Không ai bắn trúng".\n1. Xác suất người 1 trượt: $1 - 0.6 = 0.4$.\n2. Xác suất người 2 trượt: $1 - 0.7 = 0.3$.\n3. Xác suất người 3 trượt: $1 - 0.8 = 0.2$.\n\n4. Xác suất cả 3 cùng trượt:\n$P(\\text{All Miss}) = 0.4 \\cdot 0.3 \\cdot 0.2 = 0.024$.\n\n5. Xác suất ít nhất 1 trúng:\n$P = 1 - 0.024 = 0.976$.'
            },
            {
                type: 'short',
                question: '[Khó] Xác suất để một hạt giống nảy mầm là $0.8$. Gieo $3$ hạt giống độc lập với nhau. Tính xác suất để có đúng $2$ hạt nảy mầm.',
                correctAnswer: '0.384',
                explanation: 'Số cách chọn 2 hạt nảy mầm trong 3 hạt là $C_3^2 = 3$.\nXác suất 2 hạt nảy mầm, 1 hạt không:\n$P = C_3^2 \\cdot (0.8)^2 \\cdot (0.2)^1$\n$= 3 \\cdot 0.64 \\cdot 0.2$\n$= 0.384$.'
            },
            // Mức độ: Rất khó
            {
                type: 'tf',
                question: '[Rất khó] Một mạch điện gồm $2$ linh kiện $A$ và $B$ mắc nối tiếp. Xác suất hỏng trong một khoảng thời gian $t$ của $A$ là $0.1$, của $B$ là $0.2$. Các linh kiện hỏng độc lập nhau. Xét tính đúng sai:',
                statements: [
                    'Xác suất cả hai linh kiện cùng hỏng là $0.02$.',
                    'Xác suất mạch hoạt động tốt (cả 2 không hỏng) là $0.72$.',
                    'Xác suất mạch bị hỏng (ít nhất 1 linh kiện hỏng) là $0.28$.',
                    'Nếu mắc song song thì xác suất mạch hỏng là $0.02$.'
                ],
                correctAnswers: [true, true, true, true],
                explanation: 'a) $P(H_A \\cap H_B) = 0.1 \\cdot 0.2 = 0.02$. Đúng.\n\nb) Mạch nối tiếp hoạt động tốt khi cả 2 đều tốt:\n$P(\\text{Tốt}) = P(\\overline{H_A}) \\cdot P(\\overline{H_B}) = 0.9 \\cdot 0.8 = 0.72$. Đúng.\n\nc) Mạch nối tiếp hỏng khi có ít nhất 1 linh kiện hỏng:\n$P(\\text{Hỏng}) = 1 - P(\\text{Tốt}) = 1 - 0.72 = 0.28$. Đúng.\n\nd) Mạch song song hỏng khi cả 2 cùng hỏng:\n$P(\\text{Song song hỏng}) = P(H_A) \\cdot P(H_B) = 0.1 \\cdot 0.2 = 0.02$. Đúng.'
            },
            {
                type: 'mcq',
                question: '[Rất khó] Một cầu thủ bóng rổ ném phạt với xác suất trúng là $0.8$. Cầu thủ này ném 5 lần độc lập. Tính xác suất để cầu thủ ném trúng ít nhất 4 lần.',
                options: ['0.737', '0.672', '0.409', '0.328'],
                correctAnswer: 0,
                explanation: 'Dùng công thức Bernoulli (hoặc phân tích trường hợp):\n' +
                    '1. **Trúng 4 lần, trượt 1 lần**:\n' +
                    '   Số cách chọn 4 lần trúng: $C_5^4 = 5$.\n' +
                    '   Xác suất: $5 \\cdot (0.8)^4 \\cdot (0.2)^1 = 5 \\cdot 0.4096 \\cdot 0.2 = 0.4096$.\n\n' +
                    '2. **Trúng cả 5 lần**:\n' +
                    '   Xác suất: $(0.8)^5 = 0.32768$.\n\n' +
                    '3. Tổng xác suất:\n' +
                    '$P = 0.4096 + 0.32768 = 0.73728 \\approx 0.737$.'
            },
            {
                type: 'short',
                question: '[Rất khó] Hai người hẹn gặp nhau tại công viên trong khoảng từ 8h đến 9h. Người đến trước sẽ chờ người kia tối đa 15 phút. Giả sử thời điểm đến của hai người là ngẫu nhiên và độc lập. Tính xác suất để hai người gặp nhau.',
                correctAnswer: '0.4375',
                explanation: 'Đây là bài toán xác suất hình học.\n' +
                    'Gọi $x, y$ là số phút sau 8h mà người 1 và người 2 đến ($0 \\le x, y \\le 60$).\n' +
                    'Không gian mẫu là hình vuông cạnh 60: $\\Omega = 60 \\times 60 = 3600$.\n' +
                    'Hai người gặp nhau khi $|x - y| \\le 15$.\n' +
                    'Diện tích miền gặp nhau bằng diện tích hình vuông trừ đi diện tích 2 tam giác ở góc (khi $|x-y| > 15$).\n' +
                    'Cạnh của tam giác góc là $60 - 15 = 45$.\n' +
                    'Diện tích 2 tam giác: $45 \\times 45 = 2025$.\n' +
                    'Diện tích miền gặp nhau: $3600 - 2025 = 1575$.\n' +
                    'Xác suất: $P = \\frac{1575}{3600} = \\frac{7}{16} = 0.4375$.'
            },
            {
                type: 'mcq',
                question: '[Khó] Một bài thi trắc nghiệm gồm 50 câu, mỗi câu 4 phương án. Một học sinh làm đúng 30 câu, còn 20 câu khoanh bừa. Tính xác suất để học sinh đó được đúng 40 câu (tức là đúng thêm 10 câu trong 20 câu khoanh bừa).',
                options: ['0.0099', '0.05', '0.1', '0.02'],
                correctAnswer: 0,
                explanation: 'Bài toán trở thành: Khoanh bừa 20 câu, tính xác suất đúng đúng 10 câu.\n' +
                    'Dùng công thức Bernoulli với $n=20, k=10, p=0.25$.\n' +
                    '$P = C_{20}^{10} \\cdot (0.25)^{10} \\cdot (0.75)^{10}$.\n' +
                    '$C_{20}^{10} = 184756$.\n' +
                    '$P \\approx 184756 \\cdot 9.53e-7 \\cdot 0.0563 \\approx 0.0099$.'
            },
            {
                type: 'short',
                question: '[Trung bình] Trong di truyền học, giả sử gen A (trội) quy định mắt đen, a (lặn) quy định mắt xanh. Bố và mẹ đều có kiểu gen dị hợp Aa. Tính xác suất để sinh con đầu lòng mắt xanh.',
                correctAnswer: '0.25',
                explanation: 'Sơ đồ lai: Aa x Aa.\n' +
                    'Các khả năng của con: AA, Aa, aA, aa (xác suất mỗi loại 0.25).\n' +
                    'Mắt xanh tương ứng với kiểu gen aa.\n' +
                    'Vậy xác suất là $0.25$.'
            },
            {
                type: 'mcq',
                question: '[Khó] Một hệ thống gồm 3 radar hoạt động độc lập. Xác suất phát hiện mục tiêu của mỗi radar lần lượt là 0.8, 0.9, 0.9. Tính xác suất để mục tiêu bị phát hiện (bởi ít nhất 1 radar).',
                options: ['0.998', '0.99', '0.98', '0.9'],
                correctAnswer: 0,
                explanation: 'Dùng biến cố đối: "Mục tiêu KHÔNG bị phát hiện bởi radar nào".\n' +
                    '$P(\\text{Miss}_1) = 0.2$.\n' +
                    '$P(\\text{Miss}_2) = 0.1$.\n' +
                    '$P(\\text{Miss}_3) = 0.1$.\n' +
                    '$P(\\text{All Miss}) = 0.2 \\cdot 0.1 \\cdot 0.1 = 0.002$.\n' +
                    '$P(\\text{Hit}) = 1 - 0.002 = 0.998$.'
            },
            {
                type: 'short',
                question: '[Trung bình] Gieo 3 con xúc xắc cân đối. Tính xác suất để tổng số chấm bằng 4.',
                correctAnswer: '0.0139',
                explanation: 'Không gian mẫu: $6^3 = 216$.\n' +
                    'Các bộ số có tổng bằng 4:\n' +
                    '- (1, 1, 2): có 3 hoán vị (112, 121, 211).\n' +
                    'Tổng cộng có 3 trường hợp thuận lợi.\n' +
                    'Xác suất: $3/216 = 1/72 \\approx 0.01388... \\approx 0.0139$.'
            },
            {
                type: 'mcq',
                question: '[Rất khó] Hai đấu thủ A và B thi đấu cờ vua. A thắng với xác suất 0.4, B thắng với xác suất 0.3, hòa 0.3. Họ thi đấu 3 ván độc lập. Tính xác suất để A thắng chung cuộc (thắng nhiều ván hơn B).',
                options: ['0.46', '0.4', '0.5', '0.2'],
                correctAnswer: 0,
                explanation: 'Các trường hợp A thắng chung cuộc:\n' +
                    '1. **A thắng 2, B thắng 0** (các ván còn lại hòa hoặc A thắng):\n' +
                    '   - A thắng 3: $(0.4)^3 = 0.064$.\n' +
                    '   - A thắng 2, Hòa 1: $C_3^2 \\cdot (0.4)^2 \\cdot 0.3 = 3 \\cdot 0.16 \\cdot 0.3 = 0.144$.\n' +
                    '   - A thắng 2, B thắng 1: $C_3^2 \\cdot (0.4)^2 \\cdot 0.3 = 0.144$ (A thắng 2 ván, B thắng 1 ván => A thắng chung cuộc).\n' +
                    '   - A thắng 1, Hòa 2: $C_3^1 \\cdot 0.4 \\cdot (0.3)^2 = 3 \\cdot 0.4 \\cdot 0.09 = 0.108$.\n' +
                    '   - A thắng 1, Hòa 1, B thắng 1: (Hòa chung cuộc - Loại).\n' +
                    '   - A thắng 1, B thắng 2: (B thắng - Loại).\n' +
                    '   - Hòa 3: (Hòa - Loại).\n\n' +
                    '   Tổng: $0.064 + 0.144 + 0.144 + 0.108 = 0.46$.'
            }
        ]
    }
};
