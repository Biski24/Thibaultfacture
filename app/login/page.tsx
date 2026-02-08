'use client';
import { FormEvent, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }
    if (!data.session) {
      setError('Connexion impossible.');
      setLoading(false);
      return;
    }
    router.replace('/dashboard');
  };

  const handleSignup = async () => {
    setError('');
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) setError(error.message);
  };

  return (
    <div className="flex items-center justify-center">
      <div className="card w-full max-w-md p-6 space-y-4">
        <h1 className="text-xl font-semibold text-center">Connexion admin</h1>
        <form className="space-y-3" onSubmit={handleSubmit}>
          <div>
            <label className="label">Email</label>
            <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
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
          <button type="submit" className="btn btn-primary w-full" disabled={loading}>
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>
          <button type="button" className="btn btn-secondary w-full" onClick={handleSignup}>
            Créer le compte admin
          </button>
        </form>
        <p className="text-center text-xs text-slate-500">Un seul compte suffit pour l&apos;administration.</p>
      </div>
    </div>
  );
}
