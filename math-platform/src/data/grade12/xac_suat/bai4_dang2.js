export const bai4_dang2 = {
    id: "t2",
    title: "Dạng 2: Công thức Bayes",
    content: {
        theory: [
            {
                type: 'theorem',
                title: 'Công thức Bayes',
                text: 'Cho hệ đầy đủ $\\{B_1, ..., B_n\\}$ và biến cố $A$ với $P(A) > 0$. Khi đó: $P(B_k|A) = \\frac{P(B_k) \\cdot P(A|B_k)}{P(A)} = \\frac{P(B_k) \\cdot P(A|B_k)}{\\sum_{i=1}^{n} P(B_i) \\cdot P(A|B_i)}$.'
            },
            {
                type: 'note',
                title: 'Ý nghĩa',
                text: 'Công thức Bayes cho phép tính xác suất "ngược": Biết kết quả $A$ đã xảy ra, tính xác suất nguyên nhân là do $B_k$ gây ra.'
            }
        ],
        exercises: [
            // --- Mức độ: Dễ ---
            {
                type: 'short',
                question: '[Dễ] Cho hai biến cố $A$ và $B$. Biết $P(B) = 0.4$, $P(A|B) = 0.8$, $P(A|\\overline{B}) = 0.1$. Tính $P(B|A)$ (làm tròn 2 chữ số thập phân).',
                correctAnswer: '0.84',
                explanation: '1. Tính $P(A)$ theo công thức xác suất toàn phần:\n' +
                    '$P(A) = P(B)P(A|B) + P(\\overline{B})P(A|\\overline{B})$\n' +
                    '$P(A) = 0.4 \\cdot 0.8 + 0.6 \\cdot 0.1 = 0.32 + 0.06 = 0.38$.\n\n' +
                    '2. Tính $P(B|A)$ theo Bayes:\n' +
                    '$P(B|A) = \\frac{P(B)P(A|B)}{P(A)} = \\frac{0.32}{0.38} \\approx 0.842$.'
            },
            {
                type: 'mcq',
                question: '[Dễ] Một hộp có 3 đồng xu: 2 đồng xu thật (xác suất ngửa 0.5) và 1 đồng xu giả (xác suất ngửa 1). Chọn ngẫu nhiên 1 đồng xu và gieo được mặt ngửa. Tính xác suất đồng xu đó là đồng xu giả.',
                options: [
                    '0.5',
                    '0.33',
                    '0.67',
                    '0.25'
                ],
                correctAnswer: 0,
                explanation: 'Sơ đồ cây:\n' +
                    '- Xu Thật ($2/3$) $\\rightarrow$ Ngửa ($1/2$) $\\Rightarrow 2/3 \\cdot 1/2 = 1/3$.\n' +
                    '- Xu Giả ($1/3$) $\\rightarrow$ Ngửa ($1$) $\\Rightarrow 1/3 \\cdot 1 = 1/3$.\n\n' +
                    'Tổng xác suất Ngửa: $P(N) = 1/3 + 1/3 = 2/3$.\n' +
                    'Xác suất Xu Giả biết Ngửa:\n' +
                    '$P(G|N) = \\frac{1/3}{2/3} = 0.5$.'
            },

            // --- Mức độ: Trung bình ---
            {
                type: 'short',
                question: '[Trung bình] Tỷ lệ người dân mắc bệnh X là $1\\%$. Một xét nghiệm có độ nhạy $95\\%$ (người bệnh $95\\%$ dương tính) và độ đặc hiệu $98\\%$ (người không bệnh $98\\%$ âm tính). Nếu một người có kết quả dương tính, tính xác suất người đó thực sự mắc bệnh (làm tròn 4 chữ số thập phân).',
                correctAnswer: '0.3242',
                explanation: 'Gọi $B$ là bệnh, $K$ là không bệnh ($99\\%$).\n' +
                    'Gọi $+$ là dương tính.\n' +
                    '1. $P(+) = P(B)P(+|B) + P(K)P(+|K)$\n' +
                    '   $P(+) = 0.01 \\cdot 0.95 + 0.99 \\cdot (1 - 0.98)$\n' +
                    '   $P(+) = 0.0095 + 0.99 \\cdot 0.02 = 0.0095 + 0.0198 = 0.0293$.\n\n' +
                    '2. $P(B|+) = \\frac{0.0095}{0.0293} \\approx 0.3242$.'
            },
            {
                type: 'mcq',
                question: '[Trung bình] Có 3 lô hàng. Lô 1 có 10 tốt, 2 xấu. Lô 2 có 8 tốt, 4 xấu. Lô 3 có 5 tốt, 7 xấu. Chọn ngẫu nhiên 1 lô, lấy ra 1 sản phẩm thấy là sản phẩm xấu. Tính xác suất sản phẩm đó thuộc Lô 3.',
                options: [
                    '0.538',
                    '0.333',
                    '0.452',
                    '0.612'
                ],
                correctAnswer: 0,
                explanation: 'Xác suất lấy xấu từ các lô:\n' +
                    '- Lô 1 ($1/3$): $2/12 = 1/6$. Nhánh: $1/3 \\cdot 1/6 = 1/18$.\n' +
                    '- Lô 2 ($1/3$): $4/12 = 1/3$. Nhánh: $1/3 \\cdot 1/3 = 1/9 = 2/18$.\n' +
                    '- Lô 3 ($1/3$): $7/12$. Nhánh: $1/3 \\cdot 7/12 = 7/36$.\n\n' +
                    'Tổng xác suất xấu: $P(X) = 1/18 + 1/9 + 7/36 = 2/36 + 4/36 + 7/36 = 13/36$.\n' +
                    'Xác suất thuộc Lô 3:\n' +
                    '$P(L_3|X) = \\frac{7/36}{13/36} = \\frac{7}{13} \\approx 0.538$.'
            },

            // --- Mức độ: Khó ---
            {
                type: 'mcq',
                question: '[Khó] Một hệ thống truyền tin gửi tín hiệu nhị phân 0 hoặc 1. Tỷ lệ gửi số 0 là $0.6$, số 1 là $0.4$. Do nhiễu, xác suất nhận đúng số 0 là $0.9$, nhận đúng số 1 là $0.8$. Giả sử bên nhận nhận được tín hiệu là số 1. Tính xác suất để tín hiệu gốc thực sự là số 1.',
                options: [
                    '0.842',
                    '0.32',
                    '0.68',
                    '0.5'
                ],
                correctAnswer: 0,
                explanation: 'Gọi $G_0, G_1$ là gửi 0, 1. $N_0, N_1$ là nhận 0, 1.\n' +
                    'Cần tính $P(G_1 | N_1)$.\n\n' +
                    'Sơ đồ cây dẫn đến $N_1$:\n' +
                    '1. Gửi $0$ ($0.6$) $\\rightarrow$ Nhận $1$ (Sai, $0.1$) $\\Rightarrow 0.6 \\cdot 0.1 = 0.06$.\n' +
                    '2. Gửi $1$ ($0.4$) $\\rightarrow$ Nhận $1$ (Đúng, $0.8$) $\\Rightarrow 0.4 \\cdot 0.8 = 0.32$.\n\n' +
                    'Tổng $P(N_1) = 0.06 + 0.32 = 0.38$.\n' +
                    '$P(G_1 | N_1) = \\frac{0.32}{0.38} = \\frac{16}{19} \\approx 0.842$.'
            },
            {
                type: 'short',
                question: '[Khó] Một công ty bảo hiểm chia khách hàng thành 2 nhóm: Nhóm rủi ro cao (chiếm $20\\%$) có xác suất gặp tai nạn trong năm là $0.1$. Nhóm rủi ro thấp (chiếm $80\\%$) có xác suất gặp tai nạn là $0.02$. Một khách hàng vừa gặp tai nạn. Tính xác suất để năm sau người đó lại gặp tai nạn (giả sử bản chất rủi ro của người đó không đổi).',
                correctAnswer: '0.0644',
                explanation: 'Bài toán này gồm 2 bước: Bayes để cập nhật nhóm, sau đó dùng xác suất toàn phần cho năm sau.\n\n' +
                    '1. **Bước 1: Cập nhật khả năng thuộc nhóm rủi ro cao ($C$) sau khi tai nạn ($T_1$)**\n' +
                    '   - $P(C) = 0.2, P(T|C) = 0.1 \\Rightarrow P(C \\cap T) = 0.02$.\n' +
                    '   - $P(L) = 0.8, P(T|L) = 0.02 \\Rightarrow P(L \\cap T) = 0.016$.\n' +
                    '   - $P(T_1) = 0.036$.\n' +
                    '   - $P(C|T_1) = 0.02 / 0.036 = 5/9$.\n' +
                    '   - $P(L|T_1) = 1 - 5/9 = 4/9$.\n\n' +
                    '2. **Bước 2: Tính xác suất tai nạn năm sau ($T_2$)**\n' +
                    '   - Người đó bây giờ thuộc nhóm Cao với xác suất $5/9$, nhóm Thấp với xác suất $4/9$.\n' +
                    '   - $P(T_2) = P(C|T_1) \\cdot 0.1 + P(L|T_1) \\cdot 0.02$\n' +
                    '   - $P(T_2) = 5/9 \\cdot 0.1 + 4/9 \\cdot 0.02$\n' +
                    '   - $P(T_2) = 0.5/9 + 0.08/9 = 0.58/9 \\approx 0.0644$.'
            },
            {
                type: 'short',
                question: '[Khó] (Lọc thư rác) Một bộ lọc thư rác nhận thấy từ "Khuyến mãi" xuất hiện trong $80\\%$ thư rác và $10\\%$ thư thường. Giả sử tỷ lệ thư rác là $50\\%$. Nếu một email có chứa từ "Khuyến mãi", tính xác suất nó là thư rác.',
                correctAnswer: '0.89',
                explanation: 'Gọi $S$ là Spam, $H$ là Ham (thư thường). $P(S)=P(H)=0.5$.\n' +
                    'Gọi $W$ là chứa từ "Khuyến mãi".\n' +
                    '- $P(W|S) = 0.8$.\n' +
                    '- $P(W|H) = 0.1$.\n\n' +
                    'Áp dụng Bayes:\n' +
                    '$P(S|W) = \\frac{P(S)P(W|S)}{P(S)P(W|S) + P(H)P(W|H)}$\n' +
                    '$P(S|W) = \\frac{0.5 \\cdot 0.8}{0.5 \\cdot 0.8 + 0.5 \\cdot 0.1} = \\frac{0.4}{0.4 + 0.05} = \\frac{0.4}{0.45} = \\frac{8}{9} \\approx 0.888$.'
            },

            // --- Mức độ: Rất khó ---
            {
                type: 'mcq',
                question: '[Rất khó] Bài toán Monty Hall (Mở rộng): Có 4 cánh cửa, 1 ô tô và 3 con dê. Bạn chọn cửa 1. MC mở 1 cửa có dê trong 3 cửa còn lại. Bạn quyết định đổi sang một trong 2 cửa chưa mở còn lại (chọn ngẫu nhiên). Tính xác suất bạn trúng ô tô.',
                options: [
                    '3/8',
                    '1/4',
                    '3/4',
                    '1/2'
                ],
                correctAnswer: 0,
                explanation: 'Phân tích bằng Bayes hoặc chia trường hợp:\n' +
                    '1. **TH1: Bạn chọn đúng Ô tô ban đầu ($1/4$)**\n' +
                    '   - MC mở 1 cửa dê. Còn 2 cửa dê.\n' +
                    '   - Bạn đổi ngẫu nhiên sang 1 trong 2 cửa còn lại -> Chắc chắn gặp Dê.\n' +
                    '   - Xác suất thắng ở nhánh này: $0$.\n\n' +
                    '2. **TH2: Bạn chọn sai (chọn Dê) ($3/4$)**\n' +
                    '   - Giả sử bạn chọn Dê 1.\n' +
                    '   - Còn lại: Ô tô, Dê 2, Dê 3.\n' +
                    '   - MC mở 1 cửa Dê (ví dụ Dê 2).\n' +
                    '   - Còn lại: Ô tô và Dê 3.\n' +
                    '   - Bạn đổi ngẫu nhiên sang 1 trong 2 cửa này. Xác suất chọn trúng Ô tô là $1/2$.\n' +
                    '   - Xác suất thắng ở nhánh này: $3/4 \\cdot 1/2 = 3/8$.\n\n' +
                    'Tổng xác suất thắng: $0 + 3/8 = 3/8$.'
            },
            {
                type: 'short',
                question: '[Rất khó] Một xét nghiệm DNA có xác suất trùng khớp ngẫu nhiên là $1/1000$. Giả sử trong thành phố có 1,000,000 dân và chỉ có 1 thủ phạm thực sự. Nếu một người được chọn ngẫu nhiên từ thành phố và có kết quả DNA trùng khớp, tính xác suất người đó là thủ phạm (làm tròn 4 chữ số thập phân).',
                correctAnswer: '0.0010',
                explanation: 'Đây là "Ngụy biện công tố viên" nếu không dùng Bayes.\n' +
                    'Gọi $T$ là thủ phạm, $+$ là trùng khớp.\n' +
                    '- $P(T) = 10^{-6}$. $P(+|T) = 1$.\n' +
                    '- $P(\\overline{T}) = 1 - 10^{-6} \\approx 1$. $P(+|\\overline{T}) = 10^{-3}$.\n\n' +
                    'Áp dụng Bayes:\n' +
                    '$P(T|+) = \\frac{P(T)P(+|T)}{P(T)P(+|T) + P(\\overline{T})P(+|\\overline{T})}$\n' +
                    '$P(T|+) = \\frac{10^{-6} \\cdot 1}{10^{-6} \\cdot 1 + 1 \\cdot 10^{-3}}$\n' +
                    '$P(T|+) \\approx \\frac{10^{-6}}{10^{-3}} = 10^{-3} = 0.001$.\n\n' +
                    'Giải thích trực quan: Trong 1 triệu dân, có 1 thủ phạm (trùng khớp) và khoảng 1000 người vô tội cũng trùng khớp ngẫu nhiên. Vậy nếu trùng khớp, khả năng là thủ phạm chỉ là $1/1001 \\approx 0.001$.'
            },
            {
                type: 'mcq',
                question: '[Rất khó] (Bài toán 3 Tù nhân) Ba tù nhân A, B, C biết rằng 2 trong số họ sẽ bị xử tử và 1 người được tha bổng, nhưng không biết ai. Cai ngục biết rõ ai được tha. A hỏi cai ngục: "Hãy cho tôi biết tên một người sẽ bị xử tử trong số B và C". Cai ngục nói: "B sẽ bị xử tử". Hỏi sau khi nghe tin này, xác suất A được tha bổng là bao nhiêu?',
                options: [
                    '1/3',
                    '1/2',
                    '2/3',
                    '1/4'
                ],
                correctAnswer: 0,
                explanation: 'Đây là một nghịch lý nổi tiếng. Nhiều người nghĩ xác suất tăng lên 1/2, nhưng thực tế vẫn là 1/3.\n' +
                    'Gọi $A, B, C$ là biến cố người đó được tha ($P=1/3$).\n' +
                    'Gọi $b$ là biến cố cai ngục nói "B bị xử tử".\n' +
                    'Ta cần tính $P(A|b)$.\n\n' +
                    '1. Nếu A được tha ($1/3$): Cai ngục có thể nói B hoặc C với xác suất $1/2$. => $P(b|A) = 1/2$.\n' +
                    '2. Nếu B được tha ($1/3$): Cai ngục bắt buộc nói C bị xử tử (không thể nói B). => $P(b|B) = 0$.\n' +
                    '3. Nếu C được tha ($1/3$): Cai ngục bắt buộc nói B bị xử tử. => $P(b|C) = 1$.\n\n' +
                    'Áp dụng Bayes:\n' +
                    '$P(A|b) = \\frac{P(A)P(b|A)}{P(A)P(b|A) + P(B)P(b|B) + P(C)P(b|C)}$\n' +
                    '$P(A|b) = \\frac{1/3 \\cdot 1/2}{1/3 \\cdot 1/2 + 0 + 1/3 \\cdot 1} = \\frac{1/6}{1/6 + 1/3} = \\frac{1/6}{3/6} = 1/3$.\n\n' +
                    'Kết luận: Thông tin của cai ngục không làm thay đổi xác suất của A. Tuy nhiên, xác suất của C đã tăng lên $2/3$.'
            }
        ]
    }
};
