import { create } from 'zustand';

export interface LocalTrack {
  id: string;
  name: string;
  file: File;
  objectUrl: string;
}

interface PlayerState {
  tracks: LocalTrack[];
  currentTrackIndex: number | null;
  isPlaying: boolean;
  volume: number;
  
  // Acciones
  loadFiles: (files: File[]) => void;
  playTrack: (index: number) => void;
  togglePlayPause: () => void;
  nextTrack: () => void;
  prevTrack: () => void;
  setVolume: (volume: number) => void;
  clearQueue: () => void;
  setIsPlaying: (playing: boolean) => void;
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  tracks: [],
  currentTrackIndex: null,
  isPlaying: false,
  volume: 1.0,

  loadFiles: (files: File[]) => {
    // Filtramos para asegurar que solo procesamos audios
    const audioFiles = files.filter(f => f.type.startsWith('audio/') || f.name.endsWith('.mp3'));
    
    const newTracks: LocalTrack[] = audioFiles.map(file => ({
      id: crypto.randomUUID(),
      name: file.name.replace(/\.[^/.]+$/, ""), // Quitamos la extensión (.mp3) para el display
      file,
      objectUrl: URL.createObjectURL(file) // La magia ocurre aquí: puntero local en RAM
    }));

    set((state) => {
      const isFirstLoad = state.tracks.length === 0 && newTracks.length > 0;
      return {
        tracks: [...state.tracks, ...newTracks],
        // Si no había nada reproduciéndose, seleccionamos la primera canción que entró
        currentTrackIndex: isFirstLoad ? 0 : state.currentTrackIndex,
        // (Opcional) Si quieres autostart, pondrías isPlaying: true aquí si isFirstLoad es true
      };
    });
  },

  playTrack: (index: number) => {
    const { tracks } = get();
    if (index >= 0 && index < tracks.length) {
      set({ currentTrackIndex: index, isPlaying: true });
    }
  },

  togglePlayPause: () => {
    const { currentTrackIndex, tracks, isPlaying } = get();
    // Solo podemos pausar/reproducir si hay una canción seleccionada
    if (currentTrackIndex !== null && tracks.length > 0) {
      set({ isPlaying: !isPlaying });
    }
  },

  nextTrack: () => {
    const { currentTrackIndex, tracks } = get();
    if (currentTrackIndex !== null) {
      if (currentTrackIndex < tracks.length - 1) {
        set({ currentTrackIndex: currentTrackIndex + 1, isPlaying: true });
      } else {
        // Llegamos al final del cassette
        set({ isPlaying: false, currentTrackIndex: 0 }); 
      }
    }
  },

  prevTrack: () => {
    const { currentTrackIndex } = get();
    if (currentTrackIndex !== null && currentTrackIndex > 0) {
      set({ currentTrackIndex: currentTrackIndex - 1, isPlaying: true });
    }
  },

  setVolume: (volume: number) => set({ volume }),

  setIsPlaying: (isPlaying: boolean) => set({ isPlaying }),

  clearQueue: () => {
    const { tracks } = get();
    // IMPORTANTE: Prevenir fugas de memoria (memory leaks) liberando las URLs temporales del navegador
    tracks.forEach(track => URL.revokeObjectURL(track.objectUrl));
    set({ tracks: [], currentTrackIndex: null, isPlaying: false });
  }
}));
