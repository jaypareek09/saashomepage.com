(() => {
  const STORAGE_KEY = "saashomepage:favorites";
  const THEME_KEY = "saashomepage:theme";

  const loadFavorites = () => {
    try {
      const data = JSON.parse(localStorage.getItem(STORAGE_KEY));
      return Array.isArray(data) ? data : [];
    } catch (error) {
      return [];
    }
  };

  const saveFavorites = (items) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  };

  const normalizeId = (item) => item.id || item.path || item.url || item.name;

  const isFavorite = (items, item) => {
    const id = normalizeId(item);
    return items.some((entry) => normalizeId(entry) === id);
  };

  const toggleFavorite = (item) => {
    const items = loadFavorites();
    const id = normalizeId(item);
    const exists = items.findIndex((entry) => normalizeId(entry) === id);
    if (exists >= 0) {
      items.splice(exists, 1);
    } else {
      items.unshift(item);
    }
    saveFavorites(items);
    return { items, saved: exists < 0 };
  };

  const renderFavorites = () => {
    const grid = document.querySelector(".favorites-grid");
    const empty = document.querySelector(".favorites-empty");
    if (!grid || !empty) return;

    const items = loadFavorites();
    grid.innerHTML = "";

    if (!items.length) {
      empty.hidden = false;
      return;
    }

    empty.hidden = true;
    items.forEach((item) => {
      const card = document.createElement("article");
      card.className = "card favorite-card";
      card.innerHTML = `
        <a class="card-link" href="${item.path}">
          <div class="card-media">
            <img class="card-image" src="${item.image}" alt="${item.name} landing page screenshot" loading="lazy" decoding="async" />
          </div>
          <div class="favorite-meta">
            <h3>${item.name}</h3>
            <span>${item.url.replace(/^https?:\/\//, "")}</span>
          </div>
        </a>
        <button class="favorite-remove" type="button" data-id="${item.id}">Remove</button>
      `;
      grid.appendChild(card);
    });

    grid.querySelectorAll(".favorite-remove").forEach((button) => {
      button.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        const items = loadFavorites();
        const next = items.filter((item) => item.id !== button.dataset.id);
        saveFavorites(next);
        renderFavorites();
      });
    });
  };

  const initDetailPage = () => {
    const heroActions = document.querySelector(".detail-actions");
    const sidebarActions = document.querySelector(".panel-actions");

    if (heroActions && sidebarActions) {
      const heroFavorite = heroActions.querySelector("[data-favorite-button]");
      const sidebarFavorite = sidebarActions.querySelector("[data-favorite-button]");

      if (!heroFavorite && sidebarFavorite) {
        heroActions.appendChild(sidebarFavorite);
      }

      sidebarActions.remove();

      const parentCard = document.querySelector(".detail-panel .panel-card.panel-primary");
      if (parentCard && parentCard.children.length === 0) {
        parentCard.remove();
      }
    }

    document.querySelectorAll(".zoom-hint").forEach((hint) => hint.remove());

    const button = document.querySelector("[data-favorite-button]");
    if (!button) return;

    const name = document.querySelector(".detail-title")?.textContent?.trim() || "Unknown";
    const url = document.querySelector(".detail-actions a")?.getAttribute("href") || "#";
    const image = document.getElementById("detail-shot")?.getAttribute("src") || "";
    const slug = document.body.getAttribute("data-favorite-id") || "item";
    const path = window.location.pathname.includes("/sites/")
      ? `sites/${slug}.html`
      : `${slug}.html`;

    const item = {
      id: slug,
      name,
      url,
      image,
      path,
    };

    const updateState = () => {
      const items = loadFavorites();
      if (isFavorite(items, item)) {
        button.textContent = "Saved ✓";
        button.classList.add("saved");
      } else {
        button.textContent = "Save to collection";
        button.classList.remove("saved");
      }
    };

    button.addEventListener("click", () => {
      toggleFavorite(item);
      updateState();
    });

    updateState();
  };

  const initThemeToggle = () => {
    const ensureToggle = () => {
      let toggle = document.querySelector(".theme-toggle");
      if (toggle) return toggle;

      const detailActions = document.querySelector(".detail-nav-actions");
      if (!detailActions) return null;

      toggle = document.createElement("button");
      toggle.className = "theme-toggle";
      toggle.type = "button";
      toggle.setAttribute("aria-pressed", "false");
      toggle.innerHTML = `
        <span class="theme-toggle-icon" aria-hidden="true"></span>
        <span class="theme-toggle-label">Theme</span>
      `;
      detailActions.prepend(toggle);
      return toggle;
    };

    const toggle = ensureToggle();
    if (!toggle) return;

    const setTheme = (mode, animate = false) => {
      if (animate) {
        document.body.classList.add("theme-transition");
        window.setTimeout(() => {
          document.body.classList.remove("theme-transition");
        }, 400);
      }
      document.body.classList.toggle("theme-graphite", mode === "graphite");
      toggle.setAttribute("aria-pressed", String(mode === "graphite"));
    };

    const stored = localStorage.getItem(THEME_KEY);
    const initial = stored === "graphite" ? "graphite" : "light";
    setTheme(initial, false);

    toggle.addEventListener("click", () => {
      const next = document.body.classList.contains("theme-graphite") ? "light" : "graphite";
      localStorage.setItem(THEME_KEY, next);
      setTheme(next, true);
    });
  };

  document.addEventListener("DOMContentLoaded", () => {
    renderFavorites();
    initDetailPage();
    initThemeToggle();
  });

  window.addEventListener("storage", renderFavorites);
})();
