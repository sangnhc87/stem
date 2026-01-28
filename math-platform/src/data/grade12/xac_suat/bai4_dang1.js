// src/data/grade12/xac_suat/bai4_dang1.js

export const bai4_dang1 = {
    id: "t1",
    title: "Dạng 1: Công thức xác suất toàn phần",
    content: {
        theory: [
            {
                type: 'theorem',
                title: 'Công thức xác suất toàn phần',
                text: 'Cho hệ đầy đủ các biến cố $\\{B_1, B_2, ..., B_n\\}$. Khi đó với mọi biến cố $A$, ta có: $P(A) = \\sum_{i=1}^{n} P(B_i) \\cdot P(A|B_i)$.'
            },
            {
                type: 'note',
                title: 'Phương pháp Sơ đồ cây',
                text: 'Để giải quyết các bài toán xác suất toàn phần, ta thường sử dụng sơ đồ cây để mô tả các giai đoạn của phép thử. Xác suất của biến cố cần tìm là tổng xác suất của các "nhánh" dẫn đến biến cố đó.'
            }
        ],
        exercises: [
            // ============================================================
            // MỨC ĐỘ: DỄ
            // ============================================================
            {
                type: 'mcq',
                question: '[Dễ] Có 2 hộp bi. Hộp 1 có 3 bi đỏ, 7 bi xanh. Hộp 2 có 5 bi đỏ, 5 bi xanh. Gieo một đồng xu cân đối. Nếu ngửa chọn Hộp 1, nếu sấp chọn Hộp 2. Sau đó lấy ra 1 viên bi. Tính xác suất lấy được bi đỏ.',
                options: [
                    '0.4',
                    '0.5',
                    '0.3',
                    '0.45'
                ],
                correctAnswer: 0,
                explanation: 'Sơ đồ cây:\n' +
                    '- Nhánh 1: Ngửa ($0.5$) $\\rightarrow$ Hộp 1 $\\rightarrow$ Đỏ ($3/10 = 0.3$).\n' +
                    '  $P_1 = 0.5 \\cdot 0.3 = 0.15$.\n' +
                    '- Nhánh 2: Sấp ($0.5$) $\\rightarrow$ Hộp 2 $\\rightarrow$ Đỏ ($5/10 = 0.5$).\n' +
                    '  $P_2 = 0.5 \\cdot 0.5 = 0.25$.\n\n' +
                    'Tổng xác suất: $P(D) = 0.15 + 0.25 = 0.4$.'
            },
            {
                type: 'short',
                question: '[Dễ] Một lớp học có $60\\%$ học sinh là nữ, $40\\%$ là nam. Tỷ lệ đeo kính của nữ là $10\\%$, của nam là $20\\%$. Chọn ngẫu nhiên một học sinh. Tính xác suất để học sinh đó đeo kính.',
                correctAnswer: '0.14',
                explanation: 'Áp dụng công thức xác suất toàn phần:\n' +
                    '$P(K) = P(\\text{Nữ}) \\cdot P(K|\\text{Nữ}) + P(\\text{Nam}) \\cdot P(K|\\text{Nam})$\n' +
                    '$P(K) = 0.6 \\cdot 0.1 + 0.4 \\cdot 0.2$\n' +
                    '$P(K) = 0.06 + 0.08 = 0.14$.'
            },
            {
                type: 'short',
                question: '[Dễ] Một cửa hàng bán hoa có 3 loại hoa hồng: Hồng đỏ ($50\\%$), Hồng vàng ($30\\%$) và Hồng trắng ($20\\%$). Tỷ lệ hoa tươi lâu của từng loại lần lượt là $80\\%$, $70\\%$ và $60\\%$. Chọn ngẫu nhiên một bông hoa. Tính xác suất để chọn được bông hoa tươi lâu.',
                correctAnswer: '0.73',
                explanation: 'Áp dụng công thức xác suất toàn phần:\n' +
                    '$P(T) = 0.5 \\cdot 0.8 + 0.3 \\cdot 0.7 + 0.2 \\cdot 0.6$\n' +
                    '$P(T) = 0.4 + 0.21 + 0.12 = 0.73$.'
            },
            {
                type: 'mcq',
                question: '[Dễ] Có hai chuồng gà. Chuồng I có 15 gà mái, 5 gà trống. Chuồng II có 10 gà mái, 10 gà trống. Gieo một con xúc xắc. Nếu ra mặt 1 hoặc 6 chấm thì chọn Chuồng I, các mặt còn lại chọn Chuồng II. Sau đó bắt ngẫu nhiên 1 con gà. Tính xác suất bắt được gà trống.',
                options: [
                    '5/12',
                    '1/3',
                    '7/15',
                    '0.4'
                ],
                correctAnswer: 0,
                explanation: 'Phân tích khả năng chọn chuồng:\n' +
                    '- $P(\\text{Chuồng I}) = 2/6 = 1/3$. Tỷ lệ trống: $5/20 = 1/4$.\n' +
                    '- $P(\\text{Chuồng II}) = 4/6 = 2/3$. Tỷ lệ trống: $10/20 = 1/2$.\n' +
                    'Áp dụng công thức:\n' +
                    '$P(\\text{Trống}) = \\frac{1}{3} \\cdot \\frac{1}{4} + \\frac{2}{3} \\cdot \\frac{1}{2} = \\frac{1}{12} + \\frac{1}{3} = \\frac{5}{12}$.'
            },

            // ============================================================
            // MỨC ĐỘ: TRUNG BÌNH
            // ============================================================
            {
                type: 'mcq',
                question: '[Trung bình] Một nhà máy có 3 phân xưởng A, B, C sản xuất lần lượt $25\\%$, $35\\%$ và $40\\%$ tổng sản phẩm. Tỷ lệ phế phẩm của ba phân xưởng lần lượt là $1\\%$, $2\\%$ và $1.5\\%$. Tính tỷ lệ phế phẩm chung của toàn nhà máy.',
                options: [
                    '0.0155',
                    '0.015',
                    '0.02',
                    '0.01'
                ],
                correctAnswer: 0,
                explanation: 'Gọi $F$ là biến cố sản phẩm bị hỏng.\n' +
                    'Áp dụng công thức xác suất toàn phần:\n' +
                    '$P(F) = 0.25 \\cdot 0.01 + 0.35 \\cdot 0.02 + 0.40 \\cdot 0.015$\n' +
                    '$P(F) = 0.0025 + 0.007 + 0.006$\n' +
                    '$P(F) = 0.0155$.'
            },
            {
                type: 'short',
                question: '[Trung bình] Có hai xạ thủ bắn vào bia. Xạ thủ A bắn trúng với xác suất $0.8$, xạ thủ B bắn trúng với xác suất $0.7$. Chọn ngẫu nhiên một xạ thủ và cho bắn 1 phát. Tính xác suất để bia bị trúng đạn.',
                correctAnswer: '0.75',
                explanation: 'Sơ đồ cây:\n' +
                    '- Chọn A ($0.5$) $\\rightarrow$ Trúng ($0.8$) $\\Rightarrow 0.5 \\cdot 0.8 = 0.4$.\n' +
                    '- Chọn B ($0.5$) $\\rightarrow$ Trúng ($0.7$) $\\Rightarrow 0.5 \\cdot 0.7 = 0.35$.\n\n' +
                    'Tổng xác suất: $0.4 + 0.35 = 0.75$.'
            },
            {
                type: 'short',
                question: '[Trung bình] Một công ty dịch vụ có 3 tổng đài viên. Nhân viên A xử lý $50\\%$ cuộc gọi với tỷ lệ hài lòng $90\\%$. Nhân viên B xử lý $30\\%$ cuộc gọi với tỷ lệ hài lòng $80\\%$. Nhân viên C xử lý $20\\%$ cuộc gọi với tỷ lệ hài lòng $70\\%$. Tính tỷ lệ hài lòng chung của khách hàng.',
                correctAnswer: '0.83',
                explanation: 'Áp dụng công thức:\n' +
                    '$P(H) = 0.5 \\cdot 0.9 + 0.3 \\cdot 0.8 + 0.2 \\cdot 0.7$\n' +
                    '$P(H) = 0.45 + 0.24 + 0.14 = 0.83$.'
            },
            {
                type: 'mcq',
                question: '[Trung bình] Một nhà đầu tư chia vốn vào 3 danh mục: Bất động sản ($40\\%$), Chứng khoán ($35\\%$) và Vàng ($25\\%$). Khả năng sinh lời trong năm tới của các danh mục này lần lượt là $12\\%$, $15\\%$ và $8\\%$. Tính xác suất sinh lời chung của toàn bộ vốn đầu tư.',
                options: [
                    '12.05%',
                    '11.5%',
                    '12.5%',
                    '13%'
                ],
                correctAnswer: 0,
                explanation: 'Gọi $L$ là biến cố sinh lời.\n' +
                    '$P(L) = 0.40 \\cdot 0.12 + 0.35 \\cdot 0.15 + 0.25 \\cdot 0.08$\n' +
                    '$P(L) = 0.048 + 0.0525 + 0.02$\n' +
                    '$P(L) = 0.1205$ hay $12.05\\%$.'
            },
            {
                type: 'tf',
                question: '[Trung bình] Một vùng nông nghiệp trồng 3 giống lúa A, B, C với diện tích lần lượt chiếm 30%, 40%, 30%. Tỷ lệ bị sâu bệnh của giống A là 5%, giống B là 8%, giống C là 4%. Chọn ngẫu nhiên một cây lúa trong vùng.',
                statements: [
                    'Xác suất chọn được cây lúa giống B là 0.4.',
                    'Nếu cây lúa thuộc giống A, xác suất không bị sâu bệnh là 0.95.',
                    'Xác suất cây lúa được chọn bị sâu bệnh là 5.9%.',
                    'Giống C đóng góp nhiều nhất vào tỷ lệ sâu bệnh chung.'
                ],
                correctAnswers: [true, true, true, false],
                explanation: 'Phân tích:\n' +
                    '- a) Đúng theo đề bài.\n' +
                    '- b) Đúng vì $1 - 0.05 = 0.95$.\n' +
                    '- c) $P(\\text{Bệnh}) = 0.3 \\cdot 0.05 + 0.4 \\cdot 0.08 + 0.3 \\cdot 0.04 = 0.015 + 0.032 + 0.012 = 0.059$ ($5.9\\%$) => Đúng.\n' +
                    '- d) Đóng góp của A: $0.015$; B: $0.032$; C: $0.012$. Giống B đóng góp nhiều nhất => Sai.'
            },

            // ============================================================
            // MỨC ĐỘ: KHÓ
            // ============================================================
            {
                type: 'mcq',
                question: '[Khó] Hộp A có 4 bi đỏ, 6 bi trắng. Hộp B có 5 bi đỏ, 5 bi trắng. Lấy ngẫu nhiên 1 viên bi từ hộp A bỏ sang hộp B, sau đó trộn đều và lấy ngẫu nhiên 1 viên bi từ hộp B. Tính xác suất để viên bi lấy ra từ hộp B là bi đỏ.',
                options: [
                    '54/110',
                    '5/11',
                    '1/2',
                    '49/110'
                ],
                correctAnswer: 0,
                explanation: 'Sơ đồ cây quá trình chuyển bi:\n' +
                    '1. **TH1: Chuyển bi Đỏ từ A sang B**\n' +
                    '   - Xác suất chọn Đỏ từ A: $4/10$.\n' +
                    '   - Hộp B lúc này: 6 Đỏ, 5 Trắng (Tổng 11).\n' +
                    '   - Xác suất chọn Đỏ từ B: $6/11$.\n' +
                    '   $\\Rightarrow P_1 = \\frac{4}{10} \\cdot \\frac{6}{11} = \\frac{24}{110}$.\n\n' +
                    '2. **TH2: Chuyển bi Trắng từ A sang B**\n' +
                    '   - Xác suất chọn Trắng từ A: $6/10$.\n' +
                    '   - Hộp B lúc này: 5 Đỏ, 6 Trắng (Tổng 11).\n' +
                    '   - Xác suất chọn Đỏ từ B: $5/11$.\n' +
                    '   $\\Rightarrow P_2 = \\frac{6}{10} \\cdot \\frac{5}{11} = \\frac{30}{110}$.\n\n' +
                    'Tổng xác suất: $P = \\frac{24}{110} + \\frac{30}{110} = \\frac{54}{110} = \\frac{27}{55}$.'
            },
            {
                type: 'mcq',
                question: '[Khó] Hộp A có 8 bi đỏ, 2 bi trắng. Hộp B có 5 bi đỏ, 5 bi trắng. Lấy ngẫu nhiên **2 viên bi** từ Hộp A bỏ sang Hộp B. Sau đó lấy ngẫu nhiên 1 viên bi từ Hộp B. Tính xác suất lấy được bi đỏ ở Hộp B.',
                options: [
                    '11/20',
                    '79/132',
                    '2/3',
                    '5/11'
                ],
                correctAnswer: 0,
                explanation: 'Số bi Hộp B lúc sau là $10 + 2 = 12$ viên. Ta xét các trường hợp lấy 2 bi từ A:\n\n' +
                    '1. **TH1: 2 Đỏ từ A ($C_8^2 / C_{10}^2 = 28/45$)**\n' +
                    '   - Hộp B có: $5+2=7$ Đỏ, 5 Trắng.\n' +
                    '   - $P(D|TH1) = 7/12$.\n' +
                    '2. **TH2: 1 Đỏ, 1 Trắng từ A ($C_8^1 C_2^1 / C_{10}^2 = 16/45$)**\n' +
                    '   - Hộp B có: $5+1=6$ Đỏ, $5+1=6$ Trắng.\n' +
                    '   - $P(D|TH2) = 6/12 = 1/2$.\n' +
                    '3. **TH3: 2 Trắng từ A ($C_2^2 / C_{10}^2 = 1/45$)**\n' +
                    '   - Hộp B có: 5 Đỏ, $5+2=7$ Trắng.\n' +
                    '   - $P(D|TH3) = 5/12$.\n\n' +
                    'Tổng xác suất: $P = \\frac{28}{45}\\frac{7}{12} + \\frac{16}{45}\\frac{6}{12} + \\frac{1}{45}\\frac{5}{12} = \\frac{196 + 96 + 5}{540} = \\frac{297}{540} = \\frac{11}{20}$.'
            },
            {
                type: 'short',
                question: '[Khó] Một người đi làm có thể đi bằng xe máy (xác suất $0.6$) hoặc xe buýt (xác suất $0.4$). Nếu đi xe máy, xác suất bị muộn làm là $0.05$. Nếu đi xe buýt, xác suất bị muộn làm là $0.15$. Tính xác suất người đó bị muộn làm.',
                correctAnswer: '0.09',
                explanation: 'Gọi $M$ là biến cố Muộn.\n' +
                    '$P(M) = P(\\text{Xe máy}) \\cdot P(M|\\text{Xe máy}) + P(\\text{Buýt}) \\cdot P(M|\\text{Buýt})$\n' +
                    '$P(M) = 0.6 \\cdot 0.05 + 0.4 \\cdot 0.15$\n' +
                    '$P(M) = 0.03 + 0.06 = 0.09$.'
            },
            {
                type: 'mcq',
                question: '[Khó] Thị trường chứng khoán có 3 trạng thái: Tăng trưởng (xác suất 0.3), Ổn định (0.5), Suy thoái (0.2). Một cổ phiếu X có xác suất tăng giá trong các trạng thái này lần lượt là 0.8, 0.4, và 0.1. Tính xác suất để cổ phiếu X tăng giá.',
                options: [
                    '0.46',
                    '0.5',
                    '0.4',
                    '0.35'
                ],
                correctAnswer: 0,
                explanation: '$P(\\text{Tăng}) = 0.3 \\cdot 0.8 + 0.5 \\cdot 0.4 + 0.2 \\cdot 0.1$\n' +
                    '$P(\\text{Tăng}) = 0.24 + 0.20 + 0.02 = 0.46$.'
            },
            {
                type: 'short',
                question: '[Khó] Một xạ thủ bắn 3 viên đạn vào bia. Xác suất trúng của viên thứ nhất là $0.6$. Nếu viên trước trúng, tâm lý thoải mái nên xác suất viên sau trúng tăng thêm $0.1$. Nếu viên trước trượt, tâm lý căng thẳng nên xác suất viên sau trúng giảm đi $0.1$. Tính xác suất để viên thứ 3 trúng bia.',
                correctAnswer: '0.6',
                explanation: 'Ta cần tính $P(T_3)$. Sơ đồ cây các trường hợp dẫn đến $T_3$:\n' +
                    '1. $T_1 \\to T_2 \\to T_3$: $0.6 \\cdot 0.7 \\cdot 0.8 = 0.336$\n' +
                    '2. $T_1 \\to \\bar{T_2} \\to T_3$: $0.6 \\cdot 0.3 \\cdot 0.6 = 0.108$ (Sau trượt, $0.7$ giảm còn $0.6$)\n' +
                    '3. $\\bar{T_1} \\to T_2 \\to T_3$: $0.4 \\cdot 0.5 \\cdot 0.6 = 0.12$ (Sau trượt $T_1$, trúng $T_2$ là $0.6-0.1=0.5$. Sau $T_2$ trúng, $T_3$ là $0.5+0.1=0.6$)\n' +
                    '4. $\\bar{T_1} \\to \\bar{T_2} \\to T_3$: $0.4 \\cdot 0.5 \\cdot 0.4 = 0.08$ (Sau $\\bar{T_1}$, $T_2$ là 0.5 $\\to \\bar{T_2}$ là 0.5. Sau $\\bar{T_2}$, $T_3$ giảm còn 0.4)\n\n' +
                    'Tổng: $0.336 + 0.108 + 0.12 + 0.08 = 0.644 \\approx 0.6$.'
            },

            // ============================================================
            // MỨC ĐỘ: RẤT KHÓ
            // ============================================================
            {
                type: 'mcq',
                question: '[Rất khó] Có 3 hộp bi giống hệt nhau. Hộp 1 có 2 đỏ, 1 xanh. Hộp 2 có 1 đỏ, 2 xanh. Hộp 3 có 3 đỏ, 3 xanh. Một người chọn ngẫu nhiên một hộp, sau đó từ hộp đó lấy ra lần lượt 2 viên bi (có hoàn lại). Tính xác suất để cả 2 viên bi lấy ra đều là bi đỏ.',
                options: [
                    '29/108',
                    '1/3',
                    '5/18',
                    '7/27'
                ],
                correctAnswer: 0,
                explanation: 'Sơ đồ cây:\n' +
                    '1. **Chọn Hộp 1 ($1/3$)**:\n' +
                    '   - Xác suất lấy 1 đỏ: $2/3$.\n' +
                    '   - Xác suất lấy 2 đỏ (có hoàn lại): $(2/3)^2 = 4/9$.\n' +
                    '   $\\Rightarrow P_1 = 1/3 \\cdot 4/9 = 4/27$.\n\n' +
                    '2. **Chọn Hộp 2 ($1/3$)**:\n' +
                    '   - Xác suất lấy 1 đỏ: $1/3$.\n' +
                    '   - Xác suất lấy 2 đỏ: $(1/3)^2 = 1/9$.\n' +
                    '   $\\Rightarrow P_2 = 1/3 \\cdot 1/9 = 1/27$.\n\n' +
                    '3. **Chọn Hộp 3 ($1/3$)**:\n' +
                    '   - Xác suất lấy 1 đỏ: $3/6 = 1/2$.\n' +
                    '   - Xác suất lấy 2 đỏ: $(1/2)^2 = 1/4$.\n' +
                    '   $\\Rightarrow P_3 = 1/3 \\cdot 1/4 = 1/12$.\n\n' +
                    'Tổng xác suất: $P = \\frac{4}{27} + \\frac{1}{27} + \\frac{1}{12} = \\frac{29}{108}$.'
            },
            {
                type: 'short',
                question: '[Rất khó] Trong một thị trấn, $40\\%$ số ngày là nắng, $60\\%$ số ngày là mưa. Nếu ngày hôm trước nắng, xác suất ngày hôm sau nắng là $0.7$. Nếu ngày hôm trước mưa, xác suất ngày hôm sau nắng là $0.4$. Giả sử hôm nay là thứ Hai và trời nắng. Tính xác suất để thứ Tư trời cũng nắng.',
                correctAnswer: '0.61',
                explanation: 'Sơ đồ cây qua 2 giai đoạn (Thứ 3 -> Thứ 4):\n' +
                    'Hôm nay (Thứ 2) là Nắng ($N_2$).\n' +
                    '1. **Nhánh 1: Thứ 3 Nắng ($N_3$)**\n' +
                    '   - $P(N_3 | N_2) = 0.7$.\n' +
                    '   - Từ $N_3$, xác suất Thứ 4 Nắng ($N_4$): $P(N_4 | N_3) = 0.7$.\n' +
                    '   $\\Rightarrow P(\\text{Nhánh 1}) = 0.7 \\cdot 0.7 = 0.49$.\n\n' +
                    '2. **Nhánh 2: Thứ 3 Mưa ($M_3$)**\n' +
                    '   - $P(M_3 | N_2) = 1 - 0.7 = 0.3$.\n' +
                    '   - Từ $M_3$, xác suất Thứ 4 Nắng ($N_4$): $P(N_4 | M_3) = 0.4$.\n' +
                    '   $\\Rightarrow P(\\text{Nhánh 2}) = 0.3 \\cdot 0.4 = 0.12$.\n\n' +
                    'Tổng xác suất Thứ 4 Nắng: $P = 0.49 + 0.12 = 0.61$.'
            },
            {
                type: 'short',
                question: '[Rất khó] (Bài toán Bình Polya) Một bình chứa 3 bi đỏ và 2 bi xanh. Lấy ngẫu nhiên 1 viên bi, quan sát màu rồi trả lại bình, đồng thời bỏ thêm vào bình 2 viên bi CÙNG MÀU với viên vừa lấy. Sau đó lấy viên thứ 2. Tính xác suất để viên thứ 2 là bi đỏ.',
                correctAnswer: '0.6',
                explanation: 'Sơ đồ cây:\n' +
                    'Ban đầu: 3 Đỏ, 2 Xanh (Tổng 5).\n' +
                    '1. **TH1: Lần 1 lấy Đỏ ($3/5$)**\n' +
                    '   - Trả lại + thêm 2 Đỏ => Bình có: 5 Đỏ, 2 Xanh (Tổng 7).\n' +
                    '   - Xác suất lần 2 lấy Đỏ: $5/7$.\n' +
                    '   $\\Rightarrow P_1 = 3/5 \\cdot 5/7 = 3/7$.\n\n' +
                    '2. **TH2: Lần 1 lấy Xanh ($2/5$)**\n' +
                    '   - Trả lại + thêm 2 Xanh => Bình có: 3 Đỏ, 4 Xanh (Tổng 7).\n' +
                    '   - Xác suất lần 2 lấy Đỏ: $3/7$.\n' +
                    '   $\\Rightarrow P_2 = 2/5 \\cdot 3/7 = 6/35$.\n\n' +
                    'Tổng xác suất: $P = 3/7 + 6/35 = 15/35 + 6/35 = 21/35 = 3/5 = 0.6$.'
            },
            {
                type: 'mcq',
                question: '[Rất khó] Có 10 chiếc lọ. Lọ 1 chứa 1 bi trắng, 9 bi đen. Lọ 2 chứa 2 bi trắng, 8 bi đen. ... Lọ k chứa k bi trắng, (10-k) bi đen. ... Lọ 10 chứa 10 bi trắng. Chọn ngẫu nhiên một lọ, rồi lấy ngẫu nhiên ra 1 viên bi. Tính xác suất lấy được bi trắng.',
                options: [
                    '0.5',
                    '0.55',
                    '0.45',
                    '11/20'
                ],
                correctAnswer: 1,
                explanation: 'Gọi $H_k$ là biến cố chọn được Lọ k ($k=1..10$). $P(H_k) = 1/10$.\n' +
                    'Xác suất lấy bi trắng từ Lọ k là: $P(T|H_k) = \\frac{k}{10}$.\n' +
                    'Áp dụng công thức:\n' +
                    '$P(T) = \\sum_{k=1}^{10} P(H_k) \\cdot P(T|H_k) = \\sum_{k=1}^{10} \\frac{1}{10} \\cdot \\frac{k}{10}$\n' +
                    '$P(T) = \\frac{1}{100} (1 + 2 + ... + 10)$\n' +
                    '$P(T) = \\frac{1}{100} \\cdot \\frac{10(11)}{2} = \\frac{55}{100} = 0.55$.'
            },
            {
                type: 'short',
                question: '[Rất khó] (Bài toán gien) Một quần thể thực vật có tỉ lệ kiểu gen: $20\\% AA$, $50\\% Aa$, $30\\% aa$. Nếu cơ thể mẹ có kiểu gen $AA$, xác suất hạt phấn thụ phấn thành công là $0.9$. Nếu mẹ là $Aa$, xác suất là $0.7$. Nếu mẹ là $aa$, xác suất là $0.4$. Chọn ngẫu nhiên một cây mẹ và thực hiện thụ phấn. Tính xác suất thụ phấn thành công.',
                correctAnswer: '0.65',
                explanation: 'Gọi $S$ là thành công.\n' +
                    '$P(S) = 0.2 \\cdot 0.9 + 0.5 \\cdot 0.7 + 0.3 \\cdot 0.4$\n' +
                    '$P(S) = 0.18 + 0.35 + 0.12 = 0.65$.'
            }
        ]
    }
};