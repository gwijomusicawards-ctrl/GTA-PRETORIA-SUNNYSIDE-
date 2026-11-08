import * as THREE from "three";

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x9eafa9);
scene.fog = new THREE.Fog(0x9eafa9, 170, 650);
const camera = new THREE.PerspectiveCamera(68, innerWidth/innerHeight, .1, 1200);
const renderer = new THREE.WebGLRenderer({antialias:true, powerPreference:"high-performance"});
renderer.setPixelRatio(Math.min(devicePixelRatio,1.7));
renderer.setSize(innerWidth,innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.12;
document.querySelector("#game").appendChild(renderer.domElement);

scene.add(new THREE.HemisphereLight(0xdce9ff,0x56604d,2.0));
const sun = new THREE.DirectionalLight(0xffe0b0,2.1);
sun.position.set(-100,180,90); sun.castShadow=true; sun.shadow.mapSize.set(2048,2048);
sun.shadow.camera.left=-220;sun.shadow.camera.right=220;sun.shadow.camera.top=220;sun.shadow.camera.bottom=-220;
scene.add(sun);

const mats = {
  road:new THREE.MeshStandardMaterial({color:0x343936,roughness:.95}),
  sidewalk:new THREE.MeshStandardMaterial({color:0x9a9b91,roughness:1}),
  grass:new THREE.MeshStandardMaterial({color:0x667b5d,roughness:1}),
  white:new THREE.MeshStandardMaterial({color:0xe7e3d6}),
  yellow:new THREE.MeshStandardMaterial({color:0xe5b72c}),
  dark:new THREE.MeshStandardMaterial({color:0x222724,roughness:.7})
};
const ground = new THREE.Mesh(new THREE.PlaneGeometry(1000,1000),mats.grass);
ground.rotation.x=-Math.PI/2;ground.position.y=-.08;ground.receiveShadow=true;scene.add(ground);
const city = new THREE.Group(); scene.add(city);
const interactables=[];
const roadLines=[];

function box(parent,x,y,z,w,h,d,mat,cast=true){
 const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);m.position.set(x,y,z);m.castShadow=cast;m.receiveShadow=true;parent.add(m);return m;
}
function road(x,z,w,d,rot=0){
 const r=new THREE.Mesh(new THREE.BoxGeometry(w,.12,d),mats.road);r.position.set(x,.01,z);r.rotation.y=rot;r.receiveShadow=true;city.add(r);
 const length=Math.max(w,d), horizontal=w>d;
 for(let p=-length/2+5;p<length/2-3;p+=12){
  const mark=new THREE.Mesh(new THREE.BoxGeometry(horizontal?5:.16,.025,horizontal?.16:5),mats.yellow);
  mark.position.set(x+(horizontal?p:0),.09,z+(horizontal?0:p));mark.rotation.y=rot;city.add(mark);
 }
}
function building(x,z,w,d,h,kind="apartment",name=""){
 const group=new THREE.Group();group.position.set(x,0,z);city.add(group);
 const palette=kind==="shop"?[0xc5a98a,0x9a9f96,0xb6a08c,0xd2c8b5]:[0xc3b9a6,0xaaa99d,0x858f8b,0xd1c7b5,0x9c9d91];
 const color=palette[Math.floor(Math.random()*palette.length)];
 const body=box(group,0,h/2,0,w,h,d,new THREE.MeshStandardMaterial({color,roughness:.92}));
 const roof=box(group,0,h+.12,0,w+.25,.25,d+.25,new THREE.MeshStandardMaterial({color:0x4a4e49}));
 const floors=Math.max(2,Math.floor(h/3.2));
 for(let f=0;f<floors;f++){
  for(let a=-w/2+1.3;a<w/2-0.7;a+=2.5){
   const win=box(group,a,1.3+f*3.1,d/2+.025,.95,1.45,.07,new THREE.MeshStandardMaterial({color:kind==="shop"?0x43545a:0x53616a,metalness:.25,roughness:.35}),false);
   const frame=box(group,a,1.3+f*3.1,d/2+.07,1.05,1.55,.05,new THREE.MeshStandardMaterial({color:0xd4cbb9}),false);
  }
 }
 if(kind==="shop"){
  const sign=box(group,0,2.8,d/2+.13,w*.82,.75,.14,new THREE.MeshStandardMaterial({color:0x9d2d20,emissive:0x270600}));
  const label=document.createElement("canvas");label.width=512;label.height=128;const c=label.getContext("2d");
  c.fillStyle="#a32b20";c.fillRect(0,0,512,128);c.fillStyle="#fff";c.font="bold 60px Arial";c.textAlign="center";c.fillText(name||"LOCAL SHOP",256,83);
  const tex=new THREE.CanvasTexture(label);const panel=new THREE.Mesh(new THREE.PlaneGeometry(w*.8,.62),new THREE.MeshBasicMaterial({map:tex}));
  panel.position.set(0,2.8,d/2+.22);group.add(panel);
  interactables.push({position:new THREE.Vector3(x,0,z),name:name||"Local shop",kind:"shop"});
 }
 return group;
}
function tree(x,z){
 const g=new THREE.Group();g.position.set(x,0,z);city.add(g);
 const trunk= new THREE.Mesh(new THREE.CylinderGeometry(.18,.28,2.2,7),new THREE.MeshStandardMaterial({color:0x66503b}));trunk.position.y=1.1;g.add(trunk);
 const crown=new THREE.Mesh(new THREE.IcosahedronGeometry(1.5,1),new THREE.MeshStandardMaterial({color:[0x426947,0x54794c,0x637d53][Math.floor(Math.random()*3)]}));
 crown.position.y=3; crown.scale.set(1,1.2,1);crown.castShadow=true;g.add(crown);
}
function fallbackCity(){
 // A walkable Sunnyside-inspired street grid, used if map data is offline.
 const roads=[-90,-45,0,45,90];
 roads.forEach(v=>{road(v,0,12,250);road(0,v,250,12)});
 for(let x=-110;x<=110;x+=22)for(let z=-110;z<=110;z+=22){
  if(Math.abs(x)%45<15&&Math.abs(z)%45<15)continue;
  const shop=Math.random()<.18;
  building(x+(Math.random()-.5)*4,z+(Math.random()-.5)*4,shop?13:15,shop?12:15,shop?5:8+Math.random()*19,shop?"shop":"apartment",shop?["MINI MARKET","TAKE AWAY","PHONE SHOP","GROCER","TUCK SHOP"][Math.floor(Math.random()*5)]:"");
 }
 for(let i=0;i<70;i++)tree((Math.random()-.5)*230,(Math.random()-.5)*230);
}
function llToLocal(lat,lon,originLat,originLon){
 const x=(lon-originLon)*111320*Math.cos(originLat*Math.PI/180);
 const z=-(lat-originLat)*111320;
 return [x,z];
}
async function loadOSM(){
 const south=-25.765,west=28.205,north=-25.750,east=28.230;
 const query=`[out:json][timeout:18];(way["highway"](${south},${west},${north},${east});way["building"](${south},${west},${north},${east});node["shop"](${south},${west},${north},${east});node["amenity"](${south},${west},${north},${east}););out body;>;out skel qt;`;
 const endpoints=["https://overpass-api.de/api/interpreter","https://overpass.kumi.systems/api/interpreter"];
 let data=null;
 for(const url of endpoints){
  try{const res=await fetch(url,{method:"POST",body:query,headers:{"Content-Type":"text/plain"},signal:AbortSignal.timeout(18000)});if(res.ok){data=await res.json();break;}}catch(e){}
 }
 if(!data)throw new Error("Map service unavailable");
 const nodes=new Map(data.elements.filter(e=>e.type==="node").map(n=>[n.id,n]));
 const originLat=-25.757,originLon=28.218;
 const coords=(id)=>{const n=nodes.get(id);return n?llToLocal(n.lat,n.lon,originLat,originLon):null};
 const ways=data.elements.filter(e=>e.type==="way");
 let roadCount=0,buildingCount=0;
 for(const w of ways){
  const pts=w.nodes.map(coords).filter(Boolean);if(pts.length<2)continue;
  if(w.tags?.highway){
   for(let i=1;i<pts.length;i++){
    const a=pts[i-1],b=pts[i],dx=b[0]-a[0],dz=b[1]-a[1],len=Math.hypot(dx,dz);
    if(len<1||len>300)continue;
    const width=["primary","secondary","tertiary"].includes(w.tags.highway)?10:6;
    const m=new THREE.Mesh(new THREE.BoxGeometry(width,.12,len),mats.road);
    m.position.set((a[0]+b[0])/2,.015,(a[1]+b[1])/2);m.rotation.y=Math.atan2(dx,dz);city.add(m);roadCount++;
   }
  }
  if(w.tags?.building){
   const center=pts.reduce((a,p)=>[a[0]+p[0]/pts.length,a[1]+p[1]/pts.length],[0,0]);
   if(Math.abs(center[0])>850||Math.abs(center[1])>850)continue;
   const xs=pts.map(p=>p[0]),zs=pts.map(p=>p[1]),ww=Math.max(5,Math.min(70,Math.max(...xs)-Math.min(...xs))),dd=Math.max(5,Math.min(70,Math.max(...zs)-Math.min(...zs)));
   building(center[0],center[1],ww,dd,6+Math.random()*18,"apartment");buildingCount++;
  }
 }
 data.elements.filter(e=>e.type==="node"&&(e.tags?.shop||e.tags?.amenity)).forEach(n=>{
  const [x,z]=llToLocal(n.lat,n.lon,originLat,originLon);if(Math.abs(x)>850||Math.abs(z)>850)return;
  const name=n.tags.name||n.tags.shop||n.tags.amenity||"Local place";
  interactables.push({position:new THREE.Vector3(x,0,z),name,kind:"place"});
  const marker=new THREE.Mesh(new THREE.CylinderGeometry(.55,.55,.18,12),new THREE.MeshStandardMaterial({color:0xf3b51b,emissive:0x4b2c00}));
  marker.position.set(x,.2,z);city.add(marker);
 });
 return {roadCount,buildingCount};
}

