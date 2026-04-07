(function () {
  function garantirToastContainer() {
    let container = document.getElementById("toast-container");

    if (!container) {
      container = document.createElement("div");
      container.id = "toast-container";
      document.body.appendChild(container);
    }

    return container;
  }

  function showToast(message, type = "info", duration = 2600) {
    const container = garantirToastContainer();

    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;
    toast.textContent = message;

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

  function confirmBox(message) {
    return new Promise((resolve) => {
      let overlay = document.getElementById("confirm-overlay");

      if (!overlay) {
        overlay = document.createElement("div");
        overlay.id = "confirm-overlay";
        overlay.innerHTML = `
          <div class="confirm-box">
            <h3>Confirmação</h3>
            <p id="confirm-message"></p>
            <div class="confirm-actions">
              <button id="confirm-no" type="button">Cancelar</button>
              <button id="confirm-yes" type="button">Confirmar</button>
            </div>
          </div>
        `;
        document.body.appendChild(overlay);
      }

      const msg = overlay.querySelector("#confirm-message");
      const btnNo = overlay.querySelector("#confirm-no");
      const btnYes = overlay.querySelector("#confirm-yes");

      msg.textContent = message;
      overlay.classList.add("confirm-open");
      document.body.classList.add("modal-aberto");

      function fechar(resultado) {
        overlay.classList.remove("confirm-open");
        document.body.classList.remove("modal-aberto");
        btnNo.removeEventListener("click", onNo);
        btnYes.removeEventListener("click", onYes);
        resolve(resultado);
      }

      function onNo() {
        fechar(false);
      }

      function onYes() {
        fechar(true);
      }

      btnNo.addEventListener("click", onNo);
      btnYes.addEventListener("click", onYes);
    });
  }

  window.uiFeedback = {
    info: (msg) => showToast(msg, "info"),
    success: (msg) => showToast(msg, "success"),
    error: (msg) => showToast(msg, "error", 3200),
    confirm: confirmBox
  };
})();
