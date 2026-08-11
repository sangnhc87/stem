import React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { auth, db } from '../firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { collection, query, where, onSnapshot, doc, getDocs, updateDoc, addDoc, deleteDoc, writeBatch } from 'firebase/firestore';
import Leaderboard from './Leaderboard'; // Di chuyển dòng import lên đây
const Swal = window.Swal;
const mammoth = window.mammoth; // Thư viện đọc file .docx
const docx = window.docx; // Thư viện tạo file .docx
const XLSX = window.XLSX; // Thư viện tạo file .xlsx
// --- CÁC MẪU SOẠN THẢO (dạng text) ---
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

const TeacherDashboard = () => {
    const { teacherSlug } = useParams();
    const navigate = useNavigate();
    const [user] = useAuthState(auth);
    const [group, setGroup] = React.useState(null);
    const [quizzes, setQuizzes] = React.useState([]);
    const [students, setStudents] = React.useState([]);
    const [notification, setNotification] = React.useState('');
    
    const [activeTab, setActiveTab] = React.useState('quizzes'); 
    
    const [searchTerm, setSearchTerm] = React.useState('');
    const [leaderboardStartDate, setLeaderboardStartDate] = React.useState('');
    const [leaderboardEndDate, setLeaderboardEndDate] = React.useState('');
    const [deleteStartDate, setDeleteStartDate] = React.useState('');
    const [deleteEndDate, setDeleteEndDate] = React.useState('');
    const [welcomeMessage, setWelcomeMessage] = React.useState('');

    const showNotification = (message) => {
        setNotification(message);
        setTimeout(() => setNotification(''), 4000);
    };

    React.useEffect(() => {
        if (!user) return;
        
        const fetchGroupData = () => {
            try {
                const groupsQuery = query(collection(db, 'groups'), where('slug', '==', teacherSlug), where('teacherId', '==', user.uid));
                
                const unsubGroup = onSnapshot(groupsQuery, (groupSnapshot) => {
                    if (!groupSnapshot.empty) {
                        const groupDoc = groupSnapshot.docs[0];
                        const groupData = { id: groupDoc.id, ...groupDoc.data() };
                        setGroup(groupData);
                        setLeaderboardStartDate(groupData.leaderboardStartDate || '');
                        setLeaderboardEndDate(groupData.leaderboardEndDate || '');
                        setWelcomeMessage(groupData.welcomeMessage || `Chào mừng đến lớp học của ${groupData.name}`);
                        
                        if (quizzes.length === 0) {
                            const qQuery = query(collection(db, 'quizzes'), where('groupId', '==', groupDoc.id));
                            onSnapshot(qQuery, snap => setQuizzes(snap.docs.map(d => ({id: d.id, ...d.data()}))));
                        }
                        if (students.length === 0) {
                            const sQuery = query(collection(db, 'users'), where('groupId', '==', groupDoc.id));
                            onSnapshot(sQuery, snap => setStudents(snap.docs.map(d => ({id: d.id, ...d.data()}))));
                        }
                    }
                });
                return () => unsubGroup();
            } catch (error) {
                console.error("Lỗi khi lấy dữ liệu lớp học:", error);
            }
        };

        fetchGroupData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user, teacherSlug]);

    // --- CÁC HÀM XỬ LÝ GIAO DIỆN (KHÔNG THAY ĐỔI) ---
    const handleToggleAutoApprove = async () => { if (!group) return; const newValue = !group.autoApproveStudents; await updateDoc(doc(db, 'groups', group.id), { autoApproveStudents: newValue }); showNotification(newValue ? 'Đã BẬT chế độ tự động duyệt học viên. ✅' : 'Đã TẮT chế độ tự động duyệt học viên. ❌'); };
    const handleBulkApprove = async () => { const pendingStudents = students.filter(s => s.status === 'pending'); if (pendingStudents.length === 0) { Swal.fire('Thông báo', 'Không có học viên nào đang chờ duyệt.', 'info'); return; } const result = await Swal.fire({ title: `Duyệt ${pendingStudents.length} học viên?`, text: 'Tất cả học viên trong danh sách chờ sẽ được chấp nhận vào lớp.', icon: 'question', showCancelButton: true, confirmButtonText: 'Đồng ý', cancelButtonText: 'Hủy' }); if (result.isConfirmed) { const batch = writeBatch(db); pendingStudents.forEach(student => { const studentRef = doc(db, 'users', student.id); batch.update(studentRef, { status: 'approved' }); }); await batch.commit(); showNotification(`Đã duyệt thành công ${pendingStudents.length} học viên.`); } };
    const filteredStudents = students.filter(student => { const term = searchTerm.toLowerCase(); const displayName = student.displayName?.toLowerCase() || ''; const email = student.email?.toLowerCase() || ''; return displayName.includes(term) || email.includes(term); });
    const handleLeaderboardDateChange = async () => { if (!group) return; await updateDoc(doc(db, 'groups', group.id), { leaderboardStartDate: leaderboardStartDate || null, leaderboardEndDate: leaderboardEndDate || null }); showNotification('Đã áp dụng bộ lọc cho bảng xếp hạng của lớp! ✅'); };
    const handleClearLeaderboardDate = async () => { if (!group) return; await updateDoc(doc(db, 'groups', group.id), { leaderboardStartDate: null, leaderboardEndDate: null }); setLeaderboardStartDate(''); setLeaderboardEndDate(''); showNotification('Đã xóa bộ lọc, bảng xếp hạng sẽ hiển thị toàn thời gian. 🔄'); };
    const handleUpdateWelcomeMessage = async () => { if (!group || !welcomeMessage.trim()) { showNotification('Vui lòng nhập thông điệp chào mừng hợp lệ.'); return; } await updateDoc(doc(db, 'groups', group.id), { welcomeMessage: welcomeMessage.trim() }); showNotification('Đã cập nhật thông điệp chào mừng! ✅'); };
    const handleDeleteDataByDateRange = async () => { if (!group || !deleteStartDate || !deleteEndDate) { Swal.fire('Thiếu thông tin', 'Vui lòng chọn cả ngày bắt đầu và ngày kết thúc.', 'warning'); return; } const { value: confirmationText } = await Swal.fire({ title: '⚠️ HÀNH ĐỘNG NGUY HIỂM ⚠️', html: `Bạn sắp **XÓA VĨNH VIỄN** toàn bộ lịch sử và điểm số thi của học viên trong lớp từ ngày <b>${deleteStartDate}</b> đến <b>${deleteEndDate}</b>. <br/><br/>Hành động này <b>KHÔNG THỂ HOÀN TÁC</b>. <br/><br/>Để xác nhận, vui lòng nhập chữ "<b>XÓA</b>" vào ô bên dưới:`, input: 'text', inputPlaceholder: 'Nhập XÓA để xác nhận', icon: 'warning', showCancelButton: true, confirmButtonText: 'Tôi hiểu và xác nhận XÓA', confirmButtonColor: '#d33', cancelButtonText: 'Hủy bỏ', inputValidator: (value) => { if (value !== 'XÓA') { return 'Bạn cần nhập chính xác từ "XÓA" để tiếp tục!'; } return null; } }); if (confirmationText !== 'XÓA') return; try { Swal.fire({ title: 'Đang xử lý...', html: 'Hệ thống đang tìm và xóa dữ liệu. Vui lòng không đóng trang.', allowOutsideClick: false, didOpen: () => Swal.showLoading() }); const start = new Date(deleteStartDate); start.setHours(0, 0, 0, 0); const end = new Date(deleteEndDate); end.setHours(23, 59, 59, 999); const scoresRef = collection(db, 'scores'); const q = query(scoresRef, where('groupId', '==', group.id), where('timestamp', '>=', start), where('timestamp', '<=', end)); const querySnapshot = await getDocs(q); const batch = writeBatch(db); let deletedCount = 0; querySnapshot.forEach((doc) => { batch.delete(doc.ref); deletedCount++; }); if (deletedCount > 0) { await batch.commit(); Swal.fire('Thành công!', `Đã xóa thành công ${deletedCount} mục dữ liệu.`, 'success'); } else { Swal.fire('Không có dữ liệu', 'Không tìm thấy dữ liệu thi nào trong khoảng thời gian đã chọn.', 'info'); } } catch (error) { console.error("Lỗi khi xóa dữ liệu:", error); Swal.fire('Đã xảy ra lỗi', 'Không thể hoàn tất việc xóa dữ liệu. Vui lòng thử lại.', 'error'); } };
    const handleDeleteQuiz = async (quizId, title) => { const result = await Swal.fire({ title: `Bạn chắc chắn muốn xóa "${title}"?`, text: "Hành động này không thể hoàn tác!", icon: 'warning', showCancelButton: true, confirmButtonText: 'Vâng, xóa nó!' }); if (result.isConfirmed) { await deleteDoc(doc(db, 'quizzes', quizId)); Swal.fire('Đã xóa!', `Bộ câu hỏi "${title}" đã được xóa.`, 'success'); } };
    const handleStatusChange = async (studentId, newStatus) => { await updateDoc(doc(db, 'users', studentId), { status: newStatus }); showNotification('Đã cập nhật trạng thái học viên.'); };
    
    // --- BỘ PHÂN TÍCH FILE MẪU (KHÔNG THAY ĐỔI) ---
    const parseSmartTxtToQuizJson = (txt) => { const quiz = { title: 'Chưa có tiêu đề', clusters: [] }; const lines = txt.split('\n'); let currentCluster = null; let currentQuestion = null; for (const line of lines) { const trimmedLine = line.trim(); if (!trimmedLine || trimmedLine.startsWith('//') || trimmedLine.startsWith('# ')) continue; if (trimmedLine.startsWith('## ')) { currentCluster = { assumption: '', questions: [] }; quiz.clusters.push(currentCluster); } else if (trimmedLine.startsWith('> ')) { if (currentCluster) { currentCluster.assumption += (currentCluster.assumption ? '\n' : '') + trimmedLine.substring(2).trim(); } } else if (trimmedLine.match(/^\d+\.\s/)) { if (!currentCluster) { currentCluster = { assumption: '', questions: [] }; quiz.clusters.push(currentCluster); } currentQuestion = { content: trimmedLine.substring(trimmedLine.indexOf(' ') + 1).trim(), options: [], answer: '', correctPoints: 10, incorrectPoints: 0, penaltyMinutes: 0, solution: '', type: 'TU_LUAN' }; currentCluster.questions.push(currentQuestion); } else if (trimmedLine.startsWith('- (')) { if (currentQuestion) { currentQuestion.type = 'TRAC_NGHIEM'; const isCorrect = trimmedLine.includes('[x]') || line.includes('**'); const optionMatch = trimmedLine.match(/\((.*?)\)/); const optionLetter = optionMatch ? optionMatch[1] : ''; const optionText = trimmedLine.replace(/-\s*\(.*?\)\s*(\[x\])?\s*/, '').replace(/\*\*/g, '').trim(); currentQuestion.options.push({ label: optionLetter, text: optionText }); if (isCorrect) { currentQuestion.answer = optionLetter; } } } else if (trimmedLine.toLowerCase().startsWith('điểm:')) { if (currentQuestion) { const points = trimmedLine.substring(6).trim().split(',').map(p => parseInt(p.trim(), 10)); currentQuestion.correctPoints = points[0] || 10; currentQuestion.incorrectPoints = points[1] || 0; } } else if (trimmedLine.toLowerCase().startsWith('phạt:')) { if (currentQuestion) { const penalty = parseInt(trimmedLine.match(/\d+/)?.[0] || '0', 10); currentQuestion.penaltyMinutes = penalty; } } else if (trimmedLine.toLowerCase().startsWith('giải thích:')) { if (currentQuestion) { currentQuestion.solution = trimmedLine.substring(11).trim(); currentQuestion.showSolution = true; } } } return quiz; };
    const parseCsvToQuizJson = (csv) => { const lines = csv.split('\n').filter(line => line.trim() !== ''); const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim()); const quiz = { title: 'Chưa có tiêu đề', clusters: [] }; let clusterMap = {}; for (let i = 1; i < lines.length; i++) { const data = lines[i].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(d => d.replace(/"/g, '').trim()); const row = headers.reduce((obj, header, index) => { obj[header] = data[index]; return obj; }, {}); if (row.loai_dong === 'TIEU_DE') { quiz.title = row.noi_dung_cau_hoi; } else if (row.loai_dong === 'CUM') { const clusterId = parseInt(row.cum_so, 10); const newCluster = { assumption: row.gia_thiet_cum, questions: [] }; quiz.clusters.push(newCluster); clusterMap[clusterId] = newCluster; } else if (row.loai_dong === 'CAU_HOI') { const clusterId = parseInt(row.cum_so, 10); const targetCluster = clusterMap[clusterId]; if (targetCluster) { const question = { content: row.noi_dung_cau_hoi, type: row.loai_cau_hoi, options: [], answer: row.dap_an_dung, correctPoints: parseInt(row.diem_dung, 10) || 10, incorrectPoints: parseInt(row.diem_sai, 10) || 0, penaltyMinutes: parseInt(row.phut_phat, 10) || 0, solution: row.giai_thich, showSolution: !!row.giai_thich, }; if (row.lua_chon_a) question.options.push({ label: 'A', text: row.lua_chon_a }); if (row.lua_chon_b) question.options.push({ label: 'B', text: row.lua_chon_b }); if (row.lua_chon_c) question.options.push({ label: 'C', text: row.lua_chon_c }); if (row.lua_chon_d) question.options.push({ label: 'D', text: row.lua_chon_d }); targetCluster.questions.push(question); } } } return quiz; };
    const parseDocxToQuizJson = async (arrayBuffer) => { if (!mammoth) { throw new Error("Thư viện mammoth.js chưa được tải."); } const result = await mammoth.convertToHtml({ arrayBuffer: arrayBuffer }); const html = result.value; const tempDiv = document.createElement('div'); tempDiv.innerHTML = html; const quiz = { title: 'Chưa có tiêu đề', clusters: [] }; let currentCluster = null; let currentQuestion = null; const elements = Array.from(tempDiv.children); for (const el of elements) { const text = el.textContent.trim(); if (el.tagName === 'H1') { quiz.title = text; } else if (el.tagName === 'H2') { currentCluster = { assumption: '', questions: [] }; quiz.clusters.push(currentCluster); } else if (el.tagName === 'BLOCKQUOTE') { if (currentCluster) { currentCluster.assumption += (currentCluster.assumption ? '\n' : '') + text; } } else if (el.tagName === 'P' && text.match(/^\d+\.\s/)) { if (!currentCluster) { currentCluster = { assumption: '', questions: [] }; quiz.clusters.push(currentCluster); } currentQuestion = { content: text.substring(text.indexOf(' ') + 1).trim(), options: [], answer: '', correctPoints: 10, incorrectPoints: 0, penaltyMinutes: 0, solution: '', type: 'TU_LUAN' }; currentCluster.questions.push(currentQuestion); } else if (el.tagName === 'UL') { if (currentQuestion) { currentQuestion.type = 'TRAC_NGHIEM'; const options = Array.from(el.getElementsByTagName('li')); for (const opt of options) { const optText = opt.textContent.trim(); const optionMatch = optText.match(/\((.*?)\)/); const optionLetter = optionMatch ? optionMatch[1] : ''; if (opt.querySelector('strong')) { currentQuestion.answer = optionLetter; } currentQuestion.options.push({ label: optionLetter, text: optText.replace(/\(.*?\)\s*/, '') }); } } } else if (currentQuestion && text) { if (text.toLowerCase().startsWith('điểm:')) { const points = text.substring(6).trim().split(',').map(p => parseInt(p.trim(), 10)); currentQuestion.correctPoints = points[0] || 10; currentQuestion.incorrectPoints = points[1] || 0; } else if (text.toLowerCase().startsWith('phạt:')) { const penalty = parseInt(text.match(/\d+/)?.[0] || '0', 10); currentQuestion.penaltyMinutes = penalty; } else if (text.toLowerCase().startsWith('giải thích:')) { currentQuestion.solution = text.substring(11).trim(); currentQuestion.showSolution = true; } } } return quiz; };

    // --- CẬP NHẬT: Các hàm tạo và tải file mẫu ---
    const downloadFile = (blob, fileName) => {
        try {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            showNotification(`Đã bắt đầu tải file ${fileName}`);
        } catch (error) {
            console.error("Lỗi khi tải file:", error);
            Swal.fire('Lỗi', 'Không thể tải file. Môi trường chạy có thể đã chặn hành động này.', 'error');
        }
    };

    const handleDownloadTxtTemplate = () => {
        const blob = new Blob([smartTemplateContent.trim()], { type: 'text/plain;charset=utf-8' });
        downloadFile(blob, 'mau_soan_thao_thong_minh.txt');
    };
    
    const handleDownloadXlsxTemplate = () => {
        if (!XLSX) { Swal.fire('Lỗi', 'Thư viện Excel (xlsx.js) chưa được tải.', 'error'); return; }
        const headers = ["loai_dong","cum_so","gia_thiet_cum","cau_hoi_so","loai_cau_hoi","noi_dung_cau_hoi","lua_chon_a","lua_chon_b","lua_chon_c","lua_chon_d","dap_an_dung","diem_dung","diem_sai","phut_phat","giai_thich"];
        const data = [
            ["TIEU_DE","","","","","Đề Thi Thử Cuối Kỳ","","","","","","","","",""],
            ["CUM","1","Đây là giả thiết chung cho cụm 1. Quy tắc 1. Quy tắc 2.","","","","","","","","","","","",""],
            ["CAU_HOI","1","","1","TRAC_NGHIEM","Nội dung câu hỏi 1?","Đáp án A","Đáp án B","Đáp án C","Đáp án D","B","10","-5","1","<p>Lời giải cho câu 1.</p>"],
            ["CAU_HOI","1","","2","TRAC_NGHIEM","Nội dung câu hỏi 2?","Đáp án A","Đáp án B","","","A","5","0","0","<p>Lời giải cho câu 2.</p>"],
            ["CUM","2","","","","","","","","","","","","",""],
            ["CAU_HOI","2","","3","TU_LUAN","Đây là câu hỏi tự luận?","","","","","","20","0","0","<p>Đáp án mẫu cho câu 3.</p>"]
        ];
        const ws = XLSX.utils.aoa_to_sheet([headers, ...data]);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Mau Soan Thao");
        XLSX.writeFile(wb, "mau_soan_thao.xlsx");
        showNotification('Đã bắt đầu tải file mẫu Excel (.xlsx)');
    };

    const handleDownloadDocxTemplate = () => {
        if (!docx) { Swal.fire('Lỗi', 'Thư viện Word (docx.js) chưa được tải.', 'error'); return; }
        const { Document, Packer, Paragraph, HeadingLevel, AlignmentType, TextRun, TabStopType, TabStopPosition, Numbering, Indent, SymbolRun } = docx;

        const doc = new Document({
            numbering: {
                config: [
                    {
                        reference: "numbering-style-1",
                        levels: [{ level: 0, format: "decimal", text: "%1.", alignment: AlignmentType.START }],
                    },
                    {
                        reference: "bullet-style-1",
                        levels: [{ level: 0, format: "bullet", text: "-", alignment: AlignmentType.START }],
                    },
                ],
            },
            sections: [{
                children: [
                    new Paragraph({ text: "Đề Thi Thử Logic Cuối Kỳ", heading: HeadingLevel.HEADING_1, alignment: AlignmentType.CENTER }),
                    new Paragraph({ text: "Cụm 1: Giả thiết chung", heading: HeadingLevel.HEADING_2 }),
                    new Paragraph({ text: "Đây là giả thiết chung cho cụm câu hỏi đầu tiên.", style: "Quote" }),
                    
                    new Paragraph({ text: "Đây là nội dung câu hỏi trắc nghiệm số 1?", numbering: { reference: "numbering-style-1", level: 0 } }),
                    new Paragraph({ text: "(A)\tLựa chọn A", numbering: { reference: "bullet-style-1", level: 0 }, indentation: { left: 720 } }),
                    new Paragraph({ children: [ new TextRun({ text: "(B)\tLựa chọn B", bold: true }) ], numbering: { reference: "bullet-style-1", level: 0 }, indentation: { left: 720 } }),
                    new Paragraph({ text: "(C)\tLựa chọn C", numbering: { reference: "bullet-style-1", level: 0 }, indentation: { left: 720 } }),
                    new Paragraph({ text: "---" }),
                    new Paragraph({ text: "Điểm: 10, -5" }),
                    new Paragraph({ text: "Phạt: 1 phút" }),
                    new Paragraph({ text: "Giải thích: Đây là lời giải chi tiết cho câu hỏi 1." }),

                    new Paragraph({ text: "Đây là câu hỏi thứ hai trong cùng cụm?", numbering: { reference: "numbering-style-1", level: 0 } }),
                    new Paragraph({ children: [ new TextRun({ text: "(A)\tLựa chọn đúng", bold: true }) ], numbering: { reference: "bullet-style-1", level: 0 }, indentation: { left: 720 } }),
                    new Paragraph({ text: "(B)\tLựa chọn sai", numbering: { reference: "bullet-style-1", level: 0 }, indentation: { left: 720 } }),
                    new Paragraph({ text: "---" }),
                    new Paragraph({ text: "Điểm: 5" }),
                ],
            }],
        });
        Packer.toBlob(doc).then(blob => downloadFile(blob, "mau_soan_thao.docx"));
    };

    // --- HÀM UPLOAD ĐÃ ĐƯỢC NÂNG CẤP TOÀN DIỆN ---
    const handleUploadQuiz = (event) => {
        const file = event.target.files[0];
        if (!file || !group) return;

        const reader = new FileReader();
        const processQuizData = async (quizData) => {
             if (!quizData || !quizData.title || !quizData.clusters) {
                throw new Error("Dữ liệu trong file không hợp lệ hoặc không thể phân tích.");
            }
            const quizWithGroup = { ...quizData, groupId: group.id };
            await addDoc(collection(db, 'quizzes'), quizWithGroup);
            Swal.fire('Thành công!', `Đã tải lên và tạo bộ câu hỏi "${quizData.title}".`, 'success');
        };
        const handleFileLoad = async (e) => {
             try {
                const content = e.target.result;
                let quizData;
                
                // --- SỬA LỖI ĐỌC FILE EXCEL ---
                if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
                    const workbook = XLSX.read(content, { type: 'binary' });
                    const sheetName = workbook.SheetNames[0];
                    const sheet = workbook.Sheets[sheetName];
                    const csv = XLSX.utils.sheet_to_csv(sheet);
                    quizData = parseCsvToQuizJson(csv);
                }
                // --- KẾT THÚC SỬA LỖI ---
                else if (file.name.endsWith('.docx')) {
                    quizData = await parseDocxToQuizJson(content);
                } else if (file.name.endsWith('.csv')) {
                    quizData = parseCsvToQuizJson(content);
                } else if (file.name.endsWith('.txt')) {
                    quizData = parseSmartTxtToQuizJson(content);
                } else if (file.name.endsWith('.json')) {
                    quizData = JSON.parse(content);
                } else {
                    throw new Error("Định dạng file không được hỗ trợ.");
                }
                await processQuizData(quizData);
            } catch (error) {
                console.error("Lỗi khi xử lý file:", error);
                Swal.fire('Lỗi!', `Không thể xử lý file: ${error.message}`, 'error');
            } finally {
                event.target.value = null;
            }
        };
        reader.onload = handleFileLoad;

        // --- SỬA LỖI ĐỌC FILE EXCEL ---
        if (file.name.endsWith('.docx')) {
            reader.readAsArrayBuffer(file);
        } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
             reader.readAsBinaryString(file);
        }
        // --- KẾT THÚC SỬA LỖI ---
        else {
            reader.readAsText(file, 'UTF-8');
        }
    };

    if (!group) return <div className="screen-container d-flex justify-content-center align-items-center vh-100"><div className="spinner-border text-primary" role="status"><span className="visually-hidden">Loading...</span></div></div>;
    const studentLink = `${window.location.origin}/${teacherSlug}`;

    return (
        <div className="container py-4">
            <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
                <h1 className="mb-0">Trang quản lý: {group.name}</h1>
                <Link to={`/${teacherSlug}`} className="btn btn-outline-primary"><i className="fa-solid fa-eye me-2"></i>Xem trang học sinh</Link>
            </div>
            {notification && ( <div className="alert alert-success">{notification}</div> )}
            <div className="alert alert-info">
                <strong>Link cho học sinh:</strong> <a href={studentLink} target="_blank" rel="noopener noreferrer">{studentLink}</a>
                <button className="btn btn-sm btn-outline-secondary ms-2" onClick={() => { navigator.clipboard.writeText(studentLink); showNotification('Đã sao chép link! 📋'); }}>Sao chép</button>
            </div>
            
            <ul className="nav nav-pills mb-3">
                <li className="nav-item"><button className={`nav-link ${activeTab === 'quizzes' ? 'active' : ''}`} onClick={() => setActiveTab('quizzes')}>📚 Quản lý Câu hỏi</button></li>
                <li className="nav-item"><button className={`nav-link ${activeTab === 'students' ? 'active' : ''}`} onClick={() => setActiveTab('students')}>🎓 Quản lý Học viên</button></li>
                <li className="nav-item"><button className={`nav-link ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => setActiveTab('settings')}>⚙️ Cài đặt Lớp học</button></li>
                <li className="nav-item"><button className={`nav-link ${activeTab === 'data' ? 'active' : ''}`} onClick={() => setActiveTab('data')}>🗑️ Quản lý Dữ liệu</button></li>
                <li className="nav-item"><button className={`nav-link ${activeTab === 'leaderboard' ? 'active' : ''}`} onClick={() => setActiveTab('leaderboard')}>🏆 Bảng Xếp Hạng</button></li>
            </ul>
            {/* THÊM KHỐI CODE NÀY VÀO */}
{activeTab === 'leaderboard' && (
    <div className="card">
        <div className="card-body">
            <h5 className="card-title">Bảng Xếp Hạng Toàn Lớp</h5>
            <p className="card-text">Theo dõi thứ hạng và điểm số của học viên trong thời gian thực.</p>
            <Leaderboard />
        </div>
    </div>
)}
            {activeTab === 'quizzes' && (
                <div className="card">
                    <div className="card-body">
                        <div className="d-flex justify-content-between align-items-center mb-3">
                            <h5 className="card-title mb-0">Kho câu hỏi của bạn</h5>
                            <button className="btn btn-success" onClick={() => navigate(`/dashboard/${teacherSlug}/quiz/new`)}>
                                <i className="fa-solid fa-plus me-2"></i>Soạn Bộ câu hỏi mới
                            </button>
                        </div>
                        <p>Sử dụng trình soạn thảo hoặc tải lên file <code>.txt</code>, <code>.json</code>, <code>.csv</code>, <code>.docx</code>.</p>
                        <div className="table-responsive">
                            <table className="table table-hover align-middle">
                                <thead><tr><th>Tên bộ câu hỏi</th><th className="text-end">Hành động</th></tr></thead>
                                <tbody>
                                    {quizzes.length === 0 && <tr><td colSpan="2">Chưa có bộ câu hỏi nào. Hãy tạo một bộ mới!</td></tr>}
                                    {quizzes.map(q => (
                                        <tr key={q.id}>
                                            <td>{q.title}</td>
                                            <td className="text-end">
                                                <button className="btn btn-sm btn-warning me-2" onClick={() => navigate(`/dashboard/${teacherSlug}/quiz/${q.id}`)}>Sửa</button>
                                                <button className="btn btn-sm btn-danger" onClick={() => handleDeleteQuiz(q.id, q.title)}>Xóa</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="mt-3 border-top pt-3">
                             <h6 className="card-subtitle mb-2 text-muted">Tải lên & Tải mẫu</h6>
                            <label htmlFor="quizUpload" className="btn btn-primary"><i className="fa-solid fa-upload me-2"></i>Tải lên từ file</label>
                            <div className="btn-group ms-2">
                                <button type="button" className="btn btn-outline-secondary dropdown-toggle" data-bs-toggle="dropdown" aria-expanded="false">
                                   <i className="fa-solid fa-download me-2"></i>Tải mẫu
                                </button>
                                <ul className="dropdown-menu">
                                    <li><button className="dropdown-item" onClick={handleDownloadTxtTemplate}>Mẫu thông minh (.txt)</button></li>
                                    <li><button className="dropdown-item" onClick={handleDownloadXlsxTemplate}>Mẫu Excel (.xlsx)</button></li>
                                    <li><button className="dropdown-item" onClick={handleDownloadDocxTemplate}>Mẫu Word (.docx)</button></li>
                                </ul>
                            </div>
                        </div>
                        {/* --- SỬA LỖI TẠI ĐÂY: Thêm .xlsx, .xls --- */}
                        <input type="file" id="quizUpload" accept=".json,.txt,.csv,.docx,.xlsx,.xls" style={{display: 'none'}} onChange={handleUploadQuiz} />
                    </div>
                </div>
            )}

            {/* CÁC TAB KHÁC GIỮ NGUYÊN */}
            {activeTab === 'students' && ( <div className="card"><div className="card-body"><h5 className="card-title">Danh sách học viên trong lớp ({students.length})</h5><div className="my-3 p-3 border rounded bg-light"><div className="row g-2 align-items-center"><div className="col-lg-5"><div className="input-group"><span className="input-group-text"><i className="fa-solid fa-search"></i></span><input type="text" className="form-control" placeholder="Tìm theo tên hoặc email..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /></div></div><div className="col-lg-7 d-flex align-items-center justify-content-start justify-content-lg-end flex-wrap gap-2"><div className="form-check form-switch" title="Bật để tự động chấp nhận học viên mới"><input className="form-check-input" type="checkbox" role="switch" id="autoApproveSwitch" checked={group.autoApproveStudents || false} onChange={handleToggleAutoApprove} /><label className="form-check-label" htmlFor="autoApproveSwitch">Tự động duyệt</label></div><button className="btn btn-sm btn-info" onClick={handleBulkApprove} disabled={students.filter(s => s.status === 'pending').length === 0}><i className="fa-solid fa-check-double me-2"></i> Duyệt tất cả ({students.filter(s => s.status === 'pending').length})</button></div></div></div><div className="table-responsive"><table className="table table-hover align-middle"><thead><tr><th>Học viên</th><th>Trạng thái</th></tr></thead><tbody>{filteredStudents.length === 0 && (<tr><td colSpan="2">{searchTerm ? 'Không tìm thấy học viên nào khớp với tìm kiếm của bạn.' : 'Chưa có học viên nào tham gia lớp.'}</td></tr>)}{filteredStudents.map(student => (<tr key={student.id}><td><img src={student.photoURL} alt={student.displayName} width="30" height="30" className="rounded-circle me-2" />{student.displayName || student.email}</td><td><select className="form-select form-select-sm w-auto" value={student.status} onChange={(e) => handleStatusChange(student.id, e.target.value)}><option value="pending">⏳ Chờ duyệt</option><option value="approved">✅ Đã chấp nhận</option><option value="banned">🚫 Đã cấm</option></select></td></tr>))}</tbody></table></div></div></div>)}
            {activeTab === 'settings' && ( <div className="card"><div className="card-body"><h5 className="card-title">Cài đặt Bảng Xếp Hạng Lớp học 🏆</h5><p className="card-text">Thiết lập khoảng thời gian tính điểm thi đua cho bảng xếp hạng của riêng lớp bạn.</p><div className="row g-3 align-items-center p-3 border rounded bg-light mb-4"><div className="col-md-auto"><label htmlFor="startDate" className="form-label fw-bold">Từ ngày:</label></div><div className="col-md-3"><input type="date" id="startDate" className="form-control" value={leaderboardStartDate} onChange={(e) => setLeaderboardStartDate(e.target.value)}/></div><div className="col-md-auto"><label htmlFor="endDate" className="form-label fw-bold">Đến ngày:</label></div><div className="col-md-3"><input type="date" id="endDate" className="form-control" value={leaderboardEndDate} onChange={(e) => setLeaderboardEndDate(e.target.value)}/></div><div className="col-md-auto"><button className="btn btn-primary" onClick={handleLeaderboardDateChange}>Áp dụng</button><button className="btn btn-secondary ms-2" onClick={handleClearLeaderboardDate}>Xem Toàn thời gian</button></div></div><h5 className="card-title">Cài đặt Thông điệp Chào mừng 👋</h5><p className="card-text">Tùy chỉnh văn bản hiển thị trên trang chính của lớp học.</p><div className="p-3 border rounded bg-light"><div className="mb-3"><label htmlFor="welcomeMessage" className="form-label">Thông điệp chào mừng:</label><textarea id="welcomeMessage" className="form-control" rows="2" placeholder={`Mặc định: Chào mừng đến lớp học của ${group.name}`} value={welcomeMessage} onChange={(e) => setWelcomeMessage(e.target.value)} /></div><button className="btn btn-primary" onClick={handleUpdateWelcomeMessage}>Lưu thay đổi</button></div></div></div>)}
            {activeTab === 'data' && ( <div className="card border-danger"><div className="card-header bg-danger text-white"><h5 className="mb-0">Vùng nguy hiểm: Xóa Dữ liệu Thi</h5></div><div className="card-body"><p className="card-text">Chức năng này cho phép bạn **xóa vĩnh viễn** điểm số và lịch sử làm bài của tất cả học viên trong một khoảng thời gian nhất định. Hãy sử dụng một cách cẩn thận.</p><div className="row g-3 align-items-center p-3 border rounded bg-light"><div className="col-md-auto"><label htmlFor="deleteStartDate" className="form-label fw-bold">Xóa từ ngày:</label></div><div className="col-md-3"><input type="date" id="deleteStartDate" className="form-control" value={deleteStartDate} onChange={(e) => setDeleteStartDate(e.target.value)}/></div><div className="col-md-auto"><label htmlFor="deleteEndDate" className="form-label fw-bold">Đến ngày:</label></div><div className="col-md-3"><input type="date" id="deleteEndDate" className="form-control" value={deleteEndDate} onChange={(e) => setDeleteEndDate(e.target.value)}/></div><div className="col-md-auto"><button className="btn btn-danger" onClick={handleDeleteDataByDateRange} disabled={!deleteStartDate || !deleteEndDate}><i className="fa-solid fa-trash-can me-2"></i>Xóa Dữ liệu</button></div></div>{!deleteStartDate || !deleteEndDate ? <div className="form-text text-muted mt-2">Vui lòng chọn cả hai ngày để kích hoạt nút xóa.</div> : ''}</div></div>)}
        </div>
    );
};

export default TeacherDashboard;