fallbackCity();
const fallbackObjects=[...city.children];
const fallbackPlaces=interactables.slice();
let mapMode="generated";
try{
 const result=await loadOSM();
 if(result.roadCount>8&&result.buildingCount>5){
  mapMode="OpenStreetMap";
  fallbackObjects.forEach(object=>city.remove(object));
  interactables.splice(0,fallbackPlaces.length);
  toast(`Real street data loaded: ${result.roadCount} road sections and ${result.buildingCount} buildings.`);
 } else {
  toast("Using generated Sunnyside streets with available map details.");
 }
}catch(e){toast("Offline map mode: Sunnyside-inspired streets are ready.");}
document.querySelector("#loading").style.opacity="0";
setTimeout(()=>document.querySelector("#loading").remove(),650);

// Player and starter vehicle
const player=new THREE.Group();scene.add(player);
const skin=new THREE.MeshStandardMaterial({color:0x754a32,roughness:.8});
const shirt=new THREE.MeshStandardMaterial({color:0x263b35,roughness:.9});
const pants=new THREE.MeshStandardMaterial({color:0x202a35});
const head=new THREE.Mesh(new THREE.SphereGeometry(.28,16,12),skin);head.position.y=1.62;player.add(head);
const torso=new THREE.Mesh(new THREE.CapsuleGeometry(.32,.62,5,10),shirt);torso.position.y=1.05;player.add(torso);
const legs=[];
for(const x of [-.16,.16]){const leg=new THREE.Mesh(new THREE.CapsuleGeometry(.13,.55,4,8),pants);leg.position.set(x,.42,0);player.add(leg);legs.push(leg);}
const arms=[];
for(const x of [-.42,.42]){const arm=new THREE.Mesh(new THREE.CapsuleGeometry(.11,.5,4,8),skin);arm.position.set(x,1.05,0);arm.rotation.z=x>0?-.12:.12;player.add(arm);arms.push(arm);}
player.position.set(0,0,18);

