import { Link } from 'react-router-dom';
import { PackageX } from 'lucide-react';

export function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-paper text-center px-4">
      <PackageX size={40} className="text-ink-soft mb-3" strokeWidth={1.5} />
      <h1 className="font-display text-4xl font-bold text-ink">Página não encontrada</h1>
      <p className="text-ink-soft mt-2">Este material não está catalogado no sistema.</p>
      <Link to="/" className="stamp text-amber-600 mt-6">
        Voltar ao painel
      </Link>
    </div>
  );
}
