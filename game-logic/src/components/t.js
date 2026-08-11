import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { auth, db, storage } from '../firebase';
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { useAuthState } from 'react-firebase-hooks/auth';
import { collection, query, where, onSnapshot, addDoc, doc, deleteDoc, getDocs, updateDoc, serverTimestamp } from 'firebase/firestore';

const Swal = window.Swal;

// Nội dung file mẫu để người dùng có thể tải về
const templateContent = `// MẪU SOẠN THẢO BỘ CÂU HỎI
// Ghi chú: Dòng bắt đầu bằng // sẽ được bỏ qua.
// Dùng === để ngăn cách các Cụm câu hỏi.
// Dùng --- để ngăn cách các Câu hỏi trong một Cụm.

TIEU_DE: Đề Thi Thử Logic Cuối Kỳ

===

// Cụm 1: Có giả thiết chung
CUM_CAU_HOI_BAT_DAU
    GIA_THIET: Đây là giả thiết chung cho cụm câu hỏi đầu tiên.
    QUY_TAC: Quy tắc 1 của giả thiết chung.
    QUY_TAC: Quy tắc 2 của giả thiết chung.

    ---

    // Câu 1.1: Trắc nghiệm
    CAU_HOI_BAT_DAU
        LOAI: TRAC_NGHIEM
        CAU_HOI: Đây là nội dung câu hỏi trắc nghiệm số 1.
        LUA_CHON: A. Lựa chọn A
        LUA_CHON: B. Lựa chọn B
        LUA_CHON: C. Lựa chọn C
        DAP_AN: B
        DIEM_DUNG: 10
        DIEM_SAI: -5
        PHUT_PHAT: 1
        HIEN_GIAI: CO
        LOI_GIAI: <p>Đây là lời giải chi tiết cho <b>câu hỏi 1</b>.</p>
    CAU_HOI_KET_THUC
CUM_CAU_HOI_KET_THUC`;

