"use client";

import { useState } from "react";
import Poster from "./_components/poster";
import LoginForm from "./_components/login-form";
import RegisterForm from "./_components/register-form";
import ForgotForm from "./_components/forgot-form";
import ResetForm from "./_components/reset-form";
import SentCard from "./_components/sent-card";
import { scorePassword } from "./_components/password-strength";
import type { AuthMode, SentContext } from "./_components/types";

export default function AuthPage() {
  const [mode, setMode] = useState<AuthMode>("login");
  const [sentContext, setSentContext] = useState<SentContext>("forgot");

  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [handle, setHandle] = useState("");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showPw2, setShowPw2] = useState(false);
  const [agree, setAgree] = useState(false);

  const score = scorePassword(pw);
  const go = (m: AuthMode) => setMode(m);

  const submit = (e: { preventDefault(): void }) => {
    e.preventDefault();
    if (mode === "forgot") {
      setSentContext("forgot");
      setMode("sent");
    } else if (mode === "reset") {
      setSentContext("reset");
      setMode("sent");
    }
  };

  return (
    <div className="min-h-screen w-full grid grid-cols-[1.05fr_0.95fr] bg-(--cream) overflow-hidden max-[920px]:grid-cols-1">
      <Poster />

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
          {mode === "login" && (
            <LoginForm
              key="login"
              email={email}
              setEmail={setEmail}
              pw={pw}
              setPw={setPw}
              showPw={showPw}
              setShowPw={setShowPw}
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
              go={go}
              submit={submit}
            />
          )}
          {mode === "forgot" && (
            <ForgotForm
              key="forgot"
              email={email}
              setEmail={setEmail}
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
              go={go}
              submit={submit}
            />
          )}
          {mode === "sent" && (
            <SentCard key="sent" email={email} context={sentContext} go={go} />
          )}
        </div>

        <div className="flex items-center justify-between font-mono text-[10px] text-(--ink-4) tracking-[0.06em] uppercase">
          <span>© 2026 Trapiche</span>
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
