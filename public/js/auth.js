$(document).ready(function () {
  const messages = {
    auth_failed: 'Google sign-in could not be completed. Please try again.',
    missing_code: 'Google did not return an authorization code. Please try again.'
  };
  const params = new URLSearchParams(window.location.search);
  const error = params.get('error');

  if (error && messages[error]) {
    $('#authMessage').text(messages[error]);
  }

  $('#googleAuthBtn').on('click', function () {
    window.location.href = '/auth/google';
  });
});
