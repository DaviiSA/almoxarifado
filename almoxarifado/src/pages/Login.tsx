import { useState, type FormEvent } from 'react';
import { Warehouse, Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { Field, Input, Button } from '@/components/Form';
import { ApiError } from '@/lib/api';

export function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Não foi possível entrar. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex bg-graphite-950">
      {/* Painel de identidade */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 bg-graphite-900 relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              'repeating-linear-gradient(45deg, #F5A623 0, #F5A623 2px, transparent 2px, transparent 22px)',
          }}
        />
        <div className="relative flex items-center gap-2.5">
          <div className="rounded-lg bg-amber-500 p-2">
            <Warehouse size={22} className="text-graphite-950" strokeWidth={2.4} />
          </div>
          <span className="font-display text-xl font-bold text-white">ALMOXARIFADO</span>
        </div>
        <div className="relative">
          <p className="stamp text-amber-500 mb-4">Estoque · Obras · Campo</p>
          <h1 className="font-display text-5xl font-bold text-white leading-[1.05] max-w-md">
            Todo material, toda obra, um único painel.
          </h1>
          <p className="text-graphite-600 mt-4 max-w-sm text-sm leading-relaxed">
            Entradas, saídas e aplicações em campo registradas direto na sua planilha Google —
            sem depender de arquivos soltos ou controles paralelos.
          </p>
        </div>
        <p className="relative code-tag text-graphite-700">v1.0 · dados armazenados no Google Sheets</p>
      </div>

      {/* Formulário */}
      <div className="flex-1 flex items-center justify-center p-6 bg-paper">
        <form onSubmit={handleSubmit} className="w-full max-w-sm animate-enter">
          <div className="lg:hidden flex items-center gap-2.5 mb-8 justify-center">
            <div className="rounded-lg bg-amber-500 p-1.5">
              <Warehouse size={18} className="text-graphite-950" strokeWidth={2.4} />
            </div>
            <span className="font-display text-lg font-bold text-ink">ALMOXARIFADO</span>
          </div>

          <h2 className="font-display text-3xl font-bold text-ink">Entrar</h2>
          <p className="text-sm text-ink-soft mt-1 mb-6">Acesse com seu e-mail e senha cadastrados.</p>

          {error && (
            <div className="flex items-start gap-2 rounded-md bg-rust-50 text-rust-500 text-sm px-3 py-2.5 mb-4">
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <Field label="E-mail" required>
            <Input
              type="email"
              required
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="voce@empresa.com"
            />
          </Field>
          <Field label="Senha" required>
            <Input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </Field>

          <Button type="submit" variant="secondary" disabled={loading} className="w-full mt-2">
            {loading && <Loader2 size={16} className="animate-spin" />}
            Entrar
          </Button>

          <p className="text-xs text-ink-soft mt-6 text-center leading-relaxed">
            Primeiro acesso? Use a conta administradora configurada nas variáveis de ambiente
            do projeto (<code className="code-tag">ADMIN_EMAIL</code> /{' '}
            <code className="code-tag">ADMIN_PASSWORD</code>) e cadastre a equipe em Usuários.
          </p>
        </form>
      </div>
    </div>
  );
}
