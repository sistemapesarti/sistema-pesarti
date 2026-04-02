"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, UserPlus, CheckCircle, XCircle, Search, ShieldAlert, ArrowLeft, X, BarChart2, Activity, Trophy } from "lucide-react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type MockUser = {
  id: string;
  name: string;
  email: string;
  role: "admin" | "editor" | "viewer" | "pending";
  date: string;
  allowedAreas?: string[];
  performance?: number;
};

const initialUsers: MockUser[] = [
  { id: "1", name: "Marco", email: "usepesarti@gmail.com", role: "admin", date: "31/03/2026" },
  { id: "2", name: "Lipe Silva", email: "lipe@pesarti.com", role: "editor", date: "31/03/2026" },
  { id: "3", name: "Rapha Alves", email: "rapha@pesarti.com", role: "editor", date: "31/03/2026" },
  { id: "4", name: "Novo Colaborador", email: "colab@pesarti.com", role: "pending", date: "Hoje" },
];

export default function AdminDashboard() {
  const router = useRouter();
  const [profiles, setProfiles] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [approvingUser, setApprovingUser] = useState<any | null>(null);
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [selectedAreas, setSelectedAreas] = useState<string[]>([]);

  const ALL_AREAS = ['Operação', 'Marketing', 'Estratégico', 'Financeiro', 'Brainstorm', 'Calendário'];

  const getLevelName = (perf: number) => {
    if(perf > 80) return "Lenda Pesarti 🏆";
    if(perf > 50) return "Veterano Destaque ⚔️";
    if(perf > 20) return "Explorador 🛡️";
    return "Iniciante 🌱";
  };

  const getLevelColor = (perf: number) => {
    if(perf > 80) return "text-yellow-400 bg-yellow-500/10 border-yellow-500/30 shadow-[0_0_10px_rgba(234,179,8,0.2)]";
    if(perf > 50) return "text-emerald-400 bg-emerald-500/10 border-emerald-500/30";
    if(perf > 20) return "text-blue-400 bg-blue-500/10 border-blue-500/30";
    return "text-zinc-400 bg-white/5 border-white/10";
  };

  useEffect(() => {
    fetchProfiles();
  }, []);

  async function fetchProfiles() {
    const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
    if (data) setProfiles(data);
  }

  const handleApproveClick = (user: any) => {
    setApprovingUser(user);
  };

  const confirmApprove = async () => {
    if (!approvingUser) return;
    
    await supabase.from('profiles').update({
      is_approved: true,
      role: 'editor', // Ou viewer, conforme sua escolha inicial
      allowed_areas: selectedAreas
    }).eq('id', approvingUser.id);
    
    fetchProfiles();
    setApprovingUser(null);
    alert("Usuário APROVADO com sucesso!");
  };

  const handleEditClick = (user: any) => {
    setEditingUser(user);
    setSelectedAreas(user.allowed_areas || []);
  };

  const confirmEdit = async () => {
    if (!editingUser) return;
    await supabase.from('profiles').update({ allowed_areas: selectedAreas }).eq('id', editingUser.id);
    fetchProfiles();
    setEditingUser(null);
    alert("Permissões atualizadas!");
  };

  const handleReject = async (id: string) => {
    if (!confirm("Tem certeza que deseja remover este acesso?")) return;
    await supabase.from('profiles').delete().eq('id', id);
    fetchProfiles();
  };

  const pendingUsers = profiles.filter(u => !u.is_approved);
  const activeUsers = profiles.filter(u => u.is_approved);

  return (
    <div className="min-h-screen bg-[#121212] text-white selection:bg-purple-500/30 overflow-hidden relative">
      <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] bg-[#7c3AED]/10 blur-[120px] rounded-full pointer-events-none" />

      {/* Header */}
      <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-[#121212]/70 border-b border-white/5 py-4 px-6 flex items-center justify-between">
        <div className="font-bold text-lg text-white">Painel do Administrador</div>
        <button onClick={() => router.push('/')} className="p-2 bg-white/5 hover:bg-white/10 rounded-full text-zinc-400 hover:text-white transition-colors cursor-pointer" title="Fechar (X)">
          <X className="w-6 h-6" />
        </button>
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-[#7c3AED] bg-purple-900/20 px-3 py-1.5 rounded-full border border-purple-500/30">
            ADMINISTRADOR GERAL
          </span>
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#7c3AED] to-fuchsia-500 flex items-center justify-center font-bold text-sm shadow-[0_0_15px_rgba(124,58,237,0.4)]">
            M
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-6 md:p-10 relative z-10">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-[#18181b] rounded-2xl border border-white/5 ring-1 ring-[#7c3AED]/20 shadow-lg">
                <ShieldAlert className="w-8 h-8 text-[#7c3AED]" />
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Gestão de Acessos</h1>
                <p className="text-zinc-400">Controle quem pode ver, editar e operar o Pesarti Board.</p>
              </div>
            </div>
            
            <button className="flex items-center gap-2 bg-[#7c3AED] hover:bg-[#6d28d9] text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-[0_0_15px_rgba(124,58,237,0.3)]">
              <UserPlus className="w-4 h-4" /> Cadastrar Novo Usuário
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Coluna 1: Pendentes (Approval) */}
            <div className="lg:col-span-1 flex flex-col gap-4">
              <div className="bg-[#18181b]/80 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-xl">
                <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <Users className="w-5 h-5 text-yellow-500" /> 
                  Solicitações Pendentes
                  <span className="ml-auto bg-yellow-500/20 text-yellow-500 text-xs py-0.5 px-2 rounded-full">
                    {pendingUsers.length}
                  </span>
                </h2>

                {pendingUsers.length === 0 ? (
                  <p className="text-sm text-zinc-500 italic">Nenhum usuário aguardando aprovação no momento.</p>
                ) : (
                  <div className="flex flex-col gap-3">
                    {pendingUsers.map(user => (
                      <div key={user.id} className="bg-[#121212] p-4 rounded-xl border border-white/5 flex flex-col gap-3">
                        <div>
                          <p className="font-semibold text-sm">{user.full_name}</p>
                          <p className="text-xs text-zinc-400">{user.email}</p>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <button onClick={() => handleApproveClick(user)} className="flex-1 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-400 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1.5">
                            <CheckCircle className="w-3.5 h-3.5" /> Aprovar
                          </button>
                          <button onClick={() => handleReject(user.id)} className="flex-1 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1.5">
                            <XCircle className="w-3.5 h-3.5" /> Recusar
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Coluna 2: Usuários Ativos */}
            <div className="lg:col-span-2 flex flex-col gap-4">
              <div className="bg-[#18181b]/80 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-xl min-h-[400px]">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                  <h2 className="text-lg font-bold flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-emerald-500" />
                    Usuários Ativos da Plataforma
                  </h2>
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                    <input 
                      type="text" 
                      placeholder="Buscar por nome ou e-mail..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full sm:w-64 bg-[#121212] border border-white/10 rounded-full py-2 pl-9 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-[#7c3AED] transition-all"
                    />
                  </div>
                </div>

                {/* VIEW DESKTOP (TABELA) */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="text-zinc-500 border-b border-white/5">
                        <th className="pb-3 font-medium">Usuário</th>
                        <th className="pb-3 font-medium">Nível de Acesso</th>
                        <th className="pb-3 font-medium">Data de Integração</th>
                        <th className="pb-3 font-medium text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activeUsers.filter(u => u.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) || u.email?.toLowerCase().includes(searchTerm.toLowerCase())).map(user => (
                        <tr key={user.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors">
                          <td className="py-4">
                            <p className="font-semibold text-zinc-200">{user.full_name}</p>
                            <p className="text-xs text-zinc-500">{user.email}</p>
                          </td>
                          <td className="py-4">
                            <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                              user.role === 'admin' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' :
                              user.role === 'editor' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' :
                              'bg-zinc-800 text-zinc-300 border border-white/10'
                            }`}>
                              {user.role}
                            </span>
                          </td>
                          <td className="py-4 text-zinc-400 text-xs">{new Date(user.created_at).toLocaleDateString()}</td>
                          <td className="py-4 text-right">
                            <button onClick={() => handleEditClick(user)} className="text-xs text-zinc-400 hover:text-white underline underline-offset-2 transition-colors">Editar Permissões</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* VIEW MOBILE (CARDS) */}
                <div className="md:hidden grid grid-cols-1 gap-4">
                  {activeUsers.filter(u => u.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) || u.email?.toLowerCase().includes(searchTerm.toLowerCase())).map(user => (
                    <div key={user.id} className="bg-[#121212] p-6 rounded-[32px] border border-white/5 flex flex-col gap-6 relative overflow-hidden group">
                       <div className="absolute top-0 right-0 w-24 h-24 bg-[#7c3AED]/5 blur-2xl pointer-events-none" />
                       <div className="flex justify-between items-start">
                          <div>
                            <p className="font-black text-white text-lg tracking-tight mb-0.5">{user.full_name}</p>
                            <p className="text-xs text-zinc-500 font-medium mb-4">{user.email}</p>
                            <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${
                              user.role === 'admin' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' :
                              user.role === 'editor' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' :
                              'bg-zinc-800 text-zinc-300 border border-white/10'
                            }`}>
                              Nível {user.role}
                            </span>
                          </div>
                          <div className="text-right">
                            <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mb-1">Entrada</p>
                            <p className="text-xs font-bold text-zinc-400">{new Date(user.created_at).toLocaleDateString()}</p>
                          </div>
                       </div>
                       <button 
                         onClick={() => handleEditClick(user)} 
                         className="w-full py-4 bg-[#7c3AED]/10 hover:bg-[#7c3AED] border border-[#7c3AED]/20 text-[#7c3AED] hover:text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all active:scale-95 shadow-lg shadow-purple-500/5"
                       >
                         Gerenciar Acessos
                       </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Box de Gráfico de Performance dos Usuários Ativos (Gamificado) */}
              <div className="bg-[#18181b]/80 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-xl mt-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-[40%] h-[40%] bg-fuchsia-500/10 blur-[100px] rounded-full pointer-events-none" />
                
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-4 border-b border-white/5 relative z-10">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-gradient-to-tr from-fuchsia-500 to-indigo-500 rounded-xl text-white shadow-lg"><Trophy className="w-5 h-5" /></div>
                    <div>
                      <h2 className="text-xl font-bold">Ranking e Produtividade</h2>
                      <p className="text-xs text-zinc-400">Score de ações e níveis de experiência na plataforma</p>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 relative z-10">
                  {activeUsers.map((user, idx) => {
                    const perfValue = user.performance || Math.floor(Math.random() * 80) + 20; // fallback pra mockup inicial
                    const levelName = getLevelName(perfValue);
                    const levelColor = getLevelColor(perfValue);
                    
                    return (
                      <motion.div initial={{opacity: 0, scale: 0.95}} animate={{opacity: 1, scale: 1}} transition={{delay: idx * 0.1, duration: 0.4}} key={`perf-${user.id}`} className="bg-[#121212] p-5 rounded-2xl border border-white/5 relative overflow-hidden group hover:border-[#7c3AED]/30 transition-all">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-fuchsia-500/5 rounded-full blur-2xl group-hover:bg-fuchsia-500/10 transition-colors pointer-events-none" />
                        
                        <div className="flex justify-between items-start mb-5 relative z-10">
                          <div>
                            <span className="text-base font-bold text-white block truncate max-w-[150px]">{user.name}</span>
                            <span className={`inline-block px-3 py-1 mt-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border transition-all ${levelColor}`}>
                              {levelName}
                            </span>
                          </div>
                          <div className="text-right">
                             <div className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-400 to-indigo-400 tracking-tighter drop-shadow-sm">{perfValue}k <span className="text-xs font-bold text-indigo-400">XP</span></div>
                             <div className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest leading-none mt-1">Conquistas</div>
                          </div>
                        </div>
                        
                        <div className="w-full h-4 bg-black border border-white/10 rounded-full overflow-hidden relative z-10 p-0.5">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min(perfValue, 100)}%` }}
                            transition={{ duration: 1.5, type: 'spring' }}
                            className="h-full bg-gradient-to-r from-indigo-500 via-fuchsia-500 to-yellow-500 rounded-full shadow-[0_0_10px_rgba(217,70,239,0.5)] relative overflow-hidden"
                          >
                             {/* Efeito de brilho animado na barra */}
                             <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-white/30 to-transparent" />
                          </motion.div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </div>

          </div>
        </motion.div>
      </main>

      {/* Modal de Aprovação e Áreas de Acesso */}
      <AnimatePresence>
        {(approvingUser || editingUser) && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="w-full max-w-md bg-[#18181b] border border-white/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
              <div className="absolute top-[-50%] right-[-50%] w-full h-full bg-[#7c3AED]/10 blur-[80px] rounded-full pointer-events-none" />
              <h3 className="text-xl font-bold mb-2 relative z-10">{approvingUser ? "Aprovar & Configurar Acessos" : "Editar Permissões"}</h3>
              <p className="text-sm text-zinc-400 mb-6 relative z-10">Selecione quais áreas do Pesarti Board <strong className="text-white">{(approvingUser || editingUser)?.name}</strong> poderá visualizar e operar.</p>
              
              <div className="space-y-3 mb-8 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar relative z-10">
                {ALL_AREAS.map(area => {
                   const isSelected = selectedAreas.includes(area);
                   return (
                     <label key={area} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${isSelected ? 'bg-purple-500/10 border-purple-500/30 shadow-[0_0_15px_rgba(124,58,237,0.1)]' : 'bg-[#121212] border-white/5 hover:border-white/10'}`}>
                       <input 
                         type="checkbox" 
                         checked={isSelected}
                         onChange={(e) => {
                           if (e.target.checked) setSelectedAreas([...selectedAreas, area]);
                           else setSelectedAreas(selectedAreas.filter(a => a !== area));
                         }}
                         className="w-4 h-4 rounded border-zinc-600 text-purple-600 focus:ring-purple-500/50 bg-[#18181b]"
                       />
                       <span className={`text-sm font-bold ${isSelected ? 'text-purple-300' : 'text-zinc-400'}`}>{area}</span>
                     </label>
                   )
                })}
              </div>

              <div className="flex gap-3 relative z-10">
                <button onClick={() => { setApprovingUser(null); setEditingUser(null); }} className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl font-bold text-sm transition-all border border-white/5">Cancelar</button>
                <button onClick={approvingUser ? confirmApprove : confirmEdit} className="flex-1 py-3 bg-gradient-to-r from-[#7c3AED] to-[#5B21B6] hover:from-fuchsia-500 hover:to-[#7c3AED] text-white rounded-xl font-bold text-sm transition-all shadow-[0_0_15px_rgba(124,58,237,0.3)] hover:shadow-[0_0_25px_rgba(124,58,237,0.5)] flex items-center justify-center gap-2">
                  <CheckCircle className="w-4 h-4" /> {approvingUser ? "Conceder Acesso" : "Salvar Áreas"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
