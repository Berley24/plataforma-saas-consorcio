import { useRef, useState } from 'react';
import { getToken } from '../lib/api';
import { IconCamera } from '../lib/icons';

interface Props {
  value: string;
  onChange: (url: string) => void;
  label: string;
  hint?: string;
  // remove fundo branco por flood-fill no cliente (recorte flutuante)
  cutout?: boolean;
}

async function uploadFile(file: File): Promise<string> {
  const fd = new FormData();
  fd.append('file', file);
  const res = await fetch('/api/upload', {
    method: 'POST',
    headers: { Authorization: `Bearer ${getToken()}` },
    body: fd,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Falha no upload.');
  return data.url;
}

// remove o fundo branco por flood fill a partir das bordas
function removeWhiteBackground(img: HTMLImageElement): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  const maxW = 800;
  const scale = Math.min(1, maxW / img.width);
  canvas.width = Math.round(img.width * scale);
  canvas.height = Math.round(img.height * scale);
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const px = data.data;
  const w = canvas.width;
  const h = canvas.height;

  const tol = 60;
  const isWhite = (i: number) => {
    return (
      px[i] > 255 - tol &&
      px[i + 1] > 255 - tol &&
      px[i + 2] > 255 - tol &&
      px[i + 3] > 10
    );
  };

  const visited = new Uint8Array(w * h);
  const stack: number[] = [];
  const push = (x: number, y: number) => {
    if (x < 0 || y < 0 || x >= w || y >= h) return;
    const idx = y * w + x;
    if (visited[idx]) return;
    visited[idx] = 1;
    if (isWhite(idx * 4)) stack.push(idx);
  };
  for (let x = 0; x < w; x++) push(x, 0);
  for (let x = 0; x < w; x++) push(x, h - 1);
  for (let y = 0; y < h; y++) push(0, y);
  for (let y = 0; y < h; y++) push(w - 1, y);

  while (stack.length) {
    const idx = stack.pop()!;
    px[idx * 4 + 3] = 0;
    const x = idx % w;
    const y = (idx / w) | 0;
    push(x + 1, y);
    push(x - 1, y);
    push(x, y + 1);
    push(x, y - 1);
  }

  ctx.putImageData(data, 0, 0);
  return canvas;
}

export default function ImageField({ value, onChange, label, hint, cutout }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const handle = async (f: File | undefined) => {
    if (!f) return;
    setBusy(true);
    setErr('');
    try {
      if (cutout && /image\/(png|jpe?g|webp)/.test(f.type)) {
        const url = URL.createObjectURL(f);
        const img = new Image();
        img.onload = async () => {
          try {
            const canvas = removeWhiteBackground(img);
            const blob: Blob = await new Promise((res, rej) =>
              canvas.toBlob((b) => (b ? res(b) : rej(new Error('Falha ao processar'))), 'image/png')
            );
            const filePng = new File([blob], 'cutout.png', { type: 'image/png' });
            const uploaded = await uploadFile(filePng);
            onChange(uploaded);
          } catch (e) {
            setErr((e as Error).message);
          } finally {
            setBusy(false);
            URL.revokeObjectURL(url);
          }
        };
        img.onerror = () => {
          setErr('Falha ao ler a imagem.');
          setBusy(false);
          URL.revokeObjectURL(url);
        };
        img.src = url;
      } else {
        const uploaded = await uploadFile(f);
        onChange(uploaded);
        setBusy(false);
      }
    } catch (e) {
      setErr((e as Error).message);
      setBusy(false);
    }
  };

  return (
    <div className="img-field">
      <label>{label}</label>
      <div className="img-field-row">
        {value ? (
          <div className="img-preview">
            <img src={value} alt="prévia" />
            <button type="button" className="img-remove" onClick={() => onChange('')} title="Remover">
              ×
            </button>
          </div>
        ) : (
          <div className="img-preview empty" onClick={() => fileRef.current?.click()}>
            <IconCamera size={22} />
          </div>
        )}
        <div className="img-controls">
          <button type="button" className="btn btn-sm btn-secondary" onClick={() => fileRef.current?.click()} disabled={busy}>
            {busy ? 'Enviando…' : value ? 'Trocar imagem' : 'Enviar imagem'}
          </button>
          {cutout && (
            <p className="img-hint mono">
              com “recorte”: fundo branco é removido automaticamente (PNG com transparência)
            </p>
          )}
          {hint && <p className="img-hint small">{hint}</p>}
          {err && <p className="img-err">{err}</p>}
        </div>
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handle(e.target.files?.[0])}
      />
    </div>
  );
}
