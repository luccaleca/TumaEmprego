import fs from "fs";
import path from "path";
import { pathToFileURL } from "url";
import { createCanvas } from "@napi-rs/canvas";
import { getDocument, GlobalWorkerOptions } from "pdfjs-dist/legacy/build/pdf.mjs";

const PDFJS_DIR = path.join(process.cwd(), "node_modules/pdfjs-dist");
const WORKER_SRC = pathToFileURL(path.join(PDFJS_DIR, "build/pdf.worker.min.mjs")).href;

let workerReady = false;

function ensureWorker() {
  if (!workerReady) {
    GlobalWorkerOptions.workerSrc = WORKER_SRC;
    workerReady = true;
  }
}

function toUint8Array(bytes) {
  return bytes instanceof Uint8Array && bytes.constructor === Uint8Array
    ? bytes
    : new Uint8Array(bytes);
}

function pdfDocumentOptions(data) {
  return {
    data: toUint8Array(data),
    standardFontDataUrl: pathToFileURL(path.join(PDFJS_DIR, "standard_fonts/")).href,
    cMapUrl: pathToFileURL(path.join(PDFJS_DIR, "cmaps/")).href,
    cMapPacked: true,
  };
}

export async function renderPdfFirstPagePng(pdfBytes, width = 240) {
  ensureWorker();

  const doc = await getDocument(pdfDocumentOptions(pdfBytes)).promise;
  const page = await doc.getPage(1);
  const baseViewport = page.getViewport({ scale: 1 });
  const scale = width / baseViewport.width;
  const viewport = page.getViewport({ scale });

  const canvas = createCanvas(viewport.width, viewport.height);
  const context = canvas.getContext("2d");

  await page.render({
    canvasContext: context,
    viewport,
  }).promise;

  return canvas.toBuffer("image/png");
}

export async function renderPdfFileFirstPagePng(filePath, width = 240) {
  return renderPdfFirstPagePng(fs.readFileSync(filePath), width);
}
