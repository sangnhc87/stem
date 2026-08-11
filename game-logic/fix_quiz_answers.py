#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script xáo trộn vị trí đáp án (A, B, C, D) cho toàn bộ các file câu hỏi JSON trong data/ và public/data/
để tránh việc đáp án đúng luôn cố định nằm ở vị trí A (Option 1).
"""
import glob
import json
import os
import random

# Thiết lập seed để việc xáo trộn có tính ngẫu nhiên nhưng ổn định khi chạy lại nếu cần
random.seed(2026)

def shuffle_json_files(directory):
    files = sorted(glob.glob(os.path.join(directory, "*.json")))
    summary = []
    
    for fpath in files:
        with open(fpath, "r", encoding="utf-8") as f:
            data = json.load(f)
            
        total = len(data)
        pos_dist = {0: 0, 1: 0, 2: 0, 3: 0}
        
        for item in data:
            answers = item.get("answers", [])
            if isinstance(answers, list) and len(answers) > 1:
                random.shuffle(answers)
                
            for idx, ans in enumerate(answers):
                if ans.get("correct") is True:
                    pos_dist[idx] = pos_dist.get(idx, 0) + 1
                    
        with open(fpath, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
            
        summary.append((os.path.basename(fpath), total, pos_dist))
        
    return summary

if __name__ == "__main__":
    print("=== ĐANG XÁO TRỘN ĐÁP ÁN TRONG THƯ MỤC DATA/ ===")
    sum_data = shuffle_json_files("data")
    for fname, total, pos in sum_data:
        print(f"File: {fname:<25} | Tổng số câu: {total:<3} | Phân bố đáp án đúng (A: {pos[0]}, B: {pos[1]}, C: {pos[2]}, D: {pos[3]})")
        
    print("\n=== ĐANG XÁO TRỘN ĐÁP ÁN TRONG THƯ MỤC PUBLIC/DATA/ ===")
    sum_public = shuffle_json_files("public/data")
    for fname, total, pos in sum_public:
        print(f"File: {fname:<25} | Tổng số câu: {total:<3} | Phân bố đáp án đúng (A: {pos[0]}, B: {pos[1]}, C: {pos[2]}, D: {pos[3]})")
        
    print("\n=== HOÀN TẤT XÁO TRỘN ĐÁP ÁN ===")
