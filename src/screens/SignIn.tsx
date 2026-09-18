import { type FormEvent, useState } from "react";
import { sendMagicLink, signInWithGoogle } from "../data/auth";

export function SignIn() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    await sendMagicLink(email);
    setSent(true);
  }

  return (
    <div className="signin">
      <form onSubmit={submit}>
        <h1>Komplett</h1>
        <button type="button" className="primary" onClick={signInWithGoogle}>
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
        {sent && <p className="muted">Check your inbox for the sign-in link.</p>}
      </form>
    </div>
  );
}
