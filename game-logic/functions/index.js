// File: functions/index.js

// ==================================================================
//                      IMPORTS (KHAI BÁO)
// ==================================================================
// Chỉ import những gì cần thiết từ v2. Đã gộp và dọn dẹp các dòng thừa.
const { onCall, onRequest, HttpsError } = require("firebase-functions/v2/https");
const { onDocumentWritten, onDocumentCreated } = require("firebase-functions/v2/firestore");
const { setGlobalOptions } = require("firebase-functions/v2");
const cors = require("cors")({ origin: true });

const admin = require("firebase-admin");

// ==================================================================
//                      INITIALIZATION (KHỞI TẠO)
// ==================================================================
admin.initializeApp();
setGlobalOptions({ region: "asia-southeast1" });
// ✨ DÒNG MỚI: Import tất cả các hàm từ file ocrFunctions
// ==================================================================
// ✨ IMPORT CÁC HÀM OCR TỪ FILE RIÊNG
// ==================================================================
const ocrFunctions = require('./ocrFunctions');
exports.createUserProfile = ocrFunctions.createUserProfile;
exports.submitOcrRequest = ocrFunctions.submitOcrRequest;
exports.processApprovedRequest = ocrFunctions.processApprovedRequest;
exports.saveDevice = ocrFunctions.saveDevice;
// Khởi tạo Firestore DB. admin.initializeApp() đã được gọi ở index.js
const db = admin.firestore();
// ==================================================================

//          HÀM TỰ ĐỘNG THIẾT LẬP (ĐÃ SỬA LẠI ĐÚNG TRIGGER)
// ==================================================================
/**
 * Trigger này sẽ chạy mỗi khi một document MỚI được tạo trong collection 'users'.
 * Đây là giải pháp ổn định và tương thích với môi trường của bạn.
 */
exports.autoSetupNewTeacher = onDocumentCreated("users/{userId}", async (event) => {
  const snapshot = event.data;
  if (!snapshot) {
    console.log("Không có dữ liệu, hàm kết thúc.");
    return;
  }
  
  const userData = snapshot.data();
  const userId = event.params.userId;

  try {
    const authUser = await admin.auth().getUser(userId);
    const { email, displayName } = authUser;

    if (userData.role === 'teacher' && userData.groupId) {
        console.log(`User ${userId} đã được thiết lập, bỏ qua.`);
        return;
    }

    console.log(`Phát hiện document user mới: ${displayName} (${email}). Bắt đầu tự động thiết lập...`);
    const db = admin.firestore();

    const settingsDoc = await db.collection('settings').doc('global').get();
    const requireApproval = settingsDoc.exists && settingsDoc.data().requireApproval === true;
    const initialStatus = requireApproval ? 'pending' : 'approved';

    const teacherName = displayName || email.split('@')[0];
    const groupName = `Lớp của ${teacherName}`;
    
    let slug = (email.split('@')[0] || `teacher-${userId.substring(0,5)}`).toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const groupsRef = db.collection('groups');
    const existingGroup = await groupsRef.where('slug', '==', slug).get();
    if (!existingGroup.empty) {
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      slug = `${slug}-${randomSuffix}`;
    }

    const groupPayload = {
      name: groupName,
      slug,
      teacherId: userId,
      autoApproveStudents: true,
      welcomeMessage: `Chào mừng các bạn đến với lớp học của thầy/cô ${teacherName}!`,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    const groupRef = await db.collection('groups').add(groupPayload);
    console.log(`Đã tạo lớp học mới "${groupName}" với ID: ${groupRef.id}`);

    await snapshot.ref.update({
        role: 'teacher',
        status: initialStatus,
        groupId: groupRef.id,
    });
    console.log(`Đã cập nhật user document cho giáo viên ${userId}`);

    await admin.auth().setCustomUserClaims(userId, { role: 'teacher' });
    console.log(`Đã cấp quyền 'teacher' cho ${userId}. Hoàn tất!`);

  } catch (error) {
    console.error(`Lỗi nghiêm trọng khi tự động thiết lập cho user ${userId}:`, error);
  }
});


// ==================================================================
//                 CÁC HÀM KHÁC (GIỮ NGUYÊN)
// ==================================================================
exports.syncUserClaims = onDocumentWritten("users/{userId}", async (event) => {
  const userId = event.params.userId;
  const afterData = event.data?.after?.data();
  if (!afterData) {
    try {
      await admin.auth().setCustomUserClaims(userId, null);
    } catch (error) {
      console.error(`Error removing claims for deleted user ${userId}:`, error);
    }
    return;
  }
  const role = afterData.role || "student";
  try {
    const userRecord = await admin.auth().getUser(userId);
    const currentClaims = userRecord.customClaims;
    if (currentClaims?.role === role) {
      return;
    }
    await admin.auth().setCustomUserClaims(userId, { role });
  } catch (error) {
    console.error(`Error getting/setting claims for ${userId}:`, error);
  }
});

// [... Dán tất cả các hàm onCall khác của bạn vào đây, từ createJoinRequest đến processJoinRequest ...]
// Tôi sẽ dán lại chúng ở đây cho bạn để đảm bảo không thiếu gì.
exports.createJoinRequest = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Bạn phải đăng nhập để thực hiện.");
  }
  const studentId = request.auth.uid;
  const { groupId } = request.data;
  if (!groupId) {
    throw new HttpsError("invalid-argument", "Thiếu thông tin lớp học.");
  }
  const db = admin.firestore();
  const studentDoc = await db.collection("users").doc(studentId).get();
  const groupDoc = await db.collection("groups").doc(groupId).get();
  if (!studentDoc.exists || !groupDoc.exists) {
     throw new HttpsError("not-found", "Không tìm thấy người dùng hoặc lớp học.");
  }
  if (studentDoc.data().groupId === groupId) {
     throw new HttpsError("already-exists", "Bạn đã ở trong lớp này rồi.");
  }
  const existingRequestQuery = await db.collection("joinRequests")
    .where("studentId", "==", studentId)
    .where("groupId", "==", groupId)
    .where("status", "==", "pending")
    .limit(1)
    .get();
  if (!existingRequestQuery.empty) {
     throw new HttpsError("already-exists", "Bạn đã gửi yêu cầu vào lớp này rồi, vui lòng chờ duyệt.");
  }
  const groupData = groupDoc.data();
  const teacherId = groupData.teacherId;
  if (!teacherId) {
    throw new HttpsError("failed-precondition", "Lớp học này hiện chưa có giáo viên, không thể gửi yêu cầu.");
  }
  
  // ✅ KIỂM TRA AUTO-APPROVE
  if (groupData.autoApproveStudents === true) {
    // Tự động duyệt: cập nhật user luôn, không cần tạo request
    await db.collection("users").doc(studentId).update({
      groupId: groupId,
      status: 'approved'
    });
    return { success: true, message: "Bạn đã được tự động chấp nhận vào lớp!" };
  }
  
  // Nếu không auto-approve, tạo request chờ duyệt
  await db.collection("joinRequests").add({
    studentId,
    groupId,
    teacherId,
    status: "pending",
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });
  return { success: true, message: "Yêu cầu đã được gửi thành công." };
});

