let provinces = [];
let cities = [];
let districts = [];

const resultContainer = document.getElementById("result-container");
const resultTitle = document.getElementById("result-title");
const travelGuideDiv = document.getElementById("travel-guide");

async function loadData() {
    provinces = await fetch("data/provinces.json").then(res => res.json());
    cities = await fetch("data/cities.json").then(res => res.json());
    districts = await fetch("data/districts.json").then(res => res.json());
}

function randomPick(array) {
    return array[Math.floor(Math.random() * array.length)];
}

function generateGuide(name) {
    // 模拟旅行攻略，这里可以以后接旅游API
    return `
        <h3>旅行攻略 - ${name}</h3>
        <p><strong>特色：</strong> ${name}以其独特的自然风光和人文底蕴著称。</p>
        <p><strong>必玩景点：</strong> 景点A、景点B、景点C</p>
        <p><strong>美食推荐：</strong> 当地特色小吃、传统菜肴、夜市小吃</p>
        <p><strong>玩法建议：</strong> 两日游/三日游皆可，适合拍照和休闲放松。</p>
    `;
}

function showResult(name) {
    resultTitle.textContent = `🏹 目的地：${name}`;
    resultContainer.classList.remove("hidden");
    travelGuideDiv.classList.add("hidden");
}

document.getElementById("btn-province").addEventListener("click", () => {
    const prov = randomPick(provinces);
    showResult(prov.name);
});

document.getElementById("btn-city").addEventListener("click", () => {
    const city = randomPick(cities);
    showResult(city.name);
});

document.getElementById("btn-district").addEventListener("click", () => {
    const district = randomPick(districts);
    const cityName = cities.find(c => c.id === district.city_id)?.name || "";
    showResult(`${cityName} - ${district.name}`);
});

document.getElementById("heart-yes").addEventListener("click", () => {
    const name = resultTitle.textContent.replace("🏹 目的地：", "");
    travelGuideDiv.innerHTML = generateGuide(name);
    travelGuideDiv.classList.remove("hidden");
});

document.getElementById("heart-no").addEventListener("click", () => {
    // 重新随机结果
    if (resultTitle.textContent.includes("-")) {
        document.getElementById("btn-district").click();
    } else if (cities.some(c => c.name === resultTitle.textContent.replace("🏹 目的地：", ""))) {
        document.getElementById("btn-city").click();
    } else {
        document.getElementById("btn-province").click();
    }
});

loadData();
