'use strict';
const db = window.supabase.createClient(
  'https://rxmxvvmjdotabcrsngol.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ4bXh2dm1qZG90YWJjcnNuZ29sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAzMDQyOTMsImV4cCI6MjA5NTg4MDI5M30.vbz90i_ZFrtrI8MTRBGKuo7IPi7g9Tp7ksaLsrUNdAo'
);
// ============================================================
// CONFIG
// ============================================================

const ADMIN_PASSWORD = 'admin123';

const ARTICLES_STATIC = [
  // {
  //   id: 1, title: 'Proč jsem postavil tento web bez frameworků',
  //   content: 'Lorem ipsum...', tags: ['Web', 'HTML'],
  //   date: '2025-06-01', author: 'Vojtěch Křivan'
  // },
];

// Roles for the typewriter animation
const HERO_ROLES = ['Web Developer', 'Hardware Nadšenec', 'Student SPŠ Tábor', 'Embedded Enthusiast'];

// ============================================================
// STATE
// ============================================================

let articles = [];
let messages = [];
let adminAuthed = false;
let skillBarsAnimated = false;
let statsAnimated     = false;

// ============================================================
// BOOT
// ============================================================

document.addEventListener('DOMContentLoaded', async () => {
  initTheme();
  initNav();
  initMobileMenu();
  initScrollProgress();
  initBackTop();
  initTyping();
  await loadArticles();
  initBlogAdmin();
  await initMessages();
  handleHash();
});

// ============================================================
// THEME
// ============================================================

function initTheme() {
  const saved = localStorage.getItem('theme') || 'dark';
  document.documentElement.setAttribute('data-theme', saved);

  document.getElementById('themeToggle').addEventListener('click', () => {
    const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
  });
}

// ============================================================
// NAVIGATION — SPA
// ============================================================

function initNav() {
  document.addEventListener('click', e => {
    const target = e.target.closest('[data-section]');
    if (!target) return;
    e.preventDefault();
    showSection(target.dataset.section);
    closeMobileMenu();
  });
}

function showSection(id) {
  const valid = ['about', 'cv', 'portfolio', 'blog', 'internship'];
  if (!valid.includes(id)) id = 'about';

  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));

  const sec  = document.getElementById(id);
  if (!sec) return;
  sec.classList.add('active');

  const link = document.querySelector(`.nav-link[data-section="${id}"]`);
  if (link) link.classList.add('active');

  history.replaceState(null, '', `#${id}`);
  window.scrollTo({ top: 0, behavior: 'instant' });

  if (id === 'blog') {
    document.getElementById('articleDetail').classList.add('hidden');
    document.getElementById('messagesSection').classList.remove('hidden');
    renderBlog();
    renderMessages();
  }

  // Trigger reveal animations for the new section
  revealSection(id);

  // Animate skill bars once when CV section loads
  if (id === 'cv' && !skillBarsAnimated) {
    skillBarsAnimated = true;
    setTimeout(animateSkillBars, 200);
  }

  // Animate stat counters once when about section loads
  if (id === 'about' && !statsAnimated) {
    statsAnimated = true;
    setTimeout(animateCounters, 400);
  }
}

function handleHash() {
  const hash = window.location.hash.slice(1);
  showSection(hash || 'about');
}

// ============================================================
// MOBILE MENU
// ============================================================

function initMobileMenu() {
  const btn  = document.getElementById('menuBtn');
  const list = document.getElementById('navList');

  btn.addEventListener('click', e => {
    e.stopPropagation();
    const open = list.classList.toggle('open');
    btn.setAttribute('aria-expanded', String(open));
  });

  document.addEventListener('click', e => {
    if (!list.contains(e.target) && !btn.contains(e.target)) closeMobileMenu();
  });
}

function closeMobileMenu() {
  document.getElementById('navList').classList.remove('open');
  document.getElementById('menuBtn').setAttribute('aria-expanded', 'false');
}

// ============================================================
// SCROLL PROGRESS
// ============================================================

function initScrollProgress() {
  const bar = document.getElementById('scrollProgress');
  window.addEventListener('scroll', () => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    if (max <= 0) { bar.style.width = '0%'; return; }
    bar.style.width = (window.scrollY / max * 100) + '%';
  }, { passive: true });
}

