document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const microwaveBody = document.getElementById('microwave-body');
    const urlInput = document.getElementById('url-input');
    const startBtn = document.getElementById('start-btn');
    const stopBtn = document.getElementById('stop-btn');
    const timerDisplay = document.getElementById('timer-display');
    const door = document.getElementById('door');
    const turntableContainer = document.getElementById('turntable-container');
    const turntableText = document.getElementById('turntable-text');
    const crackedGlass = document.getElementById('cracked-glass');
    const numButtons = document.querySelectorAll('.btn-num');
    
    // Audio Elements
    const dingSound = document.getElementById('ding-sound');
    const beepSound = document.getElementById('beep-sound');
    const hummingSound = document.getElementById('humming-sound');
    const doorSound = document.getElementById('door-sound');
    const explosionSound = document.getElementById('explosion-sound');

    // State variables
    let timerInterval = null;
    let timeInput = "0000";
    let isTiming = false;

    // --- Event Listeners ---
    door.addEventListener('click', toggleDoor);
    startBtn.addEventListener('click', startMicrowave);
    stopBtn.addEventListener('click', handleStopClear);
    
    numButtons.forEach(button => button.addEventListener('click', () => handleKeypadPress(button.dataset.value)));

    function playBeep() {
        beepSound.currentTime = 0;
        beepSound.play();
    }

    function toggleDoor() {
        if (isTiming) return;
        const isOpen = door.classList.toggle('open');
        doorSound.currentTime = 0; doorSound.play();
        if (isOpen) {
            urlInput.classList.remove('hidden'); urlInput.classList.add('visible'); urlInput.focus();
            turntableContainer.classList.add('hidden'); turntableContainer.classList.remove('visible');
        } else {
            urlInput.classList.add('hidden'); urlInput.classList.remove('visible');
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
            clearInterval(timerInterval); resetState();
        } else {
            timeInput = "0000"; urlInput.value = "";
            updateTimerDisplay();
        }
    }

    function startMicrowave() {
        const urlValue = urlInput.value.trim().toLowerCase();
        const totalSeconds = parseTimeInput();
        if (door.classList.contains('open') === false) return;
        if (!urlValue) { alert("Please place something in the microwave."); return; }
        if (totalSeconds === 0 && urlValue !== 'explode') { alert("Please enter a time."); return; }
        
        playBeep();
        toggleDoor();
        isTiming = true;
        disableControls();
        turntableText.textContent = urlValue;
        turntableContainer.classList.remove('hidden'); turntableContainer.classList.add('visible');

        switch (urlValue) {
            case 'explode':
                microwaveBody.classList.add('explode-effect');
                crackedGlass.classList.remove('hidden');
                explosionSound.play();
                setTimeout(() => location.reload(), 2500);
                return;

            case 'matrix':
                turntableText.classList.add('matrix-effect');
                break;

            default:
                turntableText.classList.add('cooking');
                turntableText.style.animationDuration = `2s, ${totalSeconds}s`;
                hummingSound.play();
        }

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
        door.classList.add('open');
        doorSound.currentTime = 0; doorSound.play();
        setTimeout(() => {
            if (finalUrl !== 'matrix' && finalUrl !== 'explode') {
                window.open(formatUrl(finalUrl), '_blank');
            }
            location.reload();
        }, 2000);
    }
    
    function resetState() {
        isTiming = false;
        hummingSound.pause(); hummingSound.currentTime = 0;
        turntableText.className = 'hidden'; turntableText.style.animationDuration = ``;
        microwaveBody.classList.remove('explode-effect');
        crackedGlass.classList.add('hidden');
        enableControls();
    }
    
    function disableControls() {
        startBtn.disabled = true; stopBtn.disabled = true;
        numButtons.forEach(btn => btn.disabled = true);
    }
    
    function enableControls() {
        startBtn.disabled = false; stopBtn.disabled = false;
        numButtons.forEach(btn => btn.disabled = false);
    }

    function updateTimerDisplay() { timerDisplay.textContent = `${timeInput.slice(0, 2)}:${timeInput.slice(2, 4)}`; }
    function updateCountdownDisplay(totalSeconds) {
        if (totalSeconds < 0) return;
        const minutes = Math.floor(totalSeconds / 60); const seconds = totalSeconds % 60;
        timerDisplay.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }

    function parseTimeInput() {
        const minutes = parseInt(timeInput.slice(0, 2), 10); const seconds = parseInt(timeInput.slice(2, 4), 10);
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
    
    updateTimerDisplay();
});