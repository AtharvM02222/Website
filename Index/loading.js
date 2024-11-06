// script.js
document.addEventListener("DOMContentLoaded", function () {
    const text = "Initializing...";
    const typewriterTextElement = document.getElementById("typewriter-text");
    const mainPageURL = "https://atharvmandlavdiya.netlify.app/main.html";  // Main page URL
    
    let i = 0; // for typing the text
    let deleteIndex = text.length; // for deleting the text
    let isDeleting = false;
    
    function typeWriter() {
        if (isDeleting) {
            // Remove one character at a time
            typewriterTextElement.textContent = text.substring(0, deleteIndex);
            deleteIndex--;
        } else {
            // Add one character at a time
            typewriterTextElement.textContent = text.substring(0, i);
            i++;
        }
        
        // Continue typing or deleting with a delay
        let speed = isDeleting ? 50 : 150;
        
        if (!isDeleting && i === text.length) {
            // When typing is complete, wait 500ms, then start deleting
            setTimeout(function () {
                isDeleting = true;
                typeWriter();
            }, 500);  // 500ms delay before starting to delete
        } else if (isDeleting && deleteIndex === 0) {
            // When deletion is complete, redirect to main page
            setTimeout(function () {
                window.location.href = mainPageURL;
            }, 500); // Optional delay before redirecting
        } else {
            setTimeout(typeWriter, speed);
        }
    }
    
    // Start typing when the page loads
    typeWriter();
});
