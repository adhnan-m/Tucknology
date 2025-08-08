document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const microwaveBody = document.getElementById('microwave-body');
    const urlInput = document.getElementById('url-input');
    const startBtn = document.getElementById('start-btn');
    const stopBtn = document.getElementById('stop-btn');
    const timerDisplay = document.getElementById('timer-display');
    const door = document.getElementById('door');
    const timeKnob = document.getElementById('time-knob');
    const knobIndicator = document.getElementById('knob-indicator');
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
    let isTiming = false;
    let timeInput = "0000";
    let totalSeconds = 0;
    
    // Knob-specific state
    let isDragging = false;
    let currentAngle = 0;
    let startMouseAngle = 0;

    // --- Event Listeners ---
    door.addEventListener('click', toggleDoor);
    startBtn.addEventListener('click', startMicrowave);
    stopBtn.addEventListener('click', handleStopClear);
    timeKnob.addEventListener('mousedown', startDrag);
    document.addEventListener('mousemove', drag);
    document.addEventListener('mouseup', endDrag);
    numButtons.forEach(button => {
        button.addEventListener('click', () => handleKeypadPress(button.dataset.value));
    });

    function handleKeypadPress(digit) {
        if (isTiming) return;
        playBeep();
        timeInput = (timeInput + digit).slice(-4);
        totalSeconds = parseTimeInput();
        
        currentAngle = totalSeconds * 6; // Sync with knob
        knobIndicator.style.transform = `rotate(${currentAngle}deg)`;
        
        updateCountdownDisplay(totalSeconds);
    }
    
    function startDrag(e) {
        if (isTiming) return;
        e.preventDefault();
        isDragging = true;
        timeKnob.style.cursor = 'grabbing';
        
        const knobRect = timeKnob.getBoundingClientRect();
        const centerX = knobRect.left + knobRect.width / 2;
        const centerY = knobRect.top + knobRect.height / 2;
        
        const startX = e.clientX - centerX;
        const startY = e.clientY - centerY;
        
        startMouseAngle = Math.atan2(startY, startX) * (180 / Math.PI);
    }

    function drag(e) {
        if (!isDragging) return;
        
        const knobRect = timeKnob.getBoundingClientRect();
        const centerX = knobRect.left + knobRect.width / 2;
        const centerY = knobRect.top + knobRect.height / 2;
        
        const moveX = e.clientX - centerX;
        const moveY = e.clientY - centerY;
        
        const moveAngle = Math.atan2(moveY, moveX) * (180 / Math.PI);
        let angleDiff = moveAngle - startMouseAngle;
        
        currentAngle += angleDiff;
        if (currentAngle < 0) currentAngle = 0;
        
        knobIndicator.style.transform = `rotate(${currentAngle}deg)`;
        
        totalSeconds = Math.floor(currentAngle / 6);
        if (totalSeconds > 5999) totalSeconds = 5999;
        
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        timeInput = String(minutes).padStart(2, '0') + String(seconds).padStart(2, '0');
        
        updateCountdownDisplay(totalSeconds);
        startMouseAngle = moveAngle;
    }

    function endDrag() {
        if (!isDragging) return;
        isDragging = false;
        timeKnob.style.cursor = 'grab';
        playBeep();
    }
    
    function playBeep() {
        beepSound.currentTime = 0;
        beepSound.play();
    }

    function toggleDoor() {
        if (isTiming) return;
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

    function handleStopClear() {
        playBeep();
        if (isTiming) {
            clearInterval(timerInterval);
            resetState();
        } else {
            totalSeconds = 0;
            timeInput = "0000";
            currentAngle = 0;
            knobIndicator.style.transform = `rotate(0deg)`;
            updateCountdownDisplay(0);
            urlInput.value = "";
        }
    }

    function startMicrowave() {
        const urlValue = urlInput.value.trim().toLowerCase();
        if (door.classList.contains('open') === false) return;
        if (!urlValue) { alert("Please place something in the microwave."); return; }
        if (totalSeconds === 0 && urlValue !== 'explode') { alert("Please set a time using the knob or keypad."); return; }
        
        playBeep();
        toggleDoor();
        isTiming = true;
        disableControls();
        turntableText.textContent = urlValue;
        turntableContainer.classList.remove('hidden');
        turntableContainer.classList.add('visible');

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
                turntableText.style.animationDuration = `1s, ${totalSeconds}s`;
                hummingSound.play();
        }

        let timeRemaining = totalSeconds;
        updateCountdownDisplay(timeRemaining);
        timerInterval = setInterval(() => {
            timeRemaining--;
            updateCountdownDisplay(timeRemaining);
            
            // --- THIS IS THE NEW CODE ---
            // It updates the knob's rotation to match the countdown
            currentAngle = timeRemaining * 6;
            if (currentAngle < 0) currentAngle = 0;
            knobIndicator.style.transform = `rotate(${currentAngle}deg)`;
            // --- END OF NEW CODE ---

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
        doorSound.currentTime = 0;
        doorSound.play();
        setTimeout(() => {
            if (finalUrl !== 'matrix' && finalUrl !== 'explode') {
                window.open(formatUrl(finalUrl), '_blank');
            }
            location.reload();
        }, 2000);
    }
    
    function resetState() {
        isTiming = false;
        hummingSound.pause();
        hummingSound.currentTime = 0;
        turntableText.className = '';
        turntableText.style.animationDuration = '';
        microwaveBody.classList.remove('explode-effect');
        crackedGlass.classList.add('hidden');
        enableControls();
    }
    
    function disableControls() {
        startBtn.disabled = true;
        stopBtn.disabled = true;
        numButtons.forEach(btn => btn.disabled = true);
    }
    
    function enableControls() {
        startBtn.disabled = false;
        stopBtn.disabled = false;
        numButtons.forEach(btn => btn.disabled = false);
    }
    
    function updateCountdownDisplay(secondsValue) {
        if (secondsValue < 0) return;
        const minutes = Math.floor(secondsValue / 60);
        const seconds = secondsValue % 60;
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
    
    updateCountdownDisplay(0);
});