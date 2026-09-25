import React, { useState } from 'react';
import { Banknote, ShieldCheck, Check, Sparkles, X, Lock } from 'lucide-react';

interface MonetizationModalProps {
  onClose: () => void;
  onCreditCash: (amount: number) => void;
}

const CASH_PACKAGES = [
  { id: 'pack_starter', name: 'Piloto Iniciante', cash: 50, priceBrl: 'R$ 9,90', bonus: '+0' },
  { id: 'pack_tuner', name: 'Oficina Turbo', cash: 250, priceBrl: 'R$ 39,90', bonus: '+25 Bônus', popular: true },
  { id: 'pack_apex', name: 'Cofre Apex VIP', cash: 1000, priceBrl: 'R$ 129,90', bonus: '+150 Bônus', legend: true }
];

export const MonetizationModal: React.FC<MonetizationModalProps> = ({
  onClose,
  onCreditCash
}) => {
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSimulatePurchase = (pkg: typeof CASH_PACKAGES[0]) => {
    setProcessingId(pkg.id);
    setSuccessMsg(null);

    // Simulate secure cryptographic transaction processing
    setTimeout(() => {
      onCreditCash(pkg.cash);
      setProcessingId(null);
      setSuccessMsg(`Sucesso! Pedido processado. +${pkg.cash} Cash creditado com segurança.`);
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-700 rounded-2xl p-6 shadow-2xl overflow-hidden">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 mb-1">
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-950/80 text-emerald-400 border border-emerald-500/40 flex items-center gap-1">
            <Lock className="w-3 h-3" />
            <span>Gateway Seguro & Escalável</span>
          </span>
        </div>

        <h2 className="text-xl font-black text-white font-mono flex items-center gap-2">
          <Banknote className="w-5 h-5 text-emerald-400" />
          <span>Loja de Cash (Moeda RMT)</span>
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Utilize Cash para puxar carros no Gacha do Ferro Velho, adquirir lendas na Concessionária ou apostar nas corridas.
        </p>

        {successMsg && (
          <div className="mt-4 p-3 rounded-xl bg-emerald-950/80 border border-emerald-500/60 text-emerald-300 text-xs font-mono flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-400" />
            <span>{successMsg}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-5">
          {CASH_PACKAGES.map((pkg) => {
            const isBusy = processingId === pkg.id;

            return (
              <div
                key={pkg.id}
                className={`p-4 rounded-xl border flex flex-col justify-between relative transition-all ${
                  pkg.popular
                    ? 'bg-emerald-950/30 border-emerald-500 shadow-lg shadow-emerald-500/10 ring-1 ring-emerald-500/50'
                    : 'bg-slate-950/70 border-slate-800'
                }`}
              >
                {pkg.popular && (
                  <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-emerald-500 text-slate-950 text-[9px] font-black px-2 py-0.5 rounded-full font-mono uppercase">
                    Mais Popular
                  </span>
                )}

                <div>
                  <div className="text-xs font-bold font-mono text-white mb-1">{pkg.name}</div>
                  <div className="text-2xl font-black font-mono text-emerald-400">
                    {pkg.cash} <span className="text-xs text-emerald-500">CASH</span>
                  </div>
                  <div className="text-[10px] text-amber-400 font-mono mt-0.5">{pkg.bonus}</div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800">
                  <div className="text-xs font-bold text-slate-300 mb-2">{pkg.priceBrl}</div>
                  <button
                    onClick={() => handleSimulatePurchase(pkg)}
                    disabled={isBusy}
                    className="w-full py-2 px-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-mono text-xs font-black transition-all cursor-pointer shadow-md active:scale-95"
                  >
                    {isBusy ? 'Processando...' : 'Comprar (Teste)'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 text-[11px] text-slate-400 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Ambiente seguro de demonstração: simulação de faturamento com liberação imediata.</span>
          </div>
          <button
            onClick={onClose}
            className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs cursor-pointer font-mono"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
