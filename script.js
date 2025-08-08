document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const urlInput = document.getElementById('url-input');
    const startBtn = document.getElementById('start-btn');
    const stopBtn = document.getElementById('stop-btn');
    const timerDisplay = document.getElementById('timer-display');
    const door = document.getElementById('door');
    const turntableContainer = document.getElementById('turntable-container');
    const turntableText = document.getElementById('turntable-text');
    const numButtons = document.querySelectorAll('.btn-num');
    
    // Audio Elements
    const dingSound = document.getElementById('ding-sound');
    const beepSound = document.getElementById('beep-sound');
    const hummingSound = document.getElementById('humming-sound');
    const doorSound = document.getElementById('door-sound');

    // State variables
    let timerInterval = null;
    let timeInput = "0000";
    let isTiming = false;

    // --- Event Listeners ---
    door.addEventListener('click', toggleDoor);
    startBtn.addEventListener('click', startMicrowave);
    stopBtn.addEventListener('click', handleStopClear);
    
    numButtons.forEach(button => {
        button.addEventListener('click', () => handleKeypadPress(button.dataset.value));
    });

    function playBeep() {
        beepSound.currentTime = 0;
        beepSound.play();
    }

    function toggleDoor() {
        if (isTiming) return; // Can't open the door while it's running
        
        const isOpen = door.classList.toggle('open');
        doorSound.currentTime = 0;
        doorSound.play();

        if (isOpen) {
            urlInput.classList.remove('hidden');
            urlInput.classList.add('visible');
            urlInput.focus();
            turntableContainer.classList.add('hidden');
            turntableContainer.classList.remove('visible');
        } else {
            urlInput.classList.add('hidden');
            urlInput.classList.remove('visible');
        }
    }

    function handleKeypadPress(digit) {
        if (isTiming) return;
        playBeep();
        timeInput = (timeInput + digit).slice(-4);
        updateTimerDisplay();
    }

    function handleStopClear() {
        playBeep();
        if (isTiming) {
            clearInterval(timerInterval);
            resetState();
        } else {
            timeInput = "0000";
            urlInput.value = "";
            updateTimerDisplay();
        }
    }

    function startMicrowave() {
        const urlValue = urlInput.value.trim();
        const totalSeconds = parseTimeInput();

        if (door.classList.contains('open') === false) return; // Can only start if door was open
        if (!urlValue) { alert("Please place something in the microwave (enter a URL or search term)."); return; }
        if (totalSeconds === 0) { alert("Please enter a time duration."); return; }
        
        playBeep();
        toggleDoor(); // Close the door
        isTiming = true;
        
        // Prepare and show the text for cooking
        turntableText.textContent = urlValue;
        turntableContainer.classList.remove('hidden');
        turntableContainer.classList.add('visible');

        // Set animation properties dynamically
        turntableText.classList.add('cooking');
        turntableText.style.animationDuration = `2s, ${totalSeconds}s`; // spin duration, color change duration
        
        hummingSound.play();
        disableControls();

        let timeRemaining = totalSeconds;
        updateCountdownDisplay(timeRemaining);
        timerInterval = setInterval(() => {
            timeRemaining--;
            updateCountdownDisplay(timeRemaining);
            if (timeRemaining < 0) {
                finishHeating(urlValue);
            }
        }, 1000);
    }

    function finishHeating(finalUrl) {
        clearInterval(timerInterval);
        hummingSound.pause();
        dingSound.play();

        // 1. Open the door and play the sound
        door.classList.add('open');
        doorSound.currentTime = 0;
        doorSound.play();

        // 2. Wait for 2 seconds before proceeding
        setTimeout(() => {
            window.open(formatUrl(finalUrl), '_blank');
            location.reload();
        }, 2000); // 2000 milliseconds = 2 seconds
    }
    
    function resetState() {
        isTiming = false;
        hummingSound.pause();
        hummingSound.currentTime = 0;
        turntableText.classList.remove('cooking');
        turntableText.style.animationDuration = ``; // Clear dynamic style
        enableControls();
    }
    
    function disableControls() {
        startBtn.disabled = true;
        numButtons.forEach(btn => btn.disabled = true);
        stopBtn.disabled = true;
    }
    
    function enableControls() {
        startBtn.disabled = false;
        numButtons.forEach(btn => btn.disabled = false);
        stopBtn.disabled = false;
    }

    function updateTimerDisplay() {
        timerDisplay.textContent = `${timeInput.slice(0, 2)}:${timeInput.slice(2, 4)}`;
    }
    
    function updateCountdownDisplay(totalSeconds) {
        if (totalSeconds < 0) return;
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        timerDisplay.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }

    function parseTimeInput() {
        const minutes = parseInt(timeInput.slice(0, 2), 10);
        const seconds = parseInt(timeInput.slice(2, 4), 10);
        return (minutes * 60) + seconds;
    }
    
    function formatUrl(input) {
        const isUrl = input.includes('.') && !input.includes(' ');
        if (isUrl) {
            return input.startsWith('http://') || input.startsWith('https://') ? input : `https://${input}`;
        } else {
            return `https://www.google.com/search?q=${encodeURIComponent(input)}`;
        }
    }
    
    updateTimerDisplay(); // Initial display setup
});