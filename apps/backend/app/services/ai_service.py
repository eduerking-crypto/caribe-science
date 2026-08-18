"""CARIBE AI — asistencia, nunca reemplazo. Provider-agnostic: reglas locales + Ollama/OpenAI-compatible.

Regla de oro: AI NUNCA acepta/rechaza manuscritos, NUNCA inventa citas/DOIs/datos.
Todo hallazgo lleva: finding, confidence, explanation, source, created_at, model.
"""
import logging
import re
from typing import Any, Optional

import httpx

from app.core.config import get_settings
from app.models import AiAnalysis, AiFinding, Manuscript

logger = logging.getLogger(__name__)
settings = get_settings()

REQUIRED_SECTIONS = [
    "Introduction", "Methods", "Methodology", "Results", "Discussion", "Conclusion", "References",
]
SECTION_ALIASES = {
    "introduction": "Introduction", "methods": "Methods", "methodology": "Methods",
    "results": "Results", "discussion": "Discussion", "conclusions": "Conclusion",
    "conclusion": "Conclusion", "references": "References", "bibliography": "References",
}


class AIProvider:
    name = "abstract"

    async def analyze(self, prompt: str, system: str = "") -> Optional[str]:
        raise NotImplementedError


class OllamaProvider(AIProvider):
    name = "ollama"

    async def analyze(self, prompt: str, system: str = "") -> Optional[str]:
        try:
            async with httpx.AsyncClient(timeout=60.0) as client:
                resp = await client.post(
                    f"{settings.ai_base_url}/api/chat",
                    json={
                        "model": settings.ai_model,
                        "messages": [
                            {"role": "system", "content": system or "You are a scientific research assistant."},
                            {"role": "user", "content": prompt},
                        ],
                        "stream": False,
                        "options": {"num_predict": 1024},
                    },
                )
                if resp.status_code == 200:
                    return resp.json().get("message", {}).get("content", "")
        except Exception as exc:  # noqa: BLE001
            logger.info("AI unavailable: %s", exc)
        return None


class DisabledProvider(AIProvider):
    name = "disabled"

    async def analyze(self, prompt: str, system: str = "") -> Optional[str]:
        return None


def _build_provider() -> AIProvider:
    if settings.ai_provider == "ollama":
        return OllamaProvider()
    return DisabledProvider()


ai_provider = _build_provider()


# ---------------------------------------------------------------- rule-based analysis


def _headings(body: str) -> list[str]:
    h = [line.strip() for line in body.splitlines() if re.match(r"^(#+\s|CHAPTER \d)", line.strip(), re.I)]
    return [re.sub(r"^#+\s*", "", x) for x in h]


def analyze_structure(manuscript: Manuscript) -> list[dict[str, Any]]:
    """Detección de estructura: secciones ausentes, referencias a figuras/tablas no citadas."""
    findings: list[dict[str, Any]] = []
    text = (manuscript.abstract or "") + "\n" + (manuscript.body or "")
    low = text.lower()

    present = {SECTION_ALIASES.get(h.lower().strip(" :"), h.strip(" :")) for h in _headings(manuscript.body or "")}
    for expected in REQUIRED_SECTIONS:
        if expected == "Methodology" and "Methods" in present:
            continue
        if expected not in present:
            findings.append({
                "finding": f"Possible missing section: {expected}",
                "confidence": 0.6, "explanation": "Common scientific article structure includes this section.",
                "source": "rule_based_structure", "severity": "warning",
            })

    missing_refs = []
    for m in re.finditer(r"(?:See|refer to|as shown in|[Ff]igure|[Tt]able)\s+([Ff]ig\.?\s?\d+|[Tt]ab(?:le)?\.?\s?\d+|[Ff]igure\s?\d+|[Tt]able\s?\d+)", text):
        ref = m.group(1) or ""
        if ref and re.search(rf"\{ref}", text) is None and ref.lower() not in low:
            missing_refs.append(ref)
    uniq = list(dict.fromkeys(missing_refs))[:6]
    if uniq:
        findings.append({
                "finding": f"References to figures/tables without a matching caption: {', '.join(uniq)}",
                "confidence": 0.5, "explanation": "Inline references should correspond to actual captions.",
                "source": "rule_based_figure_refs", "severity": "info",
            })

    if len((manuscript.body or "").strip()) < 400:
        findings.append({
            "finding": "Manuscript body appears too short",
            "confidence": 0.7, "explanation": "Body length under 400 characters is unusual for a full manuscript.",
            "source": "rule_based_length", "severity": "warning",
        })
    return findings


def analyze_metadata(manuscript: Manuscript) -> list[dict[str, Any]]:
    findings: list[dict[str, Any]] = []
    if not manuscript.title.strip():
        findings.append({"finding": "Missing title", "confidence": 1.0, "explanation": "A submission requires a title.", "source": "rule_based_meta", "severity": "error"})
    if len(manuscript.abstract or "") < 50:
        findings.append({"finding": "Abstract missing or too short", "confidence": 0.9, "explanation": "Abstract under 50 characters.", "source": "rule_based_meta", "severity": "error"})
    if not manuscript.keywords:
        findings.append({"finding": "No keywords provided", "confidence": 0.8, "explanation": "3-6 keywords help indexing.", "source": "rule_based_meta", "severity": "warning"})
    return findings


def consistency_check(manuscript: Manuscript) -> list[dict[str, Any]]:
    findings: list[dict[str, Any]] = []
    low = (manuscript.title or "").lower()
    body_low = (manuscript.body or "").lower()
    for kw in (manuscript.keywords or []):
        if str(kw).lower() not in body_low and str(kw).lower() not in low:
            findings.append({
                "finding": f"Keyword '{kw}' not found in title/body",
                "confidence": 0.4, "explanation": "Keyword consistency helps search indexing.",
                "source": "rule_based_consistency", "severity": "info",
            })
    return findings


MISSING_KEYWORDS = [
    "doi", "10.1", "https://", "conflict of interest", "funding", "acknowledg",
    "data availability", "ethics", "consent",
]


def ai_check_manuscript(manuscript: Manuscript, kind: str = "structure") -> AiAnalysis:
    """Ejecuta análisis (reglas locales primero; Ollama opcional) y persiste con procedencia."""
    if kind == "structure":
        raw = analyze_structure(manuscript)
    elif kind == "metadata":
        raw = analyze_metadata(manuscript)
    elif kind == "consistency":
        raw = consistency_check(manuscript)
    else:
        raw = []

    analysis = AiAnalysis(
        manuscript_id=manuscript.id, kind=kind,
        model=ai_provider.name, provider=ai_provider.name, status="completed",
    )
    for item in raw:
        analysis.findings.append(AiFinding(**item))
    return analysis