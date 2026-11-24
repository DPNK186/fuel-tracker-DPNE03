import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Camera, Image as ImageIcon, X, RotateCw, ScanLine, RefreshCw, Check, Contrast, Sparkles } from 'lucide-react';
import { preprocessOdoCanvas, recognizeOdoFromCanvas } from '../services/odoOcr';

const DEFAULT_CROP = {
  x: 0.12,
  y: 0.35,
  width: 0.76,
  height: 0.28
};

export default function OdoScannerModal({ isOpen, onClose, onConfirm, accentColor = 'brand' }) {
  const [imageSrc, setImageSrc] = useState(null);
  const [cropBox, setCropBox] = useState(DEFAULT_CROP);
  const [rotation, setRotation] = useState(0);
  const [invertLcd, setInvertLcd] = useState(false);
  const [highContrast, setHighContrast] = useState(true);

  const [processedPreview, setProcessedPreview] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanStatus, setScanStatus] = useState('');
  const [scanProgress, setScanProgress] = useState(0);
  const [ocrResult, setOcrResult] = useState('');
  const [candidates, setCandidates] = useState([]);
  const [confidence, setConfidence] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  const imgRef = useRef(null);
  const isRose = accentColor === 'rose';

  const resetState = useCallback(() => {
    setImageSrc(null);
    setCropBox(DEFAULT_CROP);
    setRotation(0);
    setInvertLcd(false);
    setHighContrast(true);
    setProcessedPreview(null);
    setIsScanning(false);
    setScanStatus('');
    setScanProgress(0);
    setOcrResult('');
    setCandidates([]);
    setConfidence(null);
    setErrorMsg('');
  }, []);

  useEffect(() => {
    if (!isOpen) {
      resetState();
    }
  }, [isOpen, resetState]);

  const runOcr = useCallback(async (imgElement, currentCrop, currentRotation, currentInvert, currentHighContrast) => {
    if (!imgElement || !imgElement.naturalWidth) return;

    setIsScanning(true);
    setErrorMsg('');
    setScanStatus('Đang xử lý ảnh...');
    setScanProgress(10);

    try {
      const { canvas, dataUrl } = preprocessOdoCanvas(imgElement, currentCrop, {
        rotation: currentRotation,
        invert: currentInvert,
        highContrast: currentHighContrast
      });
      setProcessedPreview(dataUrl);

      const result = await recognizeOdoFromCanvas(canvas, (m) => {
        if (m.status === 'loading tesseract core' || m.status === 'loading language traineddata') {
          setScanStatus('Đang tải bộ nhận diện offline (chỉ tải 1 lần)...');
          setScanProgress(Math.max(15, Math.round((m.progress || 0) * 60)));
        } else if (m.status === 'recognizing text') {
          setScanStatus('Đang đọc chỉ số ODO...');
          setScanProgress(60 + Math.round((m.progress || 0) * 40));
        }
      });

      setOcrResult(result.value);
      setCandidates(result.candidates);
      setConfidence(result.confidence);

      if (!result.value) {
        setErrorMsg('Chưa đọc được số rõ ràng. Hãy căn lại khung cắt vào sát hàng số ODO hoặc bật/tắt chế độ LCD nền tối rồi thử lại.');
      }
    } catch (err) {
      console.error('ODO OCR Error:', err);
      setErrorMsg('Lỗi nhận diện offline: ' + (err.message || 'Không thể chạy OCR'));
    } finally {
      setIsScanning(false);
      setScanStatus('');
      setScanProgress(0);
    }
  }, []);

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      setImageSrc(ev.target.result);
      setCropBox(DEFAULT_CROP);
      setRotation(0);
      setOcrResult('');
      setCandidates([]);
      setConfidence(null);
      setErrorMsg('');
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleImageLoaded = () => {
    if (imgRef.current) {
      runOcr(imgRef.current, cropBox, rotation, invertLcd, highContrast);
    }
  };

  const handleRescan = () => {
    if (imgRef.current) {
      runOcr(imgRef.current, cropBox, rotation, invertLcd, highContrast);
    }
  };

  const handleRotate = () => {
    const nextRot = (rotation + 90) % 360;
    setRotation(nextRot);
    if (imgRef.current) {
      runOcr(imgRef.current, cropBox, nextRot, invertLcd, highContrast);
    }
  };

  const handleToggleInvert = () => {
    const nextInvert = !invertLcd;
    setInvertLcd(nextInvert);
    if (imgRef.current) {
      runOcr(imgRef.current, cropBox, rotation, nextInvert, highContrast);
    }
  };

  const handleConfirm = () => {
    const cleaned = ocrResult.toString().replace(/[^0-9]/g, '');
    if (!cleaned) {
      setErrorMsg('Vui lòng nhập hoặc quét một chỉ số ODO hợp lệ.');
      return;
    }
    onConfirm(cleaned);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[120] bg-black/85 backdrop-blur-sm flex items-start sm:items-center justify-center p-3 sm:p-4 overflow-y-auto pt-6 sm:pt-4">
      <div className="glass-card rounded-3xl w-full max-w-md p-5 space-y-4 animate-fade-in border-slate-700/80 shadow-2xl my-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <ScanLine className={`w-5 h-5 ${isRose ? 'text-rose-400' : 'text-brand-400'}`} />
            <div>
              <h3 className="text-base font-bold text-slate-100">Quét chỉ số ODO (Offline)</h3>
              <p className="text-[10px] text-slate-400">Nhận diện trực tiếp trên máy, không gửi ảnh lên mạng</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-800 transition"
            title="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Chưa có ảnh -> Chọn nguồn ảnh */}
        {!imageSrc ? (
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="relative">
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  id="odo-capture-input"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <label
                  htmlFor="odo-capture-input"
                  className={`w-full h-28 rounded-2xl border border-dashed flex flex-col items-center justify-center gap-2 cursor-pointer transition active:scale-95 ${
                    isRose
                      ? 'bg-rose-500/10 border-rose-500/30 hover:border-rose-400 text-rose-300'
                      : 'bg-brand-500/10 border-brand-500/30 hover:border-brand-400 text-brand-300'
                  }`}
                >
                  <Camera className="w-7 h-7" />
                  <span className="text-xs font-bold">Chụp đồng hồ ODO</span>
                </label>
              </div>

              <div className="relative">
                <input
                  type="file"
                  accept="image/*"
                  id="odo-gallery-input"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <label
                  htmlFor="odo-gallery-input"
                  className="w-full h-28 bg-slate-900/70 border border-dashed border-slate-700 hover:border-slate-500 rounded-2xl flex flex-col items-center justify-center gap-2 cursor-pointer text-slate-300 hover:text-white transition active:scale-95"
                >
                  <ImageIcon className="w-7 h-7 text-slate-400" />
                  <span className="text-xs font-bold">Chọn từ thư viện</span>
                </label>
              </div>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-3 text-[11px] text-slate-400 space-y-1 leading-relaxed">
              <p className="font-semibold text-slate-300">Mẹo để nhận diện chính xác hơn:</p>
              <p>• Chụp thẳng góc, đặt dãy số ODO ở vùng giữa khung hình.</p>
              <p>• Nếu đồng hồ LCD chữ sáng trên nền tối, bật nút <strong>LCD nền tối</strong> sau khi chụp.</p>
            </div>
          </div>
        ) : (
          /* Đã có ảnh -> Căn khung & Hiển thị kết quả */
          <div className="space-y-3.5">
            {/* Ảnh gốc + khung cắt trực quan */}
            <div className="relative w-full bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 flex items-center justify-center max-h-56">
              <img
                ref={imgRef}
                src={imageSrc}
                alt="Đồng hồ ODO"
                onLoad={handleImageLoaded}
                style={{ transform: `rotate(${rotation}deg)` }}
                className="max-h-56 w-full object-contain select-none"
              />

              {/* Khung ngắm vùng ODO (khi rotation === 0 hiển thị chính xác tỷ lệ overlay) */}
              {rotation === 0 && (
                <div
                  className={`absolute pointer-events-none border-2 rounded-lg shadow-[0_0_0_9999px_rgba(0,0,0,0.55)] ${
                    isRose ? 'border-rose-400' : 'border-brand-400'
                  }`}
                  style={{
                    left: `${cropBox.x * 100}%`,
                    top: `${cropBox.y * 100}%`,
                    width: `${cropBox.width * 100}%`,
                    height: `${cropBox.height * 100}%`
                  }}
                />
              )}
            </div>

            {/* Thanh điều chỉnh khung cắt nhanh */}
            <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-3 space-y-2">
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span className="font-semibold text-slate-300">Căn khung vào sát hàng số ODO</span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handleRotate}
                    disabled={isScanning}
                    className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center gap-1 text-[10px] font-semibold transition"
                    title="Xoay ảnh 90 độ"
                  >
                    <RotateCw className="w-3 h-3" />
                    Xoay
                  </button>
                  <button
                    type="button"
                    onClick={handleToggleInvert}
                    disabled={isScanning}
                    className={`px-2 py-1 rounded-lg border flex items-center gap-1 text-[10px] font-semibold transition ${
                      invertLcd
                        ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                        : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                    }`}
                    title="Đảo màu cho đồng hồ LCD chữ sáng trên nền tối"
                  >
                    <Contrast className="w-3 h-3" />
                    LCD nền tối
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-[10px] text-slate-400">
                <label className="flex flex-col gap-0.5">
                  <span>Vị trí dọc ({Math.round(cropBox.y * 100)}%)</span>
                  <input
                    type="range"
                    min="0"
                    max={Math.max(0.05, 1 - cropBox.height).toFixed(2)}
                    step="0.02"
                    value={cropBox.y}
                    onChange={(e) => setCropBox(prev => ({ ...prev, y: parseFloat(e.target.value) }))}
                    className="accent-brand-500 h-1.5"
                  />
                </label>
                <label className="flex flex-col gap-0.5">
                  <span>Chiều cao khung ({Math.round(cropBox.height * 100)}%)</span>
                  <input
                    type="range"
                    min="0.1"
                    max="0.7"
                    step="0.02"
                    value={cropBox.height}
                    onChange={(e) => {
                      const h = parseFloat(e.target.value);
                      setCropBox(prev => ({ ...prev, height: h, y: Math.min(prev.y, 1 - h) }));
                    }}
                    className="accent-brand-500 h-1.5"
                  />
                </label>
                <label className="flex flex-col gap-0.5">
                  <span>Vị trí ngang ({Math.round(cropBox.x * 100)}%)</span>
                  <input
                    type="range"
                    min="0"
                    max={Math.max(0.05, 1 - cropBox.width).toFixed(2)}
                    step="0.02"
                    value={cropBox.x}
                    onChange={(e) => setCropBox(prev => ({ ...prev, x: parseFloat(e.target.value) }))}
                    className="accent-brand-500 h-1.5"
                  />
                </label>
                <label className="flex flex-col gap-0.5">
                  <span>Chiều rộng khung ({Math.round(cropBox.width * 100)}%)</span>
                  <input
                    type="range"
                    min="0.2"
                    max="1"
                    step="0.02"
                    value={cropBox.width}
                    onChange={(e) => {
                      const w = parseFloat(e.target.value);
                      setCropBox(prev => ({ ...prev, width: w, x: Math.min(prev.x, 1 - w) }));
                    }}
                    className="accent-brand-500 h-1.5"
                  />
                </label>
              </div>

              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-1.5 text-[10px] text-slate-400 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={highContrast}
                    onChange={(e) => setHighContrast(e.target.checked)}
                    className="rounded bg-slate-900 border-slate-700 accent-brand-500"
                  />
                  Tăng tương phản đen/trắng (Otsu)
                </label>

                <button
                  type="button"
                  onClick={handleRescan}
                  disabled={isScanning}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-100 text-xs font-semibold flex items-center gap-1.5 transition active:scale-95"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} />
                  Quét lại
                </button>
              </div>
            </div>

            {/* Preview ảnh đã tiền xử lý */}
            {processedPreview && (
              <div className="flex items-center gap-3 bg-slate-950/60 border border-slate-800/80 rounded-xl p-2">
                <span className="text-[10px] text-slate-500 flex-shrink-0">Vùng OCR đọc:</span>
                <img
                  src={processedPreview}
                  alt="Vùng ODO đã xử lý"
                  className="h-9 max-w-[200px] object-contain rounded border border-slate-800 bg-white"
                />
              </div>
            )}

            {/* Thanh tiến trình OCR */}
            {isScanning && (
              <div className="bg-sky-500/10 border border-sky-500/20 rounded-xl p-3 space-y-1.5">
                <div className="flex items-center justify-between text-xs text-sky-300">
                  <span className="flex items-center gap-1.5 font-medium">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    {scanStatus || 'Đang nhận diện...'}
                  </span>
                  <span className="font-mono text-[11px]">{scanProgress}%</span>
                </div>
                <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-sky-400 h-full transition-all duration-200"
                    style={{ width: `${scanProgress}%` }}
                  />
                </div>
              </div>
            )}

            {errorMsg && (
              <p className="text-[11px] text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-xl p-2.5 leading-relaxed">
                {errorMsg}
              </p>
            )}

            {/* Kết quả nhận diện (cho phép sửa tay nhanh trước khi áp dụng) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs text-slate-300 font-semibold flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  Kết quả ODO (có thể sửa nhanh)
                </label>
                {confidence !== null && !isScanning && (
                  <span className="text-[10px] text-slate-400">
                    Độ tin cậy: <strong className={confidence >= 70 ? 'text-emerald-400' : 'text-amber-400'}>{confidence}%</strong>
                  </span>
                )}
              </div>

              <input
                type="number"
                inputMode="numeric"
                value={ocrResult}
                onChange={(e) => setOcrResult(e.target.value)}
                placeholder="Nhập hoặc quét chỉ số ODO..."
                className="glass-input w-full text-center text-lg font-bold tracking-widest font-mono"
              />

              {candidates.length > 1 && (
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[10px] text-slate-500">Gợi ý khác:</span>
                  {candidates.map((cand) => (
                    <button
                      key={cand}
                      type="button"
                      onClick={() => setOcrResult(cand)}
                      className={`text-[11px] font-mono px-2 py-0.5 rounded-lg border transition ${
                        ocrResult === cand
                          ? 'bg-brand-500/20 border-brand-500/50 text-brand-300 font-bold'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {cand}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Footer buttons */}
            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <button
                type="button"
                onClick={resetState}
                className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition active:scale-95"
              >
                Chụp / Chọn lại
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={isScanning || !ocrResult}
                className={`py-2.5 px-3 rounded-xl text-white text-xs font-bold flex items-center justify-center gap-1.5 transition active:scale-95 disabled:opacity-50 ${
                  isRose
                    ? 'bg-gradient-to-r from-rose-500 to-orange-600 hover:from-rose-600 hover:to-orange-700'
                    : 'bg-gradient-to-r from-brand-500 to-emerald-600 hover:from-brand-600 hover:to-emerald-700'
                }`}
              >
                <Check className="w-4 h-4" />
                Áp dụng ODO
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
