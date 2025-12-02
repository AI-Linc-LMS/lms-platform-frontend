import { Suspense, useEffect, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, useGLTF } from "@react-three/drei";
import * as THREE from "three";

useGLTF.preload("/avatars/portfolio_avatar.glb");

function Avatar({ isSpeaking }: { isSpeaking: boolean }) {
  const group = useRef<THREE.Group>(null);
  const { scene } = useGLTF("/avatars/portfolio_avatar.glb");

  const jawBone = useRef<THREE.Object3D | null>(null);
  const morphMeshes = useRef<THREE.Mesh[]>([]);
  const eyeBlinkMeshes = useRef<{ mesh: THREE.Mesh; indices: number[] }[]>([]);

  // Blink state
  const [nextBlinkTime, setNextBlinkTime] = useState(3);
  const blinkProgress = useRef(0);
  const isBlinking = useRef(false);

  useEffect(() => {
    jawBone.current = null;
    morphMeshes.current = [];
    eyeBlinkMeshes.current = [];

    // Clone the scene to avoid modifying the original
    const clonedScene = scene.clone();

    clonedScene.traverse((obj: THREE.Object3D) => {
      const name = obj.name?.toLowerCase() || "";

      // Find jaw bone
      if (name.includes("jaw")) {
        jawBone.current = obj;
      }

      // Find meshes with morph targets
      if ((obj as THREE.Mesh).isMesh) {
        const mesh = obj as THREE.Mesh;

        if (
          mesh.morphTargetInfluences &&
          mesh.morphTargetInfluences.length > 0
        ) {
          const mouthIndices: number[] = [];
          const eyeIndices: number[] = [];

          if (mesh.morphTargetDictionary) {
            Object.keys(mesh.morphTargetDictionary).forEach((key) => {
              const lowerKey = key.toLowerCase();
              const index = mesh.morphTargetDictionary![key];

              // Mouth/jaw related morph targets
              if (
                lowerKey.includes("mouth") ||
                lowerKey.includes("jaw") ||
                lowerKey.includes("aa") ||
                lowerKey.includes("o") ||
                lowerKey.includes("lips")
              ) {
                mouthIndices.push(index);
              }

              // Eye blink related morph targets
              if (
                lowerKey.includes("blink") ||
                (lowerKey.includes("eye") &&
                  (lowerKey.includes("close") ||
                    lowerKey.includes("closed"))) ||
                lowerKey.includes("eyesclosed")
              ) {
                eyeIndices.push(index);
              }
            });
          }

          // Store mouth morphs (avoid duplicates)
          if (mouthIndices.length > 0 && !morphMeshes.current.includes(mesh)) {
            morphMeshes.current.push(mesh);
          } else if (
            mesh.morphTargetInfluences.length > 0 &&
            mouthIndices.length === 0 &&
            !morphMeshes.current.includes(mesh)
          ) {
            morphMeshes.current.push(mesh);
          }

          // Store eye blink morphs
          if (eyeIndices.length > 0) {
            eyeBlinkMeshes.current.push({ mesh, indices: eyeIndices });
          }
        }
      }
    });

    // Proper bounding box calculation and positioning
    if (group.current) {
      // Clear any existing children
      while (group.current.children.length > 0) {
        group.current.remove(group.current.children[0]);
      }

      // Add cloned scene to group
      group.current.add(clonedScene);

      // Calculate bounding box AFTER adding to group
      const box = new THREE.Box3().setFromObject(group.current);
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());

      // Get max dimension for proper scaling
      const maxDim = Math.max(size.x, size.y, size.z);

      // Scale to fit in viewport (adjust 2.2 to make bigger/smaller)
      const scale = 2.2 / maxDim;
      group.current.scale.setScalar(scale);

      // Center the group at origin
      group.current.position.x = -center.x * scale;
      group.current.position.y = -center.y * scale;
      group.current.position.z = -center.z * scale;

      console.log(`Model size:`, size);
      console.log(`Scale factor:`, scale);
      console.log(`Center:`, center);
      console.log(`Mouth morph meshes:`, morphMeshes.current.length);
      console.log(`Eye blink meshes:`, eyeBlinkMeshes.current.length);
      console.log(`Jaw bone found:`, !!jawBone.current);
    }
  }, [scene]);

  // Animation loop
  useFrame(({ clock }, delta) => {
    const t = clock.getElapsedTime();

    // Subtle idle head movement
    if (group.current) {
      group.current.rotation.y = Math.sin(t * 0.4) * 0.05;
      group.current.rotation.x = Math.sin(t * 0.25) * 0.025;
    }

    // SPEAKING ANIMATION
    const mouthIntensity = isSpeaking ? Math.abs(Math.sin(t * 12)) * 0.6 : 0;

    if (jawBone.current) {
      jawBone.current.rotation.x = -mouthIntensity * 0.6;
    }

    morphMeshes.current.forEach((mesh) => {
      if (mesh.morphTargetInfluences) {
        mesh.morphTargetInfluences.forEach((_, i) => {
          mesh.morphTargetInfluences![i] = mouthIntensity * 0.7;
        });
      }
    });

    // EYE BLINKING ANIMATION
    if (t >= nextBlinkTime && !isBlinking.current) {
      isBlinking.current = true;
      blinkProgress.current = 0;
      setNextBlinkTime(t + 3 + Math.random() * 4);
    }

    if (isBlinking.current) {
      const blinkSpeed = 15;
      blinkProgress.current += delta * blinkSpeed;

      let blinkValue = 0;

      if (blinkProgress.current < 0.5) {
        blinkValue = Math.sin(blinkProgress.current * Math.PI);
      } else if (blinkProgress.current < 1) {
        blinkValue = Math.sin((1 - blinkProgress.current) * Math.PI);
      } else {
        isBlinking.current = false;
        blinkValue = 0;
      }

      eyeBlinkMeshes.current.forEach(({ mesh, indices }) => {
        if (mesh.morphTargetInfluences) {
          indices.forEach((idx) => {
            mesh.morphTargetInfluences![idx] = blinkValue;
          });
        }
      });
    } else {
      eyeBlinkMeshes.current.forEach(({ mesh, indices }) => {
        if (mesh.morphTargetInfluences) {
          indices.forEach((idx) => {
            mesh.morphTargetInfluences![idx] = 0;
          });
        }
      });
    }
  });

  return <group ref={group} />;
}

function LoadingFallback() {
  return (
    <mesh>
      <sphereGeometry args={[0.3, 16, 16]} />
      <meshStandardMaterial color="#a78bfa" />
    </mesh>
  );
}

const AIAgent = ({ isSpeaking }: { isSpeaking: boolean }) => {
  return (
    <div className="w-full h-full relative">
      <Canvas
        style={{
          width: "100%",
          height: "100%",
          display: "block",
        }}
        camera={{
          position: [0, 0, 4],
          fov: 40,
          near: 0.1,
          far: 100,
        }}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: "high-performance",
        }}
        dpr={[1, 2]}
      >
        <ambientLight intensity={0.6} />
        <directionalLight position={[1, 1, 2]} intensity={1.2} />
        <directionalLight position={[-1, 0.5, 1]} intensity={0.6} />
        <pointLight position={[0, 0, 3]} intensity={0.3} />

        <Suspense fallback={<LoadingFallback />}>
          <Avatar isSpeaking={isSpeaking} />
        </Suspense>

        <OrbitControls
          enablePan={false}
          enableRotate={false}
          enableZoom={false}
          makeDefault
        />
      </Canvas>
    </div>
  );
};

export default AIAgent;
