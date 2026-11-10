import { NewsPostData } from '../types/newsPost';

// Image cache to prevent reloading same image repeatedly
const imageCache = new Map<string, HTMLImageElement>();

export function loadImage(src: string): Promise<HTMLImageElement> {
  if (imageCache.has(src)) {
    const cached = imageCache.get(src)!;
    if (cached.complete && cached.naturalWidth > 0) {
      return Promise.resolve(cached);
    }
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      imageCache.set(src, img);
      resolve(img);
    };
    img.onerror = (e) => {
      console.warn('Failed to load image:', src, e);
      reject(e);
    };
    img.src = src;
  });
}

/**
 * Draw rounded rectangle helper
 */
function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.arcTo(x + width, y, x + width, y + radius, radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.arcTo(x + width, y + height, x + width - radius, y + height, radius);
  ctx.lineTo(x + radius, y + height);
  ctx.arcTo(x, y + height, x, y + height - radius, radius);
  ctx.lineTo(x, y + radius);
  ctx.arcTo(x, y, x + radius, y, radius);
  ctx.closePath();
}

/**
 * Text wrapper that splits text into lines matching maxWidth
 */
function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string[] {
  const paragraphs = text.split('\n');
  const lines: string[] = [];

  for (const para of paragraphs) {
    if (!para.trim()) {
      lines.push('');
      continue;
    }
    const words = para.split(' ');
    let currentLine = '';

    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const metrics = ctx.measureText(testLine);

      if (metrics.width > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }
    if (currentLine) {
      lines.push(currentLine);
    }
  }

  return lines;
}

/**
 * Draw text line with highlight support
 */
function drawFormattedLine(
  ctx: CanvasRenderingContext2D,
  line: string,
  x: number,
  y: number,
  defaultColor: string,
  highlightColor: string,
  highlightWords: string[],
  align: 'left' | 'center' | 'right' = 'left',
  containerWidth: number = 1080
) {
  // If no highlight words, render normal line
  const activeHighlights = highlightWords
    .map((w) => w.trim())
    .filter((w) => w.length > 0);

  // If there's an asterisk syntax like *highlighted words*, extract that too
  const hasAsterisk = line.includes('*');

  if (activeHighlights.length === 0 && !hasAsterisk) {
    let drawX = x;
    if (align === 'center') {
      drawX = containerWidth / 2;
      ctx.textAlign = 'center';
    } else if (align === 'right') {
      drawX = containerWidth - x;
      ctx.textAlign = 'right';
    } else {
      ctx.textAlign = 'left';
    }

    ctx.save();
    // 1. Draw smooth outer dark stroke with drop shadow behind
    ctx.shadowColor = 'rgba(0, 0, 0, 0.85)';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 3;
    ctx.strokeStyle = 'rgba(15, 0, 4, 0.95)';
    ctx.lineWidth = 4;
    ctx.lineJoin = 'round';
    ctx.miterLimit = 2;
    ctx.strokeText(line, drawX, y);

    // 2. Draw pristine sharp fill on top without muddy shadow
    ctx.shadowColor = 'transparent';
    ctx.fillStyle = defaultColor;
    ctx.fillText(line, drawX, y);
    ctx.restore();
    return;
  }

  // Tokenize line into segments (normal or highlighted)
  type Segment = { text: string; isHighlight: boolean };
  const segments: Segment[] = [];

  // If asterisks are used:
  if (hasAsterisk) {
    const parts = line.split('*');
    for (let i = 0; i < parts.length; i++) {
      if (parts[i]) {
        segments.push({
          text: parts[i],
          isHighlight: i % 2 === 1,
        });
      }
    }
  } else {
    // Check for highlight words
    const words = line.split(' ');
    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      const isMatch = activeHighlights.some(
        (hw) =>
          word.includes(hw) ||
          hw.includes(word) ||
          line.toLowerCase().includes(hw.toLowerCase())
      );
      segments.push({
        text: (i > 0 ? ' ' : '') + word,
        isHighlight: isMatch,
      });
    }
  }

  // Calculate total line width for center/right alignment
  let totalWidth = 0;
  for (const seg of segments) {
    totalWidth += ctx.measureText(seg.text).width;
  }

  let currentX = x;
  if (align === 'center') {
    currentX = (containerWidth - totalWidth) / 2;
  } else if (align === 'right') {
    currentX = containerWidth - x - totalWidth;
  }
  ctx.textAlign = 'left';

  // PASS 1: Draw strokes with shadow for all segments
  ctx.save();
  ctx.shadowColor = 'rgba(0, 0, 0, 0.85)';
  ctx.shadowBlur = 8;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 3;
  ctx.strokeStyle = 'rgba(15, 0, 4, 0.95)';
  ctx.lineWidth = 4;
  ctx.lineJoin = 'round';
  ctx.miterLimit = 2;

  let strokeX = currentX;
  for (const seg of segments) {
    ctx.strokeText(seg.text, strokeX, y);
    strokeX += ctx.measureText(seg.text).width;
  }
  ctx.restore();

  // PASS 2: Draw crisp, pristine fills on top with NO shadow
  ctx.save();
  ctx.shadowColor = 'transparent';
  let fillX = currentX;
  for (const seg of segments) {
    ctx.fillStyle = seg.isHighlight ? highlightColor : defaultColor;
    ctx.fillText(seg.text, fillX, y);
    fillX += ctx.measureText(seg.text).width;
  }
  ctx.restore();
}

