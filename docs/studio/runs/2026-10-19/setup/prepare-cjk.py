"""Local diagnostic font only; never installs into the original browser config."""
import hashlib, json, pathlib, pymupdf

target = pathlib.Path('/tmp/clawbyte-19-cjk')
fonts = target / 'fonts'
fonts.mkdir(parents=True, exist_ok=True)
font = pymupdf.Font('cjk')
payload = font.buffer
file = fonts / 'DroidSansFallback.ttf'
if file.exists() and file.read_bytes() != payload:
    raise RuntimeError('Refusing to replace a different diagnostic font')
file.write_bytes(payload)
print(json.dumps({'source': 'Installed PyMuPDF built-in cjk Font buffer; local diagnostic, not shipped game artwork/font', 'pymupdf': pymupdf.VersionBind, 'name': font.name, 'path': str(file), 'bytes': len(payload), 'sha256': hashlib.sha256(payload).hexdigest(), 'hanGlyph': font.has_glyph(0x4e2d)}))
