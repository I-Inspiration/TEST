document.addEventListener('DOMContentLoaded', () => {
    // --- 状态变量 ---
    let userLocation = { provinceId: null, cityId: null, districtId: null, provinceName: '', cityName: '', districtName: '' };
    let currentMode = ''; // 'full-random' 或 'nearby-random'
    let currentShotType = ''; 
    let provinces = [];
    let cities = [];
    let districts = [];

    // --- DOM 元素缓存 ---
    const dom = {
        provinceSelect: document.getElementById('province-select'),
        citySelect: document.getElementById('city-select'),
        districtSelect: document.getElementById('district-select'),
        confirmLocationBtn: document.getElementById('confirm-location-btn'),
        modeFullRandomBtn: document.getElementById('mode-full-random'),
        modeNearbyRandomBtn: document.getElementById('mode-nearby-random'),
        heartBtn: document.getElementById('heart-btn'),
        breakBtn: document.getElementById('break-btn'),
        backBtn: document.getElementById('back-btn'),
        startNewJourneyBtn: document.getElementById('start-new-journey-btn'),
        detailsContent: document.getElementById('details-content'),
        destinationName: document.getElementById('destination-name'),
        panels: {
            location: document.getElementById('step-location'),
            modeSelection: document.getElementById('step-mode-selection'),
            fullRandomArrows: document.getElementById('step-full-random-arrows'),
            nearbyOptions: document.getElementById('step-nearby-options'),
            animation: document.getElementById('animation-panel'),
            result: document.getElementById('result-panel'),
            details: document.getElementById('details-panel')
        },
        backBtns: document.querySelectorAll('.back-btn'),
        arrowCards: document.querySelectorAll('.arrow-card')
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
            populateProvinces();
        } catch (error) {
            console.error("数据文件加载失败:", error);
            alert("关键数据文件加载失败，请检查 data 文件夹和 JSON 文件！");
        }
    }

    // --- 初始化 ---
    function initialize() {
        attachEventListeners();
        showPanel('location');
        loadData();
    }

    // --- 事件绑定 ---
    function attachEventListeners() {
        dom.provinceSelect.addEventListener('change', handleProvinceChange);
        dom.citySelect.addEventListener('change', handleCityChange);
        dom.confirmLocationBtn.addEventListener('click', handleConfirmLocation);
        dom.modeFullRandomBtn.addEventListener('click', () => handleModeSelection('full-random'));
        dom.modeNearbyRandomBtn.addEventListener('click', () => handleModeSelection('nearby-random'));
        
        dom.arrowCards.forEach(card => {
            card.addEventListener('click', handleCardSelection);
        });

        dom.heartBtn.addEventListener('click', handleHeartClick);
        dom.breakBtn.addEventListener('click', () => { // "换一个" 按钮
             showPanel('animation');
             playSimpleArcheryAnimation(generateDestination);
        });
        
        dom.startNewJourneyBtn.addEventListener('click', () => showPanel('location'));
        dom.backBtn.addEventListener('click', hideDetailsPanel);
        
        dom.backBtns.forEach(btn => {
            btn.addEventListener('click', () => showPanel(btn.dataset.target));
        });
    }

    // --- 核心流程 ---
    function populateProvinces() {
        dom.provinceSelect.innerHTML = '<option value="">请选择省份</option>';
        provinces.forEach(p => dom.provinceSelect.add(new Option(p.name, p.id)));
        handleProvinceChange(); // 初始化
    }

    function handleProvinceChange() {
        const provinceId = dom.provinceSelect.value;
        dom.citySelect.innerHTML = '<option value="">请选择城市</option>';
        if (provinceId) {
            cities.filter(c => c.province_id === provinceId).forEach(c => dom.citySelect.add(new Option(c.name, c.id)));
        }
        handleCityChange(); // 联动更新区县
    }

    function handleCityChange() {
        const cityId = dom.citySelect.value;
        dom.districtSelect.innerHTML = '<option value="">请选择区/县</option>';
        if (cityId) {
            districts.filter(d => d.city_id === cityId).forEach(d => dom.districtSelect.add(new Option(d.name, d.id)));
        }
    }
    
    function handleConfirmLocation() {
        if (!dom.provinceSelect.value || !dom.citySelect.value) {
            alert('请至少选择一个省份和城市！');
            return;
        }
        userLocation = {
            provinceId: dom.provinceSelect.value,
            cityId: dom.citySelect.value,
            districtId: dom.districtSelect.value,
            provinceName: dom.provinceSelect.options[dom.provinceSelect.selectedIndex].text,
            cityName: dom.citySelect.options[dom.citySelect.selectedIndex].text,
            districtName: dom.districtSelect.value ? dom.districtSelect.options[dom.districtSelect.selectedIndex].text : ''
        };
        showPanel('modeSelection');
    }

    function handleModeSelection(mode) {
        currentMode = mode;
        if (mode === 'full-random') showPanel('fullRandomArrows');
        else if (mode === 'nearby-random') showPanel('nearbyOptions');
    }
    
    function handleCardSelection(e) {
        currentShotType = e.currentTarget.dataset.type;
        showPanel('animation');
        playSimpleArcheryAnimation(generateDestination);
    }
    
    // --- 目的地生成 ---
    function generateDestination() {
        let destination = { name: '未知之地', parent: '' };

        if (currentMode === 'full-random') {
            if (currentShotType === 'province') {
                const randomProvince = provinces[Math.floor(Math.random() * provinces.length)];
                destination.name = randomProvince.name;
            } else if (currentShotType === 'city') {
                const randomCity = cities[Math.floor(Math.random() * cities.length)];
                destination.name = randomCity.name;
            } else if (currentShotType === 'district') {
                const randomDistrict = districts[Math.floor(Math.random() * districts.length)];
                const parentCity = cities.find(c => c.id === randomDistrict.city_id);
                destination.name = randomDistrict.name;
                destination.parent = parentCity?.name || '';
            }
        } else if (currentMode === 'nearby-random') {
            if (currentShotType === 'nearby-city') {
                const citiesInSameProvince = cities.filter(c => c.province_id === userLocation.provinceId && c.id !== userLocation.cityId);
                if (citiesInSameProvince.length > 0) {
                    const randomCity = citiesInSameProvince[Math.floor(Math.random() * citiesInSameProvince.length)];
                    destination.name = randomCity.name;
                } else {
                    destination.name = `本省无其他城市可选`;
                }
            } else if (currentShotType === 'nearby-district') {
                const districtsInSameCity = districts.filter(d => d.city_id === userLocation.cityId && d.id !== userLocation.districtId);
                 if (districtsInSameCity.length > 0) {
                    const randomDistrict = districtsInSameCity[Math.floor(Math.random() * districtsInSameCity.length)];
                    destination.name = randomDistrict.name;
                    destination.parent = userLocation.cityName;
                } else {
                    destination.name = `本市无其他区县可选`;
                }
            }
        }
        
        displayDestination(destination);
    }

    function displayDestination(destination) {
        let destinationHTML = destination.name;
        if (destination.parent) {
            destinationHTML = `<span class='text-3xl text-gray-400 font-medium'>${destination.parent}</span><br>${destination.name}`;
        }
        dom.destinationName.innerHTML = destinationHTML;
        showPanel('result');
    }
    
    function handleHeartClick() {
        showDetailsPanel();
        const destinationText = dom.destinationName.textContent;
        generateIntroductionLinks(destinationText, dom.detailsContent);
    }
    
    // --- UI & 动画 ---
    function showPanel(panelName) {
        Object.keys(dom.panels).forEach(key => {
            dom.panels[key].classList.toggle('hidden', key !== panelName);
        });
    }

    function showDetailsPanel() {
        dom.panels.details.classList.add('open');
    }

    function hideDetailsPanel() {
        dom.panels.details.classList.remove('open');
    }
    
    function playSimpleArcheryAnimation(callback) {
        // ... (动画代码与上一版相同，此处省略以保持简洁) ...
        const canvas = document.getElementById('animation-canvas');
        if (!canvas.getContext) return callback(); // 如果canvas不支持，直接回调
        const ctx = canvas.getContext('2d');
        const arrow = { x: canvas.width, y: canvas.height / 2, length: 80, speed: 10 };
        const target = { x: 40, y: canvas.height / 2, radius: 20 };
        let animationId;
        function draw() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = '#ef4444'; ctx.beginPath(); ctx.arc(target.x, target.y, target.radius, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#374151'; ctx.fillRect(arrow.x, arrow.y - 2, arrow.length, 4);
        }
        function animate() {
            arrow.x -= arrow.speed; draw();
            if (arrow.x <= target.x + arrow.radius) { cancelAnimationFrame(animationId); setTimeout(callback, 500); } 
            else { animationId = requestAnimationFrame(animate); }
        }
        arrow.x = canvas.width; animate();
    }

    function generateIntroductionLinks(destinationName, contentEl) {
        contentEl.innerHTML = '';
        const cleanDestination = destinationName.replace(/.*<br>/, '').trim();
        const encodedDestination = encodeURIComponent(cleanDestination);
        const title = document.createElement('h3');
        title.className = 'text-2xl font-bold mb-6 text-center';
        title.textContent = `探索 "${cleanDestination}"`;
        contentEl.appendChild(title);
        const list = document.createElement('div');
        list.className = 'space-y-4';
        const links = [
            { name: "在百度上搜索攻略", url: `https://www.baidu.com/s?wd=${encodedDestination}+旅游攻略`, icon: "fa-solid fa-magnifying-glass" },
            { name: "查看马蜂窝游记", url: `http://www.mafengwo.cn/search/q.php?q=${encodedDestination}`, icon: "fa-solid fa-mountain-sun" }
        ];
        links.forEach(link => {
            const linkElement = document.createElement('a');
            linkElement.href = link.url;
            linkElement.target = '_blank';
            linkElement.rel = 'noopener noreferrer';
            linkElement.innerHTML = `<i class="${link.icon} mr-3"></i> ${link.name}`;
            list.appendChild(linkElement);
        });
        contentEl.appendChild(list);
    }
    
    // --- 启动应用 ---
    initialize();
});
