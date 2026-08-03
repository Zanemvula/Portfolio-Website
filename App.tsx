
import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { 
  Mail, 
  Linkedin, 
  CheckCircle2, 
  Calendar,
  ChevronRight,
  ArrowUp,
  Terminal as TerminalIcon,
  Cpu,
  Zap,
  Activity,
  Sun,
  Moon,
  ChevronDown,
  Phone,
  ExternalLink,
  FileText,
  Images as GalleryIcon,
  Play,
  Send,
  Loader2,
  ListFilter,
  ArrowRight
} from 'lucide-react';
import { HashRouter as Router, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { CASE_STUDIES, STACK, ACADEMICS, TIMELINE_EVENTS } from './constants';
import { CaseStudy, SkillCategory, Education, TimelineEvent, ProjectCategory } from './types';

const CALENDLY_URL = "https://calendly.com/ntsikagqiba/30min";
const PHONE_NUMBER = "081 538 6865";
const CV_URL = "https://ik.imagekit.io/93psan9kd/Ntsika%20Gqiba%20CV%20(1).pdf";

// Helper to optimize ImageKit URLs
const optimizeImage = (url: string, width?: number) => {
  if (!url || !url.includes('ik.imagekit.io')) return url;
  const separator = url.includes('?') ? '&' : '?';
  const params = [`tr=f-auto`];
  if (width) params.push(`w-${width}`);
  return `${url}${separator}${params.join(',')}`;
};

const Header: React.FC<{ theme: string; toggleTheme: () => void }> = ({ theme, toggleTheme }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const handleNavClick = (id: string) => {
    if (location.pathname === '/') {
      const element = document.getElementById(id);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      navigate('/', { state: { targetId: id } });
    }
  };

  const NavLink = ({ label, id }: { label: string, id: string }) => {
    return (
      <button 
        onClick={() => handleNavClick(id)} 
        className="hover:text-[var(--text-color)] transition-colors relative group bg-transparent border-none cursor-pointer p-0 font-inherit text-inherit uppercase tracking-[0.2em] font-bold"
      >
        [{label}]
      </button>
    );
  };

  return (
    <header className="fixed top-0 left-0 w-full z-50 bg-[var(--bg-color)]/80 backdrop-blur-md border-b border-[var(--border-color)] px-6 py-4 flex justify-between items-center transition-all">
      <Link to="/" className="font-bold tracking-tighter text-lg uppercase flex items-center gap-2 hover:opacity-70 transition-opacity">
        <Cpu size={18} />
        <span>NG_OPERATOR</span>
      </Link>
      <nav className="hidden lg:flex gap-8 text-[10px] font-mono uppercase tracking-[0.2em] font-bold text-neutral-500 items-center">
        <NavLink label="THESIS" id="hero" />
        <NavLink label="ROADMAP" id="roadmap" />
        <Link to="/projects" className={`hover:text-[var(--text-color)] transition-colors relative group ${location.pathname === '/projects' ? 'text-[var(--text-color)]' : ''}`}>[ARCHIVE]</Link>
        <NavLink label="STACK" id="stack" />
        <NavLink label="ACADEMICS" id="foundation" />
        <NavLink label="CONTACT" id="contact" />
      </nav>
      
      <div className="flex items-center gap-4">
        <button 
          onClick={toggleTheme}
          className="p-2 border border-[var(--border-color)] hover:bg-[var(--text-color)] hover:text-[var(--bg-color)] transition-all rounded-sm"
          aria-label="Toggle Theme"
        >
          {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
        </button>
        <a 
          href={CALENDLY_URL} 
          target="_blank" 
          rel="noreferrer"
          className="btn-operator-glitch bg-[var(--text-color)] text-[var(--bg-color)] px-5 py-2 font-bold text-[9px] uppercase tracking-[0.1em] transition-colors border border-[var(--text-color)]"
        >
          INITIATE_CALL
        </a>
      </div>
    </header>
  );
};

const CodeBlock: React.FC<{ code: string }> = ({ code }) => (
  <div className="bg-[var(--accent-color)] border border-[var(--border-color)] rounded-sm p-6 my-4 overflow-x-auto shadow-sm">
    <div className="flex gap-1.5 mb-4 opacity-30">
      <div className="w-1.5 h-1.5 rounded-full bg-[var(--text-color)]"></div>
      <div className="w-1.5 h-1.5 rounded-full bg-[var(--text-color)]"></div>
      <div className="w-1.5 h-1.5 rounded-full bg-[var(--text-color)]"></div>
    </div>
    <pre className="text-[10px] md:text-[11px] font-mono opacity-80 leading-relaxed text-[var(--text-color)]">
      <code>{code}</code>
    </pre>
  </div>
);

const BuildRequest: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    scope: ''
  });
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');

  // GOOGLE WEB APP URL HERE
  const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbw844ICAPt4D-qUK37rxamhv4i4QArG83eAnjubIVfWD98676H5JbtL4kQ-0f9Dt8IZUw/exec"; 

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('submitting');

    try {
      if (GOOGLE_SCRIPT_URL) {
        const params = new URLSearchParams();
        params.append('name', formData.name);
        params.append('email', formData.email);
        params.append('phone', formData.phone);
        params.append('scope', formData.scope);

        await fetch(GOOGLE_SCRIPT_URL, {
          method: 'POST',
          body: params,
          mode: 'no-cors',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        });
        
        setStatus('success');
        setFormData({ name: '', email: '', phone: '', scope: '' });
      } else {
        await new Promise(resolve => setTimeout(resolve, 2000));
        setStatus('success');
        setFormData({ name: '', email: '', phone: '', scope: '' });
      }
    } catch (error) {
      console.error(error);
      setStatus('error');
    }
  }, [formData]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  }, []);

  return (
    <section id="build-request" className="py-24 px-6 lg:px-24 border-t border-[var(--border-color)] bg-[var(--accent-color)]/20">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-16">
        <div className="lg:col-span-5">
          <h2 className="text-3xl md:text-5xl font-light uppercase tracking-tighter mb-6 leading-tight">
            Want me to build <br/> something for you?
          </h2>
          <p className="text-sm opacity-50 font-mono leading-relaxed mb-8">
            Deploy a request to the operations terminal. Define your parameters, and I will engineer the solution.
          </p>
          <div className="space-y-4 font-mono text-[10px] opacity-40 uppercase tracking-widest">
            <div className="flex items-center gap-3">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></span>
              SYSTEM_READY_FOR_INPUT
            </div>
            <div className="flex items-center gap-3">
              <span className="w-1.5 h-1.5 bg-[var(--text-color)] rounded-full opacity-50"></span>
              SECURE_TRANSMISSION_PROTOCOL
            </div>
          </div>
        </div>

        <div className="lg:col-span-7">
          <form onSubmit={handleSubmit} className="space-y-8 bg-[var(--bg-color)] p-8 md:p-12 border border-[var(--border-color)] shadow-xl relative overflow-hidden">
            {status === 'success' && (
              <div className="absolute inset-0 z-20 bg-[var(--bg-color)] flex flex-col items-center justify-center text-center p-8 animate-in fade-in">
                <CheckCircle2 size={48} className="text-emerald-400 mb-4" />
                <h3 className="text-xl font-bold uppercase tracking-tight mb-2">Transmission Received</h3>
                <p className="opacity-50 text-sm font-mono">I will analyze your request and initiate contact shortly.</p>
                <button 
                  type="button" 
                  onClick={() => setStatus('idle')}
                  className="mt-8 text-[10px] uppercase font-bold tracking-widest border-b border-[var(--text-color)] pb-1 hover:opacity-50"
                >
                  Send Another Request
                </button>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label htmlFor="name" className="text-[9px] font-bold uppercase tracking-widest opacity-40">Name</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full bg-transparent border-b border-[var(--border-color)] py-3 text-sm focus:outline-none focus:border-[var(--text-color)] transition-colors rounded-none placeholder:opacity-20"
                  placeholder="JOHN DOE"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="email" className="text-[9px] font-bold uppercase tracking-widest opacity-40">Email</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full bg-transparent border-b border-[var(--border-color)] py-3 text-sm focus:outline-none focus:border-[var(--text-color)] transition-colors rounded-none placeholder:opacity-20"
                  placeholder="JOHN@EXAMPLE.COM"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="phone" className="text-[9px] font-bold uppercase tracking-widest opacity-40">Phone</label>
              <input
                type="tel"
                id="phone"
                name="phone"
                required
                value={formData.phone}
                onChange={handleChange}
                className="w-full bg-transparent border-b border-[var(--border-color)] py-3 text-sm focus:outline-none focus:border-[var(--text-color)] transition-colors rounded-none placeholder:opacity-20"
                placeholder="+27 00 000 0000"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="scope" className="text-[9px] font-bold uppercase tracking-widest opacity-40">Project Details</label>
              <textarea
                id="scope"
                name="scope"
                required
                rows={4}
                value={formData.scope}
                onChange={handleChange}
                className="w-full bg-transparent border-b border-[var(--border-color)] py-3 text-sm focus:outline-none focus:border-[var(--text-color)] transition-colors rounded-none resize-none placeholder:opacity-20"
                placeholder="DESCRIBE THE SYSTEM ARCHITECTURE OR PROBLEM SET..."
              />
            </div>

            <div className="pt-4">
              <button 
                type="submit" 
                disabled={status === 'submitting'}
                className="w-full bg-[var(--text-color)] text-[var(--bg-color)] py-4 font-bold text-[11px] uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:opacity-80 transition-all active:translate-y-px disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {status === 'submitting' ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    TRANSMITTING...
                  </>
                ) : (
                  <>
                    <Send size={16} />
                    EXECUTE_REQUEST
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
};

const Roadmap: React.FC<{ events: TimelineEvent[] }> = ({ events }) => {
  const [activeId, setActiveId] = useState<string>(events.length > 0 ? events[0].id : "");
  
  const activeEvent = useMemo(() => events.find(e => e.id === activeId), [events, activeId]);

  const handleEventSelect = useCallback((eventId: string) => {
    setActiveId(eventId);
  }, []);

  return (
    <section id="roadmap" className="py-24 px-6 lg:px-24 border-b border-[var(--border-color)]">
      <div className="max-w-7xl mx-auto">
        <div className="mb-16">
          <h2 className="text-2xl md:text-4xl font-light uppercase tracking-tighter mb-4">Operational_Roadmap</h2>
          <p className="opacity-40 font-mono text-[9px] uppercase tracking-widest">Growth_Architecture_Log_v2.5</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          <div className="lg:col-span-4 relative">
            <div className="absolute left-3 top-0 bottom-0 w-px bg-[var(--border-color)]" />
            <div className="space-y-3">
              {events.map((event) => (
                <button
                  key={event.id}
                  onClick={() => handleEventSelect(event.id)}
                  className={`relative w-full text-left pl-10 py-3 transition-all group ${
                    activeId === event.id ? 'opacity-100' : 'opacity-30 hover:opacity-60'
                  }`}
                >
                  <div className={`absolute left-[10px] top-1/2 -translate-y-1/2 w-2 h-2 rounded-full border border-[var(--text-color)] transition-all ${
                    activeId === event.id ? 'bg-[var(--text-color)] scale-125' : 'bg-transparent'
                  }`} />
                  <div className="font-mono text-[8px] opacity-40 mb-1">{event.date}</div>
                  <h3 className={`text-xs font-bold uppercase tracking-tight ${activeId === event.id ? 'opacity-100' : 'opacity-80'}`}>
                    {event.label}
                  </h3>
                </button>
              ))}
            </div>
          </div>

          <div className="lg:col-span-8">
            {activeEvent ? (
              <div className="bg-[var(--accent-color)] border border-[var(--border-color)] p-8 md:p-12 min-h-[400px] flex flex-col justify-between shadow-sm animate-in fade-in duration-300">
                <div>
                  <div className="flex justify-between items-start mb-10">
                    <span className="font-mono text-[8px] uppercase tracking-widest border border-[var(--border-color)] px-2 py-1">
                      EVENT_CLASS::{activeEvent.category}
                    </span>
                    <span className="font-mono text-[8px] font-bold opacity-30">{activeEvent.date}</span>
                  </div>
                  
                  <h3 className="text-xl md:text-2xl font-light uppercase mb-6 tracking-tight">
                    {activeEvent.label}
                  </h3>
                  
                  <p className="text-sm opacity-60 leading-relaxed mb-10 max-w-xl font-light">
                    {activeEvent.description}
                  </p>

                  <div className="space-y-4">
                    <h4 className="font-mono text-[8px] uppercase tracking-widest border-b border-[var(--border-color)] pb-2 mb-4 opacity-30">Operational_Outputs</h4>
                    {activeEvent.details.map((detail, i) => (
                      <div key={i} className="flex gap-4 items-start group">
                        <ChevronRight size={12} className="mt-1 shrink-0 opacity-20 group-hover:opacity-100 transition-opacity" />
                        <span className="text-[11px] opacity-80 uppercase tracking-tighter leading-snug">{detail}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-[400px] flex items-center justify-center opacity-30 font-mono text-[10px]">
                LOADING_TIMELINE_DATA...
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

const SystemsPreview: React.FC = () => {
  // Take top 2 items for preview
  const previewItems = CASE_STUDIES.slice(0, 2);

  return (
    <section id="systems" className="py-24 px-6 lg:px-24 bg-[var(--accent-color)]/30 border-b border-[var(--border-color)]">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-16 gap-6">
          <div>
            <h2 className="text-2xl md:text-4xl font-light uppercase tracking-tighter mb-2">Selected_Systems</h2>
            <p className="opacity-40 font-mono text-[9px] uppercase tracking-widest">Classified_Preview // Recent_Deployments</p>
          </div>
          <Link 
            to="/projects"
            className="group flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest border border-[var(--text-color)] px-6 py-3 hover:bg-[var(--text-color)] hover:text-[var(--bg-color)] transition-all"
          >
            Access_Full_Archive
            <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {previewItems.map((study) => (
            <div key={study.id} className="group relative border border-[var(--border-color)] bg-[var(--bg-color)] p-8 hover:border-[var(--text-color)] transition-colors">
              <div className="flex items-center justify-between mb-8">
                <span className="font-mono text-[9px] opacity-30 border border-[var(--border-color)] px-2 py-1 uppercase">{study.category}</span>
                <span className="font-mono text-[9px] font-bold opacity-20">SYS_ID_{study.id}</span>
              </div>
              
              <h3 className="text-xl font-light uppercase tracking-tight mb-4 group-hover:underline decoration-1 underline-offset-4">{study.title}</h3>
              <p className="text-sm opacity-50 leading-relaxed mb-8 line-clamp-3">{study.friction}</p>
              
              <div className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-widest opacity-60 group-hover:opacity-100 transition-opacity">
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
                System_Online
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-12 text-center">
             <p className="font-mono text-[9px] opacity-30 mb-4">
              {CASE_STUDIES.length} SYSTEM_LOGS AVAILABLE IN ARCHIVE
             </p>
        </div>
      </div>
    </section>
  );
}

const ProjectCard = React.memo(({ study }: { study: CaseStudy }) => (
  <div className="group relative p-6 md:p-12 bg-[var(--bg-color)] border border-[var(--border-color)] transition-all duration-500 hover:scale-[1.01] hover:border-[var(--text-color)] hover:shadow-[0_0_30px_rgba(255,255,255,0.05)] light:hover:shadow-[0_0_30px_rgba(0,0,0,0.05)] overflow-hidden">
    <div className="absolute top-4 right-8 text-8xl font-mono font-bold opacity-[0.02] pointer-events-none select-none group-hover:opacity-[0.05] transition-opacity">
      {study.id}
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 relative z-10">
      <div className="lg:col-span-7">
        <div className="flex items-center gap-4 mb-8 flex-wrap">
          <span className="font-mono text-[10px] opacity-30 uppercase tracking-widest border border-[var(--border-color)] px-2 py-1">DEPLOYMENT_{study.id}</span>
          <span className="font-mono text-[10px] text-[var(--bg-color)] bg-[var(--text-color)] font-bold uppercase tracking-widest px-2 py-1">{study.category}</span>
          <h3 className="text-2xl md:text-3xl font-light uppercase tracking-tight w-full mt-2">{study.title}</h3>
        </div>
        
        <div className="space-y-10">
          <div>
            <h4 className="font-mono text-[8px] uppercase tracking-widest opacity-40 mb-3 flex items-center gap-2">
              <span className="w-1 h-1 bg-red-500 rounded-full" /> 01_FRICTION
            </h4>
            <p className="opacity-60 leading-relaxed text-[14px] font-light">{study.friction}</p>
          </div>

          <div>
            <h4 className="font-mono text-[8px] uppercase tracking-widest opacity-40 mb-3 flex items-center gap-2">
              <span className="w-1 h-1 bg-emerald-400 rounded-full" /> 02_ARCHITECTURE
            </h4>
            <ul className="space-y-4">
              {study.architecture.map((item, i) => (
                <li key={i} className="flex gap-4 group/item">
                  <ChevronRight size={14} className="opacity-20 mt-1 shrink-0 group-hover/item:opacity-100 transition-opacity" />
                  <span className="opacity-60 text-[14px] leading-relaxed font-light">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-mono text-[8px] uppercase tracking-widest opacity-40 mb-3 flex items-center gap-2">
              <span className="w-1 h-1 bg-blue-500 rounded-full" /> 03_OUTCOME
            </h4>
            <div className="p-6 border border-[var(--border-color)] flex flex-col items-start gap-6 bg-[var(--accent-color)] shadow-inner">
              <div className="flex items-start gap-4">
                <CheckCircle2 size={20} className="shrink-0 mt-0.5 text-emerald-400/80" />
                <p className="text-[12px] font-bold opacity-80 uppercase tracking-tight leading-relaxed">{study.outcome}</p>
              </div>
              
              <div className="flex flex-wrap gap-4 w-full">
                {study.deeperDiveUrl && (
                  <a 
                    href={study.deeperDiveUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full sm:w-auto px-6 py-4 bg-[var(--text-color)] text-[var(--bg-color)] font-mono text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-3 transition-all hover:opacity-80 active:translate-y-px"
                  >
                    <FileText size={14} />
                    VIEW_DEEPER_DIVE
                    <ExternalLink size={12} className="opacity-40" />
                  </a>
                )}
                
                {study.videoUrl && (
                  <a 
                    href={study.videoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full sm:w-auto px-6 py-4 border border-[var(--text-color)] text-[var(--text-color)] font-mono text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-3 transition-all hover:bg-[var(--text-color)] hover:text-[var(--bg-color)] active:translate-y-px"
                  >
                    <Play size={14} />
                    WATCH_DEMO
                    <ExternalLink size={12} className="opacity-40" />
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="lg:col-span-5 flex flex-col justify-center">
        <h4 className="font-mono text-[8px] uppercase tracking-widest opacity-40 mb-3 text-right">SYSTEM_DEBUG_ASSETS</h4>
        
        {study.gallery ? (
          <div className="mb-4 relative">
            <div className="flex overflow-x-auto gap-4 snap-x snap-mandatory hide-scrollbar pb-4 group/gallery">
              {study.gallery.map((imgUrl, idx) => (
                <div key={idx} className="min-w-[85%] md:min-w-[70%] snap-center aspect-video overflow-hidden border border-[var(--border-color)] bg-[var(--accent-color)]">
                  <img 
                    src={optimizeImage(imgUrl, 600)} 
                    alt={`${study.title} debug ${idx}`} 
                    loading="lazy"
                    className="w-full h-full object-cover grayscale opacity-60 group-hover/gallery:grayscale-0 group-hover/gallery:opacity-100 transition-all duration-700"
                  />
                </div>
              ))}
            </div>
            <div className="flex justify-between items-center mt-2 px-1">
              <div className="flex gap-1">
                {study.gallery.map((_, idx) => (
                  <div key={idx} className="w-1 h-1 rounded-full bg-[var(--text-color)] opacity-20" />
                ))}
              </div>
              <span className="font-mono text-[7px] opacity-30 flex items-center gap-1">
                <GalleryIcon size={8} /> SWIPE_TO_INSPECT
              </span>
            </div>
          </div>
        ) : (
          study.imageUrl && (
            <div className="mb-4 overflow-hidden border border-[var(--border-color)] aspect-video">
              <img 
                src={optimizeImage(study.imageUrl, 600)} 
                alt={study.title} 
                loading="lazy"
                className="w-full h-full object-cover grayscale opacity-50 group-hover:opacity-100 group-hover:grayscale-0 transition-all duration-700"
              />
            </div>
          )
        )}

        {study.codeSnippet && (
          <div className="transition-transform duration-500 group-hover:translate-x-1">
            <CodeBlock code={study.codeSnippet} />
          </div>
        )}
        <div className="mt-4 flex items-center justify-end gap-2 opacity-20">
          <Activity size={14} />
          <span className="font-mono text-[8px] uppercase tracking-[0.4em]">system_active</span>
        </div>
      </div>
    </div>
  </div>
));

const ProjectsPage: React.FC = () => {
  const [filter, setFilter] = useState<ProjectCategory | 'All'>('All');
  
  const categories: (ProjectCategory | 'All')[] = useMemo(() => 
    ['All', 'Intelligence', 'Engineering', 'Analytics', 'Automation', 'Strategy'], 
  []);

  const filteredStudies = useMemo(() => 
    filter === 'All' ? CASE_STUDIES : CASE_STUDIES.filter(s => s.category === filter),
  [filter]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="pt-32 pb-24 px-6 lg:px-24 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="mb-12">
           <h1 className="text-4xl md:text-6xl font-light uppercase tracking-tighter mb-6">Systems_Archive</h1>
           <p className="font-mono text-[10px] uppercase tracking-widest opacity-50 max-w-2xl leading-relaxed">
             Comprehensive log of deployed solutions. Filter by system architecture type below.
           </p>
        </div>

        <div className="flex overflow-x-auto pb-4 mb-12 gap-2 hide-scrollbar border-b border-[var(--border-color)] sticky top-20 bg-[var(--bg-color)]/95 backdrop-blur z-20 pt-4">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`px-4 py-2 text-[10px] font-bold uppercase tracking-widest border transition-all whitespace-nowrap ${
                filter === cat 
                  ? 'bg-[var(--text-color)] text-[var(--bg-color)] border-[var(--text-color)]' 
                  : 'bg-transparent text-[var(--text-color)] border-[var(--border-color)] hover:border-[var(--text-color)] opacity-60 hover:opacity-100'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="space-y-16 animate-in fade-in slide-in-from-bottom-8 duration-700">
          {filteredStudies.map(study => (
             <ProjectCard key={study.id} study={study} />
          ))}
        </div>
        
        {filteredStudies.length === 0 && (
          <div className="py-24 text-center opacity-30 font-mono text-[10px] uppercase tracking-widest">
            NO_SYSTEMS_FOUND_IN_CATEGORY
          </div>
        )}
      </div>
    </div>
  );
};

const Home: React.FC<{ theme: string; mousePos: {x: number, y: number} }> = ({ theme, mousePos }) => {
  const location = useLocation();

  useEffect(() => {
    if (location.state && (location.state as any).targetId) {
      const targetId = (location.state as any).targetId;
      const element = document.getElementById(targetId);
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
    }
  }, [location]);

  return (
    <>
      {/* Hero Section */}
      <section id="hero" className="min-h-screen flex flex-col justify-center px-6 lg:px-24 pt-24 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-1/3 h-full bg-[var(--text-color)] opacity-[0.02] -z-10 pointer-events-none skew-x-12" />
        
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center z-10">
          <div className="lg:col-span-7">
            <p className="font-mono text-[9px] tracking-[0.4em] opacity-40 mb-6 flex items-center gap-2">
              <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" />
              NTSIKA GQIBA // DIGITAL_OPERATOR
            </p>
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-light leading-[1] tracking-tighter mb-8 uppercase">
              Performance <br />
              Architect.
            </h1>
            <p className="text-base md:text-xl font-light max-w-xl opacity-60 leading-relaxed mb-10 tracking-tight">
              I bridge the gap between abstract marketing goals and technical infrastructure through fail-safe automation. I engineer the environments where digital performance succeeds.
            </p>
            <div className="flex flex-col sm:flex-row gap-6 mb-12">
              <a 
                href="#build-request"
                className="bg-[var(--text-color)] text-[var(--bg-color)] px-10 py-5 font-bold text-[11px] uppercase tracking-widest flex items-center justify-center gap-3 transition-all hover:opacity-80 active:translate-y-px shadow-xl"
              >
                <TerminalIcon size={14} />
                INITIATE_SESSION
              </a>
              <a 
                href={CV_URL} 
                target="_blank"
                rel="noreferrer"
                className="border border-[var(--border-color)] px-10 py-5 font-bold text-[11px] uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-[var(--text-color)] hover:text-[var(--bg-color)] transition-all active:translate-y-px"
              >
                <FileText size={14} />
                DOWNLOAD_CV
              </a>
            </div>
            <div className="border-l border-[var(--border-color)] pl-8 max-w-xl">
              <p className="opacity-40 text-[11px] leading-relaxed italic font-light">
                Technically fluent in AI-enabled workflow automation. Driven by a relentless pursuit of growth. I don't just manage campaigns; I build the environments in which they succeed.
              </p>
            </div>
          </div>

          <div className="lg:col-span-5 relative flex justify-center perspective-1000">
            <div 
              className="relative transition-transform duration-300 ease-out will-change-transform w-full max-w-md"
              style={{
                transform: `translate3d(${mousePos.x * 0.4}px, ${mousePos.y * 0.4}px, 0) rotateY(${mousePos.x * 0.2}deg) rotateX(${-mousePos.y * 0.2}deg)`,
                filter: theme === 'light' ? 'grayscale(1) contrast(1.1)' : 'grayscale(1) brightness(1.1) contrast(1.1)'
              }}
            >
              <div className="absolute inset-0 bg-emerald-400/5 blur-[100px] rounded-full animate-pulse -z-10" />
              <img 
                src={optimizeImage("https://ik.imagekit.io/93psan9kd/ChatGPT_Image_Dec_19__2025__02_49_43_PM-removebg-preview.png?updatedAt=1766154193111", 800)}
                alt="Digital Operator Portrait" 
                width="800"
                height="800"
                className="w-full h-auto relative z-10 opacity-80 group-hover:opacity-100 transition-opacity drop-shadow-[0_0_30px_rgba(255,255,255,0.05)]"
              />
            </div>
          </div>
        </div>

        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 animate-bounce opacity-20 hidden lg:block">
          <ChevronDown size={24} />
        </div>
      </section>

      {/* Roadmap */}
      <Roadmap events={TIMELINE_EVENTS} />

      {/* Systems Preview (Replaced full manifest) */}
      <SystemsPreview />

      {/* Tech Stack */}
      <section id="stack" className="py-24 px-6 lg:px-24">
        <div className="max-w-7xl mx-auto">
          <div className="mb-16">
            <h2 className="text-2xl md:text-4xl font-light uppercase tracking-tighter mb-4">Operational_Stack</h2>
            <p className="opacity-40 uppercase tracking-[0.3em] text-[8px]">Technical Infrastructure & Tooling Environment</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {STACK.map((cat, i) => (
              <div key={i} className="border-l border-[var(--border-color)] pl-6 py-2 group hover:border-[var(--text-color)] transition-colors">
                <h3 className="font-mono text-[9px] uppercase tracking-widest mb-8 opacity-30 flex items-center gap-2">
                  <Zap size={10} className="opacity-20" />
                  {cat.title}
                </h3>
                <ul className="space-y-5">
                  {cat.skills.map((skill, j) => (
                    <li key={j} className="text-[13px] font-bold uppercase tracking-tight opacity-50 group-hover:opacity-100 transition-opacity">
                      {skill}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Academic Foundation Section */}
      <section id="foundation" className="py-24 px-6 lg:px-24 border-t border-[var(--border-color)] bg-[var(--accent-color)]/10">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12">
          <div className="lg:col-span-5">
            <h2 className="text-3xl font-light uppercase tracking-tighter mb-4">Academic_Foundation</h2>
            <p className="text-sm opacity-40 font-light max-w-xs leading-relaxed">Rigorous technical grounding in marketing systems, analytics, and information architecture.</p>
          </div>
          <div className="lg:col-span-7 space-y-12">
            {ACADEMICS.map((edu, i) => (
              <div key={i} className="relative pl-10 border-l border-[var(--border-color)] py-2 group">
                <div className="absolute left-[-6px] top-4 w-3 h-3 rounded-full bg-[var(--text-color)] opacity-10 group-hover:opacity-100 group-hover:scale-110 transition-all" />
                <p className="font-mono text-[10px] opacity-40 mb-2 tracking-widest">{edu.period}</p>
                <h3 className="text-xl font-light uppercase tracking-tight mb-2 group-hover:translate-x-2 transition-transform">{edu.degree}</h3>
                <p className="text-sm opacity-60 italic font-light">{edu.institution}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Build Request Form Section */}
      <BuildRequest />

      {/* Contact Section */}
      <section id="contact" className="py-32 px-6 lg:px-24 border-t border-[var(--border-color)]">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-4xl md:text-6xl font-light uppercase tracking-tighter mb-8 leading-[1.1]">
                Scale Your <br /> Performance <br /> Architecture.
              </h2>
              <p className="text-base md:text-lg opacity-50 mb-12 max-w-lg leading-relaxed tracking-tight font-light">
                Ready to initiate deployment? I am available for global digital operations and systems architecture.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-6">
                <a 
                  href={CALENDLY_URL} 
                  target="_blank" 
                  rel="noreferrer"
                  className="bg-[var(--text-color)] text-[var(--bg-color)] px-10 py-6 font-bold text-[11px] uppercase tracking-[0.2em] flex items-center justify-center gap-3 transition-all hover:translate-y-[-4px] active:translate-y-px shadow-2xl"
                >
                  <Calendar size={18} />
                  SCHEDULE_BRIEF
                </a>
                <a 
                  href={`tel:${PHONE_NUMBER.replace(/\s/g, '')}`} 
                  className="border border-[var(--border-color)] px-10 py-6 font-bold text-[11px] uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-[var(--text-color)] hover:text-[var(--bg-color)] transition-all active:translate-y-px"
                >
                  <Phone size={18} />
                  DIAL_OPERATOR
                </a>
              </div>
            </div>
            
            <div className="space-y-8">
              <div className="p-10 border border-[var(--border-color)] bg-[var(--bg-color)] shadow-sm hover:border-[var(--text-color)] transition-all duration-500 hover:shadow-2xl">
                <h3 className="font-mono text-[9px] uppercase tracking-[0.4em] mb-12 opacity-30">Active_Communication_Ports</h3>
                <div className="space-y-10">
                   <div className="flex items-center gap-8 group/link">
                      <div className="p-4 bg-[var(--accent-color)] rounded-sm group-hover/link:bg-[var(--text-color)] group-hover/link:text-[var(--bg-color)] transition-colors">
                        <Mail size={20} />
                      </div>
                      <div>
                        <p className="text-[8px] font-mono opacity-30 uppercase tracking-[0.3em] mb-1">SMTP_PROTOCOL</p>
                        <a href="mailto:ntsikagqiba@gmail.com" className="text-[14px] font-bold uppercase tracking-tighter opacity-70 hover:opacity-100 transition-opacity">ntsikagqiba@gmail.com</a>
                      </div>
                   </div>
                   <div className="flex items-center gap-8 group/link">
                      <div className="p-4 bg-[var(--accent-color)] rounded-sm group-hover/link:bg-[var(--text-color)] group-hover/link:text-[var(--bg-color)] transition-colors">
                        <Linkedin size={20} />
                      </div>
                      <div>
                        <p className="text-[8px] font-mono opacity-30 uppercase tracking-[0.3em] mb-1">NETWORK_HUB</p>
                        <a href="https://linkedin.com/in/Ntsika-Gqiba" target="_blank" rel="noreferrer" className="text-[14px] font-bold uppercase tracking-tighter opacity-70 hover:opacity-100 transition-opacity">@Ntsika-Gqiba</a>
                      </div>
                   </div>
                   <div className="flex items-center gap-8 group/link">
                      <div className="p-4 bg-[var(--accent-color)] rounded-sm group-hover/link:bg-[var(--text-color)] group-hover/link:text-[var(--bg-color)] transition-colors">
                        <Phone size={20} />
                      </div>
                      <div>
                        <p className="text-[8px] font-mono opacity-30 uppercase tracking-[0.3em] mb-1">PHONE_DIRECT</p>
                        <a href={`tel:${PHONE_NUMBER.replace(/\s/g, '')}`} className="text-[14px] font-bold uppercase tracking-tighter opacity-70 hover:opacity-100 transition-opacity">{PHONE_NUMBER}</a>
                      </div>
                   </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

const Footer: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleNavClick = (id: string) => {
    if (location.pathname === '/') {
      const element = document.getElementById(id);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      navigate('/', { state: { targetId: id } });
    }
  };

  return (
    <footer className="py-16 px-6 lg:px-24 border-t border-[var(--border-color)] bg-[var(--bg-color)]">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
        <div className="font-mono text-[9px] font-bold text-neutral-500 uppercase tracking-[0.5em]">
          &copy; {new Date().getFullYear()} // SYSTEMS_OPERATOR // NTSIKA_GQIBA
        </div>
        <div className="flex gap-12 font-mono text-[9px] font-bold text-neutral-500 uppercase tracking-widest">
          <Link to="/" className="hover:text-[var(--text-color)] transition-colors">HOME</Link>
          <Link to="/projects" className="hover:text-[var(--text-color)] transition-colors">ARCHIVE</Link>
          <button 
            onClick={() => handleNavClick('contact')} 
            className="hover:text-[var(--text-color)] transition-colors bg-transparent border-none cursor-pointer p-0 font-inherit text-[9px] font-bold uppercase tracking-widest text-neutral-500"
          >
            CONTACT
          </button>
        </div>
      </div>
    </footer>
  );
};

const App: React.FC = () => {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleScroll = () => setShowScrollTop(window.scrollY > 400);
    
    let frameId: number;
    const handleMouseMove = (e: MouseEvent) => {
      if (frameId) cancelAnimationFrame(frameId);
      
      frameId = requestAnimationFrame(() => {
        const { innerWidth, innerHeight } = window;
        const x = (e.clientX / innerWidth - 0.5) * 30;
        const y = (e.clientY / innerHeight - 0.5) * 30;
        setMousePos({ x, y });
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('mousemove', handleMouseMove);
      if (frameId) cancelAnimationFrame(frameId);
    };
  }, []);

  useEffect(() => {
    document.documentElement.className = theme === 'light' ? 'light-theme' : '';
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  return (
    <Router>
      <div className="min-h-screen transition-colors duration-400 font-light overflow-x-hidden selection-invert flex flex-col">
        <Header theme={theme} toggleTheme={toggleTheme} />

        <Routes>
          <Route path="/" element={<Home theme={theme} mousePos={mousePos} />} />
          <Route path="/projects" element={<ProjectsPage />} />
        </Routes>

        <Footer />

        {/* PERSISTENT FLOATING CONTROLS */}
        <div className="fixed bottom-8 left-0 right-0 px-8 flex justify-end items-end pointer-events-none z-50">
          <div className="flex flex-col gap-4 pointer-events-auto">
            {showScrollTop && (
              <button 
                onClick={scrollToTop}
                className="bg-[var(--bg-color)] border border-[var(--border-color)] text-[var(--text-color)] p-4 rounded-sm shadow-2xl hover:bg-[var(--text-color)] hover:text-[var(--bg-color)] transition-all flex items-center justify-center animate-in fade-in slide-in-from-bottom-4"
                title="UPSTREAM"
              >
                <ArrowUp size={20} />
              </button>
            )}
          </div>
        </div>
      </div>
    </Router>
  );
};

export default App;
