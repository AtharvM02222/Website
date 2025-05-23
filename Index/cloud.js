;(function(){
  // Only run on Cloud page
  const p = window.location.pathname;
  if (!p.endsWith('cloud.html') && p !== '/cloud') return;

  // — FIREBASE CONFIG —
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

  const msgsRef     = db.ref("cloud_messages");
  const presRef     = db.ref("presence");
  const amOnlineRef = db.ref(".info/connected");

  const app        = document.getElementById("chat-app");
  const msgsEl     = document.getElementById("messages");
  const form       = document.getElementById("msg-form");
  const input      = document.getElementById("msg-input");
  const logoutBtn  = document.getElementById("logout-btn");
  const onlineCnt  = document.getElementById("online-count");

  netlifyIdentity.init();

  netlifyIdentity.on("init", user => {
    if (!user) return;             // redirect already handled in cloud.html
    startChat(user);
  });

  netlifyIdentity.on("logout", () => {
    app.classList.add("hidden");
    window.location.replace("main.html");
  });

  function startChat(user) {
    app.classList.remove("hidden");
    logoutBtn.onclick = () => netlifyIdentity.logout();

    // presence
    const me = presRef.child(user.id);
    amOnlineRef.on("value", s => {
      if (s.val()) {
        me.set({ name: user.user_metadata.full_name || user.email });
        me.onDisconnect().remove();
      }
    });
    presRef.on("value", s => {
      onlineCnt.textContent = Object.keys(s.val()||{}).length;
    });

    // messages
    msgsRef.on("child_added",   s => render(s.key, s.val(), user.id));
    msgsRef.on("child_changed", s => update(s.key, s.val(), user.id));
    msgsRef.on("child_removed", s => remove(s.key));

    form.onsubmit = e => {
      e.preventDefault();
      const t = input.value.trim();
      if (!t) return;
      msgsRef.push({
        uid:    user.id,
        name:   user.user_metadata.full_name || user.email,
        text:   t,
        ts:     Date.now(),
        edited: false
      });
      input.value = "";
    };
  }

  // render helpers
  function render(id, msg, uid) {
    const d = document.createElement("div");
    d.id = id;
    d.className = "message" + (msg.uid===uid?" own":"");
    const time = new Date(msg.ts).toLocaleTimeString();
    d.innerHTML = `
      <div class="meta">
        ${msg.name} · <small>${time}</small>
        ${msg.edited?'<span class="edited">(edited)</span>':''}
      </div>
      <div class="text">${escape(msg.text)}</div>
    `;
    if (msg.uid===uid) {
      const act = document.createElement("div");
      act.className = "actions";
      act.innerHTML = `
        <button data-action="edit">✏️</button>
        <button data-action="delete">🗑️</button>
      `;
      act.onclick = ev => {
        const a = ev.target.dataset.action;
        if (a==="edit") edit(id, msg.text);
        if (a==="delete") del(id);
      };
      d.appendChild(act);
    }
    msgsEl.appendChild(d);
    msgsEl.scrollTop = msgsEl.scrollHeight;
  }

  function update(id, msg, uid) {
    const d = document.getElementById(id);
    if (!d) return render(id, msg, uid);
    d.querySelector(".text").textContent = msg.text;
    if (msg.edited && !d.querySelector(".edited")) {
      d.querySelector(".meta")
       .insertAdjacentHTML("beforeend", '<span class="edited">(edited)</span>');
    }
  }

  function remove(id) {
    const d = document.getElementById(id);
    if (d) d.remove();
  }

  function edit(id, oldText) {
    const n = prompt("Edit message:", oldText);
    if (!n||n===oldText) return;
    msgsRef.child(id).update({ text: n, edited: true });
  }

  function del(id) {
    if (!confirm("Delete?")) return;
    msgsRef.child(id).remove();
  }

  function escape(s) {
    return s.replace(/[&<>"']/g, c=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }
})();
