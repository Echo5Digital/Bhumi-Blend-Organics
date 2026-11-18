import { useState, type FormEvent } from "react";
import { Navigate, useLocation, useNavigate } from "react-router";
import { Notice, useTitle } from "../components/ui";
import { ApiError } from "../lib/api";
import { useAuth } from "../lib/auth";

export function Login() {
  useTitle("Log in");
  const { token, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? "/";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  if (token) return <Navigate to={from} replace />;

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      await login(email.trim(), password);
      navigate(from, { replace: true });
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Something went wrong. Please try again.");
      setBusy(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-box">
        <h1>Bhumi Blend Admin</h1>
        <form onSubmit={submit}>
          {error && <Notice kind="error">{error}</Notice>}
          <p>
            <label className="label" htmlFor="email">
              Email address
            </label>
            <input id="email" type="email" autoComplete="username" required autoFocus value={email} onChange={(event) => setEmail(event.target.value)} />
          </p>
          <p>
            <label className="label" htmlFor="password">
              Password
            </label>
            <input id="password" type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} />
          </p>
          <button type="submit" className="btn primary" disabled={busy}>
            {busy ? "Logging in…" : "Log in"}
          </button>
        </form>
      </div>
    </div>
  );
}
