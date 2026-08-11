import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from './firebase';

export const createUserProfileDocument = async (user) => {
    if (!user) return;

    const userRef = doc(db, 'users', user.uid);
    const userSnap = await getDoc(userRef);
    let userData = userSnap.data();

    if (!userSnap.exists()) {
        // MỚI: Hardcode cho student - auto approved, không fetch settings (tránh denied)
        const initialStatus = 'approved'; // Student luôn approved
        const initialRole = 'student'; // Default role
        const newUserPayload = { 
            email: user.email, 
            displayName: user.displayName || user.email.split('@')[0], // Fallback tên nếu null
            photoURL: user.photoURL || '', 
            role: initialRole,
            status: initialStatus, 
            groupId: null,
            trialEndDate: null // Nếu cần cho teacher sau
        };
        try {
            await setDoc(userRef, newUserPayload);
            userData = newUserPayload;
            console.log(`Created profile for ${user.uid}: role=${initialRole}, status=${initialStatus}`);
        } catch (error) {
            console.error('Lỗi tạo profile:', error);
            // Fallback: Không throw, để app tiếp tục (user có thể chơi public quiz)
        }
    }
    
    return userData; // Return để GameApp dùng nếu cần
};