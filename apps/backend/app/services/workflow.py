"""Máquina de estados editorial + transiciones validadas + auditoría."""
from dataclasses import dataclass

VALID_EVENTS: dict[str, list[str]] = {
    "draft": ["submitted"],
    "submitted": ["technical_check", "rejected"],
    "technical_check": ["editorial_check", "rejected"],
    "editorial_check": ["assigned_to_editor", "rejected"],
    "assigned_to_editor": ["reviewer_invitations", "rejected"],
    "reviewer_invitations": ["under_review", "rejected"],
    "under_review": ["reviews_received"],
    "reviews_received": ["editor_decision", "major_revision", "minor_revision", "accepted", "rejected"],
    "editor_decision": ["rejected", "minor_revision", "major_revision", "accepted"],
    "minor_revision": ["submitted", "rejected"],  # revision vuelve a flujo
    "major_revision": ["submitted", "rejected"],
    "accepted": ["production"],
    "production": ["proof"],
    "proof": ["published"],
    "published": [],
    "rejected": [],
}


@dataclass
class TransitionResult:
    ok: bool
    error: str = ""


def can_transition(current: str, target: str) -> TransitionResult:
    if current not in VALID_EVENTS:
        return TransitionResult(False, f"Unknown status: {current}")
    if target not in VALID_EVENTS[current]:
        allowed = ", ".join(VALID_EVENTS[current]) or "(terminal)"
        return TransitionResult(False, f"Invalid transition {current} -> {target}; allowed: {allowed}")
    return TransitionResult(True)


def is_terminal(status: str) -> bool:
    return status in {"published", "rejected"} or not VALID_EVENTS.get(status, [])