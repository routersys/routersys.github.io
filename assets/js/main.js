const GITHUB_USER = "routersys";
const DATA_FILE = "plugins/data.json";

const CATEGORY_ORDER = [
  "音声読み込みプラグイン",
  "映像読み込みプラグイン",
  "画像読み込みプラグイン",
  "立ち絵プラグイン",
  "図形プラグイン",
  "波形プラグイン",
  "動画出力プラグイン",
  "音声エフェクト",
  "映像エフェクト",
  "音声合成プラグイン",
  "AIテキスト補完プラグイン",
  "場面切り替えプラグイン",
];

const ALL = "__all__";
let state = { repos: [], active: ALL };

/* ---------- JST clock ---------- */
(function clock() {
  const el = document.getElementById("jst");
  if (!el) return;
  const tick = () => {
    el.textContent = new Date().toLocaleTimeString("ja-JP", {
      timeZone: "Asia/Tokyo",
      hour12: false,
    });
  };
  tick();
  setInterval(tick, 1000);
})();

/* ---------- helpers ---------- */
function formatRelative(iso) {
  const d = new Date(iso);
  const diff = Math.floor((Date.now() - d) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 86400 * 30) return `${Math.floor(diff / 86400)}d ago`;
  return d.toLocaleDateString("ja-JP", { year: "numeric", month: "short" });
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

function esc(str) {
  const div = document.createElement("div");
  div.textContent = str == null ? "" : String(str);
  return div.innerHTML;
}

/* ---------- rendering ---------- */
function pluginCard(repo) {
  const name = repo.name.replace(/^YMM4-/, "");
  const desc = repo.description || "説明はありません。";
  const lang = repo.language || "—";
  const stars = repo.stargazers_count ?? 0;
  const updated = repo.pushed_at || repo.updated_at;
  const cats = repo.categories || [];

  const catsHtml = cats.length
    ? `<div class="card-cats">${cats
        .map((c) => `<span class="card-cat">${esc(c)}</span>`)
        .join("")}</div>`
    : "";

  return `
    <article class="card">
      <div class="card-head">
        <span class="card-name">${esc(name)}</span>
        <span class="card-lang">${esc(lang)}</span>
      </div>
      <p class="card-desc">${esc(desc)}</p>
      ${catsHtml}
      <div class="card-foot">
        <span class="card-stars" title="Stars">
          <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 .25a.75.75 0 0 1 .673.418l1.882 3.815 4.21.612a.75.75 0 0 1 .416 1.279l-3.046 2.97.719 4.192a.751.751 0 0 1-1.088.791L8 12.347l-3.766 1.98a.75.75 0 0 1-1.088-.79l.72-4.194L.818 6.374a.75.75 0 0 1 .416-1.28l4.21-.611L7.327.668A.75.75 0 0 1 8 .25Z"/></svg>
          ${stars}
        </span>
        <span class="card-updated">${updated ? formatRelative(updated) : ""}</span>
        <a class="card-link" href="https://github.com/${GITHUB_USER}/${esc(repo.name)}" target="_blank" rel="noopener">GitHub →</a>
      </div>
    </article>`;
}

function renderGrid() {
  const grid = document.getElementById("grid");
  const list =
    state.active === ALL
      ? state.repos
      : state.repos.filter((r) => (r.categories || []).includes(state.active));

  if (!list.length) {
    grid.innerHTML = `<div class="state">該当するプラグインはありません。</div>`;
    return;
  }
  grid.innerHTML = list.map(pluginCard).join("");
}

function renderFilters() {
  const el = document.getElementById("filters");
  const counts = new Map();
  for (const r of state.repos)
    for (const c of r.categories || []) counts.set(c, (counts.get(c) || 0) + 1);

  const present = CATEGORY_ORDER.filter((c) => counts.has(c));
  const buttons = [
    { key: ALL, label: "すべて", n: state.repos.length },
    ...present.map((c) => ({ key: c, label: c, n: counts.get(c) })),
  ];

  el.innerHTML = buttons
    .map(
      (b) =>
        `<button class="filter" role="tab" data-key="${esc(b.key)}" aria-selected="${b.key === state.active}">${esc(
          b.label
        )}<span class="n">${b.n}</span></button>`
    )
    .join("");

  el.querySelectorAll(".filter").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.active = btn.dataset.key;
      el.querySelectorAll(".filter").forEach((b) =>
        b.setAttribute("aria-selected", String(b.dataset.key === state.active))
      );
      renderGrid();
    });
  });
}

function renderCategoryTags() {
  const el = document.getElementById("category-tags");
  if (!el) return;
  const found = new Set();
  for (const r of state.repos) for (const c of r.categories || []) found.add(c);
  const tags = CATEGORY_ORDER.filter((c) => found.has(c));
  el.innerHTML = tags.length
    ? tags.map((t) => `<span class="tag">${esc(t)}</span>`).join("")
    : `<span class="tag">準備中</span>`;
}

/* ---------- load ---------- */
async function load() {
  const grid = document.getElementById("grid");
  const updatedEl = document.getElementById("data-updated");
  const statCount = document.getElementById("stat-count");
  const statUpdated = document.getElementById("stat-updated");

  try {
    const res = await fetch(`${DATA_FILE}?v=${Date.now()}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    state.repos = data.repositories || [];
    const updatedAt = data.updated_at || null;

    if (statCount) statCount.textContent = state.repos.length;
    if (statUpdated && updatedAt) statUpdated.textContent = formatDate(updatedAt);
    if (updatedEl)
      updatedEl.textContent = updatedAt
        ? `更新 ${formatRelative(updatedAt)}`
        : `${state.repos.length} plugins`;

    renderFilters();
    renderCategoryTags();
    renderGrid();
  } catch {
    grid.innerHTML = `
      <div class="state">
        プラグインデータを読み込めませんでした。<br>
        <a href="https://github.com/${GITHUB_USER}" target="_blank" rel="noopener">GitHub で見る →</a>
      </div>`;
    if (updatedEl) updatedEl.textContent = "読み込みエラー";
  }
}

document.addEventListener("DOMContentLoaded", load);
