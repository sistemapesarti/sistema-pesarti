"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { motion, AnimatePresence, Reorder } from "framer-motion";
import {
  Building2,
  Megaphone,
  Lightbulb,
  AlertCircle,
  FolderKanban,
  ArrowLeft,
  Image as ImageIcon,
  Palette,
  Plus,
  MoreVertical,
  Paperclip,
  Maximize2,
  CheckCircle2,
  Settings,
  LayoutDashboard,
  Bell,
  Search,
  Users,
  MessageSquare,
  Send,
  Calendar,
  Clock,
  Trash2,
  Archive,
  ChevronRight,
  ChevronLeft,
  X,
  User as UserIcon,
  BarChart2,
  RefreshCw,
  Video,
  Link as LinkIcon,
  Flag,
  GripVertical,
  FileText,
  Layout,
  Globe,
  Filter,
  Maximize,
  List,
  LogOut,
  ShieldAlert,
  Activity,
  Edit3,
  Sparkles,
  Loader2,
  Key,
  ExternalLink
} from "lucide-react";
import Link from "next/link";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { supabase } from "@/lib/supabase";

// Map para persistência de ícones (Serialização)
const ICON_MAP: Record<string, any> = {
  Building2, Megaphone, Lightbulb, AlertCircle, FolderKanban, 
  CheckCircle2, LayoutDashboard, Bell, Calendar, Clock, BarChart2,
  Video, FileText, Globe, Activity, Layout, Sparkles, Settings, Users
};

// --- DADOS E TIPOS ---
import { CALENDAR_EVENTS_2026, CalendarEvent } from "@/data/calendar2026";
import { BrainstormModule } from "../brainstorm/BrainstormPage";
import { BrainstormMap } from "../brainstorm/data/types";

type CardStatus = 'todo' | 'doing' | 'alteracao' | 'done';
type CardColor = 'red' | 'yellow' | 'green' | 'blue' | 'purple' | 'orange' | 'pink' | 'default';

interface User {
  id: string;
  name: string;
  avatar: string;
  role: string;
}

interface BoardChatMessage {
  id: string;
  userId: string;
  text: string;
  timestamp: string;
  targetCardId?: string;
}

type Priority = 'low' | 'medium' | 'high' | 'urgent';

interface SubCard {
  id: string;
  title: string;
  description: string;
  status: CardStatus;
  priority: Priority;
  startDate: string;
  dueDate: string;
  progress: number;
  comments: BoardChatMessage[];
  assignedTo: string;
  pautas?: { id: string; text: string }[];
  attachments?: string[];
}

interface Topic {
  id: string;
  title: string;
  color: CardColor;
  icon: any;
  subCards: SubCard[];
}

interface ParentCard {
  id: string;
  title: string;
  color: CardColor;
  icon: any;
  topics: Topic[];
  attachments: string[];
}

interface Category {
  id: string;
  title: string;
  subtitle?: string;
  icon: any;
  cards: ParentCard[];
  type?: string;
}

interface Meeting {
  id: string;
  title: string;
  date: string;
  time: string;
  description: string;
  link: string;
  participants: string[];
}

type AgendaType = 'supplier' | 'idea' | 'influencer' | 'network';
interface AgendaItem {
  id: string;
  type: AgendaType;
  title: string;
  contact?: string;
  address?: string;
  description: string;
}

interface SiteOrder {
  id: string;
  title: string;
  customer: string;
  status: string;
  dueDate: string;
  attachments?: string[];
  notes?: string;
}

interface FinanceItem {
  id: string;
  name: string;
  tag: string;
  val: string;
  status: string;
  email?: string;
  phone?: string;
  notes?: string;
}

const USERS: Record<string, User> = {
  u1: { id: "u1", name: "Marco", avatar: "https://i.pravatar.cc/150?u=marco", role: "Diretor Estratégico" },
  u2: { id: "u2", name: "Rapha", avatar: "https://i.pravatar.cc/150?u=rapha", role: "Social Media & Conteúdo" },
  u3: { id: "u3", name: "Lipe", avatar: "https://i.pravatar.cc/150?u=lipe", role: "Gestor de Tráfego" },
};

const COLOR_MAP: Record<CardColor, { name: string; bg: string; border: string; text: string; hex: string }> = {
  red: { name: 'Urgente', bg: 'bg-red-500/10', border: 'border-red-500', text: 'text-red-400', hex: '#ef4444' },
  yellow: { name: 'Atenção', bg: 'bg-yellow-500/10', border: 'border-yellow-500', text: 'text-yellow-400', hex: '#eab308' },
  green: { name: 'Concluído', bg: 'bg-green-500/10', border: 'border-green-500', text: 'text-green-400', hex: '#22c55e' },
  blue: { name: 'Ideia', bg: 'bg-blue-500/10', border: 'border-blue-500', text: 'text-blue-400', hex: '#3b82f6' },
  purple: { name: 'Prioridade', bg: 'bg-purple-500/10', border: 'border-purple-500', text: 'text-purple-400', hex: '#a855f7' },
  orange: { name: 'Revisão', bg: 'bg-orange-500/10', border: 'border-orange-500', text: 'text-orange-400', hex: '#f97316' },
  pink: { name: 'Especial', bg: 'bg-pink-500/10', border: 'border-pink-500', text: 'text-pink-400', hex: '#ec4899' },
  default: { name: 'Padrão', bg: 'bg-[#18181b]/60', border: 'border-white/10', text: 'text-zinc-200', hex: '#52525b' }
};

