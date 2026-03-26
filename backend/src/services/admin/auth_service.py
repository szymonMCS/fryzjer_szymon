import secrets
import hmac
import hashlib
from datetime import datetime, timedelta
from fastapi import Response, Request
from src.config import settings
from src.core.exceptions import AuthenticationException


class AdminAuthService:
    COOKIE_NAME = "admin_session"
    COOKIE_MAX_AGE = 3600 * 8
    
    def _verify_credentials(self, username: str, password: str) -> bool:
        return username == settings.ADMIN_USERNAME and password == settings.ADMIN_PASSWORD
    
    def _create_token(self) -> str:
        random_part = secrets.token_urlsafe(32)
        timestamp = str(int(datetime.utcnow().timestamp()))
        data = f"{random_part}:{timestamp}"
        signature = hmac.new(
            settings.SECRET_KEY.encode(),
            data.encode(),
            hashlib.sha256
        ).hexdigest()
        return f"{data}:{signature}"
    
    def _verify_token(self, token: str) -> bool:
        try:
            parts = token.split(":")
            if len(parts) != 3:
                return False
            
            random_part, timestamp_str, signature = parts
            timestamp = datetime.fromtimestamp(int(timestamp_str))
            
            if datetime.utcnow() - timestamp > timedelta(hours=8):
                return False
            
            data = f"{random_part}:{timestamp_str}"
            expected_signature = hmac.new(
                settings.SECRET_KEY.encode(),
                data.encode(),
                hashlib.sha256
            ).hexdigest()
            
            return hmac.compare_digest(signature, expected_signature)
        except (ValueError, IndexError):
            return False
    
    async def authenticate(self, username: str, password: str, response: Response) -> dict:
        if not self._verify_credentials(username, password):
            raise AuthenticationException("Invalid credentials")
        
        token = self._create_token()
        response.set_cookie(
            key=self.COOKIE_NAME,
            value=token,
            httponly=True,
            samesite="lax",
            secure=False,
            path="/",
            max_age=self.COOKIE_MAX_AGE
        )
        
        return {"success": True}
    
    async def logout(self, response: Response) -> dict:
        response.delete_cookie(
            key=self.COOKIE_NAME,
            path="/",
            httponly=True,
            samesite="lax",
            secure=False
        )
        return {"success": True}
    
    async def verify_session(self, request: Request) -> bool:
        token = request.cookies.get(self.COOKIE_NAME)
        if not token:
            return False
        return self._verify_token(token)
