$(document).ready(function () {
  let isLoginMode = false;
  let selectedRole = 'student';

  renderRoleFields(selectedRole);

  $('#roleSelect').on('change', function () {
    selectedRole = $(this).val();
    if (isLoginMode) {
      renderLoginFields(selectedRole);
    } else {
      renderRoleFields(selectedRole);
    }
  });

  $('#toggleAuthMode').on('click', function (e) {
    e.preventDefault();
    isLoginMode = !isLoginMode;
    updateAuthMode(isLoginMode, selectedRole);
  });

  $('#authForm').on('submit', function (e) {
    if (isLoginMode) {
      e.preventDefault();
      handleAuthSubmit(isLoginMode, selectedRole);
      return;
    }

    persistUserFromForm(selectedRole);
    $(this).attr('action', '/auth/register').attr('method', 'POST');
  });

  $('#googleAuthBtn').on('click', function () {
    handleGoogleAuth(selectedRole);
  });
});

function renderRoleFields(role) {
  const $container = $('#dynamicFields');
  $container.empty();

  if (role === 'student') {
    $container.append(
      '<div class="form-group">' +
        '<label for="userName">Full Name</label>' +
        '<input type="text" id="userName" name="name" required placeholder="Enter your full name">' +
      '</div>' +
      '<div class="form-group">' +
        '<label for="userEmail">Email Address</label>' +
        '<input type="email" id="userEmail" name="email" required placeholder="you@example.com">' +
      '</div>' +
      '<div class="form-group">' +
        '<label for="userPassword">Password</label>' +
        '<input type="password" id="userPassword" name="password" required placeholder="Create a secure password">' +
      '</div>' +
      '<div class="form-group">' +
        '<label for="educationLevel">Current Educational Level</label>' +
        '<select id="educationLevel" name="educationLevel" required>' +
          '<option value="">Select your level</option>' +
          '<option value="10th">10th Standard</option>' +
          '<option value="12th">12th Standard</option>' +
          '<option value="graduation">Graduation</option>' +
        '</select>' +
      '</div>'
    );
  } else {
    $container.append(
      '<div class="form-group">' +
        '<label for="userName">Full Name</label>' +
        '<input type="text" id="userName" name="name" required placeholder="Enter your full name">' +
      '</div>' +
      '<div class="form-group">' +
        '<label for="userEmail">Email Address</label>' +
        '<input type="email" id="userEmail" name="email" required placeholder="you@example.com">' +
      '</div>' +
      '<div class="form-group">' +
        '<label for="userPassword">Password</label>' +
        '<input type="password" id="userPassword" name="password" required placeholder="Create a secure password">' +
      '</div>' +
      '<div class="form-group">' +
        '<label for="specialization">Area of Specialization</label>' +
        '<select id="specialization" name="specialization" required>' +
          '<option value="">Select specialization</option>' +
          '<option value="technical">IT / Engineering</option>' +
          '<option value="sales">Sales / Marketing</option>' +
          '<option value="finance">Finance / Accounting</option>' +
          '<option value="teaching">Teaching / Social Work</option>' +
        '</select>' +
      '</div>' +
      '<div class="form-group">' +
        '<label for="phone">Phone Number</label>' +
        '<input type="tel" id="phone" name="phone" required placeholder="+91 00000 00000">' +
      '</div>' +
      '<div class="form-group">' +
        '<label for="experience">Years of Experience</label>' +
        '<select id="experience" name="experience" required>' +
          '<option value="">Select experience</option>' +
          '<option value="1-3">1 - 3 years</option>' +
          '<option value="3-5">3 - 5 years</option>' +
          '<option value="5-10">5 - 10 years</option>' +
          '<option value="10+">10+ years</option>' +
        '</select>' +
      '</div>'
    );
  }
}

