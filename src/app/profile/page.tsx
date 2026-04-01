"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { X, User, Mail, Camera, Save, Lock, LayoutDashboard } from "lucide-react";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewAvatar, setPreviewAvatar] = useState<string | null>(null);

  useEffect(() => {
    // Carregar usuário logado do localStorage
    const savedUser = localStorage.getItem('pesarti_currentUser');
    if (savedUser) {
      const user = JSON.parse(savedUser);
      setName(user.name || "");
      setEmail(user.email || "");
      if (user.avatar) setPreviewAvatar(user.avatar);
    } else {
      setName("Marco");
      setEmail("marco@pesarti.com");
    }
  }, []);

  const handleSave = () => {
    const savedUser = localStorage.getItem('pesarti_currentUser');
    if (savedUser) {
        const user = JSON.parse(savedUser);
        user.name = name;
        if (password) user.password = password; // Atualiza a senha se preenchido
        user.avatar = previewAvatar || "";
        
        // Atualiza o user atual
        localStorage.setItem('pesarti_currentUser', JSON.stringify(user));
        
        // Atualiza a base de dados principal de usuários
        const allUsers = JSON.parse(localStorage.getItem('pesarti_users') || '[]');
        const updatedUsers = allUsers.map((u: any) => u.email === email ? { ...u, name, avatar: previewAvatar || "", password: password || u.password } : u);
        localStorage.setItem('pesarti_users', JSON.stringify(updatedUsers));

        alert("Seu perfil foi atualizado com sucesso no sistema!");
        setPassword(""); // Reseta o campo senha visualmente
    }
  };

  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPreviewAvatar(URL.createObjectURL(file));
    }
  };

  return (
    <div className="min-h-screen bg-[#121212] text-white selection:bg-purple-500/30 overflow-hidden relative">
      <div className="absolute top-0 right-[-20%] w-[60%] h-[60%] bg-[#7c3AED]/10 blur-[150px] rounded-full pointer-events-none" />

      {/* Header Tópico */}
      <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-[#121212]/70 border-b border-white/5 py-4 px-6 flex items-center justify-between">
        <div className="font-bold text-lg text-white">Editar Meu Perfil</div>
        <button onClick={() => router.push('/')} className="p-2 bg-white/5 hover:bg-white/10 rounded-full text-zinc-400 hover:text-white transition-colors cursor-pointer" title="Fechar (X)">
          <X className="w-6 h-6" />
        </button>
      </header>

      <main className="max-w-3xl mx-auto p-6 md:p-10 relative z-10 pt-16">
        <motion.div
           initial={{ opacity: 0, y: 15 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ duration: 0.4 }}
        >
          <div className="flex items-center gap-4 mb-8">
            <div className="p-3 bg-[#18181b] rounded-2xl border border-white/5 ring-1 ring-[#7c3AED]/20 shadow-[0_0_15px_rgba(124,58,237,0.15)]">
              <User className="w-8 h-8 text-[#7c3AED]" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Meu Perfil</h1>
              <p className="text-zinc-400">Gerencie suas informações pessoais e credenciais de acesso.</p>
            </div>
          </div>

          <div className="bg-[#18181b]/60 backdrop-blur-xl border border-white/10 rounded-3xl p-6 md:p-10 shadow-2xl relative">
            
            {/* Foto Avatar */}
            <div className="flex flex-col md:flex-row items-center gap-8 mb-10 pb-10 border-b border-white/5">
              <div className="relative group">
                <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-[#121212] bg-zinc-800 flex items-center justify-center text-4xl shadow-xl ring-2 ring-[#7c3AED]/30">
                   {previewAvatar ? (
                     <img src={previewAvatar} alt="Avatar" className="w-full h-full object-cover" />
                   ) : (
                     <span className="text-zinc-400 font-bold">{name.charAt(0)}</span>
                   )}
                </div>
                
                {/* Botão de Upload Camera */}
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-0 right-0 p-3 bg-gradient-to-tr from-[#7c3AED] to-fuchsia-500 rounded-full text-white shadow-[0_0_15px_rgba(124,58,237,0.5)] hover:scale-110 transition-transform cursor-pointer"
                >
                  <Camera className="w-5 h-5" />
                </button>
                <input 
                  type="file" 
                  accept="image/png, image/jpeg" 
                  className="hidden" 
                  ref={fileInputRef} 
                  onChange={handleAvatarSelect}
                />
              </div>

              <div>
                <h2 className="text-xl font-semibold mb-1">Foto do Perfil</h2>
                <p className="text-sm text-zinc-400 max-w-sm mb-4">
                  Essa foto será exibida no Board, nos comentários de cards e históricos de quem alterou o quê.
                </p>
                <div className="flex gap-3">
                  <button 
                     onClick={() => fileInputRef.current?.click()}
                     className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm font-medium transition-all"
                  >
                    Alterar Imagem
                  </button>
                  {previewAvatar && (
                    <button 
                       onClick={() => setPreviewAvatar(null)}
                       className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/10 rounded-xl text-sm font-medium transition-all"
                    >
                      Remover
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Informações Pessoais */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10 pb-10 border-b border-white/5">
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2 ml-1">Nome de Exibição</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                  <input 
                    type="text" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-[#121212] border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#7c3AED]/50 transition-all placeholder:text-zinc-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2 ml-1">E-mail (Login e Alertas)</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                  <input 
                    type="email" 
                    value={email}
                    disabled
                    className="w-full bg-[#121212]/50 border border-white/5 rounded-xl py-3 pl-10 pr-4 text-sm text-zinc-500 cursor-not-allowed"
                  />
                </div>
                <p className="text-xs text-zinc-500 mt-2 ml-1">O e-mail não pode ser alterado diretamente.</p>
              </div>
            </div>

            {/* Redefinição de Senha */}
            <div>
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Lock className="w-5 h-5 text-[#7c3AED]" /> Segurança
              </h2>
              <div className="max-w-md">
                <label className="block text-sm font-medium text-zinc-400 mb-2 ml-1">Nova Senha</label>
                <input 
                  type="password" 
                  placeholder="Deixe em branco para manter a mesma"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#121212] border border-white/10 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#7c3AED]/50 transition-all placeholder:text-zinc-600"
                />
              </div>
            </div>

            {/* Footer Form */}
            <div className="mt-12 pt-6 flex justify-end">
              <button 
                 onClick={handleSave}
                 className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#7c3AED] to-[#5B21B6] hover:from-fuchsia-500 hover:to-[#7c3AED] text-white rounded-xl text-sm font-bold shadow-[0_0_15px_rgba(124,58,237,0.3)] hover:shadow-[0_0_25px_rgba(124,58,237,0.5)] transition-all cursor-pointer"
              >
                <Save className="w-4 h-4" />
                Salvar Alterações
              </button>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
