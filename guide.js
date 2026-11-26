const motion = window.matchMedia("(prefers-reduced-motion: reduce)");

if ("IntersectionObserver" in window && !motion.matches) {
  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    }
  }, { threshold: 0.05 });

  document.documentElement.classList.add("can-reveal");
  document.querySelectorAll(".reveal").forEach((element) => observer.observe(element));
  motion.addEventListener("change", () => {
    if (motion.matches) document.documentElement.classList.remove("can-reveal");
  });
}

const hero = document.querySelector(".hero");
const art = document.querySelector(".hero-art");
if (window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
  hero.addEventListener("pointermove", (event) => {
    if (motion.matches || event.pointerType !== "mouse") return;
    const bounds = hero.getBoundingClientRect();
    const x = (event.clientX - bounds.left) / bounds.width - 0.5;
    const y = (event.clientY - bounds.top) / bounds.height - 0.5;
    art.style.setProperty("--art-x", `${x * 19}px`);
    art.style.setProperty("--art-y", `${y * 19}px`);
  });
  hero.addEventListener("pointerleave", () => {
    art.style.removeProperty("--art-x");
    art.style.removeProperty("--art-y");
  });
}

const cost = document.querySelector("#cost");
const price = document.querySelector("#price");
const fee = document.querySelector("#fee");
const margin = document.querySelector("#margin");
const breakdown = document.querySelector("#calc-breakdown");
const currency = new Intl.NumberFormat("ru-RU", {
  style: "currency", currency: "RUB", minimumFractionDigits: 0, maximumFractionDigits: 2,
});

function calculate() {
  const values = [cost, price, fee];
  if (values.some((field) => !Number.isFinite(field.valueAsNumber))) {
    margin.value = "—";
    breakdown.textContent = "Заполни все три поля.";
    return;
  }
  if (values.some((field) => !field.validity.valid)) {
    margin.value = "—";
    breakdown.textContent = "Введи от 0 до 1 000 000 ₽ и комиссию от 0 до 100%.";
    return;
  }

  const purchase = cost.valueAsNumber;
  const sale = price.valueAsNumber;
  const feeAmount = Math.round(sale * fee.valueAsNumber) / 100;
  const result = Math.round((sale - purchase - feeAmount) * 100) / 100;
  margin.value = currency.format(result);
  breakdown.textContent = `${currency.format(sale)} − ${currency.format(purchase)} − ${currency.format(feeAmount)}`;
}
for (const field of [cost, price, fee]) field.addEventListener("input", calculate);
calculate();

const reviews = JSON.parse(document.querySelector("#review-data").textContent);
const reviewsGrid = document.querySelector("#reviews-grid");
const reviewsDetails = document.querySelector(".reviews-details");
const galleryBack = document.querySelector("#gallery-back");
const galleryNext = document.querySelector("#gallery-next");
const viewer = document.querySelector("#review-viewer");
const fullImage = viewer.querySelector("img");
const viewerBack = document.querySelector("#review-back");
const viewerNext = document.querySelector("#review-next");
const viewerTitle = document.querySelector("#review-title");
const viewerPosition = document.querySelector("#review-position");
let currentReview = 0;

function showReview(index) {
  currentReview = (index + reviews.length) % reviews.length;
  const { image, title, alt } = reviews[currentReview];
  fullImage.src = image;
  fullImage.alt = alt;
  viewerTitle.textContent = title;
  viewerPosition.textContent = `${currentReview + 1} / ${reviews.length}`;
  if (!motion.matches) fullImage.animate({ opacity: [0.45, 1] }, { duration: 210 });
}

reviews.forEach(({ image, title, focus }, index) => {
  const card = document.createElement("button");
  card.className = "review-card";
  card.type = "button";
  card.setAttribute("aria-haspopup", "dialog");

  const preview = document.createElement("img");
  preview.src = image;
  preview.loading = "lazy";
  preview.decoding = "async";
  preview.alt = "";
  preview.style.objectPosition = `center ${focus}`;
  const caption = document.createElement("span");
  caption.textContent = title;
  card.append(preview, caption);

  card.addEventListener("click", () => {
    showReview(index);
    viewer.showModal();
  });
  reviewsGrid.append(card);
});

document.querySelector("#reviews-count").textContent = String(reviews.length);

function updateGalleryControls() {
  galleryBack.disabled = reviewsGrid.scrollLeft <= 1;
  galleryNext.disabled = reviewsGrid.scrollLeft + reviewsGrid.clientWidth >= reviewsGrid.scrollWidth - 2;
}

function moveGallery(direction) {
  const card = reviewsGrid.firstElementChild;
  const gap = Number.parseFloat(getComputedStyle(reviewsGrid).columnGap);
  reviewsGrid.scrollBy({
    left: direction * (card.offsetWidth + gap),
    behavior: motion.matches ? "instant" : "smooth",
  });
}

reviewsGrid.addEventListener("scroll", updateGalleryControls, { passive: true });
reviewsDetails.addEventListener("toggle", () => requestAnimationFrame(updateGalleryControls));
if ("ResizeObserver" in window) new ResizeObserver(updateGalleryControls).observe(reviewsGrid);
galleryBack.addEventListener("click", () => moveGallery(-1));
galleryNext.addEventListener("click", () => moveGallery(1));
viewerBack.addEventListener("click", () => showReview(currentReview - 1));
viewerNext.addEventListener("click", () => showReview(currentReview + 1));
viewer.querySelector("button").addEventListener("click", () => viewer.close());
viewer.addEventListener("click", (event) => {
  if (event.target === viewer) viewer.close();
});
viewer.addEventListener("keydown", (event) => {
  const direction = { ArrowLeft: -1, ArrowRight: 1 }[event.key];
  if (typeof direction !== "number") return;
  event.preventDefault();
  showReview(currentReview + direction);
});
