$(document).ready(function () {
  const user = requireAuth('student');
  if (!user) return;

  renderProfile(user);

  const result = getTestResult();
  if (result) {
    $('#pendingBlock').addClass('hidden');
    $('#completedBlock').removeClass('hidden');
    renderCounselorCard(result.counselor);
  } else {
    $('#pendingBlock').removeClass('hidden');
    $('#completedBlock').addClass('hidden');
  }
});

function renderProfile(user) {
  $('#profileName').text(user.name);
  $('#profileEmail').text(user.email);
  $('#profileLevel').text(formatEducationLevel(user.educationLevel));
  $('#profileStatus').text(getTestResult() ? 'Assessment Completed' : 'Test Pending');
  $('#profileInitials').text(getInitials(user.name));
}

function renderCounselorCard(counselor) {
  $('#assignedCounselorName').text(counselor.name);
  $('#assignedCounselorSpec').text(counselor.specialization);
  $('#assignedCounselorEmail').text(counselor.email);
  $('#assignedCounselorPhone').text(counselor.phone);
}

function formatEducationLevel(level) {
  const map = { '10th': '10th Standard', '12th': '12th Standard', graduation: 'Graduation' };
  return map[level] || level || 'Not specified';
}

function getInitials(name) {
  if (!name) return '?';
  return name.split(' ').map(function (p) { return p[0]; }).join('').substring(0, 2).toUpperCase();
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
