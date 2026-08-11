# -*- mode: python ; coding: utf-8 -*-


a = Analysis(
    ['gemini.py'],
    pathex=[],
    binaries=[],
    datas=[('/Users/admin/game-logic/.venv/lib/python3.13/site-packages/sv_ttk/theme', 'sv_ttk/theme')],
    hiddenimports=['google.generativeai', 'pynput.keyboard._darwin'],
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[],
    noarchive=False,
    optimize=0,
)
pyz = PYZ(a.pure)

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.datas,
    [],
    name='Gemini OCR',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    upx_exclude=[],
    runtime_tmpdir=None,
    console=False,
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
    icon=['app_icon.icns'],
)
app = BUNDLE(
    exe,
    name='Gemini OCR.app',
    icon='app_icon.icns',
    bundle_identifier=None,
)
