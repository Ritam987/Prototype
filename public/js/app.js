$(document).ready(function () {
  initNavigation();
  initPreloader();
  initAccordion();
  initContactForm();
  updateDashboardLink();
});

function initNavigation() {
  const $hamburger = $('#hamburger');
  const $navLinks = $('#navLinks');

  $hamburger.on('click', function () {
    $(this).toggleClass('active');
    $navLinks.toggleClass('open');
  });

  $navLinks.find('a').on('click', function () {
    $hamburger.removeClass('active');
    $navLinks.removeClass('open');
  });

  const currentPath = window.location.pathname;
  $navLinks.find('a').each(function () {
    const href = $(this).attr('href');
    if (href === currentPath || (href === '/' && currentPath === '/')) {
      $(this).addClass('active');
    }
  });
}

function initPreloader() {
  const $preloader = $('#preloader');
  if (!$preloader.length) return;

  const isFirstLoad = !sessionStorage.getItem('preloaderComplete');

  if (!isFirstLoad) {
    $preloader.remove();
    return;
  }

  setTimeout(function () {
    $preloader.addClass('fade-out');
    sessionStorage.setItem('preloaderComplete', 'true');

    setTimeout(function () {
      const currentPath = window.location.pathname;
      if (currentPath !== '/login') {
        window.location.href = '/login';
      } else {
        $preloader.remove();
      }
    }, 600);
  }, 2500);
}

function initAccordion() {
  $('.accordion-header').on('click', function () {
    const $item = $(this).closest('.accordion-item');
    const isOpen = $item.hasClass('open');

    $('.accordion-item').removeClass('open');
    if (!isOpen) {
      $item.addClass('open');
    }
  });
}

function initContactForm() {
  $('#contactForm').on('submit', function (e) {
    e.preventDefault();
    alert('Thank you for your message. Our team will respond within 2 business days.');
    this.reset();
  });
}

function updateDashboardLink() {
  const $link = $('#dashboardLink');
  if (!$link.length) return;

  const user = getStoredUser();
  if (user && user.role === 'counselor') {
    $link.attr('href', '/counselor-dashboard').text('My Dashboard');
  } else if (user && user.role === 'student') {
    $link.attr('href', '/student-dashboard').text('My Dashboard');
  } else {
    $link.attr('href', '/login').text('My Dashboard');
  }
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

function getTestResult() {
  try {
    return JSON.parse(localStorage.getItem('careerPathTestResult'));
  } catch {
    return null;
  }
}

function getInitials(name) {
  if (!name) return '?';
  return name
    .split(' ')
    .map(function (part) { return part[0]; })
    .join('')
    .substring(0, 2)
    .toUpperCase();
}
