const viewEl = document.getElementById("view");
const statusEl = document.getElementById("status");
const tabs = [...document.querySelectorAll(".tab")];

const state = {
  log: [],
  posts: [],
  projects: [],
  links: []
};

function setStatus(msg){ statusEl.textContent = `status: ${msg}`; }

async function loadJSON(path){
  const res = await fetch(path, { cache: "no-store" });
  if(!res.ok) throw new Error(`${path} ${res.status}`);
  return res.json();
}

function escapeHTML(s=""){
  return s.replace(/[&<>"']/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;" }[c]));
}

function card({meta, title, body, href}){
  return `
    <div class="card">
      <div class="row">
        <div class="meta">${escapeHTML(meta || "")}</div>
        ${href ? `<a class="smallbtn" href="${href}" target="_blank" rel="noopener">OPEN</a>` : ``}
      </div>
      ${title ? `<div class="title">${escapeHTML(title)}</div>` : ``}
      ${body ? `<div class="body">${escapeHTML(body)}</div>` : ``}
    </div>
  `;
}

function renderHome(){
  const latestLog = state.log.slice(0, 5);
  const latestPosts = state.posts.slice(0, 3);

  viewEl.innerHTML = `
    <div class="section">
      <div class="h1">HOME</div>
      <div class="p">Your test site: micro log + posts + projects + links.</div>
    </div>

    <div class="section">
      <div class="h1">LATEST LOG</div>
      ${latestLog.map(e => card({
        meta: `${e.when} • ${e.tags?.join(", ") || "no-tags"}`,
        body: e.text
      })).join("") || `<div class="p">No log entries yet.</div>`}
    </div>

    <div class="section">
      <div class="h1">LATEST POSTS</div>
      ${latestPosts.map(p => card({
        meta: p.when,
        title: p.title,
        body: p.excerpt || ""
      })).join("") || `<div class="p">No posts yet.</div>`}
    </div>
  `;
  setStatus("home");
}

function renderLog(){
  viewEl.innerHTML = `
    <div class="section">
      <div class="h1">LOG</div>
      <div class="p">Short entries. Timestamped. Fast.</div>
      ${state.log.map(e => card({
        meta: `${e.when} • #${e.id}`,
        body: e.text
      })).join("") || `<div class="p">No log entries yet.</div>`}
    </div>
  `;
  setStatus("log");
}

function renderPosts(){
  viewEl.innerHTML = `
    <div class="section">
      <div class="h1">POSTS</div>
      <div class="p">Long form. Add YouTube links, images, writeups.</div>
      ${state.posts.map(p => card({
        meta: `${p.when} • ${p.slug}`,
        title: p.title,
        body: p.body,
        href: p.youtube || ""
      })).join("") || `<div class="p">No posts yet.</div>`}
    </div>
  `;
  setStatus("posts");
}

function renderProjects(){
  viewEl.innerHTML = `
    <div class="section">
      <div class="h1">PROJECTS</div>
      <div class="p">Links to your webapps, experiments, and builds.</div>
      ${state.projects.map(pr => card({
        meta: `${pr.status || "active"} • ${pr.kind || "project"}`,
        title: pr.name,
        body: pr.desc,
        href: pr.url
      })).join("") || `<div class="p">No projects yet.</div>`}
    </div>
  `;
  setStatus("projects");
}

function renderLinks(){
  viewEl.innerHTML = `
    <div class="section">
      <div class="h1">LINKS</div>
      <div class="p">Your hub: socials, channels, tools.</div>
      ${state.links.map(l => card({
        meta: l.label,
        title: l.handle || "",
        body: l.url,
        href: l.url
      })).join("") || `<div class="p">No links yet.</div>`}
    </div>
  `;
  setStatus("links");
}

function setActive(view){
  tabs.forEach(t => t.classList.toggle("is-active", t.dataset.view === view));
  const map = { home: renderHome, log: renderLog, posts: renderPosts, projects: renderProjects, links: renderLinks };
  (map[view] || renderHome)();
  history.replaceState(null, "", `#${view}`);
}

tabs.forEach(t => t.addEventListener("click", () => setActive(t.dataset.view)));

async function boot(){
  try{
    setStatus("loading content");
    state.log = await loadJSON("./content/log.json");
    state.posts = await loadJSON("./content/posts.json");
    state.projects = await loadJSON("./content/projects.json");
    state.links = await loadJSON("./content/links.json");

    // newest first
    state.log.sort((a,b) => (b.id||0)-(a.id||0));
    state.posts.sort((a,b) => (b.when||"").localeCompare(a.when||""));

    const hash = (location.hash || "#home").replace("#","");
    setActive(hash);
    setStatus("ready");
  }catch(err){
    viewEl.innerHTML = `<div class="section"><div class="h1">ERROR</div><div class="p">${escapeHTML(err.message)}</div></div>`;
    setStatus("error");
  }
}

boot();
