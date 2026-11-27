import { apiRequest, setAuthToken } from "./api.js";

(() => {
  const loginForm = document.getElementById("login-form");
  const registerForm = document.getElementById("register-form");
  if (loginForm) {
    const email = loginForm.querySelector("#email");
    const password = loginForm.querySelector("#password");
    const formError = document.getElementById("form-error");
    const emailError = document.getElementById("email-error");
    const passwordError = document.getElementById("password-error");
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const fields = [
      { input: email, error: emailError },
      { input: password, error: passwordError }
    ];

    function clearFieldError(field) {
      if (!field.input) return;
      if (field.error) field.error.textContent = "";
      field.input.classList.remove("is-invalid");
      field.input.removeAttribute("aria-invalid");
    }

    function validateField(field) {
      if (!field.input) return false;

      const value = field.input.value.trim();
      let message = "";
      if (!value) {
        message = field.input === email
          ? "Please enter your email."
          : "Please enter your password.";
      } else if (field.input === email && !emailPattern.test(value)) {
        message = "Please enter a valid email address.";
      }

      if (field.error) field.error.textContent = message;
      field.input.classList.toggle("is-invalid", Boolean(message));
      field.input.setAttribute("aria-invalid", String(Boolean(message)));
      if (field.error) {
        field.input.setAttribute("aria-describedby", field.error.id);
      }
      return !message;
    }

    fields.forEach((field) => {
      if (!field.input) return;
      field.input.addEventListener("input", () => {
        clearFieldError(field);
        if (formError) {
          formError.textContent = "";
          formError.hidden = true;
        }
      });
    });

    const passwordToggle = loginForm.querySelector(
      '#toggle-password, [data-toggle-password="password"]'
    );
    if (passwordToggle && password) {
      passwordToggle.addEventListener("click", () => {
        const show = password.type === "password";
        password.type = show ? "text" : "password";
        passwordToggle.setAttribute("aria-label", show ? "Hide password" : "Show password");
        passwordToggle.setAttribute("aria-pressed", String(show));
      });
    }

    loginForm.addEventListener("submit", (event) => {
      event.preventDefault();
      if (formError) {
        formError.textContent = "";
        formError.hidden = true;
      }

      const invalidFields = fields.filter((field) => !validateField(field));
      if (invalidFields.length) {
        if (invalidFields[0].input) invalidFields[0].input.focus();
        return;
      }

      if (formError) {
        formError.textContent = "Login is not available yet.";
        formError.hidden = false;
      }
    });
    return;
  }

  const form = loginForm || registerForm;
  if (!form) return;

  const isRegister = form === registerForm;
  const name = isRegister ? form.querySelector("#display-name") : null;
  const email = form.querySelector(isRegister ? "#register-email" : "#email");
  const password = form.querySelector(isRegister ? "#register-password" : "#password");
  const confirmPassword = isRegister ? form.querySelector("#confirm-password") : null;
  const formError = document.getElementById("form-error");
  const formSuccess = document.getElementById("form-success");
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const fields = isRegister
    ? [
        {
          input: name,
          errorId: "name-error",
          validate: () => {
            const value = name.value.trim();
            if (!value) return "Please enter your name.";
            if (value.length > 100) return "Your name must be 100 characters or fewer.";
            return "";
          }
        },
        {
          input: email,
          errorId: "email-error",
          validate: () => {
            const value = email.value.trim();
            if (!value) return "Please enter your email.";
            if (value.length > 254 || !email.validity.valid) {
              return "Please enter a valid email address.";
            }
            return "";
          }
        },
        {
          input: password,
          errorId: "password-error",
          validate: () => {
            if (!password.value.trim()) return "Please enter your password.";
            if (password.value.length < 8) return "Your password must be at least 8 characters.";
            if (password.value.length > 128) return "Your password must be 128 characters or fewer.";
            return "";
          }
        },
        {
          input: confirmPassword,
          errorId: "confirm-password-error",
          validate: () => {
            if (!confirmPassword.value.trim()) return "Please confirm your password.";
            if (confirmPassword.value !== password.value) return "Passwords do not match.";
            return "";
          }
        }
      ]
    : [
        {
          input: email,
          errorId: "email-error",
          validate: () => {
            const value = email.value.trim();
            if (!value) return "Please enter your email.";
            if (!emailPattern.test(value)) return "Please enter a valid email address.";
            return "";
          }
        },
        {
          input: password,
          errorId: "password-error",
          validate: () => (password.value ? "" : "Please enter your password.")
        }
      ];

  function validateField(field) {
    const message = field.validate();
    const errorElement = document.getElementById(field.errorId);
    errorElement.textContent = message;
    field.input.classList.toggle("is-invalid", Boolean(message));
    field.input.setAttribute("aria-invalid", String(Boolean(message)));
    field.input.setAttribute("aria-describedby", errorElement.id);
    return !message;
  }

  function hideAlerts() {
    formError.hidden = true;
    formSuccess.hidden = true;
  }

  fields.forEach((field) => {
    field.input.addEventListener("input", () => {
      hideAlerts();
      if (field.input.classList.contains("is-invalid")) validateField(field);

      if (isRegister && field.input === password && confirmPassword.value) {
        const confirmField = fields.find((candidate) => candidate.input === confirmPassword);
        validateField(confirmField);
      }
    });
  });

  form.querySelectorAll("[data-toggle-password]").forEach((toggle) => {
    const target = Array.from(form.querySelectorAll("input"))
      .find((input) => input.id === toggle.dataset.togglePassword);
    if (!target) return;

    toggle.addEventListener("click", () => {
      const show = target.type === "password";
      target.type = show ? "text" : "password";
      toggle.setAttribute("aria-label", show ? "Hide password" : "Show password");
      toggle.setAttribute("aria-pressed", String(show));
    });
  });

  let isSubmitting = false;
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (isSubmitting) return;
    hideAlerts();

    const invalid = fields.filter((field) => !validateField(field));
    if (invalid.length) {
      invalid[0].input.focus();
      return;
    }

    isSubmitting = true;
    const submitButton = form.querySelector('[type="submit"]');
    const originalButtonText = submitButton ? submitButton.textContent : "";
    const rememberMe = form.querySelector("#remember-me");
    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = isRegister ? "Creating account…" : "Signing in…";
    }
    form.setAttribute("aria-busy", "true");

    const payload = isRegister
      ? {
          name: name.value.trim(),
          email: email.value.trim(),
          password: password.value
        }
      : {
          email: email.value.trim(),
          password: password.value
        };

    try {
      const result = await apiRequest(`/api/auth/${isRegister ? "register" : "login"}`, {
        method: "POST",
        body: JSON.stringify(payload)
      });

      if (!result || typeof result.accessToken !== "string" || !result.accessToken) {
        throw new Error("The server returned an invalid authentication response.");
      }

      setAuthToken(result.accessToken, Boolean(rememberMe && rememberMe.checked));
      window.location.assign("index.html");
    } catch (error) {
      formError.textContent = error instanceof Error
        ? error.message
        : isRegister
          ? "Unable to create your account. Please try again."
          : "Unable to sign in. Please try again.";
      formError.hidden = false;
    } finally {
      isSubmitting = false;
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = originalButtonText;
      }
      form.removeAttribute("aria-busy");
    }
  });
})();
