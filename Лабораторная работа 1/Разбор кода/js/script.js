// Получаем элементы один раз: дальше обработчики используют эти ссылки.
// Символ # в селекторе означает поиск элемента по id.
const modal = document.querySelector('#auth-modal');
const registerForm = document.querySelector('#register-form');
const loginForm = document.querySelector('#login-form');
const consent = registerForm.elements.consent;
const registerButton = registerForm.querySelector('[type="submit"]');

// Переключаем формы внутри одного модального окна.
function switchForm(formName) {
  // hidden управляет видимостью, не удаляя форму из HTML.
  registerForm.hidden = formName !== 'register';
  loginForm.hidden = formName !== 'login';

  // Квадратные скобки выбирают элементы по атрибуту data-switch-form.
  document.querySelectorAll('[data-switch-form]').forEach(function (button) {
    const active = button.dataset.switchForm === formName;
    button.classList.toggle('active', active);
    // aria-pressed сообщает вспомогательным технологиям, какая вкладка выбрана.
    button.setAttribute('aria-pressed', active);
  });

  const currentForm = formName === 'register' ? registerForm : loginForm;
  // Фокус сразу попадает в первое поле показанной формы.
  currentForm.querySelector('input').focus();
}

// Каждая кнопка в шапке получает обработчик открытия диалога.
document.querySelectorAll('[data-open-form]').forEach(function (button) {
  button.addEventListener('click', function () {
    modal.showModal();
    // Не прокручиваем страницу позади модального окна.
    document.body.style.overflow = 'hidden';
    switchForm(button.dataset.openForm);
  });
});

// Кнопки внутри окна переключают формы без его закрытия.
document.querySelectorAll('[data-switch-form]').forEach(function (button) {
  button.addEventListener('click', function () {
    switchForm(button.dataset.switchForm);
  });
});

// Крестик вызывает стандартный метод закрытия dialog.
document.querySelector('.close-button').addEventListener('click', function () {
  modal.close();
});

// Клик по затемнению тоже закрывает окно.
modal.addEventListener('click', function (event) {
  // Проверяем именно цель события: клик внутри окна не должен закрывать его.
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
  // В aria-describedby хранится id элемента с текстом ошибки.
  const error = document.getElementById(input.getAttribute('aria-describedby'));
  error.textContent = message;
  input.setAttribute('aria-invalid', message !== '');
}

function validateForm(form) {
  // querySelectorAll находит поля только переданной формы.
  const inputs = form.querySelectorAll('input');
  let firstInvalidInput = null;

  inputs.forEach(function (input) {
    // Удаляем старую ошибку перед новой проверкой.
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
      // Регулярное выражение: сначала одна русская буква, затем буквы, пробелы или дефисы.
      if (input.name === 'name' && !/^[А-Яа-яЁё][А-Яа-яЁё \-]*$/.test(input.value.trim())) {
        message = 'Используйте русские буквы, пробелы и дефисы.';
      }

      // Разделители можно вводить или пропускать.
      if (input.name === 'phone') {
        // Проверяем копию номера без разделителей, но исходный ввод не меняем.
        const phone = input.value.replace(/[\s()\-]/g, '');
        // Формат: +7, 7 или 8, затем 9 и ещё девять цифр.
        if (!/^(\+7|7|8)9\d{9}$/.test(phone)) {
          message = 'Введите российский мобильный номер, например 79205235127.';
        }
      }

      if (input.name === 'password') {
        // Два независимых условия: длина не меньше шести и не только цифры.
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

    // Браузер получает то же сообщение, которое показываем рядом с полем.
    input.setCustomValidity(message);
    showError(input, message);
    // Сохраняем первое неправильное поле, чтобы после проверки фокус перешёл к нему.
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

// Один и тот же порядок обработки нужен для регистрации и для входа.
[registerForm, loginForm].forEach(function (form) {
  // После изменения поля убираем его старую ошибку.
  form.addEventListener('input', function (event) {
    // event.target — конкретное поле, в котором пользователь меняет значение.
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

    // FormData собирает пары name/value, Object.fromEntries превращает их в обычный объект.
    const data = Object.fromEntries(new FormData(form));
    if (form === registerForm) {
      // У checkbox FormData по умолчанию кладёт строку "on"; здесь сохраняем понятный boolean.
      data.consent = consent.checked;
    }
    console.log(form === registerForm ? 'Данные регистрации:' : 'Данные входа:', data);
    form.querySelector('.form-status').textContent = 'Данные формы выведены в консоль.';
  });
});