const car=new THREE.Group();scene.add(car);car.position.set(5,0,23);
const carPaint=new THREE.MeshStandardMaterial({color:0xb8c4c8,metalness:.65,roughness:.3});
box(car,0,.75,0,2.1,.75,4.2,carPaint);
box(car,0,1.35,-.15,1.7,.75,2.1,new THREE.MeshStandardMaterial({color:0x26383d,metalness:.25,roughness:.2}));
const wheels=[];
for(const x of [-1.08,1.08])for(const z of [-1.35,1.35]){
 const wheel=new THREE.Mesh(new THREE.CylinderGeometry(.42,.42,.25,16),new THREE.MeshStandardMaterial({color:0x151719,roughness:.9}));
 wheel.rotation.z=Math.PI/2;wheel.position.set(x,.43,z);car.add(wheel);wheels.push(wheel);
}
box(car,-.72,.9,2.12,.35,.18,.08,new THREE.MeshStandardMaterial({color:0xffe8a2,emissive:0x554000}));
box(car,.72,.9,2.12,.35,.18,.08,new THREE.MeshStandardMaterial({color:0xffe8a2,emissive:0x554000}));
const carCollider=new THREE.Vector3();

const keys={};let inCar=false,velocity=0,carSpeed=0,health=100,stamina=100,cash=2500,wanted=0,missionDone=false;
let yaw=0,cameraYaw=0,cameraPitch=.24,mouseDown=false,lastX=0,lastY=0;
const clock=new THREE.Clock();
const toastEl=document.querySelector("#toast");
let toastTimer;
function toast(msg){toastEl.textContent=msg;toastEl.classList.add("show");clearTimeout(toastTimer);toastTimer=setTimeout(()=>toastEl.classList.remove("show"),2600);}
function updateHUD(){
 document.querySelector("#cash").textContent="R "+cash.toLocaleString("en-ZA");
 document.querySelector("#health").textContent=health;
 document.querySelector("#stamina").textContent=Math.round(stamina);
 document.querySelector("#wanted").textContent=wanted;
}
function completeExplore(){if(!missionDone&&player.position.length()>45){missionDone=true;cash+=500;updateHUD();document.querySelector("#mission-title").textContent="First steps complete";document.querySelector("#mission-text").textContent="You earned R500. Find a shop or take the car for a drive.";document.querySelector("#progress").style.width="100%";toast("MISSION COMPLETE  +R500");}}
function interact(){
 let closest=null,dist=9;
 for(const item of interactables){const d=item.position.distanceTo(player.position);if(d<dist){dist=d;closest=item;}}
 if(closest){cash+=closest.kind==="shop"?50:25;updateHUD();toast(`${closest.name} • Welcome! +R${closest.kind==="shop"?50:25} discovery bonus`);}
 else toast("Nothing to interact with nearby. Explore the streets.");
}
function toggleCar(){
 if(!inCar&&player.position.distanceTo(car.position)<5){inCar=true;player.visible=false;toast("Vehicle entered • WASD to drive, SPACE to brake");}
 else if(inCar){inCar=false;player.visible=true;player.position.copy(car.position).add(new THREE.Vector3(2,0,0).applyAxisAngle(new THREE.Vector3(0,1,0),car.rotation.y));carSpeed=0;toast("You left the vehicle.");}
 else toast("Move closer to your car to enter it.");
}
window.addEventListener("keydown",e=>{keys[e.key.toLowerCase()]=true;if(e.key.toLowerCase()==="e")interact();if(e.key.toLowerCase()==="f")toggleCar();if(e.code==="Space")e.preventDefault();});
window.addEventListener("keyup",e=>keys[e.key.toLowerCase()]=false);
renderer.domElement.addEventListener("pointerdown",e=>{if(e.pointerType==="mouse"){mouseDown=true;lastX=e.clientX;lastY=e.clientY;}});
window.addEventListener("pointerup",()=>mouseDown=false);
window.addEventListener("pointermove",e=>{if(mouseDown){cameraYaw-=(e.clientX-lastX)*.005;cameraPitch=THREE.MathUtils.clamp(cameraPitch+(e.clientY-lastY)*.003,-.05,.75);lastX=e.clientX;lastY=e.clientY;}});
document.querySelector("#start").onclick=()=>document.querySelector("#help").style.display="none";
document.querySelector("#help-close").onclick=()=>document.querySelector("#help").style.display="none";
document.querySelectorAll("[data-key]").forEach(b=>{
 const k=b.dataset.key;b.addEventListener("pointerdown",e=>{e.preventDefault();keys[k]=true;});
 ["pointerup","pointerleave","pointercancel"].forEach(ev=>b.addEventListener(ev,()=>keys[k]=false));
});
document.querySelector('[data-action="vehicle"]').onclick=toggleCar;
document.querySelector('[data-action="interact"]').onclick=interact;
document.querySelector('[data-action="sprint"]').onpointerdown=()=>keys.shift=true;
document.querySelector('[data-action="sprint"]').onpointerup=()=>keys.shift=false;

