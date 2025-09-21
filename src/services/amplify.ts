// amplify-config.ts
import { Amplify } from "aws-amplify";
import { signIn, fetchAuthSession, confirmSignIn } from "aws-amplify/auth";

Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: "eu-west-1_jun0ZG2Eg",
      userPoolClientId: "3ot8dopkkdbs6gj759q3tk8jsk",
      // optional extras:
      // identityPoolId: 'eu-west-1:xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
      loginWith: { email: true }, // or { username: true }, { phone: true }
      signUpVerificationMethod: "code", // optional
      // userAttributes, passwordFormat, allowGuestAccess, etc. also supported
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
