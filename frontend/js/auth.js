import { apiRequest, setAuthToken } from "./api.js";

const loginForm = document.querySelector("#login-form");
const registerForm = document.querySelector("#register-form");
const form = loginForm || registerForm;

if (form) {
  const formError = document.querySelector("#form-error");
  const fields = {
    name: form.querySelector("#display-name"),
    email: form.querySelector("#email, #register-email"),
    password: form.querySelector("#password, #register-password"),
    confirmPassword: form.querySelector("#confirm-password")
  };
  const fieldErrors = {
    name: form.querySelector("#name-error"),
    email: form.querySelector("#email-error"),
    password: form.querySelector("#password-error"),
    confirmPassword: form.querySelector("#confirm-password-error")
  };
  const submitButton = form.querySelector("[type='submit']");
  let hasSubmitted = false;

  function fieldMessage(field) {
    const input = fields[field];
    if (!input) return "";
    const value = input.value.trim();

    if (field === "name") {
      if (!value) return "Enter your name.";
      if (value.length > 100) return "Your name must be 100 characters or fewer.";
    }

    if (field === "email") {
      if (!value) return "Enter your email address.";
      if (!input.validity.valid || value.length > 254) return "Enter a valid email address.";
    }

    if (field === "password") {
      if (!input.value) return "Enter your password.";
      if (input.value.length < 8) return "Your password must be at least 8 characters.";
      if (input.value.length > 128) return "Your password must be 128 characters or fewer.";
    }

    if (field === "confirmPassword") {
      if (!input.value) return "Confirm your password.";
      if (input.value !== fields.password.value) return "Passwords do not match.";
    }

    return "";
  }

  function setFieldError(field, message) {
    const input = fields[field];
    const errorElement = fieldErrors[field];
    if (!input || !errorElement) return;
    errorElement.textContent = message;
    input.setAttribute("aria-invalid", String(Boolean(message)));
  }

  function validateForm() {
    const requiredFields = registerForm
      ? ["name", "email", "password", "confirmPassword"]
      : ["email", "password"];
    let firstInvalidField = null;

    for (const field of requiredFields) {
      const message = fieldMessage(field);
      setFieldError(field, message);
      if (message && !firstInvalidField) firstInvalidField = fields[field];
    }

    if (firstInvalidField) {
      firstInvalidField.focus();
      formError.textContent = "Please correct the highlighted fields.";
      formError.hidden = false;
      return false;
    }
    return true;
  }

  function handleFieldInput(field) {
    if (hasSubmitted || fieldErrors[field].textContent) {
      setFieldError(field, fieldMessage(field));
    }
    if (field === "password" && registerForm && (hasSubmitted || fieldErrors.confirmPassword.textContent)) {
      setFieldError("confirmPassword", fieldMessage("confirmPassword"));
    }
    formError.textContent = "";
    formError.hidden = true;
  }

  for (const [field, input] of Object.entries(fields)) {
    if (input) input.addEventListener("input", () => handleFieldInput(field));
  }

  form.querySelectorAll("[data-toggle-password]").forEach((toggle) => {
    toggle.addEventListener("click", () => {
      const input = form.querySelector(`#${toggle.dataset.togglePassword}`);
      const shouldShowPassword = input.type === "password";
      input.type = shouldShowPassword ? "text" : "password";
      toggle.setAttribute("aria-label", shouldShowPassword ? "Hide password" : "Show password");
    });
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    formError.textContent = "";
    formError.hidden = true;
    hasSubmitted = true;
    if (!validateForm()) return;

    const isRegister = Boolean(registerForm);
    const originalButtonText = submitButton.textContent;
    submitButton.disabled = true;
    submitButton.textContent = isRegister ? "Creating account…" : "Signing in…";
    form.setAttribute("aria-busy", "true");
    try {
      const payload = isRegister
        ? {
            name: fields.name.value.trim(),
            email: fields.email.value.trim(),
            password: fields.password.value
          }
        : {
            email: fields.email.value.trim(),
            password: fields.password.value
          };
      const result = await apiRequest(`/api/auth/${isRegister ? "register" : "login"}`, {
        method: "POST",
        body: JSON.stringify(payload)
      });

      setAuthToken(result.accessToken, !isRegister && form.querySelector("#remember-me").checked);
      window.location.assign("index.html");
    } catch (error) {
      console.error("MELIO authentication request failed.", error);
      if (error.body?.errors && typeof error.body.errors === "object") {
        const fieldMap = {
          name: "name",
          email: "email",
          password: "password"
        };
        for (const [key, messages] of Object.entries(error.body.errors)) {
          const field = fieldMap[key.toLowerCase().replace(/^\$\.?/, "")];
          if (field) setFieldError(field, Array.isArray(messages) ? messages.join(" ") : String(messages));
        }
      }
      formError.textContent = error.message || "Unable to sign in. Please try again.";
      formError.hidden = false;
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = originalButtonText;
      form.removeAttribute("aria-busy");
    }
  });
}
