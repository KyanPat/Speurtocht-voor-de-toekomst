const fs = require('fs');
const readline = require('readline');
const path = require('path');

async function exportTranscript() {
  const transcriptPath = 'C:/Users/TingK/.gemini/antigravity/brain/d960b9b9-5440-42e8-8c0f-58281bec4511/.system_generated/logs/transcript.jsonl';
  const fileStream = fs.createReadStream(transcriptPath);
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

  const turns = [];
  let currentTurn = null;

  for await (const line of rl) {
    if (!line.trim()) continue;
    try {
      const obj = JSON.parse(line);

      if (obj.type === 'USER_INPUT') {
        let content = obj.content || '';
        // Extract from <USER_REQUEST> if present
        const match = content.match(/<USER_REQUEST>([\s\S]*?)<\/USER_REQUEST>/);
        if (match) {
          content = match[1].trim();
        } else {
          // Strip any metadata or summaries
          content = content.replace(/<CONTEXT_SUMMARY>[\s\S]*?<\/CONTEXT_SUMMARY>/g, '').trim();
          content = content.replace(/<ADDITIONAL_METADATA>[\s\S]*?<\/ADDITIONAL_METADATA>/g, '').trim();
        }

        // Skip internal system-only commands or empty
        if (!content || content.startsWith('{"command":')) continue;

        currentTurn = {
          turnIndex: turns.length + 1,
          time: obj.created_at,
          userMessage: content,
          toolsUsed: new Set(),
          assistantReply: ''
        };
        turns.push(currentTurn);
      } else if (currentTurn) {
        if (obj.type === 'PLANNER_RESPONSE') {
          if (obj.tool_calls && obj.tool_calls.length > 0) {
            obj.tool_calls.forEach(tc => {
              if (tc.name) currentTurn.toolsUsed.add(tc.name);
            });
          }
          if (obj.content && obj.content.trim().length > 0 && (!obj.tool_calls || obj.tool_calls.length === 0)) {
            currentTurn.assistantReply = obj.content.trim();
          }
        }
      }
    } catch (e) {}
  }

  console.log(`Parsed ${turns.length} conversation turns.`);

  // Build Markdown
  let md = `# 📜 Volledige Chatgeschiedenis: Doomscroll Escape (Speurtocht voor de toekomst)

> **Project:** Speurtocht voor de toekomst / Doomscroll Escape  
> **Repository:** [GitHub Repository](https://github.com/KyanPat/Speurtocht-voor-de-toekomst)  
> **Geëxporteerd op:** ${new Date().toLocaleDateString('nl-NL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}  
> **Totaal aantal gespreksrondes:** ${turns.length}  

---

## 📑 Inhoudsopgave
`;

  turns.forEach((t, i) => {
    const preview = t.userMessage.split('\n')[0].substring(0, 60).replace(/[#*`]/g, '');
    md += `- [Ronde ${t.turnIndex}: ${preview}...](#ronde-${t.turnIndex})\n`;
  });

  md += `\n---\n\n## 💬 Het Volledige Gesprek\n\n`;

  turns.forEach((t) => {
    const dateStr = t.time ? new Date(t.time).toLocaleString('nl-NL', { dateStyle: 'medium', timeStyle: 'short' }) : 'Onbekend';
    md += `### Ronde ${t.turnIndex}\n`;
    md += `📅 *${dateStr}*\n\n`;
    md += `#### 👤 Gebruiker:\n\n${t.userMessage}\n\n`;

    if (t.assistantReply) {
      md += `#### 🤖 Antigravity Assistent:\n\n${t.assistantReply}\n\n`;
    } else {
      md += `#### 🤖 Antigravity Assistent:\n\n*(Taak uitgevoerd)*\n\n`;
    }

    if (t.toolsUsed.size > 0) {
      md += `> ⚙️ **Gebruikte tools:** \`${Array.from(t.toolsUsed).join('`, `')}\`\n\n`;
    }

    md += `---\n\n`;
  });

  const docsDir = path.join(__dirname, '..', 'docs');
  if (!fs.existsSync(docsDir)) fs.mkdirSync(docsDir, { recursive: true });

  const outputPath = path.join(docsDir, 'chat-geschiedenis.md');
  fs.writeFileSync(outputPath, md, 'utf8');
  console.log(`✅ Markdown succesvol geschreven naar ${outputPath} (${(md.length / 1024).toFixed(1)} KB)`);
}

exportTranscript();
