document.addEventListener('DOMContentLoaded', () => {
    // --- DOM 元素 ---
    const locateBtn = document.getElementById('locate-btn');
    const locateStatus = document.getElementById('locate-status');
    const introScreen = document.getElementById('intro-screen');
    const arrowSelectionScreen = document.getElementById('arrow-selection-screen');
    const animationScreen = document.getElementById('animation-screen');
    const resultScreen = document.getElementById('result-screen');
    const detailsScreen = document.getElementById('details-screen');
    const destinationName = document.getElementById('destination-name');
    const heartBtn = document.getElementById('heart-btn');
    const breakBtn = document.getElementById('break-btn');
    const backBtn = document.getElementById('back-btn');
    const detailsContent = document.getElementById('details-content');
    const loader = document.getElementById('loader');
    const mapElement = document.getElementById('map');
    const powerBar = document.getElementById('power-bar');

    let map;
    let userLocation = { province: "广东", city: "深圳", lat: 22.54, lng: 114.05 };
    let currentShotType = '';
    let synth;

    // --- 音效初始化 ---
    function initAudio() {
        if (Tone.context.state !== 'running') Tone.start();
        synth = new Tone.PolySynth(Tone.Synth, {
            oscillator: { type: "fatsawtooth", count: 3, spread: 30 },
            envelope: { attack: 0.01, decay: 0.1, sustain: 0.5, release: 0.4 }
        }).toDestination();
    }

    // --- 地图初始化 ---
    map = L.map('map').setView([35.8617, 104.1954], 4);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    // --- 屏幕管理 ---
    const screens = { intro: introScreen, arrows: arrowSelectionScreen, animation: animationScreen, result: resultScreen, details: detailsScreen };
    function showScreen(name) {
        Object.values(screens).forEach(s => s.classList.add('hidden-screen'));
        if (screens[name]) screens[name].classList.remove('hidden-screen');
        mapElement.classList.toggle('blurred', name !== 'intro');
    }

    // --- 定位按钮 ---
    locateBtn.addEventListener('click', () => {
        initAudio();
        locateBtn.textContent = '正在定位...';
        locateBtn.disabled = true;
        locateStatus.textContent = '获取经纬度...';

        if (!navigator.geolocation) {
            alert('浏览器不支持地理定位');
            return;
        }

        navigator.geolocation.getCurrentPosition(async (pos) => {
            const { latitude, longitude } = pos.coords;
            map.setView([latitude, longitude], 12);
            L.marker([latitude, longitude]).addTo(map).bindPopup('你在这里！').openPopup();

            try {
                const resp = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}&accept-language=zh`);
                const data = await resp.json();
                const province = (data.address.state || '广东').replace(/[省市自治区特别行政区]/g,'');
                const city = (data.address.city || data.address.county || '深圳').replace('市','');
                userLocation = { province, city, lat: latitude, lng: longitude };
                locateStatus.textContent = `当前位置: ${province} ${city}`;
            } catch {
                locateStatus.textContent = '解析失败，使用默认位置';
            } finally {
                setTimeout(() => showScreen('arrows'), 1000);
            }
        }, () => {
            alert('定位失败，使用默认位置');
            map.setView([userLocation.lat, userLocation.lng], 12);
            L.marker([userLocation.lat, userLocation.lng]).addTo(map).bindPopup('从这里开始').openPopup();
            showScreen('arrows');
        });
    });

    // --- 箭选择 ---
    arrowSelectionScreen.addEventListener('click', (e) => {
        const btn = e.target.closest('.arrow-btn');
        if (!btn) return;
        currentShotType = btn.dataset.type;
        showScreen('animation');
        startArcheryAnimation();
    });

    // --- 生成目的地 ---
    function generateDestination(type) {
        if (typeof chinaData === 'undefined') {
            alert('数据文件未加载');
            showScreen('intro');
            return;
        }
        let destination = '';
        if (type==='province') {
            const provinces = Object.keys(chinaData);
            destination = provinces[Math.floor(Math.random()*provinces.length)];
        } else if (type==='city') {
            const allCities = Object.values(chinaData).flatMap(c=>Object.keys(c));
            destination = allCities[Math.floor(Math.random()*allCities.length)];
        } else if (type==='district') {
            const provinceData = chinaData[userLocation.province]||{};
            const districts = provinceData[userLocation.city]||[];
            destination = districts[Math.floor(Math.random()*districts.length)]||'未知区县';
        }
        destinationName.textContent = destination;
        showScreen('result');
    }

    breakBtn.addEventListener('click', () => showScreen('arrows'));
    backBtn.addEventListener('click', () => showScreen('arrows'));

    heartBtn.addEventListener('click', async () => {
        showScreen('details');
        loader.classList.remove('hidden');
        loader.classList.add('flex');
        detailsContent.innerHTML = '';
        const destination = destinationName.textContent;
        // 这里用 placeholder 文本模拟 API 返回
        setTimeout(() => {
            detailsContent.innerHTML = `<h2>${destination}</h2><p>这里是${destination}的详细介绍，包含景点和美食。</p>`;
            loader.classList.add('hidden');
            loader.classList.remove('flex');
        }, 1000);
    });

    // --- 简单射箭动画 ---
    function startArcheryAnimation() {
        const canvas = document.getElementById('animation-canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = 400;
        canvas.height = 200;

        let isPulling=false, isFlying=false, pullDistance=0;
        let bow = {x: 350, y:100, radius:80};
        let arrow = {x: bow.x, y: bow.y, length:150, angle:0, speed:0};
        let target = {x:50, y:100, radius:80};

        function draw() {
            ctx.clearRect(0,0,canvas.width,canvas.height);
            // 画靶
            ctx.fillStyle='red';
            ctx.beginPath();
            ctx.arc(target.x,target.y,target.radius,0,2*Math.PI);ctx.fill();
            // 画弓
            ctx.strokeStyle='#8B4513';
            ctx.lineWidth=6;
            ctx.beginPath();
            ctx.arc(bow.x,bow.y,bow.radius,Math.PI/2,-Math.PI/2);ctx.stroke();
            // 画箭
            ctx.save();
            ctx.translate(isFlying?arrow.x:bow.x-pullDistance,arrow.y);
            ctx.rotate(arrow.angle);
            ctx.strokeStyle='#000';
            ctx.beginPath();
            ctx.moveTo(0,0); ctx.lineTo(-arrow.length,0); ctx.stroke();
            ctx.restore();
        }

        function update() {
            if (isFlying) {
                arrow.x += arrow.speed;
                if (arrow.x - arrow.length <= target.x + target.radius) {
                    isFlying = false;
                    setTimeout(()=>generateDestination(currentShotType),500);
                }
            }
        }

        canvas.onmousedown = (e)=>{isPulling=true;};
        canvas.onmousemove = (e)=>{if(isPulling){pullDistance=Math.min(100,e.offsetX);}};
        canvas.onmouseup = (e)=>{isPulling=false;if(pullDistance>10){isFlying=true;arrow.speed=pullDistance*0.3;} pullDistance=0;};

        function loop(){update();draw();requestAnimationFrame(loop);}
        loop();
    }

    // --- 初始状态 ---
    showScreen('intro');
});
