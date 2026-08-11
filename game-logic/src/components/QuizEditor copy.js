import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db, auth, storage } from '../firebase';
import { ref, uploadBytes, getDownloadURL, deleteObject, uploadString } from "firebase/storage";
import { useAuthState } from 'react-firebase-hooks/auth';
import { doc, getDoc, setDoc, addDoc, collection, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';

const Swal = window.Swal;
const mammoth = window.mammoth; // Thư viện đọc file .docx
const docx = window.docx; // Thư viện tạo file .docx
const XLSX = window.XLSX; // Thư viện tạo file .xlsx

// --- Cấu trúc dữ liệu mặc định ---
const emptyQuestion = { type: 'multiple_choice', questionText: '', imageUrl: null, choices: [{ text: '', value: 'A', imageUrl: null }, { text: '', value: 'B', imageUrl: null }], correctAnswer: 'A', points_correct: 10, points_incorrect: 0, penalty_minutes: 0, show_solution: true, solution: '' };
const emptyOrderingItem = { id: Date.now(), text: '' };
const emptyCluster = { id: Date.now(), isCollapsed: false, commonAssumption: { intro: '', rules: [''] }, questions: [JSON.parse(JSON.stringify(emptyQuestion))] };

// --- Component con để render từng câu hỏi ---
const QuestionEditor = ({ q, cIdx, qIdx, handlers, questionCount }) => {
    const { 
        handleQuestionTypeChange, handleQuestionChange, handleImageFileChange,
        handleRemoveImage, 
        handleChoiceChange, handleRemoveChoice, handleAddChoice,
        handleOrderingItemChange, handleRemoveOrderingItem, handleAddOrderingItem,
        handleRemoveQuestion 
    } = handlers;

    const quillModules = {
        toolbar: [
            [{ 'header': [1, 2, 3, false] }],
            ['bold', 'italic', 'underline', 'strike', 'blockquote'],
            [{'list': 'ordered'}, {'list': 'bullet'}, {'indent': '-1'}, {'indent': '+1'}],
            ['link', 'image'],
            ['clean']
        ],
    };

    return (
        <div className="card question-card mb-3 p-3 border-primary shadow-sm">
            <div className="d-flex justify-content-between align-items-center mb-3">
                <h6 className="mb-0 text-primary fw-bold">Câu hỏi {qIdx + 1}</h6>
                <div className="d-flex align-items-center">
                    <div className="me-3">
                        <label className="me-2 small text-muted">Loại câu hỏi:</label>
                        <select className="form-select form-select-sm d-inline-block w-auto border-primary" value={q.type || 'multiple_choice'} onChange={e => handleQuestionTypeChange(cIdx, qIdx, e.target.value)}>
                            <option value="multiple_choice">Trắc nghiệm</option>
                            <option value="fill_in_the_blank">Điền đáp án</option>
                            <option value="ordering">Sắp xếp thứ tự</option>
                        </select>
                    </div>
                    {questionCount > 1 && (
                         <button 
                            className="btn btn-sm btn-outline-danger" 
                            onClick={() => handleRemoveQuestion(cIdx, qIdx)}>
                            <i className="fa-solid fa-trash-can me-1"></i> Xoá câu hỏi
                        </button>
                    )}
                </div>
            </div>

            <div className="field-group">
                <label className="fw-bold text-dark">Nội dung câu hỏi</label>
                <ReactQuill 
                    theme="snow" 
                    value={q.questionText} 
                    onChange={value => handleQuestionChange(cIdx, qIdx, 'questionText', value)} 
                    placeholder="Nhập nội dung câu hỏi tại đây..."
                    modules={quillModules}
                />
            </div>
            
            <div className="field-group">
                {q.imageUrl && <img src={q.imageUrl} alt="Xem trước" className="img-fluid rounded mb-2 border-primary" style={{ maxHeight: '200px' }} />}
                <label htmlFor={`image-upload-${cIdx}-${qIdx}`} className="btn btn-sm btn-outline-primary"><i className="fa-solid fa-image me-2"></i> {q.imageUrl ? 'Thay đổi ảnh' : 'Tải lên ảnh cho câu hỏi'}</label>
                <input type="file" id={`image-upload-${cIdx}-${qIdx}`} accept="image/*" style={{ display: 'none' }} onChange={(e) => handleImageFileChange(e, cIdx, qIdx)}/>
                {q.imageUrl && (
                    <button className="btn btn-sm btn-outline-danger ms-2" onClick={() => handleRemoveImage(cIdx, qIdx)}>
                        <i className="fa-solid fa-xmark me-1"></i> Xoá ảnh
                    </button>
                )}
            </div>

            {(q.type === 'multiple_choice' || !q.type) && (
                <div className="field-group">
                    <label className="fw-bold text-dark">Các lựa chọn</label>
                    {q.choices.map((ch, chIdx) => (
                        <div key={chIdx} className="p-2 border rounded mb-2 bg-light border-primary">
                            <div className="input-group">
                                <span className="input-group-text bg-primary text-white">{ch.value}</span>
                                <input type="text" className="form-control border-primary" value={ch.text} onChange={e => handleChoiceChange(cIdx, qIdx, chIdx, 'text', e.target.value)} placeholder="Nội dung lựa chọn" />
                                {q.choices.length > 2 && <button className="btn btn-outline-danger" type="button" onClick={() => handleRemoveChoice(cIdx, qIdx, chIdx)}>Xóa</button>}
                            </div>
                            <div className='mt-2'>
                                {ch.imageUrl && <img src={ch.imageUrl} alt="Xem trước" className="img-fluid rounded me-2 border-primary" style={{ maxHeight: '100px' }} />}
                            </div>
                            <div className='mt-2'>
                                <label htmlFor={`choice-image-${cIdx}-${qIdx}-${chIdx}`} className="btn btn-sm btn-outline-primary mt-1"><i className="fa-solid fa-image me-1"></i> {ch.imageUrl ? 'Đổi ảnh' : 'Tải ảnh cho lựa chọn'}</label>
                                <input type="file" id={`choice-image-${cIdx}-${qIdx}-${chIdx}`} accept="image/*" style={{ display: 'none' }} onChange={(e) => handleImageFileChange(e, cIdx, qIdx, chIdx)}/>
                                {ch.imageUrl && (
                                    <button className="btn btn-sm btn-outline-danger mt-1 ms-2" onClick={() => handleRemoveImage(cIdx, qIdx, chIdx)}>
                                        <i className="fa-solid fa-xmark me-1"></i> Xoá ảnh
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                    <button className="btn btn-sm btn-outline-primary" onClick={() => handleAddChoice(cIdx, qIdx)}>Thêm lựa chọn</button>
                    <div className="row g-2 align-items-center mt-2">
                        <div className="col-auto"><label className="fw-medium text-dark">Đáp án đúng:</label></div>
                        <div className="col-auto"><select className="form-select form-select-sm border-primary" value={q.correctAnswer} onChange={e => handleQuestionChange(cIdx, qIdx, 'correctAnswer', e.target.value)}>{q.choices.map(ch => <option key={ch.value} value={ch.value}>{ch.value}</option>)}</select></div>
                    </div>
                </div>
            )}

            {q.type === 'fill_in_the_blank' && (
                <div className="field-group"><label className="fw-bold text-dark">Đáp án đúng</label><input type="text" className="form-control border-primary" value={q.correctAnswer || ''} onChange={e => handleQuestionChange(cIdx, qIdx, 'correctAnswer', e.target.value)} /><small className="form-text text-muted">Nếu có nhiều đáp án đúng, ngăn cách bằng dấu phẩy (VD: 20,XX).</small></div>
            )}

            {q.type === 'ordering' && (
                <div className="field-group"><label className="fw-bold text-dark">Các đối tượng cần sắp xếp</label><small className="form-text d-block text-muted mb-2">Nhập các đối tượng theo thứ tự đúng. Khi chơi, chúng sẽ được xáo trộn.</small>{q.orderingItems.map((item, itemIdx) => (<div key={item.id} className="input-group mb-2"><span className="input-group-text bg-secondary text-white">{itemIdx + 1}.</span><input type="text" className="form-control border-primary" value={item.text} onChange={e => handlers.handleOrderingItemChange(cIdx, qIdx, itemIdx, e.target.value)} /><button className="btn btn-outline-danger" type="button" onClick={() => handlers.handleRemoveOrderingItem(cIdx, qIdx, itemIdx)}>Xóa</button></div>))}<button className="btn btn-sm btn-outline-secondary" onClick={() => handlers.handleAddOrderingItem(cIdx, qIdx)}>Thêm đối tượng</button></div>
            )}

            <hr />
            <div className="row g-3 align-items-center"><div className="col-auto"><label className="fw-medium text-dark">Điểm đúng:</label></div><div className="col-auto"><input type="number" className="form-control form-control-sm border-primary" style={{width: '70px'}} value={q.points_correct} onChange={e => handleQuestionChange(cIdx, qIdx, 'points_correct', Number(e.target.value))} /></div><div className="col-auto"><label className="fw-medium text-dark">Điểm sai:</label></div><div className="col-auto"><input type="number" className="form-control form-control-sm border-primary" style={{width: '70px'}} value={q.points_incorrect} onChange={e => handleQuestionChange(cIdx, qIdx, 'points_incorrect', Number(e.target.value))} /></div><div className="col-auto"><label className="fw-medium text-dark">Phút phạt:</label></div><div className="col-auto"><input type="number" className="form-control form-control-sm border-primary" style={{width: '70px'}} value={q.penalty_minutes} onChange={e => handleQuestionChange(cIdx, qIdx, 'penalty_minutes', Number(e.target.value))} /></div><div className="col-auto form-check form-switch"><input type="checkbox" className="form-check-input" checked={q.show_solution} onChange={e => handleQuestionChange(cIdx, qIdx, 'show_solution', e.target.checked)} id={`sol_${cIdx}_${qIdx}`} /><label className="form-check-label fw-medium text-dark" htmlFor={`sol_${cIdx}_${qIdx}`}>Hiện lời giải</label></div></div>
            {q.show_solution && <div className="field-group mt-2"><label className="fw-bold text-dark">Nội dung lời giải</label><ReactQuill theme="snow" value={q.solution} onChange={value => handleQuestionChange(cIdx, qIdx, 'solution', value)} placeholder="Giải thích đáp án..." modules={quillModules}/></div>}
        </div>
    );
};


// --- Component chính ---
const QuizEditor = () => {
    const { quizId, teacherSlug } = useParams();
    const navigate = useNavigate();
    const [user] = useAuthState(auth);
    const [quiz, setQuiz] = useState({ title: '', password: '', clusters: [JSON.parse(JSON.stringify(emptyCluster))] });
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [groupId, setGroupId] = useState(null);
    const [originalStoragePath, setOriginalStoragePath] = useState(null);
    const [isPasswordEnabled, setIsPasswordEnabled] = useState(false);
    const [isTimeGated, setIsTimeGated] = useState(false);
    const [openTime, setOpenTime] = useState('');
    const [closeTime, setCloseTime] = useState('');

    const formatTimestampForInput = (timestamp) => {
        if (!timestamp) return '';
        const date = timestamp.toDate();
        const pad = (num) => num.toString().padStart(2, '0');
        return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
    };

    useEffect(() => {
        if (!user) return;
        const initializeEditor = async () => {
            try {
                let currentGroupId = null;
                if (teacherSlug) {
                    const groupsQuery = query(collection(db, 'groups'), where('slug', '==', teacherSlug));
                    const groupSnapshot = await getDocs(groupsQuery);
                    if (!groupSnapshot.empty) {
                        currentGroupId = groupSnapshot.docs[0].id;
                        setGroupId(currentGroupId);
                    }
                }

                if (quizId) {
                    const quizMetaRef = doc(db, 'quizzes', quizId);
                    const quizMetaSnap = await getDoc(quizMetaRef);
                    if (quizMetaSnap.exists()) {
                        const metaData = quizMetaSnap.data();
                        setOriginalStoragePath(metaData.storagePath);
                        
                        const response = await fetch(metaData.downloadURL);
                        const quizContent = await response.json();
                        setQuiz(quizContent);

                        if (quizContent.password && quizContent.password.length > 0) {
                            setIsPasswordEnabled(true);
                        }
                        
                        if (metaData.openTime || metaData.closeTime) {
                            setIsTimeGated(true);
                            setOpenTime(formatTimestampForInput(metaData.openTime));
                            setCloseTime(formatTimestampForInput(metaData.closeTime));
                        }
                    } else {
                        Swal.fire('Lỗi', 'Không tìm thấy bộ câu hỏi này.', 'error');
                        navigate(teacherSlug ? `/dashboard/${teacherSlug}` : '/admin');
                    }
                }
            } catch (error) {
                console.error("Lỗi khởi tạo:", error);
                Swal.fire('Lỗi', 'Không thể tải dữ liệu soạn thảo.', 'error');
            } finally {
                setLoading(false);
            }
        };
        initializeEditor();
    }, [quizId, teacherSlug, user, navigate]);

    // ... (Giữ nguyên các hàm parse và upload file)
    const parseSmartTxtToQuizJson = (txt) => { /* ... */ };
    const parseCsvToQuizJson = (csv) => { /* ... */ };
    const parseDocxToQuizJson = async (arrayBuffer) => { /* ... */ };
    const adaptParsedToEditorFormat = (parsedQuiz) => { /* ... */ };
    const handleUploadQuiz = async (event) => { /* ... */ };

    const handlers = {
        handleQuizChange: (field, value) => setQuiz(p => ({ ...p, [field]: value })),
        handleAddCluster: () => setQuiz(p => ({ ...p, clusters: [...p.clusters, { ...JSON.parse(JSON.stringify(emptyCluster)), id: Date.now() }] })),
        handleRemoveCluster: (cIdx) => {
            Swal.fire({
                title: 'Bạn chắc chắn?',
                text: "Bạn sẽ không thể hoàn tác hành động này!",
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#d33',
                cancelButtonColor: '#3085d6',
                confirmButtonText: 'Vâng, xoá nó!',
                cancelButtonText: 'Huỷ'
            }).then((result) => {
                if (result.isConfirmed) {
                    setQuiz(p => ({ ...p, clusters: p.clusters.filter((_, i) => i !== cIdx) }));
                }
            });
        },
        handleToggleCluster: (cIdx) => { const nc = [...quiz.clusters]; nc[cIdx].isCollapsed = !nc[cIdx].isCollapsed; setQuiz(p => ({...p, clusters: nc})); },
        handleAssumptionChange: (cIdx, field, value) => { const nc = [...quiz.clusters]; nc[cIdx].commonAssumption[field] = value; setQuiz(p => ({ ...p, clusters: nc })); },
        handleRuleChange: (cIdx, rIdx, value) => { const nc = [...quiz.clusters]; nc[cIdx].commonAssumption.rules[rIdx] = value; setQuiz(p => ({ ...p, clusters: nc })); },
        handleAddRule: (cIdx) => { const nc = [...quiz.clusters]; nc[cIdx].commonAssumption.rules.push(''); setQuiz(p => ({ ...p, clusters: nc })); },
        handleRemoveRule: (cIdx, rIdx) => { const nc = [...quiz.clusters]; nc[cIdx].commonAssumption.rules.splice(rIdx, 1); setQuiz(p => ({ ...p, clusters: nc })); },
        handleQuestionChange: (cIdx, qIdx, field, value) => { const nc = [...quiz.clusters]; nc[cIdx].questions[qIdx][field] = value; setQuiz(p => ({ ...p, clusters: nc })); },
        handleAddQuestion: (cIdx) => { const nc = [...quiz.clusters]; nc[cIdx].questions.push(JSON.parse(JSON.stringify(emptyQuestion))); setQuiz(p => ({ ...p, clusters: nc })); },
        
        handleRemoveQuestion: (cIdx, qIdx) => {
            const nc = [...quiz.clusters];
            if (nc[cIdx].questions.length > 1) {
                nc[cIdx].questions.splice(qIdx, 1);
                setQuiz(p => ({ ...p, clusters: nc }));
            } else {
                Swal.fire('Không thể xoá', 'Mỗi cụm phải có ít nhất một câu hỏi.', 'info');
            }
        },

        handleChoiceChange: (cIdx, qIdx, chIdx, field, value) => { const nc = [...quiz.clusters]; nc[cIdx].questions[qIdx].choices[chIdx][field] = value; setQuiz(p => ({ ...p, clusters: nc })); },
        handleAddChoice: (cIdx, qIdx) => { const nc = [...quiz.clusters]; const newChar = String.fromCharCode(65 + nc[cIdx].questions[qIdx].choices.length); nc[cIdx].questions[qIdx].choices.push({ text: '', value: newChar, imageUrl: null }); setQuiz(p => ({...p, clusters: nc})); },
        handleRemoveChoice: (cIdx, qIdx, chIdx) => {
             const nc = [...quiz.clusters];
             if (nc[cIdx].questions[qIdx].choices.length > 2) {
                nc[cIdx].questions[qIdx].choices.splice(chIdx, 1);
                setQuiz(p => ({ ...p, clusters: nc }));
             } else {
                Swal.fire('Không thể xoá', 'Câu hỏi trắc nghiệm phải có ít nhất 2 lựa chọn.', 'info');
             }
        },
        handleOrderingItemChange: (cIdx, qIdx, itemIdx, value) => { const nc = [...quiz.clusters]; nc[cIdx].questions[qIdx].orderingItems[itemIdx].text = value; setQuiz(p => ({...p, clusters: nc})); },
        handleAddOrderingItem: (cIdx, qIdx) => { const nc = [...quiz.clusters]; nc[cIdx].questions[qIdx].orderingItems.push({ ...emptyOrderingItem, id: Date.now() }); setQuiz(p => ({...p, clusters: nc})); },
        handleRemoveOrderingItem: (cIdx, qIdx, itemIdx) => { const nc = [...quiz.clusters]; nc[cIdx].questions[qIdx].orderingItems.splice(itemIdx, 1); setQuiz(p => ({...p, clusters: nc})); },
        handleQuestionTypeChange: (cIdx, qIdx, newType) => {
            const nc = [...quiz.clusters]; const q = nc[cIdx].questions[qIdx]; q.type = newType;
            if (newType === 'multiple_choice') { q.choices = [{ text: '', value: 'A', imageUrl: null }, { text: '', value: 'B', imageUrl: null }]; q.correctAnswer = 'A'; delete q.orderingItems; }
            else if (newType === 'fill_in_the_blank') { delete q.choices; delete q.orderingItems; q.correctAnswer = ''; }
            else if (newType === 'ordering') { delete q.choices; q.orderingItems = [{ ...emptyOrderingItem, id: Date.now() }, { ...emptyOrderingItem, id: Date.now()+1 }]; delete q.correctAnswer; }
            setQuiz(p => ({ ...p, clusters: nc }));
        },
        handleImageFileChange: (e, cIdx, qIdx, chIdx = null) => {
            const file = e.target.files[0]; if (!file) return; const nc = [...quiz.clusters]; const tempUrl = URL.createObjectURL(file);
            if (chIdx !== null) { nc[cIdx].questions[qIdx].choices[chIdx].imageFile = file; nc[cIdx].questions[qIdx].choices[chIdx].imageUrl = tempUrl; }
            else { nc[cIdx].questions[qIdx].imageFile = file; nc[cIdx].questions[qIdx].imageUrl = tempUrl; }
            setQuiz(p => ({ ...p, clusters: nc }));
        },
        handleRemoveImage: (cIdx, qIdx, chIdx = null) => {
            const nc = [...quiz.clusters];
            if (chIdx !== null) {
                nc[cIdx].questions[qIdx].choices[chIdx].imageFile = null;
                nc[cIdx].questions[qIdx].choices[chIdx].imageUrl = null;
            } else {
                nc[cIdx].questions[qIdx].imageFile = null;
                nc[cIdx].questions[qIdx].imageUrl = null;
            }
            setQuiz(p => ({ ...p, clusters: nc }));
        }
    };
    
    const compressAndUploadImage = (file) => {
        return new Promise((resolve, reject) => {
            if (!file) {
                return resolve(null);
            }
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = event => {
                const img = new Image();
                img.src = event.target.result;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const MAX_WIDTH = 800;
                    const scaleSize = Math.min(1, MAX_WIDTH / img.width);
                    canvas.width = img.width * scaleSize;
                    canvas.height = img.height * scaleSize;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                    canvas.toBlob(async (blob) => {
                        const storageRef = ref(storage, `quiz_images/${user.uid}/${Date.now()}.webp`);
                        try {
                            const snapshot = await uploadBytes(storageRef, blob);
                            const downloadURL = await getDownloadURL(snapshot.ref);
                            resolve(downloadURL);
                        } catch (error) {
                            reject(error);
                        }
                    }, 'image/webp', 0.8);
                };
                img.onerror = error => reject(error);
            };
            reader.onerror = error => reject(error);
        });
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            if (isTimeGated && openTime && closeTime && new Date(closeTime) < new Date(openTime)) {
                Swal.fire('Lỗi Cài đặt', 'Thời gian đóng không được trước thời gian mở. Vui lòng kiểm tra lại.', 'error');
                setIsSaving(false);
                return;
            }
            
            let quizToSave = JSON.parse(JSON.stringify(quiz));

            if (!isPasswordEnabled || !quizToSave.password?.trim()) {
                delete quizToSave.password;
            } else {
                quizToSave.password = quizToSave.password.trim();
            }

            for (const [cIdx, cluster] of quizToSave.clusters.entries()) {
                for (const [qIdx, question] of cluster.questions.entries()) {
                    const originalQFile = quiz.clusters[cIdx].questions[qIdx].imageFile;
                    if (originalQFile) {
                        question.imageUrl = await compressAndUploadImage(originalQFile);
                    }
                    delete question.imageFile;

                    if (question.choices) {
                        for (const [chIdx, choice] of question.choices.entries()) {
                            const originalChFile = quiz.clusters[cIdx].questions[qIdx].choices[chIdx].imageFile;
                            if (originalChFile) {
                                choice.imageUrl = await compressAndUploadImage(originalChFile);
                            }
                            delete choice.imageFile;
                        }
                    }
                }
            }

            // ✅ BƯỚC 1: ĐẾM TỔNG SỐ CÂU HỎI
            const totalQuestions = quizToSave.clusters.reduce(
                (count, cluster) => count + cluster.questions.length, 
                0
            );

            const jsonString = JSON.stringify(quizToSave);
            
            if (quizId && originalStoragePath) {
                await deleteObject(ref(storage, originalStoragePath)).catch(e => console.warn("Bỏ qua lỗi xóa file cũ:", e));
            }
            
            const newStoragePath = `quizzes/${groupId || 'public'}/${Date.now()}.json`;
            const storageRef = ref(storage, newStoragePath);
            await uploadString(storageRef, jsonString, 'raw', { contentType: 'application/json' });
            const downloadURL = await getDownloadURL(storageRef);

            const finalPayload = { 
                title: quizToSave.title, 
                hasPassword: !!quizToSave.password,

                // ✅ BƯỚC 2: THÊM SỐ CÂU HỎI VÀO DỮ LIỆU LƯU TRỮ
                questionCount: totalQuestions,

                openTime: isTimeGated && openTime ? new Date(openTime) : null,
                closeTime: isTimeGated && closeTime ? new Date(closeTime) : null,
                downloadURL, 
                storagePath: newStoragePath, 
                fileType: 'json', 
                authorId: user.uid, 
                groupId: groupId 
            };
            
            if (quizId) {
                await setDoc(doc(db, 'quizzes', quizId), { ...finalPayload, updatedAt: serverTimestamp() }, { merge: true });
            } else {
                await addDoc(collection(db, 'quizzes'), { ...finalPayload, createdAt: serverTimestamp() });
            }

            Swal.fire('Thành công!', 'Đã lưu bộ câu hỏi.', 'success');
            navigate(teacherSlug ? `/dashboard/${teacherSlug}` : '/admin');

        } catch (error) {
            Swal.fire('Lỗi!', `Có lỗi xảy ra khi lưu: ${error.message}`, 'error');
        } finally {
            setIsSaving(false);
        }
    };
    
    if (loading) return <div className="screen-container d-flex justify-content-center align-items-center vh-100"><div className="spinner-border text-primary" role="status"><span className="visually-hidden">Loading...</span></div></div>;
    
    return (
        <div className="quiz-editor container py-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h1 className="mb-0 fw-bold text-primary">{quizId ? 'Chỉnh sửa' : 'Soạn'} Bộ câu hỏi</h1>
                <div className="d-flex align-items-center gap-2">
                    <label htmlFor="quizUpload" className="btn btn-outline-primary">
                        <i className="fa-solid fa-upload me-2"></i>Tải lên từ file
                    </label>
                    <input type="file" id="quizUpload" accept=".json,.txt,.csv,.docx,.xlsx,.xls" style={{display: 'none'}} onChange={handleUploadQuiz} />
                    <button className="btn btn-primary" onClick={handleSave} disabled={isSaving}>
                        {isSaving ? <><span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Đang lưu...</> : <><i className="fa-solid fa-save me-2"></i>Lưu bộ câu hỏi</>}
                    </button>
                    <button className="btn btn-outline-secondary" onClick={() => navigate(teacherSlug ? `/dashboard/${teacherSlug}` : '/admin')}>Quay lại</button>
                </div>
            </div>
            
            <div className="card mb-4 border-primary shadow-sm">
                <div className="card-header bg-primary text-white">Thông tin chung & Cài đặt</div>
                <div className="card-body">
                    <div className="field-group">
                        <label className="fw-bold text-dark">Tên Bộ câu hỏi</label>
                        <input type="text" className="form-control border-primary form-control-lg" value={quiz.title} onChange={(e) => handlers.handleQuizChange('title', e.target.value)} placeholder="VD: Đề thi Logic cuối kỳ" />
                    </div>

                    <div className="mt-3 pt-3 border-top">
                        <div className="form-check form-switch mb-2">
                            <input className="form-check-input" type="checkbox" role="switch" id="passwordSwitch" checked={isPasswordEnabled} onChange={e => {setIsPasswordEnabled(e.target.checked); if (!e.target.checked) { handlers.handleQuizChange('password', ''); }}} />
                            <label className="form-check-label fw-medium" htmlFor="passwordSwitch">Yêu cầu mật khẩu để làm bài</label>
                        </div>
                        {isPasswordEnabled && (
                            <div className="mt-2" style={{ maxWidth: '400px' }}>
                                <label htmlFor="quizPassword">Nhập mật khẩu:</label>
                                <input type="text" id="quizPassword" className="form-control border-primary" placeholder="Mật khẩu..." value={quiz.password || ''} onChange={(e) => handlers.handleQuizChange('password', e.target.value)} />
                                <div className="form-text">Học sinh sẽ cần nhập đúng mật khẩu này để bắt đầu.</div>
                            </div>
                        )}
                    </div>

                    <div className="mt-3 pt-3 border-top">
                        <div className="form-check form-switch mb-2">
                            <input className="form-check-input" type="checkbox" role="switch" id="timeGateSwitch" checked={isTimeGated} onChange={e => setIsTimeGated(e.target.checked)} />
                            <label className="form-check-label fw-medium" htmlFor="timeGateSwitch">Giới hạn thời gian làm bài</label>
                        </div>
                        {isTimeGated && (
                            <div className="row mt-2 g-3 align-items-center">
                                <div className="col-md-6 col-lg-4">
                                    <label htmlFor="openTime" className="form-label">Thời gian mở:</label>
                                    <input type="datetime-local" id="openTime" className="form-control border-primary" value={openTime} onChange={e => setOpenTime(e.target.value)} />
                                </div>
                                <div className="col-md-6 col-lg-4">
                                    <label htmlFor="closeTime" className="form-label">Thời gian đóng:</label>
                                    <input type="datetime-local" id="closeTime" className="form-control border-primary" value={closeTime} onChange={e => setCloseTime(e.target.value)} />
                                </div>
                                {openTime && closeTime && new Date(closeTime) < new Date(openTime) && (
                                    <div className="col-12">
                                        <div className="alert alert-danger py-2 mb-0">Lỗi: Thời gian đóng không thể trước thời gian mở.</div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
            
            <h4 className="mt-4 mb-3">Nội dung câu hỏi</h4>
            <div className="accordion" id="quizClusterAccordion">
                {quiz.clusters.map((cluster, cIdx) => (
                    <div className="accordion-item border-primary mb-3 shadow-sm" key={cluster.id || cIdx}>
                        <h2 className="accordion-header" id={`heading-${cIdx}`}>
                           <button
                              className={`accordion-button ${cluster.isCollapsed ? 'collapsed' : ''} bg-light fw-bold text-primary`}
                              type="button"
                              onClick={() => handlers.handleToggleCluster(cIdx)}
                            >
                              Cụm câu hỏi {cIdx + 1}
                            </button>
                        </h2>
                        <div id={`collapse-${cIdx}`} className={`accordion-collapse collapse ${cluster.isCollapsed ? '' : 'show'}`}>
                            <div className="accordion-body bg-light">
                                <div className="d-flex justify-content-end mb-3">
                                    {quiz.clusters.length > 1 && <button className="btn btn-sm btn-danger" onClick={() => handlers.handleRemoveCluster(cIdx)}><i className="fa-solid fa-trash-can me-2"></i>Xóa Cụm câu hỏi này</button>}
                                </div>
                                <div className="field-group">
                                    <label className="fw-bold text-dark">Giả thiết chung (Nếu có)</label>
                                    <ReactQuill 
                                        theme="snow" 
                                        value={cluster.commonAssumption.intro} 
                                        onChange={value => handlers.handleAssumptionChange(cIdx, 'intro', value)}
                                    />
                                </div>
                                
                                {cluster.questions.map((q, qIdx) => (
                                    <QuestionEditor 
                                        key={q.id || qIdx} 
                                        q={q} 
                                        cIdx={cIdx} 
                                        qIdx={qIdx} 
                                        handlers={handlers} 
                                        questionCount={cluster.questions.length}
                                    />
                                ))}

                                <div className="mt-3">
                                    <button className="btn btn-outline-primary" onClick={() => handlers.handleAddQuestion(cIdx)}>
                                        <i className="fa-solid fa-plus me-2"></i>Thêm câu hỏi vào cụm này
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <button className="btn btn-secondary mt-3" onClick={handlers.handleAddCluster}>
                <i className="fa-solid fa-layer-group me-2"></i>Thêm Cụm câu hỏi mới
            </button>
        </div>
    );
};

export default QuizEditor;