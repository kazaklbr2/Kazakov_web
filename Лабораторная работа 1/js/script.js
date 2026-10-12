const modal = document.querySelector('#auth-modal');
const registerForm = document.querySelector('#register-form');
const loginForm = document.querySelector('#login-form');
const consent = registerForm.elements.consent;
const registerButton = registerForm.querySelector('[type="submit"]');

// Переключаем формы внутри одного модального окна.
function switchForm(formName) {
  registerForm.hidden = formName !== 'register';
  loginForm.hidden = formName !== 'login';

  document.querySelectorAll('[data-switch-form]').forEach(function (button) {
    const active = button.dataset.switchForm === formName;
    button.classList.toggle('active', active);
    button.setAttribute('aria-pressed', active);
  });

  const currentForm = formName === 'register' ? registerForm : loginForm;
  currentForm.querySelector('input').focus();
}

document.querySelectorAll('[data-open-form]').forEach(function (button) {
  button.addEventListener('click', function () {
    modal.showModal();
    document.body.style.overflow = 'hidden';
    switchForm(button.dataset.openForm);
  });
});

document.querySelectorAll('[data-switch-form]').forEach(function (button) {
  button.addEventListener('click', function () {
    switchForm(button.dataset.switchForm);
  });
});

document.querySelector('.close-button').addEventListener('click', function () {
  modal.close();
});

// Клик по затемнению тоже закрывает окно.
modal.addEventListener('click', function (event) {
  if (event.target === modal) {
    modal.close();
  }
});

modal.addEventListener('close', function () {
  document.body.style.overflow = '';
});

// Без согласия отправка регистрации недоступна.
consent.addEventListener('change', function () {
  registerButton.disabled = !consent.checked;
});

// Сообщение связано с полем через атрибут aria-describedby.
function showError(input, message) {
  const error = document.getElementById(input.getAttribute('aria-describedby'));
  error.textContent = message;
  input.setAttribute('aria-invalid', message !== '');
}

function validateForm(form) {
  const inputs = form.querySelectorAll('input');
  let firstInvalidInput = null;

  inputs.forEach(function (input) {
    input.setCustomValidity('');

    // Общие проверки выполняет встроенный механизм HTML-форм.
    let message = '';
    if (input.validity.valueMissing) {
      message = input.type === 'checkbox' ? 'Необходимо согласие на обработку данных.' : 'Заполните это поле.';
    } else if (input.validity.typeMismatch) {
      message = 'Введите корректный email.';
    }

    // Дополнительные условия регистрации из лабораторной работы.
    if (form === registerForm && message === '') {
      if (input.name === 'name' && !/^[А-Яа-яЁё][А-Яа-яЁё \-]*$/.test(input.value.trim())) {
        message = 'Используйте русские буквы, пробелы и дефисы.';
      }

      // Разделители можно вводить или пропускать.
      if (input.name === 'phone') {
        const phone = input.value.replace(/[\s()\-]/g, '');
        if (!/^(\+7|7|8)9\d{9}$/.test(phone)) {
          message = 'Введите российский мобильный номер, например 79205235127.';
        }
      }

      if (input.name === 'password') {
        if (input.value.length < 6) {
          message = 'Пароль должен содержать минимум 6 символов.';
        } else if (/^\d+$/.test(input.value)) {
          message = 'Пароль не может состоять только из цифр.';
        }
      }

      if (input.name === 'passwordRepeat' && input.value !== form.elements.password.value) {
        message = 'Пароли должны совпадать.';
      }
    }

    input.setCustomValidity(message);
    showError(input, message);
    if (!input.checkValidity() && firstInvalidInput === null) {
      firstInvalidInput = input;
    }
  });

  if (firstInvalidInput !== null) {
    firstInvalidInput.focus();
    return false;
  }
  return true;
}

[registerForm, loginForm].forEach(function (form) {
  // После изменения поля убираем его старую ошибку.
  form.addEventListener('input', function (event) {
    if (event.target.matches('input')) {
      event.target.setCustomValidity('');
      showError(event.target, '');
      form.querySelector('.form-status').textContent = '';
    }
  });

  form.addEventListener('submit', function (event) {
    // В первой лабораторной сервер не нужен: данные идут в консоль.
    event.preventDefault();
    form.querySelector('.form-status').textContent = '';
    if (!validateForm(form)) {
      return;
    }

    const data = Object.fromEntries(new FormData(form));
    if (form === registerForm) {
      data.consent = consent.checked;
    }
    console.log(form === registerForm ? 'Данные регистрации:' : 'Данные входа:', data);
    form.querySelector('.form-status').textContent = 'Данные формы выведены в консоль.';
  });
});