// ============================================================
// BACK TO TOP
// ============================================================

function initBackTop() {
  const btn = document.getElementById('backTop');
  window.addEventListener('scroll', () => {
    btn.classList.toggle('hidden', window.scrollY < 400);
  }, { passive: true });
  btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
}

// ============================================================
// TYPING ANIMATION
// ============================================================

function initTyping() {
  const el = document.getElementById('heroRole');
  if (!el) return;

  let roleIndex = 0;
  let charIndex = 0;
  let deleting  = false;
  let paused    = false;

  function tick() {
    const target = HERO_ROLES[roleIndex];

    if (paused) return;

    if (!deleting) {
      el.textContent = target.slice(0, charIndex + 1);
      charIndex++;
      if (charIndex === target.length) {
        paused = true;
        setTimeout(() => { paused = false; deleting = true; }, 1800);
      }
    } else {
      el.textContent = target.slice(0, charIndex - 1);
      charIndex--;
      if (charIndex === 0) {
        deleting = false;
        roleIndex = (roleIndex + 1) % HERO_ROLES.length;
      }
    }
  }

  setInterval(tick, 90);
}

// ============================================================
// SCROLL REVEAL — staggered per-section
// ============================================================

function revealSection(id) {
  const section = document.getElementById(id);
  if (!section) return;
  section.querySelectorAll('.reveal:not(.revealed)').forEach((el, i) => {
    el.style.transitionDelay = (i * 70) + 'ms';
    // Micro-delay so the section's display:block takes effect first
    requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add('revealed')));
  });
}

// ============================================================
// SKILL BARS
// ============================================================

function animateSkillBars() {
  document.querySelectorAll('#cv .bar-fill').forEach(fill => {
    const pct = fill.dataset.pct || '0';
    fill.style.width = pct + '%';
  });
}

// ============================================================
// STAT COUNTERS
// ============================================================

function animateCounters() {
  document.querySelectorAll('.stat-num').forEach(el => {
    const target = parseInt(el.dataset.count, 10);
    let current = 0;
    const step = Math.max(1, Math.floor(target / 30));
    const timer = setInterval(() => {
      current = Math.min(current + step, target);
      el.textContent = current;
      if (current >= target) clearInterval(timer);
    }, 40);
  });
}

// ============================================================
// BLOG — data
// ============================================================

async function loadArticles() {
  const { data, error } = await db
    .from('posts')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) { console.error('Chyba při načítání:', error); articles = [...ARTICLES_STATIC]; return; }
  const staticIds = new Set(ARTICLES_STATIC.map(a => a.id));
  articles = [...ARTICLES_STATIC, ...(data || []).filter(a => !staticIds.has(a.id))];
}



// ============================================================
// BLOG — rendering
// ============================================================

function renderBlog() {
  const list  = document.getElementById('blogList');
  const empty = document.getElementById('blogEmpty');

  if (articles.length === 0) {
    list.innerHTML = '';
    empty.classList.remove('hidden');
    return;
  }

  empty.classList.add('hidden');
  list.innerHTML = articles.map(a => `
    <div class="blog-item" data-id="${a.id}" role="button" tabindex="0" aria-label="Otevřít článek: ${esc(a.title)}">
      <div class="blog-item-head">
        <span class="blog-item-title">${esc(a.title)}</span>
        <span class="blog-item-date">${fmtDate(a.date)}</span>
      </div>
      <p class="blog-item-preview">${esc(preview(a.content))}</p>
      ${a.tags?.length ? `<div class="tag-list">${a.tags.map(t => `<span class="tag">${esc(t)}</span>`).join('')}</div>` : ''}
    </div>
  `).join('');

  list.querySelectorAll('.blog-item').forEach(el => {
    const open = () => openArticle(Number(el.dataset.id));
    el.addEventListener('click', open);
    el.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } });
  });
}

