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

// --- MẪU FILE TXT ---
const smartTemplateContent = `
# TIÊU ĐỀ: Đề Thi Thử Logic Cuối Kỳ
// Ghi chú: Dòng bắt đầu bằng #, ##, // sẽ được bỏ qua.
// Dùng --- để ngăn cách các câu hỏi.
// Đánh dấu đáp án đúng bằng [x].

## Cụm 1: Giả thiết chung
> Đây là giả thiết chung cho cụm câu hỏi đầu tiên.
> Quy tắc 1 của giả thiết chung.

1.  Đây là nội dung câu hỏi trắc nghiệm số 1?
    - (A) Lựa chọn A
    - (B) [x] Lựa chọn B
    - (C) Lựa chọn C
    - (D) Lựa chọn D
    ---
    Điểm: 10, -5  // Điểm đúng, điểm sai
    Phạt: 1 phút
    Giải thích: <b>Đây là lời giải chi tiết</b> cho câu hỏi 1.
`;


// --- Component con để render từng câu hỏi ---
const QuestionEditor = ({ q, cIdx, qIdx, handlers, questionCount }) => {
    // ... (Giữ nguyên không thay đổi)
    const { 
        handleQuestionTypeChange, handleQuestionChange, handleImageFileChange,
        handleRemoveImage, 
        handleChoiceChange, handleRemoveChoice, handleAddChoice,
        handleOrderingItemChange, handleRemoveOrderingItem, handleAddOrderingItem,
        handleRemoveQuestion 
    } = handlers;

    const quillModules = {
        toolbar: [
            [{ 'header': [1, 2, 3, false] }, { 'font': [] }],
            ['bold', 'italic', 'underline', 'strike', 'blockquote'],
            // Thêm tùy chọn màu chữ và màu nền
            [{ 'color': [] }, { 'background': [] }],
            // Thêm danh sách (enum, item)
            [{'list': 'ordered'}, {'list': 'bullet'}],
            [{ 'indent': '-1' }, { 'indent': '+1' }],
            [{ 'align': [] }],
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
                <div className="field-group"><label className="fw-bold text-dark">Các đối tượng cần sắp xếp</label><small className="form-text d-block text-muted mb-2">Nhập các đối tượng theo thứ tự đúng. Khi chơi, chúng sẽ được xáo trộn.</small>{q.orderingItems && q.orderingItems.map((item, itemIdx) => (<div key={item.id} className="input-group mb-2"><span className="input-group-text bg-secondary text-white">{itemIdx + 1}.</span><input type="text" className="form-control border-primary" value={item.text} onChange={e => handlers.handleOrderingItemChange(cIdx, qIdx, itemIdx, e.target.value)} /><button className="btn btn-outline-danger" type="button" onClick={() => handlers.handleRemoveOrderingItem(cIdx, qIdx, itemIdx)}>Xóa</button></div>))}<button className="btn btn-sm btn-outline-secondary" onClick={() => handlers.handleAddOrderingItem(cIdx, qIdx)}>Thêm đối tượng</button></div>
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
    const [quiz, setQuiz] = useState({ title: '', description: '', password: '', clusters: [JSON.parse(JSON.stringify(emptyCluster))] });
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
        // Chuyển sang múi giờ địa phương để hiển thị đúng trên input
        const localDate = new Date(date.getTime() - (date.getTimezoneOffset() * 60000));
        return localDate.toISOString().slice(0, 16);
    };

    useEffect(() => {
        if (!user) return;
        const initializeEditor = async () => {
            try {
                if (teacherSlug) {
                    const groupsQuery = query(collection(db, 'groups'), where('slug', '==', teacherSlug));
                    const groupSnapshot = await getDocs(groupsQuery);
                    if (!groupSnapshot.empty) {
                        setGroupId(groupSnapshot.docs[0].id);
                    }
                }

                if (quizId && quizId !== 'new') {
                    const quizMetaRef = doc(db, 'quizzes', quizId);
                    const quizMetaSnap = await getDoc(quizMetaRef);
                    if (quizMetaSnap.exists()) {
                        const metaData = quizMetaSnap.data();
                        setOriginalStoragePath(metaData.storagePath);
                        
                        // Tải file JSON chứa đầy đủ câu hỏi
                        const response = await fetch(metaData.downloadURL);
                        if (!response.ok) throw new Error('Không thể tải file đề thi.');
                        const quizContent = await response.json();
                        
                        // Kết hợp metadata và content
                        const fullQuizData = {
                            ...quizContent,
                            title: metaData.title,
                            description: metaData.description || '',
                        };
                        setQuiz(fullQuizData);

                        if (fullQuizData.password) {
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


    // --- CÁC HÀM XỬ LÝ FILE (UPLOAD & DOWNLOAD) ---

    const downloadFile = (blob, fileName) => {
        try {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url; a.download = fileName;
            document.body.appendChild(a); a.click(); document.body.removeChild(a);
            URL.revokeObjectURL(url);
            Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: `Đã bắt đầu tải file ${fileName}`, showConfirmButton: false, timer: 3000 });
        } catch (error) {
            Swal.fire('Lỗi', 'Không thể tải file.', 'error');
        }
    };

    const handleDownloadTxtTemplate = () => {
        const blob = new Blob([smartTemplateContent.trim()], { type: 'text/plain;charset=utf-8' });
        downloadFile(blob, 'mau_soan_thao.txt');
    };
    
    const handleDownloadXlsxTemplate = () => {
        if (!XLSX) { Swal.fire('Lỗi', 'Thư viện Excel (xlsx.js) chưa được tải.', 'error'); return; }
        const headers = ["loai_dong","cum_so","gia_thiet_cum","loai_cau_hoi","noi_dung_cau_hoi","lua_chon_a","lua_chon_b","lua_chon_c","lua_chon_d","dap_an_dung","diem_dung","diem_sai","phut_phat","giai_thich"];
        const data = [
            ["TIEU_DE","","","","Đề Thi Thử Cuối Kỳ","","","","","","","","",""],
            ["CUM","1","Đây là giả thiết chung cho cụm 1.","","","","","","","","","","",""],
            ["CAU_HOI","1","","TRAC_NGHIEM","Nội dung câu hỏi 1?","Đáp án A","Đáp án B","Đáp án C","Đáp án D","B","10","0","1","Lời giải cho câu 1."],
        ];
        const ws = XLSX.utils.aoa_to_sheet([headers, ...data]);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Mau Soan Thao");
        XLSX.writeFile(wb, "mau_soan_thao.xlsx");
    };

    const handleDownloadDocxTemplate = () => {
        if (!docx) { Swal.fire('Lỗi', 'Thư viện Word (docx.js) chưa được tải.', 'error'); return; }
        const { Document, Packer, Paragraph, HeadingLevel, TextRun } = docx;
        const doc = new Document({
            sections: [{
                children: [
                    new Paragraph({ text: "TIÊU ĐỀ: Đề Thi Thử Cuối Kỳ", heading: HeadingLevel.HEADING_1 }),
                    new Paragraph({ text: "" }),
                    new Paragraph({ text: "Cụm 1: Giả thiết chung", heading: HeadingLevel.HEADING_2 }),
                    new Paragraph({ text: "Đây là giả thiết chung cho cụm câu hỏi đầu tiên.", style: "Quote" }),
                    new Paragraph({ text: "" }),
                    new Paragraph({ text: "1. Đây là nội dung câu hỏi trắc nghiệm số 1?", style: "ListParagraph" }),
                    new Paragraph({ text: "\t(A)\tLựa chọn A", style: "ListParagraph" }),
                    new Paragraph({ children: [new TextRun({ text: "\t(B)\tLựa chọn B", bold: true })], style: "ListParagraph" }),
                ],
            }],
        });
        Packer.toBlob(doc).then(blob => downloadFile(blob, "mau_soan_thao.docx"));
    };
    
// ✅ HÀM NÂNG CẤP (V3) - Sửa lỗi tự động chèn <br>
    const parseTxtToQuizJson = (txtContent) => {
        const quiz = { title: 'Chưa có tiêu đề', clusters: [] };
        let currentCluster = null;

        const lines = txtContent.split('\n');
        const contentLines = [];

        // 1. Tiền xử lý: Lọc comment, tìm tiêu đề
        for (const line of lines) {
            const trimmedLine = line.trim();
            if (trimmedLine.startsWith('//')) continue;

            if (trimmedLine.startsWith('# TIÊU ĐỀ:')) {
                quiz.title = trimmedLine.substring(10).trim();
                continue;
            }
            if (trimmedLine.startsWith('MAT_KHAU:')) {
                 quiz.password = trimmedLine.substring(9).trim();
                 continue;
            }
            
            if (trimmedLine.startsWith('#') && !trimmedLine.startsWith('## Cụm')) {
                continue;
            }
            contentLines.push(line);
        }

        const fullContent = contentLines.join('\n');

        // 2. Phân tách Cụm (Cluster)
        const clusterBlocks = fullContent.split(/(?=## Cụm \d+)/);
        
        const parseQuestionBlock = (qBlock) => {
            if (qBlock.trim() === '') return null;

            const question = JSON.parse(JSON.stringify(emptyQuestion));
            question.choices = [];
            
            const qLines = qBlock.split('\n');
            let questionTextHtml = '';
            let solutionHtml = '';
            let state = 'question';
            
            for (const line of qLines) {
                const trimmedLine = line.trim();
                if (trimmedLine === '') continue;

                if (trimmedLine.startsWith('Điểm:')) {
                    state = 'meta';
                    const parts = trimmedLine.substring(5).split(',');
                    question.points_correct = Number(parts[0]?.trim() || 10);
                    question.points_incorrect = Number(parts[1]?.trim() || 0);
                } else if (trimmedLine.startsWith('Phạt:')) {
                    state = 'meta';
                    question.penalty_minutes = parseInt(trimmedLine.match(/\d+/)?.[0] || 0, 10);
                } else if (trimmedLine.startsWith('Giải thích:')) {
                    state = 'meta';
                    solutionHtml += trimmedLine.substring(10).trim();
                } 
                else if (trimmedLine.startsWith('- (')) {
                    state = 'choice';
                    const match = trimmedLine.match(/-\s*\(([A-Z])\)\s*(\[x\])?\s*(.*)/i);
                    if (match) {
                        const [_, value, isCorrect, text] = match;
                        const upperValue = value.trim().toUpperCase();
                        question.choices.push({
                            text: text.trim(),
                            value: upperValue,
                            imageUrl: null
                        });
                        if (isCorrect) {
                            question.correctAnswer = upperValue;
                        }
                    }
                } 
                else if (state === 'question' && trimmedLine.match(/^\d+\.\s/)) {
                    questionTextHtml += `<p>${trimmedLine.substring(trimmedLine.indexOf(' ') + 1).trim()}</p>`;
                } 
                else {
                    if (state === 'question') {
                        questionTextHtml += `<p>${trimmedLine}</p>`;
                    
                    // --- 🛑 ĐÂY LÀ THAY ĐỔI QUAN TRỌNG ---
                    } else if (state === 'meta' && solutionHtml.length > 0) {
                        // Nối các dòng giải thích bằng 1 khoảng trắng.
                        // Thẻ HTML (như <ol>, <p>) sẽ tự lo việc xuống dòng.
                        // Nếu muốn xuống dòng (plain text), người dùng phải tự gõ <br> vào file txt.
                        solutionHtml += ' ' + trimmedLine; 
                    // --- 🛑 KẾT THÚC THAY ĐỔI ---
                    
                    }
                }
            } 

            question.questionText = questionTextHtml.trim().replace(/<p><\/p>/g, '');
            question.solution = solutionHtml.trim();
            
            if (question.choices.length > 0 && !question.correctAnswer) {
               question.correctAnswer = question.choices[0].value;
            }
            
            return question.questionText ? question : null;
        };

        // 3. Xử lý từng khối Cụm
        if (clusterBlocks.length <= 1 && fullContent.trim()) {
            currentCluster = { ...JSON.parse(JSON.stringify(emptyCluster)), questions: [] };
            const questionBlocks = fullContent.split('---');
            for (const qBlock of questionBlocks) {
                const question = parseQuestionBlock(qBlock);
                if (question) currentCluster.questions.push(question);
            }
            if (currentCluster.questions.length > 0) quiz.clusters.push(currentCluster);
            
        } else {
            for (const block of clusterBlocks) {
                if (block.trim() === '') continue;

                currentCluster = { 
                    ...JSON.parse(JSON.stringify(emptyCluster)), 
                    commonAssumption: { intro: '', rules: [] }, 
                    questions: [] 
                };
                
                const blockLines = block.split('\n');
                let assumptionHtml = '';
                
                const headerLine = blockLines.shift().trim();
                const headerMatch = headerLine.match(/## Cụm \d+:\s*(.*)/);
                if(headerMatch && headerMatch[1]) {
                    assumptionHtml += `<p><strong>${headerMatch[1].trim()}</strong></p>`;
                }

                while (blockLines.length > 0 && blockLines[0].trim().startsWith('>')) {
                    assumptionHtml += `<p>${blockLines.shift().trim().substring(1).trim()}</p>`;
                }
                currentCluster.commonAssumption.intro = assumptionHtml.trim();
                
                const questionsContent = blockLines.join('\n');
                const questionBlocks = questionsContent.split('---');

                for (const qBlock of questionBlocks) {
                    const question = parseQuestionBlock(qBlock);
                    if (question) currentCluster.questions.push(question);
                } 

                if (currentCluster.questions.length > 0) {
                    quiz.clusters.push(currentCluster);
                }
            }
        }

        return quiz;
    };
    
    const parseCsvToQuizJson = (csv) => {
        const lines = csv.split('\n').filter(line => line.trim() !== '');
        if (lines.length < 2) throw new Error("File CSV không có dữ liệu.");
        const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
        const quiz = { title: 'Chưa có tiêu đề', clusters: [] };
        const clusterMap = new Map();
        for (let i = 1; i < lines.length; i++) {
            const data = lines[i].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(d => d.replace(/"/g, '').trim());
            const row = headers.reduce((obj, header, index) => { obj[header] = data[index] || ''; return obj; }, {});
            if (row.loai_dong === 'TIEU_DE') quiz.title = row.noi_dung_cau_hoi;
            else if (row.loai_dong === 'CUM') {
                if (!clusterMap.has(row.cum_so)) {
                    const newCluster = { ...JSON.parse(JSON.stringify(emptyCluster)), questions: [], commonAssumption: { intro: row.gia_thiet_cum || '', rules: [] } };
                    quiz.clusters.push(newCluster);
                    clusterMap.set(row.cum_so, newCluster);
                }
            } else if (row.loai_dong === 'CAU_HOI') {
                const cluster = clusterMap.get(row.cum_so);
                if (cluster) {
                    const question = {
                        ...JSON.parse(JSON.stringify(emptyQuestion)),
                        questionText: row.noi_dung_cau_hoi,
                        type: row.loai_cau_hoi === 'DIEN_DAP_AN' ? 'fill_in_the_blank' : 'multiple_choice',
                        choices: [],
                        correctAnswer: row.dap_an_dung,
                        points_correct: parseInt(row.diem_dung, 10) || 10,
                        points_incorrect: parseInt(row.diem_sai, 10) || 0,
                        penalty_minutes: parseInt(row.phut_phat, 10) || 0,
                        solution: row.giai_thich || '',
                        show_solution: !!row.giai_thich,
                    };
                    if (row.lua_chon_a) question.choices.push({ value: 'A', text: row.lua_chon_a, imageUrl: null });
                    if (row.lua_chon_b) question.choices.push({ value: 'B', text: row.lua_chon_b, imageUrl: null });
                    if (row.lua_chon_c) question.choices.push({ value: 'C', text: row.lua_chon_c, imageUrl: null });
                    if (row.lua_chon_d) question.choices.push({ value: 'D', text: row.lua_chon_d, imageUrl: null });
                    cluster.questions.push(question);
                }
            }
        }
        return quiz;
    };
    
    const parseDocxToQuizJson = async (arrayBuffer) => {
        if (!mammoth) throw new Error("Thư viện mammoth.js chưa được tải.");
        const { value } = await mammoth.convertToHtml({ arrayBuffer });
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = value;
        const quiz = { title: 'Chưa có tiêu đề', clusters: [] };
        let currentCluster = null;
        let currentQuestion = null;
        Array.from(tempDiv.children).forEach(el => {
            const text = el.textContent.trim();
            if (!text) return;
            if (el.tagName === 'H1' || text.toUpperCase().startsWith('TIÊU ĐỀ:')) {
                quiz.title = text.replace(/TIÊU ĐỀ:\s*/i, '');
            } else if (el.tagName === 'H2' || text.match(/^Cụm \d+/i)) {
                currentCluster = { ...JSON.parse(JSON.stringify(emptyCluster)), questions: [] };
                quiz.clusters.push(currentCluster);
            } else if (el.tagName === 'BLOCKQUOTE' && currentCluster) {
                currentCluster.commonAssumption.intro += text + '\n';
            } else if (text.match(/^\d+\.\s/)) {
                if (!currentCluster) {
                    currentCluster = { ...JSON.parse(JSON.stringify(emptyCluster)), questions: [] };
                    quiz.clusters.push(currentCluster);
                }
                currentQuestion = { ...JSON.parse(JSON.stringify(emptyQuestion)), questionText: text.substring(text.indexOf(' ') + 1), choices: [] };
                currentCluster.questions.push(currentQuestion);
            } else if (el.tagName === 'UL' && currentQuestion) {
                Array.from(el.getElementsByTagName('li')).forEach(li => {
                    const liText = li.textContent.trim();
                    const optionMatch = liText.match(/^\((.*?)\)/);
                    const value = optionMatch ? optionMatch[1].trim().toUpperCase() : '';
                    const choiceText = liText.replace(/^\(.*?\)\s*/, '');
                    currentQuestion.choices.push({ value, text: choiceText, imageUrl: null });
                    if (li.querySelector('strong') || li.querySelector('b')) currentQuestion.correctAnswer = value;
                });
            }
        });
        return quiz;
    };

    const adaptParsedToEditorFormat = (parsedData) => {
        if (!parsedData) return { title: '', clusters: [JSON.parse(JSON.stringify(emptyCluster))] };
        if (!parsedData.clusters || parsedData.clusters.length === 0) {
            if (parsedData.questions && parsedData.questions.length > 0) {
                return { ...parsedData, clusters: [{ ...JSON.parse(JSON.stringify(emptyCluster)), questions: parsedData.questions }] };
            }
            return { ...parsedData, clusters: [JSON.parse(JSON.stringify(emptyCluster))] };
        }
        return parsedData;
    };
    
    // --- HÀM VALIDATION CHI TIẾT ---
    const validateQuizData = (quizData) => {
        const errors = [];
        const warnings = [];
        const stats = {
            totalClusters: quizData.clusters?.length || 0,
            totalQuestions: 0,
            questionsPerCluster: [],
            questionTypes: { multiple_choice: 0, fill_in_the_blank: 0, ordering: 0 }
        };

        if (!quizData.title || !quizData.title.trim()) {
            errors.push('Thiếu tiêu đề bộ câu hỏi');
        }

        if (!quizData.clusters || quizData.clusters.length === 0) {
            errors.push('Không có cụm câu hỏi nào');
            return { errors, warnings, stats };
        }

        quizData.clusters.forEach((cluster, cIdx) => {
            const questionsInCluster = cluster.questions?.length || 0;
            stats.questionsPerCluster.push(questionsInCluster);
            stats.totalQuestions += questionsInCluster;

            if (questionsInCluster === 0) {
                errors.push(`Cụm ${cIdx + 1} không có câu hỏi nào`);
            }

            cluster.questions?.forEach((q, qIdx) => {
                // Đếm loại câu hỏi
                stats.questionTypes[q.type] = (stats.questionTypes[q.type] || 0) + 1;

                // Kiểm tra nội dung câu hỏi
                if (!q.questionText || !q.questionText.trim()) {
                    errors.push(`Cụm ${cIdx + 1}, Câu ${qIdx + 1}: Thiếu nội dung câu hỏi`);
                }

                // Kiểm tra theo loại câu hỏi
                if (q.type === 'multiple_choice') {
                    if (!q.choices || q.choices.length < 2) {
                        errors.push(`Cụm ${cIdx + 1}, Câu ${qIdx + 1}: Phải có ít nhất 2 lựa chọn`);
                    } else {
                        const emptyChoices = q.choices.filter(ch => !ch.text || !ch.text.trim());
                        if (emptyChoices.length > 0) {
                            warnings.push(`Cụm ${cIdx + 1}, Câu ${qIdx + 1}: Có ${emptyChoices.length} lựa chọn trống`);
                        }
                        if (!q.correctAnswer) {
                            errors.push(`Cụm ${cIdx + 1}, Câu ${qIdx + 1}: Chưa chọn đáp án đúng`);
                        }
                    }
                } else if (q.type === 'fill_in_the_blank') {
                    if (!q.correctAnswer || !q.correctAnswer.trim()) {
                        errors.push(`Cụm ${cIdx + 1}, Câu ${qIdx + 1}: Thiếu đáp án đúng`);
                    }
                } else if (q.type === 'ordering') {
                    if (!q.orderingItems || q.orderingItems.length < 2) {
                        errors.push(`Cụm ${cIdx + 1}, Câu ${qIdx + 1}: Phải có ít nhất 2 mục để sắp xếp`);
                    }
                }

                // Cảnh báo về điểm số
                if (q.points_correct <= 0) {
                    warnings.push(`Cụm ${cIdx + 1}, Câu ${qIdx + 1}: Điểm đúng = ${q.points_correct}`);
                }
            });
        });

        return { errors, warnings, stats };
    };

    // --- HÀM SO SÁNH THAY ĐỔI ---
    const compareQuizData = (oldQuiz, newQuiz) => {
        const changes = {
            title: oldQuiz.title !== newQuiz.title,
            description: oldQuiz.description !== newQuiz.description,
            clustersAdded: Math.max(0, (newQuiz.clusters?.length || 0) - (oldQuiz.clusters?.length || 0)),
            clustersRemoved: Math.max(0, (oldQuiz.clusters?.length || 0) - (newQuiz.clusters?.length || 0)),
            questionsAdded: 0,
            questionsRemoved: 0,
            totalChanges: 0
        };

        const oldQuestionCount = oldQuiz.clusters?.reduce((sum, c) => sum + (c.questions?.length || 0), 0) || 0;
        const newQuestionCount = newQuiz.clusters?.reduce((sum, c) => sum + (c.questions?.length || 0), 0) || 0;
        
        changes.questionsAdded = Math.max(0, newQuestionCount - oldQuestionCount);
        changes.questionsRemoved = Math.max(0, oldQuestionCount - newQuestionCount);
        
        changes.totalChanges = (changes.title ? 1 : 0) + 
                               (changes.description ? 1 : 0) + 
                               changes.clustersAdded + 
                               changes.clustersRemoved + 
                               changes.questionsAdded + 
                               changes.questionsRemoved;

        return changes;
    };

    // --- MODAL PREVIEW ---
    const showUploadPreview = async (parsedData, originalQuiz) => {
        const validation = validateQuizData(parsedData);
        const changes = originalQuiz ? compareQuizData(originalQuiz, parsedData) : null;

        let htmlContent = '<div style="text-align: left; font-size: 14px;">';
        
        // Thông tin cơ bản
        htmlContent += '<h5 class="mb-3"><i class="fa-solid fa-file-lines"></i> Thông tin bộ câu hỏi</h5>';
        htmlContent += `<p><strong>Tiêu đề:</strong> ${parsedData.title || '<em>Chưa có</em>'}</p>`;
        htmlContent += `<p><strong>Tổng số cụm:</strong> ${validation.stats.totalClusters}</p>`;
        htmlContent += `<p><strong>Tổng số câu hỏi:</strong> ${validation.stats.totalQuestions}</p>`;
        htmlContent += '<p><strong>Phân loại:</strong> ';
        htmlContent += `Trắc nghiệm: ${validation.stats.questionTypes.multiple_choice || 0}, `;
        htmlContent += `Điền đáp án: ${validation.stats.questionTypes.fill_in_the_blank || 0}, `;
        htmlContent += `Sắp xếp: ${validation.stats.questionTypes.ordering || 0}</p>`;

        // So sánh nếu đang edit
        if (changes && changes.totalChanges > 0) {
            htmlContent += '<hr><h5 class="mb-3"><i class="fa-solid fa-code-compare"></i> So sánh thay đổi</h5>';
            htmlContent += '<div class="alert alert-info mb-3" style="font-size: 13px;">';
            if (changes.title) htmlContent += '<p class="mb-1">• Tiêu đề đã thay đổi</p>';
            if (changes.description) htmlContent += '<p class="mb-1">• Mô tả đã thay đổi</p>';
            if (changes.clustersAdded > 0) htmlContent += `<p class="mb-1">• Thêm <strong>${changes.clustersAdded}</strong> cụm</p>`;
            if (changes.clustersRemoved > 0) htmlContent += `<p class="mb-1">• Xoá <strong>${changes.clustersRemoved}</strong> cụm</p>`;
            if (changes.questionsAdded > 0) htmlContent += `<p class="mb-1">• Thêm <strong>${changes.questionsAdded}</strong> câu hỏi</p>`;
            if (changes.questionsRemoved > 0) htmlContent += `<p class="mb-1">• Xoá <strong>${changes.questionsRemoved}</strong> câu hỏi</p>`;
            htmlContent += '</div>';
        }

        // Lỗi
        if (validation.errors.length > 0) {
            htmlContent += '<hr><h5 class="mb-3 text-danger"><i class="fa-solid fa-triangle-exclamation"></i> Lỗi cần sửa</h5>';
            htmlContent += '<ul class="text-danger" style="font-size: 13px; max-height: 200px; overflow-y: auto;">';
            validation.errors.forEach(err => {
                htmlContent += `<li>${err}</li>`;
            });
            htmlContent += '</ul>';
        }

        // Cảnh báo
        if (validation.warnings.length > 0) {
            htmlContent += '<hr><h5 class="mb-3 text-warning"><i class="fa-solid fa-circle-exclamation"></i> Cảnh báo</h5>';
            htmlContent += '<ul class="text-warning" style="font-size: 13px; max-height: 150px; overflow-y: auto;">';
            validation.warnings.forEach(warn => {
                htmlContent += `<li>${warn}</li>`;
            });
            htmlContent += '</ul>';
        }

        htmlContent += '</div>';

        const result = await Swal.fire({
            title: validation.errors.length > 0 ? '⚠️ Phát hiện lỗi' : '✅ Kiểm tra hoàn tất',
            html: htmlContent,
            icon: validation.errors.length > 0 ? 'warning' : 'info',
            showCancelButton: true,
            confirmButtonText: validation.errors.length > 0 ? 'Áp dụng (có lỗi)' : 'Áp dụng',
            cancelButtonText: 'Huỷ bỏ',
            confirmButtonColor: validation.errors.length > 0 ? '#f39c12' : '#3085d6',
            width: '700px',
            customClass: {
                popup: 'text-start'
            }
        });

        return result.isConfirmed;
    };

    const handleUploadQuiz = async (event) => {
        const file = event.target.files[0];
        if (!file) return;
        
        Swal.fire({ title: 'Đang phân tích file...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
        
        try {
            let parsedData;
            const extension = file.name.split('.').pop().toLowerCase();
            
            if (extension === 'json') {
                parsedData = JSON.parse(await file.text());
            } else if (extension === 'txt') {
                parsedData = parseTxtToQuizJson(await file.text());
            } else if (extension === 'xlsx' || extension === 'xls') {
                const data = await file.arrayBuffer();
                const workbook = XLSX.read(data);
                const sheetName = workbook.SheetNames[0];
                const sheet = workbook.Sheets[sheetName];
                const csv = XLSX.utils.sheet_to_csv(sheet);
                parsedData = parseCsvToQuizJson(csv);
            } else if (extension === 'docx') {
                const arrayBuffer = await file.arrayBuffer();
                parsedData = await parseDocxToQuizJson(arrayBuffer);
            } else {
                throw new Error("Định dạng file không được hỗ trợ.");
            }

            const adaptedQuiz = adaptParsedToEditorFormat(parsedData);
            Swal.close();

            // Hiển thị preview và yêu cầu xác nhận
            const confirmed = await showUploadPreview(adaptedQuiz, quiz);
            
            if (confirmed) {
                setQuiz(adaptedQuiz);
                if (adaptedQuiz.password) setIsPasswordEnabled(true);
                Swal.fire({
                    icon: 'success',
                    title: 'Đã áp dụng!',
                    text: 'Nội dung file đã được tải và áp dụng vào trình soạn thảo.',
                    timer: 2000,
                    showConfirmButton: false
                });
            }
        } catch (error) {
            Swal.fire({
                icon: 'error',
                title: 'Lỗi phân tích file',
                html: `<p>Không thể xử lý file. Vui lòng kiểm tra lại định dạng.</p>
                       <p class="text-danger" style="font-size: 13px; margin-top: 10px;"><strong>Chi tiết:</strong> ${error.message}</p>`,
                confirmButtonText: 'Đóng'
            });
        } finally {
            event.target.value = null;
        }
    };

    // --- HÀM DOWNLOAD BỘ CÂU HỎI HIỆN TẠI ---
    const handleDownloadCurrentQuiz = (format = 'both') => {
        try {
            const quizData = JSON.parse(JSON.stringify(quiz));
            
            if (format === 'json' || format === 'both') {
                // Download as JSON
                const jsonBlob = new Blob([JSON.stringify(quizData, null, 2)], { type: 'application/json' });
                const jsonFilename = `${quizData.title.replace(/[^a-zA-Z0-9]/g, '_') || 'quiz'}.json`;
                const jsonUrl = URL.createObjectURL(jsonBlob);
                const jsonLink = document.createElement('a');
                jsonLink.href = jsonUrl;
                jsonLink.download = jsonFilename;
                document.body.appendChild(jsonLink);
                jsonLink.click();
                document.body.removeChild(jsonLink);
                URL.revokeObjectURL(jsonUrl);
            }
            
            if (format === 'txt' || format === 'both') {
                // Convert to TXT and download
                let txt = `# TIÊU ĐỀ: ${quizData.title || 'Chưa có tiêu đề'}\n`;
                if (quizData.description) {
                    txt += `// Mô tả: ${quizData.description}\n`;
                }
                txt += '\n';
                
                quizData.clusters.forEach((cluster, cIdx) => {
                    txt += `## Cụm ${cIdx + 1}`;
                    if (cluster.commonAssumption?.intro) {
                        const intro = cluster.commonAssumption.intro.replace(/<[^>]*>/g, '').trim();
                        if (intro) txt += `: ${intro}`;
                    }
                    txt += '\n';
                    
                    if (cluster.commonAssumption?.intro) {
                        const lines = cluster.commonAssumption.intro.split(/<\/?p>/g).filter(l => l.trim());
                        lines.forEach(line => {
                            const cleaned = line.replace(/<[^>]*>/g, '').trim();
                            if (cleaned) txt += `> ${cleaned}\n`;
                        });
                    }
                    
                    if (cluster.commonAssumption?.rules && cluster.commonAssumption.rules.length > 0) {
                        cluster.commonAssumption.rules.forEach(rule => {
                            if (rule.trim()) txt += `> ${rule.trim()}\n`;
                        });
                    }
                    txt += '\n';
                    
                    cluster.questions.forEach((q, qIdx) => {
                        const questionText = q.questionText.replace(/<[^>]*>/g, '').trim();
                        txt += `${qIdx + 1}. ${questionText}\n`;
                        
                        if (q.type === 'multiple_choice' && q.choices) {
                            q.choices.forEach(choice => {
                                const isCorrect = choice.value === q.correctAnswer ? '[x]' : '';
                                const choiceText = choice.text.replace(/<[^>]*>/g, '').trim();
                                txt += `    - (${choice.value}) ${isCorrect} ${choiceText}\n`;
                            });
                        } else if (q.type === 'fill_in_the_blank') {
                            txt += `    Đáp án: ${q.correctAnswer || ''}\n`;
                        } else if (q.type === 'ordering') {
                            q.orderingItems?.forEach((item, idx) => {
                                txt += `    ${idx + 1}. ${item.text || ''}\n`;
                            });
                        }
                        
                        txt += '    ---\n';
                        txt += `    Điểm: ${q.points_correct || 10}, ${q.points_incorrect || 0}\n`;
                        if (q.penalty_minutes) txt += `    Phạt: ${q.penalty_minutes} phút\n`;
                        if (q.solution && q.show_solution) {
                            const solution = q.solution.replace(/<[^>]*>/g, '').trim();
                            if (solution) txt += `    Giải thích: ${solution}\n`;
                        }
                        txt += '\n';
                    });
                });
                
                const txtBlob = new Blob([txt], { type: 'text/plain;charset=utf-8' });
                const txtFilename = `${quizData.title.replace(/[^a-zA-Z0-9]/g, '_') || 'quiz'}.txt`;
                const txtUrl = URL.createObjectURL(txtBlob);
                const txtLink = document.createElement('a');
                txtLink.href = txtUrl;
                txtLink.download = txtFilename;
                document.body.appendChild(txtLink);
                txtLink.click();
                document.body.removeChild(txtLink);
                URL.revokeObjectURL(txtUrl);
            }
            
            Swal.fire({
                icon: 'success',
                title: 'Đã tải về!',
                text: format === 'both' ? 'Đã tải về file TXT và JSON' : `Đã tải về file ${format.toUpperCase()}`,
                timer: 1500,
                showConfirmButton: false
            });
        } catch (error) {
            Swal.fire('Lỗi', `Không thể tải về: ${error.message}`, 'error');
        }
    };

    // --- CÁC HÀM HANDLER CỦA TRÌNH SOẠN THẢO ---
    const handlers = {
        handleQuizChange: (field, value) => setQuiz(p => ({ ...p, [field]: value })),
        handleAddCluster: () => setQuiz(p => ({ ...p, clusters: [...p.clusters, { ...JSON.parse(JSON.stringify(emptyCluster)), id: Date.now() }] })),
        handleRemoveCluster: (cIdx) => {
            if (quiz.clusters.length <= 1) return Swal.fire('Không thể xoá', 'Bộ câu hỏi phải có ít nhất một cụm.', 'info');
            Swal.fire({ title: 'Bạn chắc chắn?', text: "Hành động này không thể hoàn tác!", icon: 'warning', showCancelButton: true, confirmButtonColor: '#d33', confirmButtonText: 'Vâng, xoá nó!'})
            .then((result) => { if (result.isConfirmed) setQuiz(p => ({ ...p, clusters: p.clusters.filter((_, i) => i !== cIdx) })) });
        },
        handleToggleCluster: (cIdx) => { const nc = [...quiz.clusters]; nc[cIdx].isCollapsed = !nc[cIdx].isCollapsed; setQuiz(p => ({...p, clusters: nc})); },
        handleAssumptionChange: (cIdx, field, value) => { const nc = [...quiz.clusters]; nc[cIdx].commonAssumption[field] = value; setQuiz(p => ({ ...p, clusters: nc })); },
        handleRuleChange: (cIdx, rIdx, value) => { const nc = [...quiz.clusters]; nc[cIdx].commonAssumption.rules[rIdx] = value; setQuiz(p => ({ ...p, clusters: nc })); },
        handleAddRule: (cIdx) => { const nc = [...quiz.clusters]; if(!nc[cIdx].commonAssumption.rules) nc[cIdx].commonAssumption.rules = []; nc[cIdx].commonAssumption.rules.push(''); setQuiz(p => ({ ...p, clusters: nc })); },
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
                const choiceToRemove = nc[cIdx].questions[qIdx].choices[chIdx];
                nc[cIdx].questions[qIdx].choices.splice(chIdx, 1);
                // Cập nhật lại correctAnswer nếu lựa chọn bị xóa là đáp án đúng
                if (nc[cIdx].questions[qIdx].correctAnswer === choiceToRemove.value) {
                    nc[cIdx].questions[qIdx].correctAnswer = nc[cIdx].questions[qIdx].choices[0].value;
                }
                setQuiz(p => ({ ...p, clusters: nc }));
             } else {
                Swal.fire('Không thể xoá', 'Câu hỏi trắc nghiệm phải có ít nhất 2 lựa chọn.', 'info');
             }
        },
        handleOrderingItemChange: (cIdx, qIdx, itemIdx, value) => { const nc = [...quiz.clusters]; nc[cIdx].questions[qIdx].orderingItems[itemIdx].text = value; setQuiz(p => ({...p, clusters: nc})); },
        handleAddOrderingItem: (cIdx, qIdx) => { const nc = [...quiz.clusters]; nc[cIdx].questions[qIdx].orderingItems.push({ ...emptyOrderingItem, id: Date.now() }); setQuiz(p => ({...p, clusters: nc})); },
        handleRemoveOrderingItem: (cIdx, qIdx, itemIdx) => { const nc = [...quiz.clusters]; if(nc[cIdx].questions[qIdx].orderingItems.length > 2) nc[cIdx].questions[qIdx].orderingItems.splice(itemIdx, 1); setQuiz(p => ({...p, clusters: nc})); },
        handleQuestionTypeChange: (cIdx, qIdx, newType) => {
            const nc = [...quiz.clusters]; const q = nc[cIdx].questions[qIdx]; q.type = newType;
            if (newType === 'multiple_choice') { if(!q.choices || q.choices.length < 2) {q.choices = [{ text: '', value: 'A', imageUrl: null }, { text: '', value: 'B', imageUrl: null }]; q.correctAnswer = 'A';} delete q.orderingItems; }
            else if (newType === 'fill_in_the_blank') { delete q.choices; delete q.orderingItems; q.correctAnswer = ''; }
            else if (newType === 'ordering') { delete q.choices; if(!q.orderingItems || q.orderingItems.length < 2) q.orderingItems = [{ ...emptyOrderingItem, id: Date.now() }, { ...emptyOrderingItem, id: Date.now()+1 }]; delete q.correctAnswer; }
            setQuiz(p => ({ ...p, clusters: nc }));
        },
        handleImageFileChange: (e, cIdx, qIdx, chIdx = null) => {
            const file = e.target.files[0]; if (!file) return; const nc = [...quiz.clusters]; const tempUrl = URL.createObjectURL(file);
            const target = chIdx !== null ? nc[cIdx].questions[qIdx].choices[chIdx] : nc[cIdx].questions[qIdx];
            target.imageFile = file; target.imageUrl = tempUrl;
            setQuiz(p => ({ ...p, clusters: nc }));
        },
        handleRemoveImage: (cIdx, qIdx, chIdx = null) => {
            const nc = [...quiz.clusters];
            const target = chIdx !== null ? nc[cIdx].questions[qIdx].choices[chIdx] : nc[cIdx].questions[qIdx];
            target.imageFile = null; target.imageUrl = null;
            setQuiz(p => ({ ...p, clusters: nc }));
        }
    };
    
    // --- HÀM LƯU BỘ CÂU HỎI ---
    const compressAndUploadImage = async (file) => {
        if (!file) return null;
        return new Promise((resolve, reject) => {
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
                        const storageRef = ref(storage, `quiz_images/${user.uid}/${Date.now()}_${file.name.split('.')[0]}.webp`);
                        try {
                            const snapshot = await uploadBytes(storageRef, blob);
                            const downloadURL = await getDownloadURL(snapshot.ref);
                            resolve(downloadURL);
                            URL.revokeObjectURL(img.src); // Giải phóng bộ nhớ
                        } catch (error) { reject(error); }
                    }, 'image/webp', 0.85);
                };
                img.onerror = reject;
            };
            reader.onerror = reject;
        });
    };

    const handleSave = async () => {
        if (!quiz.title.trim()) return Swal.fire('Thiếu thông tin', 'Vui lòng nhập tên cho bộ câu hỏi.', 'warning');
        
        // Validate trước khi lưu
        const validation = validateQuizData(quiz);
        if (validation.errors.length > 0) {
            let errorHtml = '<div style="text-align: left; font-size: 14px;"><ul>';
            validation.errors.forEach(err => errorHtml += `<li>${err}</li>`);
            errorHtml += '</ul></div>';
            
            const result = await Swal.fire({
                icon: 'warning',
                title: 'Phát hiện lỗi',
                html: `<p>Bộ câu hỏi có ${validation.errors.length} lỗi cần sửa.</p>${errorHtml}`,
                showCancelButton: true,
                confirmButtonText: 'Lưu (có lỗi)',
                cancelButtonText: 'Huỷ',
                confirmButtonColor: '#f39c12'
            });
            
            if (!result.isConfirmed) return;
        }

        setIsSaving(true);
        
        let progressHtml = `
            <div style="text-align: left; font-size: 14px; padding: 10px;">
                <div id="step1" style="margin-bottom: 8px;">⏳ <strong>Bước 1:</strong> Kiểm tra dữ liệu...</div>
                <div id="step2" style="margin-bottom: 8px; color: #999;">⏳ <strong>Bước 2:</strong> Upload hình ảnh...</div>
                <div id="step3" style="margin-bottom: 8px; color: #999;">⏳ <strong>Bước 3:</strong> Lưu file JSON...</div>
                <div id="step4" style="margin-bottom: 8px; color: #999;">⏳ <strong>Bước 4:</strong> Cập nhật database...</div>
            </div>
        `;
        
        Swal.fire({ 
            title: 'Đang lưu bộ câu hỏi...', 
            html: progressHtml, 
            allowOutsideClick: false, 
            showConfirmButton: false,
            didOpen: () => Swal.showLoading() 
        });

        try {
            // Bước 1: Kiểm tra thời gian
            if (isTimeGated && openTime && closeTime && new Date(closeTime) < new Date(openTime)) {
                throw new Error('Thời gian đóng không được trước thời gian mở.');
            }
            document.getElementById('step1').innerHTML = '✅ <strong>Bước 1:</strong> Kiểm tra dữ liệu... <em>Hoàn tất</em>';
            document.getElementById('step1').style.color = '#28a745';
            
            let quizToSave = JSON.parse(JSON.stringify(quiz));

            if (!isPasswordEnabled || !quizToSave.password?.trim()) {
                delete quizToSave.password;
            } else {
                quizToSave.password = quizToSave.password.trim();
            }

            // Bước 2: Upload hình ảnh
            document.getElementById('step2').style.color = '#000';
            let imageCount = 0;
            for (const cluster of quizToSave.clusters) {
                for (const question of cluster.questions) {
                    if (question.imageUrl && question.imageUrl.startsWith('blob:')) {
                        const originalQFile = quiz.clusters.flatMap(c => c.questions).find(q => q.questionText === question.questionText)?.imageFile;
                        if(originalQFile) {
                            question.imageUrl = await compressAndUploadImage(originalQFile);
                            imageCount++;
                            document.getElementById('step2').innerHTML = `⏳ <strong>Bước 2:</strong> Upload hình ảnh... <em>(${imageCount} ảnh)</em>`;
                        }
                    }
                    delete question.imageFile;

                    if (question.choices) {
                        for (const choice of question.choices) {
                            if (choice.imageUrl && choice.imageUrl.startsWith('blob:')) {
                                const originalChFile = quiz.clusters.flatMap(c=>c.questions).flatMap(q=>q.choices).find(ch=>ch.text === choice.text)?.imageFile;
                                if(originalChFile) {
                                    choice.imageUrl = await compressAndUploadImage(originalChFile);
                                    imageCount++;
                                    document.getElementById('step2').innerHTML = `⏳ <strong>Bước 2:</strong> Upload hình ảnh... <em>(${imageCount} ảnh)</em>`;
                                }
                            }
                            delete choice.imageFile;
                        }
                    }
                }
            }
            document.getElementById('step2').innerHTML = `✅ <strong>Bước 2:</strong> Upload hình ảnh... <em>Hoàn tất (${imageCount} ảnh)</em>`;
            document.getElementById('step2').style.color = '#28a745';
            
            // Bước 3: Lưu file JSON
            document.getElementById('step3').style.color = '#000';
            const questionCount = quizToSave.clusters.reduce((count, cluster) => count + (cluster.questions?.length || 0), 0);
            const jsonString = JSON.stringify(quizToSave);
            const fileSizeKB = (new Blob([jsonString]).size / 1024).toFixed(2);
            
            if (quizId !== 'new' && originalStoragePath) {
                await deleteObject(ref(storage, originalStoragePath)).catch(e => console.warn("Bỏ qua lỗi xóa file cũ:", e));
            }
            
            const newStoragePath = `quizzes/${groupId || user.uid}/${Date.now()}.json`;
            const storageRef = ref(storage, newStoragePath);
            await uploadString(storageRef, jsonString, 'raw', { contentType: 'application/json' });
            const downloadURL = await getDownloadURL(storageRef);
            document.getElementById('step3').innerHTML = `✅ <strong>Bước 3:</strong> Lưu file JSON... <em>Hoàn tất (${fileSizeKB} KB)</em>`;
            document.getElementById('step3').style.color = '#28a745';

            // Bước 4: Cập nhật database
            document.getElementById('step4').style.color = '#000';
            const finalPayload = { 
                title: quiz.title, 
                description: quiz.description || '',
                hasPassword: !!quizToSave.password,
                questionCount,
                openTime: isTimeGated && openTime ? new Date(openTime) : null,
                closeTime: isTimeGated && closeTime ? new Date(closeTime) : null,
                downloadURL, 
                storagePath: newStoragePath, 
                fileType: 'json', 
                authorId: user.uid, 
                groupId: groupId 
            };
            
            if (quizId && quizId !== 'new') {
                await setDoc(doc(db, 'quizzes', quizId), { ...finalPayload, updatedAt: serverTimestamp() }, { merge: true });
            } else {
                await addDoc(collection(db, 'quizzes'), { ...finalPayload, createdAt: serverTimestamp() });
            }
            document.getElementById('step4').innerHTML = '✅ <strong>Bước 4:</strong> Cập nhật database... <em>Hoàn tất</em>';
            document.getElementById('step4').style.color = '#28a745';

            Swal.fire({
                icon: 'success',
                title: 'Lưu thành công!',
                html: `<p>Đã lưu <strong>${questionCount} câu hỏi</strong> trong <strong>${quizToSave.clusters.length} cụm</strong>.</p>`,
                timer: 2000,
                showConfirmButton: false
            });
            
            setTimeout(() => {
                navigate(teacherSlug ? `/dashboard/${teacherSlug}` : '/admin');
            }, 2000);

        } catch (error) {
            Swal.fire('Lỗi!', `Có lỗi xảy ra khi lưu: ${error.message}`, 'error');
        } finally {
            setIsSaving(false);
        }
    };
    
    if (loading) return <div className="screen-container d-flex justify-content-center align-items-center vh-100"><div className="spinner-border text-primary" role="status"><span className="visually-hidden">Loading...</span></div></div>;
    // ✅ DÁN ĐOẠN CODE NÀY VÀO ĐÂY (TRƯỚC LỆNH RETURN)
    const fullQuillModules = {
        toolbar: [
            [{ 'header': [1, 2, 3, false] }, { 'font': [] }],
            ['bold', 'italic', 'underline', 'strike', 'blockquote'],
            // Thêm tùy chọn màu chữ và màu nền
            [{ 'color': [] }, { 'background': [] }],
            // Thêm danh sách (enum, item)
            [{'list': 'ordered'}, {'list': 'bullet'}],
            [{ 'indent': '-1' }, { 'indent': '+1' }],
            [{ 'align': [] }],
            ['link', 'image'],
            ['clean']
        ],
    };
    return (
    <div className="quiz-editor container py-4">
        <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
            <h1 className="mb-0 fw-bold text-primary">{quizId === 'new' ? 'Soạn' : 'Chỉnh sửa'} Bộ câu hỏi</h1>
            <div className="d-flex align-items-center gap-2">
                <div className="btn-group">
                    <button type="button" className="btn btn-outline-primary dropdown-toggle" data-bs-toggle="dropdown" aria-expanded="false">
                       <i className="fa-solid fa-download me-2"></i>Tải về
                    </button>
                    <ul className="dropdown-menu">
                        <li><h6 className="dropdown-header"><i className="fa-solid fa-arrow-down me-1"></i> Tải bộ câu hỏi này</h6></li>
                        <li><button className="dropdown-item" onClick={() => handleDownloadCurrentQuiz('txt')}>
                            <i className="fa-solid fa-file-alt me-2"></i>Tải về TXT
                        </button></li>
                        <li><button className="dropdown-item" onClick={() => handleDownloadCurrentQuiz('json')}>
                            <i className="fa-solid fa-file-code me-2"></i>Tải về JSON
                        </button></li>
                        <li><button className="dropdown-item" onClick={() => handleDownloadCurrentQuiz('both')}>
                            <i className="fa-solid fa-download me-2"></i>Tải cả TXT & JSON
                        </button></li>
                        <li><hr className="dropdown-divider" /></li>
                        <li><h6 className="dropdown-header"><i className="fa-solid fa-file-lines me-1"></i> Tải mẫu file trống</h6></li>
                        <li><button className="dropdown-item" onClick={handleDownloadTxtTemplate}>
                            <i className="fa-solid fa-file me-2"></i>Mẫu TXT
                        </button></li>
                        <li><button className="dropdown-item" onClick={handleDownloadXlsxTemplate}>
                            <i className="fa-solid fa-file-excel me-2"></i>Mẫu Excel (.xlsx)
                        </button></li>
                        <li><button className="dropdown-item" onClick={handleDownloadDocxTemplate}>
                            <i className="fa-solid fa-file-word me-2"></i>Mẫu Word (.docx)
                        </button></li>
                    </ul>
                </div>
                <label htmlFor="quizUpload" className="btn btn-outline-primary">
                    <i className="fa-solid fa-upload me-2"></i>Tải lên từ file
                </label>
                <input type="file" id="quizUpload" accept=".json,.txt,.csv,.docx,.xlsx,.xls" style={{display: 'none'}} onChange={handleUploadQuiz} />
                <button className="btn btn-primary" onClick={handleSave} disabled={isSaving}>
                    {isSaving ? <><span className="spinner-border spinner-border-sm"></span> Đang lưu...</> : <><i className="fa-solid fa-save me-2"></i>Lưu</>}
                </button>
                <button className="btn btn-secondary" onClick={() => navigate(teacherSlug ? `/dashboard/${teacherSlug}` : '/admin')}>Quay lại</button>
            </div>
        </div>
        
        <div className="card mb-4 border-primary shadow-sm">
            <div className="card-header bg-primary text-white">Thông tin chung & Cài đặt</div>
            <div className="card-body">
                <div className="row g-3">
                    <div className="col-md-8">
                        <label className="fw-bold text-dark">Tên Bộ câu hỏi</label>
                        <input type="text" className="form-control border-primary form-control-lg" value={quiz.title} onChange={(e) => handlers.handleQuizChange('title', e.target.value)} placeholder="VD: Đề thi Logic cuối kỳ" />
                    </div>
                     <div className="col-md-4">
                        <label className="fw-bold text-dark">Mô tả (tùy chọn)</label>
                        <input type="text" className="form-control border-primary form-control-lg" value={quiz.description} onChange={(e) => handlers.handleQuizChange('description', e.target.value)} placeholder="VD: Dành cho lớp LOG101" />
                    </div>
                </div>

                <div className="mt-3 pt-3 border-top">
                    <div className="form-check form-switch mb-2">
                        <input className="form-check-input" type="checkbox" role="switch" id="passwordSwitch" checked={isPasswordEnabled} onChange={e => {setIsPasswordEnabled(e.target.checked); if (!e.target.checked) { handlers.handleQuizChange('password', ''); }}} />
                        {/* ✅ SỬA LỖI 1: Thẻ <label> bị gõ sai */}
                        <label className="form-check-label fw-medium" htmlFor="passwordSwitch">
                            Yêu cầu mật khẩu để làm bài
                        </label>
                    </div>
                    {isPasswordEnabled && (
                        <div className="mt-2" style={{ maxWidth: '400px' }}>
                            <label htmlFor="quizPassword">Nhập mật khẩu:</label>
                            {/* ✅ SỬA LỖI 2: 'e.g.target.value' bị gõ sai */}
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
                          Cụm câu hỏi {cIdx + 1} ({cluster.questions?.length || 0} câu)
                        </button>
                    </h2>
                    <div id={`collapse-${cIdx}`} className={`accordion-collapse collapse ${!cluster.isCollapsed ? 'show' : ''}`}>
                        <div className="accordion-body bg-light">
                            <div className="card mb-3">
                                <div className="card-body">
                                    <label className="fw-bold text-dark">Giả thiết chung (tùy chọn)</label>
                                    <ReactQuill 
                                        theme="snow" 
                                        value={cluster.commonAssumption?.intro || ''} 
                                        onChange={value => handlers.handleAssumptionChange(cIdx, 'intro', value)} 
                                        placeholder="Nhập giả thiết hoặc bối cảnh chung cho các câu hỏi trong cụm này..."
                                        modules={fullQuillModules} // ✅ THAY BẰNG DÒNG NÀY
                                    />
                                </div>
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
                            
                            <div className="d-flex justify-content-between mt-3">
                                <button className="btn btn-sm btn-outline-primary" onClick={() => handlers.handleAddQuestion(cIdx)}>
                                    <i className="fa-solid fa-plus me-1"></i> Thêm câu hỏi vào cụm
                                </button>
                                {quiz.clusters.length > 1 && (
                                    <button className="btn btn-sm btn-outline-danger" onClick={() => handlers.handleRemoveCluster(cIdx)}>
                                        <i className="fa-solid fa-trash-can me-1"></i> Xóa cụm này
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </div>

        <button className="btn btn-secondary" onClick={handlers.handleAddCluster}>
            <i className="fa-solid fa-layer-group me-2"></i>Thêm Cụm câu hỏi mới
        </button>
    </div>
);
};

export default QuizEditor;