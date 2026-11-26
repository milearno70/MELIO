(() => {
  const form = document.getElementById("login-form");
  if (!form) return;

  const email = document.getElementById("email");
  const password = document.getElementById("password");
  const toggle = document.getElementById("toggle-password");
  const formError = document.getElementById("form-error");
  const formSuccess = document.getElementById("form-success");

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const validators = new Map([
    [email, () => {
      const value = email.value.trim();
      if (!value) return "Please enter your email.";
      if (!emailPattern.test(value)) return "Please enter a valid email address.";
      return "";
    }],
    [password, () => (password.value ? "" : "Please enter your password.")]
  ]);

  function validateField(input) {
    const message = validators.get(input)();
    const errorElement = document.getElementById(`${input.id}-error`);
    errorElement.textContent = message;
    input.classList.toggle("is-invalid", Boolean(message));
    input.setAttribute("aria-invalid", String(Boolean(message)));
    input.setAttribute("aria-describedby", errorElement.id);
    return !message;
  }

  function hideAlerts() {
    formError.hidden = true;
    formSuccess.hidden = true;
  }

  validators.forEach((_, input) => {
    input.addEventListener("input", () => {
      hideAlerts();
      if (input.classList.contains("is-invalid")) validateField(input);
    });
  });

  toggle.addEventListener("click", () => {
    const show = password.type === "password";
    password.type = show ? "text" : "password";
    toggle.setAttribute("aria-label", show ? "Hide password" : "Show password");
    toggle.setAttribute("aria-pressed", String(show));
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    hideAlerts();

    const invalid = [...validators.keys()].filter((input) => !validateField(input));
    if (invalid.length) {
      invalid[0].focus();
      return;
    }

    // TODO: backend hazır olanda burada POST /api/auth/login çağırılacaq.
    formError.textContent = "Login isn't available yet. Please try again later.";
    formError.hidden = false;
  });
})();
