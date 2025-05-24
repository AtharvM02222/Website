// cloud.js

// Run after all <script defer> tags load
window.onload = function() {
  if (!window.netlifyIdentity) {
    alert("Netlify Identity widget failed to load.");
    return;
  }
  // 1) Initialize Netlify Identity
  netlifyIdentity.init();

  // 2) Wait for auth state
  netlifyIdentity.on("init", user => {
    if (!user) {
      // Not logged in → redirect
      return window.location.replace("main.html");
    }
    // Logged in → start chat
    setupChat(user);
  });

  // 3) Handle logout
  netlifyIdentity.on("logout", () => {
    window.location.replace("main.html");
  });
};

function setupChat(user) {
  // Show the chat container
  const app    = document.getElementById("chat-app");
  app.classList.remove("hidden");

  // UI elements
  const msgsEl    = document.getElementById("messages");
  const form      = document.getElementById("msg-form");
  const input     = document.getElementById("msg-input");
  const logoutBtn = document.getElementById("logout-btn");
  const onlineCnt = document.getElementById("online-count");

  // Wire up logout button
  logoutBtn.onclick = () => netlifyIdentity.logout();

  // 4) Initialize Firebase once
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
  const db       = firebase.database();
  const msgsRef  = db.ref("cloud_messages");
  const presRef  = db.ref("presence");
  const connRef  = db.ref(".info/connected");

  // 5) Presence: mark online, clean on disconnect
  const me = presRef.child(user.id);
  connRef.on("value", snap => {
    if (snap.val()) {
      me.set({ name: user.user_metadata.full_name || user.email });
      me.onDisconnect().remove();
    }
  });
  presRef.on("value", snap => {
    const count = snap.val() ? Object.keys(snap.val()).length : 0;
    onlineCnt.textContent = count;
  });

  // 6) Load & render all existing messages
  msgsRef.on("child_added",   snap => addMessage(snap.key, snap.val(), user.id));
  msgsRef.on("child_changed", snap => updateMessage(snap.key, snap.val()));
  msgsRef.on("child_removed", snap => {
    const el = document.getElementById(snap.key);
    if (el) el.remove();
  });

  // 7) Send new message without reload
  form.addEventListener("submit", e => {
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
  });

  // ——— Helpers ———

  function addMessage(id, msg, myId) {
    const d = document.createElement("div");
    d.id = id;
    d.className = "message" + (msg.uid === myId ? " own" : "");

    const time = new Date(msg.ts).toLocaleTimeString();
    d.innerHTML = `
      <div class="meta">
        ${msg.name} · <small>${time}</small>
        ${msg.edited ? '<span class="edited">(edited)</span>' : ''}
      </div>
      <div class="text">${escape(msg.text)}</div>
    `;

    if (msg.uid === myId) {
      const actions = document.createElement("div");
      actions.className = "actions";
      actions.innerHTML = `
        <button data-action="edit" data-id="${id}">✏️</button>
        <button data-action="delete" data-id="${id}">🗑️</button>
      `;
      actions.addEventListener("click", e => {
        const act = e.target.dataset.action;
        const mid = e.target.dataset.id;
        if (act === "edit")  editMessage(mid, msg.text);
        if (act === "delete") deleteMessage(mid);
      });
      d.appendChild(actions);
    }

    msgsEl.appendChild(d);
    msgsEl.scrollTop = msgsEl.scrollHeight;
  }

  function updateMessage(id, msg) {
    const d = document.getElementById(id);
    if (!d) return addMessage(id, msg, user.id);
    d.querySelector(".text").textContent = msg.text;
    if (msg.edited && !d.querySelector(".edited")) {
      d.querySelector(".meta")
       .insertAdjacentHTML("beforeend", '<span class="edited">(edited)</span>');
    }
  }

  function editMessage(id, oldText) {
    const newText = prompt("Edit your message:", oldText);
    if (newText && newText !== oldText) {
      msgsRef.child(id).update({ text: newText, edited: true });
    }
  }

  function deleteMessage(id) {
    if (confirm("Delete this message?")) {
      msgsRef.child(id).remove();
    }
  }

  function escape(s) {
    return s.replace(/[&<>"']/g, c =>
      ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c])
    );
  }
}