exports.setUserRole = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Bạn phải đăng nhập.");
  }
  const callerUid = request.auth.uid;
  const callerRole = request.auth.token.role;
  const { uid, role, status } = request.data;
  const db = admin.firestore();
  if (callerRole === 'admin') {
    // Admin có quyền
  } else if (callerRole === 'teacher') {
    if (role && role !== 'student') {
       throw new HttpsError("permission-denied", "Giáo viên không có quyền thay đổi vai trò người dùng.");
    }
    const teacherDoc = await db.collection('users').doc(callerUid).get();
    const studentDoc = await db.collection('users').doc(uid).get();

    if (!teacherDoc.exists || !studentDoc.exists) {
        throw new HttpsError("not-found", "Không tìm thấy thông tin người dùng.");
    }
    const teacherGroupId = teacherDoc.data().groupId;
    const studentGroupId = studentDoc.data().groupId;
    if (!teacherGroupId || teacherGroupId !== studentGroupId) {
      throw new HttpsError("permission-denied", "Bạn chỉ có thể cập nhật trạng thái học sinh trong lớp của mình.");
    }
  } else {
    throw new HttpsError("permission-denied", "Bạn không có quyền thực hiện hành động này.");
  }
  try {
    const updateData = {};
    if (role) updateData.role = role;
    if (status) updateData.status = status;
    if (Object.keys(updateData).length > 0) {
        await db.collection('users').doc(uid).update(updateData);
    }
    return { message: "Cập nhật thành công!" };
  } catch (error) {
    console.error("Error updating user:", error);
    throw new HttpsError("internal", "Lỗi khi cập nhật thông tin người dùng.");
  }
});

