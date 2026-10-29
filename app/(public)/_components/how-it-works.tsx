const StepIlluCadastro = () => {
  return (
    <div style={{ display: "flex", gap: 6, alignItems: "flex-end" }}>
      <div
        style={{
          width: 30,
          height: 42,
          background: "#2A2920",
          borderRadius: 2,
        }}
      />
      <div
        style={{
          width: 30,
          height: 50,
          background: "#5B3A1E",
          borderRadius: 2,
        }}
      />
      <div
        style={{
          width: 30,
          height: 46,
          background: "#1E3A3A",
          borderRadius: 2,
        }}
      />
      <div
        style={{
          width: 30,
          height: 54,
          border: "1.5px dashed rgba(67,62,18,0.3)",
          borderRadius: 2,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--ink-4)",
          fontSize: 18,
          fontWeight: 300,
        }}
      >
        +
      </div>
    </div>
  );
};

const StepIlluListas = () => {
  const bar = (w: number, c: string) => (
    <div style={{ height: 8, width: w, background: c, borderRadius: 2 }} />
  );
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
        <div
          style={{
            width: 8,
            height: 8,
            background: "var(--ink-2)",
            borderRadius: 2,
          }}
        />
        {bar(120, "rgba(67,62,18,0.18)")}
      </div>
      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
        <div
          style={{
            width: 8,
            height: 8,
            background: "var(--yellow)",
            borderRadius: 2,
            border: "1px solid var(--ink-3)",
          }}
        />
        {bar(90, "rgba(67,62,18,0.12)")}
      </div>
      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
        <div
          style={{
            width: 8,
            height: 8,
            background: "var(--ink-4)",
            borderRadius: 2,
          }}
        />
        {bar(140, "rgba(67,62,18,0.10)")}
      </div>
    </div>
  );
};

const StepIlluDescubra = () => {
  return (
    <div style={{ display: "flex" }}>
      {["A", "M", "J", "R"].map((c, i) => (
        <div
          key={i}
          style={{
            width: 32,
            height: 32,
            borderRadius: 999,
            background: ["#FFE767", "#F8E99D", "#5B3A1E", "#2A2920"][i],
            color: i < 2 ? "#433E12" : "#FFE767",
            border: "2px solid var(--cream-card)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 12,
            fontWeight: 700,
            marginLeft: i === 0 ? 0 : -10,
          }}
        >
          {c}
        </div>
      ))}
    </div>
  );
};

const HowItWorks = () => {
  const steps = [
    {
      n: "01",
      title: "Cadastre o que você lê",
      body: "Busque por título, autor ou ISBN. A gente traz capa, edições e dados do livro — as datas, as notas e as anotações são suas.",
    },
    {
      n: "02",
      title: "Crie listas com cara sua",
      body: "Estantes, pilhas, recomendados, releituras. Sem regra de gênero, sem metas absurdas. Listas privadas, públicas ou compartilhadas.",
    },
    {
      n: "03",
      title: "Descubra com gente real",
      body: "Veja listas e resenhas de leitoras reais e descubra o que quem leu o mesmo livro leu também. Sem ranking de mais vendidos.",
    },
  ];

  return (
    <section
      className="px-4 sm:px-8 lg:px-20 scroll-mt-6"
      id="como-funciona"
      data-screen-label="03 Como funciona"
    >
      <div className="pb-4">
        <div>
          <div className="font-mono text-[11px] text-(--ink-4) tracking-[0.06em] uppercase mb-1.5">
            Como funciona
          </div>

          <h2 className="m-0 text-[22px] font-bold text-(--ink-2) tracking-[-0.01em]">
            Três passos. Sem ranking, sem leitura por obrigação.
          </h2>
        </div>
      </div>

      <div className="grid gap-4.5 md:grid-cols-3 pt-2">
        {steps.map((s, i) => (
          <div
            className="bg-(--cream-card) border border-[rgba(67,62,18,0.07)] rounded-[18px] p-6 md:pt-7 md:px-7 md:pb-8 flex flex-col gap-3.5 relative md:min-h-55"
            key={i}
          >
            <div className="font-mono text-[11px] text-(--ink-4) tracking-[0.08em]">
              PASSO {s.n}
            </div>

            <h3 className="m-0 text-[22px] font-bold tracking-[-0.01em] text-(--ink-2) leading-[1.1]">
              {s.title}
            </h3>

            <p className="m-0 text-[13px] leading-[1.55] text-(--ink-3)">
              {s.body}
            </p>

            <div className="mt-auto h-14 flex items-end gap-1.5">
              {i === 0 && <StepIlluCadastro />}
              {i === 1 && <StepIlluListas />}
              {i === 2 && <StepIlluDescubra />}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default HowItWorks;
