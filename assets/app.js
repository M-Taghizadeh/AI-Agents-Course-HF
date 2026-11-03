(function () {
  const root = document.documentElement;
  if (localStorage.getItem("theme") === "dark") root.classList.add("dark");

  function downloadBlob(blob, filename) {
    const objectUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = objectUrl;
    a.download = filename || "notebook.ipynb";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () { URL.revokeObjectURL(objectUrl); }, 1000);
  }

  function downloadBase64Notebook(b64, filename) {
    const bin = atob(b64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    downloadBlob(new Blob([bytes], { type: "application/x-ipynb+json" }), filename);
  }

  function isMobile() {
    return window.matchMedia("(max-width: 820px)").matches;
  }

  function syncSidebarButton(btn) {
    if (!btn) return;
    const open = isMobile()
      ? document.body.classList.contains("sidebar-open")
      : !document.body.classList.contains("sidebar-collapsed");
    btn.setAttribute("aria-expanded", open ? "true" : "false");
    btn.textContent = "☰";
  }

  function ensureBackdrop() {
    let el = document.querySelector(".sidebar-backdrop");
    if (!el) {
      el = document.createElement("div");
      el.className = "sidebar-backdrop";
      document.body.appendChild(el);
      el.addEventListener("click", function () {
        document.body.classList.remove("sidebar-open");
        syncSidebarButton(document.getElementById("toggle-sidebar"));
      });
    }
    return el;
  }

  document.addEventListener("DOMContentLoaded", function () {
    const btn = document.getElementById("toggle-theme");
    if (btn) {
      btn.addEventListener("click", function () {
        root.classList.toggle("dark");
        localStorage.setItem("theme", root.classList.contains("dark") ? "dark" : "light");
      });
    }

    const sideBtn = document.getElementById("toggle-sidebar");
    if (sideBtn && document.getElementById("course-sidebar")) {
      ensureBackdrop();
      // Desktop: remember collapse. Mobile: start closed.
      if (!isMobile() && localStorage.getItem("sidebar") === "collapsed") {
        document.body.classList.add("sidebar-collapsed");
      }
      if (isMobile()) {
        document.body.classList.remove("sidebar-open");
        document.body.classList.add("sidebar-collapsed");
      }
      syncSidebarButton(sideBtn);
      sideBtn.addEventListener("click", function () {
        if (isMobile()) {
          document.body.classList.toggle("sidebar-open");
        } else {
          document.body.classList.toggle("sidebar-collapsed");
          localStorage.setItem(
            "sidebar",
            document.body.classList.contains("sidebar-collapsed") ? "collapsed" : "open"
          );
        }
        syncSidebarButton(sideBtn);
      });
      window.addEventListener("resize", function () {
        if (isMobile()) {
          document.body.classList.remove("sidebar-open");
        } else {
          document.body.classList.remove("sidebar-open");
          if (localStorage.getItem("sidebar") === "collapsed") {
            document.body.classList.add("sidebar-collapsed");
          } else {
            document.body.classList.remove("sidebar-collapsed");
          }
        }
        syncSidebarButton(sideBtn);
      });
    }
    if (window.hljs) {
      document.querySelectorAll(".code:not(.out) pre code").forEach(function (el) {
        window.hljs.highlightElement(el);
      });
    }
    document.querySelectorAll(".code:not(.out)").forEach(function (box) {
      const b = document.createElement("button");
      b.className = "copy-btn";
      b.textContent = "کپی";
      b.addEventListener("click", function () {
        navigator.clipboard.writeText(box.querySelector("code").innerText);
        b.textContent = "کپی شد";
        setTimeout(function () { b.textContent = "کپی"; }, 1500);
      });
      box.prepend(b);
    });

    document.querySelectorAll("a.nb-link").forEach(function (a) {
      a.addEventListener("click", function (e) {
        e.preventDefault();
        const name = a.getAttribute("download") || "notebook.ipynb";
        const b64 = a.getAttribute("data-nb");
        if (b64) {
          try {
            downloadBase64Notebook(b64, name);
            return;
          } catch (err) {
            // fall through
          }
        }
        // Fallback: try fetch (works on http server)
        fetch(a.href)
          .then(function (res) {
            if (!res.ok) throw new Error("fail");
            return res.blob();
          })
          .then(function (blob) { downloadBlob(blob, name); })
          .catch(function () { window.location.href = a.href; });
      });
    });
  });
})();
