// Admin authentication gate — client-side SHA-256 password check.
// To set or change the password, run: node scripts/generate-admin-hash.js <password>
// Then paste the output hash into the HASH constant below.
const HASH = '57bd597d93b1fa0992ecbcecdbf3317fea17f4e87a71cf742627c53ad74bf661';
const SESSION_KEY = 'th_admin_v1';

(function () {
  // Hide the page immediately to prevent content flash before auth check.
  document.documentElement.style.visibility = 'hidden';

  async function sha256(str) {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
    return Array.from(new Uint8Array(buf))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  function revealPage() {
    document.documentElement.style.visibility = '';
  }

  function showGate() {
    const style = document.createElement('style');
    style.textContent = `
      #_auth-gate {
        position: fixed; inset: 0; z-index: 99999;
        background: #f7f7f5;
        display: flex; align-items: center; justify-content: center;
        font-family: 'Spectral', Georgia, serif;
      }
      #_auth-inner { text-align: center; max-width: 280px; width: 100%; padding: 2rem; }
      #_auth-label {
        font-size: 0.72rem; text-transform: uppercase;
        letter-spacing: 0.12em; color: #888; margin-bottom: 1.4rem;
      }
      #_auth-input {
        width: 100%; padding: 0.55rem 0.75rem; box-sizing: border-box;
        border: 1px solid #d8d8d4; border-radius: 4px;
        font-family: inherit; font-size: 1rem;
        background: #fff; color: #111; outline: none;
      }
      #_auth-input:focus { border-color: #888; }
      #_auth-error { color: #b94040; font-size: 0.78rem; margin-top: 0.5rem; min-height: 1.2em; }
    `;
    document.head.appendChild(style);

    const overlay = document.createElement('div');
    overlay.id = '_auth-gate';
    overlay.innerHTML = `
      <div id="_auth-inner">
        <div id="_auth-label">Thoughtful Hollow &middot; Admin</div>
        <input id="_auth-input" type="password" placeholder="Password" autocomplete="current-password">
        <div id="_auth-error"></div>
      </div>
    `;
    document.body.appendChild(overlay);
    revealPage();

    const input = document.getElementById('_auth-input');
    const error = document.getElementById('_auth-error');
    input.focus();

    input.addEventListener('keydown', async (e) => {
      if (e.key !== 'Enter') { error.textContent = ''; return; }
      const hash = await sha256(input.value);
      if (hash === HASH) {
        sessionStorage.setItem(SESSION_KEY, '1');
        overlay.remove();
      } else {
        error.textContent = 'Incorrect password.';
        input.value = '';
        input.focus();
      }
    });
  }

  function showUnconfigured() {
    document.documentElement.style.visibility = '';
    document.addEventListener('DOMContentLoaded', () => {
      const banner = document.createElement('div');
      banner.style.cssText = 'position:fixed;inset:0;z-index:99999;background:#f7f7f5;display:flex;align-items:center;justify-content:center;font-family:monospace;font-size:0.85rem;color:#b94040;';
      banner.textContent = 'Admin auth not configured. Run: node scripts/generate-admin-hash.js <password>';
      document.body.appendChild(banner);
    });
  }

  if (HASH === '__REPLACE_WITH_HASH__') {
    showUnconfigured();
    return;
  }

  if (sessionStorage.getItem(SESSION_KEY) === '1') {
    document.addEventListener('DOMContentLoaded', revealPage);
    return;
  }

  document.addEventListener('DOMContentLoaded', showGate);
})();
