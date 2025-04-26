
// ─────────────── Time-alive counter ───────────────
const birthDate = new Date(2011, 5, 8, 21, 8, 0); // June is month 5

function updateLifeCounter() {
  const now  = new Date();
  const diff = now - birthDate;           // milliseconds elapsed

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours   = Math.floor(seconds / 3600);
  const days    = Math.floor(seconds / 86400);
  const years   = Math.floor(days / 365.25);  // approximate

  document.getElementById('lifeYears'  ).textContent = years;
  document.getElementById('lifeDays'   ).textContent = days;
  document.getElementById('lifeHours'  ).textContent = hours;
  document.getElementById('lifeMinutes').textContent = minutes;
  document.getElementById('lifeSeconds').textContent = seconds;
}

// kick it off immediately, then every second
updateLifeCounter();
setInterval(updateLifeCounter, 1000);
// ────────────────────────────────────────────────────
