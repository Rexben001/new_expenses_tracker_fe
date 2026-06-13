// amplify-config.ts
import { Amplify } from "aws-amplify";
import { signIn, fetchAuthSession, confirmSignIn } from "aws-amplify/auth";

const details = {
  userPoolId:
    import.meta.env.VITE_COGNITO_USER_POOL_ID ?? "eu-west-1_jun0ZG2Eg",
  userPoolClientId:
    import.meta.env.VITE_COGNITO_USER_POOL_CLIENT_ID ??
    "3ot8dopkkdbs6gj759q3tk8jsk",
};

Amplify.configure({
  Auth: {
    Cognito: {
      ...details,
      loginWith: { email: true }, // or { username: true }, { phone: true }
      signUpVerificationMethod: "code", // optional
    },
  },
});

// auth-api.ts

// services/amplify.ts (v6 APIs)

export async function loginWithPassword(username: string, password: string) {
  const res = await signIn({ username, password });
  const step = res.nextStep?.signInStep;
  if (!step || step === "DONE") {
    // let the app know we’re signed in
    window.dispatchEvent(new Event("app:auth-signedIn"));
    return { done: true };
  }
  return { done: false, step };
}

export async function completeMfa(code: string) {
  await confirmSignIn({ challengeResponse: code });
  window.dispatchEvent(new Event("app:auth-signedIn"));
}

export async function getTokens() {
  const s = await fetchAuthSession();
  return {
    accessToken: s.tokens?.accessToken?.toString() ?? null,
    idToken: s.tokens?.idToken?.toString() ?? null,
  };
}

export const hasIdToken = async () => {
  const s = await fetchAuthSession().catch(() => null);
  return !!s?.tokens?.idToken;
};
