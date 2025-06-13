export function Login() {
  const cognitoAuthConfig = {
    authority: "https://eu-west-1jun0zg2eg.auth.eu-west-1.amazoncognito.com",
    client_id: "3ot8dopkkdbs6gj759q3tk8jsk",
    redirect_uri: "http://localhost:5173/",
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

  const loginUrl = `${domain}/login?client_id=${clientId}&response_type=${responseType}&scope=${scopes.replace(
    " ",
    "+"
  )}&redirect_uri=${encodeURIComponent(redirectUri)}`;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <form className="bg-white p-6 rounded shadow-md w-full max-w-sm">
        <h2 className="text-xl font-semibold mb-4">Login</h2>
        <button className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700">
          <a href={loginUrl}> Log In</a>
        </button>
      </form>
    </div>
  );
}
