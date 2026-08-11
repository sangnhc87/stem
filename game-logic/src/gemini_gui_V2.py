#!/usr/bin/env python3
# gemini_gui_v4_login.py – Phiên bản hỗ trợ Google Sign-In (sửa lỗi 400 Bad Request)
from __future__ import annotations
import os, warnings, subprocess, tempfile, base64, io, json, time, threading, pathlib, requests
import urllib.parse  # Thêm cho encode nếu cần
import pickle  # Để lưu token

warnings.filterwarnings("ignore", module="grpc")
os.environ["GRPC_VERBOSITY"] = "NONE"

import tkinter as tk
from tkinter import ttk, filedialog, messagebox
import darkdetect, sv_ttk
from PIL import Image, ImageTk
import pyrebase
from pynput import keyboard

# Thêm import cho Google OAuth
from google_auth_oauthlib.flow import InstalledAppFlow
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials

# ---------- CẤU HÌNH FIREBASE ----------
firebaseConfig = {
  "apiKey": "AIzaSyArCNGJJF7J6_6aZA5Ghs1ZPUjeGKMW-XA",
  "authDomain": "gamelogic4u.firebaseapp.com",
  "projectId": "gamelogic4u",
  "storageBucket": "gamelogic4u.firebasestorage.app",
  "messagingSenderId": "549624122973",
  "appId": "1:549624122973:web:d7ca0c8c84ced800ff07b4",
  "databaseURL": "https://gamelogic4u-default-rtdb.asia-southeast1.firebasedatabase.app"
}

# URL của Cloud Function bạn đã tạo ở các bước trước
FUNCTIONS_URL = "https://asia-southeast1-gamelogic4u.cloudfunctions.net/submitOcrRequest"

# Khởi tạo Firebase (chỉ dùng cho config, không dùng auth trực tiếp)
try:
    firebase = pyrebase.initialize_app(firebaseConfig)
    print("Firebase initialized successfully.")
except Exception as e:
    print(f"Failed to initialize Firebase: {e}")

# ---------- CẤU HÌNH GOOGLE OAUTH ----------
SCOPES = ['openid', 'email', 'profile', 'https://www.googleapis.com/auth/userinfo.profile']
CLIENT_SECRETS_FILE = 'client_secret.json'  # File download từ Google Console
TOKEN_FILE = 'token.pickle'  # File lưu credential

# ---------- 6 loại prompt ----------
PROMPTS = [
    "Lấy text giúp tôi, toán thì xuất dạng latex",
    "Trả về mã LaTeX cho toàn bộ công thức trong ảnh",
    "Chỉ trả về text thuần (không công thức)",
    "Trả về bảng Markdown có công thức toán",
    "Trả về AsciiMath thay vì LaTeX",
    "Dịch toàn bộ text trong ảnh sang tiếng Việt"
]

# ---------- macOS snip ----------
def grab_snip() -> str | None:
    """Chụp một vùng màn hình và trả về dữ liệu ảnh dưới dạng base64."""
    tmp = tempfile.mktemp(suffix=".png")
    try:
        # Lệnh `screencapture` dành cho macOS
        subprocess.run(["screencapture", "-i", "-x", "-r", tmp], check=True)
    except (subprocess.CalledProcessError, FileNotFoundError):
        # FileNotFoundError xảy ra nếu lệnh không tồn tại (ví dụ: trên Windows/Linux)
        # Cần có giải pháp thay thế cho các hệ điều hành khác
        messagebox.showerror("Lỗi Chụp ảnh", "Lệnh `screencapture` chỉ dùng cho macOS. Chức năng này chưa hỗ trợ trên hệ điều hành của bạn.")
        return None
        
    if not os.path.exists(tmp) or os.stat(tmp).st_size == 0:
        return None
    with open(tmp, "rb") as f:
        b64 = base64.b64encode(f.read()).decode()
    os.remove(tmp)
    return b64

