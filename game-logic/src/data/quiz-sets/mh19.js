const mh19_cluster = {
  id: 'MH19',
  title: 'Màn Chơi 2: Lịch Trực Nhật',
  type: 'GROUP',
  commonAssumption: {
    intro: 'Năm sinh viên An, Bình, Cường, Dũng, Giang được phân công trực nhật trong tuần từ thứ Hai đến thứ Sáu.',
    rules: [
      'An trực ngay trước Cường.',
      'Bình trực sau Dũng hai ngày.',
      'Giang không trực vào thứ Ba.',
    ],
  },
  questions: [
    {
      questionText: `Thứ tự nào sau đây là có thể?`,
      choices: [
        { text: "Dũng, An, Cường, Bình, Giang", value: "A" },
        { text: "An, Cường, Dũng, Giang, Bình", value: "B" },
        { text: "Dũng, Giang, Bình, An, Cường", value: "C" },
        { text: "Giang, Dũng, An, Cường, Bình", value: "D" }
      ],
      correctAnswer: "C",
      points_correct: 15,
      points_incorrect: -5,
    }
  ]
};

export default mh19_cluster;