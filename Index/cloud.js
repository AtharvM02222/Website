// cloud.js

window.addEventListener("load", () => {
  if (!netlifyIdentity) {
    alert("Netlify Identity not loaded");
    return;
  }
  netlifyIdentity.init();

  netlifyIdentity.on("init", user => {
    if (!user) return window.location.replace("main.html");
    startChat(user);
  });

  netlifyIdentity.on("logout", () => {
    window.location.replace("main.html");
  });
});

function startChat(user) {
  // Show UI
  document.getElementById("chat-app").classList.remove("hidden");

  // UI elems
  const msgsEl   = document.getElementById("messages");
  const input    = document.getElementById("msg-input");
  const sendBtn  = document.getElementById("send-btn");
  const logout   = document.getElementById("logout-btn");
  const onlineCt = document.getElementById("online-count");

  // Logout
  logout.addEventListener("click", () => netlifyIdentity.logout());

  // Firebase setup
  const cfg = {
    apiKey: "AIzaSyAUPxEQKMB_b-rR4fUS21UZ2GDZBsl_fbA",
    authDomain: "cloud02222.firebaseapp.com",
    databaseURL: "https://cloud02222-default-rtdb.firebaseio.com",
    projectId: "cloud02222",
    storageBucket: "cloud02222.appspot.com",
    messagingSenderId: "866391641580",
    appId: "1:866391641580:web:069aa89ef69e77c3dd84c9"
  };
  if (!firebase.apps.length) firebase.initializeApp(cfg);
  const db      = firebase.database();
  const msgsRef = db.ref("cloud_messages");
  const presRef = db.ref("presence");
  const connRef = db.ref(".info/connected");

  // Presence
  const me = presRef.child(user.id);
  connRef.on("value", s => {
    if (s.val()) {
      me.set({ name: user.user_metadata.full_name || user.email });
      me.onDisconnect().remove();
    }
  });
  presRef.on("value", s => {
    onlineCt.textContent = Object.keys(s.val()||{}).length;
  });

  // Load messages
  msgsRef.on("child_added",    snap => renderMsg(snap.key,   snap.val(),   user.id));
  msgsRef.on("child_changed",  snap => updateMsg(snap.key,   snap.val()));
  msgsRef.on("child_removed",  snap => {
    const el = document.getElementById(snap.key);
    if (el) el.remove();
  });

  // Send button
  sendBtn.addEventListener("click", () => {
    const text = input.value.trim();
    if (!text) return;
    msgsRef.push({
      uid:  user.id,
      name: user.user_metadata.full_name || user.email,
      text,
      ts:   Date.now(),
      edited: false
    });
    input.value = "";
  });

  // Render helpers
  function renderMsg(id, msg, currentUid) {
    const d = document.createElement("div");
    d.id = id;
    d.className = "message" + (msg.uid===currentUid?" own":"");
    const t = new Date(msg.ts).toLocaleTimeString();
    d.innerHTML = `
      <div class="meta">
        ${msg.name} · <small>${t}</small>
        ${msg.edited?'<span class="edited">(edited)</span>':''}
      </div>
      <div class="text">${escape(msg.text)}</div>
    `;
    if (msg.uid===currentUid) {
      const act = document.createElement("div");
      act.className = "actions";
      act.innerHTML = `
        <button data-action="edit" data-id="${id}">✏️</button>
        <button data-action="delete" data-id="${id}">🗑️</button>
      `;
      act.addEventListener("click", e => {
        const a = e.target.dataset.action, mid = e.target.dataset.id;
        if (a==="edit") editMsg(mid, msg.text);
        if (a==="delete") delMsg(mid);
      });
      d.appendChild(act);
    }
    msgsEl.appendChild(d);
    msgsEl.scrollTop = msgsEl.scrollHeight;
  }

  function updateMsg(id, msg) {
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
    if (n && n!==oldText) msgsRef.child(id).update({ text: n, edited: true });
  }

  function delMsg(id) {
    if (confirm("Delete this message?")) msgsRef.child(id).remove();
  }

  function escape(s) {
    return s.replace(/[&<>"']/g, c=>({
      '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
    }[c]));
  }
}
