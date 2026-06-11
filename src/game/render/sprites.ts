// All sprites drawn procedurally with canvas — original cartoon art, no external assets.

export function drawFirefighter(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  angle: number,
  state: 'idle' | 'walk' | 'spray' | 'rescue' | 'damage' | 'victory',
  t: number,
  flash: boolean
) {
  ctx.save();
  ctx.translate(x, y);

  // shadow
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.beginPath();
  ctx.ellipse(0, 18, 18, 7, 0, 0, Math.PI * 2);
  ctx.fill();

  // body rotates to face aim direction
  ctx.rotate(angle + Math.PI / 2);

  const wobble = state === 'walk' ? Math.sin(t * 0.018) * 2 : 0;
  const bounce = state === 'victory' ? Math.abs(Math.sin(t * 0.012)) * 4 : 0;
  ctx.translate(0, -bounce);

  if (flash || state === 'damage') {
    ctx.globalAlpha = 0.5 + Math.sin(t * 0.05) * 0.5;
  }

  // legs / boots
  ctx.fillStyle = '#4a3728';
  ctx.fillRect(-9, 8 + wobble, 7, 12);
  ctx.fillRect(2, 8 - wobble, 7, 12);

  // body (orange uniform)
  ctx.fillStyle = '#ff7b00';
  roundRect(ctx, -13, -10, 26, 22, 8);
  ctx.fill();

  // reflective stripes
  ctx.fillStyle = '#ffe66d';
  ctx.fillRect(-13, -2, 26, 4);
  ctx.fillStyle = '#c0c0c0';
  ctx.fillRect(-13, 1, 26, 2);

  // arms / gloves
  ctx.fillStyle = '#ff7b00';
  ctx.fillRect(-17, -8, 6, 14);
  ctx.fillRect(11, -8, 6, 14);
  ctx.fillStyle = '#e63946';
  ctx.fillRect(-17, 4, 6, 5);
  ctx.fillRect(11, 4, 6, 5);

  // helmet
  ctx.fillStyle = '#ffd000';
  ctx.beginPath();
  ctx.arc(0, -14, 11, Math.PI, 0);
  ctx.fill();
  ctx.fillRect(-11, -14, 22, 5);
  // helmet crest
  ctx.fillStyle = '#e63946';
  ctx.beginPath();
  ctx.moveTo(0, -25);
  ctx.lineTo(-4, -14);
  ctx.lineTo(4, -14);
  ctx.closePath();
  ctx.fill();
  // face shield
  ctx.fillStyle = 'rgba(120,200,255,0.6)';
  ctx.fillRect(-8, -12, 16, 6);

  // hose pointing forward (toward aim)
  ctx.strokeStyle = '#2b2d42';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(0, -6);
  const nozzleLen = state === 'spray' ? 24 + Math.sin(t * 0.04) * 2 : 22;
  ctx.lineTo(0, -nozzleLen);
  ctx.stroke();
  // nozzle
  ctx.fillStyle = '#adb5bd';
  ctx.beginPath();
  ctx.arc(0, -nozzleLen, 4, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

export function drawFire(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  flicker: number,
  intense: boolean
) {
  ctx.save();
  ctx.translate(x, y);
  const s = radius / 30;
  ctx.scale(s, s);

  // glow
  const glow = ctx.createRadialGradient(0, 0, 4, 0, 0, 40);
  glow.addColorStop(0, intense ? 'rgba(255,120,0,0.5)' : 'rgba(255,160,0,0.35)');
  glow.addColorStop(1, 'rgba(255,80,0,0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(0, 0, 40, 0, Math.PI * 2);
  ctx.fill();

  const f = flicker;
  // outer flame
  ctx.fillStyle = '#ff4d00';
  flameShape(ctx, 0, 6, 18, 34 + Math.sin(f) * 5);
  // mid flame
  ctx.fillStyle = '#ff8c00';
  flameShape(ctx, 0, 6, 13, 26 + Math.sin(f * 1.3 + 1) * 4);
  // inner flame
  ctx.fillStyle = '#ffd000';
  flameShape(ctx, 0, 6, 8, 17 + Math.sin(f * 1.7 + 2) * 3);
  // core
  ctx.fillStyle = '#fff3b0';
  flameShape(ctx, 0, 6, 4, 9);

  ctx.restore();
}

function flameShape(
  ctx: CanvasRenderingContext2D,
  cx: number,
  baseY: number,
  width: number,
  height: number
) {
  ctx.beginPath();
  ctx.moveTo(cx - width, baseY);
  ctx.quadraticCurveTo(cx - width, baseY - height * 0.5, cx - width * 0.3, baseY - height * 0.7);
  ctx.quadraticCurveTo(cx, baseY - height * 1.2, cx, baseY - height);
  ctx.quadraticCurveTo(cx, baseY - height * 1.2, cx + width * 0.3, baseY - height * 0.7);
  ctx.quadraticCurveTo(cx + width, baseY - height * 0.5, cx + width, baseY);
  ctx.quadraticCurveTo(cx, baseY + 4, cx - width, baseY);
  ctx.fill();
}

export function drawPerson(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  isPet: boolean,
  bob: number,
  inDanger: boolean
) {
  ctx.save();
  ctx.translate(x, y - bob);

  // shadow
  ctx.fillStyle = 'rgba(0,0,0,0.2)';
  ctx.beginPath();
  ctx.ellipse(0, 14 + bob, 12, 5, 0, 0, Math.PI * 2);
  ctx.fill();

  // distress ring
  if (inDanger) {
    ctx.strokeStyle = 'rgba(255,80,80,0.7)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, 20 + bob, 0, Math.PI * 2);
    ctx.stroke();
  }

  if (isPet) {
    // dog
    ctx.fillStyle = '#a8763e';
    roundRect(ctx, -12, -2, 22, 14, 6);
    ctx.fill();
    // head
    ctx.beginPath();
    ctx.arc(12, -2, 8, 0, Math.PI * 2);
    ctx.fill();
    // ear
    ctx.fillStyle = '#7a5630';
    ctx.beginPath();
    ctx.ellipse(8, -8, 3, 6, -0.4, 0, Math.PI * 2);
    ctx.fill();
    // legs
    ctx.fillStyle = '#7a5630';
    ctx.fillRect(-8, 10, 4, 6);
    ctx.fillRect(4, 10, 4, 6);
    // tail
    ctx.strokeStyle = '#a8763e';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-12, 0);
    ctx.lineTo(-18, -6);
    ctx.stroke();
    // eye
    ctx.fillStyle = '#1a1a1a';
    ctx.beginPath();
    ctx.arc(14, -3, 1.5, 0, Math.PI * 2);
    ctx.fill();
  } else {
    // civilian
    ctx.fillStyle = '#4361ee';
    roundRect(ctx, -8, -4, 16, 18, 6);
    ctx.fill();
    // head
    ctx.fillStyle = '#ffcba4';
    ctx.beginPath();
    ctx.arc(0, -12, 7, 0, Math.PI * 2);
    ctx.fill();
    // hair
    ctx.fillStyle = '#6b4226';
    ctx.beginPath();
    ctx.arc(0, -14, 7, Math.PI, 0);
    ctx.fill();
    // arms waving
    ctx.strokeStyle = '#ffcba4';
    ctx.lineWidth = 3;
    const wave = Math.sin(Date.now() * 0.008) * 4;
    ctx.beginPath();
    ctx.moveTo(-8, 0);
    ctx.lineTo(-13, -8 + wave);
    ctx.moveTo(8, 0);
    ctx.lineTo(13, -8 - wave);
    ctx.stroke();
    // legs
    ctx.fillStyle = '#2b2d42';
    ctx.fillRect(-6, 13, 5, 8);
    ctx.fillRect(1, 13, 5, 8);
  }
  ctx.restore();
}

export function drawRefill(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  pulse: number
) {
  ctx.save();
  ctx.translate(x, y);

  // pulse ring
  ctx.strokeStyle = `rgba(80,180,255,${0.4 + Math.sin(pulse) * 0.3})`;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(0, 0, 26 + Math.sin(pulse) * 4, 0, Math.PI * 2);
  ctx.stroke();

  // hydrant body
  ctx.fillStyle = '#e63946';
  roundRect(ctx, -10, -16, 20, 30, 6);
  ctx.fill();
  // cap
  ctx.fillStyle = '#c1121f';
  ctx.beginPath();
  ctx.arc(0, -16, 10, Math.PI, 0);
  ctx.fill();
  ctx.fillRect(-3, -24, 6, 8);
  // side nozzles
  ctx.fillStyle = '#adb5bd';
  ctx.fillRect(-15, -6, 6, 6);
  ctx.fillRect(9, -6, 6, 6);
  // water drop icon
  ctx.fillStyle = '#caf0f8';
  ctx.beginPath();
  ctx.moveTo(0, -4);
  ctx.bezierCurveTo(6, 2, 5, 8, 0, 8);
  ctx.bezierCurveTo(-5, 8, -6, 2, 0, -4);
  ctx.fill();
  // base
  ctx.fillStyle = '#6a040f';
  roundRect(ctx, -13, 12, 26, 6, 3);
  ctx.fill();

  ctx.restore();
}

export function drawHazard(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  type: 'debris' | 'gas' | 'electric',
  t: number,
  disabled: boolean
) {
  ctx.save();
  ctx.translate(x, y);

  if (type === 'debris') {
    ctx.fillStyle = '#5c4033';
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2;
      ctx.save();
      ctx.rotate(a + t * 0.0005);
      roundRect(ctx, 4, -5, 16, 10, 2);
      ctx.fill();
      ctx.restore();
    }
    ctx.fillStyle = '#8d6e63';
    ctx.beginPath();
    ctx.arc(0, 0, 8, 0, Math.PI * 2);
    ctx.fill();
  } else if (type === 'gas') {
    const a = disabled ? 0.2 : 0.5 + Math.sin(t * 0.005) * 0.2;
    ctx.fillStyle = `rgba(160,220,80,${a})`;
    for (let i = 0; i < 5; i++) {
      const off = Math.sin(t * 0.003 + i) * 6;
      ctx.beginPath();
      ctx.arc(Math.cos(i) * 14, Math.sin(i * 1.3) * 12 + off, 10, 0, Math.PI * 2);
      ctx.fill();
    }
    if (!disabled) {
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 16px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('⚠', 0, 5);
    }
  } else if (type === 'electric') {
    ctx.strokeStyle = disabled ? '#6c757d' : '#ffd60a';
    ctx.lineWidth = 3;
    if (!disabled) {
      ctx.shadowColor = '#ffd60a';
      ctx.shadowBlur = 10;
    }
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * Math.PI * 2 + t * 0.002;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(a) * 16, Math.sin(a) * 16);
      ctx.lineTo(Math.cos(a + 0.3) * 10, Math.sin(a + 0.3) * 10);
      ctx.lineTo(Math.cos(a + 0.3) * 20, Math.sin(a + 0.3) * 20);
      ctx.stroke();
    }
    ctx.shadowBlur = 0;
    ctx.fillStyle = disabled ? '#6c757d' : '#ffd60a';
    ctx.beginPath();
    ctx.arc(0, 0, 6, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

export function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
