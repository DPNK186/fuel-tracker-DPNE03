// Dịch vụ nhận diện chỉ số ODO hoàn toàn offline trên trình duyệt (Canvas + Tesseract.js)

let workerPromise = null;
let progressCallback = null;

// Tính ngưỡng Otsu để chuyển ảnh xám sang nhị phân đen-trắng sắc nét
function computeOtsuThreshold(grayData) {
  const histogram = new Int32Array(256);
  const total = grayData.length;

  for (let i = 0; i < total; i++) {
    histogram[grayData[i]]++;
  }

  let sum = 0;
  for (let i = 0; i < 256; i++) {
    sum += i * histogram[i];
  }

  let sumB = 0;
  let wB = 0;
  let wF = 0;
  let maxVariance = 0;
  let threshold = 128;

  for (let i = 0; i < 256; i++) {
    wB += histogram[i];
    if (wB === 0) continue;

    wF = total - wB;
    if (wF === 0) break;

    sumB += i * histogram[i];
    const mB = sumB / wB;
    const mF = (sum - sumB) / wF;
    const betweenVariance = wB * wF * (mB - mF) * (mB - mF);

    if (betweenVariance > maxVariance) {
      maxVariance = betweenVariance;
      threshold = i;
    }
  }

  return threshold;
}

/**
 * Tiền xử lý ảnh vùng ODO: xoay, cắt khung, phóng to, grayscale, tăng tương phản, đảo màu LCD (nếu cần), nhị phân hóa
 * @param {HTMLImageElement} img
 * @param {{ x: number, y: number, width: number, height: number }} cropBox - Tỷ lệ 0..1
 * @param {{ rotation?: number, invert?: boolean, highContrast?: boolean }} options
 */
export function preprocessOdoCanvas(img, cropBox, options = {}) {
  const { rotation = 0, invert = false, highContrast = true } = options;

  // Bước 1: Vẽ ảnh gốc đã xoay vào canvas trung gian
  const isQuarterTurn = rotation === 90 || rotation === 270;
  const rotWidth = isQuarterTurn ? img.naturalHeight : img.naturalWidth;
  const rotHeight = isQuarterTurn ? img.naturalWidth : img.naturalHeight;

  const rotatedCanvas = document.createElement('canvas');
  rotatedCanvas.width = rotWidth;
  rotatedCanvas.height = rotHeight;
  const rotCtx = rotatedCanvas.getContext('2d');

  rotCtx.translate(rotWidth / 2, rotHeight / 2);
  rotCtx.rotate((rotation * Math.PI) / 180);
  rotCtx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);

  // Bước 2: Cắt vùng khung ngắm ODO
  const sx = Math.max(0, Math.floor(cropBox.x * rotWidth));
  const sy = Math.max(0, Math.floor(cropBox.y * rotHeight));
  const sw = Math.max(10, Math.floor(cropBox.width * rotWidth));
  const sh = Math.max(10, Math.floor(cropBox.height * rotHeight));

  // Chuẩn hóa chiều cao chữ số khoảng 140-220px để Tesseract nhận diện tốt nhất
  const targetHeight = Math.min(240, Math.max(140, sh));
  const scale = targetHeight / sh;
  const targetWidth = Math.min(900, Math.max(120, Math.round(sw * scale)));

  const padding = 20;
  const outCanvas = document.createElement('canvas');
  outCanvas.width = targetWidth + padding * 2;
  outCanvas.height = targetHeight + padding * 2;
  const ctx = outCanvas.getContext('2d', { willReadFrequently: true });

  // Nền trắng để làm viền đệm cho OCR
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, outCanvas.width, outCanvas.height);

  // Vẽ vùng cắt vào giữa
  ctx.drawImage(rotatedCanvas, sx, sy, sw, sh, padding, padding, targetWidth, targetHeight);

  // Bước 3: Xử lý pixel vùng ảnh vừa cắt
  const imageData = ctx.getImageData(padding, padding, targetWidth, targetHeight);
  const data = imageData.data;
  const pixelCount = targetWidth * targetHeight;
  const gray = new Uint8Array(pixelCount);

  let minVal = 255;
  let maxVal = 0;

  for (let i = 0; i < pixelCount; i++) {
    const idx = i * 4;
    let lum = Math.round(0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2]);
    if (invert) {
      lum = 255 - lum;
    }
    gray[i] = lum;
    if (lum < minVal) minVal = lum;
    if (lum > maxVal) maxVal = lum;
  }

  // Kéo giãn tương phản (Contrast Stretching)
  const range = Math.max(1, maxVal - minVal);
  for (let i = 0; i < pixelCount; i++) {
    gray[i] = Math.round(((gray[i] - minVal) / range) * 255);
  }

  // Nhị phân hóa bằng ngưỡng Otsu nếu bật chế độ tương phản cao
  const threshold = highContrast ? computeOtsuThreshold(gray) : null;

  for (let i = 0; i < pixelCount; i++) {
    const idx = i * 4;
    const val = threshold !== null ? (gray[i] >= threshold ? 255 : 0) : gray[i];
    data[idx] = val;
    data[idx + 1] = val;
    data[idx + 2] = val;
    data[idx + 3] = 255;
  }

  ctx.putImageData(imageData, padding, padding);

  return {
    canvas: outCanvas,
    dataUrl: outCanvas.toDataURL('image/png')
  };
}

