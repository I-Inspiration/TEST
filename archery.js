function startArcheryGame(container, onHitCallback) {
    // 清理旧的 canvas (如果存在)
    container.innerHTML = '';

    // 创建新的 canvas 和力量条
    const canvas = document.createElement('canvas');
    const powerBarContainer = document.createElement('div');
    powerBarContainer.innerHTML = `<div id="power-bar-dynamic" style="width: 100%; height: 0%; background: linear-gradient(to top, #fde047, #f97316, #ef4444); border-radius: 4px; transition: height 0.1s linear;"></div>`;
    powerBarContainer.style.cssText = "width: 12px; height: 120px; background-color: rgba(0,0,0,0.2); border-radius: 6px; border: 1px solid white; padding: 2px;";
    
    const gameWrapper = document.createElement('div');
    gameWrapper.className = 'flex items-center justify-center gap-4 w-full';
    gameWrapper.appendChild(canvas);
    gameWrapper.appendChild(powerBarContainer);
    container.appendChild(gameWrapper);
    
    const ctx = canvas.getContext('2d');
    const powerBar = document.getElementById('power-bar-dynamic');

    let isPulling = false, isFlying = false;
    let bow = {}, arrow = {}, target = {};
    let pullVector = { x: 0, y: 0 };
    let maxPull;
    let animationFrameId;

    function resizeCanvas() {
        const size = Math.min(container.clientWidth - 80, 280);
        canvas.width = size;
        canvas.height = size;
        maxPull = canvas.width * 0.4;
        resetAnimation();
    }

    function resetAnimation() {
        isPulling = false; isFlying = false;
        pullVector = { x: 0, y: 0 };
        // 增加弓与靶的距离
        bow = { x: canvas.width * 0.95, y: canvas.height / 2, radius: canvas.height * 0.4 };
        arrow = { x: bow.x, y: bow.y, length: canvas.width * 0.6, angle: Math.PI, speed: 0 };
        target = { x: canvas.width * 0.15, y: canvas.height / 2, radius: canvas.height * 0.12 };
        powerBar.style.height = '0%';
        draw();
    }

    function getEventPos(e) {
        const rect = canvas.getBoundingClientRect();
        const clientX = e.clientX || e.touches[0].clientX;
        const clientY = e.clientY || e.touches[0].clientY;
        return { x: (clientX - rect.left) * (canvas.width / rect.width), y: (clientY - rect.top) * (canvas.height / rect.height) };
    }

    function onInteractionStart(e) {
        e.preventDefault();
        if (isFlying) return;
        const pos = getEventPos(e);
        if (Math.hypot(pos.x - bow.x, pos.y - bow.y) < bow.radius * 1.2) {
            isPulling = true;
            if (typeof initAudio === 'function') initAudio(); // 确保音效已初始化
            if (window.synth) window.synth.triggerAttack("C2");
        }
    }

    function onInteractionMove(e) {
        e.preventDefault();
        if (!isPulling) return;
        const pos = getEventPos(e);
        pullVector.x = pos.x - bow.x;
        pullVector.y = pos.y - bow.y;
        
        let pullDistance = Math.hypot(pullVector.x, pullVector.y);
        if (pullDistance > maxPull) {
            const ratio = maxPull / pullDistance;
            pullVector.x *= ratio;
            pullVector.y *= ratio;
        }
        
        arrow.angle = Math.atan2(pullVector.y, pullVector.x) + Math.PI;
        const powerRatio = Math.hypot(pullVector.x, pullVector.y) / maxPull;
        powerBar.style.height = `${powerRatio * 100}%`;
        if (window.synth) window.synth.setNote(Tone.Frequency("C2").transpose(powerRatio * 24));
    }

    function onInteractionEnd(e) {
        e.preventDefault();
        if (!isPulling) return;
        isPulling = false;
        if (window.synth) window.synth.triggerRelease();
        const pullDistance = Math.hypot(pullVector.x, pullVector.y);
        if (pullDistance > 10) {
            isFlying = true;
            arrow.speed = (pullDistance / maxPull) * 30; // 调整速度系数
            if (window.synth) window.synth.triggerAttackRelease("G4", "0.2");
        }
        pullVector = { x: 0, y: 0 };
    }

    function drawArrow() {
        ctx.save();
        const nockX = isFlying ? arrow.x : bow.x + pullVector.x;
        const nockY = isFlying ? arrow.y : bow.y + pullVector.y;
        ctx.translate(nockX, nockY);
        ctx.rotate(arrow.angle);
        
        // 箭身
        ctx.strokeStyle = '#693815'; // Brown
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(arrow.length, 0);
        ctx.stroke();

        // 箭头 (新样式)
        ctx.fillStyle = '#555'; // Dark gray
        ctx.beginPath();
        ctx.moveTo(arrow.length, 0);
        ctx.lineTo(arrow.length - 20, -6);
        ctx.lineTo(arrow.length - 20, 6);
        ctx.closePath();
        ctx.fill();

        // 箭羽 (新样式)
        ctx.fillStyle = '#FFF';
        ctx.strokeStyle = '#AAA';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(5, 0);
        ctx.lineTo(20, -6);
        ctx.lineTo(25, -5);
        ctx.lineTo(10, 0);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(5, 0);
        ctx.lineTo(20, 6);
        ctx.lineTo(25, 5);
        ctx.lineTo(10, 0);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.restore();
    }

    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        // Draw Target
        const colors = ['#FF4136', '#FFFFFF', '#FF4136', '#FFFFFF', '#FF4136'];
        for (let i = 0; i < 5; i++) {
            ctx.fillStyle = colors[i];
            ctx.beginPath(); ctx.arc(target.x, target.y, target.radius * (1 - i * 0.2), 0, Math.PI * 2); ctx.fill();
        }
        // Draw Bow
        ctx.strokeStyle = '#8B4513'; ctx.lineWidth = 8;
        ctx.beginPath(); ctx.arc(bow.x, bow.y, bow.radius, Math.PI / 2, -Math.PI / 2); ctx.stroke();
        const stringNockX = bow.x + pullVector.x;
        const stringNockY = bow.y + pullVector.y;
        ctx.strokeStyle = '#555'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(bow.x, bow.y - bow.radius); ctx.lineTo(stringNockX, stringNockY); ctx.lineTo(bow.x, bow.y + bow.radius); ctx.stroke();
        
        drawArrow();
    }
    
    function update() {
        if (isFlying) {
            arrow.x += arrow.speed * Math.cos(arrow.angle);
            arrow.y += arrow.speed * Math.sin(arrow.angle);
            const tipX = arrow.x + arrow.length * Math.cos(arrow.angle);
            const tipY = arrow.y + arrow.length * Math.sin(arrow.angle);
            if (Math.hypot(tipX - target.x, tipY - target.y) < target.radius) {
                isFlying = false;
                if (window.synth) window.synth.triggerAttackRelease("C5", "0.5");
                setTimeout(onHitCallback, 800);
            }
            if (tipX < 0 || tipX > canvas.width || tipY < 0 || tipY > canvas.height) {
                 isFlying = false;
                 setTimeout(resetAnimation, 500);
            }
        }
    }

    function gameLoop() {
        update();
        draw();
        animationFrameId = requestAnimationFrame(gameLoop);
    }
    
    // Attach Listeners
    canvas.addEventListener('mousedown', onInteractionStart);
    canvas.addEventListener('mousemove', onInteractionMove);
    window.addEventListener('mouseup', onInteractionEnd);
    canvas.addEventListener('touchstart', onInteractionStart, { passive: false });
    canvas.addEventListener('touchmove', onInteractionMove, { passive: false });
    window.addEventListener('touchend', onInteractionEnd);
    window.addEventListener('resize', resizeCanvas);
    
    resizeCanvas();
    gameLoop();
}
