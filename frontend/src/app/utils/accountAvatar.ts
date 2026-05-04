export interface AccountIdentity {
  id?: string | null;
  username?: string | null;
  displayName?: string | null;
  role?: string | null;
}

export function getAccountDisplayName(account?: AccountIdentity | null) {
  const username = account?.username?.trim() || "";
  const displayName = account?.displayName?.trim() || "";
  if (username.toLowerCase() === "admin" || displayName.toLowerCase() === "admin") return "Admin";
  if (username.toLowerCase() === "testuser1" || displayName.toLowerCase() === "test user 1") return "Test User";
  return displayName || username || "Rencipe Cook";
}

export function getAccountInitial(account?: AccountIdentity | null) {
  const displayName = account?.displayName?.trim() || "";
  const username = account?.username?.trim() || "";
  const name = displayName || username || "Rencipe Cook";

  if (name.toLowerCase() === "admin" || username.toLowerCase() === "admin") {
    return "A";
  }

  const firstLetter = name.match(/[A-Za-z0-9]/)?.[0];
  return (firstLetter || "R").toUpperCase();
}

export function getAccountAvatarColor(account?: AccountIdentity | null) {
  return "#dbeafe";
}