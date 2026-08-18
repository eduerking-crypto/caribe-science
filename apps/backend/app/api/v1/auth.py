"""Auth: registro, verificación de email, login, perfil, reset de contraseña."""
import hashlib
import secrets
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user
from app.core.security import create_access_token, hash_password, verify_password
from app.models import AuditLog, AuthToken, Country, Institution, Researcher, User
from app.schemas import (
    EmailVerifyIn, LoginIn, PasswordResetIn, PasswordResetRequestIn,
    RegisterIn, RegisterOut, TokenOut, UserOut, UserUpdateIn,
)
from app.core.config import get_settings

router = APIRouter(prefix="/auth", tags=["auth"])
settings = get_settings()


def _audit(db: Session, actor_id: str | None, action: str, entity: str = "", entity_id: str = "", detail: dict | None = None) -> None:
    db.add(AuditLog(actor_id=actor_id, action=action, entity_type=entity, entity_id=entity_id, detail=detail or {}))
    db.commit()


def _token_hash(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()


@router.post("/register", response_model=RegisterOut, status_code=status.HTTP_201_CREATED)
def register(data: RegisterIn, db: Session = Depends(get_db)):
    if db.scalar(select(User).where(User.email == data.email.lower())):
        raise HTTPException(status_code=409, detail="Email already registered")
    user = User(
        email=data.email.lower(), password_hash=hash_password(data.password),
        full_name=data.full_name, locale=data.locale or "en",
        role="researcher", is_email_verified=not settings.email_verification,
    )
    db.add(user)
    db.flush()
    country = db.scalar(select(Country).where(Country.code == "CO"))
    db.add(Researcher(full_name=data.full_name, user_id=user.id, country_code=country.code if country else None, is_demo=False))
    db.commit()
    _audit(db, user.id, "user.register", "users", user.id)
    return RegisterOut(
        id=user.id, email=user.email, full_name=user.full_name,
        email_verified=user.is_email_verified,
        message="Account created. Login with your credentials." if user.is_email_verified else "Check your email to verify your account.",
    )


@router.post("/login", response_model=TokenOut)
def login(data: LoginIn, db: Session = Depends(get_db)):
    user = db.scalar(select(User).where(User.email == data.email.lower()))
    if user is None or not verify_password(data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="User is inactive")
    _audit(db, user.id, "user.login", "users", user.id)
    token = create_access_token(str(user.id), {"role": user.role})
    return TokenOut(access_token=token, user=UserOut.model_validate(user))


@router.post("/email/verify", response_model=UserOut)
def verify_email(data: EmailVerifyIn, db: Session = Depends(get_db)):
    token = db.scalar(select(AuthToken).where(
        AuthToken.token_hash == _token_hash(data.token), AuthToken.purpose == "email_verify"
    ))
    if token is None or token.used or token.expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="Invalid or expired token")
    token.used = True
    token.user.is_email_verified = True
    db.commit()
    return UserOut.model_validate(token.user)


@router.post("/password/request")
def password_reset_request(data: PasswordResetRequestIn, db: Session = Depends(get_db)):
    user = db.scalar(select(User).where(User.email == data.email.lower()))
    if user:
        raw = secrets.token_urlsafe(24)
        db.add(AuthToken(
            user_id=user.id, purpose="password_reset",
            token_hash=_token_hash(raw), expires_at=datetime.now(timezone.utc) + timedelta(hours=1),
        ))
        db.commit()
        # En desarrollo el token se devuelve en los logs/console (Mailpit en producción).
        print(f"[CARIBE] password-reset token for {user.email}: {raw}")
    return {"message": "If the email exists, a reset link was sent."}


@router.post("/password/reset", response_model=UserOut)
def password_reset(data: PasswordResetIn, db: Session = Depends(get_db)):
    token = db.scalar(select(AuthToken).where(
        AuthToken.token_hash == _token_hash(data.token), AuthToken.purpose == "password_reset"
    ))
    if token is None or token.used or token.expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="Invalid or expired token")
    token.used = True
    token.user.password_hash = hash_password(data.new_password)
    db.commit()
    return UserOut.model_validate(token.user)


@router.get("/me", response_model=UserOut)
def me(current: User = Depends(get_current_user)):
    return UserOut.model_validate(current)


@router.patch("/me", response_model=UserOut)
def update_me(data: UserUpdateIn, current: User = Depends(get_current_user), db: Session = Depends(get_db)):
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(current, field, value)
    db.commit()
    return UserOut.model_validate(current)


@router.post("/orcid/connect")
def orcid_connect(orcid_id: str, current: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Vincula un ORCID validado (formato 0000-0001-2345-6789). Miembro real vía ORCID OAuth en producción."""
    import re
    if not re.fullmatch(r"\d{4}-\d{4}-\d{4}-\d{3}[\dX]", orcid_id or ""):
        raise HTTPException(status_code=400, detail="Invalid ORCID iD format")
    researcher = db.scalar(select(Researcher).where(Researcher.user_id == current.id))
    if researcher is None:
        raise HTTPException(status_code=404, detail="Researcher profile not found")
    researcher.orcid = orcid_id
    researcher.orcid_verified = False  # requiere verificación real en producción
    db.commit()
    return {"message": "ORCID iD linked (verification required)", "orcid": orcid_id}


@router.get("/me/researcher")
def my_researcher(current: User = Depends(get_current_user), db: Session = Depends(get_db)):
    researcher = db.scalar(select(Researcher).where(Researcher.user_id == current.id))
    if researcher is None:
        return None
    inst = db.get(Institution, researcher.institution_id) if researcher.institution_id else None
    return {
        "id": researcher.id, "full_name": researcher.full_name, "orcid": researcher.orcid,
        "orcid_verified": researcher.orcid_verified, "research_areas": researcher.research_areas,
        "keywords": researcher.keywords, "biography": researcher.biography,
        "country_code": researcher.country_code, "is_demo": researcher.is_demo,
        "institution_id": researcher.institution_id,
        "institution": {"id": inst.id, "name": inst.name} if inst else None,
    }