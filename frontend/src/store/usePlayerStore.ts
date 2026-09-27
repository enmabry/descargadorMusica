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
  analyserNode: AnalyserNode | null;
  
  // Acciones
  loadFiles: (files: File[]) => void;
  playTrack: (index: number) => void;
  togglePlayPause: () => void;
  nextTrack: () => void;
  prevTrack: () => void;
  setVolume: (volume: number) => void;
  clearQueue: () => void;
  setIsPlaying: (playing: boolean) => void;
  setAnalyserNode: (node: AnalyserNode) => void;
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  tracks: [],
  currentTrackIndex: null,
  isPlaying: false,
  volume: 1.0,
  analyserNode: null,

  setAnalyserNode: (node: AnalyserNode) => set({ analyserNode: node }),

  loadFiles: (files: File[]) => {
    if (files.length === 0) return;

    const newTracks: LocalTrack[] = files.map(file => ({
      id: crypto.randomUUID(),
      name: file.name.replace(/\.[^/.]+$/, ""), // Quitamos extensión
      file,
      objectUrl: URL.createObjectURL(file) 
    }));

    set((state) => {
      const isFirstLoad = state.tracks.length === 0 && newTracks.length > 0;
      return {
        tracks: [...state.tracks, ...newTracks],
        currentTrackIndex: isFirstLoad ? 0 : state.currentTrackIndex,
        isPlaying: isFirstLoad ? true : state.isPlaying
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
    if (currentTrackIndex !== null && tracks.length > 0) {
      set({ isPlaying: !isPlaying });
    } else if (currentTrackIndex === null && tracks.length > 0) {
      set({ currentTrackIndex: 0, isPlaying: true });
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
