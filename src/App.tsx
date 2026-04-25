/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Terminal as TerminalIcon, ShieldCheck, Search, Database, Globe, User, Activity, AlertTriangle, ChevronRight, Cpu } from 'lucide-react';
import { generateOSINTReport, OSINTReport } from './services/geminiService';
import { cn } from './lib/utils';

interface LogEntry {
  id: string;
  type: 'info' | 'warn' | 'error' | 'success' | 'command';
  text: string;
  timestamp: string;
}

type Language = 'fr' | 'en';

const translations = {
  fr: {
    title: "ShadowScan v2.0",
    subtitle: "COUCHE OSINT // IDENTITÉ CYBER",
    encryption: "CHIFFREMENT: AES-256",
    nodes: "NŒUDS: 14,892 ACTIFS",
    status: "ÉTAT: ",
    operational: "OPÉRATIONNEL",
    cliHeader: "Interface de Commande",
    placeholder: "Entrez cible, alias ou IP...",
    busy: "SCAN_EN_COURS...",
    resultsHeader: "JOURNAL_DES_RÉSULTATS",
    monitorHeader: "MONITEUR_SYSTÈME",
    footprint: "EMPREINTE_NUMÉRIQUE",
    techSpec: "SPÉCIFICATIONS_TECHNIQUES",
    awaiting: "En attente de triangulation",
    purge: "Purger_le_Dossier",
    bioHeader: "DÉTAILS_BIO_TRIANGULÉS",
    jobLabel: "PROFESSION",
    addressLabel: "ADRESSE_PHYSIQUE",
    phonesLabel: "NUMÉROS_TEL",
    emailsLabel: "COURRIELS",
    socialHeader: "GRAPH_RÉSEAUX_SOCIAUX",
    lastSeenNetLabel: "VU_RÉSEAU",
    lastSeenCamLabel: "VU_CAMÉRA",
    surveillanceHeader: "CAPTURES_SURVEILLANCE",
    ipLabel: "ADRESSE_IP",
    host: "HÔTE: NŒUD_AIS_01",
    authOnly: "ACCÈS AUTORISÉ UNIQUEMENT",
    helpCmds: [
      "COMMANDES DISPONIBLES:",
      "  scan [sujet] - LANCER LE SCAN SUR LA CIBLE",
      "  clear        - EFFACER LE TERMINAL",
      "  status       - VÉRIFIER L'INTÉGRITÉ DU SYSTÈME",
      "  whoami       - AFFICHER VOTRE IDENTITÉ",
      "NL SUPPORTÉ: 'trouve info sur...', 'cherche...', 'scanne...'"
    ],
    startup: [
      "MOTEUR OSINT SHADOWSCAN v2.0.4",
      "ÉTABLISSEMENT DU TUNNEL SÉCURISÉ (ONION-v3)... FAIT",
      "CHARGEMENT INDEX_BREACH_DB [3.4PB]... CHARGÉ",
      "SYSTÈME INITIALISÉ. EN ATTENTE DE COMMANDE...",
      "TAPEZ 'help' POUR LES COMMANDES."
    ]
  },
  en: {
    title: "ShadowScan v2.0",
    subtitle: "OSINT LAYER // CYBER IDENTITY",
    encryption: "ENCRYPTION: AES-256",
    nodes: "NODES: 14,892 ACTIVE",
    status: "STATUS: ",
    operational: "OPERATIONAL",
    cliHeader: "Command Line Interface",
    placeholder: "Enter target, alias or IP...",
    busy: "SYSTEM_SCANNING...",
    resultsHeader: "SEARCH_RESULTS_LOG",
    monitorHeader: "SYSTEM_MONITOR",
    footprint: "DIGITAL_FOOTPRINT",
    techSpec: "TECHNICAL_SPEC",
    awaiting: "Awaiting Data Triangulation",
    purge: "Purge_Dossier_Intel",
    bioHeader: "TRIANGULATED_BIO_DETAILS",
    jobLabel: "PROFESSION",
    addressLabel: "PHYSICAL_ADDRESS",
    phonesLabel: "PHONE_NUMBERS",
    emailsLabel: "EMAIL_ADDRESSES",
    socialHeader: "SOCIAL_GRAPH_NODES",
    lastSeenNetLabel: "LAST_SEEN_NET",
    lastSeenCamLabel: "LAST_SEEN_CAM",
    surveillanceHeader: "SURVEILLANCE_CAPTURES",
    ipLabel: "IP_ADDRESS",
    host: "HOST: AIS_NODE_01",
    authOnly: "AUTHORIZED ACCESS ONLY",
    helpCmds: [
      "AVAILABLE COMMANDS:",
      "  scan [subject]  - BEGIN OSINT SCAN ON TARGET",
      "  clear           - PURGE TERMINAL LOGS",
      "  status          - CHECK SYSTEM INTEGRITY",
      "  whoami          - DISPLAY CURRENT IDENTITY",
      "NL SUPPORT: 'find info on...', 'search...', 'scan...'"
    ],
    startup: [
      "SHADOWSCAN OSINT ENGINE v2.0.4",
      "ESTABLISHING SECURE TUNNEL (ONION-v3)... DONE",
      "LOADING BREACH_DB_INDEX [3.4PB]... LOADED",
      "SYSTEM INITIALIZED. WAITING FOR COMMAND...",
      "TYPE 'help' FOR AVAILABLE COMMANDS."
    ]
  }
};

