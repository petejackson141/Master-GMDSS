/* Master GMDSS — shared app code used by every page:
   registers the service worker (offline + install) and handles the "Install app" button. */
const MG_VERSION = '1.8.3';

(function () {
  // Work out where the app's root folder is, so this works at any web address
  const here = document.currentScript ? document.currentScript.src : location.href;
  const root = new URL('../../', here);

  if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register(new URL('sw.js', root), { scope: root.pathname }).catch(err => console.warn('Service worker not registered:', err));
    });
  }

  // Android/Chrome: keep the install prompt so our own button can show it
  let deferred = null;
  window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault(); deferred = e;
    document.querySelectorAll('[data-install]').forEach(b => b.hidden = false);
  });
  document.addEventListener('click', async e => {
    const b = e.target.closest('[data-install]'); if (!b || !deferred) return;
    deferred.prompt(); await deferred.userChoice; deferred = null;
    document.querySelectorAll('[data-install]').forEach(x => x.hidden = true);
  });
  window.addEventListener('appinstalled', () => document.querySelectorAll('[data-install]').forEach(x => x.hidden = true));

  // iPhone/iPad: no install prompt exists, so show a short how-to instead
  const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) && !window.navigator.standalone;
  if (ios) document.querySelectorAll('[data-ios-hint]').forEach(x => x.hidden = false);

  document.querySelectorAll('[data-version]').forEach(x => x.textContent = 'v' + MG_VERSION);
})();
