let currentSection = 0;
let testAnswers = {};

$(document).ready(function () {
  const user = requireAuth('student');
  if (!user) return;

  if (getTestResult()) {
    window.location.href = '/student-dashboard';
    return;
  }

  loadSavedAnswers();
  renderAllSections();
  showSection(0);
  bindTestEvents();
});

function loadSavedAnswers() {
  try {
    const saved = JSON.parse(sessionStorage.getItem('careerPathTestDraft'));
    if (saved) testAnswers = saved;
  } catch {
    testAnswers = {};
  }
}

function saveDraft() {
  sessionStorage.setItem('careerPathTestDraft', JSON.stringify(testAnswers));
}

function renderAllSections() {
  const $container = $('#testSections');
  $container.empty();

  PSYCHOMETRIC_SECTIONS.forEach(function (section, sectionIndex) {
    const $section = $('<div>', {
      class: 'test-section',
      id: 'section-' + sectionIndex,
      'data-section': sectionIndex
    });

    $section.append('<h2 class="test-section-title">Section ' + section.id + ': ' + section.title + '</h2>');
    $section.append('<p class="test-section-desc">' + section.description + '</p>');

    section.questions.forEach(function (question) {
      $section.append(renderQuestion(question, section.type, sectionIndex));
    });

    $container.append($section);
  });
}

function renderQuestion(question, type, sectionIndex) {
  const $block = $('<div>', { class: 'question-block', 'data-qid': question.id });
  $block.append('<div class="question-number">Question ' + question.id + ' of 50</div>');
  $block.append('<div class="question-text">' + question.text + '</div>');

  if (type === 'mcq' || type === 'interest') {
    const $options = $('<div>', { class: 'options-group' });
    const labels = ['a', 'b', 'c', 'd'];

    question.options.forEach(function (option, optIndex) {
      const inputId = 'q' + question.id + '_' + optIndex;
      const saved = testAnswers[question.id];
      const checked = saved === optIndex ? ' checked' : '';

      $options.append(
        '<label class="option-label" for="' + inputId + '">' +
          '<input type="radio" name="q' + question.id + '" id="' + inputId + '" value="' + optIndex + '"' + checked + '>' +
          '<span>' + labels[optIndex] + ') ' + option + '</span>' +
        '</label>'
      );
    });

    $block.append($options);
  } else if (type === 'likert') {
    const $scale = $('<div>', { class: 'likert-scale' });
    const scaleLabels = ['1', '2', '3', '4', '5'];
    const scaleText = ['Strongly Disagree', '', 'Neutral', '', 'Strongly Agree'];

    for (let i = 1; i <= 5; i++) {
      const inputId = 'q' + question.id + '_' + i;
      const saved = testAnswers[question.id];
      const checked = saved === i ? ' checked' : '';
      const labelText = i === 1 ? '1 - SD' : i === 5 ? '5 - SA' : String(i);

      $scale.append(
        '<div class="likert-option">' +
          '<label for="' + inputId + '">' +
            '<input type="radio" name="q' + question.id + '" id="' + inputId + '" value="' + i + '"' + checked + '>' +
            '<span>' + labelText + '</span>' +
          '</label>' +
        '</div>'
      );
    }

    $block.append($scale);
  } else if (type === 'binary') {
    const saved = testAnswers[question.id];
    const yesClass = saved === 'yes' ? ' active-yes' : '';
    const noClass = saved === 'no' ? ' active-no' : '';

    $block.append(
      '<div class="binary-toggle" data-qid="' + question.id + '">' +
        '<button type="button" class="binary-btn binary-yes' + yesClass + '" data-value="yes">Yes</button>' +
        '<button type="button" class="binary-btn binary-no' + noClass + '" data-value="no">No</button>' +
      '</div>'
    );
  }

  return $block;
}

