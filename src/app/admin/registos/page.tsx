'use client';

import React, { useState, useEffect } from 'react';
import { 
  getPendingEnrollments, 
  getInstitutions, 
  processEnrollmentAction 
} from './actions';
import { 
  Check, 
  X, 
  Building2, 
  Clock, 
  AlertCircle,
  UserCheck,
  Loader2,
  Calendar,
  Hash
} from 'lucide-react';
import { toast } from 'sonner';

type EnrollmentVerification = {
  id: string;
  user_id: string;
  enrollment_code: string;
  submitted_at: string | null;
  status: string | null;
  users: {
    id: string;
    full_name: string;
    enrollment_code: string;
    institution_id: string;
    institution: {
      id: string;
      name: string;
    } | null;
  } | null;
};

type Institution = {
  id: string;
  name: string;
};

export default function RegistosPage() {
  const [verifications, setVerifications] = useState<EnrollmentVerification[]>([]);
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [selectedInstId, setSelectedInstId] = useState<string>('all');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  
  // Rejection modal states
  const [rejectingItem, setRejectingItem] = useState<EnrollmentVerification | null>(null);
  const [rejectionNote, setRejectionNote] = useState<string>('');
  const [rejectionError, setRejectionError] = useState<string>('');

  useEffect(() => {
    async function loadInitialData() {
      setIsLoading(true);
      const [verifRes, instRes] = await Promise.all([
        getPendingEnrollments(),
        getInstitutions()
      ]);

      if (verifRes.success) {
        setVerifications(verifRes.data as any[]);
      } else {
        toast.error(verifRes.error || 'Erro ao carregar verificações.');
      }

      if (instRes.success) {
        setInstitutions(instRes.data);
      } else {
        toast.error(instRes.error || 'Erro ao carregar instituições.');
      }
      setIsLoading(false);
    }

    loadInitialData();
  }, []);

  const handleFilterChange = async (instId: string) => {
    setSelectedInstId(instId);
    setIsLoading(true);
    const res = await getPendingEnrollments(instId);
    if (res.success) {
      setVerifications(res.data as any[]);
    } else {
      toast.error(res.error || 'Erro ao filtrar verificações.');
    }
    setIsLoading(false);
  };

  const handleApprove = async (id: string) => {
    if (actionLoadingId) return;
    setActionLoadingId(id);
    
    try {
      const res = await processEnrollmentAction({ id, status: 'active' });
      if (res.success) {
        toast.success('Estudante aprovado com sucesso!');
        setVerifications(prev => prev.filter(v => v.id !== id));
      } else {
        toast.error(res.error || 'Erro ao aprovar estudante.');
      }
    } catch (err) {
      toast.error('Ocorreu um erro inesperado.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleOpenRejectModal = (item: EnrollmentVerification) => {
    setRejectingItem(item);
    setRejectionNote('');
    setRejectionError('');
  };

  const handleConfirmReject = async () => {
    if (!rejectingItem) return;
    if (!rejectionNote.trim()) {
      setRejectionError('O motivo de rejeição é obrigatório.');
      return;
    }

    setActionLoadingId(rejectingItem.id);
    const id = rejectingItem.id;
    
    try {
      const res = await processEnrollmentAction({ 
        id, 
        status: 'suspended', 
        rejectionNote: rejectionNote 
      });

      if (res.success) {
        toast.success('Registo rejeitado e conta suspensa.');
        setVerifications(prev => prev.filter(v => v.id !== id));
        setRejectingItem(null);
      } else {
        toast.error(res.error || 'Erro ao rejeitar estudante.');
      }
    } catch (err) {
      toast.error('Ocorreu um erro inesperado.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-PT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="flex flex-col gap-6 font-mono">
      {/* Header Info */}
      <div className="bg-white p-6 rounded-2xl border border-[#EDE7FF] shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-gray-800 flex items-center gap-2">
            <Clock className="w-6 h-6 text-amber-500 animate-pulse" />
            Fila de Aprovação de Alunos
          </h2>
          <p className="text-xs text-gray-400 font-sans mt-1">
            Verifique e valide os dados dos alunos pendentes de verificação antes de libertar o acesso.
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-center">
          <span className="text-xs font-bold text-gray-500 font-sans">Filtrar por Instituição:</span>
          <select
            value={selectedInstId}
            onChange={(e) => handleFilterChange(e.target.value)}
            className="text-xs bg-gray-50 border border-[#EDE7FF] rounded-xl px-3 py-2 text-gray-700 font-semibold focus:outline-none focus:border-[#4B187C] focus:ring-1 focus:ring-[#4B187C] cursor-pointer"
          >
            <option value="all">Todas as Instituições</option>
            {institutions.map(inst => (
              <option key={inst.id} value={inst.id}>{inst.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Main List Area */}
      {isLoading ? (
        <div className="bg-white border border-[#EDE7FF] rounded-2xl p-16 flex flex-col items-center justify-center gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-[#4B187C]" />
          <p className="text-sm font-semibold text-gray-500">A carregar registos...</p>
        </div>
      ) : verifications.length === 0 ? (
        <div className="bg-white border border-[#EDE7FF] rounded-2xl p-16 flex flex-col items-center justify-center text-center gap-3">
          <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <UserCheck className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-gray-800">Tudo limpo!</h3>
          <p className="text-xs text-gray-400 font-sans max-w-sm">
            Não existem registos pendentes de aprovação {selectedInstId !== 'all' ? 'para esta instituição.' : 'neste momento.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {verifications.map((item) => {
            const user = item.users;
            const institutionName = user?.institution?.name || 'Instituição Desconhecida';
            const fullName = user?.full_name || 'Desconhecido';
            const enrollmentCode = item.enrollment_code || user?.enrollment_code || '-';
            const isProcessing = actionLoadingId === item.id;

            return (
              <div 
                key={item.id}
                className="bg-white border border-[#EDE7FF] hover:border-[#4B187C] p-6 rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 flex flex-col lg:flex-row justify-between gap-6"
              >
                <div className="flex flex-col gap-3 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-black text-gray-800">{fullName}</span>
                    <span className="bg-amber-50 text-amber-600 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Pendente
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-sans text-xs text-gray-600 mt-2">
                    <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-xl border border-gray-100">
                      <Building2 className="w-4 h-4 text-[#4B187C]" />
                      <div className="flex flex-col">
                        <span className="text-[10px] text-gray-400 uppercase font-semibold">Instituição</span>
                        <span className="font-bold text-gray-700 truncate max-w-[200px]">{institutionName}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-xl border border-gray-100">
                      <Hash className="w-4 h-4 text-[#4B187C]" />
                      <div className="flex flex-col">
                        <span className="text-[10px] text-gray-400 uppercase font-semibold">Nº de Matrícula</span>
                        <span className="font-bold text-gray-700">{enrollmentCode}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-xl border border-gray-100">
                      <Calendar className="w-4 h-4 text-[#4B187C]" />
                      <div className="flex flex-col">
                        <span className="text-[10px] text-gray-400 uppercase font-semibold">Submetido em</span>
                        <span className="font-bold text-gray-700">{formatDate(item.submitted_at)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center lg:justify-end gap-3 shrink-0">
                  <button
                    onClick={() => handleApprove(item.id)}
                    disabled={isProcessing}
                    className="flex-1 lg:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    {isProcessing && actionLoadingId === item.id ? (
                      <Loader2 className="w-4.5 h-4.5 animate-spin" />
                    ) : (
                      <Check className="w-4 h-4" />
                    )}
                    <span>Aprovar</span>
                  </button>
                  <button
                    onClick={() => handleOpenRejectModal(item)}
                    disabled={isProcessing}
                    className="flex-1 lg:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 text-xs font-bold transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                    <span>Rejeitar</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Reject Modal */}
      {rejectingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl border border-[#EDE7FF] shadow-2xl w-full max-w-md overflow-hidden animate-scale-in">
            <div className="p-6 border-b border-[#EDE7FF] flex items-center justify-between">
              <h3 className="text-base font-black text-gray-800 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-500" />
                Rejeitar Registo de Aluno
              </h3>
              <button 
                onClick={() => setRejectingItem(null)}
                className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 flex flex-col gap-4 font-sans">
              <div className="text-xs text-gray-500">
                <p>Está prestes a rejeitar a matrícula de <strong className="text-gray-800">{rejectingItem.users?.full_name}</strong>.</p>
                <p className="mt-1">Isto irá suspender o acesso da conta à plataforma.</p>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-gray-700">
                  Motivo da Rejeição <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={rejectionNote}
                  onChange={(e) => {
                    setRejectionNote(e.target.value);
                    if (e.target.value.trim()) setRejectionError('');
                  }}
                  placeholder="Ex: Número de matrícula inválido ou não consta no sistema da instituição."
                  className="w-full text-xs p-3 rounded-xl border border-gray-200 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500 min-h-[100px] resize-y text-gray-800"
                />
                {rejectionError && (
                  <span className="text-[10px] text-red-500 font-bold flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {rejectionError}
                  </span>
                )}
              </div>
            </div>

            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-3">
              <button
                onClick={() => setRejectingItem(null)}
                className="px-4 py-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-100 text-xs font-bold transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmReject}
                disabled={actionLoadingId === rejectingItem.id}
                className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-colors disabled:opacity-50 cursor-pointer"
              >
                {actionLoadingId === rejectingItem.id && <Loader2 className="w-3 h-3 animate-spin" />}
                Confirmar Rejeição
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
