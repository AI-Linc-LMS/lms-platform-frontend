import { motion } from "framer-motion";
import { useState, useEffect } from "react";

const ErrorPage = () => {
  const [position, setPosition] = useState(50);
  const [enemies, setEnemies] = useState([20, 40, 60, 80]);
  const [score, setScore] = useState(0);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" && position > 10) setPosition(position - 10);
      if (e.key === "ArrowRight" && position < 90) setPosition(position + 10);
    };
    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [position]);

  const shoot = () => {
    if (enemies.includes(position)) {
      setEnemies(enemies.filter((e) => e !== position));
      setScore(score + 100);
    }
  };

  return (
    <div className="h-screen bg-black overflow-hidden relative" onClick={shoot}>
      {/* Stars Background */}
      <div className="absolute inset-0">
        {[...Array(50)].map((_, i) => (
          <motion.div
            key={i}
            animate={{ y: ["0vh", "100vh"] }}
            transition={{
              duration: 5 + Math.random() * 5,
              repeat: Infinity,
              ease: "linear",
            }}
            className="absolute w-1 h-1 bg-white rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
          />
        ))}
      </div>

      {/* Score */}
      <div className="absolute top-8 right-8 text-white text-2xl font-bold z-10">
        Score: {score}
      </div>

      {/* Enemies */}
      {enemies.map((enemy, i) => (
        <motion.div
          key={i}
          animate={{ y: [0, 600] }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
          className="absolute w-12 h-12 bg-red-500 rounded"
          style={{ left: `${enemy}%`, top: "0" }}
        >
          <div className="text-center text-2xl">👾</div>
        </motion.div>
      ))}

      {/* Player Ship */}
      <motion.div
        animate={{ left: `${position}%` }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="absolute bottom-20 w-12 h-12 text-4xl"
      >
        🚀
      </motion.div>

      {/* Instructions */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="text-center text-white bg-black/50 p-8 rounded-2xl backdrop-blur-sm">
          <h1 className="text-4xl font-bold mb-4">🎓 Quick Study Break!</h1>
          <p className="text-xl mb-2">Platform maintenance in progress</p>
          <p className="text-gray-400 mb-6">
            Play while we prepare your courses
          </p>
          <p className="text-gray-300 mb-4">← → to move | Click to shoot</p>

          <button
            onClick={() => window.location.reload()}
            className="pointer-events-auto px-8 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700"
          >
            Back to Learning
          </button>
        </div>
      </div>
    </div>
  );
};

export default ErrorPage;
