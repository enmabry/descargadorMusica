'use client';

import { useRef, useState, useEffect } from 'react';
import { usePlayerStore } from '@/store/usePlayerStore';
import AudioEngine from '@/components/AudioEngine';
import Visualizer from '@/components/Visualizer';
import { motion, AnimatePresence } from 'framer-motion';

const MechanicalButton = ({ onClick, children, className = "", title = "", activeColor = "text-orange-500" }: any) => (
  <div className="flex flex-col items-center justify-end h-24 z-20 group">
    <button 
      onClick={onClick}
      title={title}
      className={`relative w-14 h-16 rounded-t-sm rounded-b-md bg-gradient-to-b from-zinc-600 to-zinc-800 border-x border-t border-zinc-500/50 border-b-2 border-b-black flex flex-col items-center justify-center shadow-[0_8px_0_#151515,0_15px_20px_rgba(0,0,0,0.8),inset_0_2px_2px_rgba(255,255,255,0.3),inset_0_-2px_4px_rgba(0,0,0,0.5)] active:shadow-[0_2px_0_#151515,0_5px_5px_rgba(0,0,0,0.9),inset_0_1px_1px_rgba(255,255,255,0.2),inset_0_-1px_2px_rgba(0,0,0,0.6)] active:translate-y-[6px] transition-all duration-75 select-none ${className}`}
    >
      <div className={`flex flex-col items-center justify-center transition-all duration-300 text-zinc-900 drop-shadow-[0_1px_1px_rgba(255,255,255,0.2)] group-hover:${activeColor} group-active:${activeColor} group-hover:drop-shadow-[0_0_8px_currentColor] group-active:drop-shadow-[0_0_12px_currentColor]`}>
        {children}
      </div>
    </button>
  </div>
);

