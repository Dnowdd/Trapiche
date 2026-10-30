import Image from "next/image";
import { cn, initialsOf } from "@/lib/utils";

export default function Avatar({
  name,
  image,
  size,
  className,
}: {
  name: string;
  image?: string | null;
  size: number;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative rounded-full overflow-hidden shrink-0 select-none flex items-center justify-center bg-(--cream-deep) text-(--ink-2) font-bold border-[1.5px] border-(--ink-2)",
        className,
      )}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.36) }}
    >
      {image ? (
        <Image
          src={image}
          alt={name}
          fill
          unoptimized
          sizes={`${size}px`}
          className="object-cover"
        />
      ) : (
        initialsOf(name)
      )}
    </div>
  );
}
