module.exports.PSYCHOMETRIC_SECTIONS = [
  {
    id: 1,
    title: 'Aptitude (Logical & Analytical Thinking)',
    description: 'Select the best answer for each question. Each question has one correct option.',
    type: 'mcq',
    questions: [
      {
        id: 1,
        text: 'If a train travels 120 km in 2 hours, what is its speed?',
        options: ['40 km/hr', '50 km/hr', '60 km/hr', '70 km/hr'],
        correct: 2
      },
      {
        id: 2,
        text: 'If 5x + 3 = 18, what is the value of x?',
        options: ['3', '4', '5', '6'],
        correct: 0
      },
      {
        id: 3,
        text: 'If Monday was the 1st of the month, what day will it be on the 10th?',
        options: ['Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        correct: 1
      },
      {
        id: 4,
        text: 'Find the missing number in the series: 3, 6, 12, 24, __?',
        options: ['36', '48', '50', '60'],
        correct: 1
      },
      {
        id: 5,
        text: "Rahul's age is twice that of his brother. If the total age of both is 30, how old is Rahul?",
        options: ['10', '15', '20', '25'],
        correct: 2
      },
      {
        id: 6,
        text: 'If all roses are flowers and some flowers fade quickly, can we say that all roses fade quickly?',
        options: ['Yes', 'No', 'Cannot be determined', 'Some do, some do not'],
        correct: 2
      },
      {
        id: 7,
        text: 'Which word does not belong to the group?',
        options: ['Apple', 'Mango', 'Tomato', 'Banana'],
        correct: 2
      },
      {
        id: 8,
        text: 'If B is the mother of D and A is the father of D, what is A to B?',
        options: ['Husband', 'Son', 'Brother', 'Father'],
        correct: 0
      },
      {
        id: 9,
        text: 'A clock shows 3:15. The angle between the hour and minute hand is:',
        options: ['7.5 degrees', '15 degrees', '30 degrees', '45 degrees'],
        correct: 0
      },
      {
        id: 10,
        text: 'If 1 = 3, 2 = 5, 3 = 7, then 4 = ?',
        options: ['9', '11', '13', '15'],
        correct: 0
      }
    ]
  },
  {
    id: 2,
    title: 'Personality Traits & Work Style',
    description: 'Rate each statement on a scale from 1 (Strongly Disagree) to 5 (Strongly Agree).',
    type: 'likert',
    questions: [
      { id: 11, text: 'I enjoy working in a team and collaborating with others.' },
      { id: 12, text: 'I prefer structured tasks with clear guidelines.' },
      { id: 13, text: 'I feel comfortable taking risks in new situations.' },
      { id: 14, text: 'I like solving problems and figuring out new things.' },
      { id: 15, text: 'I work well under pressure and deadlines.' },
      { id: 16, text: 'I prefer working with numbers rather than people.' },
      { id: 17, text: 'I find it easy to express my thoughts in front of a group.' },
      { id: 18, text: 'I am good at following instructions carefully.' },
      { id: 19, text: 'I enjoy leading and making decisions for a group.' },
      { id: 20, text: 'I like tasks that require attention to detail.' }
    ]
  },
  {
    id: 3,
    title: 'Career Interests',
    description: 'Choose the option that best reflects your preference for each question.',
    type: 'interest',
    questions: [
      {
        id: 21,
        text: 'What type of work interests you the most?',
        options: [
          'Helping others (social work, teaching)',
          'Making or fixing things (mechanic, technician)',
          'Selling products/services (sales, marketing)',
          'Analyzing data and numbers (finance, accounting)'
        ],
        tags: ['teaching', 'technical', 'sales', 'finance']
      },
      {
        id: 22,
        text: 'Do you enjoy working with computers and technology?',
        options: ['Yes, very much', 'Somewhat', 'Rarely', 'Not at all'],
        tags: ['technical', 'technical', 'general', 'general']
      },
      {
        id: 23,
        text: 'Would you rather work indoors or outdoors?',
        options: ['Indoors', 'Outdoors', 'Both equally', 'Not sure'],
        tags: ['office', 'field', 'general', 'general']
      },
      {
        id: 24,
        text: 'Do you enjoy working independently or in a team?',
        options: ['Independently', 'In a team', 'Both', 'Not sure'],
        tags: ['entrepreneur', 'team', 'general', 'general']
      },
      {
        id: 25,
        text: 'Which subject do you enjoy the most?',
        options: ['Science', 'Math', 'Arts', 'Business'],
        tags: ['technical', 'finance', 'creative', 'sales']
      },
      {
        id: 26,
        text: 'How comfortable are you with talking to new people?',
        options: ['Very comfortable', 'Somewhat comfortable', 'Not comfortable', 'I avoid it'],
        tags: ['sales', 'general', 'support', 'support']
      },
      {
        id: 27,
        text: 'Would you prefer a job with a fixed salary or one based on performance (commission)?',
        options: ['Fixed salary', 'Performance-based', 'No preference', 'Not sure'],
        tags: ['office', 'sales', 'general', 'general']
      },
      {
        id: 28,
        text: 'What type of work environment do you prefer?',
        options: ['Office', 'Factory/workshop', 'Outdoors', 'Flexible'],
        tags: ['office', 'technical', 'field', 'creative']
      },
      {
        id: 29,
        text: 'Do you enjoy solving problems that involve numbers?',
        options: ['Yes', 'No', 'Sometimes', 'Not sure'],
        tags: ['finance', 'creative', 'general', 'general']
      },
      {
        id: 30,
        text: 'Do you prefer physical work or mental work?',
        options: ['Physical', 'Mental', 'Both equally', 'Not sure'],
        tags: ['technical', 'office', 'general', 'general']
      }
    ]
  },
  {
    id: 4,
    title: 'Emotional Intelligence',
    description: 'Rate each statement on a scale from 1 (Strongly Disagree) to 5 (Strongly Agree).',
    type: 'likert',
    questions: [
      { id: 31, text: 'I can stay calm even in difficult situations.' },
      { id: 32, text: 'I understand my strengths and weaknesses.' },
      { id: 33, text: 'I can easily recognize the emotions of others.' },
      { id: 34, text: 'I work well in a stressful environment.' },
      { id: 35, text: 'I manage conflicts without losing my temper.' },
      { id: 36, text: "I listen carefully to other people's opinions." },
      { id: 37, text: 'I am good at motivating myself to achieve goals.' },
      { id: 38, text: 'I adapt quickly to changes.' },
      { id: 39, text: 'I can control my emotions in challenging situations.' },
      { id: 40, text: 'I believe in continuous learning and improvement.' }
    ]
  },
  {
    id: 5,
    title: 'Skills & Abilities',
    description: 'Answer Yes or No for each skill-based question.',
    type: 'binary',
    questions: [
      { id: 41, text: 'How comfortable are you using computers and smartphones?' },
      { id: 42, text: 'Can you communicate well in English?' },
      { id: 43, text: 'Are you good at handling money and managing expenses?' },
      { id: 44, text: 'Do you enjoy doing creative tasks (design, painting, writing)?' },
      { id: 45, text: 'Can you repair or assemble basic electrical/electronic items?' },
      { id: 46, text: 'Are you comfortable with public speaking?' },
      { id: 47, text: 'Can you manage your time effectively?' },
      { id: 48, text: 'Do you enjoy teaching others?' },
      { id: 49, text: 'Are you good at organizing and planning tasks?' },
      { id: 50, text: 'Can you type on a computer without looking at the keyboard?' }
    ]
  }
];

module.exports.COUNSELOR_POOL = {
  technical: {
    name: 'Dr. Ananya Sharma',
    specialization: 'IT/Engineering',
    email: 'ananya.sharma@careerpath.org',
    phone: '+91 98765 43210'
  },
  sales: {
    name: 'Mr. Vikram Patel',
    specialization: 'Sales/Marketing',
    email: 'vikram.patel@careerpath.org',
    phone: '+91 98765 43211'
  },
  finance: {
    name: 'Ms. Priya Reddy',
    specialization: 'Finance/Accounting',
    email: 'priya.reddy@careerpath.org',
    phone: '+91 98765 43212'
  },
  teaching: {
    name: 'Mrs. Sunita Das',
    specialization: 'Teaching/Social Work',
    email: 'sunita.das@careerpath.org',
    phone: '+91 98765 43213'
  },
  creative: {
    name: 'Mr. Arjun Mehta',
    specialization: 'Creative Arts / Media',
    email: 'arjun.mehta@careerpath.org',
    phone: '+91 98765 43214'
  },
  general: {
    name: 'Mr. Rajesh Kumar',
    specialization: 'General Career Counseling',
    email: 'rajesh.kumar@careerpath.org',
    phone: '+91 98765 43215'
  }
};

module.exports.CAREER_PATHS = {
  technical: 'IT/Engineering',
  sales: 'Sales/Marketing',
  finance: 'Finance/Accounting',
  teaching: 'Teaching/Social Work',
  creative: 'Creative Arts & Media',
  general: 'Customer Service & Vocational Roles'
};
