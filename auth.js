document.querySelectorAll('[data-current-year]').forEach((year) => {
  year.textContent = new Date().getFullYear();
});

const demoAuthKey = "vendorLiftDemoAuth";
document.querySelectorAll("[data-logout]").forEach((button) => {
  button.addEventListener("click", () => {
    sessionStorage.removeItem(demoAuthKey);
    window.location.assign("index.html");
  });
});

const protectedPage = document.body.dataset.authRequired;

if (protectedPage) {
  let currentUser = null;
  try {
    currentUser = JSON.parse(sessionStorage.getItem(demoAuthKey));
  } catch (error) {
    console.error("Could not read the demo sign-in session.", error);
  }

  const isSignedIn = currentUser && ["customer", "restaurant"].includes(currentUser.role);
  const canAccessPage = protectedPage === "any"
    ? isSignedIn
    : isSignedIn && currentUser.role === protectedPage;

  if (!canAccessPage) {
    const signInPage = protectedPage === "restaurant" ? "restaurant-signin.html" : "index.html";
    window.location.replace(signInPage);
  } else {
    document.body.classList.add("auth-ready");
  }
}

document.querySelectorAll('[data-password-toggle]').forEach((button) => {
  button.addEventListener('click', () => {
    const input = document.getElementById(button.dataset.passwordToggle);
    if (!input) {
      return;
    }

    const isVisible = input.type === 'text';
    input.type = isVisible ? 'password' : 'text';
    button.textContent = isVisible ? 'Show' : 'Hide';
    button.setAttribute('aria-label', isVisible ? 'Show password' : 'Hide password');
    button.setAttribute('aria-pressed', String(!isVisible));
    input.focus();
  });
});

const signupForm = document.querySelector('[data-signup-form]');
if (signupForm) {
  const password = signupForm.querySelector('#new-password');
  const confirmation = signupForm.querySelector('#confirm-password');
  const strengthBar = signupForm.querySelector('[data-strength-bar]');
  const strengthLabel = signupForm.querySelector('[data-strength-label]');

  const updatePasswordState = () => {
    const value = password.value;
    const hasLength = value.length >= 8;
    const hasLetter = /[a-z]/i.test(value);
    const hasNumber = /\d/.test(value);
    const score = [hasLength, hasLetter, hasNumber].filter(Boolean).length;
    const missing = [];
    if (!hasLength) {
      missing.push('8+ characters');
    }
    if (!hasLetter) {
      missing.push('a letter');
    }
    if (!hasNumber) {
      missing.push('a number');
    }

    password.setCustomValidity(
      value && !(hasLength && hasLetter && hasNumber)
        ? 'Use at least 8 characters, including a letter and a number.'
        : ''
    );
    confirmation.setCustomValidity(
      confirmation.value && confirmation.value !== value
        ? 'Passwords do not match.'
        : ''
    );
    strengthBar.style.width = `${(score / 3) * 100}%`;
    strengthLabel.textContent = value
      ? score === 3
        ? 'Password strength: good'
        : `Add ${missing.join(', ')}`
      : '';
    strengthBar.style.background = score === 3 ? 'var(--vl-blue)' : 'var(--vl-gold)';
  };

  password.addEventListener('input', updatePasswordState);
  confirmation.addEventListener('input', updatePasswordState);
}

document.querySelectorAll('[data-reset-help]').forEach((button) => {
  button.addEventListener('click', () => {
    const message = button.closest('form').querySelector('[data-form-message]');
    message.textContent = 'Password recovery is not connected yet. Please contact your account administrator.';
    message.classList.remove('is-error');
    message.classList.add('is-visible');
  });
});

document.querySelectorAll('[data-auth-form]').forEach((form) => {
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const message = form.querySelector('[data-form-message]');
    message.classList.remove('is-error', 'is-visible');
    message.textContent = '';

    if (!form.reportValidity()) {
      const invalidField = form.querySelector(':invalid');
      if (invalidField) {
        invalidField.focus();
      }
      
      return;
    }

    const role = form.dataset.authRole;
    if (!["customer", "restaurant"].includes(role)) {
      message.textContent = "This form is missing its account type. Please reload and try again.";
      message.classList.add("is-error", "is-visible");
      return;
    }

    const nameField = form.elements.namedItem("name");
    const emailField = form.elements.namedItem("email");
    const usernameField = form.elements.namedItem("username");
    const displayName = nameField?.value.trim()
      || emailField?.value.trim()
      || usernameField?.value.trim()
      || (role === "restaurant" ? "Restaurant" : "Customer");
    const accountEmail = emailField?.value.trim().toLowerCase() || "";

    try {
      if (role === "restaurant") {
        const previousOwnerEmail = sessionStorage.getItem("vendorLiftRestaurantOwnerEmail");
        if (previousOwnerEmail && previousOwnerEmail !== accountEmail) {
          sessionStorage.removeItem("vendorLiftRestaurantDetails");
          sessionStorage.removeItem("vendorLiftRestaurantId");
        }
        sessionStorage.setItem("vendorLiftRestaurantOwnerEmail", accountEmail);
      }
      sessionStorage.setItem(demoAuthKey, JSON.stringify({
        role,
        displayName,
        email: accountEmail,
        signedInAt: new Date().toISOString(),
      }));
    } catch (error) {
      console.error("Could not save the demo sign-in session.", error);
      message.textContent = "Your browser could not save your sign-in for this tab. Check your browser settings and try again.";
      message.classList.add("is-error", "is-visible");
      return;
    }

    if (form.dataset.signupForm !== undefined) {
      window.location.assign(role === "restaurant" ? "forms.html" : "feed.html");
      return;
    }

    window.location.assign(role === "restaurant" ? "dashboard.html" : "feed.html");
  });
});
