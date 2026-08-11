#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script xóa các dấu ngoặc đơn/kép (...), [x], hoặc các từ giải thích thừa trong phương án trả lời
gây lộ đáp án đúng trong toàn bộ các file JSON (data/ và public/data/).
"""
import glob
import json
import os
import re

def clean_question_data(directory):
    files = sorted(glob.glob(os.path.join(directory, "*.json")))
    total_cleaned = 0
    file_summary = []

    for fpath in files:
        with open(fpath, "r", encoding="utf-8") as f:
            data = json.load(f)

        file_cleaned = 0

        for item in data:
            answers = item.get("answers", [])
            if not isinstance(answers, list) or not answers:
                continue

            # Kiểm tra xem ngoặc đơn có phải chỉ xuất hiện bất đối xứng ở một số phương án không
            parens_count = sum(1 for a in answers if re.search(r"\([^)]*\)", str(a.get("text"))))

            # Nếu ngoặc xuất hiện bất đối xứng (ví dụ chỉ 1 hoặc 2 đáp án có ngoặc giải thích thêm)
            if 0 < parens_count < len(answers):
                for ans in answers:
                    orig_text = str(ans.get("text", ""))
                    # Xóa ngoặc đơn và nội dung bên trong ngoặc
                    cleaned_text = re.sub(r"\s*\([^)]*\)", "", orig_text).strip()
                    # Làm sạch khoảng trắng thừa
                    cleaned_text = re.sub(r"\s+", " ", cleaned_text)

                    if orig_text != cleaned_text:
                        ans["text"] = cleaned_text
                        file_cleaned += 1

            # Làm sạch thêm các ký tự thừa như [x], *, (Đúng) nếu có ở bất kỳ đáp án nào
            for ans in answers:
                orig_text = str(ans.get("text", ""))
                cleaned = re.sub(r"\[x\]|\*|\(Đúng\)|\(Correct\)", "", orig_text, flags=re.IGNORECASE).strip()
                cleaned = re.sub(r"\s+", " ", cleaned)
                if orig_text != cleaned:
                    ans["text"] = cleaned
                    file_cleaned += 1

        if file_cleaned > 0:
            with open(fpath, "w", encoding="utf-8") as f:
                json.dump(data, f, ensure_ascii=False, indent=2)

        total_cleaned += file_cleaned
        file_summary.append((os.path.basename(fpath), file_cleaned))

    return total_cleaned, file_summary

if __name__ == "__main__":
    print("=== ĐANG XÓA CÁC DẤU HIỆU LỘ ĐÁP ÁN (...) TRONG THƯ MỤC DATA/ ===")
    count_data, sum_data = clean_question_data("data")
    for fname, count in sum_data:
        if count > 0:
            print(f"  - File {fname:<25}: đã làm sạch {count} phương án")
    print(f"Tổng số phương án đã làm sạch trong data/: {count_data}")

    print("\n=== ĐANG XÓA CÁC DẤU HIỆU LỘ ĐÁP ÁN (...) TRONG THƯ MỤC PUBLIC/DATA/ ===")
    count_pub, sum_pub = clean_question_data("public/data")
    for fname, count in sum_pub:
        if count > 0:
            print(f"  - File {fname:<25}: đã làm sạch {count} phương án")
    print(f"Tổng số phương án đã làm sạch trong public/data/: {count_pub}")

    print("\n=== HOÀN TẤT XÓA DẤU HIỆU ĐÁP ÁN ===")
