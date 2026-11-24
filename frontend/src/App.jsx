import React from "react";
import { useEffect, useMemo, useState } from "react";
const API = "http://localhost:5000/api";
const emptyForm = { title: "", description: "", visibility: "private" };

export default function App() {
  const [token, setToken] = useState(localStorage.getItem("ns_token") || "");
  const [user, setUser] = useState(JSON.parse(localStorage.getItem("ns_user") || "null"));
  const [authMode, setAuthMode] = useState("login");
  const [auth, setAuth] = useState({ name: "", email: "", password: "" });
  const [tab, setTab] = useState("all");
  const [notes, setNotes] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState("");
  const [busy, setBusy] = useState(false);

  function notify(message) {
    setToast(message);
    window.clearTimeout(window.__nsToast);
    window.__nsToast = window.setTimeout(() => setToast(""), 3000);
  }

  async function request(path, options = {}) {
    const response = await fetch(`${API}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers || {})
      }
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.message || "Something went wrong.");
    return data;
  }

  async function loadNotes(view = tab) {
    if (!token) return;
    try {
      const data = await request(`/notes?view=${view}`);
      setNotes(data);
    } catch (error) {
      notify(error.message);
      if (error.message.toLowerCase().includes("token")) logout();
    }
  }

  useEffect(() => { if (token) loadNotes(tab); }, [token, tab]);

  async function submitAuth(event) {
    event.preventDefault();
    setBusy(true);
    try {
      const data = await request(`/auth/${authMode === "login" ? "login" : "register"}`, {
        method: "POST", body: JSON.stringify(auth)
      });
      localStorage.setItem("ns_token", data.token);
      localStorage.setItem("ns_user", JSON.stringify(data.user));
      setToken(data.token);
      setUser(data.user);
      setAuth({ name: "", email: "", password: "" });
      notify(authMode === "login" ? "Welcome back!" : "Account created successfully!");
    } catch (error) { notify(error.message); }
    finally { setBusy(false); }
  }

  function logout() {
    localStorage.removeItem("ns_token");
    localStorage.removeItem("ns_user");
    setToken("");
    setUser(null);
    setNotes([]);
    setTab("all");
    notify("Logged out successfully.");
  }

  async function saveNote(event) {
    event.preventDefault();
    if (!form.title.trim() || !form.description.trim()) return notify("Please enter title and description.");
    try {
      await request(editingId ? `/notes/${editingId}` : "/notes", {
        method: editingId ? "PUT" : "POST", body: JSON.stringify(form)
      });
      setForm(emptyForm);
      setEditingId(null);
      notify(editingId ? "Note updated!" : "Note created!");
      await loadNotes(tab);
    } catch (error) { notify(error.message); }
  }

  function editNote(note) {
    setForm({ title: note.title, description: note.description, visibility: note.visibility });
    setEditingId(note._id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function noteAction(id, action) {
    try {
      if (action === "trash") await request(`/notes/${id}`, { method: "DELETE" });
      if (action === "favorite" || action === "archive") await request(`/notes/${id}/${action}`, { method: "PATCH" });
      if (action === "restore") await request(`/notes/${id}/restore`, { method: "PATCH" });
      if (action === "permanent") await request(`/notes/${id}/permanent`, { method: "DELETE" });
      notify("Done!");
      await loadNotes(tab);
    } catch (error) { notify(error.message); }
  }

  const filteredNotes = useMemo(() => notes.filter(note =>
    `${note.title} ${note.description}`.toLowerCase().includes(search.toLowerCase())
  ), [notes, search]);

  if (!token) return (
    <main className="auth-page">
      {toast && <div className="toast">{toast}</div>}
      <section className="auth-card">
        <div className="brand-mark">N</div>
        <p className="eyebrow">YOUR PERSONAL WORKSPACE</p>
        <h1>{authMode === "login" ? "Welcome to NoteSpace" : "Create your account"}</h1>
        <p className="muted">Capture ideas. Keep everything organized.</p>
        <form onSubmit={submitAuth}>
          {authMode === "register" && <label>Full name<input required value={auth.name} onChange={e => setAuth({ ...auth, name: e.target.value })} placeholder="Your name" /></label>}
          <label>Email address<input required type="email" value={auth.email} onChange={e => setAuth({ ...auth, email: e.target.value })} placeholder="you@example.com" /></label>
          <label>Password<input required minLength="6" type="password" value={auth.password} onChange={e => setAuth({ ...auth, password: e.target.value })} placeholder="At least 6 characters" /></label>
          <button className="primary full" disabled={busy}>{busy ? "Please wait..." : authMode === "login" ? "Sign in" : "Create account"}</button>
        </form>
        <p className="switch-auth">{authMode === "login" ? "New to NoteSpace?" : "Already have an account?"} <button className="text-button" onClick={() => setAuthMode(authMode === "login" ? "register" : "login")}>{authMode === "login" ? "Create account" : "Sign in"}</button></p>
      </section>
    </main>
  );

  const tabs = [
    ["all", "All Notes"], ["private", "Private Notes"], ["public", "Public Notes"],
    ["favorites", "Favorites"], ["archived", "Archived"], ["trash", "Trash"]
  ];

  return (
    <div className="app-shell">
      {toast && <div className="toast">{toast}</div>}
      <aside className="sidebar">
        <div className="brand"><span className="brand-mark small">N</span><strong>NoteSpace</strong></div>
        <p className="nav-label">WORKSPACE</p>
        {tabs.map(([key, label]) => <button key={key} className={`nav-item ${tab === key ? "active" : ""}`} onClick={() => { setTab(key); setSearch(""); }}>{label}</button>)}
        <div className="sidebar-bottom">
          <div className="avatar">{user?.name?.[0]?.toUpperCase() || "U"}</div>
          <div className="user-mini"><strong>{user?.name}</strong><span>{user?.email}</span></div>
          <button className="logout" onClick={logout} title="Log out">↗</button>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div><p className="eyebrow">YOUR PERSONAL WORKSPACE</p><h1>{tabs.find(item => item[0] === tab)?.[1] || "Dashboard"}</h1></div>
          <input className="search" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search your notes..." />
        </header>

        {tab !== "trash" && tab !== "archived" && (
          <section className="composer">
            <div className="section-heading"><div><h2>{editingId ? "Edit note" : "Create a note"}</h2><p className="muted">Save an idea before it slips away.</p></div></div>
            <form onSubmit={saveNote}>
              <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Note title" required />
              <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Write your thoughts here..." rows="3" required />
              <div className="form-actions">
                <select value={form.visibility} onChange={e => setForm({ ...form, visibility: e.target.value })}><option value="private">Private</option><option value="public">Public</option></select>
                {editingId && <button type="button" className="secondary" onClick={() => { setEditingId(null); setForm(emptyForm); }}>Cancel edit</button>}
                <button className="primary">{editingId ? "Update note" : "Save note"}</button>
              </div>
            </form>
          </section>
        )}

        <section className="notes-section">
          <div className="section-heading"><div><h2>{filteredNotes.length} {filteredNotes.length === 1 ? "note" : "notes"}</h2><p className="muted">Your ideas, all in one place.</p></div></div>
          {filteredNotes.length === 0 ? <div className="empty"><div className="empty-icon">✎</div><h3>No notes found</h3><p>Try another tab or create your first note.</p></div> :
            <div className="notes-grid">{filteredNotes.map(note => <article className="note-card" key={note._id}>
              <div className="note-meta"><span className={`visibility ${note.visibility}`}>{note.visibility}</span><span>{new Date(note.updatedAt).toLocaleDateString()}</span></div>
              <h3>{note.title}</h3><p className="note-description">{note.description}</p>
              <div className="note-footer"><span>By {note.user?.name || "You"}</span><div className="actions">
                {tab === "trash" ? <>
                  <button onClick={() => noteAction(note._id, "restore")}>Restore</button>
                  <button className="danger-text" onClick={() => { if (confirm("Permanently delete this note?")) noteAction(note._id, "permanent"); }}>Delete forever</button>
                </> : <>
                  {note.user?._id === user?._id && <button onClick={() => editNote(note)}>Edit</button>}
                  {note.user?._id === user?._id && <button onClick={() => noteAction(note._id, "favorite")}>{note.isFavorite ? "★" : "☆"}</button>}
                  {note.user?._id === user?._id && <button onClick={() => noteAction(note._id, "archive")}>{note.isArchived ? "Unarchive" : "Archive"}</button>}
                  {note.user?._id === user?._id && <button className="danger-text" onClick={() => noteAction(note._id, "trash")}>Trash</button>}
                </>}
              </div></div>
            </article>)}</div>}
        </section>
      </main>
    </div>
  );
}