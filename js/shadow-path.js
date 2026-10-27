/**
 * ITACHI - THE SHADOW PATH
 * Official Anime Platformer Game for AMATERASU X
 * Inspired by Akatsuki Itachi Uchiha & the Blood Moon
 */

(function (window) {
  'use strict';

  // Sound FX Synthesizer using Web Audio API
  class SoundFX {
    constructor() {
      this.ctx = null;
      this.enabled = true;
    }

    init() {
      if (!this.ctx) {
        try {
          const AudioContext = window.AudioContext || window.webkitAudioContext;
          if (AudioContext) this.ctx = new AudioContext();
        } catch (e) {}
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
    }

    jump() {
      if (!this.enabled || !this.ctx) return;
      try {
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(260, now);
        osc.frequency.exponentialRampToValueAtTime(620, now + 0.12);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.12);
      } catch (e) {}
    }

    candle() {
      if (!this.enabled || !this.ctx) return;
      try {
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(1046.5, now); // C6
        osc.frequency.setValueAtTime(1318.5, now + 0.06); // E6
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.22);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.22);
      } catch (e) {}
    }

    stomp() {
      if (!this.enabled || !this.ctx) return;
      try {
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(320, now);
        osc.frequency.exponentialRampToValueAtTime(90, now + 0.15);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.15);
      } catch (e) {}
    }

    hurt() {
      if (!this.enabled || !this.ctx) return;
      try {
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(220, now);
        osc.frequency.exponentialRampToValueAtTime(55, now + 0.25);
        gain.gain.setValueAtTime(0.35, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.25);
      } catch (e) {}
    }

    win() {
      if (!this.enabled || !this.ctx) return;
      try {
        const now = this.ctx.currentTime;
        const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
        notes.forEach((freq, idx) => {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, now + idx * 0.1);
          gain.gain.setValueAtTime(0.28, now + idx * 0.1);
          gain.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.1 + 0.25);
          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start(now + idx * 0.1);
          osc.stop(now + idx * 0.1 + 0.25);
        });
      } catch (e) {}
    }

    gameOver() {
      if (!this.enabled || !this.ctx) return;
      try {
        const now = this.ctx.currentTime;
        const notes = [440, 415.3, 369.99, 311.13]; // Descending ominous minor
        notes.forEach((freq, idx) => {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(freq, now + idx * 0.14);
          gain.gain.setValueAtTime(0.25, now + idx * 0.14);
          gain.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.14 + 0.3);
          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start(now + idx * 0.14);
          osc.stop(now + idx * 0.14 + 0.3);
        });
      } catch (e) {}
    }
  }

  // Asset Loader
  const ASSETS = {
    bgTitle: 'img/game/bg_title.png',
    bgLevel1: 'img/game/bg_level1.png',
    bgLevel2: 'img/game/bg_level2.png',
    bgLevel3: 'img/game/bg_level3.png',
    bgGameOver: 'img/game/bg_gameover.png',
    bgComplete: 'img/game/bg_complete.png',
    bgMap: 'img/game/bg_map.png',
    bgStats: 'img/game/bg_stats.png',
    spriteItachi: 'img/game/sprite_itachi.png',
    spriteCandle: 'img/game/sprite_candle.png',
    spriteAnbu: 'img/game/sprite_enemy_anbu.png',
    spriteHound: 'img/game/sprite_enemy_hound.png',
    spriteMadara: 'img/game/sprite_enemy_madara.png',
    hudAvatar: 'img/game/hud_avatar.png',
    akatsukiCloud: 'img/game/akatsuki_cloud.png',
  };

  const images = {};
  let assetsLoaded = false;

  function loadAssets(callback) {
    if (assetsLoaded) {
      if (callback) callback();
      return;
    }
    const keys = Object.keys(ASSETS);
    let loadedCount = 0;
    keys.forEach((k) => {
      const img = new Image();
      img.src = ASSETS[k];
      img.onload = () => {
        images[k] = img;
        loadedCount++;
        if (loadedCount === keys.length) {
          assetsLoaded = true;
          if (callback) callback();
        }
      };
      img.onerror = () => {
        images[k] = null;
        loadedCount++;
        if (loadedCount === keys.length) {
          assetsLoaded = true;
          if (callback) callback();
        }
      };
    });
  }

  // Factory function to create game instance
  function createShadowPathGame(mountEl, options = {}) {
    const sfx = new SoundFX();
    let container = null;
    let canvas = null;
    let ctx = null;
    let animId = null;

    // Game state: 'TITLE' | 'MAP' | 'STATS' | 'PLAYING' | 'PAUSED' | 'COMPLETE' | 'GAMEOVER'
    let state = 'TITLE';
    let currentStage = 1;
    let maxStageUnlocked = parseInt(localStorage.getItem('itachi_max_stage') || '1', 10);
    let totalCandles = parseInt(localStorage.getItem('itachi_candles') || '28', 10);
    let stageCandlesCollected = 0;
    let lives = 4;
    const maxLives = 4;

    // Upgrades
    let speedLevel = parseInt(localStorage.getItem('itachi_speed_lvl') || '3', 10);
    let jumpLevel = parseInt(localStorage.getItem('itachi_jump_lvl') || '4', 10);
    let powerLevel = parseInt(localStorage.getItem('itachi_power_lvl') || '3', 10);

    // Camera & Viewport
    let cameraX = 0;
    let worldWidth = 1800;
    const worldHeight = 520;
    let dpr = window.devicePixelRatio || 1;

    // Input state
    const input = {
      left: false,
      right: false,
      jump: false,
      jumpPressed: false,
    };

    // Particles list
    let particles = [];

    // Entities
    let player = null;
    let platforms = [];
    let candles = [];
    let enemies = [];
    let boss = null;
    let goalGate = null;

    // UI overlays
    let uiOverlay = null;

    // Helper: Save progress
    function saveProgress() {
      localStorage.setItem('itachi_candles', totalCandles.toString());
      localStorage.setItem('itachi_max_stage', maxStageUnlocked.toString());
      localStorage.setItem('itachi_speed_lvl', speedLevel.toString());
      localStorage.setItem('itachi_jump_lvl', jumpLevel.toString());
      localStorage.setItem('itachi_power_lvl', powerLevel.toString());

      // Submit score to global leaderboard
      if (options.onScore) {
        options.onScore(totalCandles);
      } else {
        try {
          const nm = localStorage.getItem('displayName') || 'Itachi_Shinobi';
          fetch('/api/scores', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: nm,
              score: totalCandles,
              game: 'itachi',
              month: new Date().toISOString().slice(0, 7),
            }),
          }).catch(() => {});
        } catch (e) {}
      }
    }

    // Build Stage
    function setupStage(stageNum) {
      currentStage = stageNum;
      stageCandlesCollected = 0;
      lives = maxLives;
      cameraX = 0;
      particles = [];

      // Base move speed based on upgrade
      const moveSpeed = 3.6 + speedLevel * 0.35;
      const jumpStrength = 11.5 + jumpLevel * 0.35;

      player = {
        x: 60,
        y: 290,
        width: 32,
        height: 48,
        vx: 0,
        vy: 0,
        speed: moveSpeed,
        jumpForce: jumpStrength,
        grounded: false,
        facing: 1, // 1: right, -1: left
        invulnerableTimer: 0,
        jumpsLeft: 2, // Double jump!
        state: 'idle', // 'idle', 'run', 'jump', 'fall'
        frameTimer: 0,
      };

      platforms = [];
      candles = [];
      enemies = [];
      boss = null;

      if (stageNum === 1) {
        // STAGE 1: Konoha Outskirts (Blood Moon Night)
        worldWidth = 1900;

        // Ground segments (y = 350, fully visible with 70px base)
        platforms.push({ x: 0, y: 350, w: 480, h: 75, type: 'ground' });
        platforms.push({ x: 560, y: 350, w: 460, h: 75, type: 'ground' });
        platforms.push({ x: 1100, y: 350, w: 800, h: 75, type: 'ground' });

        // Floating Akatsuki platforms
        platforms.push({ x: 180, y: 265, w: 120, h: 20, type: 'float' });
        platforms.push({ x: 350, y: 185, w: 140, h: 20, type: 'float' });
        platforms.push({ x: 560, y: 260, w: 120, h: 20, type: 'float' });
        platforms.push({ x: 740, y: 180, w: 150, h: 20, type: 'float' });
        platforms.push({ x: 950, y: 255, w: 130, h: 20, type: 'float' });
        platforms.push({ x: 1180, y: 270, w: 140, h: 20, type: 'float' });
        platforms.push({ x: 1380, y: 190, w: 150, h: 20, type: 'float' });
        platforms.push({ x: 1590, y: 260, w: 140, h: 20, type: 'float' });

        // Candles (15 in stage 1, clearly placed above platforms and along arcs)
        const candleLocs = [
          [200, 225], [240, 225], [370, 145], [410, 145], [450, 145],
          [580, 220], [760, 140], [800, 140], [840, 140], [970, 215],
          [1200, 230], [1400, 150], [1440, 150], [1480, 150], [1610, 220]
        ];
        candleLocs.forEach(([cx, cy]) => {
          candles.push({ x: cx, y: cy, w: 16, h: 26, collected: false, hoverOffset: Math.random() * Math.PI * 2 });
        });

        // Enemies: 4 Anbu Mask Ninjas (walking directly on the visible ground & mid-ledges)
        enemies.push({
          x: 280, y: 306, w: 32, h: 44, type: 'anbu',
          minX: 160, maxX: 460, speed: 1.4, vx: 1.4, alive: true
        });
        enemies.push({
          x: 750, y: 306, w: 32, h: 44, type: 'anbu',
          minX: 580, maxX: 980, speed: 1.6, vx: -1.6, alive: true
        });
        enemies.push({
          x: 1260, y: 306, w: 32, h: 44, type: 'anbu',
          minX: 1140, maxX: 1540, speed: 1.8, vx: 1.8, alive: true
        });
        enemies.push({
          x: 1400, y: 146, w: 32, h: 44, type: 'anbu',
          minX: 1380, maxX: 1510, speed: 1.2, vx: 1.2, alive: true
        });

        // Finish Torii Gate (firmly planted on the ground at y=250 to 350)
        goalGate = { x: 1750, y: 250, w: 60, h: 100 };

      } else if (stageNum === 2) {
        // STAGE 2: The Hokage Monument & Mist Valley (Night Blue)
        worldWidth = 2300;

        // Ground segments
        platforms.push({ x: 0, y: 350, w: 400, h: 75, type: 'ground' });
        platforms.push({ x: 500, y: 350, w: 380, h: 75, type: 'ground' });
        platforms.push({ x: 980, y: 350, w: 440, h: 75, type: 'ground' });
        platforms.push({ x: 1520, y: 350, w: 780, h: 75, type: 'ground' });

        // Stepped mountain platforms & moving platforms
        platforms.push({ x: 200, y: 265, w: 110, h: 20, type: 'float' });
        platforms.push({ x: 360, y: 185, w: 120, h: 20, type: 'float' });
        platforms.push({ x: 470, y: 115, w: 120, h: 20, type: 'float' });

        // Moving platform
        platforms.push({
          x: 660, y: 220, w: 110, h: 20, type: 'moving',
          minX: 630, maxX: 860, vx: 1.5
        });

        platforms.push({ x: 900, y: 175, w: 120, h: 20, type: 'float' });
        platforms.push({ x: 1080, y: 260, w: 130, h: 20, type: 'float' });

        // Second moving platform
        platforms.push({
          x: 1420, y: 230, w: 120, h: 20, type: 'moving',
          minX: 1400, maxX: 1650, vx: -1.8
        });

        platforms.push({ x: 1720, y: 270, w: 120, h: 20, type: 'float' });
        platforms.push({ x: 1890, y: 195, w: 130, h: 20, type: 'float' });

        // 22 Candles
        const candleLocs2 = [
          [220, 225], [380, 145], [490, 75], [530, 75],
          [680, 180], [720, 180], [920, 135], [960, 135],
          [1100, 220], [1140, 220], [1440, 190], [1480, 190],
          [1740, 230], [1780, 230], [1910, 155], [1950, 155],
          [250, 310], [600, 310], [750, 310], [1150, 310], [1650, 310], [1800, 310]
        ];
        candleLocs2.forEach(([cx, cy]) => {
          candles.push({ x: cx, y: cy, w: 16, h: 26, collected: false, hoverOffset: Math.random() * Math.PI * 2 });
        });

        // Enemies: 2 Anbu + 2 Fast Shadow Hounds (all on visible ground floor)
        enemies.push({
          x: 220, y: 306, w: 32, h: 44, type: 'anbu',
          minX: 80, maxX: 380, speed: 1.5, vx: 1.5, alive: true
        });
        enemies.push({
          x: 640, y: 314, w: 40, h: 36, type: 'hound',
          minX: 520, maxX: 860, speed: 2.8, vx: 2.8, alive: true
        });
        enemies.push({
          x: 1080, y: 306, w: 32, h: 44, type: 'anbu',
          minX: 1000, maxX: 1400, speed: 1.8, vx: -1.8, alive: true
        });
        enemies.push({
          x: 1680, y: 314, w: 40, h: 36, type: 'hound',
          minX: 1540, maxX: 1980, speed: 3.0, vx: -3.0, alive: true
        });

        // Finish Torii Gate
        goalGate = { x: 2150, y: 250, w: 60, h: 100 };

      } else {
        // STAGE 3: The Crimson Moon Boss Arena (Madara Uchiha)
        worldWidth = 1200;

        // Arena ground
        platforms.push({ x: 0, y: 350, w: 1200, h: 75, type: 'ground' });

        // Floating battle ledges
        platforms.push({ x: 120, y: 255, w: 140, h: 20, type: 'float' });
        platforms.push({ x: 300, y: 175, w: 160, h: 20, type: 'float' });
        platforms.push({ x: 500, y: 245, w: 180, h: 20, type: 'float' });
        platforms.push({ x: 740, y: 165, w: 160, h: 20, type: 'float' });
        platforms.push({ x: 920, y: 255, w: 150, h: 20, type: 'float' });

        // 18 Sacred Candles
        const candleLocs3 = [
          [140, 215], [180, 215], [220, 215],
          [320, 135], [360, 135], [400, 135],
          [540, 205], [580, 205], [620, 205],
          [760, 125], [800, 125], [840, 125],
          [940, 215], [980, 215], [1020, 215],
          [200, 310], [450, 310], [800, 310]
        ];
        candleLocs3.forEach(([cx, cy]) => {
          candles.push({ x: cx, y: cy, w: 16, h: 26, collected: false, hoverOffset: Math.random() * Math.PI * 2 });
        });

        // Madara Boss (rests right on ground floor at y=280)
        boss = {
          name: 'Madara Uchiha',
          x: 750,
          y: 280,
          w: 48,
          h: 70,
          hp: 5,
          maxHp: 5,
          vx: 1.5,
          minX: 450,
          maxX: 1050,
          attackTimer: 0,
          fireballs: [],
          hitTimer: 0,
          alive: true
        };

        // Finish Sanctuary (unlocked after Madara defeated)
        goalGate = { x: 1080, y: 250, w: 60, h: 100, locked: true };
      }
    }

    // Spawn Crow Feathers Particle Effect
    function spawnCrowFeathers(x, y, count = 8, color = '#EF2D3D') {
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const spd = 1 + Math.random() * 3.5;
        particles.push({
          x,
          y,
          vx: Math.cos(angle) * spd,
          vy: Math.sin(angle) * spd - 1.5,
          size: 3 + Math.random() * 4,
          alpha: 1,
          color: Math.random() > 0.4 ? '#05070B' : color,
          type: 'feather',
          decay: 0.02 + Math.random() * 0.02,
        });
      }
    }

    // Spawn Candle Sparkles
    function spawnCandleSparkles(x, y) {
      for (let i = 0; i < 10; i++) {
        const angle = Math.random() * Math.PI * 2;
        const spd = 0.8 + Math.random() * 2.5;
        particles.push({
          x,
          y,
          vx: Math.cos(angle) * spd,
          vy: Math.sin(angle) * spd - 2,
          size: 2 + Math.random() * 3,
          alpha: 1,
          color: Math.random() > 0.3 ? '#FFA000' : '#FFD700',
          type: 'spark',
          decay: 0.035,
        });
      }
    }

    // Handle Player Damage
    function hurtPlayer() {
      if (player.invulnerableTimer > 0) return;
      lives--;
      player.invulnerableTimer = 65; // ~1.1s invulnerability
      player.vy = -6;
      player.vx = -player.facing * 4;
      sfx.hurt();
      spawnCrowFeathers(player.x + 16, player.y + 24, 12, '#EF2D3D');

      if (lives <= 0) {
        // Game Over
        state = 'GAMEOVER';
        sfx.gameOver();
        saveProgress();
        renderOverlay();
      }
    }

    // Physics & Game Loop Update
    function update() {
      if (state !== 'PLAYING') return;

      // 1. Moving platforms
      platforms.forEach((p) => {
        if (p.type === 'moving') {
          p.x += p.vx;
          if (p.x <= p.minX || p.x + p.w >= p.maxX) {
            p.vx *= -1;
          }
        }
      });

      // 2. Player Controls & Horizontal Velocity
      if (input.left) {
        player.vx = -player.speed;
        player.facing = -1;
      } else if (input.right) {
        player.vx = player.speed;
        player.facing = 1;
      } else {
        player.vx *= 0.72; // friction
        if (Math.abs(player.vx) < 0.1) player.vx = 0;
      }

      // 3. Jump action
      if (input.jumpPressed) {
        input.jumpPressed = false;
        if (player.grounded) {
          player.vy = -player.jumpForce;
          player.grounded = false;
          player.jumpsLeft = 1;
          sfx.jump();
          spawnCrowFeathers(player.x + 16, player.y + 44, 6, '#EF2D3D');
        } else if (player.jumpsLeft > 0) {
          // Double Jump (Crow Dash)
          player.vy = -player.jumpForce * 0.92;
          player.jumpsLeft = 0;
          sfx.jump();
          spawnCrowFeathers(player.x + 16, player.y + 30, 10, '#05070B');
        }
      }

      // Gravity
      player.vy += 0.58;
      if (player.vy > 12) player.vy = 12;

      // Update Invulnerability
      if (player.invulnerableTimer > 0) {
        player.invulnerableTimer--;
      }

      // Horizontal movement & boundary
      player.x += player.vx;
      if (player.x < 0) player.x = 0;
      if (player.x + player.width > worldWidth) player.x = worldWidth - player.width;

      // Vertical movement & Platform Collision
      player.y += player.vy;
      player.grounded = false;

      platforms.forEach((p) => {
        // Check collision from above
        if (
          player.x + player.width > p.x + 4 &&
          player.x < p.x + p.w - 4 &&
          player.y + player.height >= p.y &&
          player.y + player.height <= p.y + p.h + player.vy + 2 &&
          player.vy >= 0
        ) {
          player.y = p.y - player.height;
          player.vy = 0;
          player.grounded = true;
          player.jumpsLeft = 2;

          // If on moving platform, ride it
          if (p.type === 'moving') {
            player.x += p.vx;
          }
        }
      });

      // Pit death
      if (player.y > 390) {
        hurtPlayer();
        player.x = Math.max(60, player.x - 120);
        player.y = 280;
        player.vy = 0;
      }

      // Player Animation State
      if (!player.grounded) {
        player.state = player.vy < 0 ? 'jump' : 'fall';
      } else if (Math.abs(player.vx) > 0.4) {
        player.state = 'run';
        player.frameTimer++;
      } else {
        player.state = 'idle';
      }

      // 4. Candle Collection
      candles.forEach((c) => {
        if (!c.collected) {
          // Collision box
          if (
            player.x + player.width > c.x &&
            player.x < c.x + c.w &&
            player.y + player.height > c.y &&
            player.y < c.y + c.h
          ) {
            c.collected = true;
            stageCandlesCollected++;
            totalCandles++;
            sfx.candle();
            spawnCandleSparkles(c.x + 8, c.y + 12);
            saveProgress();
          }
        }
      });

      // 5. Enemies AI & Collision
      enemies.forEach((en) => {
        if (!en.alive) return;
        en.x += en.vx;
        if (en.x <= en.minX || en.x + en.w >= en.maxX) {
          en.vx *= -1;
        }

        // Collision with player
        if (
          player.x + player.width > en.x + 4 &&
          player.x < en.x + en.w - 4 &&
          player.y + player.height > en.y + 4 &&
          player.y < en.y + en.h
        ) {
          // Check if player jumped on enemy's head (Stomp defeat)
          if (player.vy > 0 && player.y + player.height < en.y + 20) {
            en.alive = false;
            player.vy = -8.5; // bounce
            sfx.stomp();
            spawnCrowFeathers(en.x + 16, en.y + 16, 12, '#EF2D3D');
            totalCandles += 2; // enemy defeat bonus
            stageCandlesCollected += 2;
            saveProgress();
          } else {
            // Player takes damage
            hurtPlayer();
          }
        }
      });

      // 6. Boss AI (Stage 3 - Madara Uchiha)
      if (boss && boss.alive) {
        boss.x += boss.vx;
        if (boss.x <= boss.minX || boss.x + boss.w >= boss.maxX) {
          boss.vx *= -1;
        }

        if (boss.hitTimer > 0) boss.hitTimer--;

        // Boss fireball casting
        boss.attackTimer++;
        if (boss.attackTimer >= 140) {
          boss.attackTimer = 0;
          const dir = player.x < boss.x ? -1 : 1;
          boss.fireballs.push({
            x: boss.x + (dir === -1 ? -10 : boss.w + 10),
            y: boss.y + 24,
            vx: dir * 4.2,
            radius: 9,
            life: 150,
          });
          spawnCrowFeathers(boss.x + 24, boss.y + 30, 8, '#FFA000');
        }

        // Update fireballs
        for (let i = boss.fireballs.length - 1; i >= 0; i--) {
          const fb = boss.fireballs[i];
          fb.x += fb.vx;
          fb.life--;

          // Check hit with player
          const dist = Math.hypot(player.x + 16 - fb.x, player.y + 24 - fb.y);
          if (dist < fb.radius + 16) {
            hurtPlayer();
            boss.fireballs.splice(i, 1);
            continue;
          }

          if (fb.life <= 0 || fb.x < 0 || fb.x > worldWidth) {
            boss.fireballs.splice(i, 1);
          }
        }

        // Stomp boss head
        if (
          boss.hitTimer === 0 &&
          player.x + player.width > boss.x + 4 &&
          player.x < boss.x + boss.w - 4 &&
          player.y + player.height > boss.y &&
          player.y < boss.y + boss.h
        ) {
          if (player.vy > 0 && player.y + player.height < boss.y + 24) {
            boss.hp--;
            boss.hitTimer = 45;
            player.vy = -9;
            sfx.stomp();
            spawnCrowFeathers(boss.x + 24, boss.y + 20, 16, '#EF2D3D');

            if (boss.hp <= 0) {
              boss.alive = false;
              goalGate.locked = false;
              sfx.win();
              spawnCrowFeathers(boss.x + 24, boss.y + 24, 30, '#EF2D3D');
              totalCandles += 25; // Boss victory bonus!
              stageCandlesCollected += 25;
              saveProgress();
            }
          } else {
            hurtPlayer();
          }
        }
      }

      // 7. Torii Gate Victory Check
      if (goalGate && (!goalGate.locked || (boss && !boss.alive))) {
        if (
          player.x + player.width > goalGate.x + 10 &&
          player.x < goalGate.x + goalGate.w - 10 &&
          player.y + player.height > goalGate.y
        ) {
          // Level Completed!
          state = 'COMPLETE';
          sfx.win();
          if (currentStage >= maxStageUnlocked && maxStageUnlocked < 3) {
            maxStageUnlocked = currentStage + 1;
          }
          saveProgress();
          renderOverlay();
        }
      }

      // 8. Particles update
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= p.decay;
        if (p.type === 'feather') {
          p.vy += 0.08; // feather slow drift
          p.vx *= 0.96;
        }
        if (p.alpha <= 0) {
          particles.splice(i, 1);
        }
      }

      // 9. Camera Follow
      const viewW = canvas.width / dpr;
      const targetCamX = player.x - viewW * 0.38;
      cameraX += (targetCamX - cameraX) * 0.1;
      if (cameraX < 0) cameraX = 0;
      if (cameraX > worldWidth - viewW) cameraX = worldWidth - viewW;
    }

    // Render Canvas
    function draw() {
      const viewW = canvas.width / dpr;
      const viewH = canvas.height / dpr;

      ctx.clearRect(0, 0, viewW, viewH);

      // 1. Draw Background Image (Parallax for each distinct stage)
      let bgImg = images.bgLevel1;
      let stageTheme = {
        stroke: '#EF2D3D',
        glow: '#FF2638',
        edge: '#FF4D5A',
        rune: 'rgba(239, 45, 61, 0.25)',
        mistTop: 'rgba(239, 45, 61, 0)',
        mistBot: 'rgba(8, 13, 20, 0.88)'
      };

      if (currentStage === 2) {
        bgImg = images.bgLevel2;
        stageTheme = {
          stroke: '#38BDF8',
          glow: '#00E5FF',
          edge: '#7DD3FC',
          rune: 'rgba(56, 189, 248, 0.25)',
          mistTop: 'rgba(14, 165, 233, 0)',
          mistBot: 'rgba(6, 11, 20, 0.9)'
        };
      } else if (currentStage === 3) {
        bgImg = images.bgLevel3;
        stageTheme = {
          stroke: '#FF1744',
          glow: '#FF5252',
          edge: '#FF8A80',
          rune: 'rgba(255, 23, 68, 0.3)',
          mistTop: 'rgba(255, 23, 68, 0)',
          mistBot: 'rgba(7, 9, 14, 0.95)'
        };
      }

      if (bgImg && bgImg.complete) {
        const bgParallax = (cameraX * 0.18) % viewW;
        const bgW = viewW * 1.35;
        ctx.drawImage(bgImg, -bgParallax, 0, bgW, viewH);
        if (-bgParallax + bgW < viewW) {
          ctx.drawImage(bgImg, -bgParallax + bgW, 0, bgW, viewH);
        }
      } else {
        // Fallback procedural background
        const grad = ctx.createLinearGradient(0, 0, 0, viewH);
        grad.addColorStop(0, currentStage === 2 ? '#07162c' : '#140306');
        grad.addColorStop(0.5, currentStage === 2 ? '#0c2340' : '#28060B');
        grad.addColorStop(1, '#080D14');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, viewW, viewH);

        // Moon
        ctx.beginPath();
        ctx.arc(viewW * 0.65, 80, 48, 0, Math.PI * 2);
        ctx.fillStyle = currentStage === 2 ? '#BAE6FD' : '#EF2D3D';
        ctx.shadowColor = currentStage === 2 ? '#38BDF8' : '#FF2638';
        ctx.shadowBlur = 30;
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      // Stage atmospheric night mist overlay
      const mistGrad = ctx.createLinearGradient(0, viewH - 110, 0, viewH);
      mistGrad.addColorStop(0, stageTheme.mistTop);
      mistGrad.addColorStop(1, stageTheme.mistBot);
      ctx.fillStyle = mistGrad;
      ctx.fillRect(0, viewH - 110, viewW, 110);

      ctx.save();
      let cameraY = 0;
      if (viewH < 380) {
        cameraY = Math.max(0, player.y - (viewH - 100));
      }
      ctx.translate(-Math.floor(cameraX), -Math.floor(cameraY));

      // 2. Draw Platforms (Themed by stage)
      platforms.forEach((p) => {
        // Stone slab body
        ctx.fillStyle = '#141824';
        ctx.strokeStyle = stageTheme.stroke;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(p.x, p.y, p.w, p.h, [4, 4, 0, 0]);
        ctx.fill();
        ctx.stroke();

        // Platform rune bar
        ctx.fillStyle = stageTheme.rune;
        ctx.fillRect(p.x + 2, p.y + 2, p.w - 4, 5);

        // Platform neon edge glow
        ctx.shadowColor = stageTheme.glow;
        ctx.shadowBlur = 6;
        ctx.fillStyle = stageTheme.edge;
        ctx.fillRect(p.x + 4, p.y, p.w - 8, 2);
        ctx.shadowBlur = 0;
      });

      // 3. Draw Goal Torii Gate
      if (goalGate) {
        const gx = goalGate.x;
        const gy = goalGate.y;

        ctx.save();
        ctx.shadowColor = goalGate.locked ? '#555' : '#FF2638';
        ctx.shadowBlur = 15;

        // Torii Gate Pillars
        ctx.fillStyle = goalGate.locked ? '#444' : '#EF2D3D';
        ctx.fillRect(gx + 6, gy + 15, 10, 85);
        ctx.fillRect(gx + goalGate.w - 16, gy + 15, 10, 85);

        // Top lintel
        ctx.fillRect(gx - 4, gy + 4, goalGate.w + 8, 12);
        ctx.fillRect(gx + 2, gy + 22, goalGate.w - 4, 8);

        // Portal Glow if unlocked
        if (!goalGate.locked) {
          const portalGrad = ctx.createRadialGradient(gx + 30, gy + 55, 5, gx + 30, gy + 55, 32);
          portalGrad.addColorStop(0, 'rgba(255, 77, 90, 0.7)');
          portalGrad.addColorStop(1, 'rgba(239, 45, 61, 0)');
          ctx.fillStyle = portalGrad;
          ctx.fillRect(gx + 12, gy + 26, 36, 70);

          // "NEXT" text
          ctx.font = 'bold 10px sans-serif';
          ctx.fillStyle = '#FFFFFF';
          ctx.textAlign = 'center';
          ctx.fillText('PORTAL', gx + 30, gy + 60);
        }
        ctx.restore();
      }

      // 4. Draw Candlesticks
      candles.forEach((c) => {
        if (c.collected) return;
        const hoverY = c.y + Math.sin(Date.now() * 0.005 + c.hoverOffset) * 3;

        if (images.spriteCandle && images.spriteCandle.complete) {
          ctx.drawImage(images.spriteCandle, c.x - 4, hoverY - 4, 24, 32);
        } else {
          // Procedural Candle
          ctx.fillStyle = '#D32F2F';
          ctx.fillRect(c.x + 3, hoverY + 8, 10, 18);
          // Golden Flame
          ctx.shadowColor = '#FFA000';
          ctx.shadowBlur = 10;
          ctx.fillStyle = '#FFD54F';
          ctx.beginPath();
          ctx.arc(c.x + 8, hoverY + 5, 4, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      });

      // 5. Draw Enemies
      enemies.forEach((en) => {
        if (!en.alive) return;
        ctx.save();
        const enFacing = en.vx > 0 ? 1 : -1;

        if (en.type === 'hound') {
          // Hound sprite
          if (images.spriteHound && images.spriteHound.complete) {
            ctx.translate(en.x + (enFacing === -1 ? en.w : 0), en.y);
            ctx.scale(enFacing, 1);
            ctx.drawImage(images.spriteHound, 0, 0, en.w, en.h);
          } else {
            ctx.fillStyle = '#111';
            ctx.fillRect(en.x, en.y, en.w, en.h);
          }
        } else {
          // Anbu Mask Ninja sprite
          if (images.spriteAnbu && images.spriteAnbu.complete) {
            ctx.translate(en.x + (enFacing === -1 ? en.w : 0), en.y);
            ctx.scale(enFacing, 1);
            ctx.drawImage(images.spriteAnbu, 0, 0, en.w, en.h);
          } else {
            ctx.fillStyle = '#222';
            ctx.fillRect(en.x, en.y, en.w, en.h);
          }
        }
        ctx.restore();
      });

      // 6. Draw Boss (Madara Uchiha)
      if (boss && boss.alive) {
        ctx.save();
        if (boss.hitTimer > 0 && Math.floor(Date.now() / 60) % 2 === 0) {
          ctx.globalAlpha = 0.5; // hurt flash
        }

        const bFacing = player.x < boss.x ? -1 : 1;
        ctx.translate(boss.x + (bFacing === -1 ? boss.w : 0), boss.y);
        ctx.scale(bFacing, 1);

        if (images.spriteMadara && images.spriteMadara.complete) {
          ctx.drawImage(images.spriteMadara, 0, 0, boss.w, boss.h);
        } else {
          ctx.fillStyle = '#8B0000';
          ctx.fillRect(0, 0, boss.w, boss.h);
        }
        ctx.restore();

        // Boss Health Bar above boss
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillRect(boss.x - 10, boss.y - 18, boss.w + 20, 8);
        ctx.fillStyle = '#EF2D3D';
        const hpPct = boss.hp / boss.maxHp;
        ctx.fillRect(boss.x - 9, boss.y - 17, (boss.w + 18) * hpPct, 6);

        // Boss Fireballs
        boss.fireballs.forEach((fb) => {
          ctx.save();
          ctx.shadowColor = '#FF4500';
          ctx.shadowBlur = 12;
          ctx.fillStyle = '#FF5722';
          ctx.beginPath();
          ctx.arc(fb.x, fb.y, fb.radius, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#FFF700';
          ctx.beginPath();
          ctx.arc(fb.x, fb.y, fb.radius * 0.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        });
      }

      // 7. Draw Player (Chibi Itachi)
      if (player) {
        ctx.save();
        // Invulnerability flicker
        if (player.invulnerableTimer > 0 && Math.floor(Date.now() / 50) % 2 === 0) {
          ctx.globalAlpha = 0.4;
        }

        ctx.translate(player.x + (player.facing === -1 ? player.width : 0), player.y);
        ctx.scale(player.facing, 1);

        // Cloak Flutter tilt when running or jumping
        if (player.state === 'run') {
          const bob = Math.sin(player.frameTimer * 0.3) * 2;
          ctx.translate(0, bob);
        } else if (player.state === 'jump') {
          ctx.rotate(0.08);
        }

        if (images.spriteItachi && images.spriteItachi.complete) {
          ctx.drawImage(images.spriteItachi, -4, -4, player.width + 8, player.height + 8);
        } else {
          // Procedural Chibi Itachi (Black Akatsuki Cloak, Sharingan eyes)
          ctx.fillStyle = '#080D14';
          ctx.fillRect(0, 16, player.width, 32); // Cloak
          ctx.fillStyle = '#EF2D3D';
          ctx.fillRect(4, 22, 10, 6); // Red Akatsuki cloud motif
          // Head & Hair
          ctx.fillStyle = '#FFD2B2';
          ctx.fillRect(6, 4, 20, 14);
          ctx.fillStyle = '#05070B';
          ctx.fillRect(4, 0, 24, 8); // Hair
          // Sharingan Eyes
          ctx.fillStyle = '#EF2D3D';
          ctx.fillRect(16, 9, 4, 3);
        }

        ctx.restore();
      }

      // 8. Draw Particles
      particles.forEach((p) => {
        ctx.save();
        ctx.globalAlpha = Math.max(0, p.alpha);
        ctx.fillStyle = p.color;
        if (p.type === 'feather') {
          ctx.beginPath();
          ctx.ellipse(p.x, p.y, p.size, p.size * 0.4, p.vx * 0.2, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      });

      ctx.restore(); // restore camera
    }

    // Top HUD Bar Renderer
    let lastLives = -1;
    let lastCandles = -1;

    function updateHUD() {
      if (lives !== lastLives) {
        lastLives = lives;
        const heartsEl = container.querySelector('#spHearts');
        if (heartsEl) {
          heartsEl.textContent = Array.from({ length: maxLives })
            .map((_, i) => (i < lives ? '❤️' : '🖤'))
            .join('');
        }
      }
      if (totalCandles !== lastCandles) {
        lastCandles = totalCandles;
        const candlesEl = container.querySelector('#spCandleCount');
        if (candlesEl) {
          candlesEl.textContent = totalCandles;
        }
      }
    }

    // Overlay Screen Renderer (Title, Map, Stats, Game Over, Level Complete, Pause)
    function renderOverlay() {
      if (!uiOverlay) return;

      if (state === 'PLAYING') {
        uiOverlay.style.display = 'none';
        uiOverlay.innerHTML = '';
        return;
      }

      uiOverlay.style.display = 'flex';

      if (state === 'TITLE') {
        // Start Cover Screen (Phone 1 Mockup)
        uiOverlay.innerHTML = `
          <div class="sp-modal-content" style="background: radial-gradient(circle at center, rgba(160,10,25,0.4) 0%, rgba(8,13,20,0.98) 75%), url('${ASSETS.bgTitle}') center/cover no-repeat; padding:24px 20px; border-radius:12px; text-align:center; border:1px solid rgba(239,45,61,0.5); box-shadow:0 0 35px rgba(239,45,61,0.3); width:100%; max-width:340px; margin:auto;">
            <div style="display:flex; justify-content:center; margin-bottom:12px;">
              <img src="${ASSETS.akatsukiCloud}" style="height:38px; filter:drop-shadow(0 0 8px rgba(239,45,61,0.8));" onerror="this.style.display='none'" />
            </div>
            
            <h1 style="font-family:'Space Grotesk',sans-serif; font-size:26px; font-weight:900; color:#FFFFFF; letter-spacing:2px; margin:0 0 4px; text-transform:uppercase;">
              ITACHI
            </h1>
            <div style="font-size:12px; font-weight:800; color:#EF2D3D; letter-spacing:3px; text-transform:uppercase; margin-bottom:14px;">
              THE SHADOW PATH
            </div>

            <div style="font-size:11px; color:#CBD5E1; line-height:1.6; margin-bottom:20px; letter-spacing:0.8px;">
              COLLECT THE CANDLES<br>
              AVOID THE ENEMIES<br>
              REACH THE END
            </div>

            <button class="btn gold full" id="spStartBtn" style="padding:14px; font-size:15px; font-weight:900; letter-spacing:1.5px; border-radius:8px; margin-bottom:10px; background:linear-gradient(135deg, #EF2D3D, #9C0E1A); border:1px solid #FF4D5A; box-shadow:0 0 15px rgba(239,45,61,0.6);">
              TAP TO START
            </button>

            <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-top:12px;">
              <button class="btn ghost sm" id="spNavMapBtn" style="font-size:12px; font-weight:700; border-color:rgba(255,255,255,0.2);">
                🗺️ World Map
              </button>
              <button class="btn ghost sm" id="spNavStatsBtn" style="font-size:12px; font-weight:700; border-color:rgba(255,255,255,0.2);">
                ⚡ Shinobi Stats
              </button>
            </div>
          </div>
        `;

        uiOverlay.querySelector('#spStartBtn').onclick = () => {
          sfx.init();
          setupStage(currentStage);
          state = 'PLAYING';
          renderOverlay();
        };
        uiOverlay.querySelector('#spNavMapBtn').onclick = () => {
          sfx.init();
          state = 'MAP';
          renderOverlay();
        };
        uiOverlay.querySelector('#spNavStatsBtn').onclick = () => {
          sfx.init();
          state = 'STATS';
          renderOverlay();
        };

      } else if (state === 'MAP') {
        // World Map Screen (Phone 7 Mockup)
        uiOverlay.innerHTML = `
          <div class="sp-modal-content" style="background: radial-gradient(circle at top, rgba(239,45,61,0.2) 0%, rgba(8,13,20,0.98) 70%), url('${ASSETS.bgMap}') center/cover no-repeat; padding:20px 16px; border-radius:12px; border:1px solid rgba(239,45,61,0.4); width:100%; max-width:340px; margin:auto; text-align:center;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
              <button class="btn ghost sm" id="spMapBack" style="font-size:12px;">← Back</button>
              <div style="display:flex; align-items:center; gap:5px; background:rgba(0,0,0,0.6); padding:2px 8px; border-radius:10px; border:1px solid rgba(255,160,0,0.4);">
                <span>🕯️</span><b style="color:#FFD54F; font-size:13px;">${totalCandles}</b>
              </div>
            </div>

            <h2 style="font-family:'Space Grotesk',sans-serif; font-size:18px; font-weight:800; color:#FFF; margin:0 0 2px;">
              WORLD 1
            </h2>
            <div style="font-size:11px; color:#EF2D3D; letter-spacing:1px; margin-bottom:16px;">
              THE UCHIHA PATH
            </div>

            <!-- Stages Nodes -->
            <div style="display:flex; flex-direction:column; gap:10px; margin-bottom:18px;">
              <div class="sp-stage-node" data-stage="1" style="display:flex; align-items:center; justify-content:space-between; padding:10px 14px; background:rgba(20,25,38,0.85); border:1px solid #00E676; border-radius:8px; cursor:pointer;">
                <div style="display:flex; align-items:center; gap:10px;">
                  <span style="font-size:18px;">🏮</span>
                  <div style="text-align:left;">
                    <b style="font-size:13px; color:#FFF; display:block;">Stage 1: Konoha Outskirts</b>
                    <small style="color:#00E676; font-size:10px;">COMPLETED ✓</small>
                  </div>
                </div>
                <button class="btn gold sm" style="padding:4px 10px; font-size:11px;">PLAY</button>
              </div>

              <div class="sp-stage-node" data-stage="2" style="display:flex; align-items:center; justify-content:space-between; padding:10px 14px; background:rgba(20,25,38,0.85); border:1px solid ${maxStageUnlocked >= 2 ? '#38BDF8' : 'rgba(255,255,255,0.1)'}; border-radius:8px; cursor:${maxStageUnlocked >= 2 ? 'pointer' : 'not-allowed'}; opacity:${maxStageUnlocked >= 2 ? '1' : '0.5'};">
                <div style="display:flex; align-items:center; gap:10px;">
                  <span style="font-size:18px;">🐺</span>
                  <div style="text-align:left;">
                    <b style="font-size:13px; color:#FFF; display:block;">Stage 2: Mist Valley</b>
                    <small style="color:#8E9AA8; font-size:10px;">${maxStageUnlocked >= 2 ? 'UNLOCKED' : 'LOCKED 🔒'}</small>
                  </div>
                </div>
                ${maxStageUnlocked >= 2 ? '<button class="btn gold sm" style="padding:4px 10px; font-size:11px;">PLAY</button>' : '🔒'}
              </div>

              <div class="sp-stage-node" data-stage="3" style="display:flex; align-items:center; justify-content:space-between; padding:10px 14px; background:rgba(20,25,38,0.85); border:1px solid ${maxStageUnlocked >= 3 ? '#EF2D3D' : 'rgba(255,255,255,0.1)'}; border-radius:8px; cursor:${maxStageUnlocked >= 3 ? 'pointer' : 'not-allowed'}; opacity:${maxStageUnlocked >= 3 ? '1' : '0.5'};">
                <div style="display:flex; align-items:center; gap:10px;">
                  <span style="font-size:18px;">🔥</span>
                  <div style="text-align:left;">
                    <b style="font-size:13px; color:#FFF; display:block;">Stage 3: Madara Boss</b>
                    <small style="color:#EF2D3D; font-size:10px;">${maxStageUnlocked >= 3 ? 'BOSS READY ⚔️' : 'LOCKED 🔒'}</small>
                  </div>
                </div>
                ${maxStageUnlocked >= 3 ? '<button class="btn gold sm" style="padding:4px 10px; font-size:11px; background:#EF2D3D;">FIGHT</button>' : '🔒'}
              </div>
            </div>

            <div style="display:flex; justify-content:space-around; padding-top:8px; border-top:1px solid rgba(255,255,255,0.08);">
              <button class="btn ghost sm" id="spMapHome" style="font-size:11.5px;">🏠 Home</button>
              <button class="btn ghost sm" id="spMapStats" style="font-size:11.5px;">⚡ Stats</button>
            </div>
          </div>
        `;

        uiOverlay.querySelector('#spMapBack').onclick = () => { state = 'TITLE'; renderOverlay(); };
        uiOverlay.querySelector('#spMapHome').onclick = () => { state = 'TITLE'; renderOverlay(); };
        uiOverlay.querySelector('#spMapStats').onclick = () => { state = 'STATS'; renderOverlay(); };

        uiOverlay.querySelectorAll('.sp-stage-node').forEach((node) => {
          node.onclick = () => {
            const st = parseInt(node.dataset.stage, 10);
            if (st <= maxStageUnlocked) {
              sfx.init();
              setupStage(st);
              state = 'PLAYING';
              renderOverlay();
            }
          };
        });

      } else if (state === 'STATS') {
        // Shinobi Character Stats Screen (Phone 8 Mockup)
        uiOverlay.innerHTML = `
          <div class="sp-modal-content" style="background: radial-gradient(circle at center, rgba(239,45,61,0.2) 0%, rgba(8,13,20,0.98) 70%), url('${ASSETS.bgStats}') center/cover no-repeat; padding:20px 16px; border-radius:12px; border:1px solid rgba(239,45,61,0.4); width:100%; max-width:340px; margin:auto; text-align:center;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
              <button class="btn ghost sm" id="spStatsBack" style="font-size:12px;">← Back</button>
              <div style="display:flex; align-items:center; gap:5px; background:rgba(0,0,0,0.6); padding:2px 8px; border-radius:10px; border:1px solid rgba(255,160,0,0.4);">
                <span>🕯️</span><b style="color:#FFD54F; font-size:13px;">${totalCandles}</b>
              </div>
            </div>

            <h2 style="font-family:'Space Grotesk',sans-serif; font-size:18px; font-weight:800; color:#FFF; margin:0 0 2px;">
              ITACHI UCHIHA
            </h2>
            <div style="font-size:10.5px; color:#A0A6B4; font-style:italic; margin-bottom:14px;">
              "Power lives in silence"
            </div>

            <div style="display:flex; justify-content:center; margin-bottom:12px;">
              <img src="${ASSETS.spriteItachi}" style="height:65px; filter:drop-shadow(0 0 10px rgba(239,45,61,0.7));" onerror="this.src='img/icon-192.png'" />
            </div>

            <!-- Stats Bars -->
            <div style="background:rgba(14,19,30,0.85); border:1px solid rgba(255,255,255,0.08); border-radius:8px; padding:10px 12px; margin-bottom:14px; text-align:left;">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
                <span style="font-size:11px; font-weight:700; color:#CBD5E1;">SPEED</span>
                <div style="display:flex; gap:3px;">
                  ${[1, 2, 3, 4].map((i) => `<div style="width:14px; height:8px; border-radius:2px; background:${i <= speedLevel ? '#EF2D3D' : 'rgba(255,255,255,0.1)'};"></div>`).join('')}
                </div>
              </div>
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
                <span style="font-size:11px; font-weight:700; color:#CBD5E1;">JUMP</span>
                <div style="display:flex; gap:3px;">
                  ${[1, 2, 3, 4].map((i) => `<div style="width:14px; height:8px; border-radius:2px; background:${i <= jumpLevel ? '#EF2D3D' : 'rgba(255,255,255,0.1)'};"></div>`).join('')}
                </div>
              </div>
              <div style="display:flex; justify-content:space-between; align-items:center;">
                <span style="font-size:11px; font-weight:700; color:#CBD5E1;">POWER</span>
                <div style="display:flex; gap:3px;">
                  ${[1, 2, 3, 4].map((i) => `<div style="width:14px; height:8px; border-radius:2px; background:${i <= powerLevel ? '#EF2D3D' : 'rgba(255,255,255,0.1)'};"></div>`).join('')}
                </div>
              </div>
            </div>

            <!-- Gear Unlocks -->
            <div style="font-size:11px; font-weight:700; color:#EF2D3D; text-align:left; margin-bottom:8px; text-transform:uppercase; letter-spacing:0.8px;">
              COLLECT CANDLES TO UNLOCK
            </div>
            <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:6px; margin-bottom:16px;">
              <div style="background:rgba(20,25,38,0.8); border:1px solid #00E676; border-radius:6px; padding:6px 4px;">
                <div style="font-size:16px;">🥷</div>
                <small style="font-size:9.5px; color:#FFF; display:block;">Headband</small>
                <span style="font-size:8.5px; color:#00E676;">ACTIVE</span>
              </div>
              <div style="background:rgba(20,25,38,0.8); border:1px solid #00E676; border-radius:6px; padding:6px 4px;">
                <div style="font-size:16px;">☁️</div>
                <small style="font-size:9.5px; color:#FFF; display:block;">Akatsuki</small>
                <span style="font-size:8.5px; color:#00E676;">ACTIVE</span>
              </div>
              <div style="background:rgba(20,25,38,0.8); border:1px solid rgba(255,255,255,0.1); border-radius:6px; padding:6px 4px; opacity:0.6;">
                <div style="font-size:16px;">⚔️</div>
                <small style="font-size:9.5px; color:#FFF; display:block;">Susanoo</small>
                <span style="font-size:8.5px; color:#FFA000;">50 🕯️</span>
              </div>
            </div>

            <div style="display:flex; justify-content:space-around;">
              <button class="btn gold sm full" id="spStatsStart" style="padding:10px;">Play Battle</button>
            </div>
          </div>
        `;

        uiOverlay.querySelector('#spStatsBack').onclick = () => { state = 'TITLE'; renderOverlay(); };
        uiOverlay.querySelector('#spStatsStart').onclick = () => {
          sfx.init();
          setupStage(currentStage);
          state = 'PLAYING';
          renderOverlay();
        };

      } else if (state === 'GAMEOVER') {
        // Game Over Screen (Phone 5 Mockup)
        uiOverlay.innerHTML = `
          <div class="sp-modal-content" style="background: radial-gradient(circle at center, rgba(160,10,25,0.4) 0%, rgba(8,13,20,0.98) 75%), url('${ASSETS.bgGameOver}') center/cover no-repeat; padding:24px 20px; border-radius:12px; text-align:center; border:1px solid rgba(239,45,61,0.6); box-shadow:0 0 35px rgba(239,45,61,0.4); width:100%; max-width:340px; margin:auto;">
            <div style="display:flex; justify-content:center; margin-bottom:12px;">
              <img src="${ASSETS.akatsukiCloud}" style="height:36px; filter:drop-shadow(0 0 10px rgba(239,45,61,0.9));" onerror="this.style.display='none'" />
            </div>

            <h1 style="font-family:'Space Grotesk',sans-serif; font-size:26px; font-weight:900; color:#EF2D3D; letter-spacing:2px; margin:0 0 6px; text-transform:uppercase;">
              GAME OVER
            </h1>
            <p style="font-size:12px; color:#CBD5E1; letter-spacing:1px; margin-bottom:18px;">
              YOU WERE CAUGHT...
            </p>

            <div style="background:rgba(0,0,0,0.5); border:1px solid rgba(255,255,255,0.1); border-radius:8px; padding:10px; margin-bottom:18px;">
              <div style="font-size:11px; color:#8E9AA8; margin-bottom:3px;">Candles This Run</div>
              <div style="font-family:'Space Grotesk',sans-serif; font-size:18px; font-weight:800; color:#FFD54F;">+ ${stageCandlesCollected} 🕯️</div>
            </div>

            <button class="btn gold full" id="spRetryBtn" style="padding:12px; font-size:14px; font-weight:800; letter-spacing:1px; border-radius:8px; margin-bottom:8px; background:linear-gradient(135deg, #EF2D3D, #9C0E1A); border:1px solid #FF4D5A;">
              RETRY
            </button>
            <button class="btn ghost full" id="spMenuBtn" style="padding:10px; font-size:13px; font-weight:700; border-radius:8px; border-color:rgba(255,255,255,0.2);">
              MAIN MENU
            </button>
          </div>
        `;

        uiOverlay.querySelector('#spRetryBtn').onclick = () => {
          sfx.init();
          setupStage(currentStage);
          state = 'PLAYING';
          renderOverlay();
        };
        uiOverlay.querySelector('#spMenuBtn').onclick = () => {
          state = 'TITLE';
          renderOverlay();
        };

      } else if (state === 'COMPLETE') {
        // Level Completed Screen (Phone 6 Mockup)
        uiOverlay.innerHTML = `
          <div class="sp-modal-content" style="background: radial-gradient(circle at center, rgba(239,45,61,0.3) 0%, rgba(8,13,20,0.98) 75%), url('${ASSETS.bgComplete}') center/cover no-repeat; padding:24px 20px; border-radius:12px; text-align:center; border:1px solid rgba(0,230,118,0.5); box-shadow:0 0 35px rgba(0,230,118,0.3); width:100%; max-width:340px; margin:auto;">
            <div style="font-size:36px; margin-bottom:6px; filter:drop-shadow(0 0 10px rgba(0,230,118,0.6));">🏆</div>
            <h1 style="font-family:'Space Grotesk',sans-serif; font-size:22px; font-weight:900; color:#FFFFFF; letter-spacing:1.5px; margin:0 0 4px; text-transform:uppercase;">
              STAGE ${currentStage} COMPLETED
            </h1>
            <p style="font-size:12px; color:#00E676; letter-spacing:0.8px; margin-bottom:16px;">
              UCHIHA MASTERY DEMONSTRATED
            </p>

            <div style="display:flex; align-items:center; justify-content:center; gap:8px; background:rgba(0,0,0,0.6); border:1px solid rgba(255,160,0,0.4); border-radius:8px; padding:10px; margin-bottom:18px;">
              <span style="font-size:20px;">🕯️</span>
              <b style="font-family:'Space Grotesk',sans-serif; font-size:20px; color:#FFD54F;">+ ${stageCandlesCollected} Candles</b>
            </div>

            <button class="btn gold full" id="spNextBtn" style="padding:12px; font-size:14px; font-weight:800; letter-spacing:1px; border-radius:8px; margin-bottom:8px; background:linear-gradient(135deg, #EF2D3D, #9C0E1A); border:1px solid #FF4D5A;">
              ${currentStage < 3 ? 'NEXT STAGE' : 'CLAIM VICTORY'}
            </button>
            <button class="btn ghost full" id="spCompleteMenuBtn" style="padding:10px; font-size:13px; font-weight:700; border-radius:8px; border-color:rgba(255,255,255,0.2);">
              MAIN MENU
            </button>
          </div>
        `;

        uiOverlay.querySelector('#spNextBtn').onclick = () => {
          sfx.init();
          if (currentStage < 3) {
            setupStage(currentStage + 1);
            state = 'PLAYING';
            renderOverlay();
          } else {
            state = 'MAP';
            renderOverlay();
          }
        };
        uiOverlay.querySelector('#spCompleteMenuBtn').onclick = () => {
          state = 'TITLE';
          renderOverlay();
        };

      } else if (state === 'PAUSED') {
        // Paused Overlay
        uiOverlay.innerHTML = `
          <div class="sp-modal-content" style="background:#080D14; padding:24px 20px; border-radius:12px; text-align:center; border:1px solid rgba(239,45,61,0.5); width:100%; max-width:300px; margin:auto;">
            <h2 style="font-family:'Space Grotesk',sans-serif; font-size:22px; color:#FFF; margin:0 0 6px;">GAME PAUSED</h2>
            <p style="font-size:12px; color:#8E9AA8; margin-bottom:18px;">Take a breath, Shinobi.</p>

            <button class="btn gold full" id="spResumeBtn" style="padding:12px; font-size:14px; font-weight:800; border-radius:8px; margin-bottom:8px;">
              RESUME
            </button>
            <button class="btn ghost full" id="spRestartBtn" style="padding:10px; font-size:13px; border-radius:8px; margin-bottom:8px; border-color:rgba(255,255,255,0.2);">
              RESTART STAGE
            </button>
            <button class="btn ghost full" id="spPauseMenuBtn" style="padding:10px; font-size:13px; border-radius:8px; border-color:rgba(255,255,255,0.2);">
              STAGE MAP
            </button>
          </div>
        `;

        uiOverlay.querySelector('#spResumeBtn').onclick = () => {
          state = 'PLAYING';
          renderOverlay();
        };
        uiOverlay.querySelector('#spRestartBtn').onclick = () => {
          setupStage(currentStage);
          state = 'PLAYING';
          renderOverlay();
        };
        uiOverlay.querySelector('#spPauseMenuBtn').onclick = () => {
          state = 'MAP';
          renderOverlay();
        };
      }
    }

    // Mount DOM Container
    function mount() {
      container = document.createElement('div');
      container.className = 'shadow-path-game-container';
      container.style.cssText = `
        position: relative;
        width: 100%;
        max-width: 440px;
        margin: 0 auto 85px auto;
        background: #05070B;
        border: 1px solid rgba(239,45,61,0.35);
        border-radius: 12px;
        overflow: hidden;
        box-shadow: 0 8px 32px rgba(0,0,0,0.6);
        user-select: none;
        -webkit-user-select: none;
      `;

      container.innerHTML = `
        <!-- Top HUD -->
        <div class="game-hud-bar" style="display:flex; justify-content:space-between; align-items:center; padding:10px 14px; background:rgba(8,13,20,0.9); border-bottom:1px solid rgba(255,255,255,0.08); z-index:5; position:relative;">
          <div style="display:flex; align-items:center; gap:8px;">
            <div style="width:34px; height:34px; border-radius:50%; border:1.5px solid #EF2D3D; overflow:hidden; background:#080D14; display:flex; align-items:center; justify-content:center;">
              <img src="${ASSETS.hudAvatar}" style="width:100%; height:100%; object-fit:cover;" onerror="this.src='img/icon-192.png'" />
            </div>
            <div id="spHearts" style="font-size:14px; letter-spacing:1px; filter:drop-shadow(0 0 4px rgba(239,45,61,0.6));">
              ❤️❤️❤️❤️
            </div>
          </div>

          <div style="display:flex; align-items:center; gap:12px;">
            <div style="display:flex; align-items:center; gap:5px; background:rgba(0,0,0,0.5); border:1px solid rgba(255,160,0,0.4); padding:3px 10px; border-radius:12px;">
              <span style="font-size:16px;">🕯️</span>
              <b id="spCandleCount" style="font-family:'Space Grotesk',sans-serif; font-size:15px; color:#FFD54F;">${totalCandles}</b>
            </div>
            <button class="btn ghost sm" id="spPauseBtn" style="padding:4px 8px; font-size:14px; border-radius:6px; color:#FFF; border-color:rgba(255,255,255,0.2); cursor:pointer;">
              ⏸
            </button>
          </div>
        </div>

        <!-- Canvas Wrap -->
        <div style="position:relative; width:100%; height:420px; background:#000;">
          <canvas id="spCanvas" style="display:block; width:100%; height:100%;"></canvas>
          <div id="spOverlay" style="position:absolute; inset:0; z-index:10; display:flex; align-items:center; justify-content:center; background:rgba(5,7,11,0.85); backdrop-filter:blur(3px); padding:10px;"></div>
        </div>

        <!-- Touch Controls Bar -->
        <div class="sp-controls-bar" style="display:flex; justify-content:space-between; align-items:center; padding:12px 18px; background:#080D14; border-top:1px solid rgba(255,255,255,0.08);">
          <div style="display:flex; gap:12px;">
            <button id="spCtrlLeft" style="width:54px; height:54px; border-radius:50%; background:rgba(255,255,255,0.06); border:1.5px solid rgba(255,255,255,0.2); font-size:20px; color:#FFF; display:flex; align-items:center; justify-content:center; touch-action:manipulation; cursor:pointer;">
              ◀
            </button>
            <button id="spCtrlRight" style="width:54px; height:54px; border-radius:50%; background:rgba(255,255,255,0.06); border:1.5px solid rgba(255,255,255,0.2); font-size:20px; color:#FFF; display:flex; align-items:center; justify-content:center; touch-action:manipulation; cursor:pointer;">
              ▶
            </button>
          </div>
          <div>
            <button id="spCtrlJump" style="width:62px; height:62px; border-radius:50%; background:linear-gradient(135deg, #EF2D3D, #9C0E1A); border:2px solid #FF4D5A; font-size:24px; color:#FFF; display:flex; align-items:center; justify-content:center; touch-action:manipulation; cursor:pointer; box-shadow:0 0 15px rgba(239,45,61,0.5);">
              ▲
            </button>
          </div>
        </div>
      `;

      mountEl.appendChild(container);

      canvas = container.querySelector('#spCanvas');
      ctx = canvas.getContext('2d');
      uiOverlay = container.querySelector('#spOverlay');

      const pauseBtn = container.querySelector('#spPauseBtn');
      if (pauseBtn) {
        pauseBtn.onclick = (e) => {
          e.preventDefault();
          if (state === 'PLAYING') {
            state = 'PAUSED';
            renderOverlay();
          } else if (state === 'PAUSED') {
            state = 'PLAYING';
            renderOverlay();
          }
        };
      }

      // Resize canvas
      function resize() {
        const rect = canvas.parentElement.getBoundingClientRect();
        dpr = window.devicePixelRatio || 1;
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      }
      resize();
      window.addEventListener('resize', resize);

      // Bind Keyboard Controls
      function handleKeyDown(e) {
        if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') input.left = true;
        if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') input.right = true;
        if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W' || e.key === ' ') {
          input.jump = true;
          input.jumpPressed = true;
        }
        if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') {
          if (state === 'PLAYING') {
            state = 'PAUSED';
            renderOverlay();
          } else if (state === 'PAUSED') {
            state = 'PLAYING';
            renderOverlay();
          }
        }
      }

      function handleKeyUp(e) {
        if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') input.left = false;
        if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') input.right = false;
        if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W' || e.key === ' ') input.jump = false;
      }

      window.addEventListener('keydown', handleKeyDown);
      window.addEventListener('keyup', handleKeyUp);

      // Bind On-Screen Touch Controls
      const btnLeft = container.querySelector('#spCtrlLeft');
      const btnRight = container.querySelector('#spCtrlRight');
      const btnJump = container.querySelector('#spCtrlJump');

      const bindTouch = (el, onDown, onUp) => {
        el.addEventListener('pointerdown', (e) => {
          e.preventDefault();
          sfx.init();
          onDown();
        });
        el.addEventListener('pointerup', (e) => {
          e.preventDefault();
          onUp();
        });
        el.addEventListener('pointerleave', (e) => {
          e.preventDefault();
          onUp();
        });
        el.addEventListener('pointercancel', (e) => {
          e.preventDefault();
          onUp();
        });
      };

      bindTouch(btnLeft, () => { input.left = true; }, () => { input.left = false; });
      bindTouch(btnRight, () => { input.right = true; }, () => { input.right = false; });
      bindTouch(btnJump, () => { input.jump = true; input.jumpPressed = true; }, () => { input.jump = false; });

      // Initial state
      loadAssets(() => {
        renderOverlay();
      });

      // Main Animation Loop
      function loop() {
        update();
        draw();
        updateHUD();
        animId = requestAnimationFrame(loop);
      }
      animId = requestAnimationFrame(loop);

      // Return cleanup function
      return () => {
        if (animId) cancelAnimationFrame(animId);
        window.removeEventListener('resize', resize);
        window.removeEventListener('keydown', handleKeyDown);
        window.removeEventListener('keyup', handleKeyUp);
        if (container && container.parentElement) {
          container.remove();
        }
      };
    }

    const destroy = mount();

    return {
      destroy,
      start: () => {
        sfx.init();
        setupStage(currentStage);
        state = 'PLAYING';
        renderOverlay();
      },
      getState: () => state,
      getCandles: () => totalCandles,
    };
  }

  // Export to window
  window.createShadowPathGame = createShadowPathGame;

})(window);
