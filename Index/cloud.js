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

// Firebase refs
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

// ——— AUTH & PRESENCE ———
netlifyIdentity.init();

// Only start once identity is fully loaded
netlifyIdentity.on("init", user => {
  if (!user) return;              // fallback already handled by quick redirect
  startApp(user);
});

netlifyIdentity.on("logout", () => {
  // Immediately send them back and hide UI
  app.classList.add("hidden");
  window.location.replace("main.html");
});

function startApp(user) {
  // Show the chat UI
  app.classList.remove("hidden");

  // Logout button
  logoutBtn.onclick = () => netlifyIdentity.logout();

  // Presence: mark online, clean up on disconnect
  const myPres = presRef.child(user.id);
  amOnlineRef.on("value", snap => {
    if (snap.val()) {
      myPres.set({ name: user.user_metadata.full_name || user.email });
      myPres.onDisconnect().remove();
    }
  });

  // Update online user count
  presRef.on("value", snap => {
    onlineCnt.textContent = Object.keys(snap.val()||{}).length;
  });

  // Message listeners
  msgsRef.on("child_added",   s => renderMessage(s.key, s.val(), user.id));
  msgsRef.on("child_changed", s => updateMessage(s.key, s.val(), user.id));
  msgsRef.on("child_removed", s => removeMessage(s.key));

  // Send new message
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

// ——— RENDER HELPERS ———
function renderMessage(id, msg, currentUid) {
  const div = document.createElement("div");
  div.id = id;
  div.className = "message" + (msg.uid === currentUid ? " own" : "");
  const time = new Date(msg.ts).toLocaleTimeString();
  div.innerHTML = `
    <div class="meta">
      ${msg.name} · <small>${time}</small>
      ${msg.edited?'<span class="edited">(edited)</span>':''}
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
    actions.onclick = e => {
      const a = e.target.dataset.action;
      if (a==="edit") editMessage(id, msg.text);
      if (a==="delete") deleteMessage(id);
    };
    div.appendChild(actions);
  }
  msgsEl.appendChild(div);
  msgsEl.scrollTop = msgsEl.scrollHeight;
}

function updateMessage(id, msg, currentUid) {
  const div = document.getElementById(id);
  if (!div) return renderMessage(id, msg, currentUid);
  div.querySelector(".text").textContent = msg.text;
  if (msg.edited && !div.querySelector(".edited")) {
    div.querySelector(".meta")
       .insertAdjacentHTML("beforeend", '<span class="edited">(edited)</span>');
  }
}

function removeMessage(id) {
  const div = document.getElementById(id);
  if (div) div.remove();
}

function editMessage(id, oldText) {
  const t = prompt("Edit your message:", oldText);
  if (!t || t === oldText) return;
  msgsRef.child(id).update({ text: t, edited: true });
}

function deleteMessage(id) {
  if (!confirm("Delete this message?")) return;
  msgsRef.child(id).remove();
}

// XSS escape
function escape(s) {
  return s.replace(/[&<>"']/g, c =>
    ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c])
  );
}