/**
 * Draw Calendar Icon
 */
function drawCalendarIcon(ctx: CanvasRenderingContext2D, x: number, y: number, size = 26) {
  ctx.save();
  ctx.strokeStyle = '#dc2626';
  ctx.fillStyle = '#dc2626';
  ctx.lineWidth = 2.5;

  // Calendar outline
  drawRoundedRect(ctx, x, y, size, size * 0.9, 4);
  ctx.stroke();

  // Header band
  ctx.fillRect(x, y, size, size * 0.28);

  // Top rings/hangers
  ctx.fillStyle = '#b91c1c';
  ctx.fillRect(x + size * 0.22, y - 4, 3, 5);
  ctx.fillRect(x + size * 0.68, y - 4, 3, 5);

  // Internal dots for calendar days
  ctx.fillStyle = '#dc2626';
  const dotSize = 2.5;
  ctx.fillRect(x + size * 0.25, y + size * 0.45, dotSize, dotSize);
  ctx.fillRect(x + size * 0.5, y + size * 0.45, dotSize, dotSize);
  ctx.fillRect(x + size * 0.75, y + size * 0.45, dotSize, dotSize);
  ctx.fillRect(x + size * 0.25, y + size * 0.68, dotSize, dotSize);
  ctx.fillRect(x + size * 0.5, y + size * 0.68, dotSize, dotSize);
  ctx.fillRect(x + size * 0.75, y + size * 0.68, dotSize, dotSize);

  ctx.restore();
}

/**
 * Draw Social Icon circles matching real branded icons with vector paths
 */
