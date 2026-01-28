# Math Platform - Tài liệu Phát triển

Hệ thống học toán THPT (Lớp 10, 11, 12) xây dựng trên nền tảng Vite + React.

## 1. Cấu trúc Dự án

Dự án được tổ chức theo cấu trúc module hóa, tập trung vào dữ liệu nội dung học tập trong thư mục `src/data`.

```
src/
├── components/     # Các thành phần UI tái sử dụng (Button, Input, MathRenderer...)
├── data/           # KHO DỮ LIỆU NỘI DUNG (Quan trọng nhất)
│   ├── grade10/    # Nội dung lớp 10
│   ├── grade11/    # Nội dung lớp 11
│   ├── grade12/    # Nội dung lớp 12
│   │   ├── xac_suat/       # Ví dụ: Module bài học đã tách nhỏ
│   │   │   ├── bai1_dang1.js
│   │   │   ├── index.js    # Tập hợp các file con
│   │   └── index.js        # Export chung cho khối 12
│   └── curriculum.js       # File gốc định nghĩa chương trình học
├── pages/          # Các trang màn hình (LessonView, Home...)
└── utils/          # Các hàm tiện ích
```

## 2. Hướng dẫn Thêm/Sửa Nội dung

Để cộng tác và mở rộng nội dung, bạn cần hiểu cách tổ chức dữ liệu.

### Quy trình thêm bài mới:
1.  **Tạo file dữ liệu**: Trong thư mục khối lớp tương ứng (ví dụ `src/data/grade12/`), tạo thư mục hoặc file mới cho bài học.
    *   *Khuyên dùng*: Tách nhỏ theo cấu trúc `baiX_dangY.js` để dễ quản lý.
2.  **Khai báo cấu trúc**: Export một object chứa nội dung bài học (xem mẫu bên dưới).
3.  **Đăng ký vào Index**: Import file vừa tạo vào `index.js` của thư mục đó và thêm vào mảng `topics` hoặc `lessons`.

### Cấu trúc Dữ liệu (Schema)

Mỗi file nội dung (ví dụ `bai1_dang1.js`) thường export một đối tượng **Topic** hoặc **Lesson**.

**Mẫu một Topic (Dạng bài):**

```javascript
export const bai1_dang1 = {
    id: "t1", // ID duy nhất trong bài
    title: "Dạng 1: Tên dạng bài",
    content: {
        theory: [ // Mảng lý thuyết
            {
                type: 'definition', // Loại: definition, theorem, note, example
                title: 'Tiêu đề lý thuyết',
                text: 'Nội dung... có thể dùng LaTeX $x^2$'
            }
        ],
        exercises: [ // Mảng bài tập
            // ... các object bài tập (xem mục 3)
        ]
    }
};
```

## 3. Các Loại Câu hỏi (Question Types)

Hệ thống hỗ trợ các loại câu hỏi sau. Lưu ý: `explanation` hỗ trợ xuống dòng `\n` và LaTeX.

### 3.1. Trắc nghiệm (Multiple Choice - `mcq`)

```javascript
{
    type: 'mcq',
    question: '[Mức độ] Câu hỏi... $f(x)$',
    options: [
        'Đáp án A',
        'Đáp án B',
        'Đáp án C',
        'Đáp án D'
    ],
    correctAnswer: 0, // Index của đáp án đúng (0 là A, 1 là B...)
    explanation: 'Lời giải chi tiết...'
}
```

### 3.2. Điền đáp án ngắn (Short Answer - `short`)

```javascript
{
    type: 'short',
    question: 'Tính giá trị của biểu thức...',
    correctAnswer: '0.5', // Chuỗi đáp án đúng để so sánh
    explanation: 'Lời giải...'
}
```

### 3.3. Đúng/Sai (True/False - `tf`)

Dạng bài gồm một câu dẫn và 4 mệnh đề con.

```javascript
{
    type: 'tf',
    question: 'Cho hàm số $y=f(x)$. Xét tính đúng sai:',
    statements: [
        'Hàm số đồng biến trên R.',
        'Giá trị cực đại là 5.',
        'Đồ thị đi qua A(1, 2).',
        'Phương trình f(x)=0 vô nghiệm.'
    ],
    correctAnswers: [true, false, true, true], // Mảng boolean tương ứng
    explanation: 'a) Đúng vì... \nb) Sai vì... \nc) Đúng... \nd) Đúng...'
}
```

## 4. Định dạng Toán học (LaTeX)

*   Sử dụng thư viện **KaTeX**.
*   Kẹp công thức toán học giữa cặp dấu `$`:
    *   Ví dụ: `$x^2 + 2x + 1 = 0$`
    *   Phân số: `$\frac{a}{b}$`
    *   Căn bậc hai: `$\sqrt{x}$`
    *   Tích phân: `$\int_{0}^{1} f(x) dx$`
*   **Lưu ý**: Trong chuỗi JavaScript, cần escape dấu backslash `\` bằng cách gõ `\\`.
    *   Sai: `$\frac{1}{2}$`
    *   Đúng: `$\\frac{1}{2}$`

## 5. Mức độ bài tập

Để giúp người học dễ dàng lựa chọn, hãy gắn thẻ mức độ vào đầu câu hỏi:
*   `[Dễ]`
*   `[Trung bình]`
*   `[Khó]`
*   `[Rất khó]`

## 6. Cài đặt & Chạy dự án

1.  Cài đặt thư viện: `npm install`
2.  Chạy server dev: `npm run dev`
3.  Build production: `npm run build`

---
*Tài liệu này dùng để hướng dẫn cộng tác viên phát triển nội dung.*