export default function Home() {
  const { 
    tracks, 
    currentTrackIndex, 
    isPlaying, 
    loadFiles, 
    togglePlayPause, 
    nextTrack, 
    prevTrack,
  } = usePlayerStore();

  const [url, setUrl] = useState('');
  const [isEjected, setIsEjected] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState<number | null>(null);
  const [queueStatus, setQueueStatus] = useState<{current: number, total: number, title: string} | null>(null);
  const [isHelpMode, setIsHelpMode] = useState(false);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEjected && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 300); 
    }
  }, [isEjected]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      loadFiles(Array.from(e.target.files));
    }
  };

  const handleEject = () => setIsEjected(prev => !prev);
  const toggleHelp = () => setIsHelpMode(!isHelpMode);

  const handleRecord = async () => {
    if (!url) return;
    setIsEjected(false);
    setIsRecording(true);
    setDownloadProgress(0);
    
    const sessionId = crypto.randomUUID();
    const ws = new WebSocket(`ws://localhost:8000/ws/${sessionId}`);
    
    ws.onmessage = (event) => {
       try {
           const data = JSON.parse(event.data);
           if (data.status === 'downloading') {
              const pct = parseFloat(data.progress);
              if (!isNaN(pct)) setDownloadProgress(pct);
           } else if (data.status === 'processing') {
              setDownloadProgress(99);
           } else if (data.status === 'failed') {
              console.error("Error descargando: " + data.error);
           }
       } catch (e) {}
    };

    try {
        const extractRes = await fetch('http://localhost:8000/api/extract', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url })
        });
        
        const extractData = await extractRes.json();
        
        if (extractData.tracks && extractData.tracks.length > 0) {
            const total = extractData.tracks.length;
            
            for (let i = 0; i < total; i++) {
                const track = extractData.tracks[i];
                setQueueStatus({ current: i + 1, total, title: track.title });
                setDownloadProgress(0);
                
                const dlRes = await fetch('http://localhost:8000/api/download', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ url: track.url, session_id: sessionId })
                });
                
                if (dlRes.ok) {
                    const blob = await dlRes.blob();
                    const fileUrl = URL.createObjectURL(blob);
                    
                    usePlayerStore.setState(state => ({
                      tracks: [...state.tracks, {
                        id: crypto.randomUUID(),
                        name: track.title,
                        file: new File([blob], track.title + '.mp3', { type: 'audio/mpeg' }),
                        objectUrl: fileUrl
                      }],
                      currentTrackIndex: state.currentTrackIndex === null ? 0 : state.currentTrackIndex
                    }));
                    
                    const a = document.createElement('a');
                    a.href = fileUrl;
                    a.download = `${track.title}.mp3`;
                    a.click();
                }
            }
        }
    } catch (err) {
        console.error("Error en la orquestación:", err);
    } finally {
        ws.close();
        setDownloadProgress(null);
        setQueueStatus(null);
        setIsRecording(false);
        setUrl('');
    }
  };

  const currentTrack = currentTrackIndex !== null ? tracks[currentTrackIndex] : null;

  const renderProgressBar = (percent: number) => {
    const totalBlocks = 12;
    const filledBlocks = Math.floor((percent / 100) * totalBlocks);
    const emptyBlocks = totalBlocks - filledBlocks;
    return `[${'█'.repeat(filledBlocks)}${'░'.repeat(emptyBlocks)}] ${percent}%`;
  };

  return (
    <main className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center p-4">
      <AudioEngine />

      <div 
        className="relative w-full max-w-xl rounded-[2rem] p-8 flex flex-col gap-6 z-10"
        style={{
          background: 'linear-gradient(145deg, #2f3138, #18191d)',
          boxShadow: '15px 15px 40px #0a0b0c, -10px -10px 30px #2a2c33, inset 2px 2px 4px rgba(255,255,255,0.1), inset -3px -3px 6px rgba(0,0,0,0.6)',
          border: '1px solid #434752'
        }}
      >
        <div className="flex justify-between items-center px-2 relative">
          <h1 className="text-zinc-400/80 text-sm font-bold tracking-[0.4em] uppercase" style={{ textShadow: '1px 1px 0px rgba(0,0,0,0.9)' }}>
            Brykazaki <span className="font-light">Y2K</span>
          </h1>
          <span className="text-red-500/80 text-[10px] font-bold tracking-widest border border-red-500/20 px-2 py-0.5 rounded-sm shadow-[0_0_10px_rgba(239,68,68,0.2)]">
            AUTO REVERSE
          </span>
        </div>

        {/* LCD DISPLAY */}
        <div 
          className="mx-auto w-[80%] h-20 rounded p-2 flex flex-col justify-center overflow-hidden relative"
          style={{
            background: '#191f15',
            boxShadow: 'inset 4px 4px 10px #080a06, inset -2px -2px 5px rgba(255,255,255,0.03)',
            border: '3px solid #0d110b',
            borderBottomColor: '#2a3224'
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent pointer-events-none z-0" />
          
          <div className="font-mono text-green-500 pl-2 w-full h-full relative z-10" style={{ textShadow: '0 0 6px rgba(34,197,94,0.6)' }}>
            <div className="flex justify-between items-end mb-1">
              <p className="text-[9px] text-green-700 tracking-widest">
                {isHelpMode ? 'HELP MODE' : (isRecording && !queueStatus ? 'EXTRACTING' : (queueStatus ? `DOWNLOADING ${queueStatus.current}/${queueStatus.total}` : (currentTrackIndex !== null ? `TRACK ${(currentTrackIndex + 1).toString().padStart(2, '0')}` : 'STATUS')))}
              </p>
              <p className="text-[9px] text-green-700 pr-2">VOL: MAX</p>
            </div>

            {isHelpMode ? (
               <div className="overflow-hidden whitespace-nowrap w-3/4">
                 <p className="text-lg uppercase tracking-widest inline-block animate-[marquee_10s_linear_infinite]">
                   [REC]: DOWNLOAD URL --- [LOAD]: PLAY LOCAL FOLDER --- [EJECT]: OPEN TAPE TRAY
                 </p>
               </div>
            ) : isRecording && !queueStatus ? (
               <p className="text-lg text-green-400 uppercase tracking-widest animate-pulse">ANALYZING...</p>
            ) : queueStatus ? (
               <div>
                 <div className="overflow-hidden whitespace-nowrap w-3/4 mb-0.5">
                   <p className="text-[10px] uppercase tracking-widest inline-block animate-[marquee_10s_linear_infinite] opacity-80">
                     {queueStatus.title}
                   </p>
                 </div>
                 <p className="text-lg tracking-widest text-green-400 -mt-2">
                    {renderProgressBar(downloadProgress ?? 0)}
                 </p>
               </div>
            ) : currentTrack ? (
              <div className="overflow-hidden whitespace-nowrap w-3/4">
                <p className="text-lg uppercase tracking-widest inline-block animate-[marquee_10s_linear_infinite]">
                  {isPlaying ? '▶' : '⏸'} {currentTrack.name} • BRYKAZAKI Y2K • {currentTrack.name}
                </p>
              </div>
            ) : (
              <div className="overflow-hidden whitespace-nowrap w-3/4">
                <p className="text-lg text-green-700/60 uppercase tracking-widest inline-block animate-[marquee_10s_linear_infinite]">
                  [ SYSTEM IDLE ] INSERT TAPE OR PASTE URL TO BEGIN
                </p>
              </div>
            )}

            {/* ANALIZADOR DE ESPECTRO */}
            {!isHelpMode && <Visualizer />}
          </div>
        </div>

        {/* CASETERA (TAPE DECK) */}
        <div 
          className="relative w-full h-52 rounded-xl p-4 flex items-center justify-center mt-2 z-0 overflow-visible"
          style={{
            background: '#0d0d0f',
            boxShadow: 'inset 8px 8px 16px #050506, inset -8px -8px 16px #131417',
            border: '1px solid #000'
          }}
        >
          {/* Tapa Protectora */}
          <div 
            className="absolute inset-0 bg-black/40 border border-white/5 z-40 pointer-events-none transition-transform duration-500 origin-bottom"
            style={{ backdropFilter: 'blur(1px)', boxShadow: 'inset 0 10px 20px rgba(255,255,255,0.02)', transform: isEjected ? 'rotateX(-60deg)' : 'rotateX(0deg)' }}
          />
          
          <div className="absolute top-0 w-full h-10 bg-gradient-to-b from-green-500/10 to-transparent z-30 pointer-events-none opacity-50" />

          {/* EL CASETE */}
          <div style={{ perspective: '800px' }} className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
            <AnimatePresence>
              <motion.div 
                initial={{ y: 0, z: -20, rotateX: 0, scale: 0.95, boxShadow: "0px 0px 0px rgba(0,0,0,0)" }}
                animate={{ 
                  y: isEjected ? -120 : 0, 
                  z: isEjected ? 15 : -20,
                  rotateX: isEjected ? 8 : 0,
                  scale: isEjected ? 1.05 : 0.95,
                  boxShadow: isEjected ? "0px 25px 20px -10px rgba(0,0,0,0.7), 0px 50px 40px -20px rgba(0,0,0,0.5)" : "0px 0px 0px rgba(0,0,0,0)"
                }}
                transition={{ type: "spring", stiffness: 400, damping: 15, mass: 1 }}
                className="relative w-72 h-44 bg-cover bg-center rounded-md pointer-events-auto"
                style={{ backgroundImage: "url('/cassette.jpg')", zIndex: isEjected ? 50 : 10 }}
              >
                {/* SOLUCIÓN AL OVERFLOW DE LA URL */}
                <div className="absolute top-[34px] left-0 right-0 mx-auto h-8 w-[170px] flex items-center overflow-hidden">
                  <input 
                    ref={inputRef}
                    type="text" 
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    disabled={!isEjected}
                    className="w-full bg-transparent text-center font-handwriting text-[11px] text-blue-900 outline-none placeholder:text-blue-900/40 placeholder:italic font-mono truncate"
                    placeholder="Pegar URL aquí..."
                  />
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* BOTONERA MECÁNICA (ICONOS LED CUTOUT) */}
        <div className="flex justify-center gap-3 mt-2 px-4 pb-2 bg-zinc-800/20 mx-[-2rem] border-t border-black/40 shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)] rounded-b-[2rem] pt-4 relative z-50">
          
          <MechanicalButton onClick={handleRecord} className="hover:brightness-110" activeColor="text-red-500">
            <div className={`w-3 h-3 rounded-full bg-zinc-900 mb-1 transition-all duration-300 ${isRecording ? 'shadow-[0_0_15px_#ff0000,inset_0_1px_2px_white] bg-red-500 animate-pulse' : 'group-hover:bg-red-500 group-hover:shadow-[0_0_8px_#ff0000] group-active:bg-red-500 group-active:shadow-[0_0_15px_#ff0000] shadow-[inset_0_2px_4px_black]'}`} />
            <span className="text-[9px] font-bold tracking-widest text-zinc-500 group-hover:text-red-400 group-active:text-red-500 transition-colors">REC</span>
          </MechanicalButton>

          <MechanicalButton onClick={prevTrack}>
            <svg className="w-5 h-5 mb-1" fill="currentColor" viewBox="0 0 24 24"><path d="M11 19l-9-7 9-7v14zm11 0l-9-7 9-7v14z"/></svg>
            <span className="text-[9px] font-bold tracking-widest text-zinc-500 group-hover:text-orange-400 group-active:text-orange-500 transition-colors">REW</span>
          </MechanicalButton>
          
          <MechanicalButton onClick={togglePlayPause}>
             {isPlaying ? (
               <svg className="w-5 h-5 mb-1" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
             ) : (
               <svg className="w-5 h-5 mb-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
             )}
             <span className="text-[9px] font-bold tracking-widest text-zinc-500 group-hover:text-orange-400 group-active:text-orange-500 transition-colors">PLAY</span>
          </MechanicalButton>

          <MechanicalButton onClick={nextTrack}>
             <svg className="w-5 h-5 mb-1" fill="currentColor" viewBox="0 0 24 24"><path d="M13 19l9-7-9-7v14zM2 19l9-7-9-7v14z"/></svg>
             <span className="text-[9px] font-bold tracking-widest text-zinc-500 group-hover:text-orange-400 group-active:text-orange-500 transition-colors">FWD</span>
          </MechanicalButton>

          <MechanicalButton onClick={() => fileInputRef.current?.click()} activeColor="text-green-500">
             <svg className="w-5 h-5 mb-1" fill="currentColor" viewBox="0 0 24 24"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/></svg>
             <span className="text-[9px] font-bold tracking-widest text-zinc-500 group-hover:text-green-400 group-active:text-green-500 transition-colors">LOAD</span>
          </MechanicalButton>

          <MechanicalButton onClick={handleEject} activeColor="text-blue-500">
             <svg className="w-5 h-5 mb-1" fill="currentColor" viewBox="0 0 24 24"><path d="M5 17h14v2H5zm7-12L5.33 15h13.34z"/></svg>
             <span className="text-[9px] font-bold tracking-widest text-zinc-500 group-hover:text-blue-400 group-active:text-blue-500 transition-colors">EJECT</span>
          </MechanicalButton>
          
          {/* BOTÓN DE AYUDA (Reset oculto mode) */}
          <MechanicalButton onClick={toggleHelp} className="!w-10 !bg-zinc-800" activeColor="text-white">
             <svg className="w-4 h-4 mb-1" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z"/></svg>
             <span className="text-[7px] font-bold tracking-widest text-zinc-500 transition-colors mt-0.5">MODE</span>
          </MechanicalButton>

        </div>

      </div>

      <input 
          type="file" 
          multiple 
          ref={fileInputRef}
          accept="audio/*"
          onChange={handleFileChange}
          className="hidden"
      />
    </main>
  );
}
