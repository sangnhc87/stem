// src/context/UserContext.js

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '../firebase';
import { doc, onSnapshot } from 'firebase/firestore';

const UserContext = createContext();

export const useUser = () => useContext(UserContext);

export const UserProvider = ({ children }) => {
  const [user, loadingAuth] = useAuthState(auth);
  const [userInfo, setUserInfo] = useState(null); // Thông tin từ Firestore
  const [loadingUser, setLoadingUser] = useState(true);

  useEffect(() => {
    if (user) {
      // Khi user đăng nhập, lắng nghe thay đổi trong document của họ
      const userDocRef = doc(db, 'users', user.uid);
      const unsubscribe = onSnapshot(userDocRef, (docSnap) => {
        if (docSnap.exists()) {
          const userData = docSnap.data();

          // Lắng nghe thêm thông tin từ group nếu là giáo viên
          if (userData.role === 'teacher' && userData.groupId) {
            const groupDocRef = doc(db, 'groups', userData.groupId);
            onSnapshot(groupDocRef, (groupSnap) => {
              if (groupSnap.exists()) {
                setUserInfo({
                  ...userData,
                  groupSlug: groupSnap.data().slug // Đây là thứ chúng ta cần!
                });
              }
               setLoadingUser(false);
            });
          } else {
            setUserInfo(userData);
            setLoadingUser(false);
          }
        } else {
           setLoadingUser(false);
        }
      });

      return () => unsubscribe();
    } else {
      // Nếu không có user, reset state
      setUserInfo(null);
      setLoadingUser(false);
    }
  }, [user]);

  const value = {
    user, // user từ Auth
    userInfo, // user từ Firestore (có cả groupSlug)
    loading: loadingAuth || loadingUser
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};