function openArticle(id) {
  const a = articles.find(x => x.id === id);
  if (!a) return;

  document.getElementById('blogList').classList.add('hidden');
  document.getElementById('blogEmpty').classList.add('hidden');
  document.getElementById('messagesSection').classList.add('hidden');

  const detail  = document.getElementById('articleDetail');
  const content = document.getElementById('articleContent');
  detail.classList.remove('hidden');

  content.innerHTML = `
    <h1>${esc(a.title)}</h1>
    <div class="article-meta">
      <span>${fmtDate(a.date)}</span>
      ${a.author ? `<span>&middot; ${esc(a.author)}</span>` : ''}
      ${a.tags?.length ? a.tags.map(t => `<span class="tag">${esc(t)}</span>`).join('') : ''}
    </div>
    <div class="article-md">${md(a.content)}</div>
  `;

  window.scrollTo({ top: 0, behavior: 'instant' });
}

document.addEventListener('click', e => {
  if (e.target.closest('#backToBlog')) {
    document.getElementById('articleDetail').classList.add('hidden');
    document.getElementById('blogList').classList.remove('hidden');
    document.getElementById('messagesSection').classList.remove('hidden');
    renderBlog();
  }
});

// ============================================================
// BLOG ADMIN
// ============================================================

function initBlogAdmin() {
  const overlay = document.getElementById('adminOverlay');
  const pwInput = document.getElementById('adminPassword');

  document.getElementById('adminToggleBtn').addEventListener('click', () => {
    overlay.classList.remove('hidden');
    if (!adminAuthed) setTimeout(() => pwInput.focus(), 50);
  });

  document.getElementById('adminClose').addEventListener('click', closeAdmin);
  overlay.addEventListener('click', e => { if (e.target === overlay) closeAdmin(); });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && !overlay.classList.contains('hidden')) closeAdmin();
  });

  document.getElementById('adminLoginBtn').addEventListener('click', doLogin);
  pwInput.addEventListener('keydown', e => { if (e.key === 'Enter') doLogin(); });
  document.getElementById('addArticleBtn').addEventListener('click', doAddArticle);
  document.getElementById('exportJsonBtn').addEventListener('click', doExport);
}

function closeAdmin() {
  document.getElementById('adminOverlay').classList.add('hidden');
}

function doLogin() {
  const pw  = document.getElementById('adminPassword').value;
  const err = document.getElementById('adminAuthError');

  if (pw === ADMIN_PASSWORD) {
    adminAuthed = true;
    document.getElementById('adminAuthPanel').classList.add('hidden');
    document.getElementById('adminPanel').classList.remove('hidden');
    err.classList.add('hidden');
    renderAdminList();
    renderAdminMessages();
  } else {
    err.classList.remove('hidden');
    document.getElementById('adminPassword').value = '';
    document.getElementById('adminPassword').focus();
  }
}

async function doAddArticle() {
  const titleEl   = document.getElementById('articleTitle');
  const tagsEl    = document.getElementById('articleTags');
  const contentEl = document.getElementById('articleBody');
  const err       = document.getElementById('adminArticleError');

  const title   = titleEl.value.trim();
  const content = contentEl.value.trim();
  const tags    = tagsEl.value.split(',').map(t => t.trim()).filter(Boolean);

  if (!title || !content) { err.classList.remove('hidden'); return; }
  err.classList.add('hidden');

  const { data: inserted, error: insertError } = await db
    .from('posts')
    .insert({ 
      title, 
      content, 
      tags, 
      slug: title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''), 
      date: new Date().toISOString().split('T')[0], 
      author: 'Vojtěch Křivan' 
    })
    .select()
    .single();

  if (insertError) { console.error('Chyba:', insertError); return; }
  articles.unshift(inserted);
  titleEl.value = tagsEl.value = contentEl.value = '';
  renderBlog();
  renderAdminList();

  const btn = document.getElementById('addArticleBtn');
  btn.textContent = 'Publikováno!';
  btn.disabled = true;
  setTimeout(() => { btn.textContent = 'Publikovat článek'; btn.disabled = false; }, 1600);
}

