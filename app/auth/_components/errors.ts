const MESSAGES: Record<string, string> = {
  INVALID_EMAIL_OR_PASSWORD: "E-mail ou senha incorretos.",
  INVALID_EMAIL: "Esse e-mail não parece válido.",
  INVALID_PASSWORD: "Senha incorreta.",
  EMAIL_NOT_VERIFIED:
    "Você ainda não confirmou seu e-mail. Abra o link que enviamos para entrar.",
  PASSWORD_TOO_SHORT: "A senha precisa ter pelo menos 8 caracteres.",
  PASSWORD_TOO_LONG: "Essa senha é longa demais.",
  USER_ALREADY_EXISTS: "Já existe uma conta com esse e-mail.",
  USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL: "Já existe uma conta com esse e-mail.",
  FAILED_TO_CREATE_USER:
    "Não foi possível criar a conta. Talvez esse usuário já esteja em uso.",
  INVALID_TOKEN: "Esse link de redefinição é inválido ou já foi usado.",
  TOKEN_EXPIRED: "Esse link expirou. Peça um novo.",
  EMAIL_ALREADY_VERIFIED: "Esse e-mail já foi confirmado. Você já pode entrar.",
  VALIDATION_ERROR: "Confira os campos e tente de novo.",
  MISSING_FIELD: "Preencha todos os campos.",
  CREDENTIAL_ACCOUNT_NOT_FOUND: "Sua conta não tem senha cadastrada.",
  EMAIL_IS_THE_SAME: "Esse já é o seu e-mail.",
};

export function authErrorMessage(
  error: { code?: string; status?: number } | null | undefined,
  fallback: string,
) {
  if (error?.status === 429)
    return "Muitas tentativas. Espere um pouco e tente de novo.";
  return (error?.code && MESSAGES[error.code]) || fallback;
}