function animate(){
 requestAnimationFrame(animate);
 const dt=Math.min(clock.getDelta(),.04);
 if(inCar){
  if(keys.w)carSpeed=Math.min(carSpeed+dt*12,27);
  else if(keys.s)carSpeed=Math.max(carSpeed-dt*18,-9);
  else carSpeed*=Math.pow(.93,dt*60);
  if(keys[" "])carSpeed*=Math.pow(.78,dt*60);
  if(Math.abs(carSpeed)>.3)car.rotation.y-=((keys.a?1:0)-(keys.d?1:0))*dt*1.35*Math.sign(carSpeed);
  car.position.x+=Math.sin(car.rotation.y)*carSpeed*dt;
  car.position.z+=Math.cos(car.rotation.y)*carSpeed*dt;
  car.position.x=THREE.MathUtils.clamp(car.position.x,-450,450);car.position.z=THREE.MathUtils.clamp(car.position.z,-450,450);
  wheels.forEach(w=>w.rotation.x+=carSpeed*dt*1.8);
  document.querySelector("#prompt").textContent="WASD drive · SPACE brake · F exit vehicle";
 }else{
  const moving=keys.w||keys.s||keys.a||keys.d;
  const sprint=keys.shift&&stamina>1;
  const speed=sprint?10:5.2;
  if(sprint&&moving)stamina=Math.max(0,stamina-dt*24);else stamina=Math.min(100,stamina+dt*13);
  const forward=new THREE.Vector3(Math.sin(cameraYaw),0,Math.cos(cameraYaw));
  const right=new THREE.Vector3(forward.z,0,-forward.x);
  const dir=new THREE.Vector3();
  if(keys.w)dir.add(forward);if(keys.s)dir.sub(forward);if(keys.d)dir.add(right);if(keys.a)dir.sub(right);
  if(dir.lengthSq()>0){dir.normalize();player.position.addScaledVector(dir,speed*dt);yaw=Math.atan2(dir.x,dir.z);player.rotation.y=THREE.MathUtils.lerp(player.rotation.y,yaw,Math.min(1,dt*10));}
  player.position.x=THREE.MathUtils.clamp(player.position.x,-470,470);player.position.z=THREE.MathUtils.clamp(player.position.z,-470,470);
  if(moving){const swing=Math.sin(performance.now()*.012)*(sprint?.75:.42);legs[0].rotation.x=swing;legs[1].rotation.x=-swing;arms[0].rotation.x=-swing*.7;arms[1].rotation.x=swing*.7;}
  document.querySelector("#prompt").textContent="WASD move · SHIFT sprint · E interact · F enter vehicle";
 }
 completeExplore();
 const target=inCar?car.position:player.position;
 const targetYaw=inCar?car.rotation.y:cameraYaw;
 const dist=inCar?12:8.5;
 const desired=new THREE.Vector3(target.x-Math.sin(targetYaw+cameraYaw*.25)*dist, target.y+(inCar?5:4.2)+cameraPitch*5, target.z-Math.cos(targetYaw+cameraYaw*.25)*dist);
 camera.position.lerp(desired,1-Math.pow(.001,dt));
 camera.lookAt(target.x,target.y+(inCar?1.2:1.15),target.z);
 updateHUD();
 renderer.render(scene,camera);
}
animate();
window.addEventListener("resize",()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);});
