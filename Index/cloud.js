<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>☁️ Cloud Chat</title>

  <!-- Styles -->
  <link rel="stylesheet" href="cloud.css" />

  <!-- Netlify Identity widget -->
  <script src="https://identity.netlify.com/v1/netlify-identity-widget.js"></script>
  <!-- Firebase SDKs -->
  <script src="https://www.gstatic.com/firebasejs/10.11.0/firebase-app-compat.js"></script>
  <script src="https://www.gstatic.com/firebasejs/10.11.0/firebase-database-compat.js"></script>

  <!-- Guard: redirect before anything renders -->
  <script>
    netlifyIdentity.init();
    netlifyIdentity.on('init', user => {
      if (!user) {
        // Not logged in → bounce immediately
        location.replace('main.html');
      } else {
        // Logged in → show chat UI
        document.getElementById('chat-app').classList.remove('hidden');
      }
    });
  </script>
</head>
<body>
  <div id="chat-app" class="hidden">
    <header>
      <h1>☁️ Cloud Chat</h1>
      <div id="online-list">Online: <span id="online-count">0</span></div>
      <button id="logout-btn">Log out</button>
    </header>
    <div id="messages"></div>
    <form id="msg-form">
      <input id="msg-input" placeholder="Type your message…" autocomplete="off" />
      <button type="submit">Send</button>
    </form>
  </div>

  <!-- Your chat logic -->
  <script src="cloud.js"></script>
</body>
</html>
