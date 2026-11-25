/* ui.js — solo efectos visuales y pestañas.
   La lógica de datos (localStorage, JSON, PDF) irá en otro archivo. */

(function () {
  const sinMovimiento = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- pestañas ---------- */
  const botones = document.querySelectorAll("#nav button");
  botones.forEach((btn) => {
    btn.addEventListener("click", () => {
      botones.forEach((b) => b.classList.remove("activo"));
      btn.classList.add("activo");
      document.querySelectorAll(".modulo").forEach((m) => m.classList.remove("visible"));
      document.getElementById(btn.dataset.modulo).classList.add("visible");
    });
  });

  /* ---------- reloj y fechas ---------- */
  function actualizarReloj() {
    const ahora = new Date();
    const hora = ahora.toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit", hour12: false });
    const fecha = ahora.toLocaleDateString("es-CL", { weekday: "short", day: "2-digit", month: "short" });
    const r = document.getElementById("reloj");
    if (r) r.textContent = hora;
    const f = document.getElementById("fecha-lateral");
    if (f) f.textContent = fecha;
  }
  actualizarReloj();
  setInterval(actualizarReloj, 30000);
  const fh = document.getElementById("fecha-hoy");
  if (fh) fh.textContent = new Date().toLocaleDateString("es-CL");

  if (sinMovimiento) return;

  /* ---------- burbujas que suben ---------- */
  const capa = document.getElementById("capa-burbujas");
  const CANTIDAD = 18;
  for (let i = 0; i < CANTIDAD; i++) {
    const b = document.createElement("div");
    b.className = "burbuja";
    const tam = 20 + Math.random() * 70;
    b.style.width = b.style.height = tam + "px";
    b.style.left = Math.random() * 100 + "vw";
    b.style.animationDuration = 14 + Math.random() * 18 + "s";
    b.style.animationDelay = -Math.random() * 30 + "s";
    capa.appendChild(b);
  }

  /* ---------- estela de destellos con el mouse ---------- */
  const simbolos = ["✦", "✧", "⋆", "♡", "✩"];
  let ultimo = 0;
  document.addEventListener("mousemove", (e) => {
    const t = performance.now();
    if (t - ultimo < 60) return; // no saturar
    ultimo = t;
    const s = document.createElement("span");
    s.className = "destello";
    s.textContent = simbolos[Math.floor(Math.random() * simbolos.length)];
    s.style.left = e.clientX + 6 + "px";
    s.style.top = e.clientY + 6 + "px";
    document.body.appendChild(s);
    setTimeout(() => s.remove(), 900);
  });
})();

/* ---------- selector de temas (se recuerda en el navegador) ---------- */
(function () {
  const raiz = document.documentElement;
  let guardado = null;
  try { guardado = localStorage.getItem("tema"); } catch (e) {}
  const TEMAS = ["playa", "brisa", "nube", "agua", "musgo", "caramelo"];
  // si hay un tema guardado y todavía existe, se usa; si no, queda "brisa" (definido en el <html>)
  if (guardado && TEMAS.includes(guardado)) raiz.dataset.tema = guardado;

  const btns = document.querySelectorAll(".tema-btn");
  const marcar = () => btns.forEach((b) => b.classList.toggle("activo", b.dataset.tema === raiz.dataset.tema));
  marcar();
  btns.forEach((b) =>
    b.addEventListener("click", () => {
      raiz.dataset.tema = b.dataset.tema;
      try { localStorage.setItem("tema", b.dataset.tema); } catch (e) {}
      marcar();
    })
  );
})();

/* ---------- panel de estado ----------
   Uso desde cualquier parte del código:
     NimbusEstado.set("bd", "error");                 // usa el texto por defecto
     NimbusEstado.set("web", "off", "web-09: detenida"); // o un texto propio
   Claves: consola · web · bd · respaldo · cambios
   Estados: ok · alerta · error · off                                   */
window.NimbusEstado = (function () {
  const LED = { ok: "verde", alerta: "dorado", error: "rosa", off: "gris" };
  const TEXTOS = {
    consola:  { ok: "consola en línea", alerta: "sincronizando…", error: "sin conexión", off: "consola en pausa" },
    web:      { ok: "web-09: <b>activa</b>", alerta: "web-09: <b>reiniciando</b>", error: "web-09: <b>con fallas</b>", off: "web-09: <b>detenida</b>" },
    bd:       { ok: "bd-09: <b>privada</b>", alerta: "bd-09: <b>salida temporal</b>", error: "bd-09: <b>expuesta</b>", off: "bd-09: <b>sin datos</b>" },
    respaldo: { ok: "último respaldo: hoy", alerta: "respaldo pendiente", error: "respaldo fallido", off: "sin respaldos aún" },
    cambios:  { ok: "cambios guardados", alerta: "cambios sin guardar", error: "error al guardar", off: "sin cambios" },
  };

  function set(clave, estado, texto) {
    const fila = document.querySelector(`.lista-estado [data-clave="${clave}"]`);
    if (!fila) return;
    fila.dataset.estado = estado;
    const t = fila.querySelector(".texto");
    if (t) t.innerHTML = texto || (TEXTOS[clave] && TEXTOS[clave][estado]) || "";
    const led = fila.querySelector(".led");
    if (led) led.src = `img/estado/${LED[estado] || "gris"}.gif`;
  }

  // conexión real del navegador
  const conexion = () => set("consola", navigator.onLine ? "ok" : "error");
  window.addEventListener("online", conexion);
  window.addEventListener("offline", conexion);
  conexion();

  // al escribir en un formulario: "sin guardar" → "sincronizando…" → "guardados"
  // (cuando exista el guardado real en localStorage, se llama desde ahí)
  let espera;
  document.addEventListener("input", (e) => {
    if (!e.target.closest(".formulario, textarea")) return;
    set("cambios", "alerta");
    clearTimeout(espera);
    espera = setTimeout(() => {
      set("consola", "alerta");
      setTimeout(() => { set("cambios", "ok"); conexion(); }, 700);
    }, 1200);
  });

  return { set };
})();
