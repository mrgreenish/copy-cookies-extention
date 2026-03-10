document.addEventListener('DOMContentLoaded', () => {
  const copyBtn = document.getElementById('copy-btn');
  const pasteBtn = document.getElementById('paste-btn');
  const statusEl = document.getElementById('status');
  const clipboardInfoEl = document.getElementById('clipboard-info');

  loadClipboardInfo();

  copyBtn.addEventListener('click', handleCopy);
  pasteBtn.addEventListener('click', handlePaste);

  async function getActiveTab() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    return tab;
  }

  function isValidUrl(url) {
    return url && (url.startsWith('http://') || url.startsWith('https://'));
  }

  async function handleCopy() {
    try {
      const tab = await getActiveTab();
      if (!isValidUrl(tab.url)) {
        showStatus('Cannot copy cookies from this page', 'error');
        return;
      }

      const url = new URL(tab.url);
      const cookies = await chrome.cookies.getAll({ url: tab.url });

      if (cookies.length === 0) {
        showStatus(`No cookies found for ${url.hostname}`, 'warning');
        return;
      }

      const serialized = cookies.map(c => ({
        name: c.name,
        value: c.value,
        domain: c.domain,
        hostOnly: c.hostOnly,
        path: c.path,
        secure: c.secure,
        httpOnly: c.httpOnly,
        sameSite: c.sameSite,
        expirationDate: c.expirationDate,
        session: c.session,
      }));

      const data = {
        cookies: serialized,
        sourceUrl: tab.url,
        sourceHostname: url.hostname,
        count: serialized.length,
        timestamp: Date.now(),
      };

      await chrome.storage.local.set({ copiedCookies: data });
      showStatus(`Copied ${data.count} cookies from ${url.hostname}`, 'success');
      loadClipboardInfo();
    } catch (err) {
      showStatus(`Error: ${err.message}`, 'error');
    }
  }

  async function handlePaste() {
    try {
      const tab = await getActiveTab();
      if (!isValidUrl(tab.url)) {
        showStatus('Cannot paste cookies to this page', 'error');
        return;
      }

      const result = await chrome.storage.local.get('copiedCookies');
      if (!result.copiedCookies) {
        showStatus('No cookies in clipboard. Copy some first!', 'warning');
        return;
      }

      const { cookies } = result.copiedCookies;
      const targetUrl = tab.url;
      let successCount = 0;
      let failCount = 0;

      for (const cookie of cookies) {
        try {
          const details = {
            url: targetUrl,
            name: cookie.name,
            value: cookie.value,
            path: cookie.path,
            secure: cookie.secure,
            httpOnly: cookie.httpOnly,
            sameSite: cookie.sameSite,
          };

          if (!cookie.hostOnly) {
            details.domain = cookie.domain;
          }

          if (!cookie.session && cookie.expirationDate) {
            details.expirationDate = cookie.expirationDate;
          }

          const set = await chrome.cookies.set(details);
          if (set) {
            successCount++;
          } else {
            failCount++;
          }
        } catch {
          failCount++;
        }
      }

      const hostname = new URL(targetUrl).hostname;
      if (failCount === 0) {
        showStatus(`Pasted ${successCount} cookies to ${hostname}`, 'success');
      } else if (successCount === 0) {
        showStatus(`Failed to paste cookies to ${hostname}`, 'error');
      } else {
        showStatus(`Pasted ${successCount} cookies, ${failCount} failed`, 'warning');
      }
    } catch (err) {
      showStatus(`Error: ${err.message}`, 'error');
    }
  }

  async function loadClipboardInfo() {
    const result = await chrome.storage.local.get('copiedCookies');
    if (result.copiedCookies) {
      const { sourceHostname, count, timestamp } = result.copiedCookies;
      const timeAgo = getRelativeTime(timestamp);
      clipboardInfoEl.textContent = `${count} cookies from ${sourceHostname} (${timeAgo})`;
      clipboardInfoEl.classList.remove('empty');
      pasteBtn.disabled = false;
    } else {
      clipboardInfoEl.textContent = 'No cookies copied yet';
      clipboardInfoEl.classList.add('empty');
      pasteBtn.disabled = true;
    }
  }

  function getRelativeTime(timestamp) {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  }

  function showStatus(message, type) {
    statusEl.textContent = message;
    statusEl.className = `status ${type}`;
  }
});
