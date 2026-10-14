import { USER } from "../mock-profile";

const ProfileCard = () => {
  return (
    <section
      className="pt-10 px-15 pb-9 grid grid-cols-2 gap-10 items-center"
      data-screen-label="01 Perfil"
    >
      <div>
        <div className="flex gap-6 items-center">
          <div className="w-32 h-32 rounded-full bg-(--yellow) border-[1.5px] border-(--ink-2) flex items-center justify-center text-[42px] font-extrabold text-(--ink-2) tracking-[-0.02em] shrink-0">
            {USER.initials}
          </div>
          <div>
            <h1 className="m-0 text-[36px] font-extrabold tracking-[-0.025em] text-(--ink) leading-none">
              {USER.name}
            </h1>
            <div className="mt-1.5 font-mono text-[11px] text-(--ink-4) tracking-[0.04em] flex gap-3.5 items-center">
              <span>{USER.handle}</span>
              <span className="text-(--ink-5)">·</span>
              <span>{USER.city}</span>
              <span className="text-(--ink-5)">·</span>
              <span>desde {USER.joined}</span>
            </div>
            <div className="mt-3.5 flex gap-2.5">
              <button className="text-[12px] font-medium border border-(--yellow-deep) text-(--ink-2) py-[7px] px-[14px] rounded-md bg-(--yellow) transition-colors duration-150 hover:bg-(--yellow-soft)">
                Editar perfil
              </button>
              <button className="text-[12px] font-medium border border-(--ink-3) text-(--ink-2) py-[7px] px-[14px] rounded-md bg-transparent transition-colors duration-150 hover:bg-(--yellow-soft)">
                Compartilhar
              </button>
            </div>
          </div>
        </div>
        <p className="mt-2.5 text-[13px] text-(--ink-3) leading-[1.55] max-w-[460px]">
          {USER.bio}
        </p>
      </div>
      <div className="grid grid-cols-3 border-l border-[rgba(67,62,18,0.1)] pl-10">
        {USER.stats.map((s, i) => (
          <div
            className="py-3.5 px-4 border-r border-b border-[rgba(67,62,18,0.08)] [&:nth-child(3n)]:border-r-0 [&:nth-last-child(-n+3)]:border-b-0"
            key={i}
          >
            <div className="text-[28px] font-bold tracking-[-0.02em] text-(--ink) leading-none">
              {s.value}
            </div>
            <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.06em] text-(--ink-4)">
              {s.label}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default ProfileCard;
