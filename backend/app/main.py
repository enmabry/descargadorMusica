from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from starlette.background import BackgroundTask
import os
import asyncio
from pydantic import BaseModel
from .downloader import download_audio_sync, extract_info_sync
from .websockets_manager import manager

app = FastAPI(title="Descargador Y2K API (Stateless)")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ExtractRequest(BaseModel):
    url: str

class DownloadRequest(BaseModel):
    url: str
    session_id: str

def remove_file(path: str):
    try:
        if os.path.exists(path):
            os.remove(path)
            print(f"Archivo efímero eliminado: {path}")
    except Exception as e:
        print(f"Error eliminando archivo {path}: {e}")

@app.get("/")
def read_root():
    return {"status": "ok", "message": "Motor Y2K Stateless en línea"}

@app.post("/api/extract")
async def extract_url(req: ExtractRequest):
    try:
        tracks = await asyncio.to_thread(extract_info_sync, req.url)
        return {"status": "ok", "tracks": tracks}
    except Exception as e:
        return {"status": "error", "message": str(e)}

@app.post("/api/download")
async def process_url(req: DownloadRequest):
    loop = asyncio.get_running_loop()
    
    try:
        final_mp3_path = await asyncio.to_thread(download_audio_sync, req.url, req.session_id, loop)
        filename = os.path.basename(final_mp3_path)
        
        # Devolvemos el archivo binario y programamos su autodestrucción
        return FileResponse(
            path=final_mp3_path, 
            filename=filename, 
            media_type="audio/mpeg", 
            background=BackgroundTask(remove_file, final_mp3_path)
        )
    except Exception as e:
        await manager.send_personal_message({"status": "failed", "error": str(e)}, req.session_id)
        return {"error": str(e)}

@app.websocket("/ws/{session_id}")
async def websocket_endpoint(websocket: WebSocket, session_id: str):
    await manager.connect(websocket, session_id)
    try:
        while True:
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        manager.disconnect(session_id)
    except Exception as e:
        print(f"Error WS: {e}")
        manager.disconnect(session_id)
