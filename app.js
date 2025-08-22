// --- 基础地图 ---
const map = L.map('map').setView([35.8617, 104.1954], 4);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

let userLocation = { province:"广东", city:"深圳市", lat:22.54, lng:114.05 };
let currentShotType = '';
let arrowFlying = false;
let arrow = {x:0, y:0, speed:0, angle:0};
let target = {x:100, y:50, radius:40};

// --- 屏幕切换 ---
const screens = {
  intro: document.getElementById('intro-screen'),
  arrows: document.getElementById('arrow-selection-screen'),
  animation: document.getElementById('animation-screen'),
  result: document.getElementById('result-screen')
};

function showScreen(name){
  Object.values(screens).forEach(s=>s.classList.add('hidden-screen'));
  screens[name].classList.remove('hidden-screen');
}

// --- 初始定位 ---
document.getElementById('locate-btn').addEventListener('click', ()=>{
  showScreen('arrows');
});

// --- 箭选择 ---
document.querySelectorAll('.arrow-btn').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    currentShotType = btn.dataset.type;
    showScreen('animation');
    startArcheryAnimation();
  });
});

// --- 射箭按钮 ---
document.getElementById('shoot-btn').addEventListener('click', ()=>{
  arrowFlying = true;
  arrow.speed = 10;
});

// --- 生成随机目的地 ---
const destinationName = document.getElementById('destination-name');

function generateDestination(type){
  let destination='';
  if(type==='province'){
    const provinces = Object.keys(chinaData);
    destination = provinces[Math.floor(Math.random()*provinces.length)];
  }else if(type==='city'){
    const allCities = Object.values(chinaData).flatMap(c=>Object.keys(c));
    destination = allCities[Math.floor(Math.random()*allCities.length)];
  }else if(type==='district'){
    const provinceData = chinaData[userLocation.province]||{};
    const districts = provinceData[userLocation.city]||[];
    destination = districts[Math.floor(Math.random()*districts.length)]||'未知区县';
  }
  destinationName.textContent = destination;
  showScreen('result');
}

// --- 重新开始 ---
document.getElementById('restart-btn').addEventListener('click', ()=>{
  showScreen('arrows');
});

// --- 射箭动画 ---
function startArcheryAnimation(){
  const canvas = document.getElementById('animation-canvas');
  const ctx = canvas.getContext('2d');
  canvas.width = 400; canvas.height = 200;
  arrow.x = canvas.width - 50; arrow.y = canvas.height/2;
  target.x = 50; target.y = canvas.height/2;

  function draw(){
    ctx.clearRect(0,0,canvas.width,canvas.height);
    // 靶子
    ctx.fillStyle='red'; ctx.beginPath();
    ctx.arc(target.x,target.y,target.radius,0,2*Math.PI); ctx.fill();
    // 箭
    ctx.fillStyle='brown';
    ctx.beginPath(); ctx.moveTo(arrow.x,arrow.y); ctx.lineTo(arrow.x-20,arrow.y); ctx.lineTo(arrow.x-20,arrow.y-2); ctx.lineTo(arrow.x,arrow.y-2); ctx.fill();
  }

  function update(){
    if(arrowFlying){
      arrow.x -= arrow.speed;
      if(arrow.x <= target.x + target.radius){
        arrowFlying=false;
        setTimeout(()=>generateDestination(currentShotType),500);
      }
    }
  }

  function loop(){
    update();
    draw();
    requestAnimationFrame(loop);
  }

  loop();
}
