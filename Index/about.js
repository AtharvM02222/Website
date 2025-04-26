
// ─────────────── Time-alive counter ───────────────
const birthDate = new Date(2011, 5, 8, 21, 8, 0); // 8 June 2011, 9:08 PM

function updateLifeCounter() {
  const now = new Date();

  let diff = now - birthDate;
  let totalSeconds = Math.floor(diff / 1000);

  const years = Math.floor(totalSeconds / (365.25 * 24 * 60 * 60));
  totalSeconds -= Math.floor(years * 365.25 * 24 * 60 * 60);

  const days = Math.floor(totalSeconds / (24 * 60 * 60));
  totalSeconds -= days * 24 * 60 * 60;

  const hours = Math.floor(totalSeconds / (60 * 60));
  totalSeconds -= hours * 60 * 60;

  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  document.getElementById('lifeYears').textContent = years.toString().padStart(2, '0');
  document.getElementById('lifeDays').textContent = days.toString().padStart(2, '0');
  document.getElementById('lifeHours').textContent = hours.toString().padStart(2, '0');
  document.getElementById('lifeMinutes').textContent = minutes.toString().padStart(2, '0');
  document.getElementById('lifeSeconds').textContent = seconds.toString().padStart(2, '0');
}

updateLifeCounter();
setInterval(updateLifeCounter, 1000);
