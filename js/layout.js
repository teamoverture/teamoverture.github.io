// Inject shared navbar and footer into every page
(function () {
  const MERCH_URL = "https://overture-shop.fourthwall.com/";

  const SOCIALS = [
    { key: 'twitch',    url: 'https://twitch.tv/team/overture',                    alt: 'Twitch'    },
    { key: 'discord',   url: 'https://discord.gg/mnuBB3BCP5',                      alt: 'Discord'   },
    { key: 'bluesky',   url: 'https://bsky.app/profile/teamoverture.bsky.social',   alt: 'Bluesky'   },
    { key: 'instagram', url: 'https://www.instagram.com/teamoverture',              alt: 'Instagram' },
    { key: 'twitter',   url: 'https://x.com/teamoverture',                         alt: 'X/Twitter' },
  ];

  const currentPage = location.pathname.replace(/\/$/, '').split("/").pop() || '';

  function navLink(href, label, extraClass = "") {
    const current = location.pathname.replace(/\/$/, '');
    const active = (href === '/' && current === '') || (href !== '/' && current.endsWith(href.replace('/', ''))) ? ' active' : '';
    return `<a class="nav-link${active}${extraClass ? " " + extraClass : ""}" href="${href}">${label}</a>`;
  }

  const footerIcons = SOCIALS
    .map(({ key, url, alt }) => `<a href="${url}" target="_blank" rel="noopener" title="${alt}"><img class="ov-footer-icon" src="/images/socials/${key}.svg" alt="${alt}"/></a>`)
    .join("");

  const navbar = `
<nav class="navbar navbar-expand-md ov-navbar sticky-top">
  <div class="container-fluid">
    <a class="navbar-brand" href="/">
      <img src="/images/logo.png" alt="Overture" class="ov-logo" onerror="this.style.display='none';this.nextElementSibling.style.display='inline'"/>
      <span style="display:none">Overture</span>
    </a>
    <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navMenu">
      <span class="navbar-toggler-icon"></span>
    </button>
    <div class="collapse navbar-collapse" id="navMenu">
      <ul class="navbar-nav ms-auto align-items-md-stretch">
        <li class="nav-item">${navLink("/", "Watch")}</li>
        <li class="nav-item">${navLink("/about/", "About")}</li>
        <li class="nav-item">${navLink("/contact/", "Contact")}</li>
        <li class="nav-item">
          <a class="nav-link merch-link" href="${MERCH_URL}" target="_blank" rel="noopener">Merch</a>
        </li>
      </ul>
    </div>
  </div>
</nav>`;

  const footer = `
<footer class="ov-footer mt-auto">
  <div class="ov-footer-inner">
    <span>&copy; ${new Date().getFullYear()} Team Overture</span>
    <div class="ov-footer-icons">${footerIcons}</div>
  </div>
</footer>`;

  document.getElementById("ov-navbar").innerHTML = navbar;
  document.getElementById("ov-footer").innerHTML = footer;

  // Load and render alert banner
  fetch('/alert.json')
    .then(r => r.json())
    .then(alert => {
      if (!alert.enabled) return;
      const key = btoa(alert.message).slice(0, 16);
      if (sessionStorage.getItem('alertDismissed') === key) return;
      const bar = document.createElement('div');
      bar.id = 'ov-alert';
      bar.style.cssText = 'background:var(--p);color:#fff;font-family:"Barlow",sans-serif;font-size:.875rem;padding:8px 16px;display:flex;align-items:center;justify-content:center;gap:12px;position:relative;flex-shrink:0;';
      const link = alert.link?.url
        ? `<a href="${alert.link.url}" target="_blank" rel="noopener" style="color:#fff;font-weight:600;text-decoration:underline;white-space:nowrap;">${alert.link.text} ↗</a>`
        : '';
      bar.innerHTML = `
        <span style="text-align:center;">${alert.message}${link ? '&ensp;' + link : ''}</span>
        <button id="alert-close" style="position:absolute;right:12px;top:50%;transform:translateY(-50%);background:none;border:none;color:#fff;cursor:pointer;font-size:1.1rem;opacity:.8;line-height:1;padding:4px;" title="Dismiss">&times;</button>
      `;
      document.getElementById('ov-navbar').insertAdjacentElement('beforebegin', bar);
      document.getElementById('alert-close').addEventListener('click', () => {
        bar.remove();
        sessionStorage.setItem('alertDismissed', key);
      });
    })
    .catch(() => {});
})();
