// ——— FIREBASE CONFIG ———
const firebaseConfig = {
  apiKey: "AIzaSyAUPxEQKMB_b-rR4fUS21UZ2GDZBsl_fbA",
  authDomain: "cloud02222.firebaseapp.com",
  databaseURL: "https://cloud02222-default-rtdb.firebaseio.com",
  projectId: "cloud02222",
  storageBucket: "cloud02222.appspot.com",
  messagingSenderId: "866391641580",
  appId: "1:866391641580:web:069aa89ef69e77c3dd84c9"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

const app = document.getElementById("chat-app");
const msgsRef = db.ref("cloud_messages");
const presRef = db.ref("presence");
const amOnlineRef = db.ref(".info/connected");

// DOM Elements
const msgsEl = document.getElementById("messages");
const form = document.getElementById("msg-form");
const input = document.getElementById("msg-input");
const logoutBtn = document.getElementById("logout-btn");
const onlineCnt = document.getElementById("online-count");

netlifyIdentity.init();

// On Identity ready
netlifyIdentity.on("init", user => {
  if (!user) return window.location.replace("main.html");
  startChat(user);
});

// Logout
logoutBtn?.addEventListener("click", () => {
  netlifyIdentity.logout();
});

// Netlify logout redirect
netlifyIdentity.on("logout", () => {
  window.location.replace("main.html");
});

function startChat(user) {
  app.classList.remove("hidden");

  // Presence
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

  // Load and listen for messages
  msgsRef.on("child_added", s => renderMessage(s.key, s.val(), user.id));
  msgsRef.on("child_changed", s => updateMessage(s.key, s.val()));
  msgsRef.on("child_removed", s => removeMessage(s.key));

  // Form submit
  form.addEventListener("submit", e => {
    e.preventDefault();
    const text = input.value.trim();
    if (!text) return;
    msgsRef.push({
      uid: user.id,
      name: user.user_metadata.full_name || user.email,
      text,
      ts: Date.now(),
      edited: false
    });
    input.value = "";
  });
}

// Render functions
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

function updateMessage(id, msg) {
  const d = document.getElementById(id);
  if (!d) return;
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

// XSS protect
function escape(s) {
  return s.replace(/[&<>"']/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])
  );
}
