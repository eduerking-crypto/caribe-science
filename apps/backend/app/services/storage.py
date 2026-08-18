"""StorageProvider — local por defecto; S3-compatible en producción (misma interfaz)."""
import hashlib
import os
import re
import uuid
from pathlib import Path

from fastapi import UploadFile

from app.core.config import get_settings

settings = get_settings()

ALLOWED_KINDS = {"manuscript", "figure", "table", "supplementary", "graphical_abstract", "cover_letter"}
ALLOWED_EXTENSIONS = {
    "docx", "doc", "pdf", "txt", "md", "tex",
    "png", "jpg", "jpeg", "gif", "webp", "svg", "tif", "tiff",
    "xlsx", "xls", "csv", "docx",
}
MAX_SIZE = 100 * 1024 * 1024  # 100 MB


class StorageError(Exception):
    pass


class StorageProvider:
    def _base(self) -> Path:
        p = Path(settings.upload_dir)
        p.mkdir(parents=True, exist_ok=True)
        return p

    def _safe_name(self, original: str) -> tuple[str, str]:
        """Previene path traversal / nombres maliciosos."""
        name = os.path.basename(original).replace("\\", "/").split("/")[-1]
        name = re.sub(r"[^\w.\- ]+", "_", name).strip(" ._")
        if not name:
            name = "file.bin"
        ext = name.rsplit(".", 1)[-1].lower() if "." in name else ""
        return name, ext

    def validate(self, upload: UploadFile, kind: str = "manuscript") -> None:
        if kind not in ALLOWED_KINDS:
            raise StorageError(f"Invalid file kind: {kind}")
        _, ext = self._safe_name(upload.filename or "")
        if ext not in ALLOWED_EXTENSIONS:
            raise StorageError(f"File type not allowed: .{ext}")
        upload.file.seek(0, 2)
        size = upload.file.tell()
        upload.file.seek(0)
        if size > MAX_SIZE:
            raise StorageError("File exceeds 100 MB limit")
        if size == 0:
            raise StorageError("Empty file")

    async def save(self, upload: UploadFile, kind: str = "manuscript", version: int = 1) -> dict:
        self.validate(upload, kind)
        name, ext = self._safe_name(upload.filename or "file")
        fid = str(uuid.uuid4())
        relative = Path(kind) / f"{fid}_v{version}.{ext}"
        dest = self._base() / relative
        dest.parent.mkdir(parents=True, exist_ok=True)
        sha = hashlib.sha256()
        size = 0
        while chunk := await upload.read(1024 * 1024):
            sha.update(chunk)
            size += len(chunk)
            with dest.open("ab") as fh:
                fh.write(chunk)
        return {
            "storage_path": str(relative).replace("\\", "/"),
            "original_name": name,
            "mime": upload.content_type or "application/octet-stream",
            "size": size,
            "checksum": sha.hexdigest(),
        }

    def exists(self, path: str) -> bool:
        return (self._base() / Path(path)).exists()

    def delete(self, path: str) -> None:
        try:
            (self._base() / Path(path)).unlink(missing_ok=True)
        except OSError:
            pass

    def get_url(self, path: str) -> str:
        return f"/files/{path}"


storage: StorageProvider = StorageProvider()