'use client';

import { useRef, useState } from 'react';
import { usePlayerStore } from '@/store/usePlayerStore';
import AudioEngine from '@/components/AudioEngine';

const MechanicalButton = ({ onClick, children, className = "", title = "" }: any) => (
  <div className="flex flex-col items-center justify-end h-24">
    <button 
      onClick={onClick}
      title={title}
      className={`relative w-14 h-16 rounded-t-sm rounded-b-md bg-gradient-to-b from-zinc-600 to-zinc-800 border-x border-t border-zinc-500/50 border-b-2 border-b-black flex flex-col items-center justify-center text-zinc-300 shadow-[0_8px_0_#151515,0_15px_20px_rgba(0,0,0,0.8),inset_0_2px_2px_rgba(255,255,255,0.3),inset_0_-2px_4px_rgba(0,0,0,0.5)] active:shadow-[0_2px_0_#151515,0_5px_5px_rgba(0,0,0,0.9),inset_0_1px_1px_rgba(255,255,255,0.2),inset_0_-1px_2px_rgba(0,0,0,0.6)] active:translate-y-[6px] transition-all duration-75 select-none ${className}`}
    >
      {children}
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

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [url, setUrl] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      loadFiles(Array.from(e.target.files));
    }
  };

  const handleEject = () => {
    fileInputRef.current?.click();
  };

  const currentTrack = currentTrackIndex !== null ? tracks[currentTrackIndex] : null;

  return (
    <main className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center p-4">
      <AudioEngine />

      {/* CHASSIS / CARCASA PRINCIPAL */}
      <div 
        className="relative w-full max-w-xl rounded-[2rem] p-8 flex flex-col gap-6"
        style={{
          background: 'linear-gradient(145deg, #2f3138, #18191d)',
          boxShadow: '15px 15px 40px #0a0b0c, -10px -10px 30px #2a2c33, inset 2px 2px 4px rgba(255,255,255,0.1), inset -3px -3px 6px rgba(0,0,0,0.6)',
          border: '1px solid #434752'
        }}
      >
        {/* SERIGRAFÍA SUPERIOR */}
        <div className="flex justify-between items-center px-2">
          <h1 className="text-zinc-400/80 text-sm font-bold tracking-[0.4em] uppercase" style={{ textShadow: '1px 1px 0px rgba(0,0,0,0.9)' }}>
            Nakazaki <span className="font-light">Y2K</span>
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
          {/* Brillo del cristal del LCD */}
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent pointer-events-none" />
          
          <div className="font-mono text-green-500 pl-2" style={{ textShadow: '0 0 6px rgba(34,197,94,0.6)' }}>
            <div className="flex justify-between items-end mb-1">
                <p className="text-[9px] text-green-700 tracking-widest">TRACK {currentTrackIndex !== null ? (currentTrackIndex + 1).toString().padStart(2, '0') : '--'}</p>
                <p className="text-[9px] text-green-700 pr-2">VOL: MAX</p>
            </div>
            {currentTrack ? (
              <p className="text-lg truncate uppercase tracking-widest">
                {isPlaying ? '▶' : '⏸'} {currentTrack.name}
              </p>
            ) : (
              <p className="text-lg text-green-700/40 uppercase tracking-widest">NO TAPE</p>
            )}
          </div>
        </div>

        {/* CASETERA (TAPE DECK) */}
        <div 
          className="relative w-full h-52 rounded-xl p-4 flex items-center justify-center mt-2"
          style={{
            background: '#0d0d0f',
            boxShadow: 'inset 8px 8px 16px #050506, inset -8px -8px 16px #131417',
            border: '1px solid #000'
          }}
        >
          {/* Cristal protector de la casetera */}
          <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent rounded-xl pointer-events-none border border-white/5" />
          
          {/* EL CASETE (Donde va el Input) */}
          <div 
            className="w-3/4 h-32 rounded-lg relative flex items-center justify-center"
            style={{
              background: 'linear-gradient(180deg, #d4d4d4 0%, #e8e8e8 100%)',
              boxShadow: '0 15px 25px rgba(0,0,0,0.8), inset 0 2px 0 white, inset 0 -2px 5px rgba(0,0,0,0.3)',
              border: '1px solid #999'
            }}
          >
             {/* Agujeros giratorios del casete */}
             <div className="absolute left-6 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-zinc-900 border-[3px] border-zinc-300 shadow-[inset_0_3px_5px_black]" />
             <div className="absolute right-6 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-zinc-900 border-[3px] border-zinc-300 shadow-[inset_0_3px_5px_black]" />

             {/* Etiqueta de Papel con el Input Text */}
             <div className="absolute top-2 w-[70%] h-20 bg-amber-50 rounded border border-amber-200/50 flex items-center justify-center px-2 shadow-sm">
                <div className="w-full border-b border-blue-300/40 pb-1">
                    <input 
                        type="text"
                        placeholder="Escribir URL aquí..."
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        className="w-full bg-transparent text-center font-handwriting text-sm text-blue-900 outline-none placeholder:text-blue-900/30 placeholder:italic font-mono"
                    />
                </div>
             </div>
          </div>
        </div>

        {/* BOTONERA MECÁNICA */}
        <div className="flex justify-center gap-3 mt-2 px-4 pb-2 bg-zinc-800/20 mx-[-2rem] border-t border-black/40 shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)] rounded-b-[2rem] pt-4">
          
          <MechanicalButton className="text-red-500 hover:brightness-110">
            <div className="w-3.5 h-3.5 rounded-full bg-red-600 shadow-[inset_0_2px_4px_black,0_0_4px_rgba(239,68,68,0.5)] mb-1" />
            <span className="text-[9px] font-bold tracking-widest text-zinc-400">REC</span>
          </MechanicalButton>

          <MechanicalButton onClick={prevTrack}>
            <span className="text-base block mb-1 drop-shadow-md">⏪</span>
            <span className="text-[9px] font-bold tracking-widest text-zinc-400">REW</span>
          </MechanicalButton>
          
          <MechanicalButton onClick={togglePlayPause}>
             <span className="text-base block mb-1 drop-shadow-md">{isPlaying ? '⏸' : '▶'}</span>
             <span className="text-[9px] font-bold tracking-widest text-zinc-400">PLAY</span>
          </MechanicalButton>

          <MechanicalButton onClick={nextTrack}>
             <span className="text-base block mb-1 drop-shadow-md">⏩</span>
             <span className="text-[9px] font-bold tracking-widest text-zinc-400">FWD</span>
          </MechanicalButton>

          <MechanicalButton onClick={handleEject}>
             <span className="text-base block mb-1 drop-shadow-md">⏏</span>
             <span className="text-[9px] font-bold tracking-widest text-zinc-400">EJECT</span>
          </MechanicalButton>

        </div>

      </div>

      {/* INPUT OCULTO PARA EJECT/CARGAR CARPETA */}
      <input 
          type="file" 
          multiple 
          ref={fileInputRef}
          //@ts-ignore
          webkitdirectory="true" 
          directory="true"
          accept="audio/*"
          onChange={handleFileChange}
          className="hidden"
      />

    </main>
  );
}
