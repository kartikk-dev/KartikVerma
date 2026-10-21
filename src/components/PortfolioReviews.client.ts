
interface Review {
  id: string;
  reviewer_name: string;
  review_text: string;
  status: "approved" | "sample" | "pending";
  created_at: string;
  color?: string;
}

const MAX_NAME_LENGTH = 60;
const MAX_REVIEW_LENGTH = 1000;
const ROTATION_INTERVAL = 10_000;

const CARD_COLORS = [
  "#E44752",
  "#59B8FF",
  "#F7C948",
  "#4FD1C5",
  "#FFA45B",
  "#F472B6",
  "#A3E635",
  "#38BDF8",
  "#FB923C",
  "#C4B5FD",
  "#2DD4BF",
  "#FACC15",
  "#4ADE80",
  "#FB7185",
  "#D1D5DB",
];

const SAMPLE_REVIEWS: Review[] = [
  {
    id: "local-01",
    reviewer_name: "Aarav Khanna",
    review_text:
      "Kartik communicates clearly, understands requirements quickly, and approaches each task thoughtfully. His focus on structure and detail makes complex work easier to follow.",
    status: "sample",
    created_at: "",
    color: "#E44752",
  },
  {
    id: "local-02",
    reviewer_name: "Mona Sharma",
    review_text:
      "Kartik listens to feedback and takes time to refine the details. He considers the user experience alongside the implementation and aims for a polished result.",
    status: "sample",
    created_at: "",
    color: "#4FD1C5",
  },
  {
    id: "local-03",
    reviewer_name: "Rohan Mehta",
    review_text:
      "His approach values readable code, maintainable components, and responsive layouts. These decisions make projects easier to understand and improve over time.",
    status: "sample",
    created_at: "",
    color: "#FFA45B",
  },
  {
    id: "local-04",
    reviewer_name: "Priya Verma",
    review_text:
      "Kartik is thoughtful about requirements and open to suggestions. He pays attention to how every part fits together instead of treating design and functionality separately.",
    status: "sample",
    created_at: "",
    color: "#F472B6",
  },
  {
    id: "local-05",
    reviewer_name: "Vikram Singh",
    review_text:
      "He approaches problems with curiosity and practical thinking. His attention to detail helps bring consistency to the interface and the underlying implementation.",
    status: "sample",
    created_at: "",
    color: "#A3E635",
  },
  {
    id: "local-06",
    reviewer_name: "Neha Joshi",
    review_text:
      "Kartik understands why a good interface needs to work across screen sizes. He considers layout, accessibility, and interaction details as part of the overall experience.",
    status: "sample",
    created_at: "",
    color: "#FB7185",
  },
  {
    id: "local-07",
    reviewer_name: "Kabir Malhotra",
    review_text:
      "Planning and clear structure are important to Kartik's development approach. That makes work easier to navigate and helps keep implementation organised.",
    status: "sample",
    created_at: "",
    color: "#38BDF8",
  },
  {
    id: "local-08",
    reviewer_name: "Shroom Sharma",
    review_text:
      "Kartik pays attention to how a project feels to use, not just how it looks. The layout and interaction details work together to create a coherent experience.",
    status: "sample",
    created_at: "",
    color: "#59B8FF",
  },
  {
    id: "local-09",
    reviewer_name: "Dev Patel",
    review_text:
      "He values practical engineering decisions, understandable components, and sensible error handling. These details matter when a project needs to grow and remain maintainable.",
    status: "sample",
    created_at: "",
    color: "#FB923C",
  },
  {
    id: "local-10",
    reviewer_name: "Isha Nair",
    review_text:
      "Kartik makes an effort to understand the actual problem before focusing on implementation. Clear expectations and thoughtful questions help keep the work on track.",
    status: "sample",
    created_at: "",
    color: "#C4B5FD",
  },
  {
    id: "local-11",
    reviewer_name: "Kunal Bhatia",
    review_text:
      "Good engineering includes checking details and communicating progress. Kartik's focus on structure and clarity supports a more dependable development process.",
    status: "sample",
    created_at: "",
    color: "#2DD4BF",
  },
  {
    id: "local-12",
    reviewer_name: "Ananya Rathore",
    review_text:
      "Kartik balances visual detail with usability. Clear content, consistent spacing, and considered interactions help make a digital experience easier to use.",
    status: "sample",
    created_at: "",
    color: "#F7C948",
  },
  {
    id: "local-13",
    reviewer_name: "Rahul Das",
    review_text:
      "He considers validation, configuration, and error handling important parts of implementation. His approach reflects an interest in building software that behaves predictably.",
    status: "sample",
    created_at: "",
    color: "#4ADE80",
  },
  {
    id: "local-14",
    reviewer_name: "Meera Shah",
    review_text:
      "Kartik gives attention to both presentation and usability. A thoughtful layout, readable content, and consistent details make an interface feel more complete.",
    status: "sample",
    created_at: "",
    color: "#FACC15",
  },
  {
    id: "local-15",
    reviewer_name: "Arjun Kapoor",
    review_text:
      "His work emphasises clarity and a considered user experience. Structured implementation and attention to presentation make projects easier to explore.",
    status: "sample",
    created_at: "",
    color: "#D1D5DB",
  },
];

