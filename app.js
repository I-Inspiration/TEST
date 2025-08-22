3. `app.js` (核心逻辑)
这是程序的“大脑”，包含了所有的交互逻辑、数据请求和界面控制。


```javascript
document.addEventListener('DOMContentLoaded', () => {
    // --- 状态变量 ---
    let map;
    let userLocation = { province: "广东", city: "深圳市" };
    let currentShotType = '';
    let provinces = [];
    let cities = [];
    let districts = [];
    let cityToProvinceMap = {};

    // --- DOM 元素缓存 ---
    const dom = {
        map: document.getElementById('map'),
        locateBtn: document.getElementById('locate-btn'),
        locateStatus: document.getElementById('locate-status'),
        heartBtn: document.getElementById('heart-btn'),
        breakBtn: document.getElementById('break-btn'),
        backBtn: document.getElementById('back-btn'),
        detailsContent: document.getElementById('details-content'),
        destinationName: document.getElementById('destination-name'),
        panels: {
            intro: document.getElementById('intro-panel'),
            arrows: document.getElementById('arrow-selection-panel'),
            animation: document.getElementById('animation-panel'),
            result: document.getElementById('result-panel'),
            details: document.getElementById('details-panel')
        }
    };

    // --- 数据加载 ---
    async function loadData() {
        try {
            const [provRes, cityRes, distRes] = await Promise.all([
                fetch('./data/provinces.json'),
                fetch('./data/cities.json'),
                fetch('./data/districts.json')
            ]);
            provinces = await provRes.json();
            cities = await cityRes.json();
            districts = await distRes.json();
            
            // 创建一个城市到省份的反向映射，方便查找
            cities.forEach(city => {
                const province = provinces.find(p => p.id === city.province_id);
                if (province) {
                    cityToProvinceMap[city.name] = province.name;
                }
            });

        } catch (error) {
            console.error("数据文件加载失败:", error);
            alert("关键数据文件加载失败，请检查 data 文件夹和其中的 JSON 文件是否存在！");
        }
    }

    // --- 初始化 ---
    function initialize() {
        map = L.map('map').setView([35.8617, 104.1954], 4);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
        attachEventListeners();
        showPanel('intro');
        loadData();
    }

    // --- 事件绑定 ---
    function attachEventListeners() {
        dom.locateBtn.addEventListener('click', handleLocation);
        dom.panels.arrows.addEventListener('click', handleArrowSelection);
        dom.heartBtn.addEventListener('click', handleHeartClick);
        dom.breakBtn.addEventListener('click', generateDestination);
        dom.backBtn.addEventListener('click', () => showPanel('arrows'));
    }

    // --- 核心流程 ---
    function handleLocation() {
        dom.locateBtn.disabled = true;
        dom.locateStatus.textContent = '正在获取您的经纬度...';
        navigator.geolocation.getCurrentPosition(async (position) => {
            const { latitude, longitude } = position.coords;
            map.setView([latitude, longitude], 12);
            L.marker([latitude, longitude]).addTo(map).bindPopup('你在这里！').openPopup();
            dom.locateStatus.textContent = '定位成功！正在解析省市...';
            try {
                const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}&accept-language=zh`);
                if (!response.ok) throw new Error();
                const data = await response.json();
                const province = data.address.state ? data.address.state.replace(/省|市|自治区|特别行政区/g, '') : "广东";
                const city = (data.address.city || data.address.county || "深圳市").replace('市', '');
                userLocation = { province, city };
                dom.locateStatus.textContent = `当前: ${province}, ${city}`;
                setTimeout(() => showPanel('arrows'), 1200);
            } catch {
                dom.locateStatus.textContent = '无法解析城市，使用默认地点。';
                setTimeout(() => showPanel('arrows'), 1200);
            }
        }, () => {
            alert('定位失败！将使用默认位置开始。');
            showPanel('arrows');
        });
    }

    function handleArrowSelection(e) {
        const card = e.target.closest('.arrow-card');
        if (!card) return;
        currentShotType = card.dataset.type;
        showPanel('animation');
        playSimpleArcheryAnimation(generateDestination);
    }

    function generateDestination() {
        if (!provinces.length || !cities.length || !districts.length) {
            alert("数据尚未加载完成，请稍候...");
            return;
        }

        let destinationHTML = '';
        if (currentShotType === 'province') {
            const randomProvince = provinces[Math.floor(Math.random() * provinces.length)];
            destinationHTML = randomProvince.name;
        } else if (currentShotType === 'city') {
            const randomCity = cities[Math.floor(Math.random() * cities.length)];
            destinationHTML = randomCity.name;
        } else if (currentShotType === 'district') {
            const userCity = cities.find(c => c.name === userLocation.city);
            let targetDistricts = [];
            if (userCity) {
                targetDistricts = districts.filter(d => d.city_id === userCity.id);
            }
            if (targetDistricts.length === 0) { // Fallback
                targetDistricts = districts;
            }
            const randomDistrict = targetDistricts[Math.floor(Math.random() * targetDistricts.length)];
            const parentCity = cities.find(c => c.id === randomDistrict.city_id);
            destinationHTML = `<span class='text-3xl text-gray-500'>${parentCity.name}</span><br>${randomDistrict.name}`;
        }
        
        dom.destinationName.innerHTML = destinationHTML;
        showPanel('result');
    }

    function handleHeartClick() {
        showPanel('details');
        const destinationText = dom.destinationName.textContent;
        // 链接生成逻辑 (无API密钥)
        generateIntroductionLinks(destinationText, dom.detailsContent);
    }
    
    // --- UI & 动画 ---
    function showPanel(panelName) {
        Object.values(dom.panels).forEach(p => p.classList.add('hidden'));
        if (dom.panels[panelName]) dom.panels[panelName].classList.remove('hidden');
        dom.map.classList.toggle('blurred', panelName !== 'intro');
    }

    function playSimpleArcheryAnimation(callback) {
        const canvas = document.getElementById('animation-canvas');
        const ctx = canvas.getContext('2d');
        const arrow = { x: canvas.width, y: canvas.height / 2, length: 80, speed: 8 };
        const target = { x: 40, y: canvas.height / 2, radius: 20 };
        
        function draw() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            // Draw Target
            ctx.fillStyle = 'red';
            ctx.beginPath();
            ctx.arc(target.x, target.y, target.radius, 0, Math.PI * 2);
            ctx.fill();
            // Draw Arrow
            ctx.fillStyle = 'black';
            ctx.fillRect(arrow.x, arrow.y - 2, arrow.length, 4);
            ctx.beginPath();
            ctx.moveTo(arrow.x, arrow.y);
            ctx.lineTo(arrow.x - 10, arrow.y - 5);
            ctx.lineTo(arrow.x - 10, arrow.y + 5);
            ctx.closePath();
            ctx.fill();
        }

        function animate() {
            arrow.x -= arrow.speed;
            draw();
            if (arrow.x <= target.x + arrow.length) {
                setTimeout(callback, 300); // 击中后稍作停留再执行回调
            } else {
                requestAnimationFrame(animate);
            }
        }
        animate();
    }

    function generateIntroductionLinks(destinationName, contentEl) {
        contentEl.innerHTML = '';
        const cleanDestination = destinationName.replace(/.*<br>/, '').trim();
        const encodedDestination = encodeURIComponent(cleanDestination);
        const links = [
            { name: "在百度上搜索攻略...", url: `https://www.baidu.com/s?wd=${encodedDestination}+旅游攻略` },
            { name: "查看马蜂窝游记...", url: `http://www.mafengwo.cn/search/q.php?q=${encodedDestination}` }
        ];
        const title = document.createElement('h3');
        title.className = 'text-2xl font-bold mb-4';
        title.textContent = `探索 "${cleanDestination}"`;
        contentEl.appendChild(title);
        const list = document.createElement('div');
        list.className = 'space-y-4';
        links.forEach(link => {
            const linkElement = document.createElement('a');
            linkElement.href = link.url;
            linkElement.textContent = link.name;
            linkElement.target = '_blank';
            linkElement.rel = 'noopener noreferrer';
            linkElement.className = 'block w-full text-left bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-4 rounded-lg transition-all';
            list.appendChild(linkElement);
        });
        contentEl.appendChild(list);
    }
    
    // --- 启动应用 ---
    initialize();
});
