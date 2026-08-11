#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Sắp xếp lại câu hỏi: xen kẽ đa dạng các chủ đề thay vì gom thành cụm lớn.
Mỗi 4-5 câu cũ sẽ xen 1 câu mới (vui/đa dạng) để tránh nhàm chán.
"""

import re

with open('bo-logic-don-2.txt', 'r', encoding='utf-8') as f:
    content = f.read()

# ─── Tách từng khối câu hỏi ───
# Mỗi câu bắt đầu bằng "N. " ở đầu dòng, kết thúc bằng "    ---"
lines = content.split('\n')

questions = []      # list of (original_number, full_text)
current_block = []
current_num = None

for line in lines:
    m = re.match(r'^(\d+)\. ', line)
    if m:
        # Lưu câu trước (nếu có)
        if current_num is not None:
            questions.append((current_num, '\n'.join(current_block)))
        current_num = int(m.group(1))
        current_block = [line]
    elif current_num is not None:
        current_block.append(line)
        if line.strip() == '---':
            # Kết thúc câu này
            questions.append((current_num, '\n'.join(current_block)))
            current_num = None
            current_block = []
    # Bỏ qua header/cluster lines (không thuộc câu nào)

print(f"Tổng số câu tìm được: {len(questions)}")

# ─── Phân loại câu theo chủ đề ───
# Theo số câu ban đầu:
# 1–34:   Ngày trong tuần (thứ)
# 35–67:  Nghề nghiệp / phân công
# 68–94:  Màu mũ nghệ sĩ
# 95–105: Vòng tròn 6 người
# 106–125: Logic vui đa dạng (mới thêm)

group_thu  = [(n,t) for n,t in questions if 1  <= n <= 34]   # 34 câu
group_nghe = [(n,t) for n,t in questions if 35 <= n <= 67]   # 33 câu
group_mu   = [(n,t) for n,t in questions if 68 <= n <= 94]   # 27 câu
group_vong = [(n,t) for n,t in questions if 95 <= n <= 105]  # 11 câu
group_vui  = [(n,t) for n,t in questions if 106 <= n <= 125] # 20 câu

print(f"Ngày/thứ: {len(group_thu)}, Nghề nghiệp: {len(group_nghe)}, "
      f"Màu mũ: {len(group_mu)}, Vòng tròn: {len(group_vong)}, Vui: {len(group_vui)}")

# ─── Xây dựng thứ tự xen kẽ ───
# Chiến lược: luân phiên 4 nhóm gốc, sau mỗi 4-5 câu gốc xen 1 câu vui.
# Thứ tự vòng: thu, nghe, mu, vong → rồi lặp lại
# Sau mỗi 4 câu từ vòng xoay: chen 1 câu vui

# Tạo danh sách xen kẽ từ 4 nhóm gốc theo kiểu "round robin"
from itertools import zip_longest

def interleave_groups(groups):
    """Xen kẽ theo round-robin: lấy 1 từ mỗi nhóm lần lượt."""
    result = []
    iters = [iter(g) for g in groups]
    while True:
        added = False
        for it in iters:
            item = next(it, None)
            if item is not None:
                result.append(item)
                added = True
        if not added:
            break
    return result

# Xen kẽ 4 nhóm gốc theo round-robin (1 từ mỗi nhóm)
base_order = interleave_groups([group_thu, group_nghe, group_mu, group_vong])
print(f"Sau round-robin 4 nhóm gốc: {len(base_order)} câu")

# Giờ xen câu vui: cứ sau mỗi 5 câu gốc, chèn 1 câu vui
final_order = []
vui_iter = iter(group_vui)
for i, q in enumerate(base_order):
    final_order.append(q)
    # Sau mỗi 5 câu, chèn 1 câu vui (nếu còn)
    if (i + 1) % 5 == 0:
        vui_q = next(vui_iter, None)
        if vui_q:
            final_order.append(vui_q)

# Thêm các câu vui còn lại vào cuối (nếu có)
for vui_q in vui_iter:
    final_order.append(vui_q)

print(f"Tổng câu sau sắp xếp: {len(final_order)}")

# ─── Đánh số lại và viết file ───
header = "# TIÊU ĐỀ: Bộ Logic - Câu Đơn 2\n"

output_lines = [header, ""]

for new_num, (orig_num, block_text) in enumerate(final_order, start=1):
    # Thay số câu cũ bằng số mới
    new_block = re.sub(r'^\d+\.', f'{new_num}.', block_text, count=1)
    output_lines.append(new_block)
    output_lines.append("")  # dòng trống giữa các câu

result = '\n'.join(output_lines)

with open('bo-logic-don-2.txt', 'w', encoding='utf-8') as f:
    f.write(result)

print("✅ Đã ghi file xong!")
print("\nMẫu 15 câu đầu (số gốc → số mới):")
for new_num, (orig_num, _) in enumerate(final_order[:15], start=1):
    tag = "🎉VUI" if orig_num >= 106 else f"gốc-{orig_num}"
    print(f"  Câu {new_num:3d} ← {tag}")
