$(document).ready(function () {
  const user = requireAuth('counselor');
  if (!user) return;

  renderCounselorProfile(user);
  renderAssignmentsTable(user);
  bindMarkComplete();
});

function renderCounselorProfile(user) {
  $('#counselorName').text(user.name);
  $('#counselorEmail').text(user.email);
  $('#counselorSpec').text(formatSpecialization(user.specialization));
  $('#counselorExperience').text(formatExperience(user.experience));
  $('#counselorInitials').text(getInitials(user.name));
}

function formatSpecialization(spec) {
  const map = {
    technical: 'IT / Engineering',
    sales: 'Sales / Marketing',
    finance: 'Finance / Accounting',
    teaching: 'Teaching / Social Work',
    'IT/Engineering': 'IT / Engineering',
    'Sales/Marketing': 'Sales / Marketing',
    'Finance/Accounting': 'Finance / Accounting',
    'Teaching/Social Work': 'Teaching / Social Work'
  };
  return map[spec] || spec || 'General Counseling';
}

function formatExperience(exp) {
  const map = {
    '1-3': '1 - 3 years',
    '3-5': '3 - 5 years',
    '5-10': '5 - 10 years',
    '10+': '10+ years'
  };
  return map[exp] || exp || 'Not specified';
}

function renderAssignmentsTable(user) {
  const assignments = JSON.parse(localStorage.getItem('careerPathAssignments') || '[]');
  const counselorSpec = normalizeSpecializationCode(user.specialization);
  const counselorPoolEntry = COUNSELOR_POOL[counselorSpec] || COUNSELOR_POOL.general;

  const filtered = assignments.filter(function (a) {
    return a.counselor && a.counselor.email === counselorPoolEntry.email;
  });

  const demoStudents = getDemoStudents(user);
  const allStudents = filtered.length ? filtered : demoStudents;

  const $tbody = $('#assignmentsBody');
  $tbody.empty();

  if (!allStudents.length) {
    $tbody.append(
      '<tr><td colspan="5" style="text-align:center;color:var(--text-muted);">No assigned students yet.</td></tr>'
    );
    return;
  }

  allStudents.forEach(function (student) {
    const isCompleted = student.status === 'completed';
    const statusClass = isCompleted ? 'status-completed' : 'status-pending';
    const statusText = isCompleted ? 'Completed' : 'Pending';
    const actionCell = isCompleted
      ? ''
      : '<button type="button" class="mark-complete-btn" data-email="' + student.studentEmail + '">Mark as Completed</button>';

    $tbody.append(
      '<tr data-email="' + student.studentEmail + '">' +
        '<td>' + student.studentName + '</td>' +
        '<td>' + student.assessmentDate + '</td>' +
        '<td>' + student.recommendedPath + '</td>' +
        '<td><a href="/report" style="color:var(--secondary-green);font-weight:600;">View Report</a></td>' +
        '<td><span class="status-tag ' + statusClass + ' status-badge">' + statusText + '</span> ' + actionCell + '</td>' +
      '</tr>'
    );
  });
}

function getDemoStudents(user) {
  const specMap = {
    technical: 'IT/Engineering',
    sales: 'Sales/Marketing',
    finance: 'Finance/Accounting',
    teaching: 'Teaching/Social Work'
  };
  const specCode = normalizeSpecializationCode(user.specialization);

  return [
    {
      studentName: 'Rahul Verma',
      studentEmail: 'rahul.demo@email.com',
      assessmentDate: '15 Jun 2026',
      recommendedPath: specMap[specCode] || 'Customer Service & Vocational Roles',
      status: 'pending',
      counselor: COUNSELOR_POOL[specCode] || COUNSELOR_POOL.general
    },
    {
      studentName: 'Priya Singh',
      studentEmail: 'priya.demo@email.com',
      assessmentDate: '18 Jun 2026',
      recommendedPath: specMap[specCode] || 'IT/Engineering',
      status: 'pending',
      counselor: COUNSELOR_POOL[specCode] || COUNSELOR_POOL.general
    }
  ];
}

function normalizeSpecializationCode(spec) {
  const map = {
    'IT/Engineering': 'technical',
    'Sales/Marketing': 'sales',
    'Finance/Accounting': 'finance',
    'Teaching/Social Work': 'teaching'
  };
  return map[spec] || spec;
}

function bindMarkComplete() {
  $('#assignmentsBody').on('click', '.mark-complete-btn', function () {
    const email = $(this).data('email');
    const $row = $(this).closest('tr');

    const assignments = JSON.parse(localStorage.getItem('careerPathAssignments') || '[]');
    const assignment = assignments.find(function (a) { return a.studentEmail === email; });

    if (assignment) {
      assignment.status = 'completed';
      localStorage.setItem('careerPathAssignments', JSON.stringify(assignments));
    }

    $row.find('.status-badge')
      .removeClass('status-pending')
      .addClass('status-completed')
      .text('Completed');

    $(this).remove();
  });
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