exports.deleteUser = onCall(async (request) => {
  if (request.auth?.token?.role !== 'admin') {
    throw new HttpsError("permission-denied", "Chỉ có quản trị viên mới được phép xóa người dùng.");
  }
  const uid = request.data.uid;
  if (!uid) {
    throw new HttpsError("invalid-argument", "UID của người dùng là bắt buộc.");
  }
  try {
    await admin.auth().deleteUser(uid);
  } catch (error) {
    if (error.code !== 'auth/user-not-found') {
      console.error(`Error deleting user ${uid} from Auth:`, error);
      throw new HttpsError("internal", `Không thể xóa người dùng: ${error.message}`);
    }
  }
  await admin.firestore().collection('users').doc(uid).delete();
  return { message: `Đã xóa thành công người dùng ${uid}.` };
});

exports.deleteStudentByTeacher = onCall(async (request) => {
  if (request.auth?.token?.role !== 'teacher') {
    throw new HttpsError("permission-denied", "Chỉ có giáo viên mới được phép thực hiện hành động này.");
  }
  
  const teacherUid = request.auth.uid;
  const { studentId } = request.data;
  if (!studentId) {
    throw new HttpsError("invalid-argument", "Cần cung cấp ID của học sinh.");
  }

  const db = admin.firestore();
  
  const teacherDoc = await db.collection('users').doc(teacherUid).get();
  const studentDoc = await db.collection('users').doc(studentId).get();

  if (!teacherDoc.exists || !studentDoc.exists) {
    throw new HttpsError("not-found", "Không tìm thấy thông tin giáo viên hoặc học sinh.");
  }
  
  if (teacherDoc.data().groupId !== studentDoc.data().groupId) {
    throw new HttpsError("permission-denied", "Bạn không có quyền xóa học sinh không thuộc lớp của mình.");
  }
  
  try {
    const scoresQuery = db.collection('scores').where('userId', '==', studentId);
    const scoresSnapshot = await scoresQuery.get();
    const batch = db.batch();

    if (!scoresSnapshot.empty) {
        scoresSnapshot.forEach(doc => {
            batch.delete(doc.ref);
        });
    }

    const studentUserRef = db.collection('users').doc(studentId);
    batch.delete(studentUserRef);
    
    await batch.commit();

    await admin.auth().deleteUser(studentId);

  } catch (error) {
    console.error(`Lỗi nghiêm trọng khi xóa toàn bộ dữ liệu của học sinh ${studentId}:`, error);
    if (error.code === 'auth/user-not-found') {
        console.log(`Tài khoản Auth của học sinh ${studentId} không tìm thấy, có thể đã được xóa trước đó.`);
    } else {
        throw new HttpsError("internal", `Không thể xóa học sinh: ${error.message}`);
    }
  }

  return { message: "Đã xóa học sinh và tất cả dữ liệu liên quan thành công." };
});

exports.assignStudentToGroup = onCall(async (request) => {
  if (request.auth?.token?.role !== 'teacher') {
    throw new HttpsError("permission-denied", "Chỉ giáo viên mới có quyền gán học sinh vào lớp.");
  }
  const { studentId, groupId } = request.data;
  if (!studentId || !groupId) {
    throw new HttpsError("invalid-argument", "Cần cung cấp studentId và groupId.");
  }
  const callerUid = request.auth.uid;
  const db = admin.firestore();
  try {
    const groupDoc = await db.collection('groups').doc(groupId).get();
    
    if (!groupDoc.exists || groupDoc.data().teacherId !== callerUid) {
      throw new HttpsError("permission-denied", "Bạn không phải giáo viên của lớp này.");
    }
    
    await db.collection('users').doc(studentId).update({ 
      groupId: groupId,
      status: 'approved' 
    });
    return { success: true, message: "Đã gán học sinh vào lớp thành công." };
  } catch (error) {
    console.error(`Error assigning student ${studentId} to group ${groupId}:`, error);
    if (error instanceof HttpsError) throw error;
    throw new HttpsError("internal", "Đã xảy ra lỗi khi gán học sinh vào lớp.");
  }
});