export default function App() {
  const [lang, setLang] = useState<Language>('fr');
  const t = translations[lang];

  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [input, setInput] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [activeReport, setActiveReport] = useState<OSINTReport | null>(null);
  const logsEndRef = useRef<HTMLDivElement>(null);

  const addLog = (text: string, type: LogEntry['type'] = 'info') => {
    const newLog: LogEntry = {
      id: Math.random().toString(36).substring(7),
      type,
      text,
      timestamp: new Date().toLocaleTimeString(),
    };
    setLogs((prev) => [...prev, newLog]);
  };

  useEffect(() => {
    setLogs([]);
    t.startup.forEach((text, index) => {
      setTimeout(() => {
        addLog(text, index === 1 || index === 3 ? 'success' : 'info');
      }, index * 300);
    });
  }, [lang]);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const handleCommand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isScanning) return;

    const rawInput = input.trim();
    const cmd = rawInput.toLowerCase();
    setInput('');
    addLog(`> ${rawInput}`, 'command');

    if (cmd === 'help') {
      t.helpCmds.forEach(line => addLog(line, 'info'));
      return;
    }

    if (cmd === 'clear') {
      setLogs([]);
      setActiveReport(null);
      return;
    }

    if (cmd === 'status') {
      addLog(lang === 'fr' ? 'NŒUDS CORE : EN LIGNE' : 'CORE NODES: ONLINE', 'success');
      addLog(lang === 'fr' ? 'CHIFFREMENT PROXY : ACTIF (AES-256)' : 'PROXY ENCRYPTION: ACTIVE (AES-256)', 'success');
      return;
    }

    if (cmd === 'whoami') {
      addLog(lang === 'fr' ? 'IDENTITÉ : OPÉRATEUR ANONYME' : 'IDENTITY: ANONYMOUS OPERATOR', 'info');
      addLog('ACCESS LEVEL: ROOT (OMEGA)', 'warn');
      return;
    }

    const searchKeywords = lang === 'fr' 
      ? ['trouve', 'cherche', 'scanne', 'scan', 'info', 'recherche', 'localise']
      : ['find', 'search', 'scan', 'info', 'lookup', 'locate'];
    
    let subject = '';

    const cmdParts = cmd.split(' ');
    if (cmdParts[0] === 'scan') {
      subject = rawInput.substring(5).trim();
    } else {
      for (const keyword of searchKeywords) {
        if (cmd.startsWith(keyword + ' ')) {
          subject = rawInput.split(' ').slice(1).join(' ');
          const noiseWords = ['des', 'les', 'sur', 'infos', 'informations', 'information', 'target', 'de', 'la', 'du', 'the', 'on', 'for', 'about'];
          let subjectParts = subject.split(' ');
          while (subjectParts.length > 0 && noiseWords.includes(subjectParts[0].toLowerCase())) {
            subjectParts.shift();
          }
          subject = subjectParts.join(' ');
          break;
        }
      }
    }

    if (subject) {
      startScan(subject);
    } else {
      addLog(lang === 'fr' ? `ERR: COMMANDE NON RECONNUE. ESSAYEZ "scan ${rawInput}"` : `ERR: COMMAND NOT RECOGNIZED. TRY "scan ${rawInput}"`, 'error');
    }
  };

  const startScan = async (subject: string) => {
    setIsScanning(true);
    setActiveReport(null);
    addLog(lang === 'fr' ? `INITIALISATION SCAN MULTI-VECTEUR: ${subject.toUpperCase()}` : `INITIATING MULTI-VECTOR SCAN: ${subject.toUpperCase()}`, 'warn');
    
    const sequences = lang === 'fr' ? [
      { t: 'CHARGEMENT modules theHarvester & Hunter.io API...', s: 'info' },
      { t: 'REQUÊTE SOUS-DOMAINES via Sublist3r & DNSPython...', s: 'info' },
      { t: 'EXTRACTION GRAPH SOCIAL (LinkedIn/Twitter/FB)...', s: 'info' },
      { t: 'EXTRACTION MÉTADONNÉES via Exiftool...', s: 'info' },
      { t: 'RECHERCHE IMAGE INVERSÉE (Google Nodes)...', s: 'info' },
      { t: 'CONTOURNEMENT WAF... RÉUSSI', s: 'success' },
    ] : [
      { t: 'LOADING theHarvester & Hunter.io API modules...', s: 'info' },
      { t: 'QUERYING SUBDOMAINS via Sublist3r & DNSPython...', s: 'info' },
      { t: 'SCRAPING SOCIAL GRAPH (LinkedIn/Twitter/FB)...', s: 'info' },
      { t: 'EXTRACTING METADATA via Exiftool...', s: 'info' },
      { t: 'REVERSE IMAGE SEARCHING (Google Nodes)...', s: 'info' },
      { t: 'BYPASSING WAF... SUCCESS', s: 'success' },
    ];

    for (let i = 0; i < sequences.length; i++) {
      await new Promise(r => setTimeout(r, 400 + Math.random() * 300));
      addLog(sequences[i].t, sequences[i].s as any);
    }

    try {
      const report = await generateOSINTReport(subject);
      addLog(lang === 'fr' ? 'RÉCOLTE TERMINÉE. AGRÉGATION DU DOSSIER...' : 'DATA HARVESTING COMPLETE. AGGREGATING DOSSIER...', 'success');
      
      setTimeout(() => {
        setActiveReport(report);
        setIsScanning(false);
        addLog(lang === 'fr' ? `DOSSIER GÉNÉRÉ : ${report.entityName}` : `DOSSIER GENERATED: ${report.entityName}`, 'success');
      }, 1000);
    } catch (error) {
      addLog('CRITICAL ERROR', 'error');
      setIsScanning(false);
    }
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-terminal-bg p-6 font-mono crt overflow-hidden relative">
      <div className="dot-pattern" />
      <div className="scanline" />
      
      <header className="flex justify-between items-center border-b border-terminal-primary/30 pb-4 mb-6 z-10">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 bg-terminal-primary animate-pulse rounded-full shadow-[0_0_10px_#00f2ff]" />
          <div>
            <h1 className="text-xl font-bold tracking-[0.2em] uppercase flicker">{t.title}</h1>
            <p className="text-[10px] text-terminal-primary/50 tracking-widest">{t.subtitle}</p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="bg-black/40 border border-terminal-primary/20 p-1 flex gap-1 rounded">
            <button 
              onClick={() => setLang('fr')}
              className={cn("px-2 py-0.5 text-[10px] uppercase font-bold transition-all", lang === 'fr' ? "bg-terminal-primary text-terminal-bg" : "text-terminal-primary/40 hover:text-terminal-primary")}
            >FR</button>
            <button 
              onClick={() => setLang('en')}
              className={cn("px-2 py-0.5 text-[10px] uppercase font-bold transition-all", lang === 'en' ? "bg-terminal-primary text-terminal-bg" : "text-terminal-primary/40 hover:text-terminal-primary")}
            >EN</button>
          </div>

          <div className="hidden md:flex items-center gap-8 text-[10px] text-terminal-primary/60 tracking-tighter">
            <span>{t.encryption}</span>
            <span>{t.nodes}</span>
            <span className="flex items-center gap-2">
              {t.status} <span className="text-green-400 font-bold">{t.operational}</span>
            </span>
          </div>
        </div>
      </header>

      <main className="flex-1 grid grid-cols-12 gap-6 z-10 overflow-hidden">
        <section className="col-span-12 lg:col-span-8 flex flex-col gap-6 overflow-hidden">
          <div className="bg-terminal-primary/[0.02] border border-terminal-primary/10 p-6 rounded-lg shadow-inner">
            <div className="text-terminal-primary/40 mb-3 text-[10px] uppercase tracking-widest flex items-center gap-2">
              <TerminalIcon className="w-3 h-3" /> {t.cliHeader}
            </div>
            <form onSubmit={handleCommand} className="flex items-center bg-black/80 border border-terminal-primary/30 p-4 rounded shadow-[0_0_20px_rgba(0,242,255,0.05)] transition-all focus-within:border-terminal-primary/60">
              <span className="mr-3 text-terminal-primary/70 shrink-0">root@nexus:~#</span>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={isScanning}
                placeholder={isScanning ? t.busy : t.placeholder}
                className="bg-transparent outline-none w-full text-white cursor-text lowercase"
                autoFocus
              />
              <div className="w-2 h-5 bg-terminal-primary ml-1 animate-pulse shrink-0" />
            </form>
          </div>

          <div className="flex-1 bg-terminal-primary/[0.02] border border-terminal-primary/10 rounded-lg p-1 overflow-hidden flex flex-col">
            <div className="px-4 py-2 border-b border-terminal-primary/5 flex justify-between items-center bg-terminal-primary/[0.03]">
              <span className="text-[10px] text-terminal-primary/40 tracking-widest font-bold">{t.resultsHeader}</span>
              <div className="flex gap-1.5">
                {[1, 2, 3].map(i => <div key={i} className="w-1.5 h-1.5 rounded-full bg-terminal-primary/20" />)}
              </div>
            </div>
            
            <div className="flex-1 p-4 overflow-y-auto font-mono text-xs space-y-3 custom-scrollbar">
              {logs.map((log) => (
                <div key={log.id} className={cn("flex gap-4 p-2 transition-all border-l-2", log.type === 'command' ? "bg-terminal-primary/5 border-terminal-primary" : "border-transparent")}>
                  <span className="text-terminal-primary/40 text-[10px] pt-0.5 whitespace-nowrap min-w-[70px]">[{log.timestamp}]</span>
                  <span className={cn("break-all leading-relaxed", log.type === 'error' && "text-red-400", log.type === 'warn' && "text-yellow-400", log.type === 'success' && "text-green-400 font-bold", log.type === 'command' && "text-white font-bold italic", log.type === 'info' && "text-terminal-primary/70")}>
                    {log.text}
                  </span>
                </div>
              ))}
              <div ref={logsEndRef} />
            </div>
          </div>
        </section>

        <aside className="col-span-12 lg:col-span-4 flex flex-col gap-6 overflow-hidden">
          <div className="bg-terminal-primary/[0.03] border border-terminal-primary/10 rounded-lg p-5">
            <div className="text-[10px] font-bold mb-4 tracking-widest text-terminal-primary/60 flex items-center gap-2">
              <Activity className="w-3 h-3" /> {t.monitorHeader}
            </div>
            <div className="space-y-4">
              {[
                { label: 'CPU_LOAD', val: '82%', width: 'w-[82%]' },
                { label: 'D_WEB_TRAFFIC', val: '34%', width: 'w-[34%]' }
              ].map((stat, i) => (
                <div key={i} className="space-y-1.5">
                   <div className="flex justify-between text-[9px] tracking-widest">
                    <span className="opacity-40">{stat.label}</span>
                    <span className="text-terminal-primary">{stat.val}</span>
                  </div>
                  <div className="h-1 w-full bg-white/5 overflow-hidden rounded-full">
                    <motion.div initial={{ width: 0 }} animate={{ width: parseInt(stat.val) + '%' }} className="h-full bg-terminal-primary shadow-[0_0_10px_#00f2ff]" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="terminal-window flex-1 flex flex-col min-h-[300px]">
            <AnimatePresence mode="wait">
              {isScanning ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full flex flex-col items-center justify-center p-8 space-y-6">
                  <div className="relative">
                    <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 4, ease: "linear" }} className="w-20 h-20 border border-dashed border-terminal-primary/40 rounded-full" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Search className="w-6 h-6 text-terminal-primary animate-pulse" />
                    </div>
                  </div>
                  <div className="text-center space-y-3">
                    <h3 className="text-xs font-bold uppercase tracking-[0.3em] text-terminal-primary flicker">EXTRACTING_INTEL...</h3>
                  </div>
                </motion.div>
              ) : activeReport ? (
                <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="p-5 flex flex-col h-full overflow-y-auto custom-scrollbar">
                  <div className="mb-6 flex gap-4">
                    <div className="w-20 h-24 bg-terminal-primary/10 border border-terminal-primary/30 relative flex items-center justify-center overflow-hidden grayscale contrast-125">
                      {activeReport.visualData?.profileImageUrl ? (
                        <img 
                          src={activeReport.visualData.profileImageUrl} 
                          alt="Profile" 
                          className="w-full h-full object-cover opacity-60"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <User className="w-10 h-10 text-terminal-primary/20" />
                      )}
                      <div className="absolute inset-x-0 top-0 h-4 bg-terminal-primary/20 flex items-center justify-center">
                        <span className="text-[6px] tracking-widest font-black uppercase">Classified</span>
                      </div>
                      <div className="absolute inset-0 border-2 border-dashed border-terminal-primary/5 pointer-events-none" />
                      <div className="absolute bottom-1 right-1 w-2 h-2 bg-green-500/50 rounded-full animate-pulse" />
                    </div>
                    <div className="flex-1">
                      <div className="text-[9px] text-terminal-primary/40 uppercase mb-1">DATA_OBJECT</div>
                      <h2 className="text-2xl font-bold text-white uppercase tracking-tight leading-none mb-3">{activeReport.entityName}</h2>
                      <div className="flex flex-wrap gap-2">
                        <span className={cn("text-[9px] px-2 py-0.5 border font-bold uppercase", activeReport.threatLevel === 'CRITICAL' ? "border-red-500/50 text-red-400 bg-red-400/5" : activeReport.threatLevel === 'HIGH' ? "border-orange-500/50 text-orange-400 bg-orange-400/5" : "border-terminal-primary/40 text-terminal-primary/80 bg-terminal-primary/5")}>LVL: {activeReport.threatLevel}</span>
                        <span className="text-[9px] px-2 py-0.5 border border-terminal-primary/20 text-terminal-primary/50 uppercase italic">{activeReport.status}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6 flex-1">
                    {/* Bio Details */}
                    {activeReport.bio && (
                      <div className="space-y-3">
                        <h4 className="text-[9px] text-terminal-primary/30 uppercase font-black border-b border-terminal-primary/10 pb-1">{t.bioHeader}</h4>
                        <div className="grid grid-cols-1 gap-2 text-[11px]">
                          {activeReport.bio.jobTitle && <div className="flex justify-between border-b border-white/5 pb-1"><span className="opacity-40">{t.jobLabel}:</span> <span className="text-white">{activeReport.bio.jobTitle}</span></div>}
                          {activeReport.bio.physicalAddress && <div className="flex justify-between border-b border-white/5 pb-1"><span className="opacity-40">{t.addressLabel}:</span> <span className="text-white">{activeReport.bio.physicalAddress}</span></div>}
                          {activeReport.bio.phoneNumbers && activeReport.bio.phoneNumbers.length > 0 && <div className="flex justify-between border-b border-white/5 pb-1"><span className="opacity-40">{t.phonesLabel}:</span> <span className="text-white">{activeReport.bio.phoneNumbers.join(', ')}</span></div>}
                          {activeReport.bio.emails && activeReport.bio.emails.length > 0 && <div className="flex justify-between border-b border-white/5 pb-1"><span className="opacity-40">{t.emailsLabel}:</span> <span className="text-white break-all text-right max-w-[60%]">{activeReport.bio.emails.join(', ')}</span></div>}
                          {activeReport.bio.lastSeenNetwork && <div className="flex justify-between border-b border-terminal-primary/10 pb-1"><span className="text-blue-400 opacity-60">{t.lastSeenNetLabel}:</span> <span className="text-blue-300 font-bold">{activeReport.bio.lastSeenNetwork}</span></div>}
                          {activeReport.bio.lastSeenCamera && <div className="flex justify-between border-b border-red-900/40 pb-1"><span className="text-red-400 opacity-60">{t.lastSeenCamLabel}:</span> <span className="text-red-300 font-bold">{activeReport.bio.lastSeenCamera}</span></div>}
                        </div>
                      </div>
                    )}

                    {/* Social Graph */}
                    {activeReport.socialLinks && activeReport.socialLinks.length > 0 && (
                      <div className="space-y-3">
                        <h4 className="text-[9px] text-terminal-primary/30 uppercase font-black border-b border-terminal-primary/10 pb-1">{t.socialHeader}</h4>
                        <div className="space-y-2">
                          {activeReport.socialLinks.map((link, i) => (
                            <div key={i} className="bg-terminal-primary/5 p-2 border border-terminal-primary/10 rounded flex justify-between items-center">
                              <div className="flex flex-col">
                                <span className="text-[10px] font-bold text-white uppercase">{link.platform}</span>
                                <span className="text-[8px] text-terminal-primary/40 truncate max-w-[150px]">{link.url}</span>
                              </div>
                              <div className="text-right">
                                <span className="text-[8px] opacity-40 block uppercase">Activity</span>
                                <span className="text-[9px] text-green-400">{link.lastActivity}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {/* Surveillance Images */}
                    {activeReport.visualData?.surveillanceImageUrl && (
                      <div className="space-y-3">
                        <h4 className="text-[9px] text-terminal-primary/30 uppercase font-black border-b border-terminal-primary/10 pb-1">{t.surveillanceHeader}</h4>
                        <div className="relative group">
                          <div className="aspect-video bg-black border border-terminal-primary/20 overflow-hidden relative">
                            <img 
                              src={activeReport.visualData.surveillanceImageUrl} 
                              alt="Surveillance" 
                              className="w-full h-full object-cover opacity-50 grayscale hover:opacity-80 transition-opacity"
                              referrerPolicy="no-referrer"
                            />
                            <div className="absolute top-2 left-2 flex items-center gap-1.5">
                              <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-ping" />
                              <span className="text-[8px] font-bold text-red-500 uppercase tracking-tighter">REC // LIVE_FEED</span>
                            </div>
                            <div className="absolute bottom-2 right-2 text-[8px] text-terminal-primary/60 font-mono">
                              {activeReport.visualData.lastKnownCctvLocation || 'COORD_REDACTED'}
                            </div>
                            <div className="absolute inset-0 pointer-events-none">
                              <div className="w-full h-px bg-terminal-primary/10 absolute top-1/2 -translate-y-1/2" />
                              <div className="h-full w-px bg-terminal-primary/10 absolute left-1/2 -translate-x-1/2" />
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <div className="space-y-3">
                      <h4 className="text-[9px] text-terminal-primary/30 uppercase font-black border-b border-terminal-primary/10 pb-1">{t.footprint}</h4>
                      <ul className="space-y-2 text-[11px] leading-snug text-terminal-primary/80">
                        {activeReport.findings.map((finding, idx) => (
                          <li key={idx} className="flex gap-2">
                            <span className="text-terminal-primary/40">{" >> "}</span> {finding}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="space-y-3 p-3 bg-white/[0.02] border border-white/5 rounded">
                      <h4 className="text-[9px] text-terminal-primary font-bold uppercase flex items-center gap-1.5"><Cpu className="w-3 h-3" /> {t.techSpec}</h4>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-[10px]">
                        <div className="space-y-1">
                          <span className="opacity-30 uppercase block text-[8px]">{t.ipLabel}</span>
                          <span className="text-[#00f2ff88]">{activeReport.technicalBreakdown.ipAddress || 'TRACED_VIA_PROXY'}</span>
                        </div>
                        <div className="space-y-1">
                          <span className="opacity-30 uppercase block text-[8px]">Network Node</span>
                          <span className="text-[#00f2ff88]">{activeReport.technicalBreakdown.ipTraffic}</span>
                        </div>
                        <div className="space-y-1">
                          <span className="opacity-30 uppercase block text-[8px]">Encryption</span>
                          <span className="text-[#00f2ff88]">{activeReport.technicalBreakdown.encryptionMtd}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <button onClick={() => setActiveReport(null)} className="mt-6 w-full py-3 border border-terminal-primary/30 bg-terminal-primary/5 hover:bg-terminal-primary/20 text-[10px] font-bold tracking-[0.3em] uppercase transition-all shadow-[0_0_15px_rgba(0,242,255,0.05)]">
                    {t.purge}
                  </button>
                </motion.div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center p-8 opacity-20 pointer-events-none">
                  <Globe className="w-12 h-12 mb-4" />
                  <p className="text-[10px] uppercase tracking-[0.3em] text-center">{t.awaiting}</p>
                </div>
              )}
            </AnimatePresence>
          </div>
        </aside>
      </main>

      <footer className="mt-6 flex justify-between items-center text-[10px] text-terminal-primary/30 border-t border-terminal-primary/10 pt-4 z-10">
        <div className="flex gap-6 uppercase tracking-tighter">
          <span>{t.host}</span>
          <span>PROTOCOL: VOID_BRIDGE_v3.2</span>
          <span>NODE: UNKNOWN_PROXY</span>
        </div>
        <div className="flex items-center gap-2 font-bold flicker">
          <ShieldCheck className="w-3 h-3" />
          <span>{t.authOnly}</span>
        </div>
      </footer>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 2px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0, 242, 255, 0.1); }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(0, 242, 255, 0.3); }
      `}</style>
    </div>
  );
}
