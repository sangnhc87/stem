import { bai1_dang1 } from './bai1_dang1';
import { bai1_dang2 } from './bai1_dang2';
import { bai2_dang1 } from './bai2_dang1';
import { bai3_dang1 } from './bai3_dang1';
import { bai3_dang2 } from './bai3_dang2';
import { bai4_dang1 } from './bai4_dang1';
import { bai4_dang2 } from './bai4_dang2';

export const c_xac_suat = {
    id: "c_xac_suat",
    title: "Chương: Nguyên lý đếm và Xác suất",
    lessons: [
        {
            id: "l1",
            title: "Bài 1: Các quy tắc đếm",
            topics: [
                bai1_dang1,
                bai1_dang2
            ]
        },
        {
            id: "l2",
            title: "Bài 2: Xác suất của biến cố",
            topics: [
                bai2_dang1
            ]
        },
        {
            id: "l3",
            title: "Bài 3: Xác suất có điều kiện",
            topics: [
                bai3_dang1,
                bai3_dang2
            ]
        },
        {
            id: "l4",
            title: "Bài 4: Công thức xác suất toàn phần và Công thức Bayes",
            topics: [
                bai4_dang1,
                bai4_dang2
            ]
        }
    ]
};
