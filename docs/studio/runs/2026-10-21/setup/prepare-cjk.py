"""Host-only CJK coverage, never a shipped font or game dependency."""
import hashlib, json, pathlib, pymupdf
fonts = pathlib.Path('/tmp/clawbyte-21-browser/fonts')
fonts.mkdir(parents=True, exist_ok=True)
font = pymupdf.Font('cjk')
payload = font.buffer
file = fonts / 'DroidSansFallback.ttf'
if file.exists() and file.read_bytes() != payload:
    raise RuntimeError('Refusing to replace a different font')
file.write_bytes(payload)
print(json.dumps({'source': 'Installed PyMuPDF built-in CJK buffer; host-only not shipped', 'pymupdf': pymupdf.VersionBind, 'name': font.name, 'path': str(file), 'bytes': len(payload), 'sha256': hashlib.sha256(payload).hexdigest(), 'hanGlyph': font.has_glyph(0x4e2d)}, indent=2))
