import * as THREE from "three";
import { ARButton } from "three/addons/webxr/ARButton.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

let camera, scene, renderer, controller, controls, reticle;
let obj = new THREE.Object3D();
let isModel = false;

let hitTestSource = null;
let hitTestSourceRequested = false;

const init = () => {
	const container = document.createElement("div");
	document.body.append(container);

	scene = new THREE.Scene();

	camera = new THREE.PerspectiveCamera(
		70,
		window.innerWidth / window.innerHeight,
		0.01,
		40
	);

	renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
	renderer.setPixelRatio(window.devicePixelRatio);
	renderer.setSize(window.innerWidth, window.innerHeight);
	renderer.useLegacyLights = false;
	renderer.xr.enabled = true;
	document.body.append(renderer.domElement);

	const light = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1);
	light.position.set(0.5, 1, 0.25);
	scene.add(light);

	addReticleToScene();

	document.body.appendChild(
		ARButton.createButton(renderer, { requiredFeatures: ["hit-test"] })
	);

	// function adds an object to the scene after user's click

	function onSelect() {
		if (!isModel) loadModel("chair");
		isModel = true;
	}

	controller = renderer.xr.getController(0);
	controller.addEventListener("select", onSelect);
	scene.add(controller);

	window.addEventListener("resize", onWindowResize, false);

	let touchDown, touchX, touchY, deltaX, deltaY;

	renderer.domElement.addEventListener(
		"touchstart",
		(e) => {
			e.preventDefault();
			touchDown = true;
			touchX = e.touches[0].pageX;
			touchY = e.touches[0].pageY;
		},
		false
	);

	renderer.domElement.addEventListener(
		"touchend",
		(e) => {
			e.preventDefault();
			touchDown = false;
		},
		false
	);

	renderer.domElement.addEventListener(
		"touchmove",
		(e) => {
			e.preventDefault();

			if (!touchDown) {
				return;
			}

			deltaX = e.touches[0].pageX - touchX;
			deltaY = e.touches[0].pageY - touchY;
			touchX = e.touches[0].pageX;
			touchY = e.touches[0].pageY;

			rotateObject();
		},
		false
	);
};

function rotateObject() {
	if (obj && reticle.visible) {
		obj.rotation.y += deltaX / 100;
	}
}

function addReticleToScene() {
	const geometry = new THREE.RingGeometry(0.15, 0.2, 32).rotateX(-Math.PI / 2);
	const material = new THREE.MeshBasicMaterial();

	reticle = new THREE.Mesh(geometry, material);

	reticle.matrixAutoUpdate = false;
	reticle.visible = false;
	scene.add(reticle);
}

function onProgress(xhr) {
	console.log((xhr.loaded / xhr.total) * 100 + "% loaded");
}

function onError(xhr) {
	console.error(xhr);
}

const loadModel = (model) => {
	let loader = new GLTFLoader().setPath("models/");
	loader.load(
		model + ".glb",
		(glb) => {
			obj = glb.scene;
			// obj.scale.set(
			// 	0.5 * glb.scene.scale.x,
			// 	0.5 * glb.scene.scale.y,
			// 	0.5 * glb.scene.scale.z
			// );

			obj.position.set(0, 0, -0.3).applyMatrix4(controller.matrixWorld);
			obj.quaternion.setFromRotationMatrix(controller.matrixWorld);
			scene.add(obj);
		},
		onProgress,
		onError
	);
};

const onWindowResize = () => {
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();

	renderer.setSize(window.innerWidth, window.innerHeight);
};

const animate = () => {
	renderer.setAnimationLoop(render);
};

const render = (timestamp, frame) => {
	if (frame) {
		const referenceSpace = renderer.xr.getReferenceSpace();
		const session = renderer.xr.getSession();

		if (hitTestSourceRequested === false) {
			session.requestReferenceSpace("viewer").then(function (referenceSpace) {
				session
					.requestHitTestSource({ space: referenceSpace })
					.then(function (source) {
						hitTestSource = source;
					});
			});

			session.addEventListener("end", function () {
				hitTestSourceRequested = false;
				hitTestSource = null;
			});

			hitTestSourceRequested = true;
		}

		if (hitTestSource) {
			const hitTestResults = frame.getHitTestResults(hitTestSource);

			if (hitTestResults.length) {
				const hit = hitTestResults[0];

				reticle.visible = true;
				reticle.matrix.fromArray(hit.getPose(referenceSpace).transform.matrix);
			} else {
				reticle.visible = false;
			}
		}
	}

	renderer.render(scene, camera);
};

init();
animate();
