import html2canvas from "html2canvas";
import jsPDF from "jspdf";

type DownloadElementPdfInput = {
  container: HTMLElement;
  fileName: string;
};

export async function downloadElementPdf({ container, fileName }: DownloadElementPdfInput) {
  const canvas = await html2canvas(container, {
    backgroundColor: "#ffffff",
    scale: 2,
    useCORS: true,
  });

  const imageData = canvas.toDataURL("image/png");
  const pdf = new jsPDF("p", "mm", "a4");
  const pageWidth = 190;
  const pageHeight = 277;
  const imageHeight = (canvas.height * pageWidth) / canvas.width;
  let heightLeft = imageHeight;
  let position = 10;

  pdf.addImage(imageData, "PNG", 10, position, pageWidth, imageHeight);
  heightLeft -= pageHeight;

  while (heightLeft > 0) {
    position = heightLeft - imageHeight + 10;
    pdf.addPage();
    pdf.addImage(imageData, "PNG", 10, position, pageWidth, imageHeight);
    heightLeft -= pageHeight;
  }

  const blob = pdf.output("blob");
  const downloadUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = downloadUrl;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();

  window.setTimeout(() => {
    URL.revokeObjectURL(downloadUrl);
  }, 1000);
}