// cloud.js

// Wait for the HTML to fully load
document.addEventListener("DOMContentLoaded", () => {
  // 1) Ensure Netlify Identity widget is present
  if (!window.netlifyIdentity) {
    alert("Error: Netlify Identity not loaded.");
    return;
  }
  netlifyIdentity.init();

  // 2) When Identity initializes: redirect or start chat
  netlifyIdentity.on("init", user => {
    if (!user) {
      // Not logged in → go back to main.html
      window.location.replace("main.html");
    } else {
      // Logged in → kick off chat
      startChat(user);
    }
  });

  // 3) On explicit logout from Identity
  netlifyIdentity.on("logout", () => {
    window.location.replace("main.html");
  });

  // 4) Main chat setup
  function startChat(user) {
    // Reveal the chat UI
    const app = document.getElementById("chat-app");
    app.classList.remove("hidden");

    // UI elements
    const messagesEl = document.getElementById("messages");
    const form       = document.getElementById("msg-form");
    const input      = document.getElementById("msg-input");
    const logoutBtn  = document.getElementById("logout-btn");
    const onlineCnt  = document.getElementById("online-count");

    // Wire up logout button
    logoutBtn.addEventListener("click", () => {
      netlifyIdentity.logout();
    });

    // 5) Initialize Firebase
    const firebaseConfig = {
      apiKey: "AIzaSyAUPxEQKMB_b-rR4fUS21UZ2GDZBsl_fbA",
      authDomain: "cloud02222.firebaseapp.com",
      databaseURL: "https://cloud02222-default-rtdb.firebaseio.com",
      projectId: "cloud02222",
      storageBucket: "cloud02222.firebasestorage.app",
      messagingSenderId: "866391641580",
      appId: "1:866391641580:web:069aa89ef69e77c3dd84c9"
    };
    if (!firebase.apps.length) {
      firebase.initializeApp(firebaseConfig);
    }
    const db        = firebase.database();
    const msgsRef   = db.ref("cloud_messages");
    const presRef   = db.ref("presence");
    const connRef   = db.ref(".info/connected");

    // 6) Presence tracking
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

    // 7) Listen for message events
    msgsRef.on("child_added",   s => renderMessage(s.key,   s.val(),   user.id));
    msgsRef.on("child_changed", s => updateMessage(s.key,   s.val()));
    msgsRef.on("child_removed", s => removeMessage(s.key));

    // 8) Sending new messages
    form.addEventListener("submit", e => {
      e.preventDefault();
      const text = input.value.trim();
      if (!text) return;
      msgsRef.push({
        uid:    user.id,
        name:   user.user_metadata.full_name || user.email,
        text:   text,
        ts:     Date.now(),
        edited: false
      });
      input.value = "";
    });

    // 9) Render helpers

    function renderMessage(id, msg, currentUid) {
      const div = document.createElement("div");
      div.id = id;
      div.className = "message" + (msg.uid === currentUid ? " own" : "");
      const time = new Date(msg.ts).toLocaleTimeString();
      div.innerHTML = `
        <div class="meta">
          ${msg.name} · <small>${time}</small>
          ${msg.edited ? '<span class="edited">(edited)</span>' : ''}
        </div>
        <div class="text">${escapeHTML(msg.text)}</div>
      `;
      if (msg.uid === currentUid) {
        const actions = document.createElement("div");
        actions.className = "actions";
        actions.innerHTML = `
          <button data-id="${id}" data-action="edit">✏️</button>
          <button data-id="${id}" data-action="delete">🗑️</button>
        `;
        // action handlers
        actions.querySelectorAll("button").forEach(btn => {
          btn.addEventListener("click", () => {
            const action = btn.getAttribute("data-action");
            const mid    = btn.getAttribute("data-id");
            if (action === "edit")  editMessage(mid, msg.text);
            if (action === "delete") deleteMessage(mid);
          });
        });
        div.appendChild(actions);
      }
      messagesEl.appendChild(div);
      messagesEl.scrollTop = messagesEl.scrollHeight;
    }

    function updateMessage(id, msg) {
      const div = document.getElementById(id);
      if (!div) return renderMessage(id, msg, user.id);
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

    // XSS-safe escape
    function escapeHTML(str) {
      return str.replace(/[&<>"']/g, c =>
        ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c])
      );
    }
  }
});