const root = document.querySelector<HTMLElement>("[data-reviews-root]");

if (root) {
  const track = root.querySelector<HTMLDivElement>("[data-review-track]");
  const stage = root.querySelector<HTMLDivElement>("[data-review-stage]");
  const empty = root.querySelector<HTMLDivElement>("[data-review-empty]");
  const dialog = root.querySelector<HTMLDialogElement>("[data-review-dialog]");
  const form = root.querySelector<HTMLFormElement>("[data-review-form]");

  const nameInput = root.querySelector<HTMLInputElement>(
    '[name="reviewer_name"]',
  );

  const reviewInput = root.querySelector<HTMLTextAreaElement>(
    "[data-review-text]",
  );

  const consentInput = root.querySelector<HTMLInputElement>(
    '[name="review_consent"]',
  );

  const countLabel = root.querySelector<HTMLElement>("[data-review-count]");
  const message = root.querySelector<HTMLElement>("[data-review-message]");
  const toast = root.querySelector<HTMLElement>("[data-review-toast]");

  const submitButton = root.querySelector<HTMLButtonElement>(
    "[data-review-submit]",
  );

  const closeButton = root.querySelector<HTMLButtonElement>(
    "[data-review-close]",
  );

  const openButtons = Array.from(
    root.querySelectorAll<HTMLButtonElement>("[data-review-open]"),
  );

  if (
    track &&
    stage &&
    empty &&
    dialog &&
    form &&
    nameInput &&
    reviewInput &&
    consentInput &&
    countLabel &&
    message &&
    toast &&
    submitButton &&
    closeButton
  ) {
    const supabaseUrl = (root.dataset.supabaseUrl ?? "")
      .trim()
      .replace(/\/+$/, "");

    const supabaseKey = (root.dataset.supabaseKey ?? "").trim();
    const isDev = root.dataset.devPreview === "true";
    const supabaseConfigured = Boolean(supabaseUrl && supabaseKey);

    const endpoint = supabaseConfigured
      ? `${supabaseUrl}/rest/v1/portfolio_reviews`
      : "";

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    );

    let reviews: Review[] = [];
    let cards: HTMLElement[] = [];
    let activeIndex = 0;
    let rotationTimer: number | null = null;
    let toastTimer: number | null = null;
    let isInView = false;
    let pointerStart: number | null = null;
    let lastOpenButton: HTMLButtonElement | null = null;

    const randomColor = (): string =>
      CARD_COLORS[Math.floor(Math.random() * CARD_COLORS.length)] ??
      "#E44752";

    const cleanText = (value: unknown, maxLength: number): string => {
      if (typeof value !== "string") return "";
      return value.trim().slice(0, maxLength);
    };

    const showMessage = (text: string): void => {
      message.textContent = text;
      message.hidden = false;
      message.setAttribute("role", "alert");
    };

    const hideMessage = (): void => {
      message.textContent = "";
      message.hidden = true;
    };

    const showToast = (text: string): void => {
      toast.textContent = text;
      toast.hidden = false;

      if (toastTimer !== null) {
        window.clearTimeout(toastTimer);
      }

      toastTimer = window.setTimeout(() => {
        toast.hidden = true;
        toastTimer = null;
      }, 5500);
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

      if (reviewerName.length < 2 || reviewText.length < 10) {
        return null;
      }

      return {
        id: String(row.id ?? `${reviewerName}-${reviewText.length}`),
        reviewer_name: reviewerName,
        review_text: reviewText,
        status: "approved",
        created_at:
          typeof row.created_at === "string" ? row.created_at : "",
        color: randomColor(),
      };
    };

    const getOffset = (
      index: number,
      current: number,
      total: number,
    ): number => {
      if (total <= 1) return 0;

      let offset = (index - current + total) % total;

      if (offset > total / 2) {
        offset -= total;
      }

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

      if (
        reviews.length <= 1 ||
        reducedMotion.matches ||
        !isInView ||
        document.visibilityState !== "visible"
      ) {
        return;
      }

      rotationTimer = window.setTimeout(() => {
        moveTo(activeIndex + 1);
      }, ROTATION_INTERVAL);
    };

    const positionCards = (): void => {
      if (cards.length === 0 || stage.clientWidth === 0) return;

      const isPhone = window.innerWidth <= 640;
      const maxVisibleDistance = isPhone ? 1 : 2;

      const step = Math.max(
        isPhone ? 150 : 205,
        Math.min(
          isPhone ? 215 : 320,
          stage.clientWidth * (isPhone ? 0.52 : 0.3),
        ),
      );

      cards.forEach((card, index) => {
        const offset = getOffset(index, activeIndex, cards.length);
        const distance = Math.abs(offset);
        const visible = distance <= maxVisibleDistance;
        const scale =
          distance === 0 ? 1 : Math.max(0.83, 1 - distance * 0.08);

        card.style.transform =
          `translate(-50%, -50%) translateX(${offset * step}px) ` +
          `translateZ(${-distance * 38}px) ` +
          `rotateY(${offset * -5}deg) scale(${scale})`;

        card.style.opacity = !visible
          ? "0"
          : distance === 0
            ? "1"
            : distance === 1
              ? "0.54"
              : "0.25";

        card.style.filter =
          distance === 0 || reducedMotion.matches
            ? "none"
            : `blur(${Math.min(1.2, distance * 0.55)}px)`;

        card.style.visibility = visible ? "visible" : "hidden";
        card.style.pointerEvents = visible ? "auto" : "none";
        card.style.zIndex = String(10 - distance);
        card.tabIndex = visible ? 0 : -1;
        card.classList.toggle("is-active", distance === 0);
        card.setAttribute("aria-hidden", String(!visible));
      });
    };

    const moveTo = (index: number): void => {
      if (reviews.length === 0) return;

      activeIndex = ((index % reviews.length) + reviews.length) % reviews.length;
      positionCards();
      scheduleRotation();
    };

    const buildCard = (review: Review, index: number): HTMLElement => {
      const card = makeElement("article", "review-card", "");

      const name = makeElement(
        "h3",
        "review-card-name",
        review.reviewer_name,
      );

      const text = makeElement(
        "p",
        "review-card-text",
        review.review_text,
      );

      card.dataset.reviewIndex = String(index);
      card.style.setProperty("--review-color", review.color || randomColor());
      card.style.borderRadius = "17px";
      card.tabIndex = 0;
      card.setAttribute("aria-label", `Review by ${review.reviewer_name}`);

      // Cards contain only the reviewer name and review text.
      card.append(name, text);

      card.addEventListener("click", () => {
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

      // Wait for layout so the initial positioning is calculated correctly.
      window.requestAnimationFrame(() => {
        positionCards();
        scheduleRotation();
      });
    };

    const loadReviews = async (): Promise<void> => {
      if (!supabaseConfigured) {
        reviews = isDev ? [...SAMPLE_REVIEWS] : [];
        renderReviews();
        return;
      }

      try {
        const query = new URLSearchParams({
          select: "id,reviewer_name,review_text,created_at,status",
          status: "eq.approved",
          order: "created_at.desc",
          limit: "100",
        });

        const response = await fetch(`${endpoint}?${query.toString()}`, {
          method: "GET",
          headers: {
            apikey: supabaseKey,
            Authorization: `Bearer ${supabaseKey}`,
            Accept: "application/json",
          },
        });

        if (!response.ok) {
          throw new Error(`Review service returned HTTP ${response.status}.`);
        }

        const payload: unknown = await response.json();
        const rows: unknown[] = Array.isArray(payload) ? payload : [];

        const approved = rows
          .map(normaliseApprovedReview)
          .filter((review): review is Review => review !== null);

        reviews = isDev
          ? [...SAMPLE_REVIEWS, ...approved]
          : approved;

        renderReviews();
      } catch (error) {
        console.error("[Portfolio reviews] Could not load reviews.", error);

        reviews = isDev ? [...SAMPLE_REVIEWS] : [];
        renderReviews();
      }
    };

    const openForm = (button?: HTMLButtonElement): void => {
      lastOpenButton = button ?? null;
      hideMessage();

      // Give the form a new accent colour on every opening.
      dialog.style.setProperty("--form-accent", randomColor());

      if (typeof dialog.showModal === "function") {
        if (!dialog.open) dialog.showModal();
      } else {
        dialog.setAttribute("open", "");
      }
    };

    const closeForm = (): void => {
      if (dialog.open && typeof dialog.close === "function") {
        dialog.close();
      } else {
        dialog.removeAttribute("open");
        lastOpenButton?.focus();
      }
    };

    openButtons.forEach((button) => {
      button.addEventListener("click", () => openForm(button));
    });

    closeButton.addEventListener("click", closeForm);

    dialog.addEventListener("close", () => {
      lastOpenButton?.focus();
      lastOpenButton = null;
    });

    dialog.addEventListener("click", (event: MouseEvent) => {
      if (event.target === dialog) closeForm();
    });

    reviewInput.addEventListener("input", () => {
      if (reviewInput.value.length > MAX_REVIEW_LENGTH) {
        reviewInput.value = reviewInput.value.slice(0, MAX_REVIEW_LENGTH);
      }

      countLabel.textContent = String(reviewInput.value.length);
      hideMessage();
    });

    nameInput.addEventListener("input", hideMessage);
    consentInput.addEventListener("change", hideMessage);

    form.addEventListener("submit", async (event: SubmitEvent) => {
      event.preventDefault();

      if (!form.reportValidity()) return;

      const data = new FormData(form);
      const honeypot = String(data.get("website") ?? "").trim();

      // Silently discard likely automated submissions.
      if (honeypot) return;

      const reviewerName = cleanText(
        data.get("reviewer_name"),
        MAX_NAME_LENGTH,
      );

      const reviewText = cleanText(
        data.get("review_text"),
        MAX_REVIEW_LENGTH,
      );

      const consentGiven = data.get("review_consent") === "on";

      if (reviewerName.length < 2) {
        showMessage("Please enter your name using at least 2 characters.");
        nameInput.focus();
        return;
      }

      if (reviewText.length < 10 || reviewText.length > MAX_REVIEW_LENGTH) {
        showMessage("Please write a review between 10 and 1000 characters.");
        reviewInput.focus();
        return;
      }

      if (!consentGiven) {
        showMessage("Please agree to the terms and publication consent.");
        consentInput.focus();
        return;
      }

      if (!supabaseConfigured) {
        showMessage(
          "Review submission is not configured. Your review has not been sent.",
        );
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
            apikey: supabaseKey,
            Authorization: `Bearer ${supabaseKey}`,
            "Content-Type": "application/json",
            Prefer: "return=minimal",
          },
          body: JSON.stringify({
            reviewer_name: reviewerName,
            review_text: reviewText,
            status: "pending",
            publication_consent: true,
            publication_consent_at: new Date().toISOString(),
          }),
        });

        if (!response.ok) {
          const responseText = await response.text();

          console.error(
            "[Portfolio reviews] Submission failed:",
            response.status,
            responseText.slice(0, 500),
          );

          if (response.status === 401 || response.status === 403) {
            throw new Error(
              "The database blocked this submission. Check the Supabase key and review-table permissions.",
            );
          }

          if (response.status === 400 || response.status === 404) {
            throw new Error(
              "The review table schema does not match the form. Check the database migration.",
            );
          }

          throw new Error(
            "Your review could not be submitted. Please try again.",
          );
        }

        // Show the newly submitted review immediately in this browser.
        // It remains pending in the database until an administrator approves it.
        const submittedReview: Review = {
          id: `pending-${Date.now()}`,
          reviewer_name: reviewerName,
          review_text: reviewText,
          status: "pending",
          created_at: new Date().toISOString(),
          color: randomColor(),
        };

        reviews = [...reviews, submittedReview];
        renderReviews();

        // Centre the new review immediately after rendering the cards.
        moveTo(reviews.length - 1);

        form.reset();
        countLabel.textContent = "0";
        closeForm();

        showToast(
          "Your review has been submitted and is visible here for this session. It will be published to everyone after approval.",
        );
      } catch (error) {
        showMessage(
          error instanceof Error
            ? error.message
            : "Something went wrong. Please try again.",
        );
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
        moveTo(activeIndex + (delta < 0 ? 1 : -1));
      }
    });

    stage.addEventListener("pointercancel", () => {
      pointerStart = null;
    });

    window.addEventListener("resize", positionCards, { passive: true });

    document.addEventListener("visibilitychange", scheduleRotation);
    reducedMotion.addEventListener("change", positionCards);

    const observer = new IntersectionObserver(
      ([entry]) => {
        isInView = Boolean(entry?.isIntersecting);
        scheduleRotation();
      },
      { threshold: 0.05 },
    );

    observer.observe(stage);

    void loadReviews();
  }
}
