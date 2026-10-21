/* Master GMDSS — study pages: show one section at a time.
   The page's own contents links (the pills under the title) choose the section; Previous / Next buttons sit under it.
   "All" shows everything. Printing always prints every section. */
(function () {
  const nav = document.querySelector('.wrap nav');
  if (!nav) return;
  const links = Array.from(nav.querySelectorAll('a[href^="#"]'));
  const secs = links.map(a => document.getElementById(a.getAttribute('href').slice(1))).filter(Boolean);
  if (secs.length < 2) return;
  const names = {};
  links.forEach(a => { names[a.getAttribute('href').slice(1)] = a.textContent.trim(); });

  const all = document.createElement('a');
  all.href = '#all'; all.textContent = 'All';
  nav.appendChild(all);
  links.push(all);

  const pager = document.createElement('div');
  pager.className = 'st-pager';
  pager.innerHTML = '<a class="prev" href="#"></a><span class="sp"></span><a class="next" href="#"></a>';
  secs[secs.length - 1].after(pager);
  const prev = pager.querySelector('.prev'), next = pager.querySelector('.next');

  function show(id, scroll) {
    if (id !== 'all' && !secs.some(s => s.id === id)) id = secs[0].id;
    const i = secs.findIndex(s => s.id === id);
    secs.forEach(s => s.classList.toggle('sec-off', id !== 'all' && s.id !== id));
    links.forEach(a => a.setAttribute('aria-current', a.getAttribute('href') === '#' + id ? 'true' : 'false'));
    pager.hidden = id === 'all';
    prev.hidden = i <= 0; next.hidden = i < 0 || i >= secs.length - 1;
    if (i > 0) { prev.href = '#' + secs[i - 1].id; prev.textContent = '‹ ' + names[secs[i - 1].id]; }
    if (i >= 0 && i < secs.length - 1) { next.href = '#' + secs[i + 1].id; next.textContent = names[secs[i + 1].id] + ' ›'; }
    if (scroll) (id === 'all' ? nav : secs[i]).scrollIntoView({ block: 'start' });
  }

  document.addEventListener('click', e => {
    const a = e.target.closest('a[href^="#"]');
    if (!a || !(nav.contains(a) || pager.contains(a))) return;
    e.preventDefault();
    const id = a.getAttribute('href').slice(1);
    history.replaceState(null, '', '#' + id);
    show(id, true);
  });
  window.addEventListener('hashchange', () => show(location.hash.slice(1), true));
  show(location.hash.slice(1), false);
})();
