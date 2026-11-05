'use client';
import Link from 'next/link';
import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { api, message, setToken } from '@/lib/api';
import type { User } from '@/lib/types';
import { SiteShell } from '../components/SiteShell';
import { Back, Feedback, Icon } from '../components/ui';
export default function AuthPage({ register = false }: { register?: boolean }) {
  const router = useRouter();
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const values = new FormData(event.currentTarget);
    const password = String(values.get('password'));
    if (register && password !== values.get('confirmation')) {
      setError('As senhas não coincidem.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const result = await api<{ user: User; accessToken: string }>(
        register ? '/auth/register' : '/auth/login',
        {
          method: 'POST',
          body: JSON.stringify({
            email: String(values.get('email')).trim(),
            password,
            ...(register
              ? { displayName: String(values.get('name')).trim() }
              : {}),
          }),
        },
      );
      setToken(result.accessToken);
      const next = new URLSearchParams(window.location.search).get('next');
      router.replace(
        next?.startsWith('/') && !next.startsWith('//') && !next.includes('\\')
          ? next
          : result.user.role === 'ADMIN'
            ? '/admin'
            : '/minha-area',
      );
    } catch (error) {
      setError(message(error));
    } finally {
      setBusy(false);
    }
  }
  return (
    <SiteShell>
      <Back />
      <div className={'auth-stage' + (register ? ' registration-stage' : '')}>
        <form className="panel auth-form" onSubmit={submit}>
          <div>
            <h1>{register ? 'Crie sua conta' : 'Bom ter você de volta'}</h1>
            <p className="muted">
              {register
                ? 'Seu histórico, suas notas e os próximos filmes. Tudo em um só lugar.'
                : 'Entre para acompanhar seus filmes e continuar suas avaliações.'}
            </p>
          </div>
          <Feedback error={error} />
          <div className="auth-fields">
            {register && (
              <label className="field">
                Nome
                <input
                  name="name"
                  placeholder="Seu nome completo"
                  autoComplete="name"
                  required
                  minLength={2}
                  maxLength={80}
                />
              </label>
            )}
            <label className="field">
              E-mail
              <input
                name="email"
                type="email"
                placeholder="voce@example.com"
                autoComplete="email"
                required
                maxLength={254}
              />
            </label>
            <label className="field">
              Senha
              <span className="password-input">
                <input
                  name="password"
                  aria-label="Senha"
                  aria-describedby={register ? 'password-hint' : undefined}
                  type={show ? 'text' : 'password'}
                  placeholder={register ? 'Crie uma senha' : '••••••••'}
                  autoComplete={register ? 'new-password' : 'current-password'}
                  required
                  minLength={8}
                  maxLength={128}
                />
                <button
                  type="button"
                  aria-label={show ? 'Ocultar senha' : 'Mostrar senha'}
                  aria-pressed={show}
                  onClick={() => setShow(!show)}
                >
                  <Icon name="eye" />
                </button>
              </span>
              {register && (
                <small className="muted" id="password-hint">
                  Use pelo menos 8 caracteres.
                </small>
              )}
            </label>
            {register && (
              <label className="field">
                Confirmar senha
                <input
                  name="confirmation"
                  type={show ? 'text' : 'password'}
                  placeholder="Repita sua senha"
                  autoComplete="new-password"
                  required
                  minLength={8}
                  maxLength={128}
                />
              </label>
            )}
          </div>
          <button className="button primary full-width" disabled={busy}>
            {busy ? 'Aguarde…' : register ? 'Criar conta' : 'Entrar'}
          </button>
          <hr />
          <p className="auth-alternate muted">
            {register ? 'Já tem uma conta?' : 'Ainda não tem uma conta?'}{' '}
            <Link className="accent" href={register ? '/login' : '/cadastro'}>
              {register ? 'Entrar' : 'Cadastre-se'}
            </Link>
          </p>
        </form>
      </div>
    </SiteShell>
  );
}
