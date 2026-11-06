"use server";

import { db } from "../db";
import { fail, withUser } from "./result";
import { mapRows, parseCsv } from "../import/csv";
import { BATCH_SIZE, processRow } from "../import/process";
import { getImportState } from "../queries/import";
import { rateLimited } from "../rate-limit";

const MAX_FILE_BYTES = 3.5 * 1024 * 1024;

export async function startImport(form: FormData) {
  return withUser(async (userId) => {
    const file = form.get("file");
    if (!(file instanceof File) || file.size === 0)
      fail("Escolha o arquivo CSV exportado.");
    if (file.size > MAX_FILE_BYTES)
      fail("O arquivo passou de 3,5 MB. Divida em partes menores.");
    const running = await db.importJob.findFirst({
      where: { userId, status: "RUNNING" },
      select: { id: true },
    });
    if (running) fail("Você já tem uma importação em andamento.");
    if (await rateLimited(`import:${userId}`, 5, 3600_000))
      fail("Muitas importações seguidas. Tente de novo em uma hora.");

    const { source, rows, missingTitle } = mapRows(parseCsv(await file.text()));
    if (missingTitle)
      fail(
        "Não achamos a coluna de título. Use o modelo ou um export do Goodreads.",
      );
    if (!rows.length) fail("O arquivo não tem nenhum livro.");

    const job = await db.importJob.create({
      data: {
        userId,
        source,
        fileName: file.name.slice(0, 120),
        total: rows.length,
        rows: {
          createMany: {
            data: rows.map((r, index) => ({
              index,
              title: r.title,
              author: r.author,
              isbn: r.isbn,
              shelf: r.shelf,
              rating: r.rating,
              review: r.review,
              dateRead: r.dateRead ? new Date(`${r.dateRead}T00:00:00Z`) : null,
              tags: r.tags,
            })),
          },
        },
      },
      select: { id: true },
    });
    return job;
  });
}

export async function processImport(jobId: string) {
  return withUser(async (userId) => {
    const job = await db.importJob.findFirst({
      where: { id: jobId, userId },
      select: { id: true, status: true },
    });
    if (!job) fail("Importação não encontrada.");
    if (job.status === "RUNNING") {
      const rows = await db.importRow.findMany({
        where: { jobId, status: "PENDING" },
        orderBy: { index: "asc" },
        take: BATCH_SIZE,
      });
      if (rows.length === 0)
        await db.importJob.update({
          where: { id: jobId },
          data: { status: "DONE", finishedAt: new Date() },
        });
      else await Promise.all(rows.map((row) => processRow(userId, row)));
    }
    return getImportState(userId, jobId);
  });
}

export async function cancelImport(jobId: string) {
  return withUser(async (userId) => {
    await db.importJob.updateMany({
      where: { id: jobId, userId, status: "RUNNING" },
      data: { status: "CANCELED", finishedAt: new Date() },
    });
    return getImportState(userId, jobId);
  });
}
