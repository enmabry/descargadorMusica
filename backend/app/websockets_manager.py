from fastapi import WebSocket
from typing import Dict

class ConnectionManager:
    def __init__(self):
        # Mapea session_id con su respectivo WebSocket
        self.active_connections: Dict[str, WebSocket] = {}

    async def connect(self, websocket: WebSocket, session_id: str):
        await websocket.accept()
        self.active_connections[session_id] = websocket

    def disconnect(self, session_id: str):
        if session_id in self.active_connections:
            del self.active_connections[session_id]

    async def send_personal_message(self, message: dict, session_id: str):
        ws = self.active_connections.get(session_id)
        if ws:
            try:
                await ws.send_json(message)
            except Exception as e:
                print(f"Error enviando ws: {e}")
                self.disconnect(session_id)

manager = ConnectionManager()
