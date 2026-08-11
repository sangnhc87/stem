#!/usr/bin/env python3
# -*- coding: utf-8 -*-

with open('bo-logic-don-2.txt', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Câu 86: Lines 1273-1277 (index từ 0 nên -1)
lines[1272] = "    - (A)  Đỏ\n"
lines[1273] = "    - (B) [x] Trắng\n"
lines[1274] = "    - (C)  Xanh\n"
lines[1275] = "    - (D)  Vàng\n"
lines[1276] = "    - (E)  Đen\n"

# Câu 88: Lines 1307-1311  
lines[1306] = "    - (A)  Đỏ\n"
lines[1307] = "    - (B)  Trắng\n"
lines[1308] = "    - (C) [x] Xanh\n"
lines[1309] = "    - (D)  Vàng\n"
lines[1310] = "    - (E)  Đen\n"

# Câu 89: Lines 1324-1328
lines[1323] = "    - (A)  Đỏ\n"
lines[1324] = "    - (B)  Trắng\n"
lines[1325] = "    - (C)  Xanh\n"
lines[1326] = "    - (D)  Vàng\n"
lines[1327] = "    - (E) [x] Đen\n"

# Ghi lại file
with open('bo-logic-don-2.txt', 'w', encoding='utf-8') as f:
    f.writelines(lines)

print("=== HOÀN TẤT SỬA LỖI ===")
print("✓ Câu 86: Đáp án (B) Trắng")
print("✓ Câu 88: Đáp án (C) Xanh")  
print("✓ Câu 89: Đáp án (E) Đen")
