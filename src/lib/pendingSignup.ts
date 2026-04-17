export type PendingSignup = {
  name: string;
  email: string;
  password: string;
};

let pendingSignup: PendingSignup | null = null;

export function setPendingSignup(data: PendingSignup) {
  pendingSignup = data;
}

export function getPendingSignup(): PendingSignup | null {
  return pendingSignup;
}

export function clearPendingSignup() {
  pendingSignup = null;
}