function doExport() {
  const json = JSON.stringify(articles, null, 2);
  const btn  = document.getElementById('exportJsonBtn');
  const ok   = () => { btn.textContent = 'Zkopírováno!'; setTimeout(() => (btn.innerHTML = exportBtnHtml()), 2000); };
  const fallback = () => {
    const ta = Object.assign(document.createElement('textarea'), { value: json });
    Object.assign(ta.style, { position: 'fixed', opacity: '0' });
    document.body.appendChild(ta); ta.select();
    try { document.execCommand('copy'); ok(); } catch (_) {}
    document.body.removeChild(ta);
  };
  navigator.clipboard?.writeText(json).then(ok).catch(fallback) ?? fallback();
}

function exportBtnHtml() {
  return `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    <polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
  </svg> Exportovat JSON`;
}

function renderAdminList() {
  const cont = document.getElementById('adminArticleList');
  if (!articles.length) {
    cont.innerHTML = '<p style="color:var(--text-muted);font-size:.875rem">Žádné články.</p>';
    return;
  }
  cont.innerHTML = articles.map(a => `
    <div class="admin-article-row">
      <span class="admin-row-title">${esc(a.title)}</span>
      <span class="admin-row-date">${fmtDate(a.date)}</span>
      <button class="btn btn-danger" data-del="${a.id}" aria-label="Smazat '${esc(a.title)}'">Smazat</button>
    </div>
  `).join('');

  cont.querySelectorAll('[data-del]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const art = articles.find(a => a.id === btn.dataset.del);
      if (!art || !confirm(`Smazat článek „${art.title}"?`)) return;
      const { error } = await db.from('posts').delete().eq('id', btn.dataset.del);
      if (error) { console.error('Chyba při mazání:', error); return; }
      articles = articles.filter(a => a.id !== btn.dataset.del);
      renderBlog();
      renderAdminList();
    });
  });
}

// ============================================================
// MESSAGES — data
// ============================================================

async function loadMessages() {
  const { data, error } = await db
    .from('messages')
    .select('*')
    .order('id', { ascending: false });
  if (error) { console.error('Chyba při načítání zpráv:', error); messages = []; return; }
  messages = data || [];
}

// ============================================================
// MESSAGES — public
// ============================================================

async function initMessages() {
  await loadMessages();
  renderMessages();
  document.getElementById('sendMsgBtn').addEventListener('click', doSendMessage);
  document.getElementById('msgText').addEventListener('keydown', e => {
    if (e.key === 'Enter' && e.ctrlKey) doSendMessage();
  });
}

function renderMessages() {
  const list  = document.getElementById('messagesList');
  const empty = document.getElementById('messagesEmpty');

  if (!messages.length) { list.innerHTML = ''; empty.classList.remove('hidden'); return; }
  empty.classList.add('hidden');
  list.innerHTML = messages.map(m => `
    <div class="message-item">
      <div class="message-item-header">
        <span class="message-item-name">${esc(m.name)}</span>
        <span class="message-item-date">${fmtDate(m.date)}</span>
      </div>
      <p class="message-item-text">${esc(m.text)}</p>
      ${m.reply ? `
        <div class="message-reply">
          <span class="message-reply-label">Odpověď Vojtěcha:</span>
          <p>${esc(m.reply)}</p>
        </div>
      ` : ''}
    </div>
  `).join('');
}

async function doSendMessage() {
  const nameEl = document.getElementById('msgName');
  const textEl = document.getElementById('msgText');
  const err    = document.getElementById('msgError');

  const name = nameEl.value.trim();
  const text = textEl.value.trim();
  if (!name || !text) { err.classList.remove('hidden'); return; }
  err.classList.add('hidden');

  const { data: inserted, error } = await db
    .from('messages')
    .insert({ name, text, date: new Date().toISOString().split('T')[0] })
    .select()
    .single();
  if (error) { console.error('Chyba při odesílání:', error); return; }
  messages.unshift(inserted);
  nameEl.value = textEl.value = '';
  renderMessages();
  if (adminAuthed) renderAdminMessages();

  const btn = document.getElementById('sendMsgBtn');
  btn.textContent = 'Odesláno!';
  btn.disabled = true;
  setTimeout(() => { btn.textContent = 'Odeslat zprávu'; btn.disabled = false; }, 1600);
}

// ============================================================
// MESSAGES — admin
// ============================================================

