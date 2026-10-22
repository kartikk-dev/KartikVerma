type ReviewStatus = "approved" | "preview";
type CardShape = "rounded" | "circle" | "hexagon" | "slant" | "organic" | "shield";

interface Review {
  id: string;
  reviewer_name: string;
  review_text: string;
  status: ReviewStatus;
  created_at: string;
  color: string;
}

const MAX_NAME_LENGTH = 60;
const MIN_REVIEW_LENGTH = 20;
const MAX_REVIEW_LENGTH = 1000;
const ROTATION_INTERVAL = 6_000;
const CARD_STYLE_ID = "portfolio-review-card-effects";

const CARD_COLORS = [
  "#E44752", "#F472B6", "#59B8FF", "#C4B5FD", "#4FD1C5",
  "#FFA45B", "#FB7185", "#A3E635", "#38BDF8", "#F7C948",
  "#D1D5DB", "#2DD4BF", "#FB923C", "#4ADE80", "#E879F9",
];

const CARD_SHAPES: CardShape[] = [
  "rounded", "hexagon", "circle", "organic", "slant", "shield",
];

// Private visual fixtures for localhost preview only. Production never displays these.
// They exist only for local visual testing and are never uploaded or published.
const DEV_PREVIEW_REVIEWS: Review[] = [
  { id: "preview-a1", reviewer_name: "Aarav Khanna", review_text: "Kartik communicates clearly, understands requirements quickly, and approaches each task thoughtfully. His focus on structure and detail makes complex work easier to follow.", status: "preview", created_at: "", color: CARD_COLORS[0]! },
  { id: "preview-a2", reviewer_name: "Mona Sharma", review_text: "Kartik listens to feedback and takes time to refine the details. He considers the user experience alongside the implementation and aims for a polished result.", status: "preview", created_at: "", color: CARD_COLORS[1]! },
  { id: "preview-a3", reviewer_name: "Rohan Mehta", review_text: "His approach values readable code, maintainable components, and responsive layouts. These decisions make projects easier to understand and improve over time.", status: "preview", created_at: "", color: CARD_COLORS[2]! },
  { id: "preview-a4", reviewer_name: "Priya Verma", review_text: "Kartik is thoughtful about requirements and open to suggestions. He pays attention to how every part fits together instead of treating design and functionality separately.", status: "preview", created_at: "", color: CARD_COLORS[3]! },
  { id: "preview-a5", reviewer_name: "Vikram Singh", review_text: "He approaches problems with curiosity and practical thinking. His attention to detail helps bring consistency to the interface and the underlying implementation.", status: "preview", created_at: "", color: CARD_COLORS[4]! },
  { id: "preview-a6", reviewer_name: "Neha Joshi", review_text: "Kartik understands why a good interface needs to work across screen sizes. He considers layout, accessibility, and interaction details as part of the overall experience.", status: "preview", created_at: "", color: CARD_COLORS[5]! },
  { id: "preview-a7", reviewer_name: "Kabir Malhotra", review_text: "Planning and clear structure are important to Kartik's development approach. That makes work easier to navigate and helps keep implementation organised.", status: "preview", created_at: "", color: CARD_COLORS[6]! },
  { id: "preview-a8", reviewer_name: "Shroom Sharma", review_text: "Kartik pays attention to how a project feels to use, not just how it looks. The layout and interaction details work together to create a coherent experience.", status: "preview", created_at: "", color: CARD_COLORS[7]! },
  { id: "preview-a9", reviewer_name: "Dev Patel", review_text: "He values practical engineering decisions, understandable components, and sensible error handling. These details matter when a project needs to grow and remain maintainable.", status: "preview", created_at: "", color: CARD_COLORS[8]! },
  { id: "preview-a10", reviewer_name: "Isha Nair", review_text: "Kartik makes an effort to understand the actual problem before focusing on implementation. Clear expectations and thoughtful questions help keep the work on track.", status: "preview", created_at: "", color: CARD_COLORS[9]! },
  { id: "preview-a11", reviewer_name: "Kunal Bhatia", review_text: "Good engineering includes checking details and communicating progress. Kartik's focus on structure and clarity supports a more dependable development process.", status: "preview", created_at: "", color: CARD_COLORS[10]! },
  { id: "preview-a12", reviewer_name: "Ananya Rathore", review_text: "Kartik balances visual detail with usability. Clear content, consistent spacing, and considered interactions help make a digital experience easier to use.", status: "preview", created_at: "", color: CARD_COLORS[11]! },
  { id: "preview-a13", reviewer_name: "Rahul Das", review_text: "He considers validation, configuration, and error handling important parts of implementation. His approach reflects an interest in building software that behaves predictably.", status: "preview", created_at: "", color: CARD_COLORS[12]! },
  { id: "preview-a14", reviewer_name: "Meera Shah", review_text: "Kartik gives attention to both presentation and usability. A thoughtful layout, readable content, and consistent details make an interface feel more complete.", status: "preview", created_at: "", color: CARD_COLORS[13]! },
  { id: "preview-a15", reviewer_name: "Arjun Kapoor", review_text: "His work emphasises clarity and a considered user experience. Structured implementation and attention to presentation make projects easier to explore.", status: "preview", created_at: "", color: CARD_COLORS[14]! },
];

