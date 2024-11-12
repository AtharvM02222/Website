
const workBox = document.getElementById("workBox");

workBox.addEventListener("mouseenter", () => {
  workBox.style.borderImage = "linear-gradient(45deg, red, orange, yellow, green, blue, indigo, violet) 1";
});

workBox.addEventListener("mouseleave", () => {
  workBox.style.borderImage = "none";
});
