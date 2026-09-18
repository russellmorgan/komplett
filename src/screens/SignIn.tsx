import { type FormEvent, useState } from "react";
import { sendMagicLink, signInWithGoogle } from "../data/auth";

export function SignIn() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<string | null>(null);

  function run(action: () => Promise<unknown>, done: string | null) {
    setStatus(null);
    action().then(
      () => setStatus(done),
      (err: Error) => setStatus(err.message),
    );
  }

  function submit(e: FormEvent) {
    e.preventDefault();
    run(() => sendMagicLink(email), "Check your inbox for the sign-in link.");
  }

  return (
    <div className="signin">
      <form onSubmit={submit}>
        <h1>Komplett</h1>
        <button type="button" className="primary" onClick={() => run(signInWithGoogle, null)}>
          Sign in with Google
        </button>
        <p className="muted">or get a magic link by email</p>
        <input
          type="email"
          required
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <button type="submit">Email me a link</button>
        {status && <p className="muted">{status}</p>}
      </form>
    </div>
  );
}
