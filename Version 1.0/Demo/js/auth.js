// js/auth.js : Authentication helpers (client-side demo only)
// Responsible for signup, login, logout, and session cookies
// Uses storage.js functions for persistence

import { getPlayer, savePlayer, getSessions, setSessions } from "./storage.js"; // Import storage helpers

// Utility: browser hashing using SubtleCrypto; falls back to simple text if not available
async function hashPassword(password) {
  // If SubtleCrypto available, use SHA-256
  if (window.crypto && window.crypto.subtle) {
    const enc = new TextEncoder(); // Encoder for string to bytes
    const data = enc.encode(password); // Convert password to Uint8Array
    const hashBuffer = await crypto.subtle.digest("SHA-256", data); // Hash the data
    // Convert ArrayBuffer to hex string
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    return `sha256:${hashHex}`; // Prefix to indicate algorithm
  } else {
    // Fallback: use a naive reversible prefix (NOT SECURE) - for demo only
    return `plain:${btoa(password)}`;
  }
}

// Create a session cookie (demonstrative)
// name: 'dungeon_session', value: username, maxAgeSeconds: number
export function setSessionCookie(username, maxAgeSeconds = 3600) {
  // Build cookie string with path and max-age
  document.cookie = `dungeon_session=${encodeURIComponent(
    username
  )}; max-age=${maxAgeSeconds}; path=/; samesite=lax`;
}

// Remove session cookie
export function clearSessionCookie() {
  // Expire cookie immediately
  document.cookie = "dungeon_session=; max-age=0; path=/; samesite=lax";
}

// Read session cookie value or null
export function getSessionCookie() {
  // Parse document.cookie
  const pairs = document.cookie
    .split(";")
    .map((p) => p.trim())
    .filter(Boolean);
  for (const p of pairs) {
    const [k, v] = p.split("=");
    if (k === "dungeon_session") return decodeURIComponent(v || "");
  }
  return null;
}

// Sign up a new user: returns { success, message }
export async function signup({ username, password, character = "female" }) {
  // Basic validation
  if (!username || !password)
    return { success: false, message: "Username and password are required." };
  // Check if username exists
  const existing = getPlayer(username);
  if (existing)
    return {
      success: false,
      message: "Username already exists. Choose another.",
    };
  // Hash password
  const passwordHash = await hashPassword(password);
  // Build user object with basic profile
  const userData = {
    username,
    passwordHash,
    character,
    createdAt: new Date().toISOString(),
    profile: { playerLevel: 1, xp: 0 },
  };
  // Save to storage
  savePlayer(userData);
  // Return success
  return { success: true, message: "Account created. You can now log in." };
}

// Login user: verifies password hash and creates session info
export async function login({ username, password }) {
  // Validate
  if (!username || !password)
    return { success: false, message: "Username and password required." };
  const user = getPlayer(username);
  if (!user) return { success: false, message: "User not found." };
  // Compute hash and compare
  const passwordHash = await hashPassword(password);
  if (passwordHash !== user.passwordHash)
    return { success: false, message: "Invalid credentials." };
  // Create session record in storage sessions map
  const sessions = getSessions();
  const expiresAt = Date.now() + 60 * 60 * 1000; // 1 hour expiry
  sessions.currentUser = username; // single session demo
  sessions.expiresAt = expiresAt;
  setSessions(sessions);
  // Set cookie for demo virtual identity
  setSessionCookie(username, 60 * 60); // 1 hour
  // Return success
  return { success: true, message: "Login successful.", username };
}

// Logout user: clears session cookie and session storage entry
export function logout() {
  clearSessionCookie(); // Remove cookie
  const sessions = getSessions();
  delete sessions.currentUser; // Remove current user
  delete sessions.expiresAt;
  setSessions(sessions); // Persist updated sessions
}

// Get current logged-in user (if session valid)
export function getCurrentUserFromSession() {
  // Prefer cookie, fallback to sessions object
  const cookieUser = getSessionCookie();
  if (cookieUser) return cookieUser;
  const sessions = getSessions();
  if (
    sessions &&
    sessions.currentUser &&
    sessions.expiresAt &&
    sessions.expiresAt > Date.now()
  ) {
    return sessions.currentUser;
  }
  return null;
}