function drawSocialIcons(ctx: CanvasRenderingContext2D, centerX: number, y: number, handleText: string) {
  ctx.save();
  const radius = 17;
  const gap = 12;

  ctx.font = 'bold 24px "Plus Jakarta Sans", sans-serif';
  const textMetrics = ctx.measureText(handleText);
  const textWidth = textMetrics.width;
  const iconsWidth = 4 * (radius * 2) + 3 * gap;
  const totalWidth = iconsWidth + 14 + textWidth;
  let currentX = centerX - totalWidth / 2 + radius;

  // 1. Facebook (#1877F2)
  ctx.beginPath();
  ctx.arc(currentX, y, radius, 0, Math.PI * 2);
  ctx.fillStyle = '#1877f2';
  ctx.fill();
  ctx.font = 'bold 22px "Plus Jakarta Sans", Arial, sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('f', currentX, y + 1);

  // 2. YouTube (#FF0000)
  currentX += radius * 2 + gap;
  ctx.beginPath();
  ctx.arc(currentX, y, radius, 0, Math.PI * 2);
  ctx.fillStyle = '#ff0000';
  ctx.fill();
  // Vector play triangle
  ctx.beginPath();
  const triH = 14;
  const triW = 12;
  ctx.moveTo(currentX - triW / 3, y - triH / 2);
  ctx.lineTo(currentX + (2 * triW) / 3, y);
  ctx.lineTo(currentX - triW / 3, y + triH / 2);
  ctx.closePath();
  ctx.fillStyle = '#ffffff';
  ctx.fill();

  // 3. Instagram (Gradient #F56040 to #833AB4)
  currentX += radius * 2 + gap;
  ctx.beginPath();
  ctx.arc(currentX, y, radius, 0, Math.PI * 2);
  const igGrad = ctx.createLinearGradient(currentX - radius, y + radius, currentX + radius, y - radius);
  igGrad.addColorStop(0, '#f56040');
  igGrad.addColorStop(0.5, '#e1306c');
  igGrad.addColorStop(1, '#833ab4');
  ctx.fillStyle = igGrad;
  ctx.fill();
  // Vector camera glyph
  ctx.save();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2;
  const camSize = 16;
  drawRoundedRect(ctx, currentX - camSize / 2, y - camSize / 2, camSize, camSize, 4.5);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(currentX, y, 4, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(currentX + 4.5, y - 4.5, 1.2, 0, Math.PI * 2);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.restore();

  // 4. Telegram / Website (#0088cc)
  currentX += radius * 2 + gap;
  ctx.beginPath();
  ctx.arc(currentX, y, radius, 0, Math.PI * 2);
  ctx.fillStyle = '#0088cc';
  ctx.fill();
  // Vector paper airplane glyph
  ctx.save();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.moveTo(currentX - 7, y - 1);
  ctx.lineTo(currentX + 8, y - 6);
  ctx.lineTo(currentX + 1, y + 7);
  ctx.lineTo(currentX - 1, y + 2);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // Handle text
  ctx.font = 'bold 24px "Plus Jakarta Sans", sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(handleText, currentX + radius + 14, y);

  ctx.restore();
}

/**
 * Main Render Function
 */
export async function renderNewsPost(
  canvas: HTMLCanvasElement,
  data: NewsPostData
): Promise<void> {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Set explicit canvas size to standard 1080x1350
  canvas.width = 1080;
  canvas.height = 1350;

  // Ensure Bengali fonts are ready
  try {
    await document.fonts.ready;
  } catch (err) {
    console.warn('Font load check:', err);
  }

  // Reset transform
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, 1080, 1350);

  if (data.template === 'design1') {
    await renderDesign1(ctx, data);
  } else {
    await renderDesign2(ctx, data);
  }
}

/**
 * DESIGN 1: Breaking / Event News Photo Post
 */
