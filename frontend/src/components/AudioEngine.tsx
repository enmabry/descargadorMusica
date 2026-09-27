'use client';

import { useEffect, useRef } from 'react';
import { usePlayerStore } from '@/store/usePlayerStore';

export default function AudioEngine() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  
  const tracks = usePlayerStore(state => state.tracks);
  const currentTrackIndex = usePlayerStore(state => state.currentTrackIndex);
  const isPlaying = usePlayerStore(state => state.isPlaying);
  const volume = usePlayerStore(state => state.volume);
  const nextTrack = usePlayerStore(state => state.nextTrack);
  const setAnalyserNode = usePlayerStore(state => state.setAnalyserNode);

  // Inicializar motor de audio
  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.crossOrigin = "anonymous";
      
      audioRef.current.addEventListener('ended', () => {
        nextTrack();
      });
    }

    const audio = audioRef.current;
    audio.volume = volume;

    if (currentTrackIndex !== null && tracks[currentTrackIndex]) {
      const currentTrack = tracks[currentTrackIndex];
      
      if (audio.src !== currentTrack.objectUrl) {
        audio.src = currentTrack.objectUrl;
        audio.load();
      }

      if (isPlaying) {
        // Inicializar AudioContext y Web Audio API solo tras interacción del usuario
        if (!audioCtxRef.current) {
          const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
          const ctx = new AudioContext();
          audioCtxRef.current = ctx;
          
          const analyser = ctx.createAnalyser();
          analyser.fftSize = 64; // Bajo para estilo barras retro
          analyserRef.current = analyser;
          setAnalyserNode(analyser);

          sourceRef.current = ctx.createMediaElementSource(audio);
          sourceRef.current.connect(analyser);
          analyser.connect(ctx.destination);
        } else if (audioCtxRef.current.state === 'suspended') {
          audioCtxRef.current.resume();
        }

        audio.play().catch(err => {
          console.warn("Reproducción bloqueada:", err);
        });
      } else {
        audio.pause();
      }
    } else {
      audio.pause();
      audio.src = "";
    }

  }, [tracks, currentTrackIndex, isPlaying, volume, nextTrack, setAnalyserNode]);

  return null;
}
