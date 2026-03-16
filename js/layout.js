// Inject shared navbar and footer into every page
(function () {
  const MERCH_URL = "https://overture-shop.fourthwall.com/";

  const SOCIALS = {
    twitch:    "https://twitch.tv/team/overture",
    discord:   "https://discord.gg/mnuBB3BCP5",
    bluesky:   "https://bsky.app/profile/teamoverture.bsky.social",
	  instagram: "https://www.instagram.com/teamoverture",
    twitter:   "https://x.com/teamoverture",
  };

  const currentPage = location.pathname.split("/").pop() || "index.html";

  function navLink(href, label, extraClass = "") {
    const active = currentPage === href ? " active" : "";
    return `<a class="nav-link${active}${extraClass ? " " + extraClass : ""}" href="${href}">${label}</a>`;
  }

  // SVG icons for footer
  const icons = {
    twitch: `<img class="ov-footer-icon" src="images/socials/twitch.svg" alt="Twitch"/>`,
	  discord: `<img class="ov-footer-icon" src="images/socials/discord.svg" alt="Discord"/>`,
	  bluesky: `<img class="ov-footer-icon" src="images/socials/bluesky.svg" alt="Bluesky"/>`,
	  instagram: `<img class="ov-footer-icon" src="images/socials/instagram.svg" alt="Instagram"/>`,
    twitter: `<img class="ov-footer-icon" src="images/socials/twitter.svg" alt="Twitter"/>`,
  };

  const footerIcons = Object.entries(SOCIALS)
    .map(([key, url]) => `<a href="${url}" target="_blank" rel="noopener" title="${key}">${icons[key]}</a>`)
    .join("");

  const navbar = `
<nav class="navbar navbar-expand-md ov-navbar sticky-top">
  <div class="container-fluid">
    <a class="navbar-brand" href="/">
      <img src="images/logo.png" alt="Overture" class="ov-logo" onerror="this.style.display='none';this.nextElementSibling.style.display='inline'"/>
      <span style="display:none">Overture</span>
    </a>
    <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navMenu">
      <span class="navbar-toggler-icon"></span>
    </button>
    <div class="collapse navbar-collapse" id="navMenu">
      <ul class="navbar-nav ms-auto align-items-md-stretch">
        <li class="nav-item">${navLink("/", "Watch")}</li>
        <li class="nav-item">${navLink("about.html", "About")}</li>
        <li class="nav-item">${navLink("contact.html", "Contact")}</li>
        <li class="nav-item">
          <a class="nav-link merch-link" href="${MERCH_URL}" target="_blank" rel="noopener">
            Merch
          </a>
        </li>
      </ul>
    </div>
  </div>
</nav>`;

  const footer = `
<footer class="ov-footer mt-auto">
  <div class="ov-footer-inner">
    <span>&copy; ${new Date().getFullYear()} Team Overture &mdash; All rights reserved.</span>
    <div class="ov-footer-icons">${footerIcons}</div>
  </div>
</footer>`;

  document.getElementById("ov-navbar").innerHTML = navbar;
  document.getElementById("ov-footer").innerHTML = footer;

  // Load and render alert banner
  const alertPath = location.pathname.includes('/') 
    ? location.pathname.replace(/\/[^/]*$/, '/') + 'alert.json'
    : 'alert.json';
  fetch(alertPath)
    .then(r => r.json())
    .then(alert => {
      if (!alert.enabled) return;
      const dismissed = sessionStorage.getItem('alertDismissed');
      // Use message content as key so new alerts show even if a previous one was dismissed
      const key = btoa(alert.message).slice(0, 16);
      if (dismissed === key) return;
      const bar = document.createElement('div');
      bar.id = 'ov-alert';
      bar.style.cssText = 'background:var(--p);color:#fff;font-family:"Barlow",sans-serif;font-size:.875rem;padding:8px 16px;display:flex;align-items:center;justify-content:center;gap:12px;position:relative;flex-shrink:0;';
      const link = alert.link && alert.link.url
        ? `<a href="${alert.link.url}" target="_blank" rel="noopener" style="color:#fff;font-weight:600;text-decoration:underline;white-space:nowrap;">${alert.link.text} ↗</a>`
        : '';
      bar.innerHTML = `
        <span style="text-align:center;">${alert.message}${link ? '&ensp;' + link : ''}</span>
        <button id="alert-close" style="position:absolute;right:12px;top:50%;transform:translateY(-50%);background:none;border:none;color:#fff;cursor:pointer;font-size:1.1rem;opacity:.8;line-height:1;padding:4px;" title="Dismiss">&times;</button>
      `;
      // Insert before navbar
      const navbar = document.getElementById('ov-navbar');
      navbar.insertAdjacentElement('beforebegin', bar);
      document.getElementById('alert-close').addEventListener('click', () => {
        bar.remove();
        sessionStorage.setItem('alertDismissed', key);
      });
    })
    .catch(() => {}); // Silently fail if alert.json is missing
})();
