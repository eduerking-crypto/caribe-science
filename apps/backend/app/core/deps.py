"""FastAPI dependencies: current user, RBAC checks."""
from functools import lru_cache
from typing import Callable

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import InvalidTokenError, decode_token
from app.models import User

bearer = HTTPBearer(auto_error=False)

ROLE_NAMES = {
    "visitor", "researcher", "author", "reviewer", "editor",
    "section_editor", "editor_in_chief", "journal_admin", "platform_admin",
}


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer),
    db: Session = Depends(get_db),
) -> User:
    if credentials is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
    try:
        payload = decode_token(credentials.credentials)
    except InvalidTokenError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    user = db.get(User, payload.get("sub"))
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User is inactive")
    return user


def require_roles(*roles: str) -> Callable:
    def checker(current: User = Depends(get_current_user)) -> User:
        if current.role not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Requires role: {'|'.join(roles)}",
            )
        return current

    return checker


def user_roles(user: User) -> list[str]:
    if isinstance(user.roles, list):
        return [r.name for r in user.roles] + [user.role]
    return [user.role]


def has_role(user: User, role: str) -> bool:
    return role in user_roles(user)


@lru_cache
def role_users() -> None:  # placeholder para futura gestión de roles desde admin
    return None