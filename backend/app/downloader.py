import yt_dlp
import os
import asyncio
import uuid
from pathlib import Path
from .websockets_manager import manager

TMP_DIR = Path("/tmp/descargador_y2k")
TMP_DIR.mkdir(parents=True, exist_ok=True)

def extract_info_sync(url: str) -> list:
    """Extrae información de la URL sin descargar. Soporta YouTube y Spotify."""
    
    # --- MÓDULO SPOTIFY ---
    if "spotify.com" in url:
        import subprocess
        import json
        import uuid
        
        temp_file = TMP_DIR / f"{uuid.uuid4()}.spotdl"
        # spotdl save extrae la metadata de la playlist/canción y la guarda en un JSON
        subprocess.run(["spotdl", "save", url, "--save-file", str(temp_file)], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        
        with open(temp_file, "r", encoding="utf-8") as f:
            songs = json.load(f)
            
        tracks = []
        for song in songs:
            title = f"{song.get('artist', 'Unknown')} - {song.get('name', 'Unknown')}"
            dl_url = song.get('download_url')
            if not dl_url:
                dl_url = f"ytsearch:{title}"
            tracks.append({"title": title, "url": dl_url})
            
        os.remove(temp_file)
        return tracks

    # --- MÓDULO YOUTUBE / OTROS ---
    ydl_opts = {
        'extract_flat': True,
        'quiet': True,
        'no_warnings': True
    }
    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        info = ydl.extract_info(url, download=False)
        
        if 'entries' in info:
            tracks = []
            for entry in info['entries']:
                if entry:
                    track_url = entry.get('url') or entry.get('webpage_url')
                    if track_url and not track_url.startswith('http'):
                        track_url = f"https://www.youtube.com/watch?v={track_url}"
                    tracks.append({
                        "title": entry.get('title', 'Unknown'),
                        "url": track_url
                    })
            return tracks
        else:
            track_url = info.get('webpage_url', url)
            return [{"title": info.get('title', 'Unknown'), "url": track_url}]

def download_audio_sync(url: str, session_id: str, loop: asyncio.AbstractEventLoop) -> str:
    """
    Descarga el audio y emite el progreso vía WebSocket.
    Retorna la ruta absoluta del archivo MP3 temporal.
    Se ejecuta de forma bloqueante (debe llamarse en un thread).
    """
    def my_hook(d):
        if d['status'] == 'downloading':
            percent_str = d.get('_percent_str', '0%').strip()
            import re
            percent_clean = re.sub(r'\x1b\[[0-9;]*m', '', percent_str)
            
            message = {
                "status": "downloading",
                "progress": percent_clean
            }
            asyncio.run_coroutine_threadsafe(manager.send_personal_message(message, session_id), loop)
            
        elif d['status'] == 'finished':
            msg = {"status": "processing", "message": "Convirtiendo a MP3..."}
            asyncio.run_coroutine_threadsafe(manager.send_personal_message(msg, session_id), loop)

    track_id = str(uuid.uuid4())
    outtmpl = str(TMP_DIR / f"{track_id}.%(ext)s")
    
    ydl_opts = {
        'format': 'bestaudio/best',
        'outtmpl': outtmpl,
        'postprocessors': [{
            'key': 'FFmpegExtractAudio',
            'preferredcodec': 'mp3',
            'preferredquality': '320',
        }],
        'progress_hooks': [my_hook],
        'quiet': False,
        'no_warnings': True
    }
    
    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        info_dict = ydl.extract_info(url, download=True)
        final_mp3_path = str(TMP_DIR / f"{track_id}.mp3")
        return final_mp3_path
