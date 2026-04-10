const tabButtons = Array.from(document.querySelectorAll(".tab-button"));
const tabPanels = Array.from(document.querySelectorAll(".tab-panel"));

function setActiveTab(targetId) {
  tabButtons.forEach((button) => {
    const isActive = button.getAttribute("aria-controls") === targetId;
    button.classList.toggle("active", isActive);
    button.setAttribute("aria-selected", String(isActive));
  });

  tabPanels.forEach((panel) => {
    panel.classList.toggle("active", panel.id === targetId);
  });
}

if (tabButtons.length && tabPanels.length) {
  tabButtons.forEach((button) => {
    button.addEventListener("click", () => {
      setActiveTab(button.getAttribute("aria-controls"));
    });
  });
}

const hero = document.querySelector(".hero");
const forest = document.querySelector(".hero-forest");
const heroContent = document.querySelector(".hero-content");
const cursor = document.querySelector(".custom-cursor");
const cursorRing = document.querySelector(".cursor-ring");
const cursorDot = document.querySelector(".cursor-dot");

if (hero && forest) {
  const treeTypes = [
    { id: "pine", src: "pine_tree_low_poly.glb" },
    { id: "birch", src: "birch_tree_-_low_poly.glb" },
    { id: "laurel", src: "laurel_tree_-_low_poly.glb" },
  ];

  function isInBlockedArea(point) {
    // Keep the headline and CTA area clear.
    const blocked = point.x > 0.06 && point.x < 0.58 && point.y > 0.14 && point.y < 0.84;
    return blocked;
  }

  function generateSpawnPoints(count) {
    const points = [];
    const minDistance = 0.16;
    let attempts = 0;

    while (points.length < count && attempts < 1800) {
      attempts += 1;
      const point = {
        x: 0.06 + Math.random() * 0.88,
        y: 0.14 + Math.random() * 0.72,
      };

      if (isInBlockedArea(point)) continue;

      const tooClose = points.some((existing) => {
        const dx = point.x - existing.x;
        const dy = point.y - existing.y;
        return Math.hypot(dx, dy) < minDistance;
      });

      if (!tooClose) points.push(point);
    }

    while (points.length < count) {
      points.push({
        x: 0.68 + Math.random() * 0.24,
        y: 0.16 + Math.random() * 0.68,
      });
    }

    return points;
  }

  const spawnPoints = generateSpawnPoints(treeTypes.length * 3);

  const trees = [];
  treeTypes.forEach((type, typeIndex) => {
    for (let i = 0; i < 3; i += 1) {
      const point = spawnPoints[typeIndex * 3 + i];
      const tree = document.createElement("button");
      tree.type = "button";
      tree.className = `poly-tree tree-${type.id}`;
      tree.setAttribute("aria-label", `${type.id} low-poly tree`);
      tree.style.left = `${point.x * 100}%`;
      tree.style.top = `${point.y * 100}%`;
      const yaw = `${Math.floor(Math.random() * 360)}deg`;
      tree.innerHTML = `
        <model-viewer
          src="${type.src}"
          loading="eager"
          disable-pan
          disable-zoom
          interaction-prompt="none"
          auto-rotate
          auto-rotate-delay="0"
          rotation-per-second="14deg"
          camera-orbit="35deg 75deg auto"
          field-of-view="30deg"
          orientation="0deg ${yaw} 0deg"
          exposure="1.2"
          shadow-intensity="0.9"
          environment-image="neutral"
          ar="false"
        ></model-viewer>
      `;
      forest.appendChild(tree);
      trees.push(tree);
    }
  });

  const pointer = {
    x: window.innerWidth * 0.5,
    y: window.innerHeight * 0.5,
    active: false,
  };

  const cursorPos = { x: pointer.x, y: pointer.y };

  const treeState = trees.map((tree, index) => ({
    element: tree,
    anchorX: parseFloat(tree.style.left) / 100,
    anchorY: parseFloat(tree.style.top) / 100,
    amplitude: 10 + Math.random() * 12,
    speed: 0.0008 + Math.random() * 0.0007,
    phase: index * 0.62,
    repel: { x: 0, y: 0 },
    scale: 1,
  }));

  function animateFrame(time) {
    const rect = hero.getBoundingClientRect();
    const px = pointer.x - rect.left;
    const py = pointer.y - rect.top;

    treeState.forEach((state, index) => {
      const xBase = rect.width * state.anchorX;
      const yBase = rect.height * state.anchorY;
      const waveX = Math.sin(time * state.speed + state.phase) * state.amplitude;
      const waveY = Math.cos(time * (state.speed * 0.8) + state.phase) * (state.amplitude * 0.55);
      const dx = px - (xBase + waveX);
      const dy = py - (yBase + waveY);
      const distance = Math.hypot(dx, dy);
      const influenceRadius = 145;

      if (distance < influenceRadius && pointer.active) {
        const force = (1 - distance / influenceRadius) * 19;
        const angle = Math.atan2(dy, dx);
        state.repel.x -= Math.cos(angle) * force;
        state.repel.y -= Math.sin(angle) * force;
      }

      state.repel.x *= 0.88;
      state.repel.y *= 0.88;

      const offsetX = waveX + state.repel.x;
      const offsetY = waveY + state.repel.y;
      state.element.style.transform = `translate3d(${offsetX}px, ${offsetY}px, 0) scale(${state.scale})`;

      state.element.style.zIndex = index + (distance < influenceRadius ? 4 : 2);
    });

    if (cursor && cursorRing && cursorDot) {
      cursorPos.x += (pointer.x - cursorPos.x) * 0.18;
      cursorPos.y += (pointer.y - cursorPos.y) * 0.18;
      cursorRing.style.left = `${cursorPos.x}px`;
      cursorRing.style.top = `${cursorPos.y}px`;
      cursorDot.style.left = `${pointer.x}px`;
      cursorDot.style.top = `${pointer.y}px`;
    }

    requestAnimationFrame(animateFrame);
  }

  trees.forEach((tree, index) => {
    tree.addEventListener("pointerenter", () => {
      treeState[index].scale = 1.1;
    });

    tree.addEventListener("pointerleave", () => {
      treeState[index].scale = 1;
    });

    tree.addEventListener("pointerdown", () => {
      const pulse = treeState[index];
      pulse.scale = 1.16;
      pulse.repel.y -= 14;
      window.setTimeout(() => {
        pulse.scale = 1.05;
      }, 90);
      window.setTimeout(() => {
        pulse.scale = 1;
      }, 180);
    });
  });

  window.addEventListener("pointermove", (event) => {
    pointer.x = event.clientX;
    pointer.y = event.clientY;
    pointer.active = true;
    if (cursor) cursor.classList.add("visible");
  });

  window.addEventListener("pointerleave", () => {
    pointer.active = false;
    if (cursor) cursor.classList.remove("visible");
  });

  requestAnimationFrame(animateFrame);
}

