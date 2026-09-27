'use client';

import { useEffect, useRef } from 'react';
import { usePlayerStore } from '@/store/usePlayerStore';

export default function Visualizer() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const analyserNode = usePlayerStore(state => state.analyserNode);
  const isPlaying = usePlayerStore(state => state.isPlaying);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !analyserNode) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const bufferLength = analyserNode.frequencyBinCount; // 32 barras si fftSize = 64
    const dataArray = new Uint8Array(bufferLength);
    
    let animationFrameId: number;
    
    const draw = () => {
      animationFrameId = requestAnimationFrame(draw);
      
      analyserNode.getByteFrequencyData(dataArray);
      
      // Limpiar canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Dibujar barras estilo retro
      const barWidth = (canvas.width / bufferLength) * 1.5;
      let barHeight;
      let x = 0;
      
      for (let i = 0; i < bufferLength; i++) {
        // Reducimos el valor un poco para que no choque el techo de inmediato
        barHeight = dataArray[i] / 2.5; 
        
        // Colores: Si está alto (pico) se vuelve rojo/ámbar, si no verde
        ctx.fillStyle = barHeight > 80 ? '#ef4444' : barHeight > 50 ? '#eab308' : '#22c55e';
        
        // Estilo matriz de puntos: en lugar de un rectágulo relleno, 
        // dibujamos pequeños cuadrados apilados
        const numBlocks = Math.floor(barHeight / 4);
        for(let j = 0; j < numBlocks; j++) {
            ctx.fillRect(x, canvas.height - (j * 5) - 4, barWidth - 2, 4);
        }
        
        x += barWidth;
      }
    };
    
    if (isPlaying) {
      draw();
    } else {
      // Si está en pausa, dibujamos las barras en 0 o vacías
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    
    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [analyserNode, isPlaying]);

  return (
    <canvas 
      ref={canvasRef} 
      width={120} 
      height={40} 
      className="absolute bottom-1 right-2 w-24 h-8 opacity-80"
    />
  );
}
