'use client';
import { Clock } from 'lucide-react';
import { logout } from '@/app/auth/actions';
import { useTransition } from 'react';

export default function PendingApprovalPage() {
  const [isPending, startTransition] = useTransition();

  const handleLogout = () => {
    startTransition(async () => {
      await logout();
    });
  };

  return (
    <main className="min-h-screen bg-surface flex items-center justify-center px-6">
      <div className="w-full max-w-md text-center space-y-6">
        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
          <Clock className="w-10 h-10 text-primary" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-extrabold text-foreground">Conta em aprovação</h1>
          <p className="text-muted text-sm leading-relaxed">
            O teu registo foi recebido e está a ser analisado pela nossa equipa.
            Receberás uma notificação assim que a tua conta for aprovada.
          </p>
        </div>
        <div className="bg-primary/5 border border-primary/10 rounded-2xl p-4 text-sm text-muted text-left space-y-2">
          <p className="font-semibold text-foreground">O que acontece a seguir?</p>
          <ul className="space-y-1 list-disc list-inside">
            <li>A nossa equipa verifica os teus dados</li>
            <li>Recebes um email com o resultado</li>
            <li>Após aprovação, podes usar o MarketU normalmente</li>
          </ul>
        </div>
        <button
          onClick={handleLogout}
          disabled={isPending}
          className="text-sm text-primary font-bold hover:underline focus:outline-none disabled:opacity-50"
        >
          {isPending ? 'A sair...' : 'Sair da conta'}
        </button>
      </div>
    </main>
  );
}