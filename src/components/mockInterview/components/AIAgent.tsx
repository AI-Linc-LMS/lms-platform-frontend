import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { Volume2, VolumeX } from "lucide-react";

interface AIAgentProps {
  isSpeaking: boolean;
}

const AIAgent: React.FC<AIAgentProps> = ({ isSpeaking }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const faceRef = useRef<THREE.Mesh | null>(null);
  const animationIdRef = useRef<number | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!mountRef.current) return;

    // Scene setup - BRIGHTER for visibility
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1a2e); // Lighter dark blue
    sceneRef.current = scene;

    // Camera setup
    const camera = new THREE.PerspectiveCamera(
      45,
      mountRef.current.clientWidth / mountRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 0, 250);

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(
      mountRef.current.clientWidth,
      mountRef.current.clientHeight
    );
    renderer.setPixelRatio(window.devicePixelRatio);
    rendererRef.current = renderer;
    mountRef.current.appendChild(renderer.domElement);

    // Create realistic 3D face head (oval shaped)
    const faceGeometry = new THREE.SphereGeometry(50, 64, 64);
    faceGeometry.scale(0.9, 1.1, 1); // Make it more oval/face-shaped

    // Create morph target for mouth movement (speaking)
    const positionAttribute = faceGeometry.attributes.position;
    const mouthMorphPositions = new Float32Array(positionAttribute.count * 3);

    for (let i = 0; i < positionAttribute.count; i++) {
      const x = positionAttribute.getX(i);
      const y = positionAttribute.getY(i);
      const z = positionAttribute.getZ(i);

      // Deform vertices in mouth area (lower front part of sphere)
      if (y < -10 && z > 30 && Math.abs(x) < 20) {
        mouthMorphPositions[i * 3] = x * 1.1;
        mouthMorphPositions[i * 3 + 1] = y - 5;
        mouthMorphPositions[i * 3 + 2] = z;
      } else {
        mouthMorphPositions[i * 3] = x;
        mouthMorphPositions[i * 3 + 1] = y;
        mouthMorphPositions[i * 3 + 2] = z;
      }
    }

    faceGeometry.morphAttributes.position = [
      new THREE.Float32BufferAttribute(mouthMorphPositions, 3),
    ];

    // Realistic skin material - BRIGHTER with gradient
    const faceMaterial = new THREE.MeshPhongMaterial({
      color: 0x8b8cf1, // Lighter indigo/blue (skin tone)
      emissive: 0x3f3f8f, // Slight glow
      emissiveIntensity: 0.15,
      specular: 0xaaaaaa,
      shininess: 60,
      flatShading: false,
    });

    const face = new THREE.Mesh(faceGeometry, faceMaterial);
    face.position.set(0, 0, 0);
    face.rotation.y = Math.PI;
    faceRef.current = face;
    scene.add(face);

    // Add eyes (more realistic)
    const eyeWhiteGeometry = new THREE.SphereGeometry(6, 32, 32);
    const eyeWhiteMaterial = new THREE.MeshPhongMaterial({
      color: 0xffffff,
      emissive: 0xccffff,
      emissiveIntensity: 0.3,
      shininess: 100,
    });

    const leftEyeWhite = new THREE.Mesh(eyeWhiteGeometry, eyeWhiteMaterial);
    leftEyeWhite.position.set(-18, 12, 42);
    leftEyeWhite.scale.set(0.8, 1, 0.6);
    face.add(leftEyeWhite);

    const rightEyeWhite = new THREE.Mesh(eyeWhiteGeometry, eyeWhiteMaterial);
    rightEyeWhite.position.set(18, 12, 42);
    rightEyeWhite.scale.set(0.8, 1, 0.6);
    face.add(rightEyeWhite);

    // Add irises (colored part)
    const irisGeometry = new THREE.SphereGeometry(3.5, 32, 32);
    const irisMaterial = new THREE.MeshPhongMaterial({
      color: 0x00ccff,
      emissive: 0x0099cc,
      emissiveIntensity: 0.6,
      shininess: 80,
    });

    const leftIris = new THREE.Mesh(irisGeometry, irisMaterial);
    leftIris.position.set(0, 0, 6);
    leftEyeWhite.add(leftIris);

    const rightIris = new THREE.Mesh(irisGeometry, irisMaterial);
    rightIris.position.set(0, 0, 6);
    rightEyeWhite.add(rightIris);

    // Add pupils
    const pupilGeometry = new THREE.SphereGeometry(1.8, 32, 32);
    const pupilMaterial = new THREE.MeshBasicMaterial({
      color: 0x000000,
    });

    const leftPupil = new THREE.Mesh(pupilGeometry, pupilMaterial);
    leftPupil.position.set(0, 0, 3.5);
    leftIris.add(leftPupil);

    const rightPupil = new THREE.Mesh(pupilGeometry, pupilMaterial);
    rightPupil.position.set(0, 0, 3.5);
    rightIris.add(rightPupil);

    // Add eyebrows
    const eyebrowGeometry = new THREE.BoxGeometry(12, 2, 1);
    const eyebrowMaterial = new THREE.MeshPhongMaterial({
      color: 0x4444ff,
      emissive: 0x2222aa,
      emissiveIntensity: 0.3,
    });

    const leftEyebrow = new THREE.Mesh(eyebrowGeometry, eyebrowMaterial);
    leftEyebrow.position.set(-18, 25, 45);
    leftEyebrow.rotation.z = -0.2;
    face.add(leftEyebrow);

    const rightEyebrow = new THREE.Mesh(eyebrowGeometry, eyebrowMaterial);
    rightEyebrow.position.set(18, 25, 45);
    rightEyebrow.rotation.z = 0.2;
    face.add(rightEyebrow);

    // Add nose
    const noseGeometry = new THREE.ConeGeometry(3, 8, 8);
    const noseMaterial = new THREE.MeshPhongMaterial({
      color: 0x7878dd,
      emissive: 0x3f3f8f,
      emissiveIntensity: 0.1,
      shininess: 40,
    });

    const nose = new THREE.Mesh(noseGeometry, noseMaterial);
    nose.position.set(0, 0, 48);
    nose.rotation.x = Math.PI / 2;
    face.add(nose);

    // Add visible MOUTH with lips
    const mouthGroup = new THREE.Group();
    mouthGroup.position.set(0, -15, 45);
    mouthGroup.name = "mouthGroup";
    face.add(mouthGroup);

    // Upper lip
    const upperLipGeometry = new THREE.TorusGeometry(8, 1.5, 16, 32, Math.PI);
    const lipMaterial = new THREE.MeshPhongMaterial({
      color: 0xff6699,
      emissive: 0xcc3366,
      emissiveIntensity: 0.4,
      shininess: 60,
    });

    const upperLip = new THREE.Mesh(upperLipGeometry, lipMaterial);
    upperLip.rotation.x = Math.PI;
    mouthGroup.add(upperLip);

    // Lower lip
    const lowerLipGeometry = new THREE.TorusGeometry(8, 1.5, 16, 32, Math.PI);
    const lowerLip = new THREE.Mesh(lowerLipGeometry, lipMaterial);
    lowerLip.position.y = -1.5;
    mouthGroup.add(lowerLip);

    // Mouth interior (dark)
    const mouthInteriorGeometry = new THREE.CircleGeometry(6, 32);
    const mouthInteriorMaterial = new THREE.MeshBasicMaterial({
      color: 0x220022,
      transparent: true,
      opacity: 0.8,
    });

    const mouthInterior = new THREE.Mesh(
      mouthInteriorGeometry,
      mouthInteriorMaterial
    );
    mouthInterior.position.z = -1;
    mouthGroup.add(mouthInterior);

    // Floating particles for tech effect
    const particlesGeometry = new THREE.BufferGeometry();
    const particlesCount = 1000;
    const posArray = new Float32Array(particlesCount * 3);

    for (let i = 0; i < particlesCount * 3; i++) {
      posArray[i] = (Math.random() - 0.5) * 400;
    }

    particlesGeometry.setAttribute(
      "position",
      new THREE.BufferAttribute(posArray, 3)
    );
    const particlesMaterial = new THREE.PointsMaterial({
      size: 1.5,
      color: 0x4f46e5,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending,
    });

    const particlesMesh = new THREE.Points(
      particlesGeometry,
      particlesMaterial
    );
    scene.add(particlesMesh);

    // Lighting setup for realistic face - BRIGHTER
    const ambientLight = new THREE.AmbientLight(0x666666, 2);
    scene.add(ambientLight);

    // Key light (main light) - MUCH BRIGHTER
    const keyLight = new THREE.DirectionalLight(0xffffff, 3);
    keyLight.position.set(100, 200, 100);
    scene.add(keyLight);

    // Fill light (softer, opposite side) - BRIGHTER
    const fillLight = new THREE.DirectionalLight(0x8888ff, 2);
    fillLight.position.set(-100, 100, -100);
    scene.add(fillLight);

    // Rim light (back light for edge definition) - BRIGHTER
    const rimLight = new THREE.DirectionalLight(0x00ffff, 1.5);
    rimLight.position.set(0, 50, -200);
    scene.add(rimLight);

    // Point lights for eye highlights - BRIGHTER
    const eyeLight1 = new THREE.PointLight(0x00ffff, 2, 300);
    eyeLight1.position.set(0, 50, 100);
    scene.add(eyeLight1);

    const eyeLight2 = new THREE.PointLight(0x6666ff, 1.5, 300);
    eyeLight2.position.set(0, -30, 50);
    scene.add(eyeLight2);

    // Additional front light for face visibility
    const frontLight = new THREE.PointLight(0xffffff, 2, 400);
    frontLight.position.set(0, 0, 200);
    scene.add(frontLight);

    setIsLoaded(true);

    // Animation loop
    const animate = () => {
      animationIdRef.current = requestAnimationFrame(animate);

      const time = Date.now() * 0.001;

      // Animate face
      if (faceRef.current) {
        // Gentle head movement
        faceRef.current.rotation.y = Math.sin(time * 0.3) * 0.1;
        faceRef.current.rotation.x = Math.sin(time * 0.2) * 0.05;

        // Subtle breathing/idle animation
        const breathScale = 1 + Math.sin(time * 0.5) * 0.02;
        faceRef.current.scale.set(breathScale, breathScale, breathScale);

        // Speaking animation with mouth and morph targets
        const mouthGroup = faceRef.current.getObjectByName(
          "mouthGroup"
        ) as THREE.Group;

        if (isSpeaking) {
          // Animate morph targets
          if (faceRef.current.morphTargetInfluences) {
            const mouthInfluence = (Math.sin(time * 20) * 0.5 + 0.5) * 0.7;
            faceRef.current.morphTargetInfluences[0] = mouthInfluence;
          }

          // Animate visible mouth
          if (mouthGroup) {
            const openAmount = (Math.sin(time * 18) * 0.5 + 0.5) * 0.4;
            mouthGroup.scale.y = 1 + openAmount;
            mouthGroup.scale.x = 1 + openAmount * 0.3;

            // Open mouth vertically
            mouthGroup.children.forEach((child, index) => {
              if (index === 0) {
                // Upper lip
                child.position.y = openAmount * 2;
              } else if (index === 1) {
                // Lower lip
                child.position.y = -1.5 - openAmount * 2;
              }
            });
          }
        } else {
          // Smooth return to neutral
          if (faceRef.current.morphTargetInfluences) {
            faceRef.current.morphTargetInfluences[0] *= 0.95;
          }

          if (mouthGroup) {
            mouthGroup.scale.lerp(new THREE.Vector3(1, 1, 1), 0.1);

            // Return lips to neutral
            mouthGroup.children.forEach((child, index) => {
              if (index === 0) {
                // Upper lip
                child.position.y *= 0.9;
              } else if (index === 1) {
                // Lower lip
                child.position.y = child.position.y * 0.9 - 1.5 * 0.1;
              }
            });
          }
        }

        // Eye blink animation (only for eye whites)
        const blinkTime = time % 4;
        if (blinkTime < 0.15) {
          const blinkAmount = Math.sin((blinkTime / 0.15) * Math.PI);
          faceRef.current.children.forEach((child: any) => {
            if (
              child.material &&
              child.material.color &&
              child.material.color.getHex() === 0xffffff
            ) {
              // This is an eye white
              child.scale.y = 1 - blinkAmount * 0.9;
            }
          });
        } else {
          faceRef.current.children.forEach((child: any) => {
            if (
              child.material &&
              child.material.color &&
              child.material.color.getHex() === 0xffffff
            ) {
              child.scale.y = 1;
            }
          });
        }
      }

      // Animate particles
      if (particlesMesh) {
        particlesMesh.rotation.y = time * 0.05;
        particlesMesh.rotation.x = time * 0.02;

        // Pulse particles when speaking
        if (isSpeaking) {
          (particlesMesh.material as THREE.PointsMaterial).size =
            1.5 + Math.sin(time * 10) * 0.5;
        } else {
          (particlesMesh.material as THREE.PointsMaterial).size = 1.5;
        }
      }

      // Animate lights for speaking effect
      if (isSpeaking) {
        eyeLight1.intensity = 2 + Math.sin(time * 15) * 0.5;
        eyeLight2.intensity = 1.5 + Math.sin(time * 12) * 0.3;
        frontLight.intensity = 2 + Math.sin(time * 10) * 0.4;
      } else {
        eyeLight1.intensity = 2;
        eyeLight2.intensity = 1.5;
        frontLight.intensity = 2;
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
    // This effect can be used for additional state changes if needed
  }, [isSpeaking]);

  const handleMuteToggle = () => {
    setIsMuted(!isMuted);
  };

  return (
    <div className="relative w-full h-full bg-gradient-to-b from-slate-800 to-slate-900 overflow-hidden">
      {/* 3D Canvas Container */}
      <div ref={mountRef} className="w-full h-full" />

      {/* Loading State */}
      {!isLoaded && (
        <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
            <p className="text-white text-sm">Loading AI Agent...</p>
          </div>
        </div>
      )}

      {/* Agent Controls */}
      <div className="absolute bottom-0 right-0 p-4">
        <button
          onClick={handleMuteToggle}
          className="p-1 rounded hover:bg-white/10 transition-colors text-white"
        >
          {isMuted ? (
            <VolumeX className="w-4 h-4" />
          ) : (
            <Volume2 className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Speaking Indicator */}
      {isSpeaking && (
        <div className="absolute top-4 left-4">
          <div className="flex items-center space-x-2 bg-green-600 px-3 py-1 rounded-full">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
            <span className="text-white text-xs font-medium">AI SPEAKING</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIAgent;
