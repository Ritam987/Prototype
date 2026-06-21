const PSYCHOMETRIC_SECTIONS = require('./questionsData').PSYCHOMETRIC_SECTIONS;
const COUNSELOR_POOL = require('./questionsData').COUNSELOR_POOL;
const CAREER_PATHS = require('./questionsData').CAREER_PATHS;

function normalizeAnswers(rawAnswers) {
  const answers = {};

  if (!rawAnswers) return answers;

  if (typeof rawAnswers === 'string') {
    try {
      return normalizeAnswers(JSON.parse(rawAnswers));
    } catch {
      return answers;
    }
  }

  Object.keys(rawAnswers).forEach(function (key) {
    const qid = parseInt(key.replace(/^q?/, ''), 10);
    let value = rawAnswers[key];

    if (value === 'yes' || value === 'no') {
      answers[qid] = value;
      return;
    }

    const numeric = parseInt(value, 10);
    answers[qid] = Number.isNaN(numeric) ? value : numeric;
  });

  return answers;
}

function calculateTestResult(rawAnswers) {
  const answers = normalizeAnswers(rawAnswers);

  let aptitudeScore = 0;
  PSYCHOMETRIC_SECTIONS[0].questions.forEach(function (q) {
    if (answers[q.id] === q.correct) aptitudeScore++;
  });

  let personalityScore = 0;
  PSYCHOMETRIC_SECTIONS[1].questions.forEach(function (q) {
    personalityScore += answers[q.id] || 0;
  });

  const interestTags = {};
  let interestScore = 0;
  PSYCHOMETRIC_SECTIONS[2].questions.forEach(function (q) {
    const selected = answers[q.id];
    if (selected !== undefined && q.tags) {
      const tag = q.tags[selected];
      const weight = selected === 0 ? 2 : selected === 1 ? 1 : 0;
      interestTags[tag] = (interestTags[tag] || 0) + weight;
      interestScore += weight;
    }
  });

  let eiScore = 0;
  PSYCHOMETRIC_SECTIONS[3].questions.forEach(function (q) {
    eiScore += answers[q.id] || 0;
  });

  let skillsScore = 0;
  PSYCHOMETRIC_SECTIONS[4].questions.forEach(function (q) {
    if (answers[q.id] === 'yes') skillsScore++;
  });

  let topInterest = 'general';
  let maxInterest = 0;
  Object.keys(interestTags).forEach(function (tag) {
    if (interestTags[tag] > maxInterest) {
      maxInterest = interestTags[tag];
      topInterest = tag;
    }
  });

  if (aptitudeScore >= 8 && (interestTags.technical || 0) >= 2) topInterest = 'technical';
  else if (personalityScore >= 41 && (interestTags.sales || 0) >= 2) topInterest = 'sales';
  else if (skillsScore >= 7 && (interestTags.finance || 0) >= 2) topInterest = 'finance';
  else if (eiScore >= 41 && (interestTags.teaching || 0) >= 2) topInterest = 'teaching';
  else if ((interestTags.creative || 0) >= 3) topInterest = 'creative';

  const recommendedPath = CAREER_PATHS[topInterest] || CAREER_PATHS.general;
  const counselor = COUNSELOR_POOL[topInterest] || COUNSELOR_POOL.general;

  return {
    completedAt: new Date().toISOString(),
    scores: {
      aptitude: aptitudeScore,
      personality: personalityScore,
      emotionalIntelligence: eiScore,
      skills: skillsScore,
      careerInterests: interestScore
    },
    topInterest: topInterest,
    recommendedPath: recommendedPath,
    counselor: counselor,
    interpretation: getInterpretation({
      aptitude: aptitudeScore,
      personality: personalityScore,
      emotionalIntelligence: eiScore,
      skills: skillsScore
    }),
    answers: answers
  };
}

function getInterpretation(scores) {
  const parts = [];

  if (scores.aptitude >= 8) parts.push('Strong aptitude in logical and analytical thinking.');
  else if (scores.aptitude >= 5) parts.push('Average problem-solving ability with room for growth.');
  else parts.push('Foundational aptitude support recommended through structured training.');

  if (scores.personality >= 41) parts.push('Personality profile suggests leadership and structured role suitability.');
  else if (scores.personality >= 31) parts.push('Well-suited for collaborative team environments.');
  else parts.push('Benefits from guided career exposure and confidence-building sessions.');

  if (scores.emotionalIntelligence >= 41) parts.push('High emotional intelligence supports people-facing careers.');
  else if (scores.emotionalIntelligence >= 31) parts.push('Good emotional awareness with coaching potential.');
  else parts.push('Emotional resilience coaching would strengthen career readiness.');

  if (scores.skills >= 7) parts.push('Strong practical skills foundation for immediate employability.');
  else if (scores.skills >= 4) parts.push('Moderate skill set; targeted upskilling recommended.');
  else parts.push('Vocational skill development is a priority pathway.');

  return parts.join(' ');
}

module.exports = {
  calculateTestResult,
  getInterpretation,
  normalizeAnswers
};
