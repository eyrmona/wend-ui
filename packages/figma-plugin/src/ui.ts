import type { PluginMessage } from './tokenTypes';

const textarea = document.getElementById('tokens-input') as HTMLTextAreaElement;
const importButton = document.getElementById('import-button') as HTMLButtonElement;
const status = document.getElementById('status') as HTMLDivElement;

function setStatus(message: string, isError = false) {
  status.textContent = message;
  status.classList.toggle('error', isError);
}

importButton.addEventListener('click', () => {
  let tokens;
  try {
    tokens = JSON.parse(textarea.value);
  } catch {
    setStatus('That is not valid JSON. Paste the contents of build/figma/tokens.json.', true);
    return;
  }

  if (!Array.isArray(tokens)) {
    setStatus('Expected a JSON array of { name, type, value } tokens.', true);
    return;
  }

  setStatus('Importing…');
  parent.postMessage({ pluginMessage: { type: 'import-tokens', tokens } }, '*');
});

window.onmessage = (event: MessageEvent<{ pluginMessage: PluginMessage }>) => {
  const message = event.data.pluginMessage;
  if (message.type === 'import-result') {
    setStatus(`Synced ${message.total} tokens — ${message.created} created, ${message.updated} updated.`);
  } else if (message.type === 'import-error') {
    setStatus(`Import failed: ${message.message}`, true);
  }
};
