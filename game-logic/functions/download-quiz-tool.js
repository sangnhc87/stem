const admin = require('firebase-admin');
const fs = require('fs');
const https = require('https');

// Initialize with application default credentials (works in Cloud Functions environment)
// For local, you need GOOGLE_APPLICATION_CREDENTIALS env var
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: 'gamelogic4u',
    storageBucket: 'gamelogic4u.appspot.com'
  });
}

const db = admin.firestore();
const quizId = 'aDAW49wUBxzTJsJBu8Hy';

async function downloadQuiz() {
  try {
    // Get quiz metadata from Firestore
    const quizDoc = await db.collection('quizzes').doc(quizId).get();
    
    if (!quizDoc.exists) {
      console.error('❌ Quiz not found!');
      return;
    }
    
    const quizData = quizDoc.data();
    console.log('📚 Quiz found:', quizData.title);
    console.log('📝 Questions:', quizData.questionCount);
    console.log('🔗 Download URL:', quizData.downloadURL);
    
    // Download JSON content from URL
    https.get(quizData.downloadURL, (response) => {
      let data = '';
      
      response.on('data', (chunk) => {
        data += chunk;
      });
      
      response.on('end', () => {
        const quizContent = JSON.parse(data);
        
        // Save as JSON
        const jsonFilename = `${quizData.title.replace(/[^a-zA-Z0-9]/g, '_')}.json`;
        fs.writeFileSync(`../${jsonFilename}`, JSON.stringify(quizContent, null, 2), 'utf8');
        console.log('✅ Saved JSON:', jsonFilename);
        
        // Convert to TXT format
        const txtContent = convertToTxt(quizContent);
        const txtFilename = `${quizData.title.replace(/[^a-zA-Z0-9]/g, '_')}.txt`;
        fs.writeFileSync(`../${txtFilename}`, txtContent, 'utf8');
        console.log('✅ Saved TXT:', txtFilename);
        
        console.log('\n✨ Download complete!');
        process.exit(0);
      });
    }).on('error', (err) => {
      console.error('❌ Error downloading:', err);
      process.exit(1);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

function convertToTxt(quiz) {
  let txt = `# TIÊU ĐỀ: ${quiz.title}\n`;
  if (quiz.description) {
    txt += `// Mô tả: ${quiz.description}\n`;
  }
  txt += '\n';
  
  quiz.clusters.forEach((cluster, cIdx) => {
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
        txt += `    Giải thích: ${solution}\n`;
      }
      txt += '\n';
    });
  });
  
  return txt;
}

downloadQuiz();
