$(document).ready(function () {
  const messages = {
    auth_failed: '❌ Google sign-in could not be completed. Please try again.',
    missing_code: '❌ Google did not return an authorization code. Please try again.',
    auth_required: '⚠️ Please sign in to access this page.',
    logout: '✅ You have been logged out successfully.'
  };
  
  const params = new URLSearchParams(window.location.search);
  const error = params.get('error');
  const logout = params.get('logout');

  if (error && messages[error]) {
    $('#authMessage').html(`<p style="color: #d32f2f; padding: 0.75rem; background: #ffebee; border-radius: 4px; font-size: 0.9rem;">${messages[error]}</p>`);
  }
  
  if (logout === 'success') {
    $('#authMessage').html(`<p style="color: #388e3c; padding: 0.75rem; background: #e8f5e9; border-radius: 4px; font-size: 0.9rem;">${messages.logout}</p>`);
  }

  $('#googleAuthBtn').on('click', function () {
    $(this).prop('disabled', true).text('Redirecting to Google...');
    window.location.href = '/auth/google';
  });
});
