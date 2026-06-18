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

function formatDate(iso) {
  const d = new Date(iso);
  const now = new Date();
  const diff = Math.floor((now - d) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 86400 * 30) return `${Math.floor(diff / 86400)}d ago`;
  return d.toLocaleDateString("ja-JP", { year: "numeric", month: "short" });
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

function renderPluginCard(repo) {
  const name = repo.name.replace("YMM4-", "");
  const desc = repo.description || "No description";
  const lang = repo.language || "—";
  const stars = repo.stargazers_count ?? 0;
  const updated = repo.pushed_at || repo.updated_at;
  const categories = repo.categories || [];

  const categoryHtml = categories.length > 0
    ? categories.map(c => `<span class="plugin-category">${escapeHtml(c)}</span>`).join("")
    : "";

  return `
    <article class="plugin-card">
      <div class="plugin-card-header">
        <span class="plugin-name">${escapeHtml(name)}</span>
        <span class="plugin-lang">${escapeHtml(lang)}</span>
      </div>
      <p class="plugin-desc">${escapeHtml(desc)}</p>
      ${categoryHtml ? `<div class="plugin-categories">${categoryHtml}</div>` : ""}
      <div class="plugin-footer">
        <span class="plugin-stars">
          <svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
            <path d="M8 .25a.75.75 0 0 1 .673.418l1.882 3.815 4.21.612a.75.75 0 0 1 .416 1.279l-3.046 2.97.719 4.192a.751.751 0 0 1-1.088.791L8 12.347l-3.766 1.98a.75.75 0 0 1-1.088-.79l.72-4.194L.818 6.374a.75.75 0 0 1 .416-1.28l4.21-.611L7.327.668A.75.75 0 0 1 8 .25Z"/>
          </svg>
          ${stars}
        </span>
        <span class="plugin-updated">${formatDate(updated)}</span>
        <a class="plugin-link" href="https://github.com/${GITHUB_USER}/${escapeHtml(repo.name)}" target="_blank" rel="noopener">
          GitHub →
        </a>
      </div>
    </article>
  `;
}

function renderCategoryTags(repos) {
  const found = new Set();
  for (const repo of repos) {
    for (const cat of (repo.categories || [])) {
      found.add(cat);
    }
  }

  const tags = CATEGORY_ORDER.filter(c => found.has(c));

  const el = document.getElementById("category-tags");
  if (!el) return;

  if (tags.length === 0) {
    el.innerHTML = "";
    return;
  }

  el.innerHTML = tags.map(t => `<span class="tag">${escapeHtml(t)}</span>`).join("");
}

async function loadPlugins() {
  const grid = document.getElementById("plugins-grid");
  const countEl = document.getElementById("plugin-count");
  const statCountEl = document.getElementById("stat-count");
  const updatedEl = document.getElementById("data-updated");

  try {
    const res = await fetch(`${DATA_FILE}?v=${Date.now()}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    const repos = data.repositories || [];
    const updatedAt = data.updated_at || null;

    countEl.textContent = `${repos.length} plugins`;
    if (statCountEl) statCountEl.textContent = repos.length;

    if (updatedAt) {
      updatedEl.textContent = `Updated ${formatDate(updatedAt)}`;
    }

    renderCategoryTags(repos);

    if (repos.length === 0) {
      grid.innerHTML = `<div class="error-state">No plugins found.</div>`;
      return;
    }

    grid.innerHTML = repos.map(renderPluginCard).join("");
  } catch {
    grid.innerHTML = `
      <div class="error-state">
        Failed to load plugin data.<br>
        <a href="https://github.com/${GITHUB_USER}" target="_blank" rel="noopener" style="color:var(--accent)">View on GitHub →</a>
      </div>
    `;
  }
}

document.addEventListener("DOMContentLoaded", loadPlugins);
