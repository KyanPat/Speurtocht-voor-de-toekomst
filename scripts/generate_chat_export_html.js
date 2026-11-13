const fs = require('fs');
const path = require('path');

const mdPath = path.join(__dirname, '..', 'docs', 'chat-geschiedenis.md');
const mdContent = fs.readFileSync(mdPath, 'utf8');

// Basic markdown to HTML converter for chat export
function convertToHtml(md) {
  const sections = md.split('### Ronde ');
  const headerPart = sections[0];

  let htmlRondes = '';
  for (let i = 1; i < sections.length; i++) {
    const sec = sections[i];
    const lines = sec.split('\n');
    const title = lines[0].trim();
    const rest = lines.slice(1).join('\n');

    const dateMatch = rest.match(/📅 \*(.*?)\*/);
    const dateStr = dateMatch ? dateMatch[1] : '';

    const userMatch = rest.match(/#### 👤 Gebruiker:\n\n([\s\S]*?)(?=\n\n#### 🤖 Antigravity Assistent:)/);
    const userText = userMatch ? escapeHtml(userMatch[1].trim()) : '';

    const assistantMatch = rest.match(/#### 🤖 Antigravity Assistent:\n\n([\s\S]*?)(?=\n\n> ⚙️|---|\n\n###|$)/);
    let assistantText = assistantMatch ? assistantMatch[1].trim() : '';

    // Convert assistant markdown basics (bold, lists, code)
    assistantText = formatAssistantMarkdown(assistantText);

    htmlRondes += `
      <div class="chat-round mb-8 bg-[#1e232d] rounded-3xl p-5 sm:p-7 border border-stone-800 shadow-xl" id="ronde-${title}">
        <div class="flex items-center justify-between pb-3 mb-4 border-b border-stone-800/80">
          <span class="px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-700/60 text-emerald-400 font-mono text-xs font-bold">Ronde ${title}</span>
          <span class="text-stone-400 text-xs">${dateStr}</span>
        </div>

        <!-- Gebruiker Bericht -->
        <div class="user-bubble flex items-start gap-3 mb-6 bg-stone-900/80 p-4 rounded-2xl border border-stone-800">
          <div class="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center text-lg font-bold shrink-0">👤</div>
          <div class="flex-1 overflow-x-auto text-sm text-stone-100 whitespace-pre-wrap leading-relaxed font-medium">${userText}</div>
        </div>

        <!-- Assistent Bericht -->
        <div class="assistant-bubble flex items-start gap-3 bg-[#161a22] p-5 rounded-2xl border border-emerald-900/40 shadow-inner">
          <div class="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center text-lg font-bold shrink-0">🤖</div>
          <div class="flex-1 overflow-x-auto text-sm text-stone-200 leading-relaxed prose prose-invert max-w-none">${assistantText}</div>
        </div>
      </div>
    `;
  }

  return `<!DOCTYPE html>
<html lang="nl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Chatgeschiedenis: Speurtocht voor de toekomst</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" rel="stylesheet">
  <style>
    body { font-family: 'Plus Jakarta Sans', sans-serif; background-color: #0f1218; color: #f3f4f6; }
    pre { background: #0b0d13 !important; border: 1px solid #2d3748; border-radius: 12px; padding: 12px; overflow-x: auto; }
    code { font-family: monospace; color: #34d399; }
  </style>
</head>
<body class="p-4 sm:p-8 max-w-4xl mx-auto">
  <header class="mb-8 p-6 rounded-3xl bg-gradient-to-r from-emerald-950/80 via-stone-900 to-[#1e232d] border border-emerald-700/50 shadow-2xl">
    <div class="flex items-center gap-3 mb-2">
      <span class="text-3xl">📜</span>
      <h1 class="text-xl sm:text-2xl font-black text-white">Volledige Chatgeschiedenis: Doomscroll Escape</h1>
    </div>
    <p class="text-xs sm:text-sm text-stone-300">Alle 73 gespreksrondes met ontwikkelstappen, prompts, antwoorden en code-aanpassingen.</p>
    <div class="flex flex-wrap gap-2 mt-4 text-xs">
      <a href="https://github.com/KyanPat/Speurtocht-voor-de-toekomst" target="_blank" class="px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 flex items-center gap-1.5 font-bold transition">
        <span>GitHub Repository</span>
      </a>
      <a href="/" class="px-3 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold flex items-center gap-1.5 transition">
        <span>Terug naar Game</span>
      </a>
    </div>
  </header>

  <main>
    ${htmlRondes}
  </main>
</body>
</html>`;
}

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function formatAssistantMarkdown(md) {
  let s = escapeHtml(md);
  // Code blocks
  s = s.replace(/```([a-z]*)\n([\s\S]*?)```/g, '<pre><code>$2</code></pre>');
  // Inline code
  s = s.replace(/`([^`]+)`/g, '<code class="bg-stone-900 px-1.5 py-0.5 rounded text-xs font-mono">$1</code>');
  // Bold
  s = s.replace(/\*\*([^*]+)\*\*/g, '<strong class="text-white font-bold">$1</strong>');
  // Bullet lists
  s = s.replace(/^- (.*)$/gm, '<li class="ml-4 list-disc">$1</li>');
  // Headers
  s = s.replace(/^### (.*)$/gm, '<h3 class="text-base font-black text-emerald-400 mt-4 mb-2">$1</h3>');
  s = s.replace(/^## (.*)$/gm, '<h2 class="text-lg font-black text-white mt-5 mb-2">$1</h2>');
  // Linebreaks
  s = s.replace(/\n\n/g, '<br><br>');
  return s;
}

const html = convertToHtml(mdContent);
const publicHtmlPath = path.join(__dirname, '..', 'public', 'chat-export.html');
fs.writeFileSync(publicHtmlPath, html, 'utf8');
console.log(`✅ HTML export geschreven naar ${publicHtmlPath} (${(html.length / 1024).toFixed(1)} KB)`);
