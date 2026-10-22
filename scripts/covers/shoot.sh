#!/usr/bin/env bash
# shoot <name> <path> <selector> <offset-px> [pre-js]
set -e
S="--session evlib-shots"
B=https://evoview-library.said.bet
name=$1; path=$2; sel=$3; off=$4; pre=${5:-}
agent-browser $S open "$B$path" >/dev/null
agent-browser $S wait 2200 >/dev/null
agent-browser $S eval "(() => { const st = document.createElement('style'); st.textContent = '.lib-float, .ctc__affordance { display: none !important; }'; document.head.appendChild(st); const n = document.querySelector('[data-tone]:not(.lib-toned)'); if (n) n.style.visibility = 'hidden'; return 1; })()" >/dev/null
agent-browser $S eval "(() => { const e = document.querySelector('$sel'); if (!e) return 'missing'; window.scrollTo(0, e.getBoundingClientRect().top + scrollY + ($off)); return scrollY; })()"
agent-browser $S wait 1600 >/dev/null
if [ -n "$pre" ]; then agent-browser $S eval "$pre" >/dev/null; agent-browser $S wait 2600 >/dev/null; fi
agent-browser $S screenshot "/tmp/evlib/raw-$name.png" >/dev/null
echo "$name done"
