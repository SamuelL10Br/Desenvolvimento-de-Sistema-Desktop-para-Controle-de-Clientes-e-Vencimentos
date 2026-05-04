(function () {
  console.log("UI-FEEDBACK-CARREGADO-VERSAO-LIMPA");

  function garantirToastContainer() {
    let container = document.getElementById("toast-container");

    if (!container) {
      container = document.createElement("div");
      container.id = "toast-container";
      container.style.pointerEvents = "none";
      document.body.appendChild(container);
    }

    return container;
  }

  function showToast(message, type = "info", duration = 2600) {
    const container = garantirToastContainer();

    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    toast.style.pointerEvents = "none";

    container.appendChild(toast);

    requestAnimationFrame(() => {
      toast.classList.add("toast-show");
    });

    setTimeout(() => {
      toast.classList.remove("toast-show");
      setTimeout(() => {
        toast.remove();
      }, 220);
    }, duration);
  }

  function garantirConfirmOverlay() {
    let overlay = document.getElementById("confirm-overlay");

    if (!overlay) {
      overlay = document.createElement("div");
      overlay.id = "confirm-overlay";
      overlay.innerHTML = `
        <div class="confirm-box" role="dialog" aria-modal="true" aria-labelledby="confirm-title">
          <h3 id="confirm-title">Confirmação</h3>
          <p id="confirm-message"></p>
          <div class="confirm-actions">
            <button id="confirm-no" type="button">Cancelar</button>
            <button id="confirm-yes" type="button">Confirmar</button>
          </div>
        </div>
      `;
      document.body.appendChild(overlay);
    }

    overlay.classList.remove("confirm-open");
    overlay.style.pointerEvents = "none";
    return overlay;
  }

  function limparEstadoOverlay(overlay) {
    if (!overlay) return;

    overlay.classList.remove("confirm-open");
    overlay.style.pointerEvents = "none";
    document.body.classList.remove("modal-aberto");
  }

  function confirmBox(message) {
    return new Promise((resolve) => {
      const overlay = garantirConfirmOverlay();
      const msg = overlay.querySelector("#confirm-message");
      const btnNo = overlay.querySelector("#confirm-no");
      const btnYes = overlay.querySelector("#confirm-yes");

      msg.textContent = message;
      overlay.classList.add("confirm-open");
      overlay.style.pointerEvents = "auto";
      document.body.classList.add("modal-aberto");

      let finalizado = false;

      function fechar(resultado) {
        if (finalizado) return;
        finalizado = true;

        limparEstadoOverlay(overlay);

        btnNo.removeEventListener("click", onNo);
        btnYes.removeEventListener("click", onYes);
        overlay.removeEventListener("click", onOverlayClick);
        document.removeEventListener("keydown", onKeyDown);

        resolve(resultado);
      }

      function onNo() {
        fechar(false);
      }

      function onYes() {
        fechar(true);
      }

      function onOverlayClick(event) {
        if (event.target === overlay) {
          fechar(false);
        }
      }

      function onKeyDown(event) {
        if (event.key === "Escape") {
          fechar(false);
        }
      }

      btnNo.addEventListener("click", onNo);
      btnYes.addEventListener("click", onYes);
      overlay.addEventListener("click", onOverlayClick);
      document.addEventListener("keydown", onKeyDown);

      requestAnimationFrame(() => {
        btnNo.focus();
      });
    });
  }

  window.uiFeedback = {
    info: (msg) => showToast(msg, "info"),
    success: (msg) => showToast(msg, "success"),
    error: (msg) => showToast(msg, "error", 3200),
    confirm: confirmBox
  };
})();