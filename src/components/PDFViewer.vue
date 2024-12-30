<script lang="ts" setup>
import { onMounted } from "vue";
// @ts-ignore
import * as pdfjsLib from "./../lib/pdf.min.mjs";

// Set the workerSrc to point to the PDF.js worker script
pdfjsLib.GlobalWorkerOptions.workerSrc = "./../lib/pdf.worker.min.mjs";

const props = defineProps<{ pdfBase64: string }>();

async function renderPdf(pdfData: string) {
  try {
    const pdf = await pdfjsLib.getDocument({ data: atob(pdfData) }).promise;
    const pageNumber = 1;
    const page = await pdf.getPage(pageNumber);
    const scale = 0.75;
    const viewport = page.getViewport({ scale });
    const canvas = document.getElementById("pdfContainer") as HTMLCanvasElement;
    const context = canvas.getContext("2d");
    if (context) {
      canvas.height = viewport.height;
      canvas.width = viewport.width;
      const renderContext = {
        canvasContext: context,
        viewport,
      };
      page.render(renderContext);
    }
  } catch (error) {
    console.error(error);
  }
}
onMounted(() => renderPdf(props.pdfBase64));
</script>

<template>
  <canvas id="pdfContainer"></canvas>
</template>

<style scoped>
#pdfContainer {
  border: 1px solid #000;
}
</style>