// Các hàm tiện ích như parseTxtToQuizJson không cần thay đổi
const parseTxtToQuizJson = (txtContent) => {
  const quiz = { title: 'Chưa có tiêu đề', clusters: [] };
  const cleanContent = txtContent.split('\n').filter(line => !line.trim().startsWith('//')).join('\n');
  
  const getVal = (key, content = cleanContent) => {
    const match = content.match(new RegExp(`${key}:\\s*([\\s\\S]*?)(?=\\n[A-Z_]{2,}|CAU_HOI_KET_THUC|CUM_CAU_HOI_KET_THUC|$)`));
    return match ? match[1].trim() : null;
  };
  
  quiz.password = getVal('MAT_KHAU');
  quiz.title = getVal('TIEU_DE') || 'Chưa có tiêu đề';
  
  const clusterBlocks = cleanContent.split('CUM_CAU_HOI_BAT_DAU');
  clusterBlocks.slice(1).forEach(block => {
    const cluster = { commonAssumption: { intro: '', rules: [] }, questions: [] };
    const assumptionMatch = block.match(/GIA_THIET:\s*(.*)/);
    if (assumptionMatch) cluster.commonAssumption.intro = assumptionMatch[1].trim();
    const ruleMatches = [...block.matchAll(/QUY_TAC:\s*(.*)/g)];
    cluster.commonAssumption.rules = ruleMatches.map(match => match[1].trim());
    const questionBlocks = block.split('CAU_HOI_BAT_DAU');
    questionBlocks.slice(1).forEach(qBlock => {
      const question = { type: 'multiple_choice', choices: [] };
      question.questionText = getVal('CAU_HOI', qBlock);
      question.type = getVal('LOAI', qBlock) === 'DIEN_DAP_AN' ? 'fill_in_the_blank' : 'multiple_choice';
      if (question.type === 'multiple_choice') {
        const choiceMatches = [...qBlock.matchAll(/LUA_CHON:\s*([A-Z])\.\s*(.*)/g)];
        question.choices = choiceMatches.map(m => ({ value: m[1], text: m[2].trim() }));
      }
      question.correctAnswer = getVal('DAP_AN', qBlock);
      question.points_correct = Number(getVal('DIEM_DUNG', qBlock) || 10);
      question.points_incorrect = Number(getVal('DIEM_SAI', qBlock) || 0);
      question.penalty_minutes = Number(getVal('PHUT_PHAT', qBlock) || 0);
      question.show_solution = getVal('HIEN_GIAI', qBlock)?.toUpperCase() === 'CO';
      question.solution = getVal('LOI_GIAI', qBlock) || '';
      cluster.questions.push(question);
    });
    quiz.clusters.push(cluster);
  });
  return quiz;
};

exports.getLobbyDataBySlugHTTP = onRequest(async (req, res) => {
  return cors(req, res, async () => {
    try {
      // Chỉ chấp nhận POST request
      if (req.method !== 'POST') {
        res.status(405).json({ error: 'Method not allowed' });
        return;
      }

      const { slug } = req.body.data || req.body;
      
      if (!slug) {
        res.status(400).json({ error: 'Cần cung cấp slug của lớp học.' });
        return;
      }

      const db = admin.firestore();
      
      const groupsRef = db.collection('groups');
      const groupQuery = await groupsRef.where('slug', '==', slug).limit(1).get();

      if (groupQuery.empty) {
        res.status(404).json({ error: 'Không tìm thấy lớp học này.' });
        return;
      }

      const groupDoc = groupQuery.docs[0];
      const groupData = groupDoc.data();
      const groupId = groupDoc.id;

      let teacher = null;
      if (groupData.teacherId) {
        const teacherDoc = await db.collection('users').doc(groupData.teacherId).get();
        if (teacherDoc.exists) {
          const { displayName, photoURL } = teacherDoc.data();
          teacher = { id: teacherDoc.id, displayName, photoURL };
        }
      }

      const quizzesRef = db.collection('quizzes');
      const quizzesQuery = await quizzesRef.where('groupId', '==', groupId).get();
      
      const quizzes = await Promise.all(quizzesQuery.docs.map(async (doc) => {
          const data = doc.data();
          let questionCount = data.questionCount || 0;
          let questions = data.questions;

          if (questionCount === 0 && data.downloadURL && data.fileType) {
              try {
                  const response = await fetch(data.downloadURL);
                  if (!response.ok) throw new Error('Fetch file failed');
                  const content = await response.text();
                  let parsed;
                  if (data.fileType === 'txt') {
                      parsed = parseTxtToQuizJson(content);
                  } else {
                      parsed = JSON.parse(content);
                  }
                  questionCount = parsed.clusters 
                      ? parsed.clusters.reduce((sum, c) => sum + (c.questions?.length || 0), 0)
                      : (parsed.questions?.length || 0);
                  
                  if (!data.hasPassword) {
                      questions = parsed.clusters 
                          ? parsed.clusters.flatMap(c => c.questions || [])
                          : (parsed.questions || []);
                  }
                  await doc.ref.update({ questionCount });
              } catch (err) {
                  console.warn(`Lỗi đếm quiz ${doc.id}:`, err);
                  questionCount = 0;
              }
          }

          return {
              id: doc.id,
              title: data.title,
              description: data.description,
              questionCount,
              questions,
              downloadURL: data.downloadURL,
              fileType: data.fileType,
              hasPassword: data.hasPassword,
              openTime: data.openTime,
              closeTime: data.closeTime
          };
      }));

      const result = {
        groupId,
        welcomeMessage: groupData.welcomeMessage || null,
        teacher: teacher || { displayName: 'Chưa gán giáo viên' },
        teacherId: groupData.teacherId,
        quizzes
      };

      res.status(200).json({ data: result });

    } catch (error) {
      console.error(`Error fetching lobby data:`, error);
      res.status(500).json({ error: 'Đã xảy ra lỗi khi tải dữ liệu lớp học.' });
    }
  });
});

