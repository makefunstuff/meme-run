#!/bin/sh
# Export the Godot project to a web build in ../web, ready for GitHub Pages.
#
# The "Web" preset in export_presets.cfg has thread_support disabled on purpose:
# the threaded build needs COOP/COEP headers (SharedArrayBuffer), and GitHub
# Pages cannot send them. The single-threaded build runs anywhere.
set -e
cd "$(dirname "$0")"
godot --headless --path . --import
godot --headless --path . --export-release "Web" ../web/index.html

# GitHub Pages serves the project at /meme-run/web/, so the browser asks for
# /favicon.ico at the domain root and 404s. Point it at the icon we ship.
python3 - <<'EOF'
import re
p = "../web/index.html"
s = open(p).read()
if 'rel="icon"' not in s:
    s = s.replace("</head>", '\t<link rel="icon" type="image/png" href="index.icon.png">\n</head>')
    open(p, "w").write(s)
EOF
echo "exported to ../web"