const root = document.querySelector<HTMLElement>("[data-reviews-root]");

if (root && root.dataset.initialized !== "true") {
  root.dataset.initialized = "true";

  const track = root.querySelector<HTMLDivElement>("[data-review-track]");
  const stage = root.querySelector<HTMLDivElement>("[data-review-stage]");
  const empty = root.querySelector<HTMLDivElement>("[data-review-empty]");
  const dialog = root.querySelector<HTMLDialogElement>("[data-review-dialog]");
  const form = root.querySelector<HTMLFormElement>("[data-review-form]");
  const nameInput = root.querySelector<HTMLInputElement>('[name="reviewer_name"]');
  const reviewInput = root.querySelector<HTMLTextAreaElement>("[data-review-text]");
  const consentInput = root.querySelector<HTMLInputElement>('[name="review_consent"]');
  const countLabel = root.querySelector<HTMLElement>("[data-review-count]");
  const message = root.querySelector<HTMLElement>("[data-review-message]");
  const toast = root.querySelector<HTMLDivElement>("[data-review-toast]");
  const submitButton = root.querySelector<HTMLButtonElement>("[data-review-submit]");
  const closeButton = root.querySelector<HTMLButtonElement>("[data-review-close]");
  const openButtons = Array.from(root.querySelectorAll<HTMLButtonElement>("[data-review-open]"));
  const emptyTitle = empty?.querySelector<HTMLElement>(".reviews-empty-title");
  const emptyCopy = empty?.querySelector<HTMLParagraphElement>("p:not(.reviews-empty-title)");
  const description = root.querySelector<HTMLElement>(".reviews-description");

  if (
    track && stage && empty && dialog && form && nameInput && reviewInput &&
    consentInput && countLabel && message && toast && submitButton && closeButton
  ) {
    const isDev = root.dataset.devPreview === "true";
    const endpoint = "/api/reviews";
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    let reviews: Review[] = [];
    let cards: HTMLElement[] = [];
    let activeIndex = 0;
    let rotationTimer: number | null = null;
    let toastTimer: number | null = null;
    let isInView = false;
    let isPaused = false;
    let pointerStart: number | null = null;
    let suppressClickUntil = 0;
    let lastOpenButton: HTMLButtonElement | null = null;

    const randomColor = (): string => CARD_COLORS[Math.floor(Math.random() * CARD_COLORS.length)] ?? "#E44752";

    const cleanText = (value: unknown, maxLength: number): string =>
      typeof value === "string" ? value.trim().slice(0, maxLength) : "";

    const colorForReview = (id: string, index: number): string => {
      let hash = 0;
      for (let i = 0; i < id.length; i += 1) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
      return CARD_COLORS[(hash + index) % CARD_COLORS.length] ?? "#E44752";
    };

    const installCardStyles = (): void => {
      if (document.getElementById(CARD_STYLE_ID)) return;
      const style = document.createElement("style");
      style.id = CARD_STYLE_ID;
      style.textContent = `
        .portfolio-reviews .reviews-stage { contain: layout paint; }
        .portfolio-reviews .reviews-track { transform-style: preserve-3d; }
        .portfolio-reviews .review-card {
          --review-color: #E44752;
          isolation: isolate; position: absolute; top: 50%; left: 50%;
          display: flex; flex-direction: column; justify-content: center;
          width: min(400px, calc(100% - 36px)); min-height: 235px; max-height: 315px;
          padding: clamp(23px, 3vw, 34px); overflow: hidden;
          border: 1px solid color-mix(in srgb, var(--review-color) 74%, #392329);
          border-radius: 21px;
          background: radial-gradient(ellipse at 15% 5%, color-mix(in srgb, var(--review-color) 19%, transparent), transparent 54%),
            linear-gradient(145deg, color-mix(in srgb, var(--review-color) 9%, #171012), #100b0d 75%);
          box-shadow: inset 0 1px 0 rgba(255,255,255,.045), 0 0 0 1px color-mix(in srgb, var(--review-color) 17%, transparent);
          transform-style: preserve-3d; backface-visibility: hidden; transform-origin: center center;
          transition: transform 560ms cubic-bezier(.2,.7,.15,1), opacity 420ms ease, filter 420ms ease, border-color 240ms ease;
          -webkit-tap-highlight-color: transparent; user-select: none;
        }
        .portfolio-reviews .review-card::before {
          content: ""; position: absolute; z-index: -1; inset: 0; pointer-events: none;
          background: radial-gradient(circle at 88% 9%, color-mix(in srgb, var(--review-color) 30%, transparent), transparent 47%),
            linear-gradient(125deg, rgba(255,255,255,.025), transparent 50%); opacity: .8;
        }
        .portfolio-reviews .review-card::after {
          content: ""; position: absolute; z-index: -1; inset: 8px;
          border: 1px solid color-mix(in srgb, var(--review-color) 18%, transparent);
          border-radius: inherit; pointer-events: none;
        }
        .portfolio-reviews .review-card.is-active {
          border-color: var(--review-color);
          box-shadow: inset 0 1px 0 rgba(255,255,255,.06), 0 0 0 1px color-mix(in srgb, var(--review-color) 26%, transparent), 0 0 28px color-mix(in srgb, var(--review-color) 32%, transparent), 0 15px 42px rgba(0,0,0,.32);
        }
        .portfolio-reviews .review-card-name {
          position: relative; z-index: 1; margin: 0 0 14px; color: var(--review-color);
          font-size: clamp(1.2rem, 2vw, 1.55rem); font-weight: 700; line-height: 1.25;
          letter-spacing: -.035em; overflow-wrap: anywhere;
          text-shadow: 0 0 14px color-mix(in srgb, var(--review-color) 24%, transparent);
        }
        .portfolio-reviews .review-card-text {
          position: relative; z-index: 1; display: -webkit-box; margin: 0; overflow: hidden;
          color: #E1D3D6; font-size: .9rem; line-height: 1.75; overflow-wrap: anywhere;
          -webkit-box-orient: vertical; -webkit-line-clamp: 6; line-clamp: 6;
        }
        .portfolio-reviews .review-card--rounded { border-radius: 21px; clip-path: none; }
        .portfolio-reviews .review-card--circle { width: min(330px, calc(100% - 36px)); min-height: 290px; max-height: 300px; padding: 43px 37px; border-radius: 49%; }
        .portfolio-reviews .review-card--circle::after { inset: 12px; border-radius: 49%; }
        .portfolio-reviews .review-card--hexagon { border-radius: 0; clip-path: polygon(8% 0,92% 0,100% 20%,100% 80%,92% 100%,8% 100%,0 80%,0 20%); padding-inline: clamp(38px,7vw,56px); }
        .portfolio-reviews .review-card--slant { border-radius: 0; clip-path: polygon(7% 0,100% 0,93% 100%,0 100%); padding-inline: clamp(37px,6vw,49px); }
        .portfolio-reviews .review-card--organic { border-radius: 18% 7% 17% 7% / 10% 20% 9% 20%; }
        .portfolio-reviews .review-card--shield { border-radius: 0; clip-path: polygon(12% 0,88% 0,100% 15%,96% 82%,50% 100%,4% 82%,0 15%); padding-inline: clamp(38px,6vw,54px); }
        .portfolio-reviews .review-card--hexagon::after, .portfolio-reviews .review-card--slant::after, .portfolio-reviews .review-card--shield::after { display: none; }
        .portfolio-reviews .review-card:focus-visible { outline: 2px solid var(--review-color); outline-offset: 3px; }
        @media (max-width: 760px) {
          .portfolio-reviews .review-card { width: min(330px,calc(100% - 28px)); min-height: 228px; max-height: 300px; padding: 23px; }
          .portfolio-reviews .review-card--circle { width: min(290px,calc(100% - 30px)); min-height: 276px; max-height: 286px; padding: 39px 32px; }
          .portfolio-reviews .review-card--hexagon, .portfolio-reviews .review-card--slant, .portfolio-reviews .review-card--shield { padding-inline: 37px; }
          .portfolio-reviews .review-card-text { font-size: .85rem; line-height: 1.72; }
        }
        @media (max-width: 430px) {
          .portfolio-reviews .review-card { width: min(300px,calc(100% - 22px)); min-height: 220px; max-height: 295px; padding: 19px; }
          .portfolio-reviews .review-card--circle { width: min(270px,calc(100% - 28px)); min-height: 270px; max-height: 276px; padding: 37px 30px; }
          .portfolio-reviews .review-card--hexagon, .portfolio-reviews .review-card--slant, .portfolio-reviews .review-card--shield { padding-inline: 31px; }
          .portfolio-reviews .review-card-text { font-size: .81rem; -webkit-line-clamp: 7; line-clamp: 7; }
        }
        @media (prefers-reduced-motion: reduce) {
          .portfolio-reviews .review-card { transition-duration: .01ms !important; }
        }
      `;
      document.head.append(style);
    };

    installCardStyles();

    if (description) {
      description.textContent = "Honest feedback from people who have worked with Kartik. Reviews are checked before publication.";
    }

    const showMessage = (text: string): void => {
      message.textContent = text;
      message.hidden = false;
    };

    const hideMessage = (): void => {
      message.textContent = "";
      message.hidden = true;
    };

    const showToast = (text: string): void => {
      toast.textContent = text;
      toast.hidden = false;
      if (toastTimer !== null) window.clearTimeout(toastTimer);
      toastTimer = window.setTimeout(() => {
        toast.hidden = true;
        toastTimer = null;
      }, 6500);
    };

    const makeElement = <K extends keyof HTMLElementTagNameMap>(
      tag: K,
      className: string,
      text: string,
    ): HTMLElementTagNameMap[K] => {
      const element = document.createElement(tag);
      element.className = className;
      element.textContent = text;
      return element;
    };

    const normaliseApprovedReview = (value: unknown): Review | null => {
      if (typeof value !== "object" || value === null) return null;
      const row = value as Record<string, unknown>;
      if (row.status !== "approved") return null;
      const reviewerName = cleanText(row.reviewer_name, MAX_NAME_LENGTH);
      const reviewText = cleanText(row.review_text, MAX_REVIEW_LENGTH);
      if (reviewerName.length < 2 || reviewText.length < MIN_REVIEW_LENGTH) return null;
      const id = String(row.id ?? `${reviewerName}-${reviewText.length}`);
      return {
        id,
        reviewer_name: reviewerName,
        review_text: reviewText,
        status: "approved",
        created_at: typeof row.created_at === "string" ? row.created_at : "",
        color: colorForReview(id, 0),
      };
    };

    const offsetFor = (index: number, current: number, total: number): number => {
      if (total <= 1) return 0;
      let offset = (index - current + total) % total;
      if (offset > total / 2) offset -= total;
      else if (total % 2 === 0 && offset === total / 2 && index < current) offset = -offset;
      return offset;
    };

    const stopRotation = (): void => {
      if (rotationTimer !== null) {
        window.clearTimeout(rotationTimer);
        rotationTimer = null;
      }
    };

    const scheduleRotation = (): void => {
      stopRotation();
      if (reviews.length <= 1 || reducedMotion.matches || !isInView || isPaused || document.visibilityState !== "visible" || dialog.open) return;
      rotationTimer = window.setTimeout(() => moveTo(activeIndex + 1), ROTATION_INTERVAL);
    };

    const positionCards = (): void => {
      if (!cards.length || stage.clientWidth === 0) return;
      const isPhone = window.innerWidth <= 640;
      const maxVisibleDistance = isPhone ? 1 : 2;
      const step = Math.max(isPhone ? 145 : 205, Math.min(isPhone ? 205 : 320, stage.clientWidth * (isPhone ? 0.51 : 0.3)));

      cards.forEach((card, index) => {
        const offset = offsetFor(index, activeIndex, cards.length);
        const distance = Math.abs(offset);
        const visible = distance <= maxVisibleDistance;
        const scale = distance === 0 ? 1 : Math.max(0.82, 1 - distance * 0.07);
        const rotation = offset * -6;
        card.style.transform = `translate(-50%, -50%) translateX(${offset * step}px) translateZ(${-distance * 35}px) rotateY(${rotation}deg) scale(${scale})`;
        card.style.opacity = visible ? (distance === 0 ? "1" : distance === 1 ? "0.7" : "0.42") : "0";
        card.style.filter = `blur(${Math.min(distance * 1.15, 2.5)}px) drop-shadow(0 0 ${distance === 0 ? 18 : 9}px color-mix(in srgb, var(--review-color) ${distance === 0 ? 48 : 28}%, transparent))`;
        card.style.visibility = visible ? "visible" : "hidden";
        card.style.pointerEvents = visible ? "auto" : "none";
        card.style.zIndex = String(10 - distance);
        card.tabIndex = visible ? 0 : -1;
        card.classList.toggle("is-active", distance === 0);
        card.setAttribute("aria-hidden", String(!visible));
      });
    };

    const moveTo = (index: number): void => {
      if (!reviews.length) return;
      activeIndex = ((index % reviews.length) + reviews.length) % reviews.length;
      positionCards();
      scheduleRotation();
    };

    const buildCard = (review: Review, index: number): HTMLElement => {
      const shape = CARD_SHAPES[index % CARD_SHAPES.length] ?? "rounded";
      const card = makeElement("article", `review-card review-card--${shape}`, "");
      const name = makeElement("h3", "review-card-name", review.reviewer_name);
      const text = makeElement("p", "review-card-text", review.review_text);
      card.dataset.reviewIndex = String(index);
      card.style.setProperty("--review-color", review.color || colorForReview(review.id, index));
      card.tabIndex = 0;
      card.setAttribute("aria-label", `Review by ${review.reviewer_name}`);
      card.append(name, text);
      card.addEventListener("click", () => {
        if (Date.now() < suppressClickUntil) return;
        moveTo(index);
      });
      card.addEventListener("keydown", (event: KeyboardEvent) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          moveTo(index);
        } else if (event.key === "ArrowRight") {
          event.preventDefault();
          moveTo(activeIndex + 1);
        } else if (event.key === "ArrowLeft") {
          event.preventDefault();
          moveTo(activeIndex - 1);
        }
      });
      return card;
    };

    const setEmptyMessage = (title: string, body: string): void => {
      if (emptyTitle) emptyTitle.textContent = title;
      if (emptyCopy) emptyCopy.textContent = body;
    };

    const renderReviews = (): void => {
      track.replaceChildren();
      cards = [];
      const hasReviews = reviews.length > 0;
      track.hidden = !hasReviews;
      empty.hidden = hasReviews;
      stage.classList.toggle("is-empty", !hasReviews);
      if (!hasReviews) {
        stopRotation();
        return;
      }
      reviews.forEach((review, index) => {
        const card = buildCard(review, index);
        cards.push(card);
        track.append(card);
      });
      activeIndex = Math.min(activeIndex, reviews.length - 1);
      window.requestAnimationFrame(() => {
        positionCards();
        scheduleRotation();
      });
    };

    const setDevelopmentReviews = (): void => {
      reviews = isDev ? [...DEV_PREVIEW_REVIEWS] : [];
    };

    const loadReviews = async (): Promise<void> => {
      try {
        const response = await fetch(endpoint, {
          method: "GET",
          headers: { Accept: "application/json" },
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error(`Review service returned HTTP ${response.status}.`);
        }

        const payload: unknown = await response.json();
        const rows: unknown[] = Array.isArray(payload) ? payload : [];
        const published = rows
          .map(normaliseApprovedReview)
          .filter((review): review is Review => review !== null);

        reviews = isDev ? [...DEV_PREVIEW_REVIEWS, ...published] : published;
        setEmptyMessage(
          "No published reviews yet.",
          "Have you worked with Kartik? Share your honest experience.",
        );
        renderReviews();
      } catch (error) {
        console.error("[Portfolio reviews] Could not load reviews.", error);
        reviews = isDev ? [...DEV_PREVIEW_REVIEWS] : [];
        setEmptyMessage(
          "Reviews could not be loaded.",
          "The review service is temporarily unavailable. Please try again later.",
        );
        renderReviews();
      }
    };

    const openForm = (button?: HTMLButtonElement): void => {
      lastOpenButton = button ?? null;
      hideMessage();
      dialog.style.setProperty("--form-accent", randomColor());
      stopRotation();
      if (typeof dialog.showModal === "function") {
        if (!dialog.open) dialog.showModal();
      } else {
        dialog.setAttribute("open", "");
      }
    };

    const closeForm = (): void => {
      if (dialog.open && typeof dialog.close === "function") dialog.close();
      else {
        dialog.removeAttribute("open");
        lastOpenButton?.focus();
      }
      scheduleRotation();
    };

    openButtons.forEach((button) => button.addEventListener("click", () => openForm(button)));
    closeButton.addEventListener("click", closeForm);
    dialog.addEventListener("close", () => {
      lastOpenButton?.focus();
      lastOpenButton = null;
      scheduleRotation();
    });
    dialog.addEventListener("click", (event: MouseEvent) => {
      if (event.target === dialog) closeForm();
    });
    reviewInput.addEventListener("input", () => {
      if (reviewInput.value.length > MAX_REVIEW_LENGTH) reviewInput.value = reviewInput.value.slice(0, MAX_REVIEW_LENGTH);
      countLabel.textContent = String(reviewInput.value.length);
      hideMessage();
    });
    nameInput.addEventListener("input", hideMessage);
    consentInput.addEventListener("change", hideMessage);

    form.addEventListener("submit", async (event: SubmitEvent) => {
      event.preventDefault();
      if (!form.reportValidity()) return;
      const data = new FormData(form);
      if (String(data.get("website") ?? "").trim()) return;

      const reviewerName = cleanText(data.get("reviewer_name"), MAX_NAME_LENGTH);
      const reviewText = cleanText(data.get("review_text"), MAX_REVIEW_LENGTH);
      const consentGiven = data.get("review_consent") === "on";

      if (reviewerName.length < 2) {
        showMessage("Please enter your name using at least 2 characters.");
        nameInput.focus();
        return;
      }
      if (reviewText.length < MIN_REVIEW_LENGTH || reviewText.length > MAX_REVIEW_LENGTH) {
        showMessage(`Please write a review between ${MIN_REVIEW_LENGTH} and ${MAX_REVIEW_LENGTH} characters.`);
        reviewInput.focus();
        return;
      }
      if (!consentGiven) {
        showMessage("Please agree to the publication consent.");
        consentInput.focus();
        return;
      }
      const previousButtonText = submitButton.textContent;
      submitButton.disabled = true;
      submitButton.textContent = "Submitting...";
      hideMessage();

      try {
        const response = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            reviewer_name: reviewerName,
            review_text: reviewText,
            publication_consent: true,
            website: String(data.get("website") ?? ""),
          }),
        });

        if (!response.ok) {
          const payload: unknown = await response.json().catch(() => null);
          const errorText =
            typeof payload === "object" && payload !== null &&
            "error" in payload && typeof (payload as { error?: unknown }).error === "string"
              ? (payload as { error: string }).error
              : `Review submission failed (HTTP ${response.status}).`;
          throw new Error(errorText);
        }

        const payload: unknown = await response.json();
        const row =
          typeof payload === "object" && payload !== null && "review" in payload
            ? (payload as { review: unknown }).review
            : payload;
        const newReview = normaliseApprovedReview(row);

        if (!newReview) {
          throw new Error("The server did not return the saved review. Please refresh and check again.");
        }

        reviews = [newReview, ...reviews.filter((review) => review.id !== newReview.id)];
        activeIndex = 0;
        renderReviews();
        moveTo(0);

        form.reset();
        countLabel.textContent = "0";
        closeForm();
        showToast("Your review is published and saved.");
      } catch (error) {
        showMessage(error instanceof Error ? error.message : "Something went wrong. Please try again.");
      } finally {
        submitButton.disabled = false;
        submitButton.textContent = previousButtonText || "Submit Review";
      }
    });

    stage.addEventListener("pointerdown", (event: PointerEvent) => {
      if (event.pointerType === "mouse") return;
      pointerStart = event.clientX;
    });
    stage.addEventListener("pointerup", (event: PointerEvent) => {
      if (pointerStart === null) return;
      const delta = event.clientX - pointerStart;
      pointerStart = null;
      if (Math.abs(delta) > 45) {
        suppressClickUntil = Date.now() + 450;
        moveTo(activeIndex + (delta < 0 ? 1 : -1));
      }
    });
    stage.addEventListener("pointercancel", () => { pointerStart = null; });
    stage.addEventListener("mouseenter", () => { isPaused = true; stopRotation(); });
    stage.addEventListener("mouseleave", () => { isPaused = false; scheduleRotation(); });
    stage.addEventListener("focusin", () => { isPaused = true; stopRotation(); });
    stage.addEventListener("focusout", (event: FocusEvent) => {
      if (event.relatedTarget instanceof Node && stage.contains(event.relatedTarget)) return;
      isPaused = false;
      scheduleRotation();
    });

    window.addEventListener("resize", positionCards, { passive: true });
    document.addEventListener("visibilitychange", scheduleRotation);
    const onMotionChange = (): void => { positionCards(); scheduleRotation(); };
    if (typeof reducedMotion.addEventListener === "function") reducedMotion.addEventListener("change", onMotionChange);
    else reducedMotion.addListener(onMotionChange);

    const observer = new IntersectionObserver(([entry]) => {
      isInView = Boolean(entry?.isIntersecting);
      scheduleRotation();
    }, { threshold: 0.05 });
    observer.observe(stage);

    void loadReviews();
  }
}
