// ===================================================
// HƯỚNG DẪN: Copy toàn bộ script này và paste vào Console trong DevTools
// Khi đang ở trang QuizEditor: gamelogic4u.web.app/dashboard/thaysang/quiz/...
// Nhấn F12 → Tab Console → Paste → Enter
// ===================================================

(async function() {
  console.log('🚀 Starting quiz download...');
  
  // Get quiz ID from URL
  const urlParts = window.location.pathname.split('/');
  const quizId = urlParts[urlParts.length - 1];
  console.log('📝 Quiz ID:', quizId);
  
  // Import Firebase if not already available
  if (!window.firebase) {
    console.error('❌ Firebase not loaded!');
    return;
  }
  
  const db = window.firebase.firestore();
  
  try {
    // Get quiz from Firestore
    const quizDoc = await db.collection('quizzes').doc(quizId).get();
    if (!quizDoc.exists) {
      console.error('❌ Quiz not found!');
      return;
    }
    
    const quizMeta = quizDoc.data();
    console.log('📚 Found:', quizMeta.title);
    
    // Fetch quiz content from storage
    console.log('⏳ Downloading from storage...');
    const response = await fetch(quizMeta.downloadURL);
    const quizData = await response.json();
    
    // Create TXT content
    let txt = `# TIÊU ĐỀ: ${quizData.title}\n`;
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
      
      if (cluster.commonAssumption?.rules) {
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
          txt += `    Đáp án: ${q.correctAnswer}\n`;
        } else if (q.type === 'ordering') {
          q.orderingItems?.forEach((item, idx) => {
            txt += `    ${idx + 1}. ${item.text}\n`;
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
    
    // Download TXT file
    const txtBlob = new Blob([txt], { type: 'text/plain;charset=utf-8' });
    const txtFilename = `${quizData.title.replace(/[^a-zA-Z0-9]/g, '_')}.txt`;
    const txtUrl = URL.createObjectURL(txtBlob);
    const txtLink = document.createElement('a');
    txtLink.href = txtUrl;
    txtLink.download = txtFilename;
    txtLink.click();
    console.log('✅ Downloaded TXT:', txtFilename);
    
    // Download JSON file
    const jsonBlob = new Blob([JSON.stringify(quizData, null, 2)], { type: 'application/json' });
    const jsonFilename = `${quizData.title.replace(/[^a-zA-Z0-9]/g, '_')}.json`;
    const jsonUrl = URL.createObjectURL(jsonBlob);
    const jsonLink = document.createElement('a');
    jsonLink.href = jsonUrl;
    jsonLink.download = jsonFilename;
    jsonLink.click();
    console.log('✅ Downloaded JSON:', jsonFilename);
    
    console.log('🎉 Download complete!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
})();
