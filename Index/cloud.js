// cloud.js

// 1) Log that we’ve loaded the file
console.log("🚀 cloud.js loaded");

// 2) Ensure Netlify Identity is available
if (!window.netlifyIdentity) {
  console.error("❌ Netlify Identity widget not found");
} else {
  console.log("✅ Netlify Identity found");
}

// 3) Initialize Netlify Identity
netlifyIdentity.init();

// 4) Handle auth state
netlifyIdentity.on("init", user => {
  console.log("⚡ netlifyIdentity.init:", user);
  if (!user) {
    console.log("↩️ Not logged in → redirect to main.html");
    window.location.replace("main.html");
  } else {
    startChat(user);
  }
});

netlifyIdentity.on("logout", () => {
  console.log("🔒 Logged out → redirect to main.html");
  window.location.replace("main.html");
});

// 5) Main chat setup
function startChat(user) {
  console.log("🎉 startChat for", user);

  // Show UI
  const app = document.getElementById("chat-app");
  app.classList.remove("hidden");

  // Grab elements
  const messagesEl = document.getElementById("messages");
  const form       = document.getElementById("msg-form");
  const input      = document.getElementById("msg-input");
  const logoutBtn  = document.getElementById("logout-btn");
  const onlineCnt  = document.getElementById("online-count");

  // Wire up logout
  logoutBtn.addEventListener("click", () => {
    console.log("📤 Logout button clicked");
    netlifyIdentity.logout();
  });

  // Firebase init
  const cfg = {
    apiKey: "AIzaSyAUPxEQKMB_b-rR4fUS21UZ2GDZBsl_fbA",
    authDomain: "cloud02222.firebaseapp.com",
    databaseURL: "https://cloud02222-default-rtdb.firebaseio.com",
    projectId: "cloud02222",
    storageBucket: "cloud02222.firebasestorage.app",
    messagingSenderId: "866391641580",
    appId: "1:866391641580:web:069aa89ef69e77c3dd84c9"
  };
  if (!firebase.apps.length) firebase.initializeApp(cfg);
  const db         = firebase.database();
  const msgsRef    = db.ref("cloud_messages");
  const presence   = db.ref("presence");
  const connected  = db.ref(".info/connected");

  // Presence
  const me = presence.child(user.id);
  connected.on("value", snap => {
    if (snap.val()) {
      me.set({ name: user.user_metadata.full_name || user.email });
      me.onDisconnect().remove();
    }
  });
  presence.on("value", snap => {
    const count = snap.val() ? Object.keys(snap.val()).length : 0;
    onlineCnt.textContent = count;
  });

  // Load messages
  msgsRef.on("child_added",    s => renderMsg(s.key, s.val(), user.id));
  msgsRef.on("child_changed",  s => updateMsg(s.key, s.val()));
  msgsRef.on("child_removed",  s => {
    const el = document.getElementById(s.key);
    if (el) el.remove();
  });

  // Send message
  form.addEventListener("submit", e => {
    e.preventDefault();
    console.log("📨 form submit");
    const text = input.value.trim();
    if (!text) return console.log("⚠️ empty message");
    msgsRef.push({
      uid:    user.id,
      name:   user.user_metadata.full_name || user.email,
      text,
      ts:     Date.now(),
      edited: false
    });
    input.value = "";
  });

  // Renderers
  function renderMsg(id, msg, uid) {
    console.log("➕ renderMsg", id, msg);
    const d = document.createElement("div");
    d.id = id;
    d.className = "message" + (msg.uid === uid ? " own" : "");
    const time = new Date(msg.ts).toLocaleTimeString();
    d.innerHTML = `
      <div class="meta">
        ${msg.name} · <small>${time}</small>
        ${msg.edited ? '<span class="edited">(edited)</span>' : ''}
      </div>
      <div class="text">${escapeHTML(msg.text)}</div>
    `;
    if (msg.uid === uid) {
      const actions = document.createElement("div");
      actions.className = "actions";
      actions.innerHTML = `
        <button data-action="edit" data-id="${id}">✏️</button>
        <button data-action="delete" data-id="${id}">🗑️</button>
      `;
      actions.addEventListener("click", e => {
        const act = e.target.dataset.action;
        const mid = e.target.dataset.id;
        console.log(`🔧 action ${act} on ${mid}`);
        if (act === "edit") editMsg(mid, msg.text);
        if (act === "delete") delMsg(mid);
      });
      d.appendChild(actions);
    }
    messagesEl.appendChild(d);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function updateMsg(id, msg) {
    console.log("✏️ updateMsg", id, msg);
    const d = document.getElementById(id);
    if (!d) return renderMsg(id, msg, user.id);
    d.querySelector(".text").textContent = msg.text;
    if (msg.edited && !d.querySelector(".edited")) {
      d.querySelector(".meta")
       .insertAdjacentHTML("beforeend", '<span class="edited">(edited)</span>');
    }
  }

  function editMsg(id, oldText) {
    const n = prompt("Edit your message:", oldText);
    if (!n || n === oldText) return;
    console.log("✏️ saving edit", id, n);
    msgsRef.child(id).update({ text: n, edited: true });
  }

  function delMsg(id) {
    if (!confirm("Delete this message?")) return;
    console.log("🗑️ deleting", id);
    msgsRef.child(id).remove();
  }

  function escapeHTML(s) {
    return s.replace(/[&<>"']/g, c =>
      ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c])
    );
  }
}
