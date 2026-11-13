#!/usr/bin/env python3
"""Verify the complete branch-resident handoff, without network or extraction."""
from pathlib import Path
import hashlib,json,zipfile
root=Path(__file__).resolve().parent
manifest=json.loads((root/'MANIFEST.json').read_text())
total=0
for item in manifest['files']:
    p=(root/item['path']).resolve()
    assert p.is_relative_to(root),'Unsafe manifest path'
    assert p.is_file() and not (root/item['path']).is_symlink(),item['path']
    b=p.read_bytes()
    assert len(b)==item['bytes'] and hashlib.sha256(b).hexdigest()==item['sha256'],item['path']
    total+=len(b)
with zipfile.ZipFile(root/manifest['archive']) as archive:
    assert archive.testzip() is None,'ZIP CRC failure'
    assert len(archive.infolist())==manifest['archive_entries'],'Archive entries differ'
    for item in manifest['archive_members']:
        b=archive.read(item['path'])
        assert hashlib.sha256(b).hexdigest()==item['sha256'],item['path']
        assert b==(root/'evidence'/item['path']).read_bytes(),'Expanded file differs: '+item['path']
print(json.dumps({'ok':True,'originals':len(manifest['original_files']),'archive_entries':manifest['archive_entries'],'extracted_files':len(manifest['archive_members']),'verified_files':len(manifest['files']),'total_bytes':total,'game_source_baseline':manifest['game_source_baseline']},indent=2))