exports.processJoinRequest = onCall(async (request) => {
  if (request.auth?.token?.role !== 'teacher') {
    throw new HttpsError("permission-denied", "Chỉ giáo viên mới có quyền thực hiện hành động này.");
  }
  const { requestId, studentId, groupId, approve } = request.data;
  if (!requestId || !studentId || !groupId || approve === undefined) {
    throw new HttpsError("invalid-argument", "Thiếu thông tin để xử lý yêu cầu.");
  }
  const teacherUid = request.auth.uid;
  const db = admin.firestore();
  const groupDoc = await db.collection('groups').doc(groupId).get();
  const requestDocRef = db.collection('joinRequests').doc(requestId);
  
  if (!groupDoc.exists || groupDoc.data().teacherId !== teacherUid) {
    throw new HttpsError("permission-denied", "Bạn không có quyền xử lý yêu cầu cho lớp học này.");
  }
  
  const batch = db.batch();
  if (approve) {
    const studentDocRef = db.collection('users').doc(studentId);
    const studentDoc = await studentDocRef.get();
    if (!studentDoc.exists) {
        batch.update(requestDocRef, { status: 'rejected' });
        await batch.commit();
        throw new HttpsError("not-found", "Không tìm thấy thông tin của học sinh này, có thể đã bị xóa.");
    }
    batch.update(requestDocRef, { status: 'approved' });
    batch.update(studentDocRef, { groupId: groupId, status: 'approved' });
  } else {
    batch.update(requestDocRef, { status: 'rejected' });
  }
  try {
    await batch.commit();
    return { success: true, message: `Đã ${approve ? 'duyệt' : 'từ chối'} yêu cầu thành công.` };
  } catch (error) {
    console.error("Lỗi khi xử lý yêu cầu:", error);
    throw new HttpsError("internal", "Đã xảy ra lỗi khi cập nhật dữ liệu.");
  }
});

// Dán code này vào file functions/index.js để thay thế hàm deleteGroup cũ

exports.deleteGroup = onCall(async (request) => {
  if (request.auth?.token?.role !== 'admin') {
    throw new HttpsError("permission-denied", "Bạn không có quyền thực hiện hành động này.");
  }

  const { groupId } = request.data;
  if (!groupId) {
    throw new HttpsError("invalid-argument", "Cần cung cấp ID của lớp học.");
  }

  const db = admin.firestore();
  const batch = db.batch();

  const groupRef = db.collection('groups').doc(groupId);
  const groupDoc = await groupRef.get();

  if (!groupDoc.exists) {
    return { success: true, message: "Lớp học không tồn tại." };
  }

  const groupData = groupDoc.data();

  // ✨ THAY ĐỔI QUAN TRỌNG Ở ĐÂY ✨
  // Bỏ gán giáo viên khỏi lớp học (nếu giáo viên đó còn tồn tại)
  if (groupData.teacherId) {
    const teacherRef = db.collection('users').doc(groupData.teacherId);
    const teacherDoc = await teacherRef.get(); // Lấy thông tin giáo viên

    // Chỉ cập nhật nếu document của giáo viên thực sự tồn tại
    if (teacherDoc.exists) { 
      batch.update(teacherRef, { groupId: null }); 
      console.log(`Đã bỏ gán giáo viên ${groupData.teacherId} khỏi lớp ${groupId}.`);
    } else {
      console.log(`Giáo viên ${groupData.teacherId} không còn tồn tại, bỏ qua bước cập nhật.`);
    }
  }

  // Xóa lớp học
  batch.delete(groupRef);
  console.log(`Đã xóa lớp học ${groupId}.`);
  
  await batch.commit();

  return { success: true, message: "Đã xóa lớp học thành công." };
});

// ✨ DÒNG MỚI: Gộp các hàm OCR vào module exports chung
// Cách này đảm bảo tất cả các hàm trong ocrFunctions.js đều được deploy


