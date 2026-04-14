class DomainException(Exception):
    def __init__(self, message: str, status_code: int = 500):
        self.message = message
        self.status_code = status_code
        super().__init__(self.message)


class NotFoundException(DomainException):
    def __init__(self, message: str = "Resource not found"):
        super().__init__(message, status_code=404)


class ValidationException(DomainException):
    def __init__(self, message: str = "Validation error"):
        super().__init__(message, status_code=400)


class ConflictException(DomainException):
    def __init__(self, message: str = "Conflict detected"):
        super().__init__(message, status_code=409)


class AuthenticationException(DomainException):
    def __init__(self, message: str = "Authentication failed"):
        super().__init__(message, status_code=401)