const PRIORITY_MAP: Record<Priority, { label: string; color: string; bg: string; border: string }> = {
  high: { label: 'Urgente', color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30' },
  medium: { label: 'Atenção', color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/30' },
  low: { label: 'Média', color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/30' },
  urgent: { label: 'Urgente', color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30' },
};

const getInitialSubCard = (title: string, desc: string = "", status: CardStatus = 'todo', userId: string = "u1"): SubCard => ({
  id: `s_${Math.random().toString(36).substr(2, 9)}`,
  title,
  description: desc,
  status,
  priority: 'low',
  startDate: new Date().toISOString().split('T')[0],
  dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  progress: status === 'done' ? 100 : status === 'doing' ? 50 : status === 'alteracao' ? 30 : 0,
  comments: [],
  assignedTo: userId,
  pautas: []
});

const INITIAL_CATEGORIES: Category[] = [
  {
    id: "operacao",
    title: "Prioridades & Operação",
    subtitle: "Gestão de fluxo crítico, produção em BH e estrutura operacional global.",
    type: "dashboard",
    icon: AlertCircle,
    cards: [
      {
        id: "c1", title: "PRIORIDADE MÁXIMA", color: 'red', icon: AlertCircle, attachments: [],
        topics: [
          {
            id: "t1", title: "Foco BH & Produção", color: 'red', icon: FolderKanban,
            subCards: [
              getInitialSubCard("Definição de bordar em BH ou local", "Levantar custos, comparar logística e qualidade.", 'doing', 'u1'),
              getInitialSubCard("Estrutura de produção", "Definir capacidade diária, gargalos.", 'todo', 'u2'),
              getInitialSubCard("Logística Global", "Fluxo pedido → produção → envio.", 'todo', 'u1'),
            ]
          },
          {
            id: "t2", title: "Melhorias Processos", color: 'blue', icon: Settings,
            subCards: [
              getInitialSubCard("Otimizar design", "Reduzir tempo de aprovação.", 'todo', 'u2'),
            ]
          }
        ]
      },
      {
        id: "c2", title: "ESTRUTURA ORGANIZACIONAL", color: 'purple', icon: Users, attachments: [],
        topics: [
          {
            id: "t3", title: "Gestão de Equipe", color: 'purple', icon: Users,
            subCards: [
              getInitialSubCard("Definir responsáveis por área", "Marketing, Tráfego, Produção, etc.", 'done', 'u1'),
              getInitialSubCard("Criar fluxo operacional", "Entrada, produção, controle, entrega.", 'todo', 'u2'),
            ]
          }
        ]
      }
    ]
  },
  {
    id: "marketing",
    title: "Marketing",
    subtitle: "Estratégias de tráfego, social media e posicionamento de marca Pesarti.",
    type: "marketing",
    icon: Megaphone,
    cards: [
      {
        id: "c3", title: "ESTRATÉGIA DIGITAL", color: 'blue', icon: Megaphone, attachments: [],
        topics: [
          {
            id: "t4", title: "Redes Sociais", color: 'pink', icon: ImageIcon,
            subCards: [
              getInitialSubCard("Cronograma de postagens", "Foco no novo lançamento", 'todo', 'u2'),
            ]
          }
        ]
      }
    ]
  }
];

const INITIAL_MEETINGS: Meeting[] = [
  {
    id: "m1",
    title: "Alinhamento Semanal",
    date: "2026-03-24",
    time: "10:00",
    description: "Revisão de metas e gargalos da produção.",
    link: "https://meet.google.com/abc-defg-hij",
    participants: ["u1", "u2", "u3"]
  }
];

// --- COMPONENTES PRINCIPAIS ---



function DayBoardModal({ date, topic, onClose, onUpdate }: { date: string, topic: Topic, onClose: () => void, onUpdate: (t: Topic) => void }) {
  const events = CALENDAR_EVENTS_2026[date] || [];

  return (
    <div className="fixed inset-0 z-[160] flex items-center justify-center p-6">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/95 backdrop-blur-2xl" />
      <motion.div initial={{ scale: 0.9, y: 50, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} exit={{ scale: 0.9, y: 50, opacity: 0 }} className="relative w-[95vw] h-[90vh] bg-[#0d0d0f] border border-white/10 rounded-[60px] shadow-2xl overflow-hidden flex flex-col">
        <div className="p-10 border-b border-white/5 flex items-center justify-between bg-gradient-to-r from-blue-600/10 to-transparent">
          <div className="flex items-center gap-6">
            <div className="p-4 bg-blue-600 rounded-3xl shadow-xl shadow-blue-600/20 text-white">
              <Calendar size={28} />
            </div>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <span className="text-[10px] font-black text-blue-400 uppercase tracking-[0.3em]">Quadro Diário Pesarti</span>
                {events.map(e => (
                  <span key={e.title} className={`px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest text-white ${e.colorToken}`}>{e.title}</span>
                ))}
              </div>
              <h2 className="text-4xl font-black text-white tracking-widest uppercase">{date}</h2>
            </div>
          </div>
          <button onClick={onClose} className="p-5 bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white rounded-[32px] transition-all"><X size={32} /></button>
        </div>
        <div className="flex-1 p-10 overflow-hidden">
          <TrelloBoardView
            topic={topic}
            parentTitle="Planejamento Diário"
            onClose={onClose}
            onUpdate={onUpdate}
          />
        </div>
      </motion.div>
    </div>
  );
}

function CalendarView({ datedBoards, onDateClick, onClose }: { datedBoards: Record<string, Topic>, onDateClick: (d: string) => void, onClose: () => void }) {
  const months = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
  const daysOfWeek = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
  const year = 2026;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="max-w-[1600px] mx-auto py-10">
      <div className="flex items-center justify-between mb-16 px-4">
        <div>
          <h2 className="text-7xl font-black text-white tracking-tighter mb-4">Calendário 2026</h2>
          <p className="text-zinc-500 font-bold uppercase tracking-[0.3em] flex items-center gap-3">
            <span className="w-12 h-[2px] bg-blue-600"></span> Planejamento e Demandas Pesarti
          </p>
        </div>
        <button onClick={onClose} className="p-5 glass-panel rounded-full hover:bg-white/5 text-zinc-400 hover:text-white transition-all"><X size={36} /></button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-12 px-4">
        {months.map((month, mIdx) => {
          const firstDay = new Date(year, mIdx, 1).getDay();
          const daysInMonth = new Date(year, mIdx + 1, 0).getDate();

          return (
            <div key={month} className="glass-panel p-10 rounded-[50px] border border-white/5 bg-black/40 hover:border-blue-500/20 transition-all group/month shadow-2xl">
              <h3 className="text-2xl font-black text-white mb-8 flex justify-between items-center group-hover/month:text-blue-400 transition-colors uppercase tracking-widest">
                {month}
                <span className="text-xs text-zinc-700 font-bold">{year}</span>
              </h3>

              <div className="grid grid-cols-7 gap-3 mb-4">
                {daysOfWeek.map(d => <div key={d} className="text-[10px] font-black text-zinc-800 uppercase p-1 flex justify-center">{d}</div>)}
                {Array.from({ length: firstDay }).map((_, i) => <div key={`empty-${i}`} />)}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1;
                  const dateStr = `${year}-${(mIdx + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
                  const events = CALENDAR_EVENTS_2026[dateStr] || [];
                  const mainEvent = events.find(e => e.priority === 'high') || events[0];
                  const hasTasks = (datedBoards[dateStr]?.subCards.length || 0) > 0;

                  return (
                    <button
                      key={day}
                      onClick={() => onDateClick(dateStr)}
                      className={`aspect-square rounded-2xl flex flex-col items-center justify-center text-xs font-black transition-all relative group/day border ${mainEvent
                        ? `${mainEvent.colorToken} text-white border-transparent scale-110 z-10 shadow-[0_0_20px_rgba(37,99,235,0.3)] ring-2 ring-white/20`
                        : 'bg-white/5 text-zinc-600 border-white/5 hover:border-blue-500/40 hover:text-white hover:scale-110 active:scale-95'
                        }`}
                    >
                      <span className={mainEvent ? 'text-lg brightness-125' : ''}>{day}</span>

                      {hasTasks && (
                        <div className="absolute -top-1 -left-1 w-3 h-3 bg-blue-600 rounded-full border-2 border-[#111] animate-pulse" />
                      )}

                      {events.length > 0 && !mainEvent && (
                        <div className="absolute inset-0 bg-blue-500/10 rounded-2xl border border-blue-500/20" />
                      )}

                      {events.length > 1 && (
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-white text-black rounded-lg flex items-center justify-center text-[8px] font-black shadow-lg">
                          +{events.length - 1}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="space-y-2 mt-8 border-t border-white/5 pt-6">
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1;
                  const dateStr = `${year}-${(mIdx + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
                  const events = CALENDAR_EVENTS_2026[dateStr] || [];
                  const hasTasks = (datedBoards[dateStr]?.subCards.length || 0) > 0;

                  return (
                    <div key={dateStr}>
                      {events.map(e => (
                        <div key={e.title} className="flex items-center gap-3 text-[9px] font-black uppercase tracking-wider mb-1 px-2 py-1 rounded-lg bg-white/5">
                          <div className={`w-2 h-2 rounded-full ${e.colorToken} shadow-[0_0_8px_currentColor]`}></div>
                          <span className="text-zinc-400 w-4">{day}</span>
                          <span className="truncate text-zinc-300">{e.title}</span>
                        </div>
                      ))}
                      {hasTasks && events.length === 0 && (
                        <div className="flex items-center gap-3 text-[9px] font-black uppercase tracking-wider mb-1 px-2 py-1 rounded-lg bg-blue-600/10 border border-blue-500/10">
                          <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]"></div>
                          <span className="text-zinc-400 w-4">{day}</span>
                          <span className="truncate text-blue-400">Demandas Ativas</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}

export default function PesartiBoard() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [activeCardId, setActiveCardId] = useState<string | null>(null);
  const [activeTopicId, setActiveTopicId] = useState<string | null>(null);
  const [sidebarFilter, setSidebarFilter] = useState<string | null>(null);
  const [selectedUserReport, setSelectedUserReport] = useState<string | null>(null);
  const [globalChatOpen, setGlobalChatOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'board' | 'meetings' | 'agenda' | 'orders' | 'calendar' | 'brainstorm' | 'financeiro' | 'lembretes'>('board');
  const [meetingModalOpen, setMeetingModalOpen] = useState(false);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [agendaItems, setAgendaItems] = useState<AgendaItem[]>([]);
  const [siteOrders, setSiteOrders] = useState<SiteOrder[]>([]);
  const [chatMessages, setChatMessages] = useState<BoardChatMessage[]>([
    { id: "msg1", userId: "u1", text: "Bem-vindos à nova Pesarti Board!", timestamp: "09:00" }
  ]);
  const [datedBoards, setDatedBoards] = useState<Record<string, Topic>>({});
  const [brainstormMaps, setBrainstormMaps] = useState<BrainstormMap[]>([]);
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  // --- DATA SYNC LOGIC ---
  const fetchData = async () => {
    setIsSyncing(true);
    try {
      // 1. Categories
      const { data: cats } = await supabase.from('pesarti_categories').select('*').order('created_at', { ascending: true });
      if (cats && cats.length > 0) {
        setCategories(cats.map((c: any) => ({
          ...c,
          icon: ICON_MAP[c.icon] || FolderKanban
        })));
      }

      // 2. Meetings
      const { data: meets } = await supabase.from('pesarti_meetings').select('*').order('date', { ascending: true });
      if (meets) setMeetings(meets);

      // 3. Chat
      const { data: msgs } = await supabase.from('pesarti_chat').select('*').order('created_at', { ascending: true });
      if (msgs) {
        setChatMessages(msgs.map((m: any) => ({
          id: m.id,
          userId: m.user_id,
          text: m.text,
          timestamp: m.timestamp,
          targetCardId: m.target_card_id
        })));
      }

      // 4. Brainstorm
      const { data: maps } = await supabase.from('pesarti_brainstorm').select('*').order('created_at', { ascending: true });
      if (maps) setBrainstormMaps(maps);

      // 5. Site Orders
      const { data: sOrders } = await supabase.from('site_orders').select('*').order('due_date', { ascending: true });
      if (sOrders) setSiteOrders(sOrders);

      // 6. Finance
      const { data: fItems } = await supabase.from('pesarti_finance').select('*').order('created_at', { ascending: true });
      if (fItems) setFinanceItems(fItems);

    } catch (e) {
      console.error("Erro ao sincronizar dados:", e);
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab]); // Recarrega ao trocar de aba para garantir frescor
  const [homeViewMode, setHomeViewMode] = useState<'grid' | 'list'>('grid');
  const [sidebarMode, setSidebarMode] = useState<'expanded' | 'collapsed' | 'hidden'>('expanded');
  const [financeItems, setFinanceItems] = useState<FinanceItem[]>([]);
  const [currentUserAvatar, setCurrentUserAvatar] = useState<string>("https://i.pravatar.cc/150?u=marco");
  const [currentUserRole, setCurrentUserRole] = useState<string>("viewer");

  // Brainstorm Map specific mode
  const [activeBrainstormMapId, setActiveBrainstormMapId] = useState<string | null>(null);

  // --- AI ASSISTANT STATE ---
  const [isAiPanelOpen, setIsAiPanelOpen] = useState(false);
  const [aiKey, setAiKey] = useState("");
  const [aiMessages, setAiMessages] = useState<{role: 'user'|'model', text: string}[]>([]);
  const [aiInput, setAiInput] = useState("");
  
  // --- AUTH CHECKER ---
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        window.location.href = '/login';
        return;
      }
      
      // Checagem Real de Aprovação da Agência
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_approved')
        .eq('id', session.user.id)
        .single();
        
      if (!profile?.is_approved) {
        alert("Seu acesso ainda está sendo validado pela Pesarti. Você será avisado por e-mail!");
        await supabase.auth.signOut();
        window.location.href = '/login';
      }
    };
    
    checkAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!session) {
        window.location.href = '/login';
      }
    });

    return () => subscription.unsubscribe();
  }, []);
  const [isAiTyping, setIsAiTyping] = useState(false);
  
  useEffect(() => {
    const savedKey = localStorage.getItem('pesarti_ai_key');
    if(savedKey) setAiKey(savedKey);
  }, []);

  const handleSaveAiKey = (key: string) => {
    localStorage.setItem('pesarti_ai_key', key);
    setAiKey(key);
  };

  useEffect(() => {
    if (activeTab === 'brainstorm' && activeBrainstormMapId) {
      setSidebarMode('collapsed');
    } else {
      setSidebarMode('expanded');
    }
  }, [activeTab, activeBrainstormMapId]);

  useEffect(() => {
    const userJson = localStorage.getItem('pesarti_currentUser');
    if (userJson) {
      try {
        const u = JSON.parse(userJson);
        if (u.role) setCurrentUserRole(u.role);
        if (u.avatar) {
          setCurrentUserAvatar(u.avatar);
          // Força a atualização no objeto global para os chats e interações
          if (USERS['u1']) {
            USERS['u1'].avatar = u.avatar;
            USERS['u1'].name = u.name || USERS['u1'].name;
          }
        }
      } catch (e) {}
    }
  }, []);

  // --- SINCRONISMO REAL-TIME GLOBALE ---
  useEffect(() => {
    // 1. Escutar Categorias/Board
    const channelCat = supabase.channel('realtime_categories')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pesarti_categories' }, async () => {
         const { data } = await supabase.from('pesarti_categories').select('*');
         if (data) {
           const parsed = data.map((cat: any) => ({
             ...cat,
             icon: ICON_MAP[cat.icon] || FolderKanban
           }));
           setCategories(parsed);
         }
      }).subscribe();

    // 2. Escutar Reuniões
    const channelMeet = supabase.channel('realtime_meetings')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pesarti_meetings' }, async () => {
         const { data } = await supabase.from('pesarti_meetings').select('*');
         if (data) setMeetings(data);
      }).subscribe();

    // 3. Escutar Chat Geral
    const channelChat = supabase.channel('realtime_chat')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'pesarti_chat' }, (payload) => {
         const newMsg = {
           id: payload.new.id,
           userId: payload.new.user_id, // Mapeando de volta p/ camelCase
           text: payload.new.text,
           timestamp: payload.new.timestamp,
           targetCardId: payload.new.target_card_id
         };
         setChatMessages(prev => {
            if (prev.find(m => m.id === newMsg.id)) return prev;
            return [...prev, newMsg as BoardChatMessage];
         });
      }).subscribe();

    // 4. Escutar Pedidos Site
    const channelOrders = supabase.channel('realtime_orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'site_orders' }, async () => {
         const { data } = await supabase.from('site_orders').select('*');
         if (data) setSiteOrders(data);
      }).subscribe();

    // 5. Escutar Financeiro
    const channelFinance = supabase.channel('realtime_finance')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pesarti_finance' }, async () => {
         const { data } = await supabase.from('pesarti_finance').select('*');
         if (data) setFinanceItems(data);
      }).subscribe();

    // 6. Escutar Lembretes
    const channelReminders = supabase.channel('realtime_reminders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pesarti_reminders' }, async () => {
         const { data } = await supabase.from('pesarti_reminders').select('*');
         if (data) setReminders(data);
      }).subscribe();

    return () => {
      supabase.removeChannel(channelCat);
      supabase.removeChannel(channelMeet);
      supabase.removeChannel(channelChat);
      supabase.removeChannel(channelOrders);
      supabase.removeChannel(channelFinance);
      supabase.removeChannel(channelReminders);
    };
  }, []);

  const currentCategories = categories;

  const visibleCategories = useMemo(() => {
    if (!sidebarFilter) return currentCategories;
    return currentCategories.filter(cat => cat.id === sidebarFilter);
  }, [currentCategories, sidebarFilter]);

  let activeCard: ParentCard | null = null;
  let activeTopic: Topic | null = null;
  let activeCategory: Category | null = null;

  if (activeCardId) {
    for (const cat of currentCategories) {
      const card = cat.cards.find(c => c.id === activeCardId);
      if (card) {
        activeCard = card;
        activeCategory = cat;
        if (activeTopicId) {
          activeTopic = card.topics.find(t => t.id === activeTopicId) || null;
        }
        break;
      }
    }
  }

  const handleUpdateCategories = async (updated: Category[]) => {
    setCategories(updated);
    // Persistência Ativa
    for (const cat of updated) {
       const iconName = Object.keys(ICON_MAP).find(key => ICON_MAP[key] === cat.icon) || (typeof cat.icon === 'string' ? cat.icon : 'FolderKanban');
       await supabase.from('pesarti_categories').upsert({
          id: cat.id,
          title: cat.title,
          icon: iconName,
          cards: cat.cards,
          type: cat.type
       });
    }
  };

  const handleUpdateDateTopic = (date: string, updatedTopic: Topic) => {
    setDatedBoards(prev => ({ ...prev, [date]: updatedTopic }));
  };

  const handleOpenCard = (cardId: string) => {
    setActiveCardId(cardId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAddCategory = (template: { title: string, icon: any }) => {
    const newCat: Category = {
      id: `cat_${Date.now()}`,
      title: template.title,
      icon: template.icon,
      cards: [],
      type: template.title.toLowerCase()
    };
    handleUpdateCategories([...currentCategories, newCat]);
    setCategoryModalOpen(false);
  };

  const deleteCategory = async (id: string) => {
    if (confirm("Deseja excluir esta categoria inteira?")) {
      const updated = currentCategories.filter(c => c.id !== id);
      setCategories(updated);
      await supabase.from('pesarti_categories').delete().eq('id', id);
    }
  };

  const getOverallProgress = () => {
    let total = 0;
    let completed = 0;
    categories.forEach(cat => cat.cards.forEach(card => card.topics.forEach(topic => topic.subCards.forEach(sub => {
      total++;
      if (sub.status === 'done') completed++;
    }))));
    return total === 0 ? 0 : Math.round((completed / total) * 100);
  };

  const getCategoryProgress = (cat: Category) => {
    let total = 0;
    let completed = 0;
    cat.cards.forEach(card => card.topics.forEach(topic => topic.subCards.forEach(sub => {
      total++;
      if (sub.status === 'done') completed++;
    })));
    return total === 0 ? 0 : Math.round((completed / total) * 100);
  };

  const handleSendMessage = async (text: string) => {
    const msgId = Date.now().toString();
    const timestamp = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    if (text.startsWith('/card ')) {
      const parts = text.split(' ');
      const cardTitleSearch = parts[1]?.toLowerCase();
      const cardText = parts.slice(2).join(' ');

      let targetParentCard: ParentCard | null = null;
      let targetCat: Category | null = null;
      let targetTopic: Topic | null = null;

      for (const cat of currentCategories) {
        for (const card of cat.cards) {
          const topic = card.topics.find(t => t.title.toLowerCase().includes(cardTitleSearch));
          if (topic) {
            targetTopic = topic;
            targetParentCard = card;
            targetCat = cat;
            break;
          }
        }
        if (targetTopic) break;
      }

      if (targetTopic && targetParentCard && targetCat) {
        const newSub = getInitialSubCard(cardText, "Via chat", 'todo', 'u1');
        const updatedCats = currentCategories.map(c => {
          if (c.id === targetCat!.id) {
            return {
              ...c,
              cards: c.cards.map(pc => pc.id === targetParentCard!.id ? {
                ...pc,
                topics: pc.topics.map(t => t.id === targetTopic!.id ? { ...t, subCards: [...t.subCards, newSub] } : t)
              } : pc)
            };
          }
          return c;
        });
        handleUpdateCategories(updatedCats);
        setChatMessages(prev => [...prev, { id: msgId, userId: 'u1', text: `✅ Demanda "${cardText}" em ${targetTopic!.title}`, timestamp, targetCardId: targetParentCard!.id }]);
        return;
      }
    }
    const newMsg = { id: msgId, userId: 'u1', text, timestamp };
    const msgToDb = { 
      id: msgId, 
      user_id: 'u1', 
      text, 
      timestamp, 
      target_card_id: (newMsg as any).targetCardId || null 
    };
    setChatMessages(prev => [...prev, newMsg]);
    await supabase.from('pesarti_chat').insert([msgToDb]);
  };

  const handleSendAiPrompt = async () => {
    if (!aiInput.trim()) return;
    if (!aiKey) {
       alert("Configure a API Key do Google AI Studio primeiro!");
       return;
    }
    const userText = aiInput;
    setAiInput("");
    setAiMessages(prev => [...prev, { role: 'user', text: userText }]);
    setIsAiTyping(true);

    try {
      // Busca a lista oficial e atualizada de IA's que a chave dele suporta direto do servidor do Google
      const getModelsRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${aiKey}`);
      if (!getModelsRes.ok) {
        throw new Error("Sua chave foi negada pelo Google. Tente gerar uma nova chave no AI Studio.");
      }
      const modelsData = await getModelsRes.json();
      
      // Filtra o primeiro modelo inteligente robusto para Chat (Geralmente o gemini mais novo diponível para ele)
      const validModel = modelsData.models.find((m: any) => 
        m.supportedGenerationMethods?.includes("generateContent") && 
        m.name.includes("gemini")
      );
      
      if (!validModel) {
        throw new Error("O Google não liberou nenhum modelo Gemini para esta credencial.");
      }
      
      const dynamicModelName = validModel.name.replace('models/', '');
      
      const genAI = new GoogleGenerativeAI(aiKey);
      const model = genAI.getGenerativeModel({ model: dynamicModelName });
      
      let systemContext = `O usuário é ${USERS['u1'].name || 'um profissional'} de uma agência de marketing chamada Pesarti. Focado em resultados ágeis. `;
      if (activeTab === 'board') systemContext += `No momento ele(a) está de olho no Trello Geral com ${categories.length} categorias. `;
      if (activeTab === 'financeiro') systemContext += `No momento ele(a) está na tela de CRM Financeiro da agência. `;
      if (activeTab === 'brainstorm') systemContext += `No momento ele(a) está num Brainstorm estruturando ideias. `;
      
      const prompt = `[CONTEXTO DO SISTEMA: ${systemContext}]\n\nPor favor atue como o Copiloto Pesarti AI, experiente em Copywriting, Tráfego e Estratégia. Responda o que foi pedido e cite qual modelo você é usando a variavel de sistema informada a seguir. \n[AVISO DE SISTEMA: Você é o modelo ${dynamicModelName}]\nO usuário diz: ${userText}`;
      
      const result = await model.generateContent(prompt);
      const response = await result.response;
      let text = response.text();
      
      setAiMessages(prev => [...prev, { role: 'model', text }]);

    } catch (e: any) {
      setAiMessages(prev => [...prev, { role: 'model', text: `Desculpe, ocorreu um erro na API: ${e.message}` }]);
    } finally {
      setIsAiTyping(false);
    }
  };

  const addOrUpdateMeeting = async (meeting: Meeting) => {
    if (meetings.find(m => m.id === meeting.id)) {
      setMeetings(meetings.map(m => m.id === meeting.id ? meeting : m));
    } else {
      setMeetings([...meetings, meeting]);
    }
    await supabase.from('pesarti_meetings').upsert(meeting);
    setMeetingModalOpen(false);
  };

  const deleteMeeting = async (id: string) => {
    if (confirm("Excluir reunião?")) {
      setMeetings(meetings.filter(m => m.id !== id));
      await supabase.from('pesarti_meetings').delete().eq('id', id);
    }
  };

  return (
    <div className="flex h-screen w-full bg-[#09090b] text-zinc-100 overflow-hidden font-sans relative">
      
      {/* Overlay Mobile con Blur */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-md z-[250] md:hidden" 
            onClick={() => setIsMobileMenuOpen(false)} 
          />
        )}
      </AnimatePresence>
      
      {/* Sidebar Drawer para Mobile e Sidebar Fixa para Desktop */}
      <div className={`
        fixed md:relative z-[300] h-full 
        transition-all duration-500 bg-[#09090b] border-r border-white/5
        ${isMobileMenuOpen ? 'translate-x-0 w-[85%] sm:w-[350px] shadow-[20px_0_100px_rgba(0,0,0,0.8)]' : '-translate-x-full md:translate-x-0 md:w-auto'}
      `}>
        <Sidebar
          categories={categories}
          activeFilter={sidebarFilter}
          onSelectFilter={(f) => { 
            setSidebarFilter(f); 
            setActiveCardId(null); 
            setActiveTopicId(null); 
            setActiveTab('board'); 
            setIsMobileMenuOpen(false); 
          }}
          activeTab={activeTab}
          onSelectTab={(t: any) => { 
            if (t === 'ai_panel') {
                setIsAiPanelOpen(true);
                setIsMobileMenuOpen(false);
                return;
            }
            setActiveTab(t); 
            setIsMobileMenuOpen(false); 
            setActiveCardId(null); 
            // Só limpa o filtro se estiver trocando para abas que NÃO são o quadro principal
            if (t !== 'board') setSidebarFilter(null);
          }}
          mode={isMobileMenuOpen ? 'expanded' : sidebarMode}
          onToggleMode={setSidebarMode}
          userRole={currentUserRole}
        />
      </div>

      <div className="flex-1 flex flex-col h-full relative z-0 overflow-hidden w-full">
        <header className="px-4 md:px-8 py-5 flex flex-shrink-0 justify-between items-center z-10 border-b border-white/5 bg-[#09090b]/80 backdrop-blur-md sticky top-0">
          <div className="flex items-center gap-3 md:gap-4 overflow-hidden">
            <button 
              onClick={() => setIsMobileMenuOpen(true)} 
              className="md:hidden p-3 bg-white/5 rounded-2xl text-zinc-400 border border-white/10 hover:text-white active:scale-95 shrink-0 shadow-lg"
            >
              <LayoutDashboard size={22} />
            </button>
            
            {/* TÍTULO E NAVEGAÇÃO DINÂMICA */}
            {(sidebarFilter || activeTab !== 'board' || activeCardId) ? (
              <div className="flex flex-col">
                <button 
                  onClick={() => {
                    setSidebarFilter(null);
                    setActiveTab('board');
                    setActiveCardId(null);
                    setActiveTopicId(null);
                  }}
                  className="flex items-center gap-2 text-white active:scale-95 transition-all"
                >
                  <ArrowLeft size={18} className="text-blue-500" />
                  <div className="flex flex-col">
                    <span className="text-[9px] font-black uppercase text-blue-500 tracking-[0.3em]">Home</span>
                    <h2 className="text-sm font-black uppercase tracking-widest text-white -mt-1">
                      {sidebarFilter ? categories.find(c => c.id === sidebarFilter)?.title : activeTab.toUpperCase()}
                    </h2>
                  </div>
                </button>
              </div>
            ) : (
              <div className="flex flex-col">
                 <h1 className="text-xl font-bold text-white flex items-center gap-3 cursor-pointer" onClick={() => { setSidebarFilter(null); setActiveCardId(null); setActiveTopicId(null); setActiveTab('board'); setSelectedCalendarDate(null); }}>
                   <span>PESARTI</span>
                 </h1>
                 <span className="text-[8px] font-black text-zinc-600 uppercase tracking-[0.4em]">Internal CRM v2.6</span>
              </div>
            )}
            
            <button 
              onClick={() => setCategoryModalOpen(true)} 
              className="ml-auto px-4 py-3 bg-indigo-600/20 border border-indigo-500/40 text-indigo-400 rounded-2xl text-[10px] font-black uppercase tracking-widest active:scale-95 shrink-0"
            >
               + Área
            </button>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Link href="/profile" className="transition-transform hover:scale-110 active:scale-95 group shrink-0">
                <img src={currentUserAvatar} className="w-8 h-8 md:w-10 md:h-10 rounded-full border-2 border-[#09090b] shadow-lg ring-2 ring-transparent group-hover:ring-indigo-500 transition-all" title="Editar Meu Perfil" />
              </Link>

              <Link href="/login" className="hidden md:flex items-center justify-center p-2 rounded-xl text-red-500/70 hover:text-red-400 hover:bg-red-500/10 transition-colors" title="Sair do Sistema">
                <LogOut size={18} />
              </Link>
            </div>
            <button
              onClick={() => setIsAiPanelOpen(true)}
              className="md:hidden p-3 bg-fuchsia-600/20 border border-fuchsia-500/40 text-fuchsia-400 rounded-2xl active:scale-95 transition-all"
            >
              <Sparkles size={20} className="animate-pulse" />
            </button>
            
            <button
              onClick={() => setIsAiPanelOpen(true)}
              className="hidden lg:flex items-center gap-2 bg-fuchsia-600/10 hover:bg-fuchsia-600 px-4 py-2.5 rounded-2xl text-[10px] font-black border border-fuchsia-500/30 transition-all text-fuchsia-400 hover:text-white uppercase tracking-[0.2em] shadow-[0_0_15px_rgba(217,70,239,0.2)] group"
            >
              <Sparkles size={14} className="group-hover:scale-110 transition-transform animate-pulse" /> Chat Ia
            </button>
            <button
              onClick={() => setActiveTab('calendar')}
              className="hidden lg:flex items-center gap-2 bg-orange-500/10 hover:bg-orange-600 px-4 py-2.5 rounded-2xl text-[10px] font-black border border-orange-500/20 transition-all text-orange-400 hover:text-white uppercase tracking-[0.2em] shadow-lg shadow-orange-600/5 group"
            >
              <Calendar size={14} className="group-hover:scale-110 transition-transform" /> Calendário
            </button>
            <button
              onClick={() => setActiveTab('brainstorm')}
              className="hidden lg:flex items-center gap-2 bg-indigo-600/10 hover:bg-indigo-600 px-4 py-2.5 rounded-2xl text-[10px] font-black border border-indigo-500/20 transition-all text-indigo-400 hover:text-white uppercase tracking-[0.2em] shadow-lg shadow-indigo-600/5 group"
            >
              <Lightbulb size={14} className="group-hover:scale-110 transition-transform" /> Brainstorm
            </button>
            <button
              onClick={() => setMeetingModalOpen(true)}
              className="hidden sm:flex items-center gap-2 bg-white/5 hover:bg-white/10 px-4 py-2.5 rounded-2xl text-[10px] font-bold border border-white/10 transition-all text-zinc-300 hover:text-white uppercase tracking-widest"
            >
              <Video size={14} /> Agendar Reunião
            </button>
          </div>
        </header>

        <AnimatePresence>
          {selectedCalendarDate && (
            <DayBoardModal
              date={selectedCalendarDate}
              topic={datedBoards[selectedCalendarDate] || { id: `day_${selectedCalendarDate}`, title: `Planejamento`, color: 'blue', icon: Calendar, subCards: [] }}
              onClose={() => setSelectedCalendarDate(null)}
              onUpdate={(updated) => handleUpdateDateTopic(selectedCalendarDate, updated)}
            />
          )}
        </AnimatePresence>

        <div className="flex-1 flex overflow-hidden relative">
          <main className="flex-1 overflow-y-auto overflow-x-hidden p-8 pb-24 relative scroll-smooth">
            <AnimatePresence mode="wait">
              {activeTab === 'brainstorm' ? (
                <BrainstormModule
                  maps={brainstormMaps}
                  onSaveMaps={async (updated: BrainstormMap[]) => {
                    setBrainstormMaps(updated);
                    for(const m of updated) await supabase.from('pesarti_brainstorm').upsert({
                      id: m.id,
                      title: m.title,
                      nodes: m.nodes,
                      chatMessages: m.chatMessages
                    });
                  }}
                  activeMapId={activeBrainstormMapId}
                  setActiveMapId={setActiveBrainstormMapId}
                  sidebarMode={sidebarMode}
                  setSidebarMode={setSidebarMode}
                />
              ) : activeTab === 'calendar' ? (
                <CalendarView
                  datedBoards={datedBoards}
                  onDateClick={(date) => setSelectedCalendarDate(date)}
                  onClose={() => setActiveTab('board')}
                />
              ) : activeTab === 'meetings' ? (
                <MeetingsView meetings={meetings} onAdd={() => setMeetingModalOpen(true)} onDelete={deleteMeeting} />
              ) : activeTab === 'financeiro' ? (
                <FinanceView items={financeItems} onUpdate={async (updated) => { 
                  setFinanceItems(updated); 
                  for(const it of updated) await supabase.from('pesarti_finance').upsert(it);
                }} onDelete={async (id) => {
                  setFinanceItems(financeItems.filter(i => i.id !== id));
                  await supabase.from('pesarti_finance').delete().eq('id', id);
                }} />
              ) : activeTab === 'lembretes' ? (
                <RemindersView />
              ) : activeTab === 'orders' ? (
                <SiteOrdersBoard orders={siteOrders} onUpdate={setSiteOrders} />
              ) : !activeCardId ? (
                <motion.div key="home" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className={sidebarFilter ? "max-w-7xl mx-auto w-full" : "max-w-[1800px] mx-auto w-full"}>
                  {!sidebarFilter ? (
                     <GamifiedDashboardHome categories={categories} users={USERS} meetings={meetings} messages={chatMessages} onSendMessage={handleSendMessage} />
                  ) : (
                     <>
                       <div className="flex flex-col md:flex-row items-center justify-between mb-12 gap-6">
                         <div>
                           <h2 className="text-2xl font-bold flex items-center gap-3">
                        {sidebarFilter ? `Visualizando: ${categories.find(c => c.id === sidebarFilter)?.title || ""}` : "Unidade Central Pesarti"}
                      </h2>
                    </div>

                    <div className="flex items-center gap-4">
                      {/* View Switcher */}
                      <div className="flex bg-white/5 rounded-2xl p-1 border border-white/5 shadow-xl">
                        <button
                          onClick={() => setHomeViewMode('grid')}
                          className={`flex items-center gap-3 px-6 py-2.5 rounded-xl transition-all ${homeViewMode === 'grid' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-zinc-500 hover:text-white'}`}
                        >
                          <Layout size={16} />
                          <span className="text-[10px] font-black uppercase tracking-widest">Padrão</span>
                        </button>
                        <button
                          onClick={() => setHomeViewMode('list')}
                          className={`flex items-center gap-3 px-6 py-2.5 rounded-xl transition-all ${homeViewMode === 'list' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-zinc-500 hover:text-white'}`}
                        >
                          <List size={16} />
                          <span className="text-[10px] font-black uppercase tracking-widest">Lista</span>
                        </button>
                      </div>

                      <button
                        onClick={() => setActiveTab('calendar')}
                        className="flex items-center gap-3 bg-white/5 hover:bg-white/10 px-8 py-3 rounded-2xl text-xs font-bold border border-white/10 transition-all text-blue-400 hover:text-white uppercase tracking-[0.2em] shadow-2xl"
                      >
                        <Calendar size={18} /> Calendário
                      </button>
                      <button onClick={() => setCategoryModalOpen(true)} className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 px-6 py-3 rounded-2xl text-xs font-bold shadow-xl shadow-blue-500/10 transition-all active:scale-95">
                        <Plus size={16} /> Criar Categoria
                      </button>
                    </div>
                  </div>

                  <div className="space-y-24">
                    {homeViewMode === 'grid' ? (
                      <>
                        {/* Operações Estratégicas */}
                        {visibleCategories.filter(c => c.type === 'dashboard').length > 0 && (
                          <div>
                            <div className="flex items-center gap-4 mb-12 opacity-40">
                              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-500 whitespace-nowrap">01. Núcleo Estratégico</span>
                              <div className="h-[1px] w-full bg-indigo-500/20"></div>
                            </div>
                            <div className="space-y-20">
                              {visibleCategories.filter(c => c.type === 'dashboard').map(cat => (
                                <CategorySection
                                  key={cat.id}
                                  category={cat}
                                  onOpenCard={handleOpenCard}
                                  onUpdate={(updated) => handleUpdateCategories(currentCategories.map(c => c.id === updated.id ? updated : c))}
                                  onDelete={() => deleteCategory(cat.id)}
                                />
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Departamentos e Projetos */}
                        {visibleCategories.filter(c => c.type !== 'dashboard').length > 0 && (
                          <div>
                            <div className="flex items-center gap-4 mb-12 opacity-40">
                              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-500 whitespace-nowrap">02. Unidades & Operação</span>
                              <div className="h-[1px] w-full bg-white/10"></div>
                            </div>
                            <div className="space-y-20">
                              {visibleCategories.filter(c => c.type !== 'dashboard').map(cat => (
                                <CategorySection
                                  key={cat.id}
                                  category={cat}
                                  onOpenCard={handleOpenCard}
                                  onUpdate={(updated) => handleUpdateCategories(currentCategories.map(c => c.id === updated.id ? updated : c))}
                                  onDelete={() => deleteCategory(cat.id)}
                                />
                              ))}
                            </div>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="bg-white/5 rounded-[40px] border border-white/5 overflow-hidden backdrop-blur-3xl">
                        <table className="w-full text-left">
                          <thead>
                            <tr className="border-b border-white/5 bg-white/5">
                              <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-zinc-500">Unidade</th>
                              <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-zinc-500 text-center">Progresso</th>
                              <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-zinc-500 text-center">Quadros</th>
                              <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-zinc-500 text-right">Ação</th>
                            </tr>
                          </thead>
                          <tbody>
                            {visibleCategories.map(cat => {
                              const prog = getCategoryProgress(cat);
                              return (
                                <tr key={cat.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors group">
                                  <td className="px-8 py-8 flex items-center gap-6">
                                    <div className="p-4 rounded-2xl bg-white/5 text-indigo-400 group-hover:scale-110 transition-transform"><cat.icon size={20} /></div>
                                    <span className="text-xl font-black text-white">{cat.title}</span>
                                  </td>
                                  <td className="px-8 py-8">
                                    <div className="flex items-center gap-4 justify-center">
                                      <div className="w-40 h-1.5 bg-black/40 rounded-full overflow-hidden">
                                        <div className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full shadow-[0_0_10px_rgba(79,70,229,0.3)]" style={{ width: `${prog}%` }} />
                                      </div>
                                      <span className="text-xs font-bold text-white w-8">{prog}%</span>
                                    </div>
                                  </td>
                                  <td className="px-8 py-8 text-center text-zinc-500 font-bold">{cat.cards.length} Dashboards</td>
                                  <td className="px-8 py-8 text-right">
                                    <button
                                      onClick={() => setSidebarFilter(cat.id)}
                                      className="px-6 py-2.5 rounded-full bg-white/5 hover:bg-indigo-600 text-xs font-black uppercase tracking-[0.2em] transition-all border border-white/5 hover:scale-105 active:scale-95"
                                    >
                                      Acessar
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                 </>
                )}
                </motion.div>
              ) : !activeTopicId ? (
                <SubTopicGrid
                  parentCard={activeCard!}
                  onClose={() => setActiveCardId(null)}
                  onSelectTopic={setActiveTopicId}
                  onUpdate={(updated) => {
                    handleUpdateCategories(categories.map(cat => ({
                      ...cat,
                      cards: cat.cards.map(c => c.id === updated.id ? updated : c)
                    })));
                  }}
                />
              ) : (
                <TrelloBoardView
                  topic={activeTopic!}
                  parentTitle={activeCard!.title}
                  onClose={() => setActiveTopicId(null)}
                  onUpdate={(updated) => {
                    handleUpdateCategories(currentCategories.map(cat => ({
                      ...cat,
                      cards: cat.cards.map(c => c.id === activeCard!.id ? {
                        ...c,
                        topics: c.topics.map(t => t.id === updated.id ? updated : t)
                      } : c)
                    })));
                  }}
                />
              )}
            </AnimatePresence>
          </main>

          {/* Floating Home Chat Button & Panel */}
          {!activeCardId && activeTab === 'board' && (
            <>
              <AnimatePresence>
                {globalChatOpen && (
                  <div className="fixed right-10 bottom-32 z-[100]">
                    <GlobalChatPanel
                      messages={chatMessages}
                      onSendMessage={handleSendMessage}
                      onClose={() => setGlobalChatOpen(false)}
                    />
                  </div>
                )}
              </AnimatePresence>
              <button
                onClick={() => setGlobalChatOpen(!globalChatOpen)}
                className={`fixed right-10 bottom-10 p-6 rounded-full shadow-2xl transition-all z-[110] group active:scale-95 ${globalChatOpen ? 'bg-zinc-800 text-white translate-y-[-10px]' : 'bg-purple-600 text-white hover:bg-purple-500'}`}
              >
                {globalChatOpen ? <X size={28} /> : <MessageSquare size={28} className="group-hover:scale-110 transition-transform" />}
              </button>
            </>
          )}
        </div>
      </div>

      {/* --- SIDE-PANEL AI ASSISTANT --- */}
      <AnimatePresence>
        {isAiPanelOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsAiPanelOpen(false)} className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[200]" />
            <motion.div 
               initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }}
               className="fixed top-0 right-0 w-[450px] max-w-[90vw] h-full bg-[#0d0d0f] border-l border-white/10 shadow-[0_0_50px_rgba(217,70,239,0.1)] z-[201] flex flex-col"
            >
               <div className="p-6 border-b border-white/5 flex items-center justify-between shadow-2xl z-10">
                  <div className="flex items-center gap-4">
                     <div className="w-12 h-12 bg-gradient-to-br from-fuchsia-600 to-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-fuchsia-600/20">
                        <Sparkles size={24} />
                     </div>
                     <div>
                        <h3 className="text-lg font-black text-white leading-tight">Pesarti AI</h3>
                        <p className="text-[10px] font-bold text-fuchsia-400 uppercase tracking-widest flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span> Google Gemini API</p>
                     </div>
                  </div>
                  <button onClick={() => setIsAiPanelOpen(false)} className="p-3 bg-white/5 hover:bg-white/10 rounded-xl text-zinc-400 hover:text-white transition-all"><X size={20}/></button>
               </div>

               {!aiKey ? (
                  <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-fuchsia-500/5">
                     <div className="w-20 h-20 bg-fuchsia-500/10 rounded-full flex items-center justify-center text-fuchsia-500 mb-6 border border-fuchsia-500/30">
                        <Key size={32} />
                     </div>
                     <h4 className="text-xl font-black text-white mb-2">Conecte sua Inteligência</h4>
                     <p className="text-sm text-zinc-400 mb-8 max-w-xs">Para conversar e ativar a memória contextuada da agência, conecte sua chave grátis do Google AI Studio.</p>
                     
                     <input type="password" id="pesarti_ai_key_input" placeholder="Cole a API Key..." className="w-full bg-black/60 border border-white/10 rounded-2xl p-4 text-white outline-none focus:border-fuchsia-500 mb-4 font-mono text-xs" />
                     <button onClick={() => {
                       const val = (document.getElementById('pesarti_ai_key_input') as HTMLInputElement).value;
                       if(val) handleSaveAiKey(val);
                     }} className="w-full py-4 bg-gradient-to-r from-fuchsia-600 to-indigo-600 hover:from-fuchsia-500 hover:to-indigo-500 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl active:scale-95 transition-all">Ativar Cérebro AI</button>
                  </div>
               ) : (
                  <div className="flex-1 flex flex-col overflow-hidden">
                     <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-gradient-to-b from-[#0d0d0f] to-fuchsia-900/5">
                        {aiMessages.length === 0 && (
                          <div className="text-center mt-20">
                            <Sparkles size={48} className="text-fuchsia-500/20 mx-auto mb-6" />
                            <p className="text-zinc-500 font-medium leading-relaxed">O Copiloto da Pesarti está pronto <br/>e de olho na sua tela.<br/>Peça drafts ou gere conteúdos!</p>
                          </div>
                        )}
                        {aiMessages.map((msg, i) => (
                           <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                              <div className={`max-w-[85%] p-4 rounded-3xl ${msg.role === 'user' ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-white/5 border border-white/10 text-zinc-300 rounded-bl-none shadow-xl leading-relaxed whitespace-pre-wrap text-[13px] font-medium'}`}>
                                 {msg.text}
                              </div>
                           </div>
                        ))}
                        {isAiTyping && (
                           <div className="flex justify-start">
                              <div className="bg-white/5 border border-white/10 p-4 rounded-3xl rounded-bl-none flex gap-2 items-center">
                                 <Loader2 size={16} className="text-fuchsia-500 animate-spin" />
                                 <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Pensando...</span>
                              </div>
                           </div>
                        )}
                     </div>

                     <div className="p-6 border-t border-white/5 bg-[#0d0d0f] shadow-2xl z-10 flex-shrink-0">
                        <div className="flex gap-3">
                           <input 
                              value={aiInput} 
                              onChange={(e) => setAiInput(e.target.value)}
                              onKeyDown={(e) => { if (e.key === 'Enter') handleSendAiPrompt(); }}
                              placeholder="Fale com a IA..." 
                              className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white outline-none focus:border-fuchsia-500 transition-colors"
                           />
                           <button onClick={handleSendAiPrompt} disabled={isAiTyping || !aiInput.trim()} className="p-4 bg-fuchsia-600 hover:bg-fuchsia-500 text-white rounded-2xl disabled:opacity-50 disabled:active:scale-100 active:scale-95 transition-all shadow-xl shadow-fuchsia-600/20"><Send size={20} /></button>
                        </div>
                     </div>
                  </div>
               )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* MODALS GLOBAIS */}
      <AnimatePresence>
        {selectedUserReport && (
          <UserReportModal userId={selectedUserReport} categories={categories} onClose={() => setSelectedUserReport(null)} />
        )}
        {meetingModalOpen && (
          <MeetingFormModal onSave={addOrUpdateMeeting} onClose={() => setMeetingModalOpen(false)} />
        )}
        {categoryModalOpen && (
          <CategorySelectorModal onSelect={handleAddCategory} onClose={() => setCategoryModalOpen(false)} />
        )}
        {statusModalOpen && (
          <GlobalStatusModal categories={categories} onClose={() => setStatusModalOpen(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}

// --- COMPONENTES AUXILIARES ---

function Sidebar({ categories, activeFilter, onSelectFilter, activeTab, onSelectTab, mode, onToggleMode, userRole }: { categories: Category[], activeFilter: string | null, onSelectFilter: (f: string | null) => void, activeTab: string, onSelectTab: (t: 'board' | 'meetings' | 'agenda' | 'orders' | 'calendar' | 'brainstorm' | 'financeiro' | 'lembretes') => void, mode: 'expanded' | 'collapsed' | 'hidden', onToggleMode: (m: 'expanded' | 'collapsed' | 'hidden') => void, userRole?: string }) {
  const baseItems = [
    { id: null, icon: LayoutDashboard, label: "Home", type: 'filter' as const },
  ];

  const dynamicItems = categories.map(cat => ({
    id: cat.id,
    icon: cat.icon,
    label: cat.title,
    type: 'filter' as const
  }));

  const endItems = [
    { id: "ai_tab", icon: Sparkles, label: "Chat IA Copiloto", type: 'tab' as const, tab: 'ai_panel' as any },
    { id: "orders_tab", icon: CheckCircle2, label: "Pedidos Site", type: 'tab' as const, tab: 'orders' as const },
    { id: "financeiro_tab", icon: Building2, label: "Financeiro", type: 'tab' as const, tab: 'financeiro' as const },
    { id: "lembretes_tab", icon: FileText, label: "Lembretes", type: 'tab' as const, tab: 'lembretes' as const },
    { id: "meetings_tab", icon: Video, label: "Reuniões", type: 'tab' as const, tab: 'meetings' as const },
    { id: "calendar_tab", icon: Calendar, label: "Calendário", type: 'tab' as const, tab: 'calendar' as const },
    { id: "brainstorm_tab", icon: Lightbulb, label: "Brainstorm", type: 'tab' as const, tab: 'brainstorm' as const },
  ];

  const allItems = [...baseItems, ...dynamicItems, ...endItems];

  if (mode === 'hidden') {
    return (
      <button
        onClick={() => onToggleMode('collapsed')}
        className="fixed left-6 bottom-6 p-4 glass-panel rounded-full bg-indigo-600 text-white z-[300] shadow-2xl hover:scale-110 active:scale-95 transition-all"
      >
        <Maximize2 size={24} />
      </button>
    );
  }

  return (
    <motion.aside
      initial={false}
      animate={{ width: mode === 'expanded' ? 288 : 100 }}
      className="glass-panel flex flex-col items-center py-6 z-20 h-full border-l-0 border-y-0 relative shadow-2xl overflow-hidden transition-all duration-500 ease-in-out"
    >
      <div className="w-full px-5 mb-10 flex flex-col items-center">
        <div className="flex w-full justify-end mb-4">
          <button onClick={() => onToggleMode(mode === 'expanded' ? 'collapsed' : 'expanded')} className="p-2 text-zinc-600 hover:text-white">
            {mode === 'expanded' ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
          </button>
        </div>
        <img 
          src="/logo-pesarti-v2.png" 
          alt="Logo" 
          className={`transition-all duration-500 ${mode === 'expanded' ? 'h-12 w-auto mb-2' : 'h-8 w-auto mb-0'} object-contain brightness-110 drop-shadow-[0_0_10px_rgba(168,85,247,0.3)]`} 
        />
        {mode === 'expanded' && <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.5em] opacity-40">Interno</span>}
      </div>
      <nav className="flex flex-col gap-2 w-full px-5 overflow-y-auto custom-scrollbar">
        {allItems.map(item => {
          const isActive = item.type === 'filter' ? (activeFilter === item.id && activeTab === 'board') : activeTab === item.tab;
          return (
            <button
              key={item.label}
              onClick={() => {
                if (item.type === 'filter') {
                  onSelectFilter(item.id); onSelectTab('board');
                } else {
                  onSelectTab(item.tab!);
                }
              }}
              className={`p-3.5 px-6 rounded-3xl transition-all duration-300 flex-shrink-0 relative group flex items-center gap-5 w-full ${isActive ? "bg-gradient-to-br from-blue-600 to-indigo-600 shadow-xl shadow-blue-500/20 text-white" : "text-zinc-500 hover:text-zinc-200 hover:bg-white/5"}`}
            >
              <item.icon size={20} className={isActive ? "scale-110" : "opacity-60"} />
              {mode === 'expanded' && (
                <span className={`text-[11px] font-black uppercase tracking-[0.2em] whitespace-nowrap transition-all ${isActive ? "opacity-100 translate-x-0" : "opacity-50 group-hover:opacity-100"}`}>
                  {item.label}
                </span>
              )}
            </button>
          );
        })}
      </nav>
        {activeTab === 'brainstorm' && (
          <div className="mt-auto border-t border-white/5 w-full p-4 flex justify-center">
            <button onClick={() => onToggleMode('hidden')} title="Ocultar Sidebar" className="text-zinc-700 hover:text-red-400 p-2">
              <X size={16} />
            </button>
          </div>
        )}
        
        {userRole === 'admin' && (
          <div className="mt-auto border-t border-white/5 w-full p-5 pt-8">
            <Link 
              href="/admin" 
              className="flex items-center gap-4 bg-gradient-to-r from-purple-600/20 to-pink-600/20 hover:from-purple-600 hover:to-pink-600 border border-purple-500/20 px-5 py-3 rounded-2xl transition-all shadow-lg group relative overflow-hidden"
              title="Acessar Gestão de Permissões"
            >
              <div className="absolute top-0 right-0 w-16 h-16 bg-white/5 rounded-full blur-2xl group-hover:bg-white/10" />
              <ShieldAlert className="text-purple-400 group-hover:text-white transition-colors z-10" size={20} />
              {mode === 'expanded' && (
                <span className="text-[10px] font-black uppercase text-purple-300 group-hover:text-white tracking-widest leading-tight z-10 transition-colors">
                  Área<br/>Admin
                </span>
              )}
            </Link>
          </div>
        )}
    </motion.aside>
  );
}

function CategorySection({ category, onOpenCard, onUpdate, onDelete }: { category: Category, onOpenCard: (id: string) => void, onUpdate: (c: Category) => void, onDelete: () => void }) {
  const handleAddCard = () => {
    const title = prompt("Título do novo quadro:");
    if (title) {
      const newCard: ParentCard = { id: `c_${Date.now()}`, title, color: 'default', icon: FolderKanban, topics: [], attachments: [] };
      onUpdate({ ...category, cards: [...category.cards, newCard] });
    }
  };

  const handleEditCategory = () => {
    const newTitle = prompt("Novo título da área:", category.title);
    const newSubtitle = prompt("Nova descrição/finalidade da área:", category.subtitle || "");
    if (newTitle !== null) {
      onUpdate({ ...category, title: newTitle, subtitle: newSubtitle || "" });
    }
  };

  return (
    <section>
      <div className="flex flex-col mb-8 group">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 shadow-lg shadow-blue-500/5">
            <category.icon size={18} className="text-blue-400" />
          </div>
          <h2 className="text-lg font-black text-white tracking-[0.2em] uppercase">{category.title}</h2>
          <div className="h-[1px] flex-1 bg-gradient-to-r from-white/10 to-transparent ml-4"></div>
          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
            <button onClick={handleEditCategory} className="p-2 text-zinc-600 hover:text-blue-400 transition-all"><Settings size={16} /></button>
            <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="p-2 text-zinc-600 hover:text-red-400 transition-all"><Trash2 size={16} /></button>
          </div>
        </div>
        {category.subtitle && (
          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest pl-1">
            {category.subtitle}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {category.cards.map((card, idx) => (
          <ParentCardItem key={card.id} card={card} delay={idx * 0.05} onClick={() => onOpenCard(card.id)} onDelete={() => onUpdate({ ...category, cards: category.cards.filter(c => c.id !== card.id) })} />
        ))}
        <button onClick={handleAddCard} className="glass-panel border-dashed border-white/5 rounded-[32px] p-8 flex flex-col items-center justify-center min-h-[200px] hover:bg-white/5 hover:border-blue-500/20 transition-all group">
          <div className="w-14 h-14 rounded-full bg-white/5 flex items-center justify-center mb-4 group-hover:bg-blue-600/20 transition-all group-hover:scale-110">
            <Plus size={28} className="text-zinc-600 group-hover:text-blue-400" />
          </div>
          <span className="text-[10px] uppercase font-bold text-zinc-500 group-hover:text-zinc-300 tracking-[0.1em]">Novo Quadro</span>
        </button>
      </div>
    </section>
  );
}

function ParentCardItem({ card, delay, onClick, onDelete }: { card: ParentCard, delay: number, onClick: () => void, onDelete: () => void }) {
  const colorData = COLOR_MAP[card.color] || COLOR_MAP.default;
  const topicsCount = card.topics.length;
  const totalSub = card.topics.reduce((acc, t) => acc + t.subCards.length, 0);
  const doneSub = card.topics.reduce((acc, t) => acc + t.subCards.filter(s => s.status === 'done').length, 0);
  const progress = totalSub === 0 ? 0 : Math.round((doneSub / totalSub) * 100);

  return (
    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay }}
      className={`glass-panel border-t-4 p-8 rounded-[32px] hover:-translate-y-2 transition-all cursor-pointer group shadow-2xl relative bg-[#0f0f12] min-h-[260px] flex flex-col`}
      style={{ borderTopColor: colorData.hex }} onClick={onClick}
    >
      <div className="flex justify-between items-start mb-6">
        <div className={`p-3 rounded-2xl ${colorData.bg} border ${colorData.border} border-opacity-30`}>
          <card.icon size={22} className={colorData.text} />
        </div>
        <button onClick={(e) => { e.stopPropagation(); if (confirm("Excluir quadro?")) onDelete(); }} className="opacity-0 group-hover:opacity-100 p-2 text-zinc-600 hover:text-red-400 transition-all"><Trash2 size={18} /></button>
      </div>
      <h3 className="mt-6 font-bold text-lg text-white group-hover:text-blue-300 transition-colors leading-tight line-clamp-2">{card.title}</h3>
      <div className="mt-auto">
        <div className="flex justify-between items-center mb-3">
          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{topicsCount} Quadros Internos</span>
          <span className="text-xs font-bold text-white bg-white/5 px-2 py-0.5 rounded-lg">{progress}%</span>
        </div>
        <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden p-[2px] mb-4">
          <div className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-indigo-600 rounded-full transition-all duration-1000" style={{ width: `${progress}%` }} />
        </div>
        <button onClick={onClick} className="w-full py-2.5 bg-blue-600/10 hover:bg-blue-600 border border-blue-500/20 text-blue-400 hover:text-white rounded-xl text-[9px] font-bold uppercase tracking-[0.2em] transition-all">Acessar Unidade</button>
      </div>
    </motion.div>
  );
}

// --- KANBAN & DRAG AND DROP ---

function SubTopicGrid({ parentCard, onClose, onSelectTopic, onUpdate }: { parentCard: ParentCard, onClose: () => void, onSelectTopic: (id: string) => void, onUpdate: (c: ParentCard) => void }) {
  const handleAddTopic = () => {
    const title = prompt("Título do novo assunto/sub-quadro:");
    if (title) {
      const newTopic: Topic = { id: `t_${Date.now()}`, title, color: 'default', icon: FolderKanban, subCards: [] };
      onUpdate({ ...parentCard, topics: [...parentCard.topics, newTopic] });
    }
  };

  return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="h-full flex flex-col">
      <div className="flex items-center gap-6 mb-12">
        <button onClick={onClose} className="p-3 glass-panel rounded-2xl hover:bg-white/10 transition-all text-zinc-400 hover:text-white">
          <ArrowLeft size={24} />
        </button>
        <div>
          <div className="text-[10px] font-bold text-blue-500 uppercase tracking-[0.2em] mb-1">Explorando Assunto</div>
          <h2 className="text-4xl font-bold text-white tracking-tight">{parentCard.title}</h2>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {parentCard.topics.map((topic, idx) => {
          const colorData = COLOR_MAP[topic.color] || COLOR_MAP.default;
          const subCount = topic.subCards.length;
          const doneCount = topic.subCards.filter(s => s.status === 'done').length;
          const progress = subCount === 0 ? 0 : Math.round((doneCount / subCount) * 100);

          return (
            <motion.div
              key={topic.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}
              onClick={() => onSelectTopic(topic.id)}
              className="glass-panel p-8 rounded-[32px] hover:-translate-y-2 transition-all cursor-pointer bg-black/40 group border-t-4 flex flex-col"
              style={{ borderTopColor: colorData.hex }}
            >
              <div className="p-3 rounded-2xl bg-white/5 border border-white/5 w-fit mb-6">
                <topic.icon size={22} className="text-zinc-400 group-hover:text-blue-400 transition-colors" />
              </div>
              <h3 className="font-bold text-xl text-white mb-6 leading-tight">{topic.title}</h3>
              <div className="mt-auto">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{doneCount}/{subCount} Metas</span>
                  <span className="text-xs font-bold text-white">{progress}%</span>
                </div>
                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden mb-6">
                  <div className="h-full bg-blue-500 transition-all duration-1000" style={{ width: `${progress}%` }} />
                </div>
                <button onClick={(e) => { e.stopPropagation(); onSelectTopic(topic.id); }} className="w-full py-2.5 bg-zinc-800 group-hover:bg-blue-600 text-[9px] font-bold uppercase tracking-widest text-zinc-500 group-hover:text-white rounded-xl transition-all">Abrir Sub-Quadro</button>
              </div>
            </motion.div>
          );
        })}
        <button onClick={handleAddTopic} className="glass-panel border-dashed border-white/5 rounded-[32px] p-8 flex flex-col items-center justify-center min-h-[220px] hover:bg-white/5 hover:border-blue-500/20 transition-all group">
          <Plus size={28} className="text-zinc-600 mb-2 group-hover:text-blue-400" />
          <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-widest">Novo Assunto</span>
        </button>
      </div>
    </motion.div>
  );
}

// --- KANBAN & DRAG AND DROP ---

function TrelloBoardView({ topic, parentTitle, onClose, onUpdate }: { topic: Topic, parentTitle: string, onClose: () => void, onUpdate: (t: Topic) => void }) {
  const [activeSubCardId, setActiveSubCardId] = useState<string | null>(null);

  const columns: CardStatus[] = ['todo', 'doing', 'alteracao', 'done'];
  const colLabels: Record<CardStatus, string> = { todo: 'A Fazer', doing: 'Em Andamento', alteracao: 'Alteração', done: 'Finalizado' };

  const handleAddSub = (status: CardStatus) => {
    const title = prompt("Nova demanda:");
    if (title) onUpdate({ ...topic, subCards: [...topic.subCards, getInitialSubCard(title, "", status)] });
  };

  const handleDragEnd = (subId: string, newStatus: CardStatus) => {
    onUpdate({
      ...topic,
      subCards: topic.subCards.map(s => s.id === subId ? {
        ...s,
        status: newStatus,
        progress: newStatus === 'done' ? 100 : newStatus === 'doing' ? 50 : newStatus === 'alteracao' ? 30 : 0
      } : s)
    });
  };

  const activeSub = topic.subCards.find(s => s.id === activeSubCardId);

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-6 mb-10">
        <button onClick={onClose} className="p-3 glass-panel rounded-2xl hover:bg-white/10 transition-all text-zinc-400 hover:text-white">
          <ArrowLeft size={24} />
        </button>
        <div>
          <div className="text-[10px] font-bold text-blue-500 uppercase tracking-[0.2em] mb-1">{parentTitle}</div>
          <h2 className="text-4xl font-bold text-white tracking-tight">{topic.title}</h2>
        </div>
      </div>

      <div className="flex-1 flex gap-8 overflow-x-auto pb-12 custom-scrollbar">
        {columns.map(colId => (
          <KanbanColumn
            key={colId}
            id={colId}
            label={colLabels[colId]}
            cards={topic.subCards.filter(s => s.status === colId)}
            onAdd={() => handleAddSub(colId)}
            onCardClick={setActiveSubCardId}
            onDrop={(subId) => handleDragEnd(subId, colId)}
          />
        ))}
      </div>

      <AnimatePresence>
        {activeSub && (
          <SubCardModal
            sub={activeSub}
            onClose={() => setActiveSubCardId(null)}
            onUpdate={(u) => onUpdate({ ...topic, subCards: topic.subCards.map(s => s.id === u.id ? u : s) })}
            onDelete={() => { onUpdate({ ...topic, subCards: topic.subCards.filter(s => s.id !== activeSub.id) }); setActiveSubCardId(null); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function KanbanColumn({ id, label, cards, onAdd, onCardClick, onDrop }: { id: CardStatus, label: string, cards: SubCard[], onAdd: () => void, onCardClick: (id: string) => void, onDrop: (subId: string) => void }) {
  const [isOver, setIsOver] = useState(false);

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setIsOver(true); }}
      onDragLeave={() => setIsOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsOver(false);
        const subId = e.dataTransfer.getData("subId");
        if (subId) onDrop(subId);
      }}
      className={`w-80 flex-shrink-0 flex flex-col h-full bg-[#111113]/60 rounded-[40px] border transition-all ${isOver ? 'border-blue-500/50 bg-blue-500/5 scale-[1.02]' : 'border-white/5'} p-6`}
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-bold text-xs uppercase tracking-widest text-zinc-500 flex items-center gap-3">
          <div className={`w-2 h-2 rounded-full ${id === 'done' ? 'bg-green-500' : id === 'doing' ? 'bg-blue-500' : id === 'alteracao' ? 'bg-orange-500' : 'bg-zinc-600'}`}></div>
          {label}
        </h3>
        <button onClick={onAdd} className="p-2 hover:bg-white/5 rounded-xl text-zinc-500 hover:text-white transition-all"><Plus size={18} /></button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-5 pr-1 custom-scrollbar">
        {cards.map(sub => {
          const isOverdue = new Date(sub.dueDate) < new Date() && sub.status !== 'done';
          const priorityStyle = PRIORITY_MAP[sub.priority] || PRIORITY_MAP.low;
          return (
            <div
              key={sub.id}
              draggable
              onDragStart={(e) => e.dataTransfer.setData("subId", sub.id)}
              onClick={() => onCardClick(sub.id)}
              className={`bg-[#1c1c1f] border p-6 rounded-3xl shadow-xl cursor-grab active:cursor-grabbing hover:-translate-y-1 transition-all group ${isOverdue ? 'border-red-600 shadow-[0_0_20px_rgba(220,38,38,0.2)] bg-red-900/5' : 'border-white/5 hover:border-purple-500/40'}`}
            >
              <div className="flex justify-between items-start mb-3">
                <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-lg border ${priorityStyle.bg} ${priorityStyle.border} ${priorityStyle.color}`}>
                  {priorityStyle.label}
                </span>
                {isOverdue && <span className="text-[9px] font-black text-red-500 animate-pulse bg-red-500/10 px-2 py-0.5 rounded-lg border border-red-500/20">ATRASADO</span>}
              </div>
              
              {sub.attachments && sub.attachments.length > 0 && sub.attachments[0].match(/\.(jpg|jpeg|png|gif|webp)$/i) && (
                <div className="w-full aspect-video rounded-2xl overflow-hidden mb-4 border border-white/5">
                   <img src={sub.attachments[0]} className="w-full h-full object-cover" />
                </div>
              )}
              
              <h4 className={`text-sm font-bold mb-4 leading-tight ${sub.status === 'done' ? 'text-zinc-600 line-through' : 'text-zinc-100'}`}>{sub.title}</h4>
              <div className="flex items-center justify-between">
                <div className="flex -space-x-2">
                  <img src={USERS[sub.assignedTo]?.avatar} className="w-8 h-8 rounded-full border-2 border-[#1c1c1f] shadow-lg" />
                </div>
                {isOverdue && <Flag size={14} className="text-red-500" />}
              </div>
            </div>
          );
        })}
        <button onClick={onAdd} className="w-full py-4 border border-dashed border-white/5 rounded-[32px] text-[10px] font-bold text-zinc-600 uppercase tracking-widest hover:border-blue-500/20 hover:text-blue-400 transition-all">+ Nova Meta</button>
      </div>
    </div>
  );
}

// --- POPUP CENTRAL MODALS ---

function SubCardModal({ sub, onClose, onUpdate, onDelete }: { sub: SubCard, onClose: () => void, onUpdate: (s: SubCard) => void, onDelete: () => void }) {
  const isOverdue = new Date(sub.dueDate) < new Date() && sub.status !== 'done';
  const [msg, setMsg] = useState("");
  const [newPauta, setNewPauta] = useState("");
  const [expandedPauta, setExpandedPauta] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `subcards/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('attachments')
      .upload(filePath, file);

    if (uploadError) {
      alert("Erro ao subir arquivo!");
      setUploading(false);
      return;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('attachments')
      .getPublicUrl(filePath);

    onUpdate({ ...sub, attachments: [...(sub.attachments || []), publicUrl] });
    setUploading(false);
  };

  const handleAddPauta = () => {
    if (!newPauta.trim()) return;
    const pauta = { id: Date.now().toString(), text: newPauta };
    onUpdate({ ...sub, pautas: [...(sub.pautas || []), pauta] });
    setNewPauta("");
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/90 backdrop-blur-xl" />
      <motion.div initial={{ scale: 0.9, opacity: 0, y: 50 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 50 }} className="relative w-full max-w-4xl bg-[#0d0d0f] border border-white/10 rounded-[60px] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        <div className="p-10 border-b border-white/5 flex items-center justify-between bg-gradient-to-r from-blue-500/5 to-transparent">
          <div className="flex items-center gap-4 text-blue-400">
            <FolderKanban size={24} />
            <span className="text-xs font-bold uppercase tracking-[0.3em]">Demanda Estratégica</span>
          </div>
          <div className="flex gap-4">
            <button onClick={onDelete} className="p-4 hover:bg-red-500/10 text-zinc-600 hover:text-red-400 rounded-3xl transition-all"><Trash2 size={24} /></button>
            <button onClick={onClose} className="p-4 bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white rounded-3xl transition-all"><X size={24} /></button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-12 space-y-12 custom-scrollbar">
          <input value={sub.title} onChange={e => onUpdate({ ...sub, title: e.target.value })} className="w-full bg-transparent text-4xl font-bold text-white border-none outline-none focus:ring-0 px-0" />

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-widest mb-4 block">Responsável</label>
              <div className="flex items-center gap-4 bg-white/5 p-4 rounded-3xl border border-white/5 relative">
                <img src={USERS[sub.assignedTo]?.avatar} className="w-10 h-10 rounded-full" />
                <div className="flex-1">
                  <p className="text-xs font-bold text-white">{USERS[sub.assignedTo]?.name}</p>
                  <p className="text-[9px] text-zinc-500 uppercase">{USERS[sub.assignedTo]?.role}</p>
                </div>
                <select
                  value={sub.assignedTo}
                  onChange={e => onUpdate({ ...sub, assignedTo: e.target.value })}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                >
                  {Object.values(USERS).map(u => <option key={u.id} className="bg-[#121212] text-white" value={u.id}>{u.name}</option>)}
                </select>
                <MoreVertical size={16} className="text-zinc-600" />
              </div>
            </div>

            <div>
              <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-widest mb-4 block">Prioridade</label>
              <div className="relative">
                <select
                  value={sub.priority}
                  onChange={e => onUpdate({ ...sub, priority: e.target.value as Priority })}
                  className="w-full bg-white/5 p-5 rounded-3xl border border-white/5 text-white outline-none appearance-none font-bold text-sm"
                >
                  <option className="bg-[#121212] text-white" value="low">Média</option>
                  <option className="bg-[#121212] text-white" value="medium">Atenção</option>
                  <option className="bg-[#121212] text-white" value="high">Urgente</option>
                  <option className="bg-[#121212] text-white" value="urgent">Urgente Crítico</option>
                </select>
                <MoreVertical size={16} className="absolute right-5 top-1/2 -translate-y-1/2 text-zinc-600 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-widest mb-4 block">Prazo</label>
              <input type="date" value={sub.dueDate} onChange={e => onUpdate({ ...sub, dueDate: e.target.value })} className={`w-full bg-white/5 p-4.5 rounded-3xl border text-sm font-bold outline-none ${isOverdue ? 'border-red-500 text-red-400' : 'border-white/5 text-white'}`} />
            </div>

            <div>
              <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-widest mb-4 block">Status</label>
              <div className="flex gap-2">
                {['todo', 'doing', 'alteracao', 'done'].map(st => (
                  <button key={st} onClick={() => onUpdate({ ...sub, status: st as CardStatus })}
                    className={`flex-1 py-3 text-[10px] font-bold uppercase rounded-2xl border transition-all ${sub.status === st
                      ? st === 'todo' ? 'bg-zinc-700 border-zinc-500 text-white' :
                        st === 'doing' ? 'bg-blue-600 border-blue-400 text-white shadow-lg shadow-blue-500/20' :
                          st === 'alteracao' ? 'bg-orange-600 border-orange-400 text-white' :
                            'bg-green-600 border-green-400 text-white'
                      : 'bg-white/5 border-white/5 text-zinc-500 hover:text-white'
                      }`}
                  >
                    {st === 'todo' ? 'AF' : st === 'doing' ? 'INI' : st === 'alteracao' ? 'ALT' : 'FIN'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-widest block">Lista de Pautas & Descrições</label>

            {/* Lista de Pautas Existentes */}
            <div className="space-y-3">
              {(sub.pautas || []).map(p => (
                <motion.div
                  key={p.id}
                  layout
                  onClick={() => setExpandedPauta(expandedPauta === p.id ? null : p.id)}
                  className="bg-white/5 border border-white/5 rounded-3xl p-6 cursor-pointer hover:border-blue-500/20 transition-all group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-blue-500/10 rounded-xl text-blue-400"><FileText size={16} /></div>
                      <p className={`text-sm font-medium ${expandedPauta === p.id ? 'text-blue-400' : 'text-zinc-300'} line-clamp-1`}>{p.text}</p>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); onUpdate({ ...sub, pautas: (sub.pautas || []).filter(item => item.id !== p.id) }); }}
                      className="opacity-0 group-hover:opacity-100 p-2 text-zinc-600 hover:text-red-400 transition-all"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  {expandedPauta === p.id && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-6 pt-6 border-t border-white/5 text-zinc-400 text-sm leading-relaxed whitespace-pre-wrap">
                      {p.text}
                    </motion.div>
                  )}
                </motion.div>
              ))}
            </div>

            {/* Campo de Nova Pauta */}
            <div className="relative group">
              <textarea
                value={newPauta}
                onChange={e => setNewPauta(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAddPauta(); } }}
                placeholder="Adicionar nova pauta ou instrução... (Enter para salvar)"
                className="w-full bg-white/5 border border-white/5 rounded-[40px] p-8 text-white text-sm outline-none focus:border-blue-500/40 transition-all min-h-[140px] resize-none pr-24"
              />
              <button
                onClick={handleAddPauta}
                className="absolute right-6 bottom-6 bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-2xl text-[10px] font-bold uppercase tracking-widest shadow-xl shadow-blue-600/20 transition-all active:scale-95"
              >
                Salvar Pauta
              </button>
            </div>
          </div>

          <div className="space-y-6 pt-12 border-t border-white/5">
            <div className="flex items-center justify-between mb-4">
              <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-widest block">Anexos & Referências</label>
              <label className="cursor-pointer bg-white/5 hover:bg-white/10 px-4 py-2 rounded-xl border border-white/10 text-[10px] font-bold text-zinc-400 hover:text-white transition-all flex items-center gap-2">
                <Paperclip size={14} /> 
                {uploading ? "Subindo..." : "Anexar Arquivo"}
                <input type="file" className="hidden" onChange={handleFileUpload} disabled={uploading} />
              </label>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
               {sub.attachments?.map((url, i) => (
                 <div key={i} className="group relative aspect-square bg-[#121212] rounded-3xl overflow-hidden border border-white/5 hover:border-blue-500/30 transition-all">
                    {url.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                      <img src={url} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center gap-2">
                         <FileText size={20} className="text-zinc-600" />
                         <span className="text-[9px] text-zinc-500 font-bold uppercase truncate w-full">Arquivo .{url.split('.').pop()}</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center gap-2">
                       <a href={url} target="_blank" className="p-2 bg-white/10 hover:bg-blue-600 rounded-xl text-white transition-all"><ExternalLink size={16}/></a>
                       <button onClick={() => onUpdate({...sub, attachments: sub.attachments?.filter(a => a !== url)})} className="p-2 bg-white/10 hover:bg-red-600 rounded-xl text-white transition-all"><Trash2 size={16}/></button>
                    </div>
                 </div>
               ))}
               {(!sub.attachments || sub.attachments.length === 0) && !uploading && (
                 <div className="col-span-full py-10 bg-white/5 border border-dashed border-white/5 rounded-3xl flex flex-col items-center justify-center text-zinc-600 gap-2">
                   <Paperclip size={24} className="opacity-20" />
                   <p className="text-[10px] font-black uppercase tracking-[0.2em]">Nenhum anexo. Clique acima para subir.</p>
                 </div>
               )}
            </div>
          </div>

          <div className="pt-12 border-t border-white/5">
            <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-widest mb-8 block">Chat de Ajustes</label>
            <div className="space-y-6 mb-10 max-h-[400px] overflow-y-auto pr-4 custom-scrollbar">
              {(sub.comments || []).length === 0 && <p className="text-zinc-600 text-sm italic py-10 text-center">Nenhum comentário ainda.</p>}
              {(sub.comments || []).map(c => (
                <div key={c.id} className="flex gap-4">
                  <img src={USERS[c.userId]?.avatar} className="w-10 h-10 rounded-full bg-zinc-800" />
                  <div className={`p-6 rounded-[32px] ${c.userId === 'u1' ? 'bg-blue-600/10 border border-blue-500/10' : 'bg-white/5'} flex-1`}>
                    <div className="flex justify-between items-center mb-2">
                      <p className="text-[10px] font-bold text-blue-400 tracking-widest uppercase">{USERS[c.userId]?.name}</p>
                      <span className="text-[10px] text-zinc-600">{c.timestamp}</span>
                    </div>
                    <p className="text-sm text-zinc-300 leading-relaxed font-medium">{c.text}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-4">
              <textarea value={msg} onChange={e => setMsg(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); if (msg.trim()) { onUpdate({ ...sub, comments: [...sub.comments, { id: Date.now().toString(), userId: 'u1', text: msg, timestamp: 'Agora' }] }); setMsg(""); } } }} placeholder="Digitar comentário rápido..." className="flex-1 bg-white/5 min-h-[100px] rounded-[40px] p-8 text-sm text-white border border-white/10 outline-none focus:border-blue-500/40 transition-all resize-none shadow-inner" />
              <button onClick={() => { if (msg.trim()) { onUpdate({ ...sub, comments: [...sub.comments, { id: Date.now().toString(), userId: 'u1', text: msg, timestamp: 'Agora' }] }); setMsg(""); } }} className="w-16 h-16 bg-blue-600 hover:bg-blue-500 text-white rounded-[28px] flex items-center justify-center shadow-xl shadow-blue-500/20 transition-all self-end active:scale-95"><Send size={24} /></button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function UserReportModal({ userId, categories, onClose }: { userId: string, categories: Category[], onClose: () => void }) {
  const user = USERS[userId];
  const list = categories.flatMap(cat => cat.cards.flatMap(c => c.topics.flatMap(t => t.subCards.filter(s => s.assignedTo === userId))));
  const stats = { total: list.length, done: list.filter(s => s.status === 'done').length, doing: list.filter(s => s.status === 'doing').length, alt: list.filter(s => s.status === 'alteracao').length };
  const prog = stats.total === 0 ? 0 : Math.round((stats.done / stats.total) * 100);

  // Desempenho por categoria
  const areaPerformance = categories.map(cat => {
    const userCardsInArea = cat.cards.flatMap(c => c.topics.flatMap(t => t.subCards.filter(s => s.assignedTo === userId)));
    if (userCardsInArea.length === 0) return null;
    const completed = userCardsInArea.filter(s => s.status === 'done').length;
    return {
      title: cat.title,
      icon: cat.icon,
      progress: Math.round((completed / userCardsInArea.length) * 100)
    };
  }).filter(item => item !== null);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/95 backdrop-blur-2xl" />
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative w-full max-w-4xl bg-[#0d0d0f] border border-white/10 rounded-[60px] shadow-2xl p-12 overflow-hidden flex flex-col max-h-[90vh] overflow-y-auto custom-scrollbar">
        <div className="flex items-center gap-8 mb-12">
          <div className="relative">
            <img src={user.avatar} className="w-32 h-32 rounded-[40px] border-4 border-purple-600 shadow-2xl shadow-purple-600/20" />
            <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-green-500 rounded-2xl border-4 border-[#0d0d0f] flex items-center justify-center"><CheckCircle2 size={20} className="text-white" /></div>
          </div>
          <div>
            <h2 className="text-4xl font-bold text-white mb-2">{user.name}</h2>
            <p className="text-sm font-bold text-purple-400 uppercase tracking-widest">{user.role}</p>
          </div>
          <button onClick={onClose} className="ml-auto p-4 hover:bg-white/5 rounded-3xl text-zinc-500"><X size={32} /></button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div className="space-y-10">
            <div className="bg-white/5 p-8 rounded-[48px] border border-white/5">
              <div className="flex justify-between items-end mb-4">
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Entrega Total</span>
                <span className="text-5xl font-bold text-white leading-none">{prog}%</span>
              </div>
              <div className="h-4 w-full bg-white/5 rounded-full overflow-hidden p-1">
                <div className="h-full bg-gradient-to-r from-blue-600 via-indigo-500 to-indigo-700 rounded-full transition-all duration-1000" style={{ width: `${prog}%` }} />
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Desempenho por Área</h3>
              <div className="grid gap-4">
                {areaPerformance.map(area => {
                  const Icon = area!.icon;
                  return (
                    <div key={area!.title} className="bg-white/5 p-6 rounded-[32px] border border-white/5 flex items-center gap-6">
                      <div className="p-3 bg-white/10 rounded-2xl text-purple-400"><Icon size={20} /></div>
                      <div className="flex-1">
                        <div className="flex justify-between mb-2">
                          <span className="text-xs font-bold text-zinc-200">{area!.title}</span>
                          <span className="text-xs font-bold text-white">{area!.progress}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                          <div className="h-full bg-purple-500 transition-all duration-1000" style={{ width: `${area!.progress}%` }} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Histórico de Produção</h3>
            <div className="space-y-4">
              {list.map(s => (
                <div key={s.id} className="p-5 bg-white/5 rounded-[32px] border border-white/5 flex items-center justify-between group hover:border-purple-500/20 transition-all">
                  <div className="flex-1">
                    <p className="text-sm font-bold text-white truncate w-56">{s.title}</p>
                    <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-tighter">{s.status.toUpperCase()}</span>
                  </div>
                  <div className={`w-3 h-3 rounded-full ${s.status === 'done' ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]' : 'bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.5)]'}`}></div>
                </div>
              ))}
              {list.length === 0 && <p className="text-center text-zinc-600 text-sm py-10 italic">Nenhuma demanda atribuída.</p>}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// --- GAMIFIED DASHBOARD HOME ---

function GamifiedDashboardHome({ categories, users, meetings, messages, onSendMessage }: any) {
  const allSubCards = categories.flatMap((cat:any) => cat.cards.flatMap((c:any) => c.topics.flatMap((t:any) => t.subCards)));
  const overdue = allSubCards.filter((s:any) => new Date(s.dueDate) < new Date() && s.status !== 'done');
  const doing = allSubCards.filter((s:any) => s.status === 'doing');
  const done = allSubCards.filter((s:any) => s.status === 'done');
  const total = allSubCards.length;
  const progress = total === 0 ? 0 : Math.round((done.length / total) * 100);

  const [val, setVal] = useState("");

  return (
    <div className="flex flex-col gap-8 w-full">
        {/* Banner Gamificado */}
        <div className="relative bg-[#18181b] rounded-[40px] p-10 border border-white/5 overflow-hidden shadow-2xl group">
           <div className="absolute top-0 right-0 w-[50%] h-[150%] bg-gradient-to-l from-indigo-600/20 to-transparent blur-3xl pointer-events-none group-hover:from-fuchsia-600/20 transition-all duration-1000" />
           <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
             <div>
               <h2 className="text-4xl font-black text-white tracking-tighter mb-4">Cockpit Estratégico</h2>
               <p className="text-sm text-zinc-400 max-w-xl">Visão global da equipe de Marketing e Produção Pesarti. Acompanhe quadros, conversões e fluxo de ponta a ponta.</p>
             </div>
             
             <div className="flex flex-col gap-2 min-w-[200px]">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Global Score (XP)</span>
                <div className="flex items-end gap-3 mb-2">
                  <span className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500 tracking-tighter">{progress}%</span>
                </div>
                <div className="w-full h-3 bg-black/50 rounded-full border border-white/5 overflow-hidden p-0.5">
                   <motion.div initial={{width:0}} animate={{width:`${progress}%`}} transition={{duration:1.5, delay:0.2, type:'spring'}} className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full shadow-[0_0_15px_rgba(99,102,241,0.6)]" />
                </div>
             </div>
           </div>
        </div>

        {/* Stats em Caixas Neon */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
           <div className="bg-[#121212] rounded-[32px] p-8 border border-white/5 hover:border-blue-500/30 transition-all flex flex-col justify-between group overflow-hidden relative">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-2xl rounded-full group-hover:bg-blue-500/10 transition-all" />
              <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-400 flex items-center justify-center mb-6 shadow-lg shadow-blue-500/5"><Activity size={24} /></div>
              <div className="text-5xl font-black text-white tracking-tighter mb-1 relative z-10">{doing.length}</div>
              <div className="text-[10px] font-black uppercase text-zinc-500 tracking-widest relative z-10">Missões Abertas</div>
           </div>
           
           <div className="bg-[#121212] rounded-[32px] p-8 border border-white/5 hover:border-emerald-500/30 transition-all flex flex-col justify-between group overflow-hidden relative">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-2xl rounded-full group-hover:bg-emerald-500/10 transition-all" />
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-6 shadow-lg shadow-emerald-500/5"><CheckCircle2 size={24} /></div>
              <div className="text-5xl font-black text-white tracking-tighter mb-1 relative z-10">{done.length}</div>
              <div className="text-[10px] font-black uppercase text-zinc-500 tracking-widest relative z-10">Metas Batidas</div>
           </div>

           <div className="bg-[#121212] rounded-[32px] p-8 border border-white/5 hover:border-red-500/30 transition-all flex flex-col justify-between group overflow-hidden relative">
              <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 blur-2xl rounded-full group-hover:bg-red-500/10 transition-all" />
              <div className="w-12 h-12 rounded-2xl bg-red-500/10 text-red-400 flex items-center justify-center mb-6 shadow-lg shadow-red-500/5"><AlertCircle size={24} /></div>
              <div className="text-5xl font-black text-red-400 tracking-tighter mb-1 relative z-10">{overdue.length}</div>
              <div className="text-[10px] font-black uppercase text-zinc-500 tracking-widest relative z-10">Atenção Necessária</div>
           </div>

           <div className="bg-[#121212] rounded-[32px] p-8 border border-white/5 hover:border-pink-500/30 transition-all flex flex-col justify-between group overflow-hidden relative">
              <div className="absolute top-0 right-0 w-32 h-32 bg-pink-500/5 blur-2xl rounded-full group-hover:bg-pink-500/10 transition-all" />
              <div className="w-12 h-12 rounded-2xl bg-pink-500/10 text-pink-400 flex items-center justify-center mb-6 shadow-lg shadow-pink-500/5"><Megaphone size={24} /></div>
              <div className="text-5xl font-black text-white tracking-tighter mb-1 relative z-10">72<span className="text-2xl text-pink-500">%</span></div>
              <div className="text-[10px] font-black uppercase text-zinc-500 tracking-widest relative z-10">Conv. Tráfego Estimada</div>
           </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {/* Lembretes e Agenda */}
          <div className="bg-[#18181b] rounded-[40px] p-10 border border-white/5 shadow-xl relative overflow-hidden flex flex-col min-h-[400px]">
            <div className="flex items-center gap-4 mb-8">
              <div className="p-3 bg-yellow-500/10 rounded-2xl text-yellow-500"><Bell size={20} /></div>
              <h3 className="text-xl font-bold text-white tracking-tight">Próximos Marcos (Timeline)</h3>
            </div>
            <div className="space-y-4 flex-1 overflow-y-auto pr-2 custom-scrollbar">
               {meetings.slice(0,4).map((m:any) => (
                 <div key={m.id} className="p-5 rounded-3xl bg-[#121212] border border-white/5 flex items-center justify-between hover:border-yellow-500/30 transition-all group">
                   <div className="flex items-center gap-5">
                      <div className="w-14 h-14 rounded-2xl bg-black/40 border border-white/5 flex flex-col items-center justify-center shadow-inner pt-1">
                         <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest leading-none mb-1">{m.date.split('-')[1]}</span>
                         <span className="text-lg font-black text-yellow-400 leading-none">{m.date.split('-')[2]}</span>
                      </div>
                      <div>
                        <h4 className="font-bold text-white text-base mb-1">{m.title}</h4>
                        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{m.time} • {m.participants.length} Confirmados</p>
                      </div>
                   </div>
                   <a href={m.link} target="_blank" className="p-4 bg-yellow-500/10 text-yellow-500 rounded-2xl hover:bg-yellow-500 hover:text-white hover:scale-110 active:scale-95 transition-all hidden sm:block"><Video size={20} /></a>
                 </div>
               ))}
               {meetings.length === 0 && <p className="text-xs font-bold text-zinc-600 uppercase tracking-widest py-6 border-2 border-dashed border-white/5 rounded-3xl text-center">Nenhum evento próximo.</p>}
            </div>
          </div>

          {/* Performance de Marketing */}
          <div className="bg-[#18181b] rounded-[40px] p-10 border border-white/5 shadow-xl relative overflow-hidden flex flex-col min-h-[400px]">
             <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-fuchsia-500/10 rounded-2xl text-fuchsia-500"><BarChart2 size={20} /></div>
                  <h3 className="text-xl font-bold text-white tracking-tight">Funil de Campanhas</h3>
                </div>
                <div className="flex gap-2">
                   <span className="w-2 h-2 rounded-full bg-fuchsia-500 animate-pulse"></span>
                   <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">LIVE</span>
                </div>
             </div>

             <div className="flex-1 flex flex-col justify-center space-y-6 relative">
                 <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-tr from-fuchsia-600/5 to-transparent pointer-events-none rounded-3xl" />
                 
                 {/* Visual Funnel Stack (Dinamico do Trello geral) */}
                 <div className="flex items-center justify-between px-6 p-4 bg-white/5 rounded-2xl border border-white/5 hover:border-fuchsia-500/20 transition-all relative z-10 w-full mx-auto group">
                    <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest w-40">Total Gerado (Site/Base)</span>
                    <div className="flex-1 px-4"><div className="w-full h-2 bg-black/40 rounded-full overflow-hidden"><div className="h-full bg-fuchsia-500 w-[100%] rounded-full group-hover:shadow-[0_0_10px_rgba(217,70,239,0.5)]"></div></div></div>
                    <span className="text-sm font-black text-white w-20 text-right">{allSubCards.length} Cards</span>
                 </div>

                 <div className="flex items-center justify-between px-6 p-4 bg-white/5 rounded-2xl border border-white/5 hover:border-indigo-500/20 transition-all relative z-10 w-[90%] mx-auto group">
                    <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest w-40">Em Andamento (Bordar/Prod)</span>
                    <div className="flex-1 px-4"><div className="w-full h-2 bg-black/40 rounded-full overflow-hidden"><div className="h-full bg-indigo-500 rounded-full group-hover:shadow-[0_0_10px_rgba(99,102,241,0.5)] transition-all" style={{width: `${total === 0 ? 0 : (doing.length/total)*100}%`}}></div></div></div>
                    <span className="text-sm font-black text-white w-20 text-right">{doing.length} Tasks</span>
                 </div>

                 <div className="flex items-center justify-between px-6 p-4 bg-white/5 rounded-2xl border border-white/5 hover:border-yellow-500/20 transition-all relative z-10 w-[80%] mx-auto group">
                    <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest w-40">Alteração/Revisão Cliente</span>
                    <div className="flex-1 px-4"><div className="w-full h-2 bg-black/40 rounded-full overflow-hidden"><div className="h-full bg-yellow-400 rounded-full group-hover:shadow-[0_0_10px_rgba(250,204,21,0.5)] transition-all" style={{width: `${total === 0 ? 0 : (allSubCards.filter((s:any) => s.status === 'alteracao').length/total)*100}%`}}></div></div></div>
                    <span className="text-sm font-black text-white w-20 text-right">{allSubCards.filter((s:any) => s.status === 'alteracao').length} Pend</span>
                 </div>

                 <div className="flex items-center justify-between px-6 p-4 bg-white/5 rounded-2xl border border-white/5 hover:border-emerald-500/20 transition-all relative z-10 w-[70%] mx-auto group">
                    <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest w-40">Concluído e Faturado</span>
                    <div className="flex-1 px-4"><div className="w-full h-2 bg-black/40 rounded-full overflow-hidden"><div className="h-full bg-emerald-500 rounded-full group-hover:shadow-[0_0_10px_rgba(16,185,129,0.5)] transition-all" style={{width: `${progress}%`}}></div></div></div>
                    <span className="text-sm font-black text-emerald-400 w-20 text-right">{done.length} Prontos</span>
                 </div>
             </div>
          </div>
        </div>
    </div>
  );
}

// --- MEETINGS VIEW & MODALS ---

function MeetingsView({ meetings, onAdd, onDelete }: { meetings: Meeting[], onAdd: () => void, onDelete: (id: string) => void }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-6xl mx-auto py-10">
      <div className="flex flex-col md:flex-row items-center justify-between gap-8 mb-16">
        <div>
          <h2 className="text-5xl font-bold text-white tracking-tighter mb-3 underline decoration-purple-600 decoration-8 underline-offset-8">Reuniões</h2>
          <p className="text-zinc-500 font-medium tracking-wide">Planejamento e alinhamento da equipe Pesarti</p>
        </div>
        <button onClick={onAdd} className="bg-white text-black hover:bg-purple-600 hover:text-white px-10 py-5 rounded-[32px] font-bold flex items-center gap-4 shadow-2xl transition-all active:scale-95 text-lg"><Video size={24} /> Agendar Nova Pauta</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {meetings.map(m => (
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} key={m.id} className="glass-panel p-10 rounded-[60px] border border-white/5 bg-black/40 relative overflow-hidden group hover:border-purple-500/30 transition-all">
            <div className="absolute top-0 right-0 w-40 h-40 bg-purple-500/5 rounded-full blur-[80px] -mr-20 -mt-20 group-hover:bg-purple-500/10 transition-all" />

            <div className="flex justify-between items-start mb-8 relative z-10">
              <div className="p-4 bg-purple-500/10 rounded-3xl border border-purple-500/10 text-purple-400"><Video size={32} /></div>
              <div className="text-right">
                <div className="text-2xl font-bold text-white">{m.time}</div>
                <div className="text-xs font-bold text-zinc-500 uppercase tracking-[0.2em]">{m.date}</div>
              </div>
            </div>

            <h3 className="text-3xl font-bold text-white mb-4 leading-tight">{m.title}</h3>
            <p className="text-sm text-zinc-500 mb-10 leading-relaxed font-normal">{m.description}</p>

            <div className="flex items-center justify-between mt-auto pt-8 border-t border-white/5">
              <div className="flex -space-x-3">
                {m.participants.map(pId => <img key={pId} src={USERS[pId]?.avatar} className="w-12 h-12 rounded-full border-4 border-black" title={USERS[pId]?.name} />)}
              </div>
              <div className="flex items-center gap-6">
                <button onClick={() => onDelete(m.id)} className="text-zinc-600 hover:text-red-400 transition-all"><Trash2 size={24} /></button>
                <a href={m.link} target="_blank" className="flex items-center gap-3 text-purple-400 font-bold text-sm tracking-widest hover:text-white transition-all uppercase"><LinkIcon size={18} /> Link Meet</a>
              </div>
            </div>
          </motion.div>
        ))}
        {meetings.length === 0 && (
          <div className="col-span-full py-40 flex flex-col items-center justify-center text-zinc-600 space-y-4">
            <Video size={64} className="opacity-10" />
            <p className="font-bold uppercase tracking-widest">Nenhuma reunião agendada</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}

function MeetingFormModal({ onSave, onClose }: { onSave: (m: Meeting) => void, onClose: () => void }) {
  const [meeting, setMeeting] = useState<Meeting>({ id: `m_${Date.now()}`, title: '', date: '', time: '', description: '', link: '', participants: [] });

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-6">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/90 backdrop-blur-xl" />
      <motion.div initial={{ scale: 0.9, y: 50 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 50 }} className="relative w-full max-w-2xl bg-[#0d0d0f] border border-white/10 rounded-[60px] p-12 shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar">
        <div className="flex items-center justify-between mb-10">
          <h2 className="text-3xl font-bold text-white flex items-center gap-4"><Video className="text-purple-500" size={32} /> Agendar Sincronia</h2>
          <button onClick={onClose} className="p-4 hover:bg-white/5 rounded-3xl text-zinc-500"><X size={24} /></button>
        </div>
        <div className="space-y-8">
          <div>
            <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-widest mb-3 block">Nome da Reunião</label>
            <input value={meeting.title} onChange={e => setMeeting({ ...meeting, title: e.target.value })} className="w-full bg-white/5 p-5 rounded-3xl border border-white/5 text-white outline-none focus:border-purple-500/30 transition-all" placeholder="Ex: Alinhamento Pesar de Minas" />
          </div>
          <div className="grid grid-cols-2 gap-8">
            <div>
              <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-widest mb-3 block">Data</label>
              <input type="date" value={meeting.date} onChange={e => setMeeting({ ...meeting, date: e.target.value })} className="w-full bg-white/5 p-5 rounded-3xl border border-white/5 text-white outline-none" />
            </div>
            <div>
              <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-widest mb-3 block">Horário</label>
              <input type="time" value={meeting.time} onChange={e => setMeeting({ ...meeting, time: e.target.value })} className="w-full bg-white/5 p-5 rounded-3xl border border-white/5 text-white outline-none" />
            </div>
          </div>
          <div>
            <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-widest mb-3 block">Pauta / Sobre o que</label>
            <textarea value={meeting.description} onChange={e => setMeeting({ ...meeting, description: e.target.value })} className="w-full bg-white/5 p-5 rounded-3xl border border-white/5 text-white outline-none h-28 resize-none" placeholder="Breve resumo do que será discutido..." />
          </div>
          <div>
            <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-widest mb-3 block">Link do Meet</label>
            <input value={meeting.link} onChange={e => setMeeting({ ...meeting, link: e.target.value })} className="w-full bg-white/5 p-5 rounded-3xl border border-white/5 text-white outline-none" placeholder="https://meet.google.com/..." />
          </div>
          <div>
            <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-widest mb-3 block">Participantes</label>
            <div className="flex gap-4">
              {Object.values(USERS).map(u => (
                <button key={u.id} onClick={() => setMeeting({ ...meeting, participants: meeting.participants.includes(u.id) ? meeting.participants.filter(pid => pid !== u.id) : [...meeting.participants, u.id] })} className={`p-4 rounded-3xl border transition-all flex items-center gap-3 ${meeting.participants.includes(u.id) ? 'bg-purple-600 border-purple-400 text-white shadow-lg shadow-purple-600/20' : 'bg-white/5 border-white/5 text-zinc-500'}`}>
                  <img src={u.avatar} className="w-6 h-6 rounded-full" />
                  <span className="text-xs font-bold">{u.name}</span>
                </button>
              ))}
            </div>
          </div>
          <button onClick={() => onSave(meeting)} className="w-full bg-white text-black py-6 rounded-[32px] font-bold text-xl hover:bg-purple-600 hover:text-white transition-all mt-8 active:scale-95 shadow-2xl">Confirmar Agenda</button>
        </div>
      </motion.div>
    </div>
  );
}

function CategorySelectorModal({ onSelect, onClose }: { onSelect: (template: { title: string, icon: any }) => void, onClose: () => void }) {
  const templates = [
    { title: "Marketing", icon: Megaphone, desc: "Anúncios, Conteúdo e Social" },
    { title: "Financeiro", icon: Building2, desc: "Cofre, Entradas e Saídas" },
    { title: "Planejamento", icon: Lightbulb, desc: "Ideias e Estratégia de Marca" },
    { title: "Produção", icon: FolderKanban, desc: "Execução, Prazos e Logística" },
    { title: "Infraestrutura", icon: Settings, desc: "Sistemas e Ferramentas" },
    { title: "Equipe", icon: Users, desc: "Gestão de Pessoas e Cultura" },
  ];

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-6">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/90 backdrop-blur-xl" />
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative w-full max-w-3xl bg-[#0d0d0f] border border-white/10 rounded-[60px] p-12 shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar">
        <div className="flex justify-between items-center mb-10">
          <h2 className="text-3xl font-bold text-white uppercase tracking-widest">Nova Área Pesarti</h2>
          <button onClick={onClose} className="p-4 hover:bg-white/5 rounded-3xl text-zinc-500"><X size={24} /></button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {templates.map(t => (
            <button
              key={t.title}
              onClick={() => onSelect({ title: t.title, icon: t.icon })}
              className="flex items-center gap-6 p-6 bg-white/5 border border-white/5 rounded-[40px] hover:bg-purple-600/10 hover:border-purple-500/30 transition-all text-left group"
            >
              <div className="p-4 bg-white/5 rounded-[24px] group-hover:bg-purple-600/20 text-purple-400"><t.icon size={24} /></div>
              <div>
                <h4 className="font-bold text-white text-lg">{t.title}</h4>
                <p className="text-[10px] uppercase font-medium text-zinc-500 tracking-widest">{t.desc}</p>
              </div>
            </button>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

function GlobalChatPanel({ messages, onSendMessage, onClose }: { messages: BoardChatMessage[], onSendMessage: (t: string) => void, onClose: () => void }) {
  const [val, setVal] = useState("");
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      className="w-[400px] h-[600px] glass-panel bg-[#09090b]/95 backdrop-blur-3xl border border-white/10 flex flex-col z-[100] shadow-[0_30px_80px_rgba(0,0,0,0.8)] rounded-[40px] overflow-hidden"
    >
      <div className="p-8 border-b border-white/5 flex items-center justify-between bg-purple-600/5">
        <div>
          <h2 className="font-bold text-white flex items-center gap-3 uppercase tracking-widest text-xs"><MessageSquare size={16} className="text-purple-400" /> Mural Pesarti</h2>
          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mt-1">Chat de Colaboração Geral</p>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-xl text-zinc-600 hover:text-white"><X size={20} /></button>
      </div>
      <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar bg-black/20">
        {messages.map(m => (
          <div key={m.id} className="flex gap-4">
            <img src={USERS[m.userId]?.avatar} className="w-10 h-10 rounded-2xl shadow-lg shrink-0" />
            <div className={`p-5 rounded-[30px] ${m.userId === 'u1' ? 'bg-blue-600/10 border border-blue-500/10' : 'bg-white/5 border border-white/5'} flex-1`}>
              <p className="text-[10px] font-black text-blue-400 mb-2 uppercase tracking-widest">{USERS[m.userId]?.name} • {m.timestamp}</p>
              <p className="text-sm text-zinc-300 leading-relaxed font-medium">{m.text}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="p-8 border-t border-white/5 bg-black/40">
        <div className="relative">
          <input
            value={val}
            onChange={e => setVal(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); if (val.trim()) { onSendMessage(val); setVal(""); } } }}
            placeholder="Compartilhe um insight na home..."
            className="w-full bg-white/5 border border-white/10 rounded-2xl py-5 px-6 pr-16 text-sm text-white outline-none focus:border-purple-500/50 transition-all font-medium placeholder:text-zinc-600"
          />
          <button
            onClick={() => { if (val.trim()) { onSendMessage(val); setVal(""); } }}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-4 bg-purple-600 text-white rounded-xl shadow-lg active:scale-95"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function GlobalStatusModal({ categories, onClose }: { categories: Category[], onClose: () => void }) {
  const allSubCards = categories.flatMap(cat => cat.cards.flatMap(c => c.topics.flatMap(t => t.subCards)));
  const overdue = allSubCards.filter(s => new Date(s.dueDate) < new Date() && s.status !== 'done');
  const pending = allSubCards.filter(s => s.status !== 'done');
  const doing = allSubCards.filter(s => s.status === 'doing');

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-6">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/90 backdrop-blur-xl" />
      <motion.div initial={{ scale: 0.9, y: 50 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 50 }} className="relative w-full max-w-3xl bg-[#0d0d0f] border border-white/10 rounded-[60px] p-12 shadow-2xl max-h-[85vh] overflow-y-auto custom-scrollbar">
        <div className="flex justify-between items-center mb-10">
          <h2 className="text-3xl font-bold text-white uppercase tracking-widest flex items-center gap-4"><BarChart2 className="text-purple-500" /> Status Operacional</h2>
          <button onClick={onClose} className="p-4 hover:bg-white/5 rounded-3xl text-zinc-500"><X size={24} /></button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-red-500/10 border border-red-500/20 p-8 rounded-[40px] text-center">
            <div className="text-4xl font-black text-red-500 mb-2">{overdue.length}</div>
            <div className="text-[10px] font-bold text-red-400 uppercase tracking-widest">Atrasados</div>
          </div>
          <div className="bg-blue-500/10 border border-blue-500/20 p-8 rounded-[40px] text-center">
            <div className="text-4xl font-black text-blue-500 mb-2">{doing.length}</div>
            <div className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Em Andamento</div>
          </div>
          <div className="bg-purple-500/10 border border-purple-500/20 p-8 rounded-[40px] text-center">
            <div className="text-4xl font-black text-purple-500 mb-2">{pending.length}</div>
            <div className="text-[10px] font-bold text-purple-400 uppercase tracking-widest">Pendentes</div>
          </div>
        </div>

        <div className="space-y-6">
          <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest px-4">Atenção Crítica (Atrasados)</h3>
          {overdue.map(s => (
            <div key={s.id} className="p-6 bg-white/5 border border-red-500/20 rounded-[32px] flex items-center justify-between group">
              <div>
                <p className="text-sm font-bold text-white mb-1">{s.title}</p>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-bold text-red-400 uppercase">Prazo: {s.dueDate}</span>
                  <span className="text-[10px] text-zinc-500">•</span>
                  <span className="text-[10px] font-bold text-zinc-500 uppercase">{USERS[s.assignedTo]?.name}</span>
                </div>
              </div>
              <div className="p-2 bg-red-500/20 rounded-xl text-red-500"><AlertCircle size={18} /></div>
            </div>
          ))}
          {overdue.length === 0 && <p className="text-center text-zinc-600 py-10 italic">Tudo em dia por enquanto!</p>}
        </div>
      </motion.div>
    </div>
  );
}

function FinanceView({ items, onUpdate, onDelete }: { items: FinanceItem[], onUpdate: (items: FinanceItem[]) => void, onDelete: (id: string) => void }) {
  const [activeSubTab, setActiveSubTab] = useState('dashboard');
  const [activeItem, setActiveItem] = useState<any|null>(null);

  const handleAdd = () => {
    const p = prompt("Nome do Contato ou Despesa:");
    if(!p) return;
    const v = prompt("Valor ou Papel (ex: R$ 500, ou 'Fornecedor'):");
    const novo = { id: Date.now().toString(), name: p, tag: "Novo", val: v||"--", status: activeSubTab === 'dashboard' ? 'fornecedores' : activeSubTab, email: '', phone: '' };
    onUpdate([...items, novo]);
    setActiveItem(novo);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-7xl mx-auto py-10 h-full flex flex-col relative">
      <div className="flex flex-col md:flex-row items-center justify-between gap-8 mb-12">
        <div>
          <h2 className="text-5xl font-bold text-white tracking-tighter mb-3 underline decoration-emerald-600 decoration-8 underline-offset-8">CRM Financeiro</h2>
          <p className="text-zinc-500 font-medium tracking-wide">Dashboard da Loja, Contatos, Custos e Caixa da Empresa</p>
        </div>
        <button onClick={handleAdd} className="bg-emerald-600 text-white hover:bg-emerald-500 px-8 py-4 rounded-[28px] font-bold flex items-center gap-3 shadow-2xl transition-all active:scale-95 text-sm shadow-emerald-500/10"><Plus size={20} /> Adicionar Manual</button>
      </div>

      <div className="flex gap-4 mb-4 overflow-x-auto pb-4 custom-scrollbar flex-shrink-0">
        {[
          { id: 'dashboard', label: 'Dashboard Analítico' },
          { id: 'fornecedores', label: 'Fornecedores (CRM)' },
          { id: 'contas', label: 'Contas a Pagar' },
          { id: 'orcamentos', label: 'Orçamentos' },
          { id: 'custos', label: 'Custos de Produtos' }
        ].map(item => (
          <button key={item.id} onClick={() => setActiveSubTab(item.id)} className={`px-8 py-3 rounded-full text-xs font-bold uppercase tracking-widest border transition-all flex-shrink-0 ${activeSubTab === item.id ? 'bg-emerald-600 border-emerald-400 text-white shadow-lg shadow-emerald-600/20' : 'bg-white/5 border-white/5 text-zinc-500 hover:text-white'}`}>
            {item.label}
          </button>
        ))}
      </div>

      <div className="flex-1 bg-[#121212] rounded-[40px] border border-white/5 p-8 flex flex-col relative overflow-hidden">
        {activeSubTab === 'dashboard' && (
          <div className="w-full h-full flex flex-col gap-6 overflow-y-auto custom-scrollbar pr-4">
             {/* Estatísticas Topo */}
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-8 bg-black/40 border border-white/5 rounded-3xl relative overflow-hidden group">
                   <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-3xl" />
                   <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-2">Faturamento / Últimos 30 dias</p>
                   <h3 className="text-4xl font-black text-emerald-500">R$ 14.280,00</h3>
                   <p className="text-xs text-emerald-400 font-bold mt-2">+12% vs. mês anterior</p>
                </div>
                <div className="p-8 bg-black/40 border border-white/5 rounded-3xl relative overflow-hidden group">
                   <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 blur-3xl" />
                   <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-2">Contas a Pagar / Este Mês</p>
                   <h3 className="text-4xl font-black text-red-500">R$ 3.840,50</h3>
                   <div className="mt-2 text-xs font-bold bg-red-500/20 text-red-400 px-3 py-1 rounded-lg inline-block border border-red-500/20">2 Vencem Hoje!</div>
                </div>
                <div className="p-8 bg-black/40 border border-white/5 rounded-3xl relative overflow-hidden group">
                   <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 blur-3xl" />
                   <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-2">Ticket Médio / Loja</p>
                   <h3 className="text-4xl font-black text-white">R$ 241,52</h3>
                   <p className="text-xs text-zinc-500 font-bold mt-2">Média segmento: R$ 296,71</p>
                </div>
             </div>

             {/* Gráficos Corpo */}
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1">
                 <div className="p-8 bg-black/40 border border-white/5 rounded-3xl flex flex-col min-h-[300px]">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-6">Faturamento / 12 meses</p>
                    <div className="flex-1 flex items-end gap-2 justify-between mt-auto">
                       {/* Barras animadas dummy */}
                       {[30, 40, 25, 50, 60, 45, 80, 70, 95, 100, 85, 90].map((h, i) => (
                         <div key={i} className="w-full bg-emerald-500/10 rounded-t-sm hover:bg-emerald-500 transition-all relative group cursor-crosshair">
                            <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black px-2 py-1 rounded text-[9px] font-bold opacity-0 group-hover:opacity-100">$ {h}k</div>
                            <div className="w-full bg-emerald-500 rounded-t-sm" style={{height: `${h}%`}}></div>
                         </div>
                       ))}
                    </div>
                 </div>

                 <div className="p-8 bg-black/40 border border-white/5 rounded-3xl flex flex-col min-h-[300px]">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-6">Vendas Novas x Recorrentes</p>
                    <div className="flex-1 flex items-end gap-2 justify-between mt-auto">
                       {[20, 15, 30, 45, 50, 30, 60, 50, 70, 80, 90, 100].map((h, i) => (
                         <div key={i} className="w-full flex gap-1 items-end h-[100%]">
                            <div className="w-full bg-blue-400 rounded-t-sm" style={{height: `${h}%`}}></div>
                            <div className="w-full bg-pink-400 rounded-t-sm" style={{height: `${h * 0.4}%`}}></div>
                         </div>
                       ))}
                    </div>
                    <div className="flex items-center gap-6 mt-6 justify-center">
                       <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-sm bg-blue-400"></span><span className="text-[10px] uppercase text-zinc-500">Novas</span></div>
                       <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-sm bg-pink-400"></span><span className="text-[10px] uppercase text-zinc-500">Recorrentes</span></div>
                    </div>
                 </div>
             </div>
          </div>
        )}

        {activeSubTab !== 'dashboard' && items.filter(i => i.status === activeSubTab).length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center">
            <Building2 size={64} className="text-emerald-500/20 mb-6" />
            <h3 className="text-2xl font-bold text-white mb-2">Módulo vazio</h3>
            <p className="text-zinc-500 max-w-lg">Nenhum registro de contato ou valor no momento.</p>
          </div>
        ) : activeSubTab !== 'dashboard' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-left overflow-y-auto custom-scrollbar pr-4">
            {items.filter(i => i.status === activeSubTab).map(item => (
              <div key={item.id} onClick={() => setActiveItem(item)} className="p-8 bg-black/40 border border-white/5 rounded-3xl hover:-translate-y-1 hover:border-emerald-500/50 shadow-lg cursor-pointer transition-all flex flex-col justify-between group">
                <div className="flex justify-between items-start">
                   <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-zinc-400 mb-6"><Building2 size={24}/></div>
                   <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 text-[9px] font-bold uppercase tracking-widest rounded-lg">{item.tag}</span>
                </div>
                <h4 className="text-xl font-bold text-white mb-1 line-clamp-1">{item.name}</h4>
                <p className="text-xs text-zinc-500 font-medium line-clamp-1 mb-8">{item.email || 'Sem email cadastrado'}</p>
                
                <div className="flex justify-between items-end border-t border-white/5 pt-4">
                   <div className="text-[10px] uppercase text-zinc-500 tracking-widest font-bold">Valor / Tipo</div>
                   <div className="text-lg font-black text-emerald-500">{item.val}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MODAL DE EDIÇÃO CRM / FINANCEIRO */}
      <AnimatePresence>
        {activeItem && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setActiveItem(null)} className="absolute inset-0 bg-black/90 backdrop-blur-xl" />
            <motion.div initial={{ scale: 0.9, opacity: 0, y: 50 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 50 }} className="relative w-full max-w-3xl bg-[#0d0d0f] border border-white/10 rounded-[60px] shadow-2xl p-12 flex flex-col">
              <div className="flex justify-between items-start mb-10">
                <div className="flex items-center gap-6">
                   <div className="w-20 h-20 bg-emerald-600/10 border border-emerald-500/20 rounded-3xl flex items-center justify-center text-emerald-500">
                     <Building2 size={32} />
                   </div>
                   <div>
                     <input value={activeItem.name} onChange={e => setActiveItem({...activeItem, name: e.target.value})} className="bg-transparent text-4xl font-black text-white w-full outline-none placeholder:text-white/30" placeholder="Nome do Contato/Conta" />
                     <p className="text-sm font-bold text-emerald-500 uppercase tracking-widest mt-1">Ficha Financeira / CRM</p>
                   </div>
                </div>
                <button onClick={() => setActiveItem(null)} className="p-4 bg-white/5 hover:bg-white/10 rounded-3xl text-zinc-400 hover:text-white transition-all"><X size={24} /></button>
              </div>

              <div className="grid grid-cols-2 gap-8 mb-12">
                 <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-3 block">Email do Contato</label>
                    <div className="relative">
                      <input value={activeItem.email} onChange={e => setActiveItem({...activeItem, email: e.target.value})} placeholder="email@empresa.com" className="w-full bg-white/5 border border-white/10 p-5 pl-14 rounded-2xl text-white outline-none focus:border-emerald-500/50 transition-all font-medium" />
                      <div className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-500"><MessageSquare size={18}/></div>
                    </div>
                 </div>
                 <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-3 block">Telefone / WhatsApp</label>
                    <div className="relative">
                      <input value={activeItem.phone} onChange={e => setActiveItem({...activeItem, phone: e.target.value})} placeholder="(00) 00000-0000" className="w-full bg-white/5 border border-white/10 p-5 pl-14 rounded-2xl text-white outline-none focus:border-emerald-500/50 transition-all font-medium" />
                      <div className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-500"><Globe size={18}/></div>
                    </div>
                 </div>
                 <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-3 block">Valor ou Serviço Exato</label>
                    <input value={activeItem.val} onChange={e => setActiveItem({...activeItem, val: e.target.value})} placeholder="R$ 1.000 ou Tipo" className="w-full bg-emerald-500/10 border border-emerald-500/20 p-5 rounded-2xl text-emerald-400 font-bold outline-none focus:border-emerald-500 transition-all text-xl" />
                 </div>
                 <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-3 block">Tag / Categoria</label>
                    <input value={activeItem.tag} onChange={e => setActiveItem({...activeItem, tag: e.target.value})} placeholder="Ex: Fornecedor Fixo" className="w-full bg-white/5 border border-white/10 p-5 rounded-2xl text-white font-bold outline-none focus:border-emerald-500/50 transition-all" />
                 </div>
              </div>

              <div className="flex justify-end gap-4 border-t border-white/5 pt-8">
                <button onClick={() => { onDelete(activeItem.id); setActiveItem(null); }} className="px-8 py-4 bg-red-500/10 text-red-500 font-bold rounded-2xl hover:bg-red-500 hover:text-white transition-all uppercase tracking-widest text-xs">Excluir Permanente</button>
                <button onClick={() => { onUpdate(items.map(i => i.id === activeItem.id ? activeItem : i)); setActiveItem(null); }} className="px-10 py-4 bg-emerald-600 font-bold text-white rounded-2xl hover:bg-emerald-500 transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] uppercase tracking-widest text-xs">Salvar Alterações</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function RemindersView() {
  const [reminders, setReminders] = useState<any[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [editingRem, setEditingRem] = useState<any>(null);

  useEffect(() => {
    fetchReminders();
  }, []);

  async function fetchReminders() {
    const { data } = await supabase.from('reminders').select('*').order('created_at', { ascending: false });
    if (data) {
      setReminders(data.map(d => ({
        id: d.id,
        text: d.text,
        color: ["bg-yellow-500/20", "bg-blue-500/20", "bg-pink-500/20", "bg-emerald-500/20", "bg-purple-500/20"][Math.floor(Math.random()*5)],
        author: d.author_id || "Anônimo"
      })));
    }
  }

  const handleCreate = async () => {
    const txt = "Novo Lembrete Vazio...";
    const autor = prompt("Qual o seu nome para o card?");
    const newRem = {
      id: Date.now().toString(),
      text: txt,
      author_id: autor || 'Anônimo'
    };
    
    // Inserir banco de dados em tempo real
    await supabase.from('reminders').insert([newRem]);
    
    fetchReminders();
    setEditingRem({ id: newRem.id, text: newRem.text, author: newRem.author_id, color: "bg-yellow-500/20" });
  };

  const handleSave = async () => {
    if (!editingRem) return;
    await supabase.from('reminders').update({ text: editingRem.text }).eq('id', editingRem.id);
    fetchReminders();
    setEditingRem(null);
  };

  const handleDelete = async () => {
    if (!editingRem) return;
    await supabase.from('reminders').delete().eq('id', editingRem.id);
    fetchReminders();
    setEditingRem(null);
  };

  return (
    <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="max-w-7xl mx-auto py-10 h-full relative">
      <div className="flex flex-col md:flex-row items-center justify-between mb-16 gap-6">
        <div>
          <h2 className="text-5xl font-bold text-white tracking-tighter mb-3 flex items-center gap-4">Bloco de Lembretes <div className="px-3 py-1 bg-green-500/20 text-green-400 text-xs rounded-full border border-green-500/30 animate-pulse uppercase tracking-widest font-black">Live Sync</div></h2>
          <p className="text-zinc-500 font-medium tracking-wide">Os dados abaixo já estão ligados ao servidor mundial via AWS.</p>
        </div>
        
        <div className="flex items-center gap-4">
           <div className="flex bg-white/5 p-1 rounded-2xl border border-white/5">
              <button onClick={() => setViewMode('grid')} className={`p-3 rounded-xl transition-all ${viewMode === 'grid' ? 'bg-yellow-500 text-black shadow-lg shadow-yellow-500/20' : 'text-zinc-500 hover:text-white'}`}><Layout size={18} /></button>
              <button onClick={() => setViewMode('list')} className={`p-3 rounded-xl transition-all ${viewMode === 'list' ? 'bg-yellow-500 text-black shadow-lg shadow-yellow-500/20' : 'text-zinc-500 hover:text-white'}`}><List size={18} /></button>
           </div>
           
           <button onClick={handleCreate} className="bg-yellow-500 text-black hover:bg-yellow-400 px-8 py-4 rounded-[28px] font-bold flex items-center gap-3 shadow-2xl transition-all active:scale-95 text-sm shadow-yellow-500/10"><Plus size={20} /> Novo Lembrete</button>
        </div>
      </div>

      <div className={viewMode === 'grid' ? "flex flex-wrap gap-8" : "flex flex-col gap-4"}>
        {reminders.map(r => (
          <div 
             key={r.id} 
             onClick={() => setEditingRem(r)}
             className={`${viewMode === 'grid' ? 'w-full md:w-72 min-h-[250px]' : 'w-full'} ${r.color} p-8 rounded-bl-none rounded-[40px] relative group hover:-translate-y-2 transition-transform shadow-xl flex flex-col cursor-pointer hover:shadow-yellow-500/10`}
          >
            {viewMode === 'grid' && <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-16 h-6 bg-[#09090b] rounded-full border border-white/10 opacity-50 pointer-events-none" />}
            
            <div className={`flex items-start justify-between ${viewMode === 'list' ? 'flex-row items-center' : 'flex-col'} w-full flex-1 gap-4 pointer-events-none`}>
                <div className={`text-lg font-bold text-white leading-relaxed tracking-tight ${viewMode === 'grid' ? 'flex-1 mt-4 line-clamp-6' : 'line-clamp-2 w-2/3 whitespace-pre-wrap'}`}>
                  {r.text}
                </div>
                
                <div className={`flex justify-between items-center w-full ${viewMode === 'list' ? 'w-auto gap-10 flex-shrink-0' : 'mt-auto pt-6 border-t border-white/10'}`}>
                   <p className="text-[10px] font-black uppercase tracking-widest text-zinc-300">Criado por {r.author}</p>
                </div>
            </div>
          </div>
        ))}
        {reminders.length === 0 && <p className="text-zinc-600 font-bold uppercase tracking-widest text-sm w-full py-10 text-center border border-dashed border-white/5 rounded-[40px]">Nenhum Post-It adicionado. Banco vazio.</p>}
      </div>

      <AnimatePresence>
        {editingRem && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setEditingRem(null)} className="absolute inset-0 bg-black/90 backdrop-blur-xl" />
            <motion.div initial={{ scale: 0.9, opacity: 0, y: 50 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 50 }} className={`relative w-full max-w-2xl ${editingRem.color} p-12 rounded-bl-none rounded-[60px] shadow-2xl flex flex-col`}>
              <div className="flex justify-between items-center mb-8 border-b border-black/10 pb-6">
                <span className="text-xs font-black text-black/50 uppercase tracking-widest flex items-center gap-3"><Edit3 size={16}/> Editando Lembrete (Live)</span>
                <span className="text-xs font-black text-black/50 uppercase tracking-widest">Criado por {editingRem.author}</span>
              </div>
              <textarea
                autoFocus
                value={editingRem.text}
                onChange={e => setEditingRem({...editingRem, text: e.target.value})}
                className="bg-transparent text-3xl font-black text-white leading-tight placeholder:text-white/30 resize-none outline-none w-full min-h-[250px] custom-scrollbar"
              />
              <div className="flex gap-4 mt-8 pt-8 border-t border-black/10 justify-end">
                <button 
                  onClick={handleDelete}
                  className="px-8 py-4 bg-red-500/20 text-red-700 hover:bg-red-500 hover:text-white font-bold rounded-2xl transition-all"
                >Excluir Definitivo</button>
                <button 
                  onClick={handleSave}
                  className="px-10 py-4 bg-black/90 text-white hover:bg-black font-bold rounded-2xl transition-all"
                >Salvar na Nuvem</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

type SiteOrderCol = 'site' | 'arquivo' | 'aprovacao' | 'alteracao' | 'bordar' | 'concluido';
const SITE_ORDERS_COLUMNS: {id: SiteOrderCol, title: string, color: string, text: string}[] = [
  { id: 'site', title: 'Pedido Site', color: 'bg-blue-600', text: 'text-white' },
  { id: 'arquivo', title: 'Criar Bordado [W]', color: 'bg-green-600', text: 'text-white' },
  { id: 'aprovacao', title: 'Aprovação Cliente', color: 'bg-purple-600', text: 'text-white' },
  { id: 'alteracao', title: 'Alteração', color: 'bg-orange-600', text: 'text-white' },
  { id: 'bordar', title: 'Bordar (Produção)', color: 'bg-yellow-600', text: 'text-white' },
  { id: 'concluido', title: 'Pedido Concluido', color: 'bg-red-600', text: 'text-white' }
];

function SiteOrdersBoard({ orders, onUpdate }: { orders: SiteOrder[], onUpdate: (o: SiteOrder[]) => void }) {
  const setOrders = onUpdate;
  const [activeOrder, setActiveOrder] = useState<any | null>(null);

  const handleAdd = async (colId: SiteOrderCol) => {
    const novo = { 
      id: Date.now().toString(), 
      title: "Novo Pedido...", 
      customer: "Aguardando Cadastro", 
      status: colId, 
      dueDate: new Date().toISOString().split('T')[0],
      notes: ""
    };
    const updated = [...orders, novo];
    setOrders(updated);
    setActiveOrder(novo);
    await supabase.from('site_orders').insert([novo]);
  };

  const handleDrop = async (e: any, colId: SiteOrderCol) => {
    e.preventDefault();
    const id = e.dataTransfer.getData("orderId");
    if (id) {
       const updated = orders.map(o => o.id === id ? { ...o, status: colId } : o);
       setOrders(updated);
       await supabase.from('site_orders').update({ status: colId }).eq('id', id);
    }
  };

  const handleDeleteOrder = async (id: string) => {
    if (confirm("Excluir este pedido permanentemente?")) {
      setOrders(orders.filter(o => o.id !== id));
      await supabase.from('site_orders').delete().eq('id', id);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full flex flex-col -m-8 mt-0 p-8 w-[calc(100%+4rem)] bg-[#0f0f12] relative">
      <div className="mb-10 flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-white flex items-center gap-4"><Globe className="text-blue-500" size={32} /> Pedidos Loja Integrada</h2>
          <p className="text-zinc-500 font-medium tracking-wide">Integração automatizada do site que passa pela triagem interna até a confecção em BH.</p>
        </div>
        <div className="px-6 py-2 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-[0_0_15px_rgba(59,130,246,0.2)]">
           <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span> Loja Integrada API
        </div>
      </div>
      
      <div className="flex-1 overflow-x-auto flex gap-4 md:gap-6 pb-8 custom-scrollbar items-start snap-x snap-mandatory md:snap-none px-4 md:px-0">
        {SITE_ORDERS_COLUMNS.map(col => (
           <div 
             key={col.id} 
             onDragOver={e => e.preventDefault()}
             onDrop={e => handleDrop(e, col.id)}
             className={`w-[85vw] md:w-[320px] snap-center shrink-0 flex flex-col rounded-[32px] overflow-hidden bg-black/40 border border-white/5 shadow-2xl h-full`}
           >
             <div className={`${col.color} ${col.text} p-5 flex justify-between items-center`}>
                <span className="font-bold text-[11px] tracking-widest uppercase">{col.title}</span>
                <button onClick={() => handleAdd(col.id)} className="p-2 hover:bg-black/20 rounded-xl transition-all"><Plus size={16}/></button>
             </div>
             
             <div className="p-5 flex flex-col gap-4 overflow-y-auto custom-scrollbar flex-1 min-h-[500px] border-t border-black/50">
                {orders.filter(o => o.status === col.id).map(order => {
                  const isOverdue = new Date(order.dueDate) < new Date() && order.status !== 'concluido';
                  return (
                  <div 
                    key={order.id}
                    onClick={() => setActiveOrder(order)}
                    draggable
                    onDragStart={(e) => { e.dataTransfer.setData("orderId", order.id); }}
                    className={`p-6 rounded-2xl border cursor-pointer hover:-translate-y-1 transition-all group ${isOverdue ? 'bg-red-900/10 border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.2)]' : 'bg-[#18181b] border-white/10 hover:border-blue-500/30 shadow-lg'}`}
                  >
                     {order.attachments && order.attachments.length > 0 && order.attachments[0].match(/\.(jpg|jpeg|png|gif|webp)$/i) && (
                       <div className="w-full aspect-video rounded-xl overflow-hidden mb-4 border border-white/5">
                          <img src={order.attachments[0]} className="w-full h-full object-cover" />
                       </div>
                     )}
                     <div className="flex items-center justify-between mb-3 border-b border-white/5 pb-3">
                        <span className={`text-[10px] font-black uppercase tracking-widest leading-none ${isOverdue ? 'text-red-400' : 'text-blue-400'}`}>Pedido Interno</span>
                        {isOverdue && <span className="text-[9px] font-black text-white bg-red-600 px-2 py-0.5 rounded-md animate-pulse shadow-[0_0_10px_rgba(220,38,38,0.8)] border border-red-400">ATRASADO</span>}
                     </div>
                     <p className={`text-sm font-bold mb-2 line-clamp-2 ${order.status === 'concluido' ? 'text-zinc-500 line-through' : 'text-white'}`}>{order.title}</p>
                     <p className="text-xs text-zinc-400 mb-6 font-medium line-clamp-1">{order.customer}</p>
                     
                     <div className="flex items-center justify-between pt-4 border-t border-white/5">
                       <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-black uppercase tracking-widest ${isOverdue ? 'text-red-500' : 'text-zinc-500'}`}>Prazo: {order.dueDate}</span>
                          {order.attachments && order.attachments.length > 0 && <Paperclip size={10} className="text-blue-400" />}
                       </div>
                       <button onClick={(e) => { e.stopPropagation(); handleDeleteOrder(order.id); }} className="p-1.5 text-red-500 opacity-0 group-hover:opacity-100 hover:scale-110 transition-all rounded-lg bg-red-500/10"><Trash2 size={14}/></button>
                     </div>
                  </div>
                )})}
                
                {orders.filter(o => o.status === col.id).length === 0 && (
                   <div className="w-full border-2 border-dashed border-white/5 bg-transparent h-24 rounded-2xl flex flex-col items-center justify-center text-zinc-700 pointer-events-none mt-2">
                       Aguardando Arraste...
                   </div>
                )}
             </div>
           </div>
        ))}
      </div>

      {/* MODAL DE EDIÇÃO DE ORDEM */}
      <AnimatePresence>
        {activeOrder && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setActiveOrder(null)} className="absolute inset-0 bg-black/90 backdrop-blur-xl" />
            <motion.div initial={{ scale: 0.9, opacity: 0, y: 50 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 50 }} className="relative w-full max-w-xl bg-[#0d0d0f] border border-blue-500/20 rounded-[48px] shadow-[0_0_40px_rgba(59,130,246,0.1)] p-12 flex flex-col">
              <div className="flex justify-between items-center border-b border-white/5 pb-8 mb-8">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-600 rounded-2xl text-white shadow-lg"><Globe size={24} /></div>
                  <div>
                    <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Painel Administrativo</span>
                    <h3 className="text-2xl font-black text-white">Editar Pedido Site</h3>
                  </div>
                </div>
                <button onClick={() => setActiveOrder(null)} className="p-4 bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white rounded-3xl transition-all"><X size={20} /></button>
              </div>

              <div className="space-y-6 flex-1">
                <div>
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-3">Resumo / ID Produto</label>
                  <input value={activeOrder.title} onChange={e => setActiveOrder({...activeOrder, title: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white font-bold outline-none focus:border-blue-500/50" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-3">Nome do Cliente</label>
                  <input value={activeOrder.customer} onChange={e => setActiveOrder({...activeOrder, customer: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white outline-none focus:border-blue-500/50" />
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-3">Status Atual</label>
                    <div className="relative">
                      <select value={activeOrder.status} onChange={e => setActiveOrder({...activeOrder, status: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white outline-none focus:border-blue-500/50 appearance-none font-bold">
                        {SITE_ORDERS_COLUMNS.map(c => <option key={c.id} value={c.id} className="bg-[#121212]">{c.title}</option>)}
                      </select>
                      <MoreVertical size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-600 pointer-events-none" />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-3">Data Limite</label>
                    <input type="date" value={activeOrder.dueDate} onChange={e => setActiveOrder({...activeOrder, dueDate: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white outline-none focus:border-blue-500/50 font-bold" />
                  </div>
                </div>

                {/* ÁREA DE COLAGEM DE DADOS BRUTOS */}
                <div className="pt-6 border-t border-white/5">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-4">Dados Brutos do Pedido (Paste Area)</label>
                  <textarea 
                    value={activeOrder.notes || ""} 
                    onChange={e => setActiveOrder({...activeOrder, notes: e.target.value})} 
                    className="w-full bg-white/5 border border-white/10 rounded-3xl p-6 text-zinc-300 font-medium outline-none focus:border-blue-500/30 h-40 resize-none custom-scrollbar text-sm" 
                    placeholder="Cole aqui o texto completo vindo do site ou observações detalhadas..."
                  />
                  <p className="text-[9px] text-zinc-600 mt-2 italic px-2">* Este campo aceita qualquer volume de texto para facilitar a entrada manual antes da API.</p>
                </div>


                <div className="pt-6 border-t border-white/5 space-y-4">
                   <div className="flex justify-between items-center">
                     <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Anexos (Bordados/Fotos)</label>
                     <label className="cursor-pointer bg-white/5 hover:bg-white/10 px-4 py-2 rounded-xl border border-white/10 text-[10px] font-bold text-zinc-400 hover:text-white transition-all flex items-center gap-2">
                        <Paperclip size={14} /> Subir
                        <input type="file" className="hidden" onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          const fileExt = file.name.split('.').pop();
                          const fileName = `${Math.random()}.${fileExt}`;
                          const filePath = `orders/${fileName}`;
                          const { error } = await supabase.storage.from('attachments').upload(filePath, file);
                          if (error) return alert("Erro no upload");
                          const { data: { publicUrl } } = supabase.storage.from('attachments').getPublicUrl(filePath);
                          setActiveOrder({...activeOrder, attachments: [...(activeOrder.attachments || []), publicUrl]});
                        }} />
                     </label>
                   </div>
                   <div className="grid grid-cols-4 gap-3">
                      {activeOrder.attachments?.map((url: string, i: number) => (
                        <div key={i} className="aspect-square bg-white/5 rounded-xl border border-white/5 overflow-hidden group relative">
                           {url.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? <img src={url} className="w-full h-full object-cover" /> : <div className="w-full h-full flex flex-col items-center justify-center p-2 text-center text-[8px] text-zinc-500 font-bold leading-tight"><FileText size={16} className="mb-1"/> .{url.split('.').pop()}</div>}
                           <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-1 transition-all">
                              <a href={url} target="_blank" className="p-1 px-2 bg-white/10 rounded text-[9px] text-white">Ver</a>
                              <button onClick={() => setActiveOrder({...activeOrder, attachments: activeOrder.attachments?.filter((a:any) => a !== url)})} className="p-1 px-2 bg-red-600/20 rounded text-[9px] text-red-400">X</button>
                           </div>
                        </div>
                      ))}
                   </div>
                </div>
              </div>

              <div className="mt-12 pt-8 border-t border-white/5">
                <button 
                  onClick={async () => {
                    const updated = orders.map(o => o.id === activeOrder.id ? activeOrder : o);
                    setOrders(updated);
                    await supabase.from('site_orders').upsert(activeOrder);
                    setActiveOrder(null);
                  }}
                  className="w-full py-5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black uppercase tracking-widest text-sm shadow-[0_0_20px_rgba(37,99,235,0.4)] transition-all active:scale-95"
                >Salvar Pedido</button>

              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