function bindTestEvents() {
  $('#testSections').on('change', 'input[type="radio"]', function () {
    const name = $(this).attr('name');
    const qid = parseInt(name.replace('q', ''), 10);
    const value = $(this).attr('type') === 'radio' && $(this).closest('.likert-scale').length
      ? parseInt($(this).val(), 10)
      : parseInt($(this).val(), 10);
    testAnswers[qid] = value;
    saveDraft();
  });

  $('#testSections').on('click', '.binary-btn', function () {
    const $toggle = $(this).closest('.binary-toggle');
    const qid = parseInt($toggle.data('qid'), 10);
    const value = $(this).data('value');

    $toggle.find('.binary-btn').removeClass('active-yes active-no');
    $(this).addClass(value === 'yes' ? 'active-yes' : 'active-no');
    testAnswers[qid] = value;
    saveDraft();
  });

  $('#prevSection').on('click', function () {
    if (currentSection > 0) showSection(currentSection - 1);
  });

  $('#nextSection').on('click', function () {
    if (!validateSection(currentSection)) {
      alert('Please answer all questions in this section before continuing.');
      return;
    }
    if (currentSection < PSYCHOMETRIC_SECTIONS.length - 1) {
      showSection(currentSection + 1);
    }
  });

  $('#submitTest').on('click', function () {
    if (!validateSection(currentSection)) {
      alert('Please answer all questions in this section before submitting.');
      return;
    }

    for (let i = 0; i < PSYCHOMETRIC_SECTIONS.length; i++) {
      if (!validateSection(i)) {
        alert('Please complete all sections before submitting. Section ' + (i + 1) + ' has unanswered questions.');
        showSection(i);
        return;
      }
    }

    const result = calculateTestResult(testAnswers);
    localStorage.setItem('careerPathTestResult', JSON.stringify(result));
    sessionStorage.removeItem('careerPathTestDraft');
    assignStudentToCounselor(result);

    const user = getStoredUser();
    if (user) {
      $('#testForm').find('input[name="studentEmail"], input[name="studentName"]').remove();
      $('#testForm').append('<input type="hidden" name="studentEmail" value="' + escapeAttribute(user.email || '') + '">');
      $('#testForm').append('<input type="hidden" name="studentName" value="' + escapeAttribute(user.name || '') + '">');
    }

    $('#answersPayload').val(JSON.stringify(testAnswers));
    $('#testForm').trigger('submit');
  });
}

function validateSection(sectionIndex) {
  const section = PSYCHOMETRIC_SECTIONS[sectionIndex];
  return section.questions.every(function (q) {
    return testAnswers[q.id] !== undefined && testAnswers[q.id] !== null && testAnswers[q.id] !== '';
  });
}

function showSection(index) {
  currentSection = index;

  $('.test-section').removeClass('active');
  $('#section-' + index).addClass('active');

  $('.section-dot').removeClass('active completed');
  $('.section-dot').each(function (i) {
    if (i < index) $(this).addClass('completed');
    if (i === index) $(this).addClass('active');
  });

  const progress = ((index + 1) / PSYCHOMETRIC_SECTIONS.length) * 100;
  $('#progressFill').css('width', progress + '%');
  $('#progressText').text('Section ' + (index + 1) + ' of 5');

  $('#prevSection').toggle(index > 0);
  $('#nextSection').toggle(index < PSYCHOMETRIC_SECTIONS.length - 1);
  $('#submitTest').toggleClass('hidden', index !== PSYCHOMETRIC_SECTIONS.length - 1);

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function calculateTestResult(answers) {
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
    answers: answers
  };
}

function assignStudentToCounselor(result) {
  const user = getStoredUser();
  if (!user) return;

  const assignments = JSON.parse(localStorage.getItem('careerPathAssignments') || '[]');
  const existing = assignments.findIndex(function (a) { return a.studentEmail === user.email; });

  const assignment = {
    studentName: user.name,
    studentEmail: user.email,
    educationLevel: user.educationLevel || 'N/A',
    assessmentDate: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
    recommendedPath: result.recommendedPath,
    topInterest: result.topInterest,
    status: 'pending',
    counselor: result.counselor
  };

  if (existing >= 0) {
    assignments[existing] = assignment;
  } else {
    assignments.push(assignment);
  }

  localStorage.setItem('careerPathAssignments', JSON.stringify(assignments));
}

function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem('careerPathUser'));
  } catch {
    return null;
  }
}

function escapeAttribute(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
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

function getTestResult() {
  try {
    return JSON.parse(localStorage.getItem('careerPathTestResult'));
  } catch {
    return null;
  }
}
