import { initializeApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  createUserWithEmailAndPassword // Thêm để dùng sau này
} from "firebase/auth";
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  serverTimestamp
} from "firebase/firestore"; // Thêm các hàm cần thiết của Firestore
import { getStorage } from "firebase/storage";
import { getFunctions } from "firebase/functions";

const firebaseConfig = {
  apiKey: process.env.REACT_APP_API_KEY,
  authDomain: process.env.REACT_APP_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_PROJECT_ID,
  storageBucket: process.env.REACT_APP_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_APP_ID,
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const functions = getFunctions(app, 'asia-southeast1');

const provider = new GoogleAuthProvider();

/**
 * ✨ HÀM ĐĂNG NHẬP ĐÃ ĐƯỢC CẬP NHẬT ✨
 * Bây giờ nó sẽ tự động tạo user document trong Firestore nếu là người dùng mới.
 * Hành động này sẽ kích hoạt Cloud Function "autoSetupNewTeacher".
 */
export const loginWithGoogle = async () => {
  try {
    const res = await signInWithPopup(auth, provider);
    const user = res.user;
    const userDocRef = doc(db, "users", user.uid);

    // Kiểm tra xem người dùng này đã có document trong Firestore chưa
    const docSnap = await getDoc(userDocRef);

    // Nếu chưa có (đây là lần đăng nhập đầu tiên)
    if (!docSnap.exists()) {
      // Tạo một document mới để kích hoạt Cloud Function
      await setDoc(userDocRef, {
        uid: user.uid,
        displayName: user.displayName,
        email: user.email,
        photoURL: user.photoURL,
        createdAt: serverTimestamp(),
      });
      console.log("Phát hiện người dùng mới! Đã tạo user document để kích hoạt Cloud Function.");
    } else {
       console.log("Chào mừng người dùng cũ quay trở lại!");
    }
    // Trả về kết quả để component có thể xử lý (ví dụ: chuyển trang)
    return res; 
  } catch (err) {
    console.error("Lỗi khi đăng nhập bằng Google:", err);
    // Ném lỗi ra ngoài để component có thể bắt và xử lý
    throw err; 
  }
};

/**
 * Hàm đăng ký bằng email/password (để dùng trong tương lai)
 * Cũng đã bao gồm logic tạo user document.
 */
export const registerWithEmailAndPassword = async (name, email, password) => {
    try {
        const res = await createUserWithEmailAndPassword(auth, email, password);
        const user = res.user;
        
        await setDoc(doc(db, "users", user.uid), {
            uid: user.uid,
            displayName: name,
            email,
            photoURL: "",
            createdAt: serverTimestamp(),
        });
        console.log("User document mới đã được tạo, Cloud Function sẽ chạy.");
        return res;

    } catch (err) {
        console.error("Lỗi khi đăng ký bằng email:", err);
        throw err;
    }
};


export const logout = () => signOut(auth);