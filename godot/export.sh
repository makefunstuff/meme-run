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
echo "exported to ../web"
