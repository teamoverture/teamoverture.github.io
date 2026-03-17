// ── Constants ──────────────────────────────────────────────────────
const PARENT_DOMAIN    = "teamoverture.github.io";
const DEFAULT_CHANNEL  = { login: "teamoverture", display: "teamoverture" };
const REFRESH_INTERVAL = 15 * 60 * 1000; // 15 minutes
const WORKER_URL       = "https://overture-twitch-status.overturecreators.workers.dev";
// ──────────────────────────────────────────────────────────────────

// Show adblocker warning once per session
if (!sessionStorage.getItem('adblockDismissed')) {
  const modal = new bootstrap.Modal(document.getElementById('adblockModal'), { backdrop: 'static', keyboard: false });
  modal.show();
  document.getElementById('adblockDismiss').addEventListener('click', () => {
    sessionStorage.setItem('adblockDismissed', '1');
    modal.hide();
  });
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

let allChannels = [];
let liveSet = new Set();
let sortMode = null;
let baseOrder = [];
let filterText = '';
let active = null;
let playerFrame = null;
let liveChecksComplete = false;

const searchEl   = document.getElementById('sb-search');
const sortBtn    = document.getElementById('sort-btn');
const sortLabel  = document.getElementById('sort-label');
const chList     = document.getElementById('ch-list');
const noResults  = document.getElementById('no-results');
const sbNotice   = document.getElementById('sb-notice');
const playerArea = document.getElementById('player-area');

function getOrdered() {
  const live = baseOrder.filter(ch => liveSet.has(ch.login));
  const offline = baseOrder.filter(ch => !liveSet.has(ch.login));
  return [...live, ...offline];
}

function getVisible() {
  const q = filterText.toLowerCase();
  return getOrdered().filter(ch =>
    ch.display.toLowerCase().includes(q) || ch.login.includes(q)
  );
}

function showSidebarLoading() {
  chList.innerHTML = `
    <div class="sb-loading">
      <div class="sb-loading__spinner"></div>
      <span class="sb-loading__text">Checking who's live…</span>
    </div>`;
}

function render() {
  if (!liveChecksComplete) { showSidebarLoading(); return; }
  const visible = getVisible();
  chList.innerHTML = '';
  noResults.style.display = visible.length === 0 ? 'block' : 'none';
  sbNotice.style.display = 'block';
  visible.forEach(ch => {
    const isLive = liveSet.has(ch.login);
    const el = document.createElement('div');
    el.className = 'ch' + (ch.login === active ? ' active' : '');
    const badge = isLive ? `<span class="live-badge">LIVE</span>` : '';
    el.innerHTML = `<div class="ci"><div class="cn-row"><span class="cn">${ch.display}</span>${badge}</div><div class="cs"><a href="https://www.twitch.tv/${ch.login}" target="_blank">twitch.tv/${ch.login}</a></div></div>`;
    el.addEventListener('click', e => { if (e.target.tagName === 'A') return; tuneIn(ch.login, ch.display); });
    chList.appendChild(el);
  });
}

function tuneIn(login, display) {
  active = login;
  if (playerFrame) playerFrame.remove();
  playerFrame = document.createElement('iframe');
  playerFrame.src = `https://player.twitch.tv/?channel=${login}&parent=${PARENT_DOMAIN}&autoplay=true&muted=false`;
  playerFrame.allowFullscreen = true;
  playerFrame.allow = 'autoplay; fullscreen';
  playerArea.innerHTML = '';
  playerArea.appendChild(playerFrame);
  render();
}

function showNobodyLive() {
  if (playerFrame) { playerFrame.remove(); playerFrame = null; }
  active = null;
  playerArea.innerHTML = `
    <div class="player-state">
      <p class="player-state__title">Looks like no one is live right now.</p>
      <p class="player-state__sub">Be on the lookout! Browse through our creators on the right to check out their schedules and catch them next time.</p>
      <div class="player-state__socials">
        <a href="https://twitch.tv/team/overture" target="_blank" rel="noopener"><img src="images/socials/twitch.svg" alt="Twitch"/></a>
        <a href="https://discord.gg/mnuBB3BCP5" target="_blank" rel="noopener"><img src="images/socials/discord.svg" alt="Discord"/></a>
        <a href="https://bsky.app/profile/teamoverture.bsky.social" target="_blank" rel="noopener"><img src="images/socials/bluesky.svg" alt="Bluesky"/></a>
        <a href="https://www.instagram.com/teamoverture" target="_blank" rel="noopener"><img src="images/socials/instagram.svg" alt="Instagram"/></a>
        <a href="https://x.com/teamoverture" target="_blank" rel="noopener"><img src="images/socials/twitter.svg" alt="X / Twitter"/></a>
      </div>
    </div>`;
}

function showPlayerLoading() {
  playerArea.innerHTML = `
    <div class="player-state">
      <div class="player-state__spinner"></div>
      <p class="player-state__sub">Checking who's live…</p>
    </div>`;
}

function pickChannel() {
  if (liveSet.has(DEFAULT_CHANNEL.login)) return DEFAULT_CHANNEL;
  const liveChannels = allChannels.filter(ch => liveSet.has(ch.login));
  if (liveChannels.length) return liveChannels[Math.floor(Math.random() * liveChannels.length)];
  return null;
}

function cycleSort() {
  if (sortMode === null || sortMode === 'desc') {
    sortMode = 'asc';
    baseOrder = [...allChannels].sort((a, b) => a.display.localeCompare(b.display));
    sortLabel.textContent = 'A–Z';
    sortBtn.classList.add('active');
  } else {
    sortMode = 'desc';
    baseOrder = [...allChannels].sort((a, b) => b.display.localeCompare(a.display));
    sortLabel.textContent = 'Z–A';
  }
  render();
}

sortBtn.addEventListener('click', cycleSort);
searchEl.addEventListener('input', () => { filterText = searchEl.value; render(); });

async function checkLiveStatuses(initialLoad = false) {
  try {
    const logins = allChannels.map(ch => ch.login).join(",");
    const res = await fetch(`${WORKER_URL}?logins=${logins}`);
    const data = await res.json();
    const newLive = new Set();
    Object.entries(data).forEach(([login, isLive]) => {
      if (isLive) newLive.add(login);
    });
    liveSet = newLive;
  } catch (e) {
    console.warn("Live status check failed:", e);
  }
  liveChecksComplete = true;
  render();
  if (initialLoad) {
    const ch = pickChannel();
    if (ch) {
      tuneIn(ch.login, ch.display);
    } else {
      showNobodyLive();
    }
  }
}

fetch('creators.json')
  .then(r => r.json())
  .then(data => {
    allChannels = data.map(item =>
      typeof item === 'string'
        ? { login: item.trim().toLowerCase(), display: item.trim() }
        : { login: String(item.login).trim().toLowerCase(), display: String(item.display || item.login).trim() }
    );
    baseOrder = shuffle(allChannels);
    render();
    showPlayerLoading();
    checkLiveStatuses(true);
    setInterval(() => checkLiveStatuses(false), REFRESH_INTERVAL);
  })
  .catch(err => {
    console.error('Failed to load creators.json:', err);
    chList.innerHTML = '<div style="padding:20px 14px;text-align:center;color:var(--mut);font-size:12px;">Could not load creator list.</div>';
  });