const revealTargets = Array.from(
  document.querySelectorAll(
    ".tabs-header, .tab-controls, .tab-panel, .split > div, .card, .values h2, .value-list p, .contact h2, .contact p, .contact .btn"
  )
);

if (revealTargets.length) {
  revealTargets.forEach((element, index) => {
    element.classList.add("scroll-reveal");
    const staggerClass = `stagger-${index % 4}`;
    if (staggerClass !== "stagger-0") element.classList.add(staggerClass);
  });

  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          revealObserver.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.16,
      rootMargin: "0px 0px -8% 0px",
    }
  );

  revealTargets.forEach((element) => revealObserver.observe(element));
}

if (hero && (heroContent || forest)) {
  const applyParallax = () => {
    const rect = hero.getBoundingClientRect();
    const viewportHeight = window.innerHeight || 1;
    const progress = Math.min(Math.max((viewportHeight - rect.top) / (viewportHeight + rect.height), 0), 1);
    const contentShift = (progress - 0.5) * 22;
    const forestShift = (progress - 0.5) * -36;

    if (heroContent) {
      heroContent.style.transform = `translate3d(0, ${contentShift}px, 0)`;
    }

    if (forest) {
      forest.style.transform = `translate3d(0, ${forestShift}px, 0)`;
    }
  };

  let ticking = false;
  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(() => {
      applyParallax();
      ticking = false;
    });
  };

  applyParallax();
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", applyParallax);
}
