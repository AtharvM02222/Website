// ——— FIREBASE CONFIG ———
const firebaseConfig = {
  apiKey: "AIzaSyAUPxEQKMB_b-rR4fUS21UZ2GDZBsl_fbA",
  authDomain: "cloud02222.firebaseapp.com",
  databaseURL: "https://cloud02222-default-rtdb.firebaseio.com",
  projectId: "cloud02222",
  storageBucket: "cloud02222.firebasestorage.app",
  messagingSenderId: "866391641580",
  appId: "1:866391641580:web:069aa89ef69e77c3dd84c9"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// Refs
const msgsRef     = db.ref("cloud_messages");
const presRef     = db.ref("presence");
const amOnlineRef = db.ref(".info/connected");

// UI elements
const app        = document.getElementById("chat-app");
const msgsEl     = document.getElementById("messages");
const form       = document.getElementById("msg-form");
const input      = document.getElementById("msg-input");
const logoutBtn  = document.getElementById("logout-btn");
const onlineCnt  = document.getElementById("online-count");

// Init Netlify Identity
netlifyIdentity.init();

// When Identity is ready
netlifyIdentity.on("init", user => {
  if (!user) {
    // Redirect if not logged in
    return window.location.replace("main.html");
  }
  startChat(user);
});

// On explicit logout
netlifyIdentity.on("logout", () => {
  app.classList.add("hidden");
  window.location.replace("main.html");
});

function startChat(user) {
  // Show UI
  app.classList.remove("hidden");
  logoutBtn.onclick = () => netlifyIdentity.logout();

  // Presence: mark online & cleanup on disconnect
  const myPres = presRef.child(user.id);
  amOnlineRef.on("value", snap => {
    if (snap.val()) {
      myPres.set({ name: user.user_metadata.full_name || user.email });
      myPres.onDisconnect().remove();
    }
  });
  presRef.on("value", snap => {
    onlineCnt.textContent = Object.keys(snap.val() || {}).length;
  });

  // Listen for message events
  msgsRef.on("child_added",   s => renderMessage(s.key, s.val(), user.id));
  msgsRef.on("child_changed", s => updateMessage(s.key, s.val(), user.id));
  msgsRef.on("child_removed", s => removeMessage(s.key));

  // Send new messages
  form.onsubmit = e => {
    e.preventDefault();
    const text = input.value.trim();
    if (!text) return;
    msgsRef.push({
      uid:    user.id,
      name:   user.user_metadata.full_name || user.email,
      text,
      ts:     Date.now(),
      edited: false
    });
    input.value = "";
  };
}

// Render helpers
function renderMessage(id, msg, currentUid) {
  const d = document.createElement("div");
  d.id = id;
  d.className = "message" + (msg.uid === currentUid ? " own" : "");
  const time = new Date(msg.ts).toLocaleTimeString();
  d.innerHTML = `
    <div class="meta">
      ${msg.name} · <small>${time}</small>
      ${msg.edited ? '<span class="edited">(edited)</span>' : ''}
    </div>
    <div class="text">${escape(msg.text)}</div>
  `;
  if (msg.uid === currentUid) {
    const actions = document.createElement("div");
    actions.className = "actions";
    actions.innerHTML = `
      <button data-action="edit">✏️</button>
      <button data-action="delete">🗑️</button>
    `;
    actions.onclick = ev => {
      const a = ev.target.dataset.action;
      if (a === "edit") editMessage(id, msg.text);
      if (a === "delete") deleteMessage(id);
    };
    d.appendChild(actions);
  }
  msgsEl.appendChild(d);
  msgsEl.scrollTop = msgsEl.scrollHeight;
}

function updateMessage(id, msg, currentUid) {
  const d = document.getElementById(id);
  if (!d) return renderMessage(id, msg, currentUid);
  d.querySelector(".text").textContent = msg.text;
  if (msg.edited && !d.querySelector(".edited")) {
    d.querySelector(".meta")
     .insertAdjacentHTML("beforeend", '<span class="edited">(edited)</span>');
  }
}

function removeMessage(id) {
  const d = document.getElementById(id);
  if (d) d.remove();
}

function editMessage(id, oldText) {
  const n = prompt("Edit your message:", oldText);
  if (!n || n === oldText) return;
  msgsRef.child(id).update({ text: n, edited: true });
}

function deleteMessage(id) {
  if (!confirm("Delete this message?")) return;
  msgsRef.child(id).remove();
}

// XSS-escape
function escape(s) {
  return s.replace(/[&<>"']/g, c =>
    ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c])
  );
}
