const cognitoAuthConfig = {
  authority: "https://eu-west-1jun0zg2eg.auth.eu-west-1.amazoncognito.com",
  client_id: "3ot8dopkkdbs6gj759q3tk8jsk",
  redirect_uri: import.meta.env.VITE_LOGIN_URL ?? "http://localhost:5173",
  response_type: "token",
  scope: "email openid profile",
};

const {
  authority: domain,
  client_id: clientId,
  redirect_uri: redirectUri,
  response_type: responseType,
  scope: scopes,
} = cognitoAuthConfig;

export const loginUrl = `${domain}/login?client_id=${clientId}&response_type=${responseType}&scope=${scopes.replace(
  " ",
  "+"
)}&redirect_uri=${encodeURIComponent(redirectUri)}`;

export const logoutUrl = `${domain}/logout?client_id=${clientId}&response_type=${responseType}&logout_uri=${encodeURIComponent(
  redirectUri
)}&redirect_uri=${encodeURIComponent(redirectUri)}`;
