(function() {
  // Prize Segments for Wheel Display (10 segments)
  const SEGMENTS = [
    { name: "১০ টাকা", color: "#FFB347" },
    { name: "২০ টাকা", color: "#FFD966" },
    { name: "৫০ টাকা", color: "#F3A683" },
    { name: "১০০ টাকা", color: "#F7D794" },
    { name: "২০০ টাকা", color: "#FFA07A" },
    { name: "কাতান শাড়ি", color: "#C39BD3" },
    { name: "থ্রি-পিস", color: "#5DADE2" },
    { name: "টি-শার্ট", color: "#48C9B0" },
    { name: "জার্সি", color: "#F1948A" },
    { name: "ঘড়ি", color: "#BB8FCE" }
  ];

  // ==============================================
  // NEW PROBABILITY SYSTEM (As requested)
  // 10 Taka: 70% (Highest)
  // 20 Taka: 20% (Medium)
  // 50 Taka: 9% (Low)
  // T-Shirt: 1% (Hidden Jackpot)
  // ==============================================
  function getWeightedBasePrize() {
    const rand = Math.random() * 100;
    
    if (rand < 70) {  // 70% chance for 10 Taka
      return { prizeKey: "১০ টাকা", segmentIdx: 0, value: 10, isJackpot: false };
    } else if (rand < 90) {  // 20% chance for 20 Taka
      return { prizeKey: "২০ টাকা", segmentIdx: 1, value: 20, isJackpot: false };
    } else {  // 10% chance (9% + 1% will be jackpot, but we handle separately)
      // 9% for 50 Taka (will be overridden by jackpot if jackpot hits)
      return { prizeKey: "৫০ টাকা", segmentIdx: 2, value: 50, isJackpot: false };
    }
  }

  let spinning = false;
  let currentRotation = 0;
  let animFrame = null;
  let pendingResult = null;

  // Audio setup
  let audioCtx = null;

  function initAudio() {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
  }

  function playSpinSound() {
    initAudio();
    if (!audioCtx) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.frequency.value = 420;
    gain.gain.value = 0.18;
    osc.type = "sine";
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.45);
    osc.stop(audioCtx.currentTime + 0.45);
  }

  function playWinSound() {
    initAudio();
    if (!audioCtx) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.frequency.value = 880;
    gain.gain.value = 0.25;
    osc.type = "triangle";
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.7);
    osc.stop(audioCtx.currentTime + 0.6);
    setTimeout(() => {
      const osc2 = audioCtx.createOscillator();
      const gain2 = audioCtx.createGain();
      osc2.connect(gain2);
      gain2.connect(audioCtx.destination);
      osc2.frequency.value = 660;
      gain2.gain.value = 0.2;
      osc2.type = "sine";
      osc2.start();
      gain2.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.6);
      osc2.stop(audioCtx.currentTime + 0.6);
    }, 120);
  }

  // Canvas setup
  const canvas = document.getElementById('wheelCanvas');
  const ctx = canvas.getContext('2d');
  let width, height;

  function resizeCanvas() {
    const size = Math.min(540, window.innerWidth * 0.85);
    canvas.width = size;
    canvas.height = size;
    width = size;
    height = size;
    drawWheel(currentRotation);
  }

  function drawWheel(radAngle) {
    const segAngle = (Math.PI * 2) / SEGMENTS.length;
    ctx.clearRect(0, 0, width, height);
    for (let i = 0; i < SEGMENTS.length; i++) {
      const start = i * segAngle + radAngle;
      const end = (i + 1) * segAngle + radAngle;
      ctx.beginPath();
      ctx.moveTo(width / 2, height / 2);
      ctx.arc(width / 2, height / 2, width / 2, start, end);
      ctx.fillStyle = SEGMENTS[i].color;
      ctx.fill();
      ctx.save();
      ctx.translate(width / 2, height / 2);
      ctx.rotate(start + segAngle / 2);
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "#1a2a2f";
      ctx.font = `bold ${Math.max(11, width / 26)}px "Poppins", "Hind Siliguri"`;
      let displayTxt = SEGMENTS[i].name;
      if (displayTxt.length > 12) displayTxt = displayTxt.slice(0, 10) + '..';
      ctx.fillText(displayTxt, width * 0.33, 8);
      ctx.restore();
      ctx.strokeStyle = "#FFE6AA";
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(width / 2, height / 2);
      ctx.arc(width / 2, height / 2, width / 2, start, end);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.arc(width / 2, height / 2, 22, 0, 2 * Math.PI);
    ctx.fillStyle = "#f5cd6d";
    ctx.shadowBlur = 12;
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  let spinStartTime = 0, spinDuration = 2200, startRot = 0, targetRot = 0;

  function animateSpin(now) {
    const elapsed = now - spinStartTime;
    let t = Math.min(1, elapsed / spinDuration);
    const easeOutCubic = 1 - Math.pow(1 - t, 3);
    currentRotation = startRot + (targetRot - startRot) * easeOutCubic;
    drawWheel(currentRotation);
    if (t < 1) {
      animFrame = requestAnimationFrame(animateSpin);
    } else {
      currentRotation = targetRot;
      drawWheel(currentRotation);
      spinning = false;
      if (!pendingResult) return;
      const { prizeText, isJackpot, amount } = pendingResult;
      showResultPopup(prizeText, isJackpot, amount);
      pendingResult = null;
      localStorage.setItem('elyra_eidi_spun', 'true');
      localStorage.setItem('elyra_spin_result', prizeText);
      if (animFrame) cancelAnimationFrame(animFrame);
      animFrame = null;
    }
  }

  function startSpinWithTarget(prizeKey, isJackpotTshirt, amountValue) {
    let targetIdx = SEGMENTS.findIndex(seg => seg.name === prizeKey);
    if (targetIdx === -1 && prizeKey === "টি-শার্ট") targetIdx = 7;
    if (targetIdx === -1 && prizeKey === "১০ টাকা") targetIdx = 0;
    if (targetIdx === -1 && prizeKey === "২০ টাকা") targetIdx = 1;
    if (targetIdx === -1 && prizeKey === "৫০ টাকা") targetIdx = 2;
    if (targetIdx === -1) targetIdx = 0;

    const segAngle = (Math.PI * 2) / SEGMENTS.length;
    let targetSegmentMid = (targetIdx * segAngle) + segAngle / 2;
    let pointerAngle = (Math.PI * 1.5);
    let delta = (pointerAngle - targetSegmentMid + 2 * Math.PI) % (2 * Math.PI);
    let extraSpins = 10 * Math.PI * 2;
    let finalRot = (currentRotation + extraSpins + delta) % (2 * Math.PI);

    startRot = currentRotation;
    targetRot = finalRot;
    spinStartTime = performance.now();
    spinning = true;
    playSpinSound();
    animFrame = requestAnimationFrame(animateSpin);
  }

  function performSpin() {
    if (spinning) return;
    const alreadySpun = localStorage.getItem('elyra_eidi_spun');
    if (alreadySpun === 'true') {
      showLimitPopup();
      return;
    }

    if (navigator.vibrate) navigator.vibrate(100);

    // Hidden T-shirt Jackpot: 1% chance (1 in 100)
    let isTshirtJackpot = false;
    const jackpotRoll = Math.random() * 100;
    if (jackpotRoll < 1) {
      isTshirtJackpot = true;
    }

    let finalPrizeName = "";
    let finalAmount = null;

    if (isTshirtJackpot) {
      finalPrizeName = "টি-শার্ট";
    } else {
      const base = getWeightedBasePrize();
      finalPrizeName = base.prizeKey;
      finalAmount = base.value;
    }

    pendingResult = {
      prizeText: finalPrizeName,
      isJackpot: isTshirtJackpot,
      amount: finalAmount
    };

    startSpinWithTarget(finalPrizeName, isTshirtJackpot, finalAmount);
  }

  function showResultPopup(prize, isJackpot, amount) {
    const modal = document.getElementById('resultModal');
    const titleEl = document.getElementById('modalTitle');
    const msgEl = document.getElementById('modalMessage');

    if (isJackpot && prize === "টি-শার্ট") {
      titleEl.innerHTML = "🎉✨ JACKPOT WINNER! ✨🎉";
      msgEl.innerHTML = "🎁 আপনি জিতেছেন একটি টি-শার্ট! 🎁<br>আমাদের সাথে যোগাযোগ করুন পুরস্কার পেতে।";
      playWinSound();
      startConfetti(6);
      triggerGoldenGlow();
    } else {
      titleEl.innerHTML = "🎉 অভিনন্দন! 🎉";
      msgEl.innerHTML = `আপনি জিতেছেন ${prize} ইদি! ঈদ মোবারক ✨`;
      playWinSound();
      startConfetti(3);
    }
    modal.classList.add('active');
  }

  function triggerGoldenGlow() {
    const modalContent = document.querySelector('.modal-content');
    modalContent.style.animation = 'none';
    modalContent.offsetHeight;
    modalContent.style.animation = 'zoomPop 0.5s, goldFlash 0.8s infinite';
  }

  function showLimitPopup() {
    const modal = document.getElementById('resultModal');
    document.getElementById('modalTitle').innerHTML = "⚠️ সীমা শেষ ⚠️";
    document.getElementById('modalMessage').innerHTML = "আপনার স্পিন সীমা শেষ হয়েছে। একটি ডিভাইস থেকে মাত্র ১ বার স্পিন করা যাবে।";
    modal.classList.add('active');
  }

  // Confetti Effect
  let confettiCanvas = null;
  let confettiCtx = null;

  function startConfetti(seconds) {
    if (!confettiCanvas) {
      confettiCanvas = document.createElement('canvas');
      confettiCanvas.classList.add('confetti-canvas');
      document.body.appendChild(confettiCanvas);
      confettiCtx = confettiCanvas.getContext('2d');
      window.addEventListener('resize', () => {
        if (confettiCanvas) {
          confettiCanvas.width = window.innerWidth;
          confettiCanvas.height = window.innerHeight;
        }
      });
    }
    confettiCanvas.width = window.innerWidth;
    confettiCanvas.height = window.innerHeight;
    let particles = [];
    for (let i = 0; i < 180; i++) {
      particles.push({
        x: Math.random() * confettiCanvas.width,
        y: Math.random() * confettiCanvas.height - confettiCanvas.height,
        size: Math.random() * 7 + 2,
        color: `hsl(${Math.random() * 360}, 85%, 60%)`,
        speedY: Math.random() * 8 + 4,
        speedX: (Math.random() - 0.5) * 4,
      });
    }
    let startTime = Date.now();

    function drawConfetti() {
      if (!confettiCanvas || !confettiCtx) return;
      confettiCtx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
      for (let p of particles) {
        confettiCtx.fillStyle = p.color;
        confettiCtx.fillRect(p.x, p.y, p.size, p.size * 0.7);
        p.y += p.speedY;
        p.x += p.speedX;
        if (p.y > confettiCanvas.height) {
          p.y = -15;
          p.x = Math.random() * confettiCanvas.width;
        }
      }
      if (Date.now() - startTime < seconds * 1000) {
        requestAnimationFrame(drawConfetti);
      } else {
        if (confettiCtx) confettiCtx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
        if (confettiCanvas) confettiCanvas.style.display = 'none';
      }
    }
    confettiCanvas.style.display = 'block';
    drawConfetti();
  }

  // Floating particles initialization
  function initParticles() {
    const container = document.getElementById('particlesContainer');
    for (let i = 0; i < 80; i++) {
      let particle = document.createElement('div');
      particle.classList.add('particle');
      let size = Math.random() * 5 + 2;
      particle.style.width = size + 'px';
      particle.style.height = size + 'px';
      particle.style.left = Math.random() * 100 + '%';
      particle.style.animationDelay = Math.random() * 10 + 's';
      particle.style.animationDuration = 5 + Math.random() * 9 + 's';
      particle.style.background = `radial-gradient(circle, rgba(255,210,70,0.9), rgba(255,140,0,0.3))`;
      container.appendChild(particle);
    }
  }

  function checkSpinStatus() {
    const spinBtn = document.getElementById('spinBtn');
    if (localStorage.getItem('elyra_eidi_spun') === 'true') {
      spinBtn.disabled = true;
    } else {
      spinBtn.disabled = false;
    }
  }

  // Event Listeners
  window.addEventListener('load', () => {
    resizeCanvas();
    drawWheel(0);
    initParticles();
    checkSpinStatus();

    const spinBtn = document.getElementById('spinBtn');
    spinBtn.addEventListener('click', performSpin);

    const closeModalBtn = document.getElementById('closeModalBtn');
    closeModalBtn.addEventListener('click', () => {
      document.getElementById('resultModal').classList.remove('active');
    });

    window.addEventListener('resize', () => {
      resizeCanvas();
      drawWheel(currentRotation);
    });

    // Enable audio after first user gesture
    document.body.addEventListener('click', () => {
      if (audioCtx && audioCtx.state === 'suspended') {
        audioCtx.resume();
      }
    }, { once: true });
  });
})();
