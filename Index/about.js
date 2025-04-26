
// ─────────────── Time-alive counter ───────────────
const birthDate = new Date(2011, 5, 8, 21, 8, 0); // 8 June 2011, 9:08 PM

function updateLifeCounter() {
  const now = new Date();

  let diff = now - birthDate;
  let seconds = Math.floor(diff / 1000);

  const years = Math.floor(seconds / (365.25 * 24 * 3600));
  seconds -= Math.floor(years * 365.25 * 24 * 3600);

  const days = Math.floor(seconds / (24 * 3600));
  seconds -= days * 24 * 3600;

  const hours = Math.floor(seconds / 3600);
  seconds -= hours * 3600;

  const minutes = Math.floor(seconds / 60);
  seconds = seconds % 60;

  document.getElementById('lifeText').textContent =
    `${years} years, ${days} days, ${hours} hours, ${minutes} minutes, ${seconds} seconds`;
}

updateLifeCounter();
setInterval(updateLifeCounter, 1000);
