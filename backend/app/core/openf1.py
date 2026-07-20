from __future__ import annotations

import asyncio
from typing import Any

import httpx

OPENF1_BASE = "https://api.openf1.org/v1"


class OpenF1Client:
    def __init__(self) -> None:
        self._sessions: list[dict] | None = None
        self._drivers: dict[int, list[dict]] = {}
        self._lock = asyncio.Lock()

    async def sessions(self, year: int | None = None) -> list[dict]:
        async with self._lock:
            if self._sessions is not None:
                return self._sessions
            params = {"year": str(year)} if year else {}
            async with httpx.AsyncClient(timeout=20) as client:
                response = await client.get(f"{OPENF1_BASE}/sessions", params=params)
                response.raise_for_status()
                self._sessions = response.json()
                return self._sessions

    async def latest_session(self) -> dict | None:
        sessions = await self.sessions()
        return sessions[-1] if sessions else None

    async def drivers(self, session_key: int) -> list[dict]:
        if session_key in self._drivers:
            return self._drivers[session_key]
        async with httpx.AsyncClient(timeout=20) as client:
            response = await client.get(
                f"{OPENF1_BASE}/drivers", params={"session_key": session_key}
            )
            response.raise_for_status()
            data = response.json()
            self._drivers[session_key] = data
            return data

    async def positions(self, session_key: int) -> list[dict]:
        async with httpx.AsyncClient(timeout=20) as client:
            response = await client.get(
                f"{OPENF1_BASE}/position", params={"session_key": session_key}
            )
            response.raise_for_status()
            return response.json()

    async def intervals(self, session_key: int) -> list[dict]:
        async with httpx.AsyncClient(timeout=20) as client:
            response = await client.get(
                f"{OPENF1_BASE}/intervals", params={"session_key": session_key}
            )
            response.raise_for_status()
            return response.json()

    async def laps(self, session_key: int, driver_number: int | None = None) -> list[dict]:
        params: dict[str, Any] = {"session_key": session_key}
        if driver_number:
            params["driver_number"] = driver_number
        async with httpx.AsyncClient(timeout=20) as client:
            response = await client.get(f"{OPENF1_BASE}/laps", params=params)
            response.raise_for_status()
            return response.json()

    async def car_data(
        self, session_key: int, driver_number: int | None = None
    ) -> list[dict]:
        params: dict[str, Any] = {"session_key": session_key}
        if driver_number:
            params["driver_number"] = driver_number
        async with httpx.AsyncClient(timeout=20) as client:
            response = await client.get(f"{OPENF1_BASE}/car_data", params=params)
            response.raise_for_status()
            return response.json()

    async def weather(self, session_key: int) -> list[dict]:
        async with httpx.AsyncClient(timeout=20) as client:
            response = await client.get(
                f"{OPENF1_BASE}/weather", params={"session_key": session_key}
            )
            response.raise_for_status()
            return response.json()

    async def race_control(self, session_key: int) -> list[dict]:
        async with httpx.AsyncClient(timeout=20) as client:
            response = await client.get(
                f"{OPENF1_BASE}/race_control", params={"session_key": session_key}
            )
            response.raise_for_status()
            return response.json()

    async def location(self, session_key: int, driver_number: int | None = None) -> list[dict]:
        params: dict[str, Any] = {"session_key": session_key}
        if driver_number:
            params["driver_number"] = driver_number
        async with httpx.AsyncClient(timeout=20) as client:
            response = await client.get(f"{OPENF1_BASE}/location", params=params)
            response.raise_for_status()
            return response.json()


openf1 = OpenF1Client()
