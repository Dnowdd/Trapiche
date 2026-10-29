"use client";

import Link from "next/link";
import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Poster from "./poster";
import LoginForm from "./login-form";
import RegisterForm from "./register-form";
import ForgotForm from "./forgot-form";
import ResetForm from "./reset-form";
import SentCard from "./sent-card";
import { scorePassword } from "./password-strength";
import { authErrorMessage } from "./errors";
import type { AuthMode, SentContext } from "./types";
import { authClient } from "@/lib/auth-client";
import type { Book } from "@/lib/types/book";

const WEAK_PASSWORD =
  "Escolha uma senha mais forte: 8+ caracteres e pelo menos dois entre maiúscula e minúscula, número e símbolo.";

const isStrong = (pw: string) => pw.length >= 8 && scorePassword(pw) >= 3;

interface AuthContentProps {
  books: Book[];
}

export default function AuthContent({ books }: AuthContentProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [mode, setMode] = useState<AuthMode>(() => {
    if (searchParams.get("token")) return "reset";
    return searchParams.get("mode") === "register" ? "register" : "login";
  });
  const [sentContext, setSentContext] = useState<SentContext>("forgot");
  const [error, setError] = useState(() =>
    searchParams.get("error") === "INVALID_TOKEN"
      ? authErrorMessage({ code: "INVALID_TOKEN" }, "")
      : "",
  );
  const [unverified, setUnverified] = useState(false);
  const [loading, setLoading] = useState(false);

  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [handle, setHandle] = useState("");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showPw2, setShowPw2] = useState(false);
  const [agree, setAgree] = useState(false);
  const [remember, setRemember] = useState(true);

  const score = scorePassword(pw);
  const go = (m: AuthMode) => {
    setMode(m);
    setError("");
    setUnverified(false);
  };

  const validate = () => {
    if (mode === "register") {
      if (!name.trim() || !handle.trim() || !email.trim() || !pw)
        return "Preencha todos os campos.";
      if (!isStrong(pw)) return WEAK_PASSWORD;
      if (!agree)
        return "Aceite os Termos de uso e a Política de Privacidade para continuar.";
    } else if (mode === "login") {
      if (!email.trim() || !pw) return "Informe seu e-mail e sua senha.";
    } else if (mode === "forgot") {
      if (!email.trim()) return "Informe o e-mail da sua conta.";
    } else if (mode === "reset") {
      if (!isStrong(pw)) return WEAK_PASSWORD;
      if (pw !== pw2) return "As senhas não conferem.";
    }
    return "";
  };

  const resendVerification = async () => {
    setLoading(true);
    try {
      const { error } = await authClient.sendVerificationEmail({
        email,
        callbackURL: "/",
      });
      if (error) {
        setError(
          authErrorMessage(error, "Não foi possível reenviar o e-mail."),
        );
        return;
      }
      setUnverified(false);
      setError("");
      setSentContext("verify");
      setMode("sent");
    } finally {
      setLoading(false);
    }
  };

  const submit = async (e: { preventDefault(): void }) => {
    e.preventDefault();
    setUnverified(false);
    const invalid = validate();
    setError(invalid);
    if (invalid) return;
    setLoading(true);

    try {
      if (mode === "register") {
        const { data, error } = await authClient.signUp.email({
          email,
          password: pw,
          name,
          handle,
        } as Parameters<typeof authClient.signUp.email>[0]);
        if (error) {
          setError(authErrorMessage(error, "Não foi possível criar a conta."));
          return;
        }
        // token presente → SKIP_EMAIL_VERIFICATION=true, sessão criada direto
        if (data?.token) {
          router.push("/");
          return;
        }
        setSentContext("verify");
        setMode("sent");
      } else if (mode === "login") {
        const { error } = await authClient.signIn.email({
          email,
          password: pw,
          rememberMe: remember,
        });
        if (error) {
          setUnverified(error.code === "EMAIL_NOT_VERIFIED");
          setError(authErrorMessage(error, "Não foi possível entrar."));
          return;
        }
        router.push("/");
      } else if (mode === "forgot") {
        const { error } = await authClient.requestPasswordReset({
          email,
          redirectTo: `${window.location.origin}/auth`,
        });
        if (error) {
          setError(
            authErrorMessage(error, "Não foi possível enviar o e-mail."),
          );
          return;
        }
        setSentContext("forgot");
        setMode("sent");
      } else if (mode === "reset") {
        const token = searchParams.get("token") ?? "";
        const { error } = await authClient.resetPassword({
          newPassword: pw,
          token,
        });
        if (error) {
          setError(
            authErrorMessage(error, "Não foi possível redefinir a senha."),
          );
          return;
        }
        setSentContext("reset");
        setMode("sent");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      data-responsive
      className="min-h-screen w-full grid grid-cols-[1.05fr_0.95fr] bg-(--cream) overflow-hidden max-[920px]:grid-cols-1"
    >
      <Poster books={books} />

      <div className="flex flex-col py-8 md:py-10 px-5 sm:px-10 md:px-14 relative min-h-screen">
        <div className="flex items-center justify-end gap-3 text-[13px] text-(--ink-3)">
          <Link
            href="/"
            className="mr-auto text-[22px] font-extrabold tracking-[-0.02em] text-(--ink-2) min-[921px]:hidden"
          >
            Trapiche
          </Link>
          {mode === "login" && (
            <>
              Ainda não tem conta?{" "}
              <span
                className="text-(--ink-2) font-semibold border-b-[1.5px] border-(--yellow-deep) pb-px cursor-pointer hover:border-(--ink-2)"
                onClick={() => go("register")}
              >
                Criar conta
              </span>
            </>
          )}
          {mode === "register" && (
            <>
              Já navega com a gente?{" "}
              <span
                className="text-(--ink-2) font-semibold border-b-[1.5px] border-(--yellow-deep) pb-px cursor-pointer hover:border-(--ink-2)"
                onClick={() => go("login")}
              >
                Entrar
              </span>
            </>
          )}
          {(mode === "forgot" || mode === "reset" || mode === "sent") && (
            <span
              className="text-(--ink-2) font-semibold border-b-[1.5px] border-(--yellow-deep) pb-px cursor-pointer hover:border-(--ink-2)"
              onClick={() => go("login")}
            >
              Voltar ao login
            </span>
          )}
        </div>

        <div className="flex-1 flex flex-col justify-center max-w-100 w-full mx-auto py-7.5">
          {error && (
            <div className="mb-4 px-4 py-3 rounded-[10px] bg-red-50 border border-red-200 text-[13px] text-red-700">
              {error}
              {unverified && (
                <button
                  type="button"
                  onClick={resendVerification}
                  disabled={loading}
                  className="block mt-1.5 font-semibold underline underline-offset-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  Reenviar e-mail de confirmação
                </button>
              )}
            </div>
          )}

          {mode === "login" && (
            <LoginForm
              key="login"
              email={email}
              setEmail={setEmail}
              pw={pw}
              setPw={setPw}
              showPw={showPw}
              setShowPw={setShowPw}
              remember={remember}
              setRemember={setRemember}
              loading={loading}
              go={go}
              submit={submit}
            />
          )}
          {mode === "register" && (
            <RegisterForm
              key="register"
              name={name}
              setName={setName}
              handle={handle}
              setHandle={setHandle}
              email={email}
              setEmail={setEmail}
              pw={pw}
              setPw={setPw}
              showPw={showPw}
              setShowPw={setShowPw}
              score={score}
              agree={agree}
              setAgree={setAgree}
              loading={loading}
              go={go}
              submit={submit}
            />
          )}
          {mode === "forgot" && (
            <ForgotForm
              key="forgot"
              email={email}
              setEmail={setEmail}
              loading={loading}
              go={go}
              submit={submit}
            />
          )}
          {mode === "reset" && (
            <ResetForm
              key="reset"
              pw={pw}
              setPw={setPw}
              pw2={pw2}
              setPw2={setPw2}
              showPw={showPw}
              setShowPw={setShowPw}
              showPw2={showPw2}
              setShowPw2={setShowPw2}
              score={score}
              loading={loading}
              go={go}
              submit={submit}
            />
          )}
          {mode === "sent" && (
            <SentCard key="sent" email={email} context={sentContext} go={go} />
          )}
        </div>

        <div className="flex items-center justify-between font-mono text-[10px] text-(--ink-4) tracking-[0.06em] uppercase">
          <span>© {new Date().getFullYear()} Trapiche</span>
          <div className="flex gap-4.5">
            <Link href="/termos" className="hover:text-(--ink-2)">
              Termos
            </Link>
            <Link href="/privacidade" className="hover:text-(--ink-2)">
              Privacidade
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
