/* global QRCode */
(() => {
  const $ = (id) => document.getElementById(id);

  const elText = $("text");
  const elSize = $("size");
  const elEcc  = $("ecc");
  const elFg   = $("fg");
  const elBg   = $("bg");
  const elBox  = $("qrBox");
  const elStatus = $("status");

  const btnGenerate = $("btnGenerate");
  const btnDownload = $("btnDownload");
  const btnClear    = $("btnClear");

  // Estado
  let lastDataUrl = null;

  function setStatus(msg, type = "info") {
    elStatus.textContent = msg || "";
    elStatus.style.color =
      type === "error" ? "#ff6b6b" :
      type === "ok" ? "#a7f3d0" :
      "#a9afc3";
  }

  function clearQR() {
    elBox.innerHTML = "";
    lastDataUrl = null;
    setStatus("");
  }

  function getOptions() {
    const size = clampInt(parseInt(elSize.value, 10), 128, 1024);
    elSize.value = String(size);

    return {
      width: size,
      margin: 1,
      errorCorrectionLevel: elEcc.value, // L M Q H
      color: {
        dark: elFg.value,
        light: elBg.value,
      },
    };
  }

  function clampInt(n, min, max) {
    if (Number.isNaN(n)) return min;
    return Math.min(max, Math.max(min, n));
  }

  async function generate() {
    const text = (elText.value || "").trim();
    if (!text) {
      clearQR();
      setStatus("Escribe algo para generar el QR.", "error");
      return;
    }

    // Validación leve: evita QRs gigantes por texto absurdo
    if (text.length > 2000) {
      setStatus("El texto es demasiado largo (máx. 2000 caracteres).", "error");
      return;
    }

    const options = getOptions();
    clearQR();
    setStatus("Generando...");

    try {
      // Usamos QRCode.toDataURL para poder descargar
      lastDataUrl = await QRCode.toDataURL(text, options);

      const img = new Image();
      img.alt = "Código QR";
      img.src = lastDataUrl;
      img.width = options.width;
      img.height = options.width;
      img.style.borderRadius = "12px";
      img.style.background = options.color.light;

      elBox.appendChild(img);
      setStatus("Listo ✅", "ok");
    } catch (err) {
      console.error(err);
      setStatus("Error generando el QR. Revisa la consola.", "error");
    }
  }

  function downloadPNG() {
    if (!lastDataUrl) {
      setStatus("Primero genera un QR para descargar.", "error");
      return;
    }
    const a = document.createElement("a");
    a.href = lastDataUrl;
    a.download = "qr.png";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setStatus("Descargando PNG…", "ok");
  }

  // Debounce para autogenerar al escribir (suave)
  let t = null;
  function autoGenerate() {
    clearTimeout(t);
    t = setTimeout(() => {
      generate();
    }, 250);
  }

  // Eventos
  btnGenerate.addEventListener("click", generate);
  btnDownload.addEventListener("click", downloadPNG);
  btnClear.addEventListener("click", () => {
    elText.value = "";
    clearQR();
    setStatus("Listo.");
  });

  // Autogeneración cuando cambias ajustes
  elText.addEventListener("input", autoGenerate);
  [elSize, elEcc, elFg, elBg].forEach((el) => el.addEventListener("input", autoGenerate));

  // QR inicial de ejemplo (opcional)
  elText.value = "https://github.com/";
  generate();
})();