async function renderDesign1(ctx: CanvasRenderingContext2D, data: NewsPostData) {
  // 1. Base White Canvas
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, 1080, 1350);

  // Scalable Header Height based on logo size
  const logoHeight = data.logoSize || 115;
  const headerHeight = Math.max(145, Math.round(logoHeight + 36));

  // 2. News Photo (Middle Section)
  if (data.newsImage) {
    try {
      const img = await loadImage(data.newsImage);
      ctx.save();
      // Clip image area to between top header (headerHeight) and deep wave bottom
      ctx.beginPath();
      ctx.rect(0, headerHeight, 1080, 950);
      ctx.clip();

      const imgAspect = img.naturalWidth / img.naturalHeight;
      let targetW = 1080;
      let targetH = targetW / imgAspect;

      const availableHeight = 900 - headerHeight;
      if (targetH < availableHeight) {
        targetH = availableHeight;
        targetW = targetH * imgAspect;
      }

      // Apply zoom & offsets
      const scaledW = targetW * data.imageZoom;
      const scaledH = targetH * data.imageZoom;
      const drawX = (1080 - scaledW) / 2 + data.imageOffsetX;
      const drawY = headerHeight + (availableHeight - scaledH) / 2 + data.imageOffsetY;

      ctx.drawImage(img, drawX, drawY, scaledW, scaledH);
      ctx.restore();
    } catch (e) {
      console.warn('News image render error:', e);
    }
  }

  // 3. Top Header Bar (0 to headerHeight px)
  ctx.save();
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, 1080, headerHeight);

  // Subtle separator line under header
  ctx.strokeStyle = '#f1f5f9';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(0, headerHeight);
  ctx.lineTo(1080, headerHeight);
  ctx.stroke();

  // Draw Logo on top-left
  if (data.logoUrl) {
    try {
      const logoImg = await loadImage(data.logoUrl);
      const logoAspect = logoImg.naturalWidth / logoImg.naturalHeight;
      const logoWidth = logoHeight * logoAspect;
      ctx.drawImage(logoImg, 42, (headerHeight - logoHeight) / 2, logoWidth, logoHeight);
    } catch {
      // Fallback text logo if image fails
      ctx.font = 'bold 38px "Plus Jakarta Sans", sans-serif';
      ctx.fillStyle = '#dc2626';
      ctx.fillText('JONOMANCH', 45, headerHeight / 2);
      ctx.font = '600 20px "Hind Siliguri", sans-serif';
      ctx.fillStyle = '#475569';
      ctx.fillText('সত্যের পাশে, মানুষের জন্য', 45, headerHeight / 2 + 28);
    }
  }

  // Draw Date on top-right
  if (data.showDate && data.date) {
    const dateFontSize = data.dateSize || 32;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.font = `bold ${dateFontSize}px "${data.fontFamily}", sans-serif`;
    ctx.fillStyle = '#1e293b';

    const centerY = headerHeight / 2;
    ctx.fillText(data.date, 1030, centerY);

    // Draw calendar icon sized proportionally before date text
    const textWidth = ctx.measureText(data.date).width;
    const calIconSize = Math.max(24, Math.round(dateFontSize * 0.95));
    drawCalendarIcon(
      ctx,
      1030 - textWidth - calIconSize - 14,
      centerY - calIconSize * 0.46,
      calIconSize
    );
  }
  ctx.restore();

  // 4. Dynamic Crimson Red Wave Overlay and Headline Section
  const waveTopY = 825 + data.textOffsetY * 0.3;

  ctx.save();
  // Ambient vignette shadow on photo above wave
  const fadeGrad = ctx.createLinearGradient(0, waveTopY - 60, 0, waveTopY + 20);
  fadeGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
  fadeGrad.addColorStop(0.5, 'rgba(0, 0, 0, 0.2)');
  fadeGrad.addColorStop(1, 'rgba(50, 0, 5, 0.55)');
  ctx.fillStyle = fadeGrad;
  ctx.fillRect(0, waveTopY - 60, 1080, 80);

  // Main Wave path
  ctx.beginPath();
  ctx.moveTo(0, waveTopY + 20);
  ctx.bezierCurveTo(
    320,
    waveTopY + 38,
    720,
    waveTopY + 12,
    1080,
    waveTopY - 8
  );
  ctx.lineTo(1080, 1350);
  ctx.lineTo(0, 1350);
  ctx.closePath();

  // Deep rich crimson red gradient
  const grad = ctx.createLinearGradient(0, waveTopY, 0, 1350);
  grad.addColorStop(0, '#a5091a'); // top rich crimson
  grad.addColorStop(0.18, '#bd0c1f'); // vibrant red ridge
  grad.addColorStop(0.65, '#850311'); // deep ruby red
  grad.addColorStop(1, '#4e0007'); // dark foundation
  ctx.fillStyle = grad;
  ctx.fill();

  // 3D dynamic ribbon streak on bottom right (signature JONOMANCH brand ribbon)
  ctx.beginPath();
  ctx.moveTo(1080, 1260);
  ctx.bezierCurveTo(900, 1195, 680, 1150, 480, 1180);
  ctx.bezierCurveTo(650, 1235, 850, 1290, 1080, 1320);
  ctx.closePath();
  const ribbonGrad1 = ctx.createLinearGradient(480, 1180, 1080, 1320);
  ribbonGrad1.addColorStop(0, 'rgba(239, 68, 68, 0)');
  ribbonGrad1.addColorStop(0.4, 'rgba(220, 38, 38, 0.4)');
  ribbonGrad1.addColorStop(0.8, 'rgba(252, 165, 165, 0.25)');
  ribbonGrad1.addColorStop(1, 'rgba(239, 68, 68, 0)');
  ctx.fillStyle = ribbonGrad1;
  ctx.fill();

  // Subtle curved light beam across middle-right
  ctx.beginPath();
  ctx.moveTo(0, waveTopY + 30);
  ctx.bezierCurveTo(360, waveTopY + 48, 780, waveTopY + 20, 1080, waveTopY + 5);
  ctx.bezierCurveTo(780, waveTopY + 35, 360, waveTopY + 62, 0, waveTopY + 45);
  ctx.closePath();
  ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.fill();

  // Glowing white highlight stroke along wave crest
  ctx.beginPath();
  ctx.moveTo(0, waveTopY + 20);
  ctx.bezierCurveTo(
    320,
    waveTopY + 38,
    720,
    waveTopY + 12,
    1080,
    waveTopY - 8
  );
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
  ctx.lineWidth = 3.5;
  ctx.stroke();
  ctx.restore();

  // 5. Text Area inside the Red Banner
  ctx.save();
  let contentY = waveTopY + 75 + data.textOffsetY;

  // Subtitle / Kicker (e.g. "লালবাগ থেকে" in white)
  if (data.subtitle && data.subtitle.trim()) {
    ctx.font = `700 ${data.subtitleSize}px "${data.fontFamily}", sans-serif`;
    ctx.textBaseline = 'top';
    const subLines = wrapText(ctx, data.subtitle, 980);
    for (const sLine of subLines) {
      drawFormattedLine(
        ctx,
        sLine,
        50,
        contentY,
        data.subtitleColor || '#ffffff',
        data.headlineHighlightColor || '#ffe600',
        [],
        data.textAlign,
        1080
      );
      contentY += data.subtitleSize * 1.3;
    }
    contentY += 6;
  }

  // Headline (e.g. "নি/ষিদ্ধ যুবলীগ ও স্বেচ্ছাসেবক লীগের\n২ নেতা গ্রেফতার")
  ctx.font = `800 ${data.headlineSize}px "${data.fontFamily}", sans-serif`;
  ctx.textBaseline = 'top';

  const headlineLines = wrapText(ctx, data.headline, 980);
  const highlightWords = data.highlightText
    ? data.highlightText.split(',').map((s) => s.trim())
    : [];

  for (const hLine of headlineLines) {
    drawFormattedLine(
      ctx,
      hLine,
      50,
      contentY,
      data.headlineColor || '#ffffff',
      data.headlineHighlightColor || '#ffe600',
      highlightWords,
      data.textAlign,
      1080
    );
    contentY += data.headlineSize * 1.25;
  }
  ctx.restore();

  // 6. "বিস্তারিত কমেন্টে... ›" Glowing Pill Button (Centered)
  if (data.showButton && data.buttonText) {
    ctx.save();
    const btnText = data.buttonText;
    ctx.font = `bold 24px "${data.fontFamily}", sans-serif`;
    const btnTextMetrics = ctx.measureText(btnText);
    const btnW = Math.max(220, btnTextMetrics.width + 56);
    const btnH = 46;
    const btnX = (1080 - btnW) / 2;
    const btnY = Math.min(contentY + 16, 1205);

    // Soft drop shadow
    ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
    ctx.shadowBlur = 12;
    ctx.shadowOffsetY = 4;

    // Glowing gradient red pill
    const btnGrad = ctx.createLinearGradient(btnX, btnY, btnX, btnY + btnH);
    btnGrad.addColorStop(0, '#ea1e2b');
    btnGrad.addColorStop(1, '#9b0a17');
    ctx.fillStyle = btnGrad;
    drawRoundedRect(ctx, btnX, btnY, btnW, btnH, btnH / 2);
    ctx.fill();

    // White hairline border
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Text with subtle shadow
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(btnText, 1080 / 2, btnY + btnH / 2 + 1);
    ctx.restore();
  }

  // 7. Bottom Social Bar (Centered at x = 540)
  if (data.showSocials) {
    ctx.save();
    // Dark burgundy bottom bar
    ctx.fillStyle = '#380108';
    ctx.fillRect(0, 1275, 1080, 75);

    // Red accent top line on social bar
    ctx.strokeStyle = '#c71d2b';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, 1275);
    ctx.lineTo(1080, 1275);
    ctx.stroke();

    // Centered at 540 (half of 1080)
    drawSocialIcons(ctx, 540, 1312, data.socialHandle || '/Jonomanch');
    ctx.restore();
  }
}

