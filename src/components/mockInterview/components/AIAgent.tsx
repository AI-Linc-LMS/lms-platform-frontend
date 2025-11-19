import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";

interface AIAgentProps {
  isSpeaking: boolean;
}

const AIAgent: React.FC<AIAgentProps> = ({ isSpeaking }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const headGroupRef = useRef<THREE.Group | null>(null);
  const leftEyeRef = useRef<THREE.Group | null>(null);
  const rightEyeRef = useRef<THREE.Group | null>(null);
  const leftEyelidRef = useRef<THREE.Mesh | null>(null);
  const rightEyelidRef = useRef<THREE.Mesh | null>(null);
  const mouthGroupRef = useRef<THREE.Group | null>(null);
  const upperLipRef = useRef<THREE.Mesh | null>(null);
  const lowerLipRef = useRef<THREE.Mesh | null>(null);
  const animationIdRef = useRef<number | null>(null);
  const lastBlinkTimeRef = useRef<number>(0);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!mountRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1a2e); // Dark but neutral background
    sceneRef.current = scene;

    // Camera setup
    const camera = new THREE.PerspectiveCamera(
      45,
      mountRef.current.clientWidth / mountRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 0, 200);

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });
    renderer.setSize(
      mountRef.current.clientWidth,
      mountRef.current.clientHeight
    );
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;
    mountRef.current.appendChild(renderer.domElement);

    // Main head group
    const headGroup = new THREE.Group();
    headGroupRef.current = headGroup;
    scene.add(headGroup);

    // Create human-like head (rounded, face-like shape)
    const headGeometry = new THREE.SphereGeometry(55, 64, 64);
    // Make it more oval/face-shaped
    headGeometry.scale(0.95, 1.1, 1);

    // Human skin-like material
    const headMaterial = new THREE.MeshStandardMaterial({
      color: 0xfdbcb4, // Skin tone
      metalness: 0.1,
      roughness: 0.8,
      emissive: 0x000000,
      emissiveIntensity: 0,
    });

    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.castShadow = true;
    head.receiveShadow = true;
    headGroup.add(head);

    // Add hair on top of head - more visible
    const hairGeometry = new THREE.SphereGeometry(
      60,
      32,
      32,
      0,
      Math.PI * 2,
      0,
      Math.PI / 2.2
    );
    const hairMaterial = new THREE.MeshStandardMaterial({
      color: 0x1a1a1a, // Dark black hair - more visible
      metalness: 0.1,
      roughness: 0.9,
    });
    const hair = new THREE.Mesh(hairGeometry, hairMaterial);
    hair.position.y = 38;
    hair.rotation.x = Math.PI;
    hair.position.z = -5; // Slightly forward
    headGroup.add(hair);

    // Add left ear - more visible
    const earGeometry = new THREE.SphereGeometry(10, 20, 20);
    const earMaterial = new THREE.MeshStandardMaterial({
      color: 0xfdbcb4, // Match skin color
      metalness: 0.1,
      roughness: 0.8,
    });
    const leftEar = new THREE.Mesh(earGeometry, earMaterial);
    leftEar.position.set(-54, 5, 15);
    leftEar.scale.set(0.5, 1, 0.4);
    leftEar.rotation.y = -Math.PI / 2;
    headGroup.add(leftEar);

    // Add right ear - more visible
    const rightEar = new THREE.Mesh(earGeometry, earMaterial);
    rightEar.position.set(54, 5, 15);
    rightEar.scale.set(0.5, 1, 0.4);
    rightEar.rotation.y = Math.PI / 2;
    headGroup.add(rightEar);

    // Create left eye group
    const leftEyeGroup = new THREE.Group();
    leftEyeGroup.position.set(-22, 18, 48);
    leftEyeRef.current = leftEyeGroup;
    headGroup.add(leftEyeGroup);

    // Left eye socket (skin-colored) - larger to accommodate bigger eyes
    const eyeSocketGeometry = new THREE.SphereGeometry(12, 32, 32);
    const eyeSocketMaterial = new THREE.MeshStandardMaterial({
      color: 0xfdbcb4, // Match skin color
      metalness: 0.1,
      roughness: 0.8,
    });
    const leftEyeSocket = new THREE.Mesh(eyeSocketGeometry, eyeSocketMaterial);
    leftEyeSocket.scale.set(1, 1, 0.3);
    leftEyeGroup.add(leftEyeSocket);

    // Left eye white (sclera) - much more prominent
    const eyeGeometry = new THREE.SphereGeometry(10, 32, 32);
    const eyeWhiteMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      metalness: 0.1,
      roughness: 0.9,
    });
    const leftEyeWhite = new THREE.Mesh(eyeGeometry, eyeWhiteMaterial);
    leftEyeWhite.position.z = 4;
    leftEyeWhite.scale.set(1.1, 1.2, 0.8);
    leftEyeGroup.add(leftEyeWhite);

    // Left iris (colored part) - much more visible
    const irisGeometry = new THREE.SphereGeometry(4.5, 32, 32);
    const irisMaterial = new THREE.MeshStandardMaterial({
      color: 0x4a5568, // Brown/dark gray iris
      metalness: 0.2,
      roughness: 0.7,
    });
    const leftIris = new THREE.Mesh(irisGeometry, irisMaterial);
    leftIris.position.z = 5.5;
    leftEyeGroup.add(leftIris);

    // Left pupil (black) - much more visible
    const pupilGeometry = new THREE.SphereGeometry(2.2, 16, 16);
    const pupilMaterial = new THREE.MeshStandardMaterial({
      color: 0x000000,
    });
    const leftPupil = new THREE.Mesh(pupilGeometry, pupilMaterial);
    leftPupil.position.z = 6.5;
    leftEyeGroup.add(leftPupil);

    // Left upper eyelid (skin-colored) - larger to match bigger eyes
    const eyelidGeometry = new THREE.SphereGeometry(
      12,
      32,
      32,
      0,
      Math.PI * 2,
      0,
      Math.PI / 2
    );
    const eyelidMaterial = new THREE.MeshStandardMaterial({
      color: 0xfdbcb4, // Match skin color
      metalness: 0.1,
      roughness: 0.8,
    });
    const leftEyelid = new THREE.Mesh(eyelidGeometry, eyelidMaterial);
    leftEyelid.position.set(0, 2, 0);
    leftEyelid.rotation.x = Math.PI;
    leftEyelidRef.current = leftEyelid;
    leftEyeGroup.add(leftEyelid);

    // Create right eye group
    const rightEyeGroup = new THREE.Group();
    rightEyeGroup.position.set(22, 18, 48);
    rightEyeRef.current = rightEyeGroup;
    headGroup.add(rightEyeGroup);

    // Right eye socket
    const rightEyeSocket = new THREE.Mesh(eyeSocketGeometry, eyeSocketMaterial);
    rightEyeSocket.scale.set(1, 1, 0.3);
    rightEyeGroup.add(rightEyeSocket);

    // Right eye white (sclera) - much more prominent
    const rightEyeWhite = new THREE.Mesh(eyeGeometry, eyeWhiteMaterial);
    rightEyeWhite.position.z = 4;
    rightEyeWhite.scale.set(1.1, 1.2, 0.8);
    rightEyeGroup.add(rightEyeWhite);

    // Right iris - much more visible
    const rightIris = new THREE.Mesh(irisGeometry, irisMaterial);
    rightIris.position.z = 5.5;
    rightEyeGroup.add(rightIris);

    // Right pupil - much more visible
    const rightPupil = new THREE.Mesh(pupilGeometry, pupilMaterial);
    rightPupil.position.z = 6.5;
    rightEyeGroup.add(rightPupil);

    // Right upper eyelid
    const rightEyelid = new THREE.Mesh(eyelidGeometry, eyelidMaterial);
    rightEyelid.position.set(0, 2, 0);
    rightEyelid.rotation.x = Math.PI;
    rightEyelidRef.current = rightEyelid;
    rightEyeGroup.add(rightEyelid);

    // Add eyebrows
    const eyebrowGeometry = new THREE.BoxGeometry(14, 2, 1);
    const eyebrowMaterial = new THREE.MeshStandardMaterial({
      color: 0x2d3748, // Dark brown/black for eyebrows
      metalness: 0.1,
      roughness: 0.9,
    });

    const leftEyebrow = new THREE.Mesh(eyebrowGeometry, eyebrowMaterial);
    leftEyebrow.position.set(-22, 28, 47);
    leftEyebrow.rotation.z = -0.1;
    headGroup.add(leftEyebrow);

    const rightEyebrow = new THREE.Mesh(eyebrowGeometry, eyebrowMaterial);
    rightEyebrow.position.set(22, 28, 47);
    rightEyebrow.rotation.z = 0.1;
    headGroup.add(rightEyebrow);

    // Create mouth group
    const mouthGroup = new THREE.Group();
    mouthGroup.position.set(0, -12, 48);
    mouthGroupRef.current = mouthGroup;
    headGroup.add(mouthGroup);

    // Upper lip (natural pink/red) - much more prominent
    const upperLipGeometry = new THREE.TorusGeometry(11, 2.5, 16, 32, Math.PI);
    const lipMaterial = new THREE.MeshStandardMaterial({
      color: 0xd9777f, // Natural lip color - brighter
      metalness: 0.2,
      roughness: 0.7,
      emissive: 0x000000,
      emissiveIntensity: 0,
    });
    const upperLip = new THREE.Mesh(upperLipGeometry, lipMaterial);
    upperLip.rotation.x = Math.PI;
    upperLip.position.y = 2;
    upperLip.position.z = 2;
    upperLipRef.current = upperLip;
    mouthGroup.add(upperLip);

    // Lower lip - much more prominent
    const lowerLipGeometry = new THREE.TorusGeometry(11, 2.5, 16, 32, Math.PI);
    const lowerLip = new THREE.Mesh(lowerLipGeometry, lipMaterial);
    lowerLip.position.y = -2.5;
    lowerLip.position.z = 2;
    lowerLipRef.current = lowerLip;
    mouthGroup.add(lowerLip);

    // Mouth interior (dark opening)
    const mouthInteriorGeometry = new THREE.CircleGeometry(7, 32);
    const mouthInteriorMaterial = new THREE.MeshStandardMaterial({
      color: 0x1a1a1a, // Dark mouth interior
      emissive: 0xff6b6b, // Subtle glow when speaking
      emissiveIntensity: 0,
      metalness: 0.1,
      roughness: 0.9,
    });
    const mouthInterior = new THREE.Mesh(
      mouthInteriorGeometry,
      mouthInteriorMaterial
    );
    mouthInterior.position.z = -1;
    mouthGroup.add(mouthInterior);

    // Add nose (human-like) - much more prominent
    const noseGeometry = new THREE.ConeGeometry(3.5, 9, 12);
    const noseMaterial = new THREE.MeshStandardMaterial({
      color: 0xfdbcb4, // Match skin color
      metalness: 0.1,
      roughness: 0.8,
    });
    const nose = new THREE.Mesh(noseGeometry, noseMaterial);
    nose.position.set(0, 5, 54);
    nose.rotation.x = Math.PI / 2;
    headGroup.add(nose);

    // Add nostrils for more realism - more visible
    const nostrilGeometry = new THREE.SphereGeometry(1.5, 16, 16);
    const nostrilMaterial = new THREE.MeshStandardMaterial({
      color: 0x1a1a1a,
      metalness: 0.1,
      roughness: 0.9,
    });
    const leftNostril = new THREE.Mesh(nostrilGeometry, nostrilMaterial);
    leftNostril.position.set(-2, 1.5, 54);
    headGroup.add(leftNostril);

    const rightNostril = new THREE.Mesh(nostrilGeometry, nostrilMaterial);
    rightNostril.position.set(2, 1.5, 54);
    headGroup.add(rightNostril);

    // Create subtle particle system (reduced for human-like appearance)
    const particlesGeometry = new THREE.BufferGeometry();
    const particlesCount = 100; // Reduced count
    const posArray = new Float32Array(particlesCount * 3);
    const colorArray = new Float32Array(particlesCount * 3);

    for (let i = 0; i < particlesCount * 3; i += 3) {
      const radius = 100 + Math.random() * 50;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);

      posArray[i] = radius * Math.sin(phi) * Math.cos(theta);
      posArray[i + 1] = radius * Math.sin(phi) * Math.sin(theta);
      posArray[i + 2] = radius * Math.cos(phi);

      const color = new THREE.Color();
      color.setHSL(0.1 + Math.random() * 0.05, 0.3, 0.6); // Warmer, more subtle colors
      colorArray[i] = color.r;
      colorArray[i + 1] = color.g;
      colorArray[i + 2] = color.b;
    }

    particlesGeometry.setAttribute(
      "position",
      new THREE.BufferAttribute(posArray, 3)
    );
    particlesGeometry.setAttribute(
      "color",
      new THREE.BufferAttribute(colorArray, 3)
    );

    const particlesMaterial = new THREE.PointsMaterial({
      size: 1.0,
      vertexColors: true,
      transparent: true,
      opacity: 0.3, // More subtle
      blending: THREE.AdditiveBlending,
    });

    const particlesMesh = new THREE.Points(
      particlesGeometry,
      particlesMaterial
    );
    scene.add(particlesMesh);

    // Lighting setup (natural lighting for human face)
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    // Main light (key light)
    const mainLight = new THREE.DirectionalLight(0xffffff, 1.0);
    mainLight.position.set(50, 80, 50);
    mainLight.castShadow = true;
    scene.add(mainLight);

    // Fill light (softer, opposite side)
    const fillLight = new THREE.DirectionalLight(0xffffff, 0.4);
    fillLight.position.set(-50, 30, -50);
    scene.add(fillLight);

    // Rim light (subtle backlight)
    const rimLight = new THREE.DirectionalLight(0xffffff, 0.3);
    rimLight.position.set(0, 0, -100);
    scene.add(rimLight);

    setIsLoaded(true);

    // Animation loop
    const animate = () => {
      animationIdRef.current = requestAnimationFrame(animate);

      const time = Date.now() * 0.001;

      // Animate head
      if (headGroupRef.current) {
        // Gentle floating
        headGroupRef.current.position.y = Math.sin(time * 0.4) * 2;
        headGroupRef.current.rotation.y = Math.sin(time * 0.2) * 0.08;
        headGroupRef.current.rotation.x = Math.sin(time * 0.15) * 0.03;

        // Subtle breathing
        const breathScale = 1 + Math.sin(time * 0.6) * 0.01;
        headGroupRef.current.scale.set(breathScale, breathScale, breathScale);
      }

      // Natural blinking animation (every 2-5 seconds)
      const timeSinceLastBlink = time - lastBlinkTimeRef.current;
      const blinkInterval = 2 + (Math.sin(time * 0.1) * 0.5 + 0.5) * 3; // Varies between 2-5 seconds
      const shouldBlink = timeSinceLastBlink > blinkInterval;

      if (shouldBlink && leftEyelidRef.current && rightEyelidRef.current) {
        lastBlinkTimeRef.current = time;
      }

      // Animate eyes
      if (
        leftEyeRef.current &&
        rightEyeRef.current &&
        leftEyelidRef.current &&
        rightEyelidRef.current
      ) {
        // Blinking animation
        const blinkDuration = 0.15;
        const timeSinceBlink = time - lastBlinkTimeRef.current;
        const isBlinking = timeSinceBlink < blinkDuration;

        let blinkProgress = 0;
        if (isBlinking) {
          blinkProgress = Math.sin((timeSinceBlink / blinkDuration) * Math.PI);
        }

        // Animate eyelids closing/opening
        const eyelidRotation = (blinkProgress * Math.PI) / 2;
        leftEyelidRef.current.rotation.z = -eyelidRotation;
        rightEyelidRef.current.rotation.z = eyelidRotation;

        // Eye movement (looking around) - only when not blinking
        if (!isBlinking) {
          const lookX = Math.sin(time * 0.3) * 1.5;
          const lookY = Math.sin(time * 0.2) * 1.2;

          // Move iris and pupil together
          leftEyeRef.current.children.forEach((child, index) => {
            if (index === 2) {
              // Iris
              (child as THREE.Mesh).position.x = lookX;
              (child as THREE.Mesh).position.y = lookY;
            } else if (index === 3) {
              // Pupil
              (child as THREE.Mesh).position.x = lookX;
              (child as THREE.Mesh).position.y = lookY;
            }
          });

          rightEyeRef.current.children.forEach((child, index) => {
            if (index === 2) {
              // Iris
              (child as THREE.Mesh).position.x = lookX;
              (child as THREE.Mesh).position.y = lookY;
            } else if (index === 3) {
              // Pupil
              (child as THREE.Mesh).position.x = lookX;
              (child as THREE.Mesh).position.y = lookY;
            }
          });
        }
      }

      // Animate mouth and lips
      if (mouthGroupRef.current && upperLipRef.current && lowerLipRef.current) {
        if (isSpeaking) {
          // Lip movement when speaking
          const lipMovement = Math.sin(time * 18) * 0.5 + 0.5;
          const openAmount = lipMovement * 0.6;

          // Move upper lip up
          upperLipRef.current.position.y = 2 - openAmount * 2.5;
          // Move lower lip down
          lowerLipRef.current.position.y = -2.5 - openAmount * 2.5;

          // Slight scale change for more natural movement
          const lipScale = 1 + openAmount * 0.1;
          upperLipRef.current.scale.set(lipScale, lipScale, 1);
          lowerLipRef.current.scale.set(lipScale, lipScale, 1);

          // Glow mouth interior when speaking
          const mouthInterior = mouthGroupRef.current.children.find(
            (child) =>
              child instanceof THREE.Mesh &&
              child.geometry.type === "CircleGeometry"
          ) as THREE.Mesh;
          if (mouthInterior && mouthInterior.material) {
            const mat = mouthInterior.material as THREE.MeshStandardMaterial;
            mat.emissiveIntensity = 0.8 + Math.sin(time * 18) * 0.3;
          }
        } else {
          // Return lips to neutral position smoothly
          upperLipRef.current.position.y = THREE.MathUtils.lerp(
            upperLipRef.current.position.y,
            2,
            0.1
          );
          lowerLipRef.current.position.y = THREE.MathUtils.lerp(
            lowerLipRef.current.position.y,
            -2.5,
            0.1
          );
          upperLipRef.current.scale.lerp(new THREE.Vector3(1, 1, 1), 0.1);
          lowerLipRef.current.scale.lerp(new THREE.Vector3(1, 1, 1), 0.1);

          const mouthInterior = mouthGroupRef.current.children.find(
            (child) =>
              child instanceof THREE.Mesh &&
              child.geometry.type === "CircleGeometry"
          ) as THREE.Mesh;
          if (mouthInterior && mouthInterior.material) {
            const mat = mouthInterior.material as THREE.MeshStandardMaterial;
            mat.emissiveIntensity *= 0.95;
          }
        }
      }

      // Animate particles (subtle movement)
      if (particlesMesh) {
        particlesMesh.rotation.y = time * 0.02;
        particlesMesh.rotation.x = time * 0.01;

        if (isSpeaking) {
          (particlesMesh.material as THREE.PointsMaterial).size =
            1.0 + Math.sin(time * 6) * 0.2;
        } else {
          (particlesMesh.material as THREE.PointsMaterial).size = 1.0;
        }
      }

      renderer.render(scene, camera);
    };

    animate();

    // Handle resize
    const handleResize = () => {
      if (!mountRef.current || !renderer || !camera) return;

      const width = mountRef.current.clientWidth;
      const height = mountRef.current.clientHeight;

      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };

    window.addEventListener("resize", handleResize);

    // Cleanup
    return () => {
      window.removeEventListener("resize", handleResize);
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  // Update speaking state
  useEffect(() => {
    // Speaking animation is handled in the main animation loop
  }, [isSpeaking]);

  return (
    <div className="relative w-full h-full bg-gradient-to-b from-slate-900 via-indigo-950 to-slate-900 overflow-hidden">
      {/* 3D Canvas Container */}
      <div ref={mountRef} className="w-full h-full" />

      {/* Loading State */}
      {!isLoaded && (
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900 to-indigo-950 flex items-center justify-center">
          <div className="text-center">
            <div className="relative w-16 h-16 mx-auto mb-4">
              <div className="absolute inset-0 border-4 border-indigo-500/30 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-transparent border-t-indigo-500 rounded-full animate-spin"></div>
            </div>
            <p className="text-indigo-300 text-sm font-medium">
              Initializing AI Agent...
            </p>
          </div>
        </div>
      )}

      {/* Agent Controls */}

      {/* Speaking Indicator */}
      {isSpeaking && (
        <div className="absolute top-4 left-4 z-10 animate-fade-in">
          <div className="flex items-center space-x-2 bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-2 rounded-full shadow-lg border border-indigo-400/50">
            <div className="relative">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
              <div className="absolute inset-0 w-2 h-2 bg-white rounded-full animate-ping opacity-75"></div>
            </div>
            <span className="text-white text-xs font-semibold tracking-wide">
              AI SPEAKING
            </span>
          </div>
        </div>
      )}

      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-transparent via-transparent to-indigo-950/20"></div>
    </div>
  );
};

export default AIAgent;
