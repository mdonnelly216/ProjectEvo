const loginForm = document.getElementById('loginForm');
const errorMessage = document.getElementById('errorMessage');

loginForm.addEventListener('submit', event => {
  errorMessage.textContent = '';

  const username = loginForm.username.value.trim();
  const password = loginForm.password.value;

  if (!username || !password) {
    event.preventDefault();
    errorMessage.textContent = 'Please enter both username and password.';
    return;
  }

  if (password.length < 6) {
    event.preventDefault();
    errorMessage.textContent = 'Password must be at least 6 characters.';
    return;
  }
});
