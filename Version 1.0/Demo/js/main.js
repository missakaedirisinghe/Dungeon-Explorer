// js/main.js : Application bootstrap for Sprint A
// Initializes UI, wires auth & storage into the login/signup flows

import { signup, login, logout, getCurrentUserFromSession } from "./auth.js"; // Auth functions
import { saveGameState, loadGameState, getPlayer } from "./storage.js"; // Storage functions

// Helper to select element by id
const $ = (id) => document.getElementById(id);

// Elements used in the auth flows
const splashScreen = $("splash-screen"); // Splash container
const authSection = $("auth-section"); // Auth container
const loginCard = $("login-card"); // Login card element
const signupCard = $("signup-card"); // Signup card
const loginForm = $("login-form"); // Login form
const signupForm = $("signup-form"); // Signup form
const loginMessage = $("login-message"); // Login feedback
const signupMessage = $("signup-message"); // Signup feedback
const toSignupBtn = $("to-signup"); // Button to go to signup
const toLoginBtn = $("to-login"); // Button to go back to login
const startGuestBtn = $("start-guest"); // Guest start button
const sessionInfo = $("session-info"); // Session text area

// Utility: show a specific screen and hide others
function showScreen(screenId) {
  // Hide everything with class 'screen'
  document
    .querySelectorAll(".screen")
    .forEach((s) => s.classList.add("hidden"));
  // Show requested screen
  const el = $(screenId);
  if (el) el.classList.remove("hidden");
}

// Setup initial event listeners for splash and auth navigation
function setupNavigation() {
  // Splash interactions: any key or click continues to auth screen
  window.addEventListener("keydown", () => showScreen("auth-section"));
  window.addEventListener("click", (e) => {
    // If click on start guest button, perform guest flow
    if (e.target && e.target.id === "start-guest") {
      startGuestFlow();
    } else {
      showScreen("auth-section");
    }
  });

  // Switch from login to signup
  toSignupBtn.addEventListener("click", () => {
    loginCard.classList.add("hidden");
    signupCard.classList.remove("hidden");
  });
  // Back to login view
  toLoginBtn.addEventListener("click", () => {
    signupCard.classList.add("hidden");
    loginCard.classList.remove("hidden");
  });
}

// Guest quick-start: create temporary user in memory (not persistent)
function startGuestFlow() {
  // Use a timestamped guest username
  const guestName = `guest_${Date.now()}`;
  // Create a minimal session object in localStorage sessions (direct method)
  // For demo we simply set session cookie and navigate to character select
  document.cookie = `dungeon_session=${encodeURIComponent(
    guestName
  )}; max-age=${60 * 60}; path=/; samesite=lax`;
  sessionInfo.textContent = `Playing as ${guestName} (guest)`; // Update header
  // Show character select (placeholder)
  showScreen("character-select");
}

// Wire login form submission
function setupLoginForm() {
  loginForm.addEventListener("submit", async (evt) => {
    evt.preventDefault(); // Prevent default form submit
    loginMessage.textContent = ""; // Clear message
    const username = $("login-username").value.trim(); // Get username
    const password = $("login-password").value; // Get password
    // Call login
    try {
      const res = await login({ username, password }); // Use auth module
      if (res.success) {
        loginMessage.textContent = res.message; // Show confirmation
        sessionInfo.textContent = `Logged in as ${res.username}`; // Header update
        // After login, check saved game and offer resume if available
        const saved = loadGameState(res.username);
        if (saved && saved.alive) {
          // If alive resume available, show prompt (simple confirm)
          const resume = confirm(
            `Resume last session from Level ${saved.level}? Click OK to resume, Cancel to start new.`
          ); // Simple prompt for demo
          if (resume) {
            // Navigate directly to game area (placeholder)
            showScreen("game-area");
            // In full game we would restore position and UI
            return;
          } else {
            // Remove saved alive flag or reset as desired
            // For Sprint A we simply go to character select
            showScreen("character-select");
            return;
          }
        } else {
          // No save -> go to character select
          showScreen("character-select");
        }
      } else {
        // Show error
        loginMessage.textContent = res.message;
      }
    } catch (err) {
      loginMessage.textContent = "An error occurred during login.";
      console.error(err);
    }
  });
}

// Wire signup form submission
function setupSignupForm() {
  signupForm.addEventListener("submit", async (evt) => {
    evt.preventDefault(); // Prevent default submit
    signupMessage.textContent = ""; // Clear previous message
    const username = $("signup-username").value.trim(); // Get username
    const password = $("signup-password").value; // Get password
    const character = $("signup-character").value; // Get selected character
    try {
      const res = await signup({ username, password, character }); // Call signup
      signupMessage.textContent = res.message; // Show message
      if (res.success) {
        // After successful signup, switch to login view
        signupCard.classList.add("hidden");
        loginCard.classList.remove("hidden");
        // Pre-fill login username for convenience
        $("login-username").value = username;
      }
    } catch (err) {
      signupMessage.textContent = "An error occurred during signup.";
      console.error(err);
    }
  });
}

// On load: check if already logged-in via cookie / session
function checkExistingSession() {
  const user = getCurrentUserFromSession(); // Uses auth module
  if (user) {
    sessionInfo.textContent = `Welcome back, ${user}`; // Update header info
    // If user has saves, prompt resume (simplified)
    const save = loadGameState(user);
    if (save && save.alive) {
      const resume = confirm(
        `Resume saved session for ${user} (Level ${save.level})?`
      ); // Confirm dialog for demo
      if (resume) {
        showScreen("game-area"); // Navigate to game area
        return;
      }
    }
    // Otherwise go to character select
    showScreen("character-select");
  } else {
    // No session -> show splash screen initially
    showScreen("splash-screen");
  }
}

// Bootstrap function that sets up event listeners and initial state
export function bootstrap() {
  // Setup navigation events
  setupNavigation();
  // Wire form handlers
  setupLoginForm();
  setupSignupForm();
  // Check if user already logged in
  checkExistingSession();
}

// Immediately bootstrap on module load
bootstrap(); // Initialize app
