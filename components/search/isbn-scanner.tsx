"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { useRouter } from "next/navigation";
import { ScanBarcode } from "lucide-react";
import Modal from "@/components/shared/modal";
import { cn } from "@/lib/utils";

interface Detector {
  detect(source: HTMLVideoElement): Promise<{ rawValue: string }[]>;
}
type DetectorCtor = new (opts: { formats: string[] }) => Detector;

const detectorCtor = () =>
  (globalThis as unknown as { BarcodeDetector?: DetectorCtor }).BarcodeDetector;

function useScannerSupport() {
  return useSyncExternalStore(
    () => () => {},
    () =>
      Boolean(detectorCtor()) && Boolean(navigator.mediaDevices?.getUserMedia),
    () => false,
  );
}

const isIsbn = (v: string) => /^97[89]\d{10}$/.test(v);

function Scanner({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const video = useRef<HTMLVideoElement>(null);
  const [status, setStatus] = useState<
    "starting" | "scanning" | "found" | "denied" | "error"
  >("starting");
  const [found, setFound] = useState<string | null>(null);

  const resolve = useCallback(
    async (isbn: string) => {
      setFound(isbn);
      setStatus("found");
      navigator.vibrate?.(60);
      try {
        const res = await fetch(`/api/books/isbn/${isbn}`);
        const data = (await res.json()) as { id?: string | null };
        onClose();
        router.push(data.id ? `/book/${data.id}` : `/search?q=${isbn}`);
      } catch {
        onClose();
        router.push(`/search?q=${isbn}`);
      }
    },
    [onClose, router],
  );

  useEffect(() => {
    let stream: MediaStream | null = null;
    let frame = 0;
    let stopped = false;
    const Ctor = detectorCtor();
    if (!Ctor) return;
    const detector = new Ctor({ formats: ["ean_13"] });

    const tick = async () => {
      if (stopped || !video.current) return;
      const codes = await detector.detect(video.current).catch(() => []);
      const hit = codes.map((c) => c.rawValue).find(isIsbn);
      if (hit) {
        stopped = true;
        void resolve(hit);
        return;
      }
      frame = window.setTimeout(tick, 180);
    };

    navigator.mediaDevices
      .getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      })
      .then(async (s) => {
        if (stopped) return s.getTracks().forEach((t) => t.stop());
        stream = s;
        if (!video.current) return;
        video.current.srcObject = s;
        await video.current.play();
        setStatus("scanning");
        tick();
      })
      .catch((err: unknown) =>
        setStatus(
          err instanceof DOMException && err.name === "NotAllowedError"
            ? "denied"
            : "error",
        ),
      );

    return () => {
      stopped = true;
      window.clearTimeout(frame);
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [resolve]);

  return (
    <div>
      <div className="relative aspect-4/3 rounded-[14px] overflow-hidden bg-(--ink)">
        <video
          ref={video}
          playsInline
          muted
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div
            className={cn(
              "relative w-[78%] h-[34%] rounded-[12px] border-2 transition-colors",
              status === "found" ? "border-(--yellow)" : "border-white/80",
            )}
          >
            {status === "scanning" && (
              <span className="absolute left-2 right-2 top-1/2 h-0.5 bg-(--yellow) shadow-[0_0_12px_var(--yellow)] animate-pulse" />
            )}
          </div>
        </div>
        {status !== "scanning" && (
          <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/70 to-transparent px-4 pt-10 pb-4 text-center text-[13px] text-white">
            {status === "starting" && "Abrindo a câmera…"}
            {status === "found" && `ISBN ${found} · procurando o livro…`}
            {status === "denied" &&
              "Sem acesso à câmera. Libere a permissão no navegador e tente de novo."}
            {status === "error" && "Não deu pra abrir a câmera neste aparelho."}
          </div>
        )}
      </div>
      <p className="m-0 mt-3 text-[12.5px] text-(--ink-4) text-center">
        Aponte para o código de barras da contracapa (o que começa com 978 ou
        979).
      </p>
    </div>
  );
}

export default function IsbnScanner({ className }: { className?: string }) {
  const supported = useScannerSupport();
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  if (!supported) return null;

  return (
    <>
      <button
        type="button"
        aria-label="Escanear código de barras"
        title="Escanear código de barras"
        onClick={() => setOpen(true)}
        className={cn(
          "shrink-0 text-(--ink-3) hover:text-(--ink) cursor-pointer",
          className,
        )}
      >
        <ScanBarcode size={16} strokeWidth={2} />
      </button>
      {open && (
        <Modal
          open
          onOpenChange={setOpen}
          eyebrow="Busca por ISBN"
          title="Escanear livro"
        >
          <Scanner onClose={close} />
        </Modal>
      )}
    </>
  );
}
