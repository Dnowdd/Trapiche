"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Poster from "./poster";
import LoginForm from "./login-form";
import RegisterForm from "./register-form";
import ForgotForm from "./forgot-form";
import ResetForm from "./reset-form";
import SentCard from "./sent-card";
import { scorePassword } from "./password-strength";
import type { AuthMode, SentContext } from "./types";
import { authClient } from "@/lib/auth-client";
import type { Book } from "@/lib/types/book";

interface AuthContentProps {
  books: Book[];
}

export default function AuthContent({ books }: AuthContentProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [mode, setMode] = useState<AuthMode>("login");
  const [sentContext, setSentContext] = useState<SentContext>("forgot");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [handle, setHandle] = useState("");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showPw2, setShowPw2] = useState(false);
  const [agree, setAgree] = useState(false);

  const score = scorePassword(pw);
  const go = (m: AuthMode) => {
    setMode(m);
    setError("");
  };

  // If the URL has a token, go straight to the reset form
  useEffect(() => {
    if (searchParams.get("token")) setMode("reset");
  }, [searchParams]);

  const submit = async (e: { preventDefault(): void }) => {
    e.preventDefault();
    setError("");
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
          setError(error.message ?? "Erro ao criar conta.");
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
        });
        if (error) {
          setError(error.message ?? "E-mail ou senha inválidos.");
          return;
        }
        router.push("/");
      } else if (mode === "forgot") {
        const { error } = await authClient.requestPasswordReset({
          email,
          redirectTo: `${window.location.origin}/auth`,
        });
        if (error) {
          setError(error.message ?? "Erro ao enviar e-mail.");
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
          setError(error.message ?? "Erro ao redefinir senha.");
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
    <div className="min-h-screen w-full grid grid-cols-[1.05fr_0.95fr] bg-(--cream) overflow-hidden max-[920px]:grid-cols-1">
      <Poster books={books} />

      <div className="flex flex-col py-10 px-14 relative min-h-screen">
        <div className="flex items-center justify-end gap-3 text-[13px] text-(--ink-3)">
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
            <a href="#" className="hover:text-(--ink-2)">
              Termos
            </a>
            <a href="#" className="hover:text-(--ink-2)">
              Privacidade
            </a>
            <a href="#" className="hover:text-(--ink-2)">
              Ajuda
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