function renderAdminMessages() {
  const cont    = document.getElementById('adminMessageList');
  const countEl = document.getElementById('adminMsgCount');
  countEl.textContent = messages.length;

  if (!messages.length) {
    cont.innerHTML = '<p style="color:var(--text-muted);font-size:.875rem">Žádné zprávy.</p>';
    return;
  }

  cont.innerHTML = messages.map(m => `
    <div class="admin-msg-row">
      <div class="admin-msg-header">
        <span class="admin-msg-name">${esc(m.name)}</span>
        <span class="admin-row-date">${fmtDate(m.date)}</span>
        <button class="btn btn-danger" data-del-msg="${m.id}" aria-label="Smazat zprávu od ${esc(m.name)}">Smazat</button>
      </div>
      <p class="admin-msg-text">${esc(m.text)}</p>
      ${m.reply ? `<p class="admin-msg-reply-preview"><strong>Odpověď:</strong> ${esc(m.reply)}</p>` : ''}
      <div class="admin-reply-form">
        <input type="text" class="form-input" data-reply-input="${m.id}"
          placeholder="Odpovědět…" value="${m.reply ? esc(m.reply) : ''}">
        <button class="btn btn-primary btn-sm" data-reply-btn="${m.id}">${m.reply ? 'Upravit' : 'Odpovědět'}</button>
        ${m.reply ? `<button class="btn btn-danger btn-sm" data-clear-reply="${m.id}">Zrušit</button>` : ''}
      </div>
    </div>
  `).join('');

  cont.querySelectorAll('[data-del-msg]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id  = Number(btn.dataset.delMsg);
      const msg = messages.find(m => m.id === id);
      if (!msg || !confirm(`Smazat zprávu od „${msg.name}"?`)) return;
      const { error } = await db.from('messages').delete().eq('id', id);
      if (error) { console.error('Chyba při mazání:', error); return; }
      messages = messages.filter(m => m.id !== id);
      renderMessages(); renderAdminMessages();
    });
  });

  cont.querySelectorAll('[data-reply-btn]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id    = Number(btn.dataset.replyBtn);
      const input = cont.querySelector(`[data-reply-input="${id}"]`);
      const text  = input?.value.trim();
      if (!text) return;
      const msg = messages.find(m => m.id === id);
      if (!msg) return;
      const { error } = await db.from('messages').update({ reply: text }).eq('id', id);
      if (error) { console.error('Chyba při odpovídání:', error); return; }
      msg.reply = text;
      renderMessages(); renderAdminMessages();
    });
  });

  cont.querySelectorAll('[data-clear-reply]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id  = Number(btn.dataset.clearReply);
      const msg = messages.find(m => m.id === id);
      if (!msg) return;
      const { error } = await db.from('messages').update({ reply: null }).eq('id', id);
      if (error) { console.error('Chyba při mazání odpovědi:', error); return; }
      msg.reply = null;
      renderMessages(); renderAdminMessages();
    });
  });
}

// ============================================================
// UTILITIES
// ============================================================

function esc(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

function preview(text, len = 160) {
  const plain = String(text).replace(/[#*`_~]/g, '');
  return plain.length > len ? plain.slice(0, len) + '…' : plain;
}

function fmtDate(str) {
  try { return new Date(str).toLocaleDateString('cs-CZ', { year: 'numeric', month: 'long', day: 'numeric' }); }
  catch { return str; }
}

function md(raw) {
  let h = esc(raw);
  h = h.replace(/^### (.+)$/gm, '<h3>$1</h3>');
  h = h.replace(/^## (.+)$/gm,  '<h2>$1</h2>');
  h = h.replace(/^# (.+)$/gm,   '<h1>$1</h1>');
  h = h.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  h = h.replace(/\*(.+?)\*/g,     '<em>$1</em>');
  h = h.replace(/`([^`\n]+)`/g,   '<code>$1</code>');
  h = h.replace(/^---$/gm, '<hr>');
  return h.split(/\n{2,}/).map(block => {
    block = block.trim();
    if (!block) return '';
    if (/^<(h[1-6]|hr)/.test(block)) return block;
    return `<p>${block.replace(/\n/g, '<br>')}</p>`;
  }).join('\n');
}