// Khởi tạo lazy Tesseract worker (tải 1 lần, tự cache offline trong IndexedDB của trình duyệt)
async function getOcrWorker() {
  if (!workerPromise) {
    workerPromise = (async () => {
      const { createWorker, PSM } = await import('tesseract.js');
      const worker = await createWorker('eng', 1, {
        logger: (m) => {
          if (progressCallback) {
            progressCallback(m);
          }
        }
      });

      await worker.setParameters({
        tessedit_char_whitelist: '0123456789',
        tessedit_pageseg_mode: PSM.SINGLE_LINE
      });

      return worker;
    })().catch((err) => {
      workerPromise = null;
      throw err;
    });
  }

  return workerPromise;
}

/**
 * Trích xuất chỉ số ODO tốt nhất từ chuỗi OCR thô
 */
function parseOdoCandidates(rawText) {
  if (!rawText) return { value: '', candidates: [] };

  const cleaned = rawText.replace(/[^0-9\s]/g, ' ').trim();
  const tokens = cleaned.split(/\s+/).filter(Boolean);
  const joinedDigits = tokens.join('');

  const candidateSet = new Set();

  // Thêm các nhóm chữ số riêng lẻ (từ 2 đến 7 chữ số)
  tokens.forEach((tok) => {
    const normalized = tok.replace(/^0+(?=\d)/, '');
    if (normalized.length >= 2 && normalized.length <= 7) {
      candidateSet.add(normalized);
    }
  });

  // Thêm chuỗi gộp nếu có khoảng trắng nhỏ giữa các số đồng hồ cơ/LCD
  if (joinedDigits.length >= 2 && joinedDigits.length <= 7) {
    const normalizedJoined = joinedDigits.replace(/^0+(?=\d)/, '');
    if (normalizedJoined) {
      candidateSet.add(normalizedJoined);
    }
  }

  const candidates = Array.from(candidateSet);

  // Ưu tiên chuỗi có độ dài hợp lý của ODO xe máy / ô tô (4-6 chữ số), sau đó đến chuỗi dài nhất
  candidates.sort((a, b) => {
    const aIdeal = a.length >= 4 && a.length <= 6 ? 1 : 0;
    const bIdeal = b.length >= 4 && b.length <= 6 ? 1 : 0;
    if (aIdeal !== bIdeal) return bIdeal - aIdeal;
    return b.length - a.length;
  });

  return {
    value: candidates[0] || joinedDigits.slice(0, 7) || '',
    candidates
  };
}

/**
 * Chạy nhận diện ODO offline từ canvas đã tiền xử lý
 */
export async function recognizeOdoFromCanvas(canvas, onProgress) {
  progressCallback = onProgress || null;
  try {
    const worker = await getOcrWorker();
    const { data } = await worker.recognize(canvas);
    const rawText = data?.text || '';
    const confidence = Math.round(data?.confidence || 0);
    const { value, candidates } = parseOdoCandidates(rawText);

    return {
      value,
      candidates,
      confidence,
      rawText: rawText.trim()
    };
  } finally {
    progressCallback = null;
  }
}
