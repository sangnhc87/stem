const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { onDocumentCreated, onDocumentWritten } = require("firebase-functions/v2/firestore");
const admin = require("firebase-admin");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const db = admin.firestore();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
// ---------- DESKTOP : TẠO USER KHI NHẬP GMAIL ----------
exports.saveUserGmail = onCall(async (req) => {
  const { apiKey, gmail } = req.data;
  if (!apiKey || !gmail) throw new HttpsError("invalid-argument", "Thiếu apiKey hoặc gmail");
  // (tuỳ) validate apiKey bằng cách gọi Gemini 1 lần
  const uid = gmail.replace(/[@.]/g, "_");
  const trialEnd = new Date();
  trialEnd.setDate(trialEnd.getDate() + 180);
  await db.collection("users").doc(uid).set({
    email: gmail,
    trialExpiresAt: admin.firestore.Timestamp.fromDate(trialEnd),
    role: "user",
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  }, { merge: true });
  return { success: true };
});

// ---------- WEB : TẠO USER KHI ĐĂNG KÝ ----------
exports.createUserProfile = onDocumentCreated("users/{userId}", async (event) => {
  const snap = event.data;
  if (!snap) return;
  const { uid, email } = snap.data();
  const trialEnd = new Date();
  trialEnd.setDate(trialEnd.getDate() + 180);
  await snap.ref.update({
    trialExpiresAt: admin.firestore.Timestamp.fromDate(trialEnd),
    role: "user"
  });
});

// ---------- OCR ----------
exports.submitOcrRequest = onCall(async (req) => {
  if (!req.auth) throw new HttpsError("unauthenticated", "Cần đăng nhập");
  const uid = req.auth.uid;
  const { imageBase64, prompt } = req.data;
  const user = await db.collection("users").doc(uid).get();
  if (!user.exists) throw new HttpsError("not-found", "Không tìm thấy user");
  if (new Date() > user.data().trialExpiresAt.toDate()) throw new HttpsError("permission-denied", "Hết hạn dùng thử");
  const doc = await db.collection("ocr_requests").add({
    userId: uid,
    userEmail: req.auth.token.email || null,
    imageBase64,
    prompt,
    status: "pending",
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  });
  return { success: true, requestId: doc.id };
});

exports.processApprovedRequest = onDocumentWritten("ocr_requests/{docId}", async (event) => {
  if (!event.data?.after.exists) return;
  const before = event.data.before?.data();
  const after = event.data.after.data();
  if (after.status !== "approved" || before?.status === "approved") return;
  const { imageBase64, prompt } = after;
  const docRef = db.collection("ocr_requests").doc(event.params.docId);
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const imagePart = { inlineData: { data: imageBase64, mimeType: "image/png" } };
    const result = await model.generateContent([prompt, imagePart]);
    await docRef.update({
      status: "completed",
      resultText: result.response.text(),
      processedAt: admin.firestore.FieldValue.serverTimestamp()
    });
  } catch (e) {
    await docRef.update({ status: "error", errorMessage: e.message });
  }
});


exports.saveDevice = onCall(async (req) => {
  try {
    console.log("saveDevice invoked, data:", JSON.stringify(req.data, null, 2));
    const { apiKey, deviceId, gmail } = req.data;
    if (!apiKey || !deviceId) {
      throw new HttpsError("invalid-argument", "Thiếu apiKey hoặc deviceId");
    }
    const trialEnd = new Date();
    trialEnd.setDate(trialEnd.getDate() + 180);
    await db.collection("devices").doc(deviceId).set({
      gmail: gmail || null,
      trialExpiresAt: admin.firestore.Timestamp.fromDate(trialEnd),
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
    return { success: true };
  } catch (e) {
    console.error("saveDevice error:", e);
    throw new HttpsError("internal", e.message);
  }
});