/**
 * DESIGN 2: Quote / Statement Editorial Post
 */
async function renderDesign2(ctx: CanvasRenderingContext2D, data: NewsPostData) {
  // 1. Crisp White Background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, 1080, 1350);

  // Scalable Header Height based on logo size
  const logoHeight = data.logoSize || 115;
  const headerHeight = Math.max(145, Math.round(logoHeight + 36));

  // 2. Right Column Speaker Portrait Photo
  if (data.newsImage) {
    try {
      const img = await loadImage(data.newsImage);
      ctx.save();
      // Clip to right half down to top of red wave footer (y: headerHeight to 1200)
      ctx.beginPath();
      ctx.rect(530, headerHeight, 550, 1200 - headerHeight);
      ctx.clip();

      const imgAspect = img.naturalWidth / img.naturalHeight;
      let targetH = 1200 - headerHeight;
      let targetW = targetH * imgAspect;

      if (targetW < 550) {
        targetW = 550;
        targetH = targetW / imgAspect;
      }

      const scaledW = targetW * data.imageZoom;
      const scaledH = targetH * data.imageZoom;
      const drawX = 530 + (550 - scaledW) / 2 + data.imageOffsetX;
      const drawY = headerHeight + (1200 - headerHeight - scaledH) / 2 + data.imageOffsetY;

      ctx.drawImage(img, drawX, drawY, scaledW, scaledH);

      // Subtle soft gradient fade on left edge of portrait for smooth integration
      const fadeGrad = ctx.createLinearGradient(530, 0, 680, 0);
      fadeGrad.addColorStop(0, '#ffffff');
      fadeGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0.4)');
      fadeGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = fadeGrad;
      ctx.fillRect(530, headerHeight, 150, 1200 - headerHeight);

      ctx.restore();
    } catch (e) {
      console.warn('Speaker image render error:', e);
    }
  }

  // 3. Top Header Bar (0 to headerHeight px)
  ctx.save();
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, 1080, headerHeight);

  ctx.strokeStyle = '#f1f5f9';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(0, headerHeight);
  ctx.lineTo(1080, headerHeight);
  ctx.stroke();

  // Logo on top-left
  if (data.logoUrl) {
    try {
      const logoImg = await loadImage(data.logoUrl);
      const logoAspect = logoImg.naturalWidth / logoImg.naturalHeight;
      const logoWidth = logoHeight * logoAspect;
      ctx.drawImage(logoImg, 42, (headerHeight - logoHeight) / 2, logoWidth, logoHeight);
    } catch {
      ctx.font = 'bold 38px "Plus Jakarta Sans", sans-serif';
      ctx.fillStyle = '#dc2626';
      ctx.fillText('JONOMANCH', 45, headerHeight / 2);
    }
  }

  // Date on top-right
  if (data.showDate && data.date) {
    const dateFontSize = data.dateSize || 32;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.font = `bold ${dateFontSize}px "${data.fontFamily}", sans-serif`;
    ctx.fillStyle = '#1e293b';

    const centerY = headerHeight / 2;
    ctx.fillText(data.date, 1030, centerY);

    const textWidth = ctx.measureText(data.date).width;
    const calIconSize = Math.max(24, Math.round(dateFontSize * 0.95));
    drawCalendarIcon(
      ctx,
      1030 - textWidth - calIconSize - 14,
      centerY - calIconSize * 0.46,
      calIconSize
    );
  }
  ctx.restore();

  // 4. Left Column: Big Red Quote Mark, Statement, Speaker
  ctx.save();
  const leftX = 55;
  const quoteMaxWidth = 520;
  let textY = headerHeight + 30 + data.textOffsetY;

  // Giant Stylized Red Quote Mark ❝
  ctx.font = 'bold 110px serif';
  ctx.fillStyle = '#dc2626';
  ctx.textBaseline = 'top';
  ctx.fillText('❝', leftX, textY);
  textY += 95;

  // Statement / News Body
  const fontSize = data.quoteFontSize || 34;
  ctx.font = `500 ${fontSize}px "${data.fontFamily}", sans-serif`;
  ctx.textBaseline = 'top';

  const quoteLines = wrapText(ctx, data.statementQuote, quoteMaxWidth);
  const highlightWords = data.quoteHighlight
    ? data.quoteHighlight.split(',').map((s) => s.trim())
    : [];

  for (const qLine of quoteLines) {
    drawFormattedLine(
      ctx,
      qLine,
      leftX,
      textY,
      '#0f172a', // charcoal body
      '#dc2626', // highlighted words in bold red
      highlightWords,
      'left',
      1080
    );
    textY += fontSize * 1.5;
  }

  // Speaker attribution block
  textY += 32;
  if (data.quoteSpeaker && data.quoteSpeaker.trim()) {
    ctx.font = `bold 36px "${data.fontFamily}", sans-serif`;
    ctx.fillStyle = '#0f172a';
    ctx.fillText(data.quoteSpeaker, leftX, textY);
    textY += 46;
  }

  if (data.quoteDesignation && data.quoteDesignation.trim()) {
    ctx.font = `600 25px "${data.fontFamily}", sans-serif`;
    ctx.fillStyle = '#64748b';
    ctx.fillText(data.quoteDesignation, leftX, textY);
  }
  ctx.restore();

  // 5. Bottom Red Ribbon & Wave Footer
  ctx.save();
  const footerTopY = 1180;

  // Ambient shadow
  ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
  ctx.shadowBlur = 20;
  ctx.shadowOffsetY = -6;

  // Wave ribbon path
  ctx.beginPath();
  ctx.moveTo(0, footerTopY + 20);
  ctx.bezierCurveTo(
    320,
    footerTopY - 25,
    720,
    footerTopY + 35,
    1080,
    footerTopY - 15
  );
  ctx.lineTo(1080, 1350);
  ctx.lineTo(0, 1350);
  ctx.closePath();

  // Glossy red gradient
  const redGrad = ctx.createLinearGradient(0, footerTopY, 0, 1350);
  redGrad.addColorStop(0, '#e11d48');
  redGrad.addColorStop(0.25, '#dc2626');
  redGrad.addColorStop(0.8, '#991b1b');
  redGrad.addColorStop(1, '#7f1d1d');
  ctx.fillStyle = redGrad;
  ctx.fill();
  ctx.restore();

  // Glowing white highlight wave curve
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(0, footerTopY + 20);
  ctx.bezierCurveTo(
    320,
    footerTopY - 25,
    720,
    footerTopY + 35,
    1080,
    footerTopY - 15
  );
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.55)';
  ctx.lineWidth = 4;
  ctx.stroke();
  ctx.restore();

  // Left Content in Footer: "জনমঞ্চ" + "সত্যের পাশে, মানুষের জন্য"
  ctx.save();
  ctx.fillStyle = '#ffffff';
  ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
  ctx.shadowBlur = 8;
  ctx.shadowOffsetY = 2;

  ctx.font = `bold 42px "${data.fontFamily}", sans-serif`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText('জনমঞ্চ', 55, footerTopY + 50);

  ctx.font = `500 22px "${data.fontFamily}", sans-serif`;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.92)';
  ctx.fillText('সত্যের পাশে, মানুষের জন্য', 55, footerTopY + 104);
  ctx.restore();

  // Right Content in Footer: "বিস্তারিত কমেন্টে... ›"
  if (data.showButton && data.buttonText) {
    ctx.save();
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetY = 2;

    ctx.font = `bold 26px "${data.fontFamily}", sans-serif`;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillText(data.buttonText, 1025, footerTopY + 85);
    ctx.restore();
  }
}
