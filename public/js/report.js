$(document).ready(function () {
  const user = requireAuth('student');
  if (!user) return;

  if (window.__SERVER_REPORT__) {
    localStorage.setItem('careerPathTestResult', JSON.stringify(window.__SERVER_REPORT__));
    renderReport(window.__SERVER_REPORT__, user);
    return;
  }

  const result = getTestResult();
  if (!result) {
    window.location.href = '/student-dashboard';
    return;
  }

  renderReport(result, user);
});

function renderReport(result, user) {
  $('#studentName').text(user.name);
  $('#reportDate').text(new Date(result.completedAt).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'long', year: 'numeric'
  }));

  $('#aptitudeScore').text(result.scores.aptitude + ' / 10');
  $('#personalityScore').text(result.scores.personality + ' / 50');
  $('#interestScore').text(result.scores.careerInterests + ' pts');
  $('#eiScore').text(result.scores.emotionalIntelligence + ' / 50');
  $('#skillsScore').text(result.scores.skills + ' / 10');

  $('#recommendedPath').text(result.recommendedPath);

  const interpretation = getInterpretation(result);
  $('#interpretationText').text(interpretation);

  const c = result.counselor;
  $('#counselorName').text(c.name);
  $('#counselorSpec').text(c.specialization);
  $('#counselorEmail').text(c.email).attr('href', 'mailto:' + c.email);
  $('#counselorPhone').text(c.phone);
}

function getInterpretation(result) {
  const s = result.scores;
  const parts = [];

  if (s.aptitude >= 8) parts.push('Strong aptitude in logical and analytical thinking.');
  else if (s.aptitude >= 5) parts.push('Average problem-solving ability with room for growth.');
  else parts.push('Foundational aptitude support recommended through structured training.');

  if (s.personality >= 41) parts.push('Personality profile suggests leadership and structured role suitability.');
  else if (s.personality >= 31) parts.push('Well-suited for collaborative team environments.');
  else parts.push('Benefits from guided career exposure and confidence-building sessions.');

  if (s.emotionalIntelligence >= 41) parts.push('High emotional intelligence supports people-facing careers.');
  else if (s.emotionalIntelligence >= 31) parts.push('Good emotional awareness with coaching potential.');
  else parts.push('Emotional resilience coaching would strengthen career readiness.');

  if (s.skills >= 7) parts.push('Strong practical skills foundation for immediate employability.');
  else if (s.skills >= 4) parts.push('Moderate skill set; targeted upskilling recommended.');
  else parts.push('Vocational skill development is a priority pathway.');

  return parts.join(' ');
}

function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem('careerPathUser'));
  } catch {
    return null;
  }
}

function getTestResult() {
  try {
    return JSON.parse(localStorage.getItem('careerPathTestResult'));
  } catch {
    return null;
  }
}

function requireAuth(role) {
  const user = getStoredUser();
  if (!user) {
    window.location.href = '/login';
    return null;
  }
  if (role && user.role !== role) {
    window.location.href = user.role === 'counselor' ? '/counselor-dashboard' : '/student-dashboard';
    return null;
  }
  return user;
}
