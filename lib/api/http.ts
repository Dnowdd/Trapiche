import { NextResponse } from "next/server";
import { db } from "../db";
import { consumeRateLimit, type RateLimitResult } from "../rate-limit";
import { hashKey, looksLikeKey } from "./keys";
import { runAs } from "../actor";
import type { ActionResult } from "../actions/result";

import {
  DEFAULT_PER_PAGE,
  MAX_PER_PAGE,
  RATE_PER_DAY,
  RATE_PER_MINUTE,
} from "./limits";

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
  }
}

export const badParam = (name: string, message: string) =>
  new ApiError(400, "invalid_parameter", `${name}: ${message}`);

export interface ApiContext {
  userId: string;
  keyId: string;
  params: URLSearchParams;
  body: () => Promise<Record<string, unknown>>;
}

const MAX_BODY_BYTES = 64 * 1024;

async function readBody(req: Request) {
  const text = await req.text();
  if (text.length > MAX_BODY_BYTES)
    throw new ApiError(
      413,
      "payload_too_large",
      "Corpo da requisição grande demais.",
    );
  if (!text.trim()) return {};
  try {
    const parsed = JSON.parse(text);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed))
      return parsed as Record<string, unknown>;
  } catch {
    throw new ApiError(400, "invalid_json", "Envie um JSON válido.");
  }
  throw new ApiError(
    400,
    "invalid_json",
    "O corpo precisa ser um objeto JSON.",
  );
}

export async function act<T>(
  userId: string,
  fn: () => Promise<ActionResult<T>>,
): Promise<T | undefined> {
  const result = await runAs(userId, fn);
  if (!result.ok)
    throw new ApiError(
      result.error === "Sem permissão." ? 403 : 422,
      result.error === "Sem permissão." ? "forbidden" : "invalid_request",
      result.error,
    );
  return result.data;
}

function readKey(req: Request) {
  const auth = req.headers.get("authorization") ?? "";
  const bearer = /^Bearer\s+(.+)$/i.exec(auth)?.[1]?.trim();
  return bearer ?? req.headers.get("x-api-key")?.trim() ?? null;
}

function rateHeaders(r: RateLimitResult) {
  return {
    "X-RateLimit-Limit": String(r.limit),
    "X-RateLimit-Remaining": String(r.remaining),
    "X-RateLimit-Reset": String(Math.ceil(r.resetAt / 1000)),
  };
}

function errorResponse(err: ApiError, headers: Record<string, string> = {}) {
  return NextResponse.json(
    { error: { code: err.code, message: err.message } },
    {
      status: err.status,
      headers: { "Cache-Control": "no-store", ...headers },
    },
  );
}

async function authenticate(req: Request) {
  const key = readKey(req);
  if (!key)
    throw new ApiError(
      401,
      "missing_api_key",
      "Envie a chave no cabeçalho Authorization: Bearer <chave>.",
    );
  if (!looksLikeKey(key))
    throw new ApiError(401, "invalid_api_key", "Chave de API inválida.");
  const row = await db.apiKey.findUnique({
    where: { hash: hashKey(key) },
    select: {
      id: true,
      userId: true,
      revokedAt: true,
      lastUsedAt: true,
      canWrite: true,
      user: { select: { developerSince: true } },
    },
  });
  if (!row || row.revokedAt || !row.user.developerSince)
    throw new ApiError(
      401,
      "invalid_api_key",
      "Chave de API inválida ou revogada.",
    );
  if (!row.lastUsedAt || Date.now() - row.lastUsedAt.getTime() > 60_000)
    await db.apiKey
      .update({ where: { id: row.id }, data: { lastUsedAt: new Date() } })
      .catch(() => null);
  return row;
}

export function apiRoute<P>(
  handler: (ctx: ApiContext, params: P) => Promise<unknown>,
  options: { write?: boolean; status?: number } = {},
) {
  return async (req: Request, route: { params: Promise<P> }) => {
    let rate: RateLimitResult | null = null;
    try {
      const key = await authenticate(req);
      if (options.write && !key.canWrite)
        throw new ApiError(
          403,
          "insufficient_scope",
          "Essa chave é só de leitura. Crie uma chave com permissão de escrita.",
        );
      const [minute, day] = await Promise.all([
        consumeRateLimit(`api:m:${key.id}`, RATE_PER_MINUTE, 60_000),
        consumeRateLimit(`api:d:${key.id}`, RATE_PER_DAY, 86_400_000),
      ]);
      rate = day.limited ? day : minute;
      if (minute.limited || day.limited)
        return errorResponse(
          new ApiError(
            429,
            "rate_limited",
            day.limited
              ? `Limite de ${RATE_PER_DAY} requisições por dia atingido.`
              : `Limite de ${RATE_PER_MINUTE} requisições por minuto atingido.`,
          ),
          {
            ...rateHeaders(rate),
            "Retry-After": String(
              Math.max(1, Math.ceil((rate.resetAt - Date.now()) / 1000)),
            ),
          },
        );
      const body = await handler(
        {
          userId: key.userId,
          keyId: key.id,
          params: new URL(req.url).searchParams,
          body: () => readBody(req),
        },
        await route.params,
      );
      return NextResponse.json(body ?? { ok: true }, {
        status: options.status ?? 200,
        headers: { "Cache-Control": "no-store", ...rateHeaders(rate) },
      });
    } catch (err) {
      if (err instanceof ApiError)
        return errorResponse(err, rate ? rateHeaders(rate) : {});
      console.error("[api] unexpected error", err);
      return errorResponse(
        new ApiError(500, "internal_error", "Algo deu errado. Tente de novo."),
      );
    }
  };
}

export function pageParams(params: URLSearchParams) {
  const int = (name: string, fallback: number) => {
    const raw = params.get(name);
    if (raw == null || raw === "") return fallback;
    if (!/^\d+$/.test(raw)) throw badParam(name, "use um número inteiro.");
    return Number(raw);
  };
  const page = int("page", 1);
  const perPage = int("per_page", DEFAULT_PER_PAGE);
  if (page < 1) throw badParam("page", "começa em 1.");
  if (perPage < 1 || perPage > MAX_PER_PAGE)
    throw badParam("per_page", `use de 1 a ${MAX_PER_PAGE}.`);
  return { page, perPage, skip: (page - 1) * perPage, take: perPage };
}

export function paginated<T>(
  data: T[],
  total: number,
  { page, perPage }: { page: number; perPage: number },
) {
  return {
    data,
    pagination: {
      page,
      perPage,
      totalPages: Math.max(1, Math.ceil(total / perPage)),
      totalItems: total,
    },
  };
}

export function enumParam<T extends string>(
  params: URLSearchParams,
  name: string,
  allowed: readonly T[],
): T[] | undefined {
  const raw = params.get(name);
  if (!raw) return undefined;
  const values = raw.split(",").map((v) => v.trim().toUpperCase());
  for (const v of values)
    if (!allowed.includes(v as T))
      throw badParam(name, `valores aceitos: ${allowed.join(", ")}.`);
  return values as T[];
}

export function boolParam(params: URLSearchParams, name: string) {
  const raw = params.get(name);
  if (raw == null || raw === "") return undefined;
  if (raw === "true") return true;
  if (raw === "false") return false;
  throw badParam(name, "use true ou false.");
}
