import * as THREE from "three";
// import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import gsap from 'gsap';

import fragment from "./shader/fragment.glsl";
import vertex from "./shader/vertex.glsl";

import * as dat from 'dat.gui';

import mask from '../img/mask.png';
import t1 from '../img/guy.png';
import t2 from '../img/creep.png';

export default class Sketch {
  constructor(options) {
    this.scene = new THREE.Scene();

    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.point = new THREE.Vector2();

    this.container = options.dom;
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.renderer = new THREE.WebGLRenderer();
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(this.width, this.height);
    this.renderer.setClearColor(0x111111, 1); 
    this.renderer.outputEncoding = THREE.sRGBEncoding;

    this.container.appendChild(this.renderer.domElement);

    this.camera = new THREE.PerspectiveCamera(
      70,
      window.innerWidth / window.innerHeight,
      0.1,
      3000
    );

    // var frustumSize = 10;
    // var aspect = window.innerWidth / window.innerHeight;
    // this.camera = new THREE.OrthographicCamera( frustumSize * aspect / - 2, frustumSize * aspect / 2, frustumSize / 2, frustumSize / - 2, -1000, 1000 );
    this.camera.position.set(0, 0, 1000);
    // this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.time = 0;
    this.move = 0;
    this.mask = new THREE.TextureLoader().load(mask);
    this.textures = [
      new THREE.TextureLoader().load(t1),
      new THREE.TextureLoader().load(t2),
    ]
    this.isPlaying = true;
    
    this.addObjects();
    this.resize();
    this.render();
    this.setupResize();
    this.mouseEffects();
    this.settings();
  }

  settings() {
    let that = this;
    this.settings = {
      progress: false,
    };
    this.gui = new dat.GUI();
    this.gui.add(this.settings, "progress").name('Poof').listen();
  }

  setupResize() {
    window.addEventListener("resize", this.resize.bind(this));
  }

  resize() {
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.renderer.setSize(this.width, this.height);
    this.camera.aspect = this.width / this.height;
    this.camera.updateProjectionMatrix();
  }

  mouseEffects() {
    this.test = new THREE.Mesh(
      new THREE.PlaneBufferGeometry(2000, 2000),
      new THREE.MeshNormalMaterial()
    )


    window.addEventListener('mousewheel', e => {
      this.move += e.wheelDeltaY/4000;
    }, false);

    window.addEventListener('mousedown', e => {
      gsap.to(this.material.uniforms.mousePressed, {
        duration: 1,
        value: 1,
        ease: 'elastic.out(1, 0.3)'
      })
    }, false)

    window.addEventListener('mouseup', e => {
      gsap.to(this.material.uniforms.mousePressed, {
        duration: 1,
        value: 0,
        ease: 'elastic.out(1, 0.3)'
      })
    }, false)

    window.addEventListener('mousemove', e => {
      this.mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
      this.mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;

    	// update the picking ray with the camera and mouse position
    	this.raycaster.setFromCamera( this.mouse, this.camera );

    	// calculate objects intersecting the picking ray
      const intersects = this.raycaster.intersectObjects( [this.test] );
      
      this.point.x = intersects[0].point.x
      this.point.y = intersects[0].point.y
    }, false);
  }

  addObjects() {
    let that = this;
    this.material = new THREE.ShaderMaterial({
      uniforms: {
        mask: { value: this.mask },
        move: { value: 0 },
        mouse: { value: 0 },
        mousePressed: { value: 0 },
        transition: { value: 0 },
        time: { value: 0 },
        t1: { value: this.textures[0] },
        t2: { value: this.textures[1] },
      },
      // wireframe: true,
      transparent: true,
      depthTest: false,
      depthWrite: false,
      vertexShader: vertex,
      fragmentShader: fragment,
      side: THREE.DoubleSide
    });

    // this.geometry = new THREE.PlaneBufferGeometry(1000, 1000, 10, 10);
    this.geometry = new THREE.BufferGeometry();

    let number = 512 * 512;

    this.positions = new THREE.BufferAttribute(new Float32Array(number * 3), 3);
    this.coordinates = new THREE.BufferAttribute(new Float32Array(number*3), 3);
    this.speed = new THREE.BufferAttribute(new Float32Array(number), 1);
    this.offset = new THREE.BufferAttribute(new Float32Array(number), 1);
    this.direction = new THREE.BufferAttribute(new Float32Array(number), 1);
    this.press = new THREE.BufferAttribute(new Float32Array(number), 1);

    function rand(a, b) {
      return a + (b-a)*Math.random();
    }

    let index = 0;
    for(let i = 0; i < 512; i++) {
      let posX = i - 256;
      for(let j = 0; j < 512; j++) {
        this.positions.setXYZ(index, posX*2, (j-256)*2, 0);
        this.coordinates.setXYZ(index, i, j, 0);
        this.speed.setX(index, rand(0.4, 1.0));
        this.offset.setX(index, rand(-1000, 1000));
        this.direction.setX(index, Math.random() > 0.5 ? 1 : -1);
        this.press.setX(index, rand(0.4, 1.0));
        index++
      }
    }

    this.geometry.setAttribute('aCoordinates', this.coordinates);
    this.geometry.setAttribute('aDirection', this.direction);
    this.geometry.setAttribute('aOffset', this.offset);
    this.geometry.setAttribute('position', this.positions);
    this.geometry.setAttribute('aPress', this.press);
    this.geometry.setAttribute('aSpeed', this.speed);

    this.mesh = new THREE.Points(this.geometry, this.material);
    this.scene.add(this.mesh);
  }

  stop() {
    this.isPlaying = false;
  }

  play() {
    if(!this.isPlaying){
      this.render()
      this.isPlaying = true;
    }
  }

  render() {
    if (!this.isPlaying) return;
    this.time++;

    let prev = (Math.floor(this.move) + 1 + 40)%2;
    let next = (Math.floor(this.move) + 40)%2;

    this.material.uniforms.transition.value = this.settings.progress;
    this.material.uniforms.t1.value = this.textures[prev];
    this.material.uniforms.t2.value = this.textures[next];
    this.material.uniforms.time.value = this.time;
    this.material.uniforms.move.value = this.move;
    this.material.uniforms.mouse.value = this.point;
    requestAnimationFrame(this.render.bind(this));
    this.renderer.render(this.scene, this.camera);
  }
}

new Sketch({
  dom: document.getElementById("container")
});
