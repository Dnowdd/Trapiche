export type Visibility = "PUBLIC" | "PRIVATE" | "SHARED";

export const VISIBILITY_LABEL: Record<Visibility, string> = {
  PUBLIC: "Pública",
  PRIVATE: "Privada",
  SHARED: "Compartilhada",
};

export const VISIBILITY_HINT: Record<Visibility, string> = {
  PUBLIC: "Qualquer pessoa vê e pode seguir.",
  PRIVATE: "Só você vê.",
  SHARED: "Você e quem você convidar veem e editam.",
};
