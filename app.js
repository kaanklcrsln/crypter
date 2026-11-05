'use strict';
(() => {
  const $ = (id) => document.getElementById(id);
  const HASH_RE = /^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/;
  const enc = new TextEncoder();

  const genText = $('gen-text'), genToggle = $('gen-toggle'), genBytes = $('gen-bytes');
  const rounds = $('rounds'), roundsHint = $('rounds-hint');
  const genBtn = $('gen-btn'), genOut = $('gen-out'), genMsg = $('gen-msg');
  const verHash = $('ver-hash'), verText = $('ver-text'), verBytes = $('ver-bytes');
  const verBtn = $('ver-btn'), verMsg = $('ver-msg'), langBtn = $('lang-btn');

  // i18n: default English, no persistence (no localStorage)
  let lang = 'en';
  const t = (key, ...a) => { const v = I18N[lang][key]; return typeof v === 'function' ? v(...a) : v; };
  const msgs = new Map(); // element -> [cls, key, ...args], re-rendered on language switch
  const say = (el, cls, key, ...a) => {
    msgs.set(el, [cls, key, ...a]);
    el.className = cls;
    el.textContent = key ? t(key, ...a) : '';
  };
  const render = () => {
    document.documentElement.lang = lang;
    document.querySelectorAll('[data-i18n]').forEach((el) => { el.textContent = t(el.dataset.i18n); });
    document.querySelectorAll('[data-i18n-aria]').forEach((el) => { el.setAttribute('aria-label', t(el.dataset.i18nAria)); });
    langBtn.setAttribute('aria-label', t('switchLabel'));
    genToggle.textContent = t(genText.type === 'password' ? 'show' : 'hide');
    genBtn.textContent = t(genBtn.disabled ? 'busy' : 'genBtn');
    verBtn.textContent = t(verBtn.disabled ? 'busy' : 'verBtn');
    msgs.forEach((m, el) => say(el, ...m));
  };
  langBtn.addEventListener('click', () => { lang = lang === 'en' ? 'tr' : 'en'; render(); });

  // 72-byte warning
  const watchBytes = (input, out) => input.addEventListener('input', () => {
    const n = enc.encode(input.value).length;
    out.hidden = n <= 72;
    say(out, 'warn', 'bytes', n);
  });
  watchBytes(genText, genBytes);
  watchBytes(verText, verBytes);

  genToggle.addEventListener('click', () => {
    const show = genText.type === 'password';
    genText.type = show ? 'text' : 'password';
    genToggle.textContent = t(show ? 'hide' : 'show');
    genToggle.setAttribute('aria-pressed', String(show));
  });

  // Rounds
  const clamp = (v) => Math.min(15, Math.max(4, Number.isFinite(v) ? Math.round(v) : 12));
  const updateHint = () => {
    const r = clamp(rounds.valueAsNumber);
    const [key, cls] = r < 10 ? ['weak', 'weak'] : r < 12 ? ['mid', 'mid'] : r < 14 ? ['ok', 'ok'] : ['slow', 'mid'];
    say(roundsHint, `hint ${cls}`, key);
  };
  const setRounds = (v) => { rounds.value = clamp(v); updateHint(); };
  $('rounds-dec').addEventListener('click', () => setRounds(rounds.valueAsNumber - 1));
  $('rounds-inc').addEventListener('click', () => setRounds(rounds.valueAsNumber + 1));
  rounds.addEventListener('input', updateHint);
  rounds.addEventListener('change', () => setRounds(rounds.valueAsNumber));

  const busy = (btn, on, label) => { btn.disabled = on; btn.textContent = t(on ? 'busy' : label); };
  const errMsg = (e) => (e && e.message ? e.message : String(e));

  // Generate
  genBtn.addEventListener('click', async () => {
    if (!genText.value) return say(genMsg, 'hint', 'empty');
    const r = clamp(rounds.valueAsNumber);
    rounds.value = r;
    busy(genBtn, true);
    say(genMsg, 'hint', '');
    genOut.value = '';
    try {
      genOut.value = await bcrypt.hash(genText.value, r);
    } catch (e) {
      say(genMsg, 'hint', 'error', errMsg(e));
    } finally {
      busy(genBtn, false, 'genBtn');
    }
  });

  $('copy-btn').addEventListener('click', async () => {
    if (!genOut.value) return;
    try {
      await navigator.clipboard.writeText(genOut.value);
      say(genMsg, 'hint', 'copied');
    } catch {
      genOut.select();
      say(genMsg, 'hint', 'noClip');
    }
  });

  // Verify
  verBtn.addEventListener('click', async () => {
    const h = verHash.value.trim();
    if (!HASH_RE.test(h)) return say(verMsg, 'result bad', 'badFormat');
    busy(verBtn, true);
    say(verMsg, 'result', '');
    try {
      const ok = await bcrypt.compare(verText.value, h);
      say(verMsg, `result ${ok ? 'ok' : 'bad'}`, ok ? 'match' : 'noMatch');
    } catch (e) {
      say(verMsg, 'result bad', 'error', errMsg(e));
    } finally {
      busy(verBtn, false, 'verBtn');
    }
  });

  updateHint();
  render();
})();
