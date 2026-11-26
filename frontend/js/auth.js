import { apiRequest, setAuthToken } from "./api.js";

(() => {
  const form = document.getElementById("login-form");
  if (!form) return;

  const email = document.getElementById("email");
  const password = document.getElementById("password");
  const toggle = form.querySelector('[data-toggle-password="password"]');
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

  if (toggle) {
    toggle.addEventListener("click", () => {
      const show = password.type === "password";
      password.type = show ? "text" : "password";
      toggle.setAttribute("aria-label", show ? "Hide password" : "Show password");
      toggle.setAttribute("aria-pressed", String(show));
    });
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    hideAlerts();

    const invalid = [...validators.keys()].filter((input) => !validateField(input));
    if (invalid.length) {
      invalid[0].focus();
      return;
    }

    const submitButton = form.querySelector('[type="submit"]');
    const originalButtonText = submitButton ? submitButton.textContent : "";
    const rememberMe = form.querySelector("#remember-me");
    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = "Signing in…";
    }
    form.setAttribute("aria-busy", "true");

    try {
      const result = await apiRequest("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({
          email: email.value.trim(),
          password: password.value
        })
      });

      if (!result || typeof result.accessToken !== "string" || !result.accessToken) {
        throw new Error("The server returned an invalid sign-in response.");
      }

      setAuthToken(result.accessToken, Boolean(rememberMe && rememberMe.checked));
      window.location.assign("index.html");
    } catch (error) {
      formError.textContent = error instanceof Error
        ? error.message
        : "Unable to sign in. Please try again.";
      formError.hidden = false;
    } finally {
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = originalButtonText;
      }
      form.removeAttribute("aria-busy");
    }
  });
})();
