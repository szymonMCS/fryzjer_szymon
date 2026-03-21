from typing import Protocol
from fastapi import Response, Request


class IAdminAuthService(Protocol):
    async def authenticate(self, username: str, password: str, response: Response) -> dict:
        ...
    
    async def logout(self, response: Response) -> dict:
        ...
    
    async def verify_session(self, request: Request) -> bool:
        ...
