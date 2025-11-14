// js/storage.js : LocalStorage helper module (ES module)
// Export functions for storing and retrieving structured data in localStorage

const STORAGE_KEYS = {
  // Define storage keys used across app
  PLAYERS: "dungeon_players", // Key for all registered players
  SESSIONS: "dungeon_sessions", // Key for session info
  SAVES_PREFIX: "dungeon_save_", // Prefix for per-user saves
};

// Helper: load JSON-parsed value from localStorage by key
export function loadRaw(key) {
  // Read raw string from localStorage
  const raw = localStorage.getItem(key);
  // If nothing found return null
  if (!raw) return null;
  try {
    // Parse JSON and return
    return JSON.parse(raw);
  } catch (err) {
    // If parsing fails, remove corrupted item and return null
    console.warn("storage: corrupted data for key", key);
    localStorage.removeItem(key);
    return null;
  }
}

// Helper: save object as JSON string in localStorage under key
export function saveRaw(key, value) {
  // Convert to JSON and write to localStorage
  localStorage.setItem(key, JSON.stringify(value));
}

// Get all registered players object (username -> userData)
export function getAllPlayers() {
  // Load raw players object or return empty object
  return loadRaw(STORAGE_KEYS.PLAYERS) || {};
}

// Save the full players map to storage
export function setAllPlayers(playersObj) {
  // Write players map
  saveRaw(STORAGE_KEYS.PLAYERS, playersObj);
}

// Register a single user (overwrites if exists)
export function savePlayer(userData) {
  // userData must include username
  const players = getAllPlayers();
  players[userData.username] = userData;
  setAllPlayers(players);
}

// Retrieve a single player by username or null if not found
export function getPlayer(username) {
  const players = getAllPlayers();
  return players[username] || null;
}

// Remove a player entirely (for dev/testing)
export function removePlayer(username) {
  const players = getAllPlayers();
  if (players[username]) {
    delete players[username];
    setAllPlayers(players);
  }
}

// Session helpers: get and set sessions object
export function getSessions() {
  return loadRaw(STORAGE_KEYS.SESSIONS) || {};
}

export function setSessions(sessionsObj) {
  saveRaw(STORAGE_KEYS.SESSIONS, sessionsObj);
}

// Save per-user game state (namespaced by username)
export function saveGameState(username, gameState) {
  if (!username) return;
  saveRaw(STORAGE_KEYS.SAVES_PREFIX + username, gameState);
}

// Load per-user game state or null
export function loadGameState(username) {
  if (!username) return null;
  return loadRaw(STORAGE_KEYS.SAVES_PREFIX + username);
}

// Remove per-user save (used on reset)
export function removeGameState(username) {
  if (!username) return;
  localStorage.removeItem(STORAGE_KEYS.SAVES_PREFIX + username);
}
