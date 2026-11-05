'use client';
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <div className="state">
      <h1>Não foi possível abrir esta página</h1>
      <p>Tente novamente em alguns instantes.</p>
      <button className="button primary" onClick={reset}>
        Tentar novamente
      </button>
    </div>
  );
}
