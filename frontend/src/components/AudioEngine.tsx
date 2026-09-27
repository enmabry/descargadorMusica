'use client';

import { useEffect, useRef } from 'react';
import { usePlayerStore } from '@/store/usePlayerStore';

/**
 * Este componente es invisible en la UI.
 * Actúa puramente como el "Motor de Audio" manejando la API nativa de HTML5.
 * Se suscribe a los cambios del store de Zustand y reacciona en consecuencia.
 */
export default function AudioEngine() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  const tracks = usePlayerStore(state => state.tracks);
  const currentTrackIndex = usePlayerStore(state => state.currentTrackIndex);
  const isPlaying = usePlayerStore(state => state.isPlaying);
  const volume = usePlayerStore(state => state.volume);
  const nextTrack = usePlayerStore(state => state.nextTrack);

  useEffect(() => {
    // Inicializamos el elemento de Audio una sola vez
    if (!audioRef.current) {
      audioRef.current = new Audio();
      
      // Auto-avanzar cuando la pista termine
      audioRef.current.addEventListener('ended', () => {
        nextTrack();
      });
    }

    const audio = audioRef.current;
    
    // Aplicamos el volumen
    audio.volume = volume;

    if (currentTrackIndex !== null && tracks[currentTrackIndex]) {
      const currentTrack = tracks[currentTrackIndex];
      
      // Si la pista cambió, actualizamos la fuente (el objectUrl temporal)
      if (audio.src !== currentTrack.objectUrl) {
        audio.src = currentTrack.objectUrl;
        audio.load();
      }

      // Reproducir o pausar según el store
      if (isPlaying) {
        // En navegadores modernos, play() devuelve una promesa que puede fallar si el usuario 
        // no ha interactuado con la página antes (política de Autoplay).
        audio.play().catch(err => {
          console.warn("Reproducción bloqueada por el navegador. El usuario debe interactuar primero.", err);
        });
      } else {
        audio.pause();
      }
    } else {
      // Si no hay canción seleccionada, nos aseguramos de detener el motor
      audio.pause();
      audio.src = "";
    }

    // Nota: No limpiamos el EventListener aquí porque queremos que persista 
    // durante toda la vida útil del componente.

  }, [tracks, currentTrackIndex, isPlaying, volume, nextTrack]);

  // El motor de audio no necesita dibujar nada en la pantalla
  return null;
}
