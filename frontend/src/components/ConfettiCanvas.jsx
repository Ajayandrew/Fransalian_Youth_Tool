import React, { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';

const ConfettiCanvas = forwardRef((props, ref) => {
  const canvasRef = useRef(null);
  const particlesRef = useRef([]);
  const animationFrameIdRef = useRef(null);

  useImperativeHandle(ref, () => ({
    triggerBurst: (x, y, count = 80) => {
      spawnBurst(x, y, count);
    },
    triggerCannon: () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      spawnBurst(width * 0.2, height * 0.8, 70);
      spawnBurst(width * 0.8, height * 0.8, 70);
      setTimeout(() => spawnBurst(width * 0.5, height * 0.5, 90), 200);
    }
  }));

  const spawnBurst = (startX, startY, count) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const colors = [
      '#F59E0B', '#EF4444', '#EC4899', '#8B5CF6', '#3B82F6',
      '#10B981', '#FBBF24', '#F472B6', '#60A5FA', '#34D399'
    ];

    const shapes = ['square', 'circle', 'star', 'ribbon'];
    const originX = startX ?? window.innerWidth / 2;
    const originY = startY ?? window.innerHeight / 3;

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 12 + 4;
      particlesRef.current.push({
        x: originX,
        y: originY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - Math.random() * 4,
        size: Math.random() * 8 + 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        shape: shapes[Math.floor(Math.random() * shapes.length)],
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 12,
        opacity: 1,
        gravity: 0.25,
        drag: 0.98,
        life: 1,
        decay: Math.random() * 0.015 + 0.008
      });
    }

    if (!animationFrameIdRef.current) {
      loop();
    }
  };

  const drawStar = (ctx, cx, cy, spikes, outerRadius, innerRadius) => {
    let rot = (Math.PI / 2) * 3;
    let x = cx;
    let y = cy;
    const step = Math.PI / spikes;

    ctx.beginPath();
    ctx.moveTo(cx, cy - outerRadius);
    for (let i = 0; i < spikes; i++) {
      x = cx + Math.cos(rot) * outerRadius;
      y = cy + Math.sin(rot) * outerRadius;
      ctx.lineTo(x, y);
      rot += step;

      x = cx + Math.cos(rot) * innerRadius;
      y = cy + Math.sin(rot) * innerRadius;
      ctx.lineTo(x, y);
      rot += step;
    }
    ctx.lineTo(cx, cy - outerRadius);
    ctx.closePath();
    ctx.fill();
  };

  const loop = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const activeParticles = [];

    for (let i = 0; i < particlesRef.current.length; i++) {
      const p = particlesRef.current[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += p.gravity;
      p.vx *= p.drag;
      p.vy *= p.drag;
      p.rotation += p.rotationSpeed;
      p.life -= p.decay;

      if (p.life > 0) {
        ctx.save();
        ctx.globalAlpha = Math.max(0, p.life);
        ctx.fillStyle = p.color;
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);

        if (p.shape === 'circle') {
          ctx.beginPath();
          ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
          ctx.fill();
        } else if (p.shape === 'star') {
          drawStar(ctx, 0, 0, 5, p.size, p.size / 2);
        } else if (p.shape === 'ribbon') {
          ctx.fillRect(-p.size, -p.size / 4, p.size * 2, p.size / 2);
        } else {
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        }

        ctx.restore();
        activeParticles.push(p);
      }
    }

    particlesRef.current = activeParticles;

    if (particlesRef.current.length > 0) {
      animationFrameIdRef.current = requestAnimationFrame(loop);
    } else {
      animationFrameIdRef.current = null;
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resize();
    window.addEventListener('resize', resize);

    return () => {
      window.removeEventListener('resize', resize);
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-50"
      style={{ width: '100vw', height: '100vh' }}
    />
  );
});

export default ConfettiCanvas;
