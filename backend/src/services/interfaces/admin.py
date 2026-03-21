from abc import ABC, abstractmethod
from fastapi import Response, Request


class IAdminAuthService(ABC):
    @abstractmethod
    async def authenticate(self, username: str, password: str, response: Response) -> dict: ...
    @abstractmethod
    async def logout(self, response: Response) -> dict: ...
    @abstractmethod
    async def verify_session(self, request: Request) -> bool: ...
