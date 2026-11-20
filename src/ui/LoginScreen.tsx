import { FormEvent, useState } from 'react';
import { useGameStore } from '../app/store';

export function LoginScreen() {
  const signIn = useGameStore((state) => state.signIn);
  const loading = useGameStore((state) => state.loading);
  const error = useGameStore((state) => state.error);
  const cloudStatus = useGameStore((state) => state.cloudStatus);
  const [email, setEmail] = useState('agent.demo@louvre-guardian.local');
  const [password, setPassword] = useState('');

  async function submit(event: FormEvent) {
    event.preventDefault();
    await signIn(email, password);
  }

  return (
    <main className="login-screen">
      <div className="login-atmosphere" />
      <section className="login-card" aria-labelledby="login-title">
        <div className="brand-mark" aria-hidden="true">△</div>
        <p className="eyebrow">Musée du Louvre · Simulated Security Operations</p>
        <h1 id="login-title">Louvre Guardian</h1>
        <p className="subtitle">Museum Security Management System</p>
        <form onSubmit={submit}>
          <label>
            Operator email
            <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" required />
          </label>
          <label>
            Password
            <input value={password} onChange={(event) => setPassword(event.target.value)} type="password" required={cloudStatus === 'connected'} placeholder={cloudStatus === 'demo' ? 'Not required in demo mode' : 'Enter password'} />
          </label>
          {error && <p className="form-error" role="alert">{error}</p>}
          <button className="primary-button" disabled={loading} type="submit">
            {loading ? 'Authenticating…' : cloudStatus === 'demo' ? 'Enter development shift' : 'Secure sign in'}
          </button>
        </form>
        <div className={`mode-banner ${cloudStatus}`}>
          <strong>{cloudStatus === 'demo' ? 'Development demo mode' : 'Supabase connected'}</strong>
          <span>{cloudStatus === 'demo' ? 'Changes are held in memory and reset on reload.' : 'Authentication and incident records use cloud persistence.'}</span>
        </div>
      </section>
    </main>
  );
}
