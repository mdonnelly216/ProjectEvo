const registerForm = document.getElementById('registerForm');
const errorMessage = document.getElementById('errorMessage');

registerForm.addEventListener('submit', event => {
  errorMessage.textContent = '';

  const username = registerForm.username.value.trim();
  const password = registerForm.password.value;
  const confirmPassword = registerForm.confirm_password.value;

  if (!username || !password || !confirmPassword) {
    event.preventDefault();
    errorMessage.textContent = 'Please fill in all fields.';
    return;
  }

  if (password.length < 6) {
    event.preventDefault();
    errorMessage.textContent = 'Password must be at least 6 characters.';
    return;
  }

  if (password !== confirmPassword) {
    event.preventDefault();
    errorMessage.textContent = 'Passwords do not match.';
    return;
  }
});