# ---------- GUI ----------
class App(tk.Tk):
    def __init__(self):
        super().__init__()
        self.title("Gemini OCR 4.0 - Cần Đăng Nhập")
        self.geometry("950x620")
        sv_ttk.set_theme("dark" if darkdetect.isDark() else "light")
        
        # Biến lưu trạng thái đăng nhập
        self.user_info = None
        self.id_token = None

        self._build_ui()
        # Vô hiệu hóa phím tắt cho đến khi đăng nhập thành công
        self.hotkey_listener = keyboard.GlobalHotKeys({"<ctrl>+<shift>+g": self.snip})
        
    def _build_ui(self):
        top = ttk.Frame(self)
        top.pack(side="top", fill="x", padx=10, pady=8)
        
        # Thêm nút Đăng nhập (bây giờ là Google Sign-In)
        self.login_button = ttk.Button(top, text="🔑 Đăng nhập với Google", command=self.open_login_window)
        self.login_button.pack(side="right")
        
        # Các nút chức năng chính
        self.snip_button = ttk.Button(top, text="📷 Snip (Ctrl+Shift+G)", command=self.snip, state=tk.DISABLED)
        self.snip_button.pack(side="left", padx=5)
        self.open_button = ttk.Button(top, text="📁 Mở file", command=self.open_file, state=tk.DISABLED)
        self.open_button.pack(side="left", padx=5)
        self.copy_button = ttk.Button(top, text="📋 Copy", command=self.copy_latex)
        self.copy_button.pack(side="left", padx=5)
        
        self.prompt_combo = ttk.Combobox(top, values=PROMPTS, state="readonly", width=45)
        self.prompt_combo.current(0)
        self.prompt_combo.pack(side="left", padx=10)
        
        self.pan = ttk.PanedWindow(self, orient="horizontal")
        self.pan.pack(fill="both", expand=1, padx=10, pady=(0,10))

        self.right_frame = ttk.LabelFrame(self.pan, text="Kết quả", padding=8)
        self.pan.add(self.right_frame, weight=3)
        self.text = tk.Text(self.right_frame, wrap="word", font=("SF Mono", 13))
        self.text.pack(fill="both", expand=1)

        self.status = ttk.Label(self, text="Vui lòng đăng nhập với Google để bắt đầu", anchor="w")
        self.status.pack(side="bottom", fill="x", padx=15, pady=5)

    # ---------- CHỨC NĂNG ĐĂNG NHẬP VỚI GOOGLE ----------
    def open_login_window(self):
        # Kiểm tra file client_secret
        if not os.path.exists(CLIENT_SECRETS_FILE):
            messagebox.showerror("Lỗi Cấu Hình", f"Không tìm thấy file {CLIENT_SECRETS_FILE}. Vui lòng download từ Google Console.")
            return

        def run_google_auth():
            creds = None
            # Load token từ file nếu có
            if os.path.exists(TOKEN_FILE):
                with open(TOKEN_FILE, 'rb') as token:
                    creds = pickle.load(token)

            # Nếu không có valid creds, chạy flow
            if not creds or not creds.valid:
                if creds and creds.expired and creds.refresh_token:
                    creds.refresh(Request())
                else:
                    flow = InstalledAppFlow.from_client_secrets_file(CLIENT_SECRETS_FILE, SCOPES)
                    # Mở browser tự động để đăng nhập Google
                    creds = flow.run_local_server(
                        port=0,
                        open_browser=True,
                        redirect_uri_trailing_slash=False,
                        success_message="<h1>Đăng nhập thành công!</h1><br>Bạn có thể đóng cửa sổ này và quay lại app."
                    )

                # Lưu creds cho lần sau
                with open(TOKEN_FILE, 'wb') as token:
                    pickle.dump(creds, token)

            # Lấy id_token từ Google
            id_token = creds.id_token
            if not id_token:
                self.after(0, messagebox.showerror, "Lỗi", "Không lấy được token từ Google.")
                return

            # Sign in với Firebase REST API (SỬA: dùng JSON body đúng format)
            firebase_signin_url = f"https://identitytoolkit.googleapis.com/v1/accounts:signInWithIdp?key={firebaseConfig['apiKey']}"
            post_body = f"id_token={urllib.parse.quote(id_token)}&providerId=google.com"
            
            body = {
                "postBody": post_body,
                "requestUri": "http://localhost",
                "returnSecureToken": True
            }
            
            try:
                response = requests.post(firebase_signin_url, json=body)  # SỬA: dùng json= thay vì data=
                response.raise_for_status()
                firebase_user = response.json()
                
                # Lưu thông tin user và token
                self.user_info = {'email': firebase_user.get('email', 'Unknown'), 'localId': firebase_user.get('localId')}
                self.id_token = firebase_user['idToken']
                
                # Cập nhật UI trên main thread
                self.after(0, self.on_login_success)
            except requests.exceptions.HTTPError as e:
                # In chi tiết lỗi để debug (bạn có thể xóa sau)
                print(f"HTTP Error: {e}")
                try:
                    error_details = e.response.json().get('error', {}).get('message', 'Unknown error')
                    self.after(0, messagebox.showerror, "Đăng Nhập Thất Bại", f"Lỗi Firebase: {error_details}")
                except:
                    self.after(0, messagebox.showerror, "Đăng Nhập Thất Bại", f"Lỗi HTTP: {str(e)}")
            except Exception as e:
                self.after(0, messagebox.showerror, "Đăng Nhập Thất Bại", f"Lỗi khi xác thực với Firebase: {str(e)}")
                # ------------------ POLL TOKEN ------------------
        def poll_for_token():
            if os.path.exists(TOKEN_FILE):
                with open(TOKEN_FILE, 'rb') as token:
                    creds = pickle.load(token)
                if creds and creds.valid and creds.id_token:
                    self.after(0, self.on_login_success)
                    return
            self.after(500, poll_for_token)  # 0.5 s kiểm tra lại

        # Khởi động poll ngay
        self.after(500, poll_for_token)
        # ------------------------------------------------
        # Chạy auth trong thread để không block UI, và mở browser
        threading.Thread(target=run_google_auth, daemon=True).start()
        self.status.config(text="Đang mở Google để đăng nhập...")

    def on_login_success(self):
        self.status.config(text=f"Xin chào, {self.user_info['email']}!")
        self.title(f"Gemini OCR 4.0 - Đã đăng nhập với Google")
        # Kích hoạt các nút chức năng
        self.snip_button.config(state=tk.NORMAL)
        self.open_button.config(state=tk.NORMAL)
        self.login_button.config(text="✅ Đã đăng nhập", state=tk.DISABLED)
        # Bật phím tắt
        self.hotkey_listener.start()

    # ---------- Chức năng chính ----------
    def snip(self):
        self.status.config(text="Đang chờ vùng chọn…")
        self.update_idletasks()
        self.withdraw()
        self.update()
        self.after(250, self._do_snip)

    def _do_snip(self):
        b64 = grab_snip()
        self.deiconify()
        if not b64:
            self.status.config(text="Đã hủy")
            return
        self._recognize(b64)

    def open_file(self):
        f = filedialog.askopenfilename(filetypes=[("Image", "*.png *.jpg *.jpeg *.bmp *.tiff")])
        if not f: 
            return
        with open(f, "rb") as img: 
            b64 = base64.b64encode(img.read()).decode()
        self._recognize(b64)

    def _recognize(self, b64_img):
        if not self.id_token:
            messagebox.showwarning("Chưa đăng nhập", "Phiên đăng nhập đã hết hạn hoặc không hợp lệ. Vui lòng đăng nhập lại.")
            return

        def run():
            try:
                self.status.config(text="Đang gửi yêu cầu chờ duyệt…")
                prompt = PROMPTS[self.prompt_combo.current()]
                
                headers = {"Authorization": f"Bearer {self.id_token}"}
                payload = {"data": {"imageBase64": b64_img, "prompt": prompt}}
                
                response = requests.post(FUNCTIONS_URL, headers=headers, json=payload)
                response.raise_for_status() # Báo lỗi nếu request thất bại (4xx, 5xx)

                # Hiển thị thông báo cho người dùng
                self.after(0, self.text.delete, "1.0", tk.END)
                self.after(0, self.text.insert, "1.0", "Yêu cầu của bạn đã được gửi thành công.\n\nKết quả sẽ có sau khi admin duyệt trên trang web.")
                self.after(0, self.status.config, {"text": "Đã gửi! Chờ admin duyệt..."})
                
            except requests.exceptions.HTTPError as e:
                error_details = "Không thể đọc chi tiết lỗi từ server."
                try:
                    error_details = e.response.json()['error']['message']
                except:
                    pass
                self.after(0, messagebox.showerror, "Lỗi Server", f"Lỗi: {error_details}")
                self.after(0, self.status.config, {"text": "Lỗi khi gửi yêu cầu"})
            except requests.exceptions.RequestException as e:
                self.after(0, messagebox.showerror, "Lỗi Mạng", f"Không thể kết nối đến server: {e}")
                self.after(0, self.status.config, {"text": "Lỗi mạng"})
            except Exception as e:
                self.after(0, messagebox.showerror, "Lỗi", f"Có lỗi xảy ra: {str(e)}")
                self.after(0, self.status.config, {"text": "Lỗi"})
                
        threading.Thread(target=run, daemon=True).start()

    def copy_latex(self):
        self.clipboard_clear()
        self.clipboard_append(self.text.get("1.0", tk.END).strip())
        self.status.config(text="Đã copy")


if __name__ == "__main__":
    App().mainloop()