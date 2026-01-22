'use client';

// 1. React and Next.js imports
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';

// 2. Hook imports
import { useOffline } from '@/hooks/useOffline';

interface Obstacle {
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'book' | 'pencil';
}

interface BackgroundSymbol {
  x: number;
  y: number;
  symbol: string;
  size: number;
}

interface GameStateRef {
  playerY: number;
  playerVelocity: number;
  obstacles: Obstacle[];
  backgroundSymbols: BackgroundSymbol[];
  gameSpeed: number;
  lastObstacleTime: number;
  animationFrame: number;
  isJumping: boolean;
  isPlaying: boolean;
  score: number;
  lastScoreUpdate: number;
  distanceTraveled: number;
}

export default function CramSessionGame() {
  const router = useRouter();
  const isOffline = useOffline();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<'start' | 'playing' | 'gameover'>('start');
  const [displayScore, setDisplayScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [isNightMode, setIsNightMode] = useState(false);
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 400 });

  // Load high score from localStorage on mount
  useEffect(() => {
    const savedHighScore = localStorage.getItem('cramSessionHighScore');
    if (savedHighScore) {
      setHighScore(parseInt(savedHighScore, 10));
    }
  }, []);

  // Game state refs (to avoid re-renders during game loop)
  const gameStateRef = useRef<GameStateRef>({
    playerY: 0,
    playerVelocity: 0,
    obstacles: [],
    backgroundSymbols: [],
    gameSpeed: 3.5,
    lastObstacleTime: 0,
    animationFrame: 0,
    isJumping: false,
    isPlaying: false,
    score: 0,
    lastScoreUpdate: 0,
    distanceTraveled: 0,
  });

  // Use ref for night mode to avoid breaking game loop on state change
  const nightModeRef = useRef(false);

  // Responsive canvas sizing
  useEffect(() => {
    const updateCanvasSize = () => {
      // Use viewport dimensions, accounting for mobile browser UI
      const vw = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0);
      const vh = Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0);
      
      setCanvasSize({
        width: vw,
        height: vh,
      });
    };

    updateCanvasSize();
    
    // Handle resize and orientation change
    window.addEventListener('resize', updateCanvasSize);
    window.addEventListener('orientationchange', () => {
      setTimeout(updateCanvasSize, 100);
    });
    
    return () => {
      window.removeEventListener('resize', updateCanvasSize);
      window.removeEventListener('orientationchange', updateCanvasSize);
    };
  }, []);

  // Memoize computed values to prevent recalculation on every render
  const gameDimensions = useMemo(() => {
    const canvasWidth = canvasSize.width;
    const canvasHeight = canvasSize.height;
    // Adjust ground position for mobile (smaller bottom margin on mobile)
    const isMobile = canvasWidth < 768;
    const groundY = canvasHeight - (isMobile ? 60 : 80);
    // Scale player and obstacles appropriately for mobile
    const playerWidth = isMobile 
      ? Math.max(40, canvasWidth * 0.08) 
      : Math.max(50, canvasWidth * 0.06);
    const playerHeight = isMobile 
      ? Math.max(55, canvasWidth * 0.1) 
      : Math.max(70, canvasWidth * 0.08);
    const playerStartX = isMobile 
      ? Math.max(60, canvasWidth * 0.1) 
      : Math.max(100, canvasWidth * 0.12);
    const playerStartY = groundY - playerHeight;
    
    return {
      canvasWidth,
      canvasHeight,
      isMobile,
      groundY,
      playerWidth,
      playerHeight,
      playerStartX,
      playerStartY,
    };
  }, [canvasSize.width, canvasSize.height]);

  const {
    canvasWidth,
    canvasHeight,
    isMobile,
    groundY,
    playerWidth,
    playerHeight,
    playerStartX,
    playerStartY,
  } = gameDimensions;

  // Initialize background symbols
  const initBackgroundSymbols = useCallback((width: number, height: number): BackgroundSymbol[] => {
    const symbols = ['+', '−', '÷', '×', 'π', '?'];
    const bgSymbols: BackgroundSymbol[] = [];
    for (let i = 0; i < 8; i++) {
      bgSymbols.push({
        x: Math.random() * width * 2,
        y: 50 + Math.random() * (height * 0.5),
        symbol: symbols[Math.floor(Math.random() * symbols.length)],
        size: 20 + Math.random() * 15,
      });
    }
    return bgSymbols;
  }, []);

  // Draw player
  const drawPlayer = (ctx: CanvasRenderingContext2D, x: number, y: number, frame: number, nightMode: boolean) => {
    const bobOffset = Math.sin(frame * 0.2) * 2;
    const currentY = y + bobOffset;
    const headRadius = playerWidth * 0.18;
    const bodyWidth = playerWidth * 0.65;
    const bodyHeight = playerHeight * 0.45;
    const armWidth = playerWidth * 0.12;
    const legWidth = playerWidth * 0.1;
    
    // Calculate if player is on ground or in air
    const isOnGround = currentY >= playerStartY - 2;
    const legEndY = isOnGround ? groundY : currentY + headRadius * 2.2 + bodyHeight + playerHeight * 0.25;
    const runningPhase = frame * 0.3;

    // Head (circle with face details)
    ctx.beginPath();
    ctx.arc(x + playerWidth / 2, currentY + headRadius, headRadius, 0, Math.PI * 2);
    ctx.fillStyle = nightMode ? '#f0f0f0' : '#ffdbac';
    ctx.fill();
    
    // Head outline
    ctx.strokeStyle = nightMode ? '#ffffff' : '#333333';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Facial expressions based on state
    const isJumping = !isOnGround;
    const eyeY = currentY + headRadius * 0.7;
    const mouthY = currentY + headRadius * 1.3;
    const centerX = x + playerWidth / 2;

    if (isJumping) {
      // WOW FACE - Surprised/excited when jumping
      // Wide open eyes (larger ovals)
      const wowEyeWidth = headRadius * 0.25;
      const wowEyeHeight = headRadius * 0.2;
      // Dark eyes in night mode for contrast on light head
      ctx.fillStyle = nightMode ? '#1a1a1a' : '#000000';
      
      // Left eye (oval)
      ctx.beginPath();
      ctx.ellipse(x + playerWidth * 0.4, eyeY, wowEyeWidth, wowEyeHeight, 0, 0, Math.PI * 2);
      ctx.fill();
      
      // Right eye (oval)
      ctx.beginPath();
      ctx.ellipse(x + playerWidth * 0.6, eyeY, wowEyeWidth, wowEyeHeight, 0, 0, Math.PI * 2);
      ctx.fill();
      
      // Open mouth (O shape) - darker in night mode for visibility
      ctx.strokeStyle = nightMode ? '#1a1a1a' : '#000000';
      ctx.lineWidth = nightMode ? 3 : 2;
      ctx.beginPath();
      ctx.arc(centerX, mouthY, headRadius * 0.25, 0, Math.PI * 2);
      ctx.stroke();
      
      // Eyebrows raised (curved up) - darker in night mode
      ctx.strokeStyle = nightMode ? '#1a1a1a' : '#333333';
      ctx.lineWidth = nightMode ? 3 : 2;
      ctx.beginPath();
      ctx.arc(x + playerWidth * 0.4, eyeY - headRadius * 0.15, headRadius * 0.2, 0, Math.PI);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(x + playerWidth * 0.6, eyeY - headRadius * 0.15, headRadius * 0.2, 0, Math.PI);
      ctx.stroke();
    } else {
      // TENSED FACE - Focused/determined when running
      // Focused eyes (slightly squinted, smaller)
      const tenseEyeSize = headRadius * 0.12;
      // Dark eyes in night mode for contrast on light head
      ctx.fillStyle = nightMode ? '#1a1a1a' : '#000000';
      
      // Left eye (smaller, focused)
      ctx.beginPath();
      ctx.arc(x + playerWidth * 0.4, eyeY, tenseEyeSize, 0, Math.PI * 2);
      ctx.fill();
      
      // Right eye (smaller, focused)
      ctx.beginPath();
      ctx.arc(x + playerWidth * 0.6, eyeY, tenseEyeSize, 0, Math.PI * 2);
      ctx.fill();
      
      // Determined mouth (straight line, slightly down) - darker in night mode
      ctx.strokeStyle = nightMode ? '#1a1a1a' : '#000000';
      ctx.lineWidth = nightMode ? 3 : 2;
      ctx.beginPath();
      ctx.moveTo(centerX - headRadius * 0.2, mouthY);
      ctx.lineTo(centerX + headRadius * 0.2, mouthY - headRadius * 0.05);
      ctx.stroke();
      
      // Furrowed eyebrows (angled down, showing determination) - darker in night mode
      ctx.strokeStyle = nightMode ? '#1a1a1a' : '#333333';
      ctx.lineWidth = nightMode ? 3 : 2;
      ctx.beginPath();
      ctx.moveTo(x + playerWidth * 0.3, eyeY - headRadius * 0.1);
      ctx.lineTo(x + playerWidth * 0.45, eyeY - headRadius * 0.15);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x + playerWidth * 0.55, eyeY - headRadius * 0.15);
      ctx.lineTo(x + playerWidth * 0.7, eyeY - headRadius * 0.1);
      ctx.stroke();
    }

    // Body (rounded rectangle)
    const bodyX = x + playerWidth * 0.175;
    const bodyY = currentY + headRadius * 2.2;
    const bodyRadius = 4;
    ctx.fillStyle = nightMode ? '#e8e8e8' : '#4a90e2';
    ctx.beginPath();
    // Draw rounded rectangle manually
    ctx.moveTo(bodyX + bodyRadius, bodyY);
    ctx.lineTo(bodyX + bodyWidth - bodyRadius, bodyY);
    ctx.quadraticCurveTo(bodyX + bodyWidth, bodyY, bodyX + bodyWidth, bodyY + bodyRadius);
    ctx.lineTo(bodyX + bodyWidth, bodyY + bodyHeight - bodyRadius);
    ctx.quadraticCurveTo(bodyX + bodyWidth, bodyY + bodyHeight, bodyX + bodyWidth - bodyRadius, bodyY + bodyHeight);
    ctx.lineTo(bodyX + bodyRadius, bodyY + bodyHeight);
    ctx.quadraticCurveTo(bodyX, bodyY + bodyHeight, bodyX, bodyY + bodyHeight - bodyRadius);
    ctx.lineTo(bodyX, bodyY + bodyRadius);
    ctx.quadraticCurveTo(bodyX, bodyY, bodyX + bodyRadius, bodyY);
    ctx.closePath();
    ctx.fill();
    
    // Body outline
    ctx.strokeStyle = nightMode ? '#ffffff' : '#2c5aa0';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Arms (animated running motion)
    const armSwing = isOnGround ? Math.sin(runningPhase) * 0.3 : 0;
    const leftArmAngle = armSwing;
    const rightArmAngle = -armSwing;
    
    // Left arm
    ctx.save();
    ctx.translate(bodyX, bodyY + bodyHeight * 0.3);
    ctx.rotate(leftArmAngle);
    ctx.fillStyle = nightMode ? '#e8e8e8' : '#4a90e2';
    ctx.fillRect(-armWidth / 2, 0, armWidth, bodyHeight * 0.6);
    ctx.restore();
    
    // Right arm
    ctx.save();
    ctx.translate(bodyX + bodyWidth, bodyY + bodyHeight * 0.3);
    ctx.rotate(rightArmAngle);
    ctx.fillStyle = nightMode ? '#e8e8e8' : '#4a90e2';
    ctx.fillRect(-armWidth / 2, 0, armWidth, bodyHeight * 0.6);
    ctx.restore();

    // Backpack (detailed with straps)
    const backpackX = bodyX + bodyWidth * 0.85;
    const backpackY = bodyY + bodyHeight * 0.1;
    const backpackWidth = playerWidth * 0.2;
    const backpackHeight = bodyHeight * 0.75;
    const backpackRadius = 3;
    
    ctx.fillStyle = nightMode ? '#ffd700' : '#255c79';
    ctx.beginPath();
    // Draw rounded rectangle manually
    ctx.moveTo(backpackX + backpackRadius, backpackY);
    ctx.lineTo(backpackX + backpackWidth - backpackRadius, backpackY);
    ctx.quadraticCurveTo(backpackX + backpackWidth, backpackY, backpackX + backpackWidth, backpackY + backpackRadius);
    ctx.lineTo(backpackX + backpackWidth, backpackY + backpackHeight - backpackRadius);
    ctx.quadraticCurveTo(backpackX + backpackWidth, backpackY + backpackHeight, backpackX + backpackWidth - backpackRadius, backpackY + backpackHeight);
    ctx.lineTo(backpackX + backpackRadius, backpackY + backpackHeight);
    ctx.quadraticCurveTo(backpackX, backpackY + backpackHeight, backpackX, backpackY + backpackHeight - backpackRadius);
    ctx.lineTo(backpackX, backpackY + backpackRadius);
    ctx.quadraticCurveTo(backpackX, backpackY, backpackX + backpackRadius, backpackY);
    ctx.closePath();
    ctx.fill();
    
    // Backpack straps
    ctx.strokeStyle = nightMode ? '#ffffff' : '#1a3a5a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(backpackX, backpackY);
    ctx.lineTo(bodyX + bodyWidth * 0.2, bodyY);
    ctx.moveTo(backpackX + backpackWidth, backpackY);
    ctx.lineTo(bodyX + bodyWidth * 0.8, bodyY);
    ctx.stroke();

    // Legs (thicker, more detailed)
    const legOffset = isOnGround ? Math.sin(runningPhase) * 5 : 0;
    const legThickness = Math.max(4, playerWidth * 0.1);
    const footHeight = 6;
    
    // Calculate leg length to reach ground
    const legStartY = bodyY + bodyHeight;
    const legLength = isOnGround ? (groundY - footHeight - legStartY) : (legEndY - legStartY);
    
    // Left leg (thigh and shin)
    const leftLegX = bodyX + bodyWidth * 0.3;
    const thighLength = legLength * 0.55;
    const shinLength = legLength * 0.45;
    
    ctx.fillStyle = nightMode ? '#e8e8e8' : '#4a90e2';
    // Thigh
    ctx.fillRect(leftLegX - legThickness / 2, legStartY, legThickness, thighLength);
    // Shin (with offset for running animation)
    ctx.fillRect(leftLegX - legThickness / 2 + legOffset * 0.5, legStartY + thighLength, legThickness, shinLength);
    
    // Right leg (thigh and shin)
    const rightLegX = bodyX + bodyWidth * 0.7;
    // Thigh
    ctx.fillRect(rightLegX - legThickness / 2, legStartY, legThickness, thighLength);
    // Shin (with offset for running animation)
    ctx.fillRect(rightLegX - legThickness / 2 - legOffset * 0.5, legStartY + thighLength, legThickness, shinLength);
    
    // Feet - ensure they align with groundY (feet bottom should be exactly at groundY)
    const footSize = legThickness * 1.5;
    ctx.fillStyle = nightMode ? '#ffffff' : '#2c5aa0';
    // Draw feet so their bottom edge aligns exactly with groundY
    const footY = isOnGround ? groundY - footHeight : legEndY - footHeight;
    ctx.fillRect(leftLegX - footSize / 2 + legOffset, footY, footSize, footHeight);
    ctx.fillRect(rightLegX - footSize / 2 - legOffset, footY, footSize, footHeight);
  };

  // Draw book stack obstacle
  const drawBookStack = (ctx: CanvasRenderingContext2D, x: number, y: number, nightMode: boolean) => {
    const colors = nightMode 
      ? ['#ff6b6b', '#4ecdc4', '#ffe66d']
      : ['#ef4444', '#10b981', '#f59e0b'];
    
    const bookHeight = 15;
    const bookWidth = 35;
    
    for (let i = 0; i < 3; i++) {
      ctx.fillStyle = colors[i];
      ctx.fillRect(x, y - (i * bookHeight), bookWidth, bookHeight);
      // Book spine detail
      ctx.fillStyle = nightMode ? '#ffffff' : '#000000';
      ctx.fillRect(x + bookWidth - 3, y - (i * bookHeight), 3, bookHeight);
      // Book pages detail
      ctx.fillStyle = nightMode ? '#ffffff' : '#ffffff';
      ctx.fillRect(x + 2, y - (i * bookHeight) + 1, bookWidth - 5, 1);
    }
  };

  // Draw pencil obstacle
  const drawPencil = (ctx: CanvasRenderingContext2D, x: number, y: number, nightMode: boolean) => {
    const pencilHeight = 55;
    const pencilWidth = 10;

    // Pencil body (yellow)
    ctx.fillStyle = nightMode ? '#ffd700' : '#fbbf24';
    ctx.fillRect(x, y - pencilHeight, pencilWidth, pencilHeight - 12);

    // Eraser (pink)
    ctx.fillStyle = nightMode ? '#ff69b4' : '#ec4899';
    ctx.fillRect(x, y - pencilHeight, pencilWidth, 10);

    // Point (triangle)
    ctx.beginPath();
    ctx.moveTo(x, y - 12);
    ctx.lineTo(x + pencilWidth / 2, y);
    ctx.lineTo(x + pencilWidth, y - 12);
    ctx.closePath();
    ctx.fillStyle = nightMode ? '#fbbf24' : '#d97706';
    ctx.fill();

    // Pencil stripe
    ctx.strokeStyle = nightMode ? '#ffffff' : '#000000';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x + pencilWidth / 2, y - pencilHeight);
    ctx.lineTo(x + pencilWidth / 2, y - 12);
    ctx.stroke();
  };

  // Draw background symbols
  const drawBackgroundSymbols = (ctx: CanvasRenderingContext2D, symbols: BackgroundSymbol[], nightMode: boolean) => {
    ctx.save();
    ctx.globalAlpha = 0.3;
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = nightMode ? '#ffffff' : '#333333';

    symbols.forEach((symbol) => {
      // For night mode, use stars or Zzz
      const displaySymbol = nightMode 
        ? (symbol.symbol === 'π' ? '★' : symbol.symbol === '?' ? 'Zzz' : symbol.symbol)
        : symbol.symbol;
      
      ctx.font = `bold ${symbol.size}px Arial`;
      ctx.fillText(displaySymbol, symbol.x, symbol.y);
    });
    ctx.restore();
  };

  // Draw floor/ruler
  const drawFloor = (ctx: CanvasRenderingContext2D, offset: number, nightMode: boolean) => {
    // Ground line (thicker and more visible)
    ctx.strokeStyle = nightMode ? '#ffffff' : '#333333';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(0, groundY);
    ctx.lineTo(canvasWidth, groundY);
    ctx.stroke();

    // Ruler tick marks (larger)
    ctx.lineWidth = 2;
    const tickStart = (offset % 60);
    for (let x = -tickStart; x < canvasWidth; x += 60) {
      ctx.beginPath();
      ctx.moveTo(x, groundY);
      ctx.lineTo(x, groundY + 12);
      ctx.stroke();
    }
  };

  // Collision detection
  const checkCollision = (playerX: number, playerY: number, obstacle: Obstacle): boolean => {
    return (
      playerX < obstacle.x + obstacle.width &&
      playerX + playerWidth > obstacle.x &&
      playerY < obstacle.y + obstacle.height &&
      playerY + playerHeight > obstacle.y
    );
  };

  // Game loop
  useEffect(() => {
    if (gameState !== 'playing' || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const state = gameStateRef.current;
    state.playerY = playerStartY;
    state.playerVelocity = 0;
    state.obstacles = [];
    state.backgroundSymbols = initBackgroundSymbols(canvasWidth, canvasHeight);
    state.gameSpeed = 3.5;
    state.lastObstacleTime = 0;
    state.animationFrame = 0;
    state.isPlaying = true;
    state.score = 0;
    state.lastScoreUpdate = Date.now();
    state.distanceTraveled = 0;
    nightModeRef.current = false;

    const gravity = 0.6;
    const baseObstacleSpawnInterval = 3000;
    const baseMinObstacleDistance = 400; // Base minimum pixels between obstacles
    const scoreUpdateInterval = 100; // Update score every 100ms
    const scoreDistanceInterval = 50; // Or every 50 pixels

    const gameLoop = () => {
      if (!state.isPlaying) return;

      state.animationFrame++;

      // Clear canvas (use ref to avoid dependency issues)
      // Night mode: dark blue background, Day mode: light blue background
      ctx.fillStyle = nightModeRef.current ? '#0f172a' : '#f0f9ff';
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);

      // Update and draw background symbols (parallax)
      state.backgroundSymbols.forEach((symbol: BackgroundSymbol) => {
        symbol.x -= state.gameSpeed * 0.2;
        if (symbol.x < -50) {
          symbol.x = canvasWidth + 50;
          symbol.y = 50 + Math.random() * 200;
        }
      });
      drawBackgroundSymbols(ctx, state.backgroundSymbols, nightModeRef.current);

      // Draw floor
      drawFloor(ctx, state.animationFrame * state.gameSpeed, nightModeRef.current);

      // Apply gravity
      state.playerVelocity += gravity;
      state.playerY += state.playerVelocity;

      // Ground collision - ensure player never goes below ground
      // playerStartY is the top of the player, so we need to ensure the bottom (playerY + playerHeight) doesn't exceed groundY
      const playerBottom = state.playerY + playerHeight;
      if (playerBottom >= groundY) {
        // Adjust playerY so bottom aligns with groundY
        state.playerY = groundY - playerHeight;
        state.playerVelocity = 0;
        state.isJumping = false;
      }

      // Track distance traveled for score
      state.distanceTraveled += state.gameSpeed;

      // Spawn obstacles
      const currentTime = Date.now();
      const timeSinceLastObstacle = currentTime - state.lastObstacleTime;
      
      // Increase obstacle spacing as speed increases
      // At base speed (3.5), distance is 400. As speed increases, distance increases proportionally
      const speedMultiplier = state.gameSpeed / 3.5;
      const minObstacleDistance = baseMinObstacleDistance * (1 + (speedMultiplier - 1) * 0.5); // 50% increase per speed level
      const obstacleSpawnInterval = baseObstacleSpawnInterval * (1 + (speedMultiplier - 1) * 0.3); // Slightly longer intervals at higher speeds
      
      const spawnInterval = obstacleSpawnInterval / (1 + state.gameSpeed * 0.03); // Reduced speed impact on spawn rate
      
      // Check if enough time has passed AND no obstacle is too close
      const lastObstacleX = state.obstacles.length > 0 
        ? Math.max(...state.obstacles.map((o: Obstacle) => o.x + o.width))
        : -minObstacleDistance;
      const distanceFromLastObstacle = canvasWidth - lastObstacleX;
      
      // Scale obstacles for mobile
      const isMobile = canvasWidth < 768;
      
      if (timeSinceLastObstacle > spawnInterval && distanceFromLastObstacle >= minObstacleDistance) {
        const obstacleType: 'book' | 'pencil' = Math.random() > 0.5 ? 'book' : 'pencil';
        const obstacleHeight = isMobile 
          ? (obstacleType === 'book' ? 35 : 45)
          : (obstacleType === 'book' ? 45 : 55);
        const obstacleWidth = isMobile 
          ? (obstacleType === 'book' ? 28 : 8)
          : (obstacleType === 'book' ? 35 : 10);

        state.obstacles.push({
          x: canvasWidth,
          y: groundY - obstacleHeight,
          width: obstacleWidth,
          height: obstacleHeight,
          type: obstacleType,
        });
        state.lastObstacleTime = currentTime;
      }

      // Update obstacles
      state.obstacles = state.obstacles.filter((obstacle: Obstacle) => {
        obstacle.x -= state.gameSpeed;

        // Draw obstacle
        if (obstacle.type === 'book') {
          drawBookStack(ctx, obstacle.x, obstacle.y, nightModeRef.current);
        } else {
          drawPencil(ctx, obstacle.x, obstacle.y, nightModeRef.current);
        }

        // Check collision
        if (checkCollision(playerStartX, state.playerY, obstacle)) {
          state.isPlaying = false;
          // Update high score if current score is higher
          if (state.score > highScore) {
            const newHighScore = state.score;
            setHighScore(newHighScore);
            localStorage.setItem('cramSessionHighScore', newHighScore.toString());
          }
          setGameState('gameover');
          return false;
        }

        // Remove if off screen
        return obstacle.x + obstacle.width > 0;
      });

      // Draw player (use ref for night mode to avoid breaking game loop)
      drawPlayer(ctx, playerStartX, state.playerY, state.animationFrame, nightModeRef.current);

      // Update score based on distance or time
      if (
        state.distanceTraveled >= scoreDistanceInterval ||
        currentTime - state.lastScoreUpdate >= scoreUpdateInterval
      ) {
        state.score += Math.floor(state.distanceTraveled / scoreDistanceInterval);
        state.distanceTraveled = state.distanceTraveled % scoreDistanceInterval;
        state.lastScoreUpdate = currentTime;
        
        // Update displayed score
        setDisplayScore(state.score);
        
        // Change environment every 150 points (night mode toggle)
        const environmentLevel = Math.floor(state.score / 150);
        const shouldBeNightMode = environmentLevel % 2 === 1; // Alternate between day and night every 150 points
        if (shouldBeNightMode !== nightModeRef.current) {
          nightModeRef.current = shouldBeNightMode; // Update ref immediately for game loop
          setIsNightMode(shouldBeNightMode); // Update state for UI
        }
      }

      // Increase game speed gradually (every 150 points, increase by 0.3)
      // Speed increases: 3.5 (0-149), 3.8 (150-299), 4.1 (300-449), 4.4 (450-599), etc.
      const speedLevel = Math.floor(state.score / 150); // Calculate which speed level we're at
      const baseSpeed = 3.5 + speedLevel * 0.3; // Increase by 0.3 per 150 points
      const nightModeSpeedBoost = nightModeRef.current ? 0.5 : 0; // Extra 0.5 speed in night mode
      state.gameSpeed = baseSpeed + nightModeSpeedBoost;

      requestAnimationFrame(gameLoop);
    };

    const animationId = requestAnimationFrame(gameLoop);

    return () => {
      state.isPlaying = false;
      cancelAnimationFrame(animationId);
    };
  }, [gameState, initBackgroundSymbols, gameDimensions, highScore]);

  // Jump handler
  const handleJump = useCallback(() => {
    if (gameState === 'start') {
      setGameState('playing');
      setDisplayScore(0);
      setIsNightMode(false);
      gameStateRef.current.obstacles = [];
      gameStateRef.current.lastObstacleTime = Date.now();
      gameStateRef.current.isPlaying = true;
      gameStateRef.current.score = 0;
    } else if (gameState === 'playing') {
      const state = gameStateRef.current;
      // Only allow jump if player is on ground (or very close to it)
      if (state.playerY >= playerStartY - 5) {
        state.playerVelocity = -22; // Increased jump velocity for higher/longer jumps
        state.isJumping = true;
      }
    } else if (gameState === 'gameover') {
      setGameState('start');
      setDisplayScore(0);
      setIsNightMode(false);
      gameStateRef.current.isPlaying = false;
    }
  }, [gameState, playerStartY]);

  // Keyboard and touch events
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        handleJump();
      }
    };

    // Touch event handlers for mobile
    const handleTouchStart = (e: TouchEvent) => {
      e.preventDefault();
      handleJump();
    };

    // Prevent scrolling and zooming on mobile
    const preventDefault = (e: TouchEvent) => {
      if (gameState === 'playing') {
        e.preventDefault();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    window.addEventListener('touchstart', handleTouchStart, { passive: false });
    window.addEventListener('touchmove', preventDefault, { passive: false });

    // Prevent body scroll when game is active
    if (gameState === 'playing') {
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
    } else {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
    }

    return () => {
      window.removeEventListener('keydown', handleKeyPress);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', preventDefault);
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
    };
  }, [handleJump, gameState]);

  return (
    <div 
      className="fixed inset-0 w-screen h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 overflow-hidden" 
      style={{ 
        fontFamily: 'Satoshi, Satoshi Variable, sans-serif',
        touchAction: 'none',
        WebkitOverflowScrolling: 'touch',
        overscrollBehavior: 'none'
      }}
    >
      {/* Error Header - Retro Terminal Style */}
      <div className="absolute top-6 md:top-8 left-0 right-0 z-10 text-center px-4">
        <div className="inline-block px-4 md:px-6 py-2 md:py-3 bg-white/95 border-2 border-[#255c79] rounded-lg shadow-lg">
          {isOffline ? (
            <>
              <h1 className="text-3xl md:text-5xl font-black text-[#255c79] font-mono tracking-wider">
                OFFLINE
                <span className="text-2xl md:text-4xl ml-2 text-[#0f2b46]">MODE</span>
              </h1>
              <p className="text-sm md:text-base text-[#1e4a63] mt-1 font-mono font-semibold">
                &gt; NO INTERNET CONNECTION
              </p>
              <p className="text-xs md:text-sm text-[#6b7280] mt-1 font-sans hidden md:block">
                You're offline! Play while you wait for connection to return.
              </p>
            </>
          ) : (
            <>
              <h1 className="text-3xl md:text-5xl font-black text-[#255c79] font-mono tracking-wider">
                404
                <span className="text-2xl md:text-4xl ml-2 text-[#0f2b46]">ERROR</span>
              </h1>
              <p className="text-sm md:text-base text-[#1e4a63] mt-1 font-mono font-semibold">
                &gt; PAGE NOT FOUND
              </p>
              <p className="text-xs md:text-sm text-[#6b7280] mt-1 font-sans hidden md:block">
                Looks like you took a wrong turn! Play while you find your way back.
              </p>
            </>
          )}
        </div>
      </div>

      <div className="w-full h-full flex items-center justify-center">
        <div className="relative w-full h-full">
          <canvas
            ref={canvasRef}
            width={canvasWidth}
            height={canvasHeight}
            className="w-full h-full cursor-pointer touch-none"
            onClick={handleJump}
            onTouchStart={(e) => {
              e.preventDefault();
              handleJump();
            }}
            style={{ 
              imageRendering: 'pixelated',
              touchAction: 'none',
              WebkitTouchCallout: 'none',
              WebkitUserSelect: 'none',
              userSelect: 'none'
            }}
          />

          {/* Start Screen - Retro Terminal Style */}
          {gameState === 'start' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 backdrop-blur-sm pointer-events-auto">
              <div className="relative bg-white rounded-lg border-4 border-[#255c79] p-6 md:p-8 max-w-2xl mx-4 shadow-2xl">
                {/* Corner decorations */}
                <div className="absolute -top-1 -left-1 w-3 h-3 bg-[#255c79]" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-[#255c79]" />
                <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-[#255c79]" />
                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-[#255c79]" />
                
                <h2 className="text-4xl md:text-6xl font-black text-center mb-4 font-mono text-[#255c79] tracking-wider">
                  LATE FOR CLASS?
                </h2>
                
                <p className="text-base md:text-xl text-[#1e4a63] mb-4 text-center font-mono font-semibold">
                  &gt; PRESS SPACE OR CLICK TO START
                </p>
                
                {highScore > 0 && (
                  <div className="mb-4 text-center">
                    <p className="text-xs md:text-sm text-[#6b7280] font-mono mb-1">
                      HIGH SCORE
                    </p>
                    <p className="text-2xl md:text-3xl font-black text-[#255c79] font-mono">
                      {highScore}
                    </p>
                  </div>
                )}
                
                <div className="flex flex-col md:flex-row gap-3 md:gap-4 justify-center">
                  <button
                    onClick={handleJump}
                    className="px-6 md:px-8 py-3 md:py-4 bg-[#255c79] text-white font-semibold text-base md:text-lg rounded-md hover:bg-[#1e4a63] transition-all duration-200 hover:scale-105 border-2 border-[#0f2b46] shadow-md"
                  >
                    START RUNNING
                  </button>
                  <button
                    onClick={() => router.push('/dashboard')}
                    className="px-6 md:px-8 py-3 md:py-4 bg-[#10b981] text-white font-semibold text-base md:text-lg rounded-md hover:bg-[#059669] transition-all duration-200 hover:scale-105 border-2 border-[#047857] shadow-md"
                  >
                    GO TO DASHBOARD
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Game Over Screen - Retro Terminal Style */}
          {gameState === 'gameover' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 backdrop-blur-sm pointer-events-auto">
              <div className="relative bg-white rounded-lg border-4 border-[#ea4335] p-6 md:p-8 max-w-2xl mx-4 shadow-2xl">
                {/* Corner decorations */}
                <div className="absolute -top-1 -left-1 w-3 h-3 bg-[#ea4335]" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-[#ea4335]" />
                <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-[#ea4335]" />
                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-[#ea4335]" />
                
                <h2 className="text-4xl md:text-6xl font-black text-center mb-4 font-mono text-[#ea4335] tracking-wider">
                  ASSIGNMENT FAILED
                </h2>
                
                <div className="bg-[#fef3c7] border-2 border-[#f59e0b] rounded-md p-4 md:p-6 mb-6 text-center">
                  <p className="text-xs md:text-sm text-[#92400e] mb-2 font-mono font-bold uppercase tracking-wider">
                    Final Grade
                  </p>
                  <p className="text-5xl md:text-7xl font-black text-[#ea4335] font-mono mb-2">
                    {displayScore}
                  </p>
                  <p className="text-sm md:text-base text-[#1e4a63] font-mono font-semibold mb-3">
                    Knowledge Points Earned
                  </p>
                  {highScore > 0 && (
                    <div className="mt-3 pt-3 border-t-2 border-[#f59e0b]">
                      <p className="text-xs md:text-sm text-[#92400e] mb-1 font-mono font-bold uppercase tracking-wider">
                        High Score
                      </p>
                      <p className="text-2xl md:text-3xl font-black text-[#255c79] font-mono">
                        {highScore}
                      </p>
                      {displayScore >= highScore && displayScore > 0 && (
                        <p className="text-xs text-[#10b981] mt-1 font-mono font-bold">
                          NEW RECORD!
                        </p>
                      )}
                    </div>
                  )}
                </div>
                
                <div className="flex flex-col md:flex-row gap-3 md:gap-4 justify-center">
                  <button
                    onClick={handleJump}
                    className="px-6 md:px-8 py-3 md:py-4 bg-[#10b981] text-white font-semibold text-base md:text-lg rounded-md hover:bg-[#059669] transition-all duration-200 hover:scale-105 border-2 border-[#047857] shadow-md"
                  >
                    RETAKE CLASS
                  </button>
                  <button
                    onClick={() => router.push('/dashboard')}
                    className="px-6 md:px-8 py-3 md:py-4 bg-[#255c79] text-white font-semibold text-base md:text-lg rounded-md hover:bg-[#1e4a63] transition-all duration-200 hover:scale-105 border-2 border-[#0f2b46] shadow-md"
                  >
                    GO TO DASHBOARD
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Score Display Overlay - Retro Terminal Style */}
          {gameState === 'playing' && (
            <div className="absolute top-40 md:top-44 left-0 right-0 text-center z-10 px-4">
              <div className="inline-block bg-white/95 border-2 border-[#255c79] rounded-lg px-3 md:px-5 py-1.5 md:py-2.5 shadow-lg">
                <div className="flex flex-col md:flex-row items-center justify-center gap-1.5 md:gap-2.5">
                  <span className="text-xs md:text-sm text-[#1e4a63] font-mono font-bold uppercase tracking-wider">
                    Knowledge Points:
                  </span>
                  <span className="text-xl md:text-3xl font-black text-[#255c79] font-mono">
                    {displayScore}
                  </span>
                </div>
                {isNightMode && (
                  <p className="text-xs text-[#6b7280] mt-0.5 font-mono">
                    &gt; Night Study Mode Activated
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
