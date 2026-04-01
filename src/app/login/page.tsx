"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Lock, User, ArrowRight, Loader2, Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    if (!isLogin) {
      // Fluxo de Cadastro Real Supabase
      if (!name || !email || !password) {
        setError("Preencha todos os campos.");
        setLoading(false);
        return;
      }
      const { data, error: supaError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: name, role: 'viewer' }
        }
      });

      if (supaError) {
        setError(supaError.message);
      } else {
        // Criar perfil inicial no banco
        if (data.user) {
          await supabase.from('profiles').insert({
              id: data.user.id,
              email: email,
              full_name: name,
              role: 'viewer',
              is_approved: false
          });
        }
        setSuccess("Conta enviada para aprovação! Verifique seu e-mail para validar.");
        setName("");
        setIsLogin(true); // Volta para tela de login
      }
    } else {
      // Fluxo de Login Real Supabase
      const { data, error: supaError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (supaError) {
        setError("Credenciais inválidas ou conta inexistente.");
      } else if (data.session) {
        // Redireciona com segurança
        router.push("/");
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#121212] flex items-center justify-center p-4 relative overflow-hidden selection:bg-purple-500/30">
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-purple-900/20 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-indigo-900/10 blur-[120px] rounded-full pointer-events-none" />

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="w-full max-w-md">
        <div className="bg-[#18181b]/80 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
          
          <div className="flex flex-col items-center mb-8 relative z-10">
            <img src="/logo-pesarti-v2.png" alt="Pesarti" className="h-12 w-auto mb-6 object-contain brightness-110 drop-shadow-[0_0_20px_rgba(124,58,237,0.4)]" />
            <h1 className="text-2xl font-bold text-white tracking-tight">{isLogin ? "Bem-vindo de volta" : "Criar sua conta"}</h1>
            <p className="text-sm text-zinc-400 mt-1">{isLogin ? "Acesse o hub de operações Pesarti" : "Junte-se ao time Pesarti"}</p>
          </div>

          <form className="space-y-4 relative z-10" onSubmit={handleAuth}>
            <AnimatePresence mode="popLayout">
              {!isLogin && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.3 }}>
                  <label className="block text-xs font-medium text-zinc-400 mb-1.5 ml-1">Nome Completo</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                    <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Jane Doe" className="w-full bg-[#121212] border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#7c3AED]/50 transition-all placeholder:text-zinc-600" />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5 ml-1">E-mail Corporativo</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="nome@pesarti.com" className="w-full bg-[#121212] border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#7c3AED]/50 transition-all placeholder:text-zinc-600" />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5 ml-1 mr-1">
                <label className="text-xs font-medium text-zinc-400">Senha</label>
                {isLogin && <a href="#" className="text-xs text-[#7c3AED] hover:text-fuchsia-400 transition-colors">Esqueceu a senha?</a>}
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500 pointer-events-none" />
                <input type={showPassword ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} placeholder="•••••••••" className="w-full bg-[#121212] border border-white/10 rounded-xl py-3 pl-10 pr-12 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#7c3AED]/50 transition-all placeholder:text-zinc-600" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors">
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {error && <p className="text-xs text-red-400 text-center font-medium my-2">{error}</p>}
            {success && <p className="text-xs text-emerald-400 text-center font-medium my-2">{success}</p>}

            <div className="pt-2">
              <button disabled={loading} type="submit" className="w-full bg-gradient-to-r from-[#7c3AED] to-[#5B21B6] hover:from-fuchsia-500 hover:to-[#7c3AED] text-white rounded-xl py-3 text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-[0_0_20px_rgba(124,58,237,0.3)] hover:shadow-[0_0_25px_rgba(124,58,237,0.5)] disabled:opacity-70 disabled:cursor-not-allowed">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                  <>{isLogin ? "Entrar na plataforma" : "Cadastrar e Acessar"} <ArrowRight className="w-4 h-4" /></>
                )}
              </button>
            </div>
          </form>

          <div className="mt-6 text-center text-sm text-zinc-400 relative z-10">
            {isLogin ? "Ainda não tem acesso?" : "Já possui uma conta?"}
            <button onClick={() => setIsLogin(!isLogin)} className="ml-2 text-white font-medium hover:text-[#7c3AED] transition-colors">
              {isLogin ? "Solicitar convite" : "Fazer Login"}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
