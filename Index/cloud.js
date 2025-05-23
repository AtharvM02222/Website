document.addEventListener("DOMContentLoaded", () => {
  // 1) Init Netlify Identity
  if (!window.netlifyIdentity) {
    console.error("Netlify Identity not found");
    return;
  }
  netlifyIdentity.init();

  // 2) On init: redirect or show
  netlifyIdentity.on("init", user => {
    if (!user) {
      // not logged in → redirect
      window.location.replace("main.html");
    } else {
      // logged in → start chat
      startChat(user);
    }
  });

  // 3) On logout: hide + redirect
  netlifyIdentity.on("logout", () => {
    document.getElementById("chat-app").classList.add("hidden");
    window.location.replace("main.html");
  });

  function startChat(user) {
    const app       = document.getElementById("chat-app");
    const msgsEl    = document.getElementById("messages");
    const form      = document.getElementById("msg-form");
    const input     = document.getElementById("msg-input");
    const logoutBtn = document.getElementById("logout-btn");
    const onlineCnt = document.getElementById("online-count");

    // show UI
    app.classList.remove("hidden");
    logoutBtn.onclick = () => netlifyIdentity.logout();

    // init Firebase
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
    const db = firebase.database();

    // refs
    const msgsRef     = db.ref("cloud_messages");
    const presRef     = db.ref("presence");
    const amOnlineRef = db.ref(".info/connected");

    // presence
    const me = presRef.child(user.id);
    amOnlineRef.on("value", snap => {
      if (snap.val()) {
        me.set({ name: user.user_metadata.full_name || user.email });
        me.onDisconnect().remove();
      }
    });
    presRef.on("value", snap => {
      onlineCnt.textContent = Object.keys(snap.val()||{}).length;
    });

    // message listeners
    msgsRef.on("child_added",   s => renderMsg(s.key, s.val(), user.id));
    msgsRef.on("child_changed", s => updateMsg(s.key, s.val(), user.id));
    msgsRef.on("child_removed", s => removeMsg(s.key));

    // send
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

    // helpers
    function renderMsg(id, msg, uid) {
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
          if (a==="edit") editMsg(id, msg.text);
          if (a==="delete") delMsg(id);
        };
        d.appendChild(act);
      }
      msgsEl.appendChild(d);
      msgsEl.scrollTop = msgsEl.scrollHeight;
    }
    function updateMsg(id, msg, uid) {
      const d = document.getElementById(id);
      if (!d) return renderMsg(id, msg, uid);
      d.querySelector(".text").textContent = msg.text;
      if (msg.edited && !d.querySelector(".edited")) {
        d.querySelector(".meta")
         .insertAdjacentHTML("beforeend", '<span class="edited">(edited)</span>');
      }
    }
    function removeMsg(id) {
      const d = document.getElementById(id);
      if (d) d.remove();
    }
    function editMsg(id, oldText) {
      const n = prompt("Edit message:", oldText);
      if (!n||n===oldText) return;
      msgsRef.child(id).update({ text: n, edited: true });
    }
    function delMsg(id) {
      if (!confirm("Delete?")) return;
      msgsRef.child(id).remove();
    }
    function escape(s) {
      return s.replace(/[&<>"']/g, c=>
        ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])
      );
    }
  }
});