function updateAuthMode(isLogin, role) {
  const $title = $('#authTitle');
  const $subtitle = $('#authSubtitle');
  const $submitBtn = $('#authSubmitBtn');
  const $toggleText = $('#toggleAuthMode');
  const $roleGroup = $('#roleSelectGroup');
  const $dynamicFields = $('#dynamicFields');

  if (isLogin) {
    $title.text('Welcome Back');
    $subtitle.text('Sign in to continue your career journey.');
    $submitBtn.text('Sign In');
    $toggleText.text('Need an account? Switch to Sign Up');
    $roleGroup.show();
    $('#authForm').attr('action', '#').attr('method', 'POST');
    renderLoginFields(role);
  } else {
    $title.text('Create Your Account');
    $subtitle.text('Join our platform and unlock personalized career guidance.');
    $submitBtn.text('Create Account');
    $toggleText.text('Already have an account? Switch to Login');
    $roleGroup.show();
    $('#authForm').attr('action', '/auth/register').attr('method', 'POST');
    renderRoleFields(role);
  }
}

function renderLoginFields(role) {
  const $container = $('#dynamicFields');
  $container.empty();
  $container.append(
    '<div class="form-group">' +
      '<label for="userEmail">Email Address</label>' +
      '<input type="email" id="userEmail" name="email" required placeholder="you@example.com">' +
    '</div>' +
    '<div class="form-group">' +
      '<label for="userPassword">Password</label>' +
      '<input type="password" id="userPassword" name="password" required placeholder="Enter your password">' +
    '</div>'
  );
}

function handleAuthSubmit(isLogin, role) {
  if (isLogin) {
    const existing = getStoredUserByEmail($('#userEmail').val());
    if (existing) {
      localStorage.setItem('careerPathUser', JSON.stringify(existing));
      redirectByRole(existing.role);
    } else {
      alert('No account found. Please sign up first.');
    }
    return;
  }

  const name = $('#userName').val().trim();
  const email = $('#userEmail').val().trim();
  const password = $('#userPassword').val();

  const user = {
    name: name,
    email: email,
    password: password,
    role: role
  };

  if (role === 'student') {
    user.educationLevel = $('#educationLevel').val();
  } else {
    user.specialization = $('#specialization').val();
    user.experience = $('#experience').val();
    user.phone = $('#phone').val();
  }

  saveUser(user);
  localStorage.setItem('careerPathUser', JSON.stringify(user));
  redirectByRole(role);
}

function handleGoogleAuth(role) {
  const user = {
    name: role === 'student' ? 'Demo Student' : 'Demo Counselor',
    email: role === 'student' ? 'student@gmail.com' : 'counselor@gmail.com',
    role: role,
    educationLevel: role === 'student' ? '12th' : undefined,
    specialization: role === 'counselor' ? 'technical' : undefined,
    experience: role === 'counselor' ? '5-10' : undefined,
    phone: role === 'counselor' ? '+91 00000 00000' : undefined,
    googleAuth: true
  };

  saveUser(user);
  localStorage.setItem('careerPathUser', JSON.stringify(user));
  redirectByRole(role);
}

function saveUser(user) {
  const users = JSON.parse(localStorage.getItem('careerPathUsers') || '[]');
  const index = users.findIndex(function (u) { return u.email === user.email; });
  if (index >= 0) {
    users[index] = user;
  } else {
    users.push(user);
  }
  localStorage.setItem('careerPathUsers', JSON.stringify(users));
}

function getStoredUserByEmail(email) {
  const users = JSON.parse(localStorage.getItem('careerPathUsers') || '[]');
  return users.find(function (u) { return u.email === email; }) || null;
}

function redirectByRole(role) {
  if (role === 'counselor') {
    window.location.href = '/counselor-dashboard';
  } else {
    window.location.href = '/student-dashboard';
  }
}

function persistUserFromForm(role) {
  const name = $('#userName').val().trim();
  const email = $('#userEmail').val().trim();
  const password = $('#userPassword').val();

  const user = {
    name: name,
    email: email,
    password: password,
    role: role
  };

  if (role === 'student') {
    user.educationLevel = $('#educationLevel').val();
  } else {
    user.specialization = $('#specialization').val();
    user.experience = $('#experience').val();
    user.phone = $('#phone').val();
  }

  saveUser(user);
  localStorage.setItem('careerPathUser', JSON.stringify(user));
}

function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem('careerPathUser'));
  } catch {
    return null;
  }
}
