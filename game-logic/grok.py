#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Gemini OCR 11.0 – Giao diện được thiết kế lại
Cải tiến:
  - Giao diện chính 2 cột (PanedWindow):
    + Trái: Điều khiển (Chụp, Mở file), Xem trước ảnh, Cấu hình nhanh (Model, Prompt).
    + Phải: Kết quả OCR và các nút phụ (Copy, History, Settings).
  - Cửa sổ Cài đặt được làm mới:
    + Tab API có checkbox "Hiện Key" và nút "Kiểm tra kết nối".
    + Khung nút bấm "Lưu & Đóng" và "Hủy" cố định ở dưới cùng, rõ ràng.
  - Cải thiện luồng công việc, trực quan và hiện đại hơn.
"""
from __future__ import annotations
import os, json, time, tempfile, subprocess, base64, io, threading, pathlib, requests, uuid, datetime
import tkinter as tk
from tkinter import ttk, filedialog, messagebox
import darkdetect, sv_ttk
from PIL import Image, ImageTk
import google.generativeai as genai
from pynput import keyboard
# ---------- CONFIG / HISTORY ----------
CFG_FILE     = pathlib.Path.home() / ".gemini_ocr_v11.json"
HISTORY_FILE = pathlib.Path.home() / ".gemini_ocr_history.json"
DEVICE_FILE  = pathlib.Path.home() / ".gemini_device_id"

def load_cfg():
    default = {
        "api_key": "",
        "gmail": "",
        "model": "gemini-2.5-flash",
        "models": ["gemini-2.5-flash", "gemini-2.5-pro"],
        "prompts": {
            "textLatex": "Bạn là một công cụ OCR chuyên nghiệp. Hãy trích xuất toàn bộ văn bản và nội dung toán học từ hình ảnh này. Biểu diễn tất cả các công thức, biểu thức, phương trình, bất phương trình, hệ tọa độ (như Oxyz, Oxy, O), điểm (như A(1;0;1), B, C), vector (như vector AB, vec{u}), biến số (như x, y, z, m, n), và số (như 1, 10, 3.14) thuộc ngữ cảnh toán học bằng chế độ toán LaTeX rõ ràng ($...$ cho nội dòng, \\[ ... \\] hoặc $$ ... $$ cho hiển thị riêng dòng phù hợp). Đảm bảo khoảng cách đúng bên ngoài chế độ toán. Chỉ trả về văn bản và code LaTeX đã trích xuất, KHÔNG bao gồm bất kỳ lời mở đầu hoặc kết luận nào. kO TỰ Ý THÊM CÁC DÂU * HAY **.",
            "choice": "Xác định MỖI câu hỏi trắc nghiệm riêng biệt từ hình ảnh. Đối với MỖI câu hỏi đã xác định, trích xuất nội dung câu hỏi, danh sách các lựa chọn và lời giải. Định dạng MỖI câu hỏi thành một khối LaTeX riêng biệt như sau:\n\n```latex\n\\begin{ex}\n [Nội dung câu hỏi, bao gồm số câu nếu có]\n \\choice\n { Nội dung lựa chọn 1 }\n { Nội dung lựa chọn 2 }\n { Nội dung lựa chọn 3 }\n { Nội dung lựa chọn 4 }\n (chú ý chỉ có duy nhất 1 \\choice và theo sau là 4 cụm ngoặc) \\loigiai{\n [Nội dung lời giải]\n }\n\\end{ex}\n```\n\nXác định lựa chọn đúng cho MỖI câu hỏi và thêm macro \\\\True trước `{ Nội dung lựa chọn }` của nó. Đảm bảo toán luôn để trong $..$ và toạ độ điểm, vectơ nền dùng \\left(...\\right), TẤT CẢ nội dung toán học (công thức, biểu thức, phương trình, bất phương trình, hệ tọa độ, điểm, vector, biến số, số, đơn vị như km, m/s, v.v.) trong câu hỏi, các lựa chọn hoặc lời giải của MỖI khối được định dạng chính xác trong chế độ toán LaTeX ($...$ hoặc \\[...\\] phù hợp). Sử dụng \\\\ ở cuối mỗi dòng để xuống dòng trong lời giải.\nChỉ trả về CÁC khối LaTeX đã định dạng, KHÔNG bao gồm bất kỳ lời mở đầu hoặc kết luận nào hoặc markdown bên ngoài các khối. Chú ý chỉ lấy các nội dụng chụp và chuyển ko ghi các suy nghĩ, diễn giải thêm",
            "choiceTF": "Xác định MỖI câu hỏi trắc nghiệm Đúng/Sai (tập hợp các mệnh đề) riêng biệt từ hình ảnh. Đối với MỖI tập hợp mệnh đề đã xác định, trích xuất nội dung câu hỏi/hướng dẫn chính (nếu có, bao gồm số câu nếu có), danh sách các mệnh đề và lời giải. Định dạng MỖI tập hợp thành một khối LaTeX riêng biệt như sau:\n\n```latex\n\\begin{ex}\n [Nội dung câu hỏi/hướng dẫn]\n \\choiceTF\n { Nội dung mệnh đề 1 }\n { Nội dung mệnh đề 2 }\n { Nội dung mệnh đề 3 }\n { Nội dung mệnh đề 4 }\n \\loigiai{\n [Nội dung lời giải]\n }\n\\end{ex}\n```\n\nXác định mệnh đề nào là Đúng cho MỖI tập hợp và thêm macro \\\\True trước `{ Nội dung mệnh đề }` của nó. Đảm bảo toán luôn để trong $..$ và toạ độ điểm, vectơ nền dùng \\left(...\\right), TẤT CẢ nội dung toán học (công thức, biểu thức, phương trình, bất phương trình, hệ tọa độ, điểm, vector, biến số, số, đơn vị như km, m/s, v.v.) trong câu hỏi/hướng dẫn, các mệnh đề hoặc lời giải của MỖI khối được định dạng chính xác trong chế độ toán LaTeX ($...$ hoặc \\[...\\] phù hợp). Sử dụng \\\\ ở cuối mỗi dòng để xuống dòng trong lời giải.\nChỉ trả về CÁC khối LaTeX đã định dạng, KHÔNG bao gồm bất kỳ lời mở đầu hoặc kết luận nào hoặc markdown bên ngoài các khối.",
            "shortAns": "Xác định MỖI câu hỏi trả lời ngắn riêng biệt từ hình ảnh. Đối với MỖI câu hỏi đã xác định, trích xuất nội dung câu hỏi (bao gồm số câu nếu có), câu trả lời ngắn và lời giải. Định dạng MỖI câu hỏi thành một khối LaTeX riêng biệt như sau:\n\n```latex\n\\begin{ex}\n [Nội dung câu hỏi]\n \\shortans{ [Nội dung trả lời ngắn] }\n \\loigiai{\n [Nội dung lời giải]\n }\n\\end{ex}\n```\n\nĐảm bảo TẤT CẢ nội dung toán học (công thức, biểu thức, phương trình, bất phương trình, hệ tọa độ, điểm, vector, biến số, số, đơn vị như km, m/s, v.v.) trong câu hỏi, câu trả lời hoặc lời giải của MỖI khối được định dạng chính xác trong chế độ toán LaTeX ($...$ hoặc \\[...\\] phù hợp), toán luôn để trong $..$ và toạ độ điểm, vectơ nền dùng \\left(...\\right). Sử dụng \\\\ ở cuối mỗi dòng để xuống dòng trong lời giải.\nChỉ trả về CÁC khối LaTeX đã định dạng, KHÔNG bao gồm bất kỳ lời mở đầu hoặc kết luận nào hoặc markdown bên ngoài các khối.",
            "tikzShapes": "Phân tích hình ảnh để tìm các hình học cơ bản (đường thẳng, đường tròn, hình chữ nhật, hình tam giác, điểm) và bất kỳ nhãn văn bản liên quan nào. Xác định vị trí tương đối và thuộc tính của chúng. Tạo code TikZ tương ứng để vẽ lại các hình dạng và nhãn này. Chỉ cung cấp code TikZ nằm trong môi trường \\begin{tikzpicture} ... \\end{tikzpicture}. KHÔNG bao gồm bất kỳ văn bản giải thích hoặc markdown nào bên ngoài môi trường TikZ. Đảm bảo bất kỳ nhãn, điểm (như A, B, C), tọa độ (như (1,2)) hoặc biểu thức toán học bao gồm số và đơn vị trong code TikZ được định dạng chính xác trong chế độ toán LaTeX ($...$).",
            "latexTabular": "Phân tích hình ảnh để tìm dữ liệu dạng bảng. Xác định cấu trúc bảng (hàng, cột, nội dung ô) và định dạng cơ bản (như đường kẻ ngang). Tạo code môi trường \\tabular tương ứng trong LaTeX để tạo lại bảng này chính xác như nó hiển thị, bao gồm nội dung ô và căn chỉnh cơ bản. Chỉ cung cấp code môi trường LaTeX \\begin{tabular} ... \\end{tabular}. KHÔNG bao gồm bất kỳ văn bản giải thích hoặc markdown nào bên ngoài môi trường tabular. Đảm bảo bất kỳ biểu thức toán học, biến số (như x, y, z), điểm, số, hoặc đơn vị nào trong các ô được định dạng chính xác trong chế độ toán LaTeX ($...$).",
            "solveMath": "Bạn là một chuyên gia giải toán xuất sắc và có khả năng tạo mã LaTeX chính xác. Hãy xem hình ảnh của một bài toán. Phân tích kỹ đề bài, trình bày các bước giải chi tiết, rõ ràng, logic như một giáo viên. Sử dụng TẤT CẢ các công thức, biểu thức, phương trình, bất phương trình, hệ tọa độ, điểm, vector, biến số, số, đơn vị, v.v. trong suốt lời giải chi tiết chỉ bằng chế độ toán LaTeX NỘI DÒNG ($...$) hoặc HIỂN THỊ RIÊNG DÒNG ($$...$$) hoặc canh dấu = với \\\\begin{eqarray*}....\\\\end{eqarray*}. TUYỆT ĐỐI KHÔNG sử dụng \\\\[...\\\\] hoặc \\\\begin{equation} ... \\\\end{equation}. Trình bày toàn bộ lời giải chi tiết này trong môi trường \\loigiai{\n ... \n} trong LaTeX. Chỉ trả về nội dung bên trong môi trường \\loigiai{}, KHÔNG bao gồm bất kỳ văn bản giải thích hoặc markdown nào bên ngoài nó.",
            "drawTikzFromText": "Bạn là một chuyên gia tạo mã TikZ từ mô tả văn bản. Hãy đọc mô tả văn bản sau và tạo mã TikZ chính xác để vẽ hình được mô tả. Đảm bảo các điểm, đường thẳng, đường tròn, góc, nhãn và các yếu tố hình học khác được biểu diễn chính xác theo mô tả. Chỉ cung cấp mã TikZ nằm trong môi trường \\begin{tikzpicture} ... \\end{tikzpicture}. KHÔNG bao gồm bất kỳ văn bản giải thích hoặc markdown nào bên ngoài môi trường TikZ. Đảm bảo bất kỳ nhãn, điểm (như A, B, C), tọa độ (như (1,2)) hoặc biểu thức toán học bao gồm số và đơn vị trong code TikZ được định dạng chính xác trong chế độ toán LaTeX (sử dụng $...$)."
        }
    }
    if CFG_FILE.exists():
        loaded = json.loads(CFG_FILE.read_text())
        if "prompts" in loaded and isinstance(loaded["prompts"], list):
            old_prompts = loaded["prompts"]
            loaded["prompts"] = {f"Prompt {i+1}": p for i, p in enumerate(old_prompts)}
        return loaded
    return default

def save_cfg(cfg: dict):
    CFG_FILE.write_text(json.dumps(cfg, indent=2, ensure_ascii=False))

def get_device_id() -> str:
    if DEVICE_FILE.exists():
        return DEVICE_FILE.read_text().strip()
    device_id = str(uuid.uuid4())
    DEVICE_FILE.write_text(device_id)
    return device_id

def load_history() -> list:
    return json.loads(HISTORY_FILE.read_text()) if HISTORY_FILE.exists() else []

def save_history(entry: dict):
    history = load_history()
    history.insert(0, entry) # Thêm vào đầu danh sách
    HISTORY_FILE.write_text(json.dumps(history, indent=2, ensure_ascii=False))

cfg = load_cfg()
if cfg.get("api_key"):
    try:
        genai.configure(api_key=cfg["api_key"])
    except Exception as e:
        print(f"Lỗi cấu hình API Key ban đầu: {e}")

# ---------- SNIP ----------
def grab_snip() -> str | None:
    tmp = tempfile.mktemp(suffix=".png")
    try:
        subprocess.run(["screencapture", "-i", "-x", "-r", tmp], check=True)
    except subprocess.CalledProcessError:
        return None
    if not os.path.exists(tmp) or os.stat(tmp).st_size == 0:
        return None
    with open(tmp, "rb") as f:
        b64 = base64.b64encode(f.read()).decode()
    os.remove(tmp)
    return b64

# ---------- OCR ----------
def gemini_ocr(b64_img: str, prompt: str, model_name: str) -> str:
    img_data = base64.b64decode(b64_img)
    img = Image.open(io.BytesIO(img_data))
    model = genai.GenerativeModel(model_name)
    response = model.generate_content([prompt, img])
    if not response.parts:
        raise RuntimeError("Không nhận dạng được nội dung. Phản hồi API trống.")
    return response.text.strip()

# ---------- GUI ----------
class App(tk.Tk):
    def __init__(self):
        super().__init__()
        self.title("Gemini OCR 11.0 – Giao diện mới")
        self.geometry("1200x750")
        self.resizable(True, True)
        sv_ttk.set_theme("dark" if darkdetect.isDark() else "light")
        self.cfg = cfg
        self.device_id = get_device_id()
        self.preview_photo = None # Để lưu trữ tham chiếu đến ảnh preview
        self._style_ttk()
        self._build_ui()
        keyboard.GlobalHotKeys({"<ctrl>+<shift>+g": self.snip}).start()
        if not self.cfg.get("api_key"):
            self.after(300, self.open_settings)

    def _style_ttk(self):
        style = ttk.Style()
        style.configure("Modern.TButton", padding=8, font=("SF Pro", 10))
        style.configure("Card.TFrame", relief="solid", borderwidth=1)
        style.configure("Modern.TCombobox", font=("SF Pro", 11))
        style.configure("Modern.Treeview", font=("SF Mono", 10), rowheight=25)
        style.configure("Modern.TNotebook", tabmargins=[2, 5, 2, 0])
        style.configure("Modern.TNotebook.Tab", padding=[10, 8])
        style.configure("Title.TLabel", font=("SF Pro", 12, "bold"))

    # ---------------------- UI CHÍNH (THIẾT KẾ LẠI) ----------------------
    def _build_ui(self):
        main_pane = ttk.PanedWindow(self, orient=tk.HORIZONTAL)
        main_pane.pack(fill="both", expand=True, padx=10, pady=10)

        # ---------------------- CỘT TRÁI: ĐIỀU KHIỂN & PREVIEW ----------------------
        left_frame = ttk.Frame(main_pane, padding=10)
        main_pane.add(left_frame, weight=1)

        # --- Hành động ---
        action_frame = ttk.LabelFrame(left_frame, text="Hành động", padding=15)
        action_frame.pack(fill="x", pady=(0, 15))
        ttk.Button(action_frame, text="📷 Chụp ảnh (Ctrl+Shift+G)", command=self.snip, style="Modern.TButton").pack(fill="x", pady=3)
        ttk.Button(action_frame, text="📁 Mở File Ảnh", command=self.open_file, style="Modern.TButton").pack(fill="x", pady=3)
        
        # --- Cấu hình nhanh ---
        config_frame = ttk.LabelFrame(left_frame, text="Cấu hình nhanh", padding=15)
        config_frame.pack(fill="x", pady=(0, 15))
        
        ttk.Label(config_frame, text="Model:").grid(row=0, column=0, sticky="w", pady=(0, 5))
        self.model_combo = ttk.Combobox(config_frame, values=self.cfg["models"], state="readonly", style="Modern.TCombobox")
        self.model_combo.set(self.cfg["model"])
        self.model_combo.grid(row=1, column=0, sticky="ew", pady=(0, 10))

        ttk.Label(config_frame, text="Prompt:").grid(row=2, column=0, sticky="w", pady=(0, 5))
        prompt_keys = list(self.cfg["prompts"].keys())
        self.prompt_combo = ttk.Combobox(config_frame, values=prompt_keys, state="readonly", style="Modern.TCombobox")
        if prompt_keys: self.prompt_combo.current(0)
        self.prompt_combo.grid(row=3, column=0, sticky="ew")
        config_frame.grid_columnconfigure(0, weight=1)

        # --- Xem trước ảnh ---
        self.preview_container = ttk.LabelFrame(left_frame, text="Ảnh vừa chụp", padding=10)
        self.preview_container.pack(fill="both", expand=True)
        self.image_preview_label = ttk.Label(self.preview_container, text="\n\nChưa có ảnh\n\n", anchor="center", style="Card.TFrame")
        self.image_preview_label.pack(fill="both", expand=True)


        # ---------------------- CỘT PHẢI: KẾT QUẢ & CÀI ĐẶT ----------------------
        right_frame = ttk.Frame(main_pane, padding=10)
        main_pane.add(right_frame, weight=3)

        # --- Header cột phải ---
        right_header = ttk.Frame(right_frame)
        right_header.pack(fill="x", pady=(0, 10))
        
        ttk.Label(right_header, text="Kết quả OCR:", style="Title.TLabel").pack(side="left")

        header_buttons_frame = ttk.Frame(right_header)
        header_buttons_frame.pack(side="right")
        ttk.Button(header_buttons_frame, text="📋 Copy", command=self.copy_result).pack(side="left", padx=3)
        ttk.Button(header_buttons_frame, text="📜 History", command=self.view_history).pack(side="left", padx=3)
        ttk.Button(header_buttons_frame, text="⚙️ Settings", command=self.open_settings).pack(side="left", padx=3)

        # --- Vùng hiển thị kết quả ---
        text_container = ttk.Frame(right_frame, style="Card.TFrame")
        text_container.pack(fill="both", expand=True)
        self.text = tk.Text(text_container, wrap="word", font=("SF Mono", 12), relief="flat", bd=0, padx=10, pady=10)
        self.text.pack(side="left", fill="both", expand=True)
        scrollbar = ttk.Scrollbar(text_container, orient="vertical", command=self.text.yview)
        scrollbar.pack(side="right", fill="y")
        self.text.config(yscrollcommand=scrollbar.set)
        
        # --- Status bar ---
        status_frame = ttk.Frame(self, padding="5 2")
        status_frame.pack(side="bottom", fill="x")
        self.status = ttk.Label(status_frame, text="Sẵn sàng | Hotkey: Ctrl+Shift+G", anchor="w")
        self.status.pack(side="left", padx=5)

    # ---------------------- CÀI ĐẶT (THIẾT KẾ LẠI) ----------------------
    def open_settings(self):
        w = tk.Toplevel(self)
        w.title("Cài đặt – Gemini OCR")
        w.geometry("1000x700")
        w.resizable(True, True)
        w.transient(self)
        w.grab_set()

        main_frame = ttk.Frame(w)
        main_frame.pack(fill="both", expand=True, padx=10, pady=10)

        notebook = ttk.Notebook(main_frame, style="Modern.TNotebook")
        notebook.pack(fill="both", expand=True)

        # --- Tab 1: API & Model (thiết kế lại) ---
        tab1 = ttk.Frame(notebook, padding=15)
        notebook.add(tab1, text="API & Model")

        api_frame = ttk.LabelFrame(tab1, text="Cấu hình Kết nối", padding=15)
        api_frame.pack(fill="x", pady=(0, 15))
        
        ttk.Label(api_frame, text="Gemini API Key:").grid(row=0, column=0, sticky="w", padx=5, pady=5)
        key_var = tk.StringVar(value=self.cfg["api_key"])
        key_entry = ttk.Entry(api_frame, textvariable=key_var, width=60, show="•", font=("SF Mono", 10))
        key_entry.grid(row=0, column=1, sticky="ew", padx=5, pady=5)

        show_key_var = tk.BooleanVar()
        def toggle_show_key():
            key_entry.config(show="" if show_key_var.get() else "•")
        ttk.Checkbutton(api_frame, text="Hiện", variable=show_key_var, command=toggle_show_key).grid(row=0, column=2, padx=5)

        def test_api_connection():
            api_key = key_var.get().strip()
            if not api_key:
                return messagebox.showerror("Lỗi", "Vui lòng nhập API Key trước khi kiểm tra.", parent=w)
            try:
                genai.configure(api_key=api_key)
                models = [m.name for m in genai.list_models()]
                if models:
                     messagebox.showinfo("Thành công", "Kết nối thành công! API Key hợp lệ.", parent=w)
                else:
                     messagebox.showwarning("Cảnh báo", "API Key có vẻ đúng nhưng không tìm thấy model nào.", parent=w)
            except Exception as e:
                messagebox.showerror("Thất bại", f"Không thể kết nối. Vui lòng kiểm tra lại API Key.\n\nLỗi: {e}", parent=w)
        
        ttk.Button(api_frame, text="Kiểm tra kết nối", command=test_api_connection).grid(row=0, column=3, padx=5)
        
        ttk.Label(api_frame, text="Gmail đồng bộ:").grid(row=1, column=0, sticky="w", padx=5, pady=5)
        mail_var = tk.StringVar(value=self.cfg.get("gmail", ""))
        mail_entry = ttk.Entry(api_frame, textvariable=mail_var, width=60, font=("SF Mono", 10))
        mail_entry.grid(row=1, column=1, columnspan=3, sticky="ew", padx=5, pady=5)
        
        api_frame.grid_columnconfigure(1, weight=1)

        model_frame = ttk.LabelFrame(tab1, text="Danh sách Model", padding=15)
        model_frame.pack(fill="both", expand=True)

        model_txt = tk.Text(model_frame, wrap="none", height=8, font=("SF Mono", 10))
        model_txt.insert("1.0", "\n".join(self.cfg["models"]))
        model_txt.pack(side="left", fill="both", expand=True, padx=(0,5))
        
        scrollbar_model = ttk.Scrollbar(model_frame, orient="vertical", command=model_txt.yview)
        scrollbar_model.pack(side="right", fill="y")
        model_txt.config(yscrollcommand=scrollbar_model.set)

        # --- Tab 2: Quản lý Prompt (Giữ nguyên) ---
        tab2 = ttk.Frame(notebook)
        # (Code cho tab 2 giữ nguyên như phiên bản gốc của bạn)
        notebook.add(tab2, text="Quản lý Prompt")
        tree_frame = ttk.Frame(tab2, padding=10)
        tree_frame.pack(fill="both", expand=True)
        cols = ("Tên", "Prompt")
        self.tree = ttk.Treeview(tree_frame, columns=cols, show="headings", height=15, style="Modern.Treeview")
        self.tree.heading("Tên", text="Tên")
        self.tree.column("Tên", width=150, anchor="w")
        self.tree.heading("Prompt", text="Prompt")
        self.tree.column("Prompt", width=600, anchor="w")
        v_scroll = ttk.Scrollbar(tree_frame, orient="vertical", command=self.tree.yview)
        h_scroll = ttk.Scrollbar(tree_frame, orient="horizontal", command=self.tree.xview)
        self.tree.configure(yscrollcommand=v_scroll.set, xscrollcommand=h_scroll.set)
        self.tree.grid(row=0, column=0, sticky="nsew")
        v_scroll.grid(row=0, column=1, sticky="ns")
        h_scroll.grid(row=1, column=0, sticky="ew")
        tree_frame.grid_rowconfigure(0, weight=1)
        tree_frame.grid_columnconfigure(0, weight=1)
        for key, prompt in self.cfg["prompts"].items(): self.tree.insert("", "end", values=(key, prompt))
        btn_frame = ttk.Frame(tab2, padding=(10, 10, 10, 0))
        btn_frame.pack(fill="x")
        ttk.Button(btn_frame, text="➕ Thêm mới", command=self.add_prompt_row, style="Modern.TButton").pack(side="left", padx=5)
        ttk.Button(btn_frame, text="✏️ Sửa", command=self.edit_prompt_row, style="Modern.TButton").pack(side="left", padx=5)
        ttk.Button(btn_frame, text="🗑 Xóa", command=self.del_prompt_row, style="Modern.TButton").pack(side="left", padx=5)
        # (Các chức năng khác của tab prompt giữ nguyên)


        # --- Khu vực nút bấm dưới cùng ---
        def save_all():
            new_key = key_var.get().strip()
            new_mail = mail_var.get().strip()
            new_models = [m.strip() for m in model_txt.get("1.0", tk.END).splitlines() if m.strip()]
            new_prompts = {self.tree.set(item, "Tên"): self.tree.set(item, "Prompt") for item in self.tree.get_children()}
            if not new_models or not new_prompts:
                return messagebox.showwarning("Lỗi", "Danh sách Model và Prompt không được để trống!", parent=w)
            
            self.cfg.update({"api_key": new_key, "gmail": new_mail, "models": new_models, "prompts": new_prompts, "model": new_models[0]})
            save_cfg(self.cfg)
            if new_key: 
                try:
                    genai.configure(api_key=new_key)
                except Exception as e:
                    print(f"Lỗi khi lưu API key: {e}")
            self.model_combo['values'] = new_models
            self.model_combo.set(new_models[0])
            prompt_keys = list(new_prompts.keys())
            self.prompt_combo['values'] = prompt_keys
            self.prompt_combo.current(0 if prompt_keys else -1)
            if new_mail: self.sync_gmail_to_web(new_mail)
            messagebox.showinfo("Thành công", "Đã lưu cấu hình!", parent=w)
            w.destroy()

        bottom_frame = ttk.Frame(main_frame)
        bottom_frame.pack(fill="x", side="bottom", pady=(15, 0))
        ttk.Button(bottom_frame, text="Hủy", command=w.destroy, style="Modern.TButton").pack(side="right")
        ttk.Button(bottom_frame, text="💾 Lưu và Đóng", command=save_all, style="Modern.TButton").pack(side="right", padx=10)

    # ---------------------- LOGIC LÕI & SỰ KIỆN ----------------------
    def _update_preview_image(self, b64_img):
        try:
            img_data = base64.b64decode(b64_img)
            img = Image.open(io.BytesIO(img_data))
            
            # Tính toán kích thước để vừa với khung preview
            container_w = self.image_preview_label.winfo_width()
            container_h = self.image_preview_label.winfo_height()
            
            if container_w < 50 or container_h < 50: # Đảm bảo frame đã được vẽ
                 self.after(50, lambda: self._update_preview_image(b64_img))
                 return

            img.thumbnail((container_w - 10, container_h - 10), Image.LANCZOS)
            
            self.preview_photo = ImageTk.PhotoImage(img)
            self.image_preview_label.config(image=self.preview_photo, text="")
        except Exception as e:
            self.image_preview_label.config(image=None, text=f"Lỗi hiển thị ảnh:\n{e}")
            print(f"Lỗi update preview: {e}")

    def snip(self):
        self._clear_before_ocr()
        self.withdraw()
        self.update()
        self.after(250, lambda: self._process_ocr_input(grab_snip()))

    def open_file(self):
        f = filedialog.askopenfilename(filetypes=[("Images", "*.png *.jpg *.jpeg *.bmp *.tiff")])
        if not f: return
        with open(f, "rb") as img: b64 = base64.b64encode(img.read()).decode()
        self._clear_before_ocr()
        self._process_ocr_input(b64)

    def _clear_before_ocr(self):
        self.text.delete("1.0", tk.END)
        self.text.insert("1.0", "⏳ Đang xử lý... Vui lòng đợi.")
        self.status.config(text="Đang gọi Gemini API...")
        self.update_idletasks()

    def _process_ocr_input(self, b64_img):
        self.deiconify()
        if not b64_img:
            self.status.config(text="Hủy thao tác."); return
        if not self.cfg.get("api_key"):
            messagebox.showwarning("Thiếu API Key", "Vui lòng nhập API Key trong phần Cài đặt!", parent=self)
            self.status.config(text="Sẵn sàng")
            self.text.delete("1.0", tk.END)
            return
        
        self._update_preview_image(b64_img)
        threading.Thread(target=self._ocr_thread, args=(b64_img,), daemon=True).start()

    def _ocr_thread(self, b64_img):
        try:
            prompt_key = self.prompt_combo.get()
            prompt = self.cfg["prompts"].get(prompt_key, "Extract text from this image.")
            model = self.model_combo.get()
            result = gemini_ocr(b64_img, prompt, model)
            
            save_history({
                "timestamp": datetime.datetime.now().isoformat(),
                "prompt_key": prompt_key, "model": model, "result": result,
                "image_size": len(b64_img)
            })
            self.after(0, lambda: self._show_result(result))
        except Exception as e:
            self.after(0, lambda: self._show_error(str(e)))

    def _show_result(self, result):
        self.text.delete("1.0", tk.END)
        self.text.insert("1.0", result)
        self.status.config(text="✅ Hoàn thành!")

    def _show_error(self, msg):
        self.text.delete("1.0", tk.END)
        self.text.insert("1.0", f"❌ Lỗi: {msg}")
        self.status.config(text="Lỗi OCR!")

    def copy_result(self):
        text = self.text.get("1.0", tk.END).strip()
        if text and "⏳" not in text and "❌" not in text:
            self.clipboard_clear()
            self.clipboard_append(text)
            self.status.config(text="📋 Đã copy kết quả vào clipboard!")

    def view_history(self):
        # (Code view_history giữ nguyên như phiên bản gốc của bạn)
        win = tk.Toplevel(self)
        win.title("Lịch sử OCR")
        win.geometry("900x600")
        win.resizable(True, True)
        txt_frame = ttk.Frame(win)
        txt_frame.pack(fill="both", expand=True, padx=10, pady=10)
        txt = tk.Text(txt_frame, wrap="word", font=("SF Mono", 11), padx=10, pady=10)
        scrollbar = ttk.Scrollbar(txt_frame, orient="vertical", command=txt.yview)
        scrollbar.pack(side="right", fill="y")
        txt.pack(side="left", fill="both", expand=True)
        txt.config(yscrollcommand=scrollbar.set)
        history = load_history()
        if not history:
            txt.insert("1.0", "Chưa có lịch sử OCR nào.")
        else:
            for item in history[:50]: # Giới hạn 50 mục gần nhất
                dt = datetime.datetime.fromisoformat(item['timestamp']).strftime('%Y-%m-%d %H:%M:%S')
                header = f"[{dt}] Model: {item['model']} | Prompt: {item.get('prompt_key', 'N/A')}\n"
                txt.insert("end", header, "header")
                txt.insert("end", f"{item['result']}\n\n", "result")
        txt.tag_config("header", foreground="#00FFFF", font=("SF Pro", 10, "bold"))
        txt.tag_config("result", lmargin1=20)
        txt.config(state="disabled")


    def sync_gmail_to_web(self, gmail: str):
        if not gmail or not self.cfg.get("api_key"): return
        payload = {"apiKey": self.cfg["api_key"], "deviceId": self.device_id, "gmail": gmail}
        try:
            r = requests.post("https://asia-southeast1-gamelogic4u.cloudfunctions.net/saveDevice", json=payload, timeout=10)
            r.raise_for_status()
            print("Đồng bộ Gmail thành công.")
        except Exception as e:
            print(f"Lỗi đồng bộ Gmail: {e}")
            
    # Các hàm CRUD prompt giữ nguyên như phiên bản của bạn
    def add_prompt_row(self): self._prompt_dialog("Thêm Prompt Mới", "", "")
    def edit_prompt_row(self):
        selected = self.tree.selection()
        if not selected: return messagebox.showwarning("Chưa chọn", "Vui lòng chọn một prompt để sửa!")
        item = selected[0]
        name, content = self.tree.item(item, "values")
        self._prompt_dialog("Sửa Prompt", name, content, item)
    def del_prompt_row(self):
        selected = self.tree.selection()
        if not selected: return messagebox.showwarning("Chưa chọn", "Vui lòng chọn một prompt để xóa!")
        if messagebox.askyesno("Xác nhận", "Bạn chắc chắn muốn xóa prompt này?"):
            self.tree.delete(selected[0])
    def _prompt_dialog(self, title, name, content, item=None):
        d = tk.Toplevel(self)
        d.title(title)
        d.geometry("800x600")
        d.transient(self); d.grab_set()
        
        ttk.Label(d, text="Tên gợi nhớ:").pack(anchor="w", padx=15, pady=(15, 5))
        name_ent = ttk.Entry(d, font=("SF Pro", 11))
        name_ent.insert(0, name)
        name_ent.pack(fill="x", padx=15, pady=5)

        ttk.Label(d, text="Nội dung Prompt:").pack(anchor="w", padx=15, pady=(15, 5))
        text_frame = ttk.Frame(d)
        text_frame.pack(fill="both", expand=True, padx=15, pady=5)
        txt = tk.Text(text_frame, wrap="word", font=("SF Mono", 11))
        txt.insert("1.0", content)
        txt.pack(side="left", fill="both", expand=True)
        scrollbar_txt = ttk.Scrollbar(text_frame, orient="vertical", command=txt.yview)
        scrollbar_txt.pack(side="right", fill="y")
        txt.config(yscrollcommand=scrollbar_txt.set)
        
        def ok():
            new_name = name_ent.get().strip()
            new_content = txt.get("1.0", tk.END).strip()
            if not new_name or not new_content:
                return messagebox.showwarning("Thiếu thông tin", "Tên và nội dung không được để trống!", parent=d)
            values = (new_name, new_content)
            if item is None: self.tree.insert("", "end", values=values)
            else: self.tree.item(item, values=values)
            d.destroy()

        btn_frame = ttk.Frame(d, padding=15)
        btn_frame.pack(fill="x")
        ttk.Button(btn_frame, text="✅ Lưu", command=ok).pack(side="right")
        ttk.Button(btn_frame, text="❌ Hủy", command=d.destroy).pack(side="right", padx=10)

# ---------- RUN ----------
if __name__ == "__main__":
    app = App()
    app.mainloop()