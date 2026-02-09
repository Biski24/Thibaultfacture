'use client';
import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';

const USERNAME = 'Amandine';
const PASSWORD = 'Bastienlebest';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (username === USERNAME && password === PASSWORD) {
      localStorage.setItem('session_user', USERNAME);
      router.replace('/dashboard');
    } else {
      setError('Identifiants invalides');
    }
  };

  return (
    <div className="flex min-h-[70vh] items-center justify-center">
      <div className="card w-full max-w-sm p-6 space-y-4">
        <h1 className="text-xl font-semibold text-center">Connexion</h1>
        <form className="space-y-3" onSubmit={handleSubmit}>
          <div>
            <label className="label">Utilisateur</label>
            <input className="input" value={username} onChange={(e) => setUsername(e.target.value)} required />
          </div>
          <div>
            <label className="label">Mot de passe</label>
            <input
              className="input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button className="btn btn-primary w-full" type="submit">
            Se connecter
          </button>
        </form>
      </div>
    </div>
  );
}