const TeacherDashboard = () => {
    const { teacherSlug } = useParams();
    const navigate = useNavigate();
    const [user] = useAuthState(auth);
    const [group, setGroup] = useState(null);
    const [quizzes, setQuizzes] = useState([]);
    const [students, setStudents] = useState([]);
    const [notification, setNotification] = useState('');
    const [activeTab, setActiveTab] = useState('quizzes');

    const showNotification = (message) => {
        setNotification(message);
        setTimeout(() => setNotification(''), 3000);
    };

    useEffect(() => {
        if (!user) return;
        const fetchGroupData = async () => {
            const groupsQuery = query(collection(db, 'groups'), where('slug', '==', teacherSlug), where('teacherId', '==', user.uid));
            const groupSnapshot = await getDocs(groupsQuery);

            if (!groupSnapshot.empty) {
                const groupDoc = groupSnapshot.docs[0];
                setGroup({ id: groupDoc.id, ...groupDoc.data() });
                
                const qQuery = query(collection(db, 'quizzes'), where('groupId', '==', groupDoc.id));
                const unsubQuizzes = onSnapshot(qQuery, (snap) => setQuizzes(snap.docs.map(d => ({id: d.id, ...d.data()}))));

                const sQuery = query(collection(db, 'users'), where('groupId', '==', groupDoc.id));
                const unsubStudents = onSnapshot(sQuery, (snap) => setStudents(snap.docs.map(d => ({id: d.id, ...d.data()}))));

                return () => { unsubQuizzes(); unsubStudents(); };
            }
        };
        fetchGroupData();
    }, [user, teacherSlug]);

    const handleDeleteQuiz = async (quizId, title, storagePath) => {
        const result = await Swal.fire({ title: `Xóa "${title}"?`, text: "Hành động này sẽ xóa cả file trên Storage!", icon: 'warning', showCancelButton: true, confirmButtonText: 'Vâng, xóa!' });
        if (result.isConfirmed) {
            await deleteDoc(doc(db, 'quizzes', quizId));
            if (storagePath) {
                const fileRef = ref(storage, storagePath);
                await deleteObject(fileRef).catch(e => console.warn("Lỗi khi xóa file trên Storage:", e));
            }
            Swal.fire('Đã xóa!', '', 'success');
        }
    };
    
    const handleStatusChange = async (studentId, newStatus) => {
        await updateDoc(doc(db, 'users', studentId), { status: newStatus });
        showNotification('Đã cập nhật trạng thái học viên.');
    };
    
    const parseTxtToQuizJson = (txtContent) => {
        const quiz = { title: 'Chưa có tiêu đề', clusters: [] };
        const cleanContent = txtContent.split('\n').filter(line => !line.trim().startsWith('//')).join('\n');
        const titleMatch = cleanContent.match(/TIEU_DE:\s*(.*)/);
        if (titleMatch) quiz.title = titleMatch[1].trim();
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
                const getVal = (key) => {
                    const match = qBlock.match(new RegExp(`${key}:\\s*([\\s\\S]*?)(?=\\n[A-Z_]{2,}|CAU_HOI_KET_THUC|CUM_CAU_HOI_KET_THUC|$)`));
                    return match ? match[1].trim() : null;
                }
                question.questionText = getVal('CAU_HOI');
                question.type = getVal('LOAI') === 'DIEN_DAP_AN' ? 'fill_in_the_blank' : 'multiple_choice';
                if (question.type === 'multiple_choice') {
                    const choiceMatches = [...qBlock.matchAll(/LUA_CHON:\s*([A-Z])\.\s*(.*)/g)];
                    question.choices = choiceMatches.map(m => ({ value: m[1], text: m[2].trim() }));
                }
                question.correctAnswer = getVal('DAP_AN');
                question.points_correct = Number(getVal('DIEM_DUNG') || 10);
                question.points_incorrect = Number(getVal('DIEM_SAI') || 0);
                question.penalty_minutes = Number(getVal('PHUT_PHAT') || 0);
                question.show_solution = getVal('HIEN_GIAI')?.toUpperCase() === 'CO';
                question.solution = getVal('LOI_GIAI') || '';
                cluster.questions.push(question);
            });
            quiz.clusters.push(cluster);
        });
        return quiz;
    };

    const validateQuizData = (quizData) => {
        const errors = [];
        let totalQuestions = 0;
        if (!quizData.title) errors.push("Thiếu TIEU_DE.");
        if (!quizData.clusters || quizData.clusters.length === 0) errors.push("Không tìm thấy CUM_CAU_HOI_BAT_DAU nào.");
        else {
            quizData.clusters.forEach((cluster, cIdx) => {
                if (!cluster.questions || cluster.questions.length === 0) errors.push(`Cụm ${cIdx + 1}: Không có CAU_HOI_BAT_DAU.`);
                else {
                    cluster.questions.forEach((q, qIdx) => {
                        totalQuestions++;
                        const label = `Cụm ${cIdx + 1}, Câu ${qIdx + 1}`;
                        if (!q.questionText) errors.push(`${label}: Thiếu CAU_HOI.`);
                        if (!q.correctAnswer) errors.push(`${label}: Thiếu DAP_AN.`);
                        if ((q.type === 'multiple_choice' || !q.type) && q.choices.length < 2) errors.push(`${label}: Trắc nghiệm phải có ít nhất 2 LUA_CHON.`);
                    });
                }
            });
        }
        return { totalQuestions, errors };
    };

    const handleUploadQuiz = (event) => {
        const file = event.target.files[0];
        if (!file || !group) return;
        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                let quizDataForValidation;
                if (file.name.endsWith('.txt') || file.name.endsWith('.tex')) { quizDataForValidation = parseTxtToQuizJson(e.target.result); }
                else if (file.name.endsWith('.json')) { quizDataForValidation = JSON.parse(e.target.result); }
                else { throw new Error("Định dạng file không hỗ trợ."); }

                const validation = validateQuizData(quizDataForValidation);
                let confirmationHtml = `<div class="text-start"><p><strong>Tiêu đề:</strong> ${quizDataForValidation.title}</p><p><strong>Tổng số câu hỏi:</strong> ${validation.totalQuestions}</p>`;
                if (validation.errors.length > 0) {
                    confirmationHtml += `<p class="text-danger"><strong>Phát hiện ${validation.errors.length} lỗi:</strong></p><ul>${validation.errors.map(err => `<li>${err}</li>`).join('')}</ul>`;
                } else {
                    confirmationHtml += `<p class="text-success"><strong>Không tìm thấy lỗi nào.</strong></p>`;
                }
                confirmationHtml += `</div>`;
                
                const result = await Swal.fire({ title: `Kiểm tra file`, html: confirmationHtml, icon: validation.errors.length > 0 ? 'warning' : 'success', showCancelButton: true, confirmButtonText: 'Vâng, Tải lên!', cancelButtonText: 'Hủy' });

                if (result.isConfirmed) {
                    Swal.fire({ title: 'Đang tải lên...', didOpen: () => Swal.showLoading() });
                    const storageRef = ref(storage, `quizzes/${group.id}/${Date.now()}_${file.name}`);
                    const snapshot = await uploadBytes(storageRef, file);
                    const downloadURL = await getDownloadURL(snapshot.ref);

                    await addDoc(collection(db, 'quizzes'), { 
                        title: quizDataForValidation.title,
                        downloadURL: downloadURL,
                        storagePath: snapshot.metadata.fullPath,
                        fileType: file.name.endsWith('.txt') ? 'txt' : 'json',
                        groupId: group.id, 
                        authorId: user.uid, 
                        createdAt: serverTimestamp() 
                    });
                    Swal.close();
                    showNotification(`Đã tải lên thành công: "${quizDataForValidation.title}"!`);
                }
            } catch (error) {
                Swal.fire('Lỗi!', `Có lỗi xảy ra: ${error.message}`, 'error');
            }
        };
        reader.readAsText(file);
        event.target.value = null;
    };

    if (!group) return <div className="screen-container"><h1>Xác thực...</h1></div>;

    const studentLink = `${window.location.origin}/${teacherSlug}`;

    return (
        <div>
            <div className="d-flex justify-content-between align-items-center mb-4"><h1 className="mb-0">Trang quản lý: {group.name}</h1><Link to={`/${teacherSlug}`} className="btn btn-outline-primary"><i className="fa-solid fa-eye me-2"></i>Xem trang học sinh</Link></div>
            {notification && ( <div className="alert alert-success">{notification}</div> )}
            <div className="alert alert-info"><strong>Link cho học sinh:</strong> <a href={studentLink} target="_blank" rel="noopener noreferrer">{studentLink}</a><button className="btn btn-sm btn-outline-secondary ms-2" onClick={() => { navigator.clipboard.writeText(studentLink); showNotification('Đã sao chép link!'); }}>Sao chép</button></div>
            <ul className="nav nav-pills mb-3">
                <li className="nav-item"><button className={`nav-link ${activeTab === 'quizzes' ? 'active' : ''}`} onClick={() => setActiveTab('quizzes')}>Quản lý Câu hỏi</button></li>
                <li className="nav-item"><button className={`nav-link ${activeTab === 'students' ? 'active' : ''}`} onClick={() => setActiveTab('students')}>Quản lý Học viên</button></li>
            </ul>
            {activeTab === 'quizzes' && (
                <div className="card"><div className="card-body">
                    <div className="d-flex justify-content-between align-items-center mb-3"><h5 className="card-title mb-0">Kho câu hỏi của bạn</h5><button className="btn btn-success" onClick={() => navigate(`/dashboard/${teacherSlug}/quiz/new`)}><i className="fa-solid fa-plus me-2"></i>Soạn Bộ câu hỏi mới</button></div>
                    <p>Sử dụng trình soạn thảo hoặc tải lên file <code>.txt</code>, <code>.json</code>.</p>
                    <table className="table">
                        <thead><tr><th>Tên bộ câu hỏi</th><th className="text-end">Hành động</th></tr></thead>
                        <tbody>
                            {quizzes.map(q => (<tr key={q.id}><td>{q.title}</td><td className="text-end"><button className="btn btn-sm btn-warning me-2" onClick={() => navigate(`/dashboard/${teacherSlug}/quiz/${q.id}`)}>Sửa</button><button className="btn btn-sm btn-danger" onClick={() => handleDeleteQuiz(q.id, q.title, q.storagePath)}>Xóa</button></td></tr>))}
                        </tbody>
                    </table>
                    <div className="mt-3">
                        <label htmlFor="quizUpload" className="btn btn-info"><i className="fa-solid fa-upload me-2"></i>Tải lên từ file</label>
                        <button className="btn btn-outline-secondary ms-2" onClick={() => { const blob = new Blob([templateContent], { type: 'text/plain;charset=utf-8' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'mau_soan_thao.txt'; a.click(); URL.revokeObjectURL(url); }}><i className="fa-solid fa-download me-2"></i>Tải file mẫu (.txt)</button>
                    </div>
                    <input type="file" id="quizUpload" accept=".json,.txt,.tex" style={{display: 'none'}} onChange={handleUploadQuiz} />
                </div></div>
            )}
            {activeTab === 'students' && (
                <div className="card"><div className="card-body">
                    <h5 className="card-title">Danh sách học viên trong lớp</h5>
                    <div className="table-responsive"><table className="table table-hover align-middle">
                        <thead><tr><th>Học viên</th><th>Trạng thái</th></tr></thead>
                        <tbody>
                            {students.map(student => (<tr key={student.id}><td><img src={student.photoURL} alt={student.displayName} width="30" height="30" className="rounded-circle me-2" />{student.email}</td><td><select className="form-select form-select-sm" value={student.status} onChange={(e) => handleStatusChange(student.id, e.target.value)}><option value="pending">Chờ duyệt</option><option value="approved">Đã chấp nhận</option><option value="banned">Đã cấm</option></select></td></tr>))}
                        </tbody>
                    </table></div>
                </div></div>
            )}
        </div>
    );
};
export default TeacherDashboard;

