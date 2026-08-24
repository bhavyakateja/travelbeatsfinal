"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  PointerEvent as ReactPointerEvent,
  KeyboardEvent as ReactKeyboardEvent,
} from "react";
import gsap from "gsap";

export type DepthCarouselItem =
  | string
  | {
    image: string;
    alt?: string;
    name?: string;
    country?: string;
  };

type TiltDirection = "left" | "right";

export interface DepthCarouselProps {
  items?: DepthCarouselItem[];

  cardWidth?: number;
  cardHeight?: number;
  radius?: number;

  tint?: string;

  depth?: number;
  spread?: number;
  tilt?: number;
  tiltDirection?: TiltDirection;
  perspective?: number;

  visibleCards?: number;
  falloff?: number;
  blur?: number;

  duration?: number;
  ease?: string;

  autoplay?: boolean;
  autoplayDelay?: number;

  loop?: boolean;

  showControls?: boolean;
  showIndicators?: boolean;

  onChange?: (
    index: number,
    item: DepthCarouselItem
  ) => void;

  className?: string;
}

interface CarouselConfig {
  count: number;

  cardWidth: number;
  cardHeight: number;

  depth: number;
  spread: number;
  tilt: number;
  tiltDirection: TiltDirection;

  perspective: number;

  visibleCards: number;
  falloff: number;
  blur: number;

  duration: number;
  ease: string;

  autoplayDelay: number;

  loop: boolean;
}

interface DragState {
  x: number;
  startPos: number;

  lastX: number;
  lastT: number;

  v: number;

  moved: boolean;

  id: number;
}

const DEFAULT_ITEMS: DepthCarouselItem[] = [
  {
    image: "/carousel/thailand.jpg",
    alt: "Thailand",
    name: "Thailand",
    country: "Thailand",
  },
  {
    image: "/carousel/vietnam.jpg",
    alt: "Vietnam",
    name: "Vietnam",
    country: "Vietnam",
  },
  {
    image: "/carousel/japan.jpg",
    alt: "Japan",
    name: "Japan",
    country: "Japan",
  },
];

const clamp = (
  value: number,
  min: number,
  max: number
) => {
  return Math.min(
    Math.max(value, min),
    max
  );
};

const normalizeItem = (
  item: DepthCarouselItem
) => {
  if (typeof item === "string") {
    return {
      image: item,
      alt: "",
      name: "",
      country: "",
    };
  }

  return {
    image: item.image,
    alt: item.alt ?? "",
    name: item.name ?? "",
    country: item.country ?? "",
  };
};

const normalizeIndex = (
  index: number,
  count: number
) => {
  return (
    ((index % count) + count) % count
  );
};

const DepthCarousel = ({
  items = DEFAULT_ITEMS,

  cardWidth = 300,
  cardHeight = 380,
  radius = 18,

  tint = "#05060a",

  depth = 220,
  spread = 90,
  tilt = 22,
  tiltDirection = "right",
  perspective = 1400,

  visibleCards = 4,
  falloff = 0.2,
  blur = 6,

  duration = 700,
  ease = "power3.out",

  autoplay = false,

  // 100ms = 0.10 second
  autoplayDelay = 100,

  loop = true,

  showControls = true,
  showIndicators = true,

  onChange,

  className = "",
}: DepthCarouselProps) => {
  const data = useMemo(
    () =>
      (Array.isArray(items)
        ? items
        : []
      ).map(normalizeItem),
    [items]
  );

  const count = data.length;

  const rootRef =
    useRef<HTMLDivElement | null>(null);

  const stageRef =
    useRef<HTMLDivElement | null>(null);

  const cardRefs = useRef<
    (HTMLDivElement | null)[]
  >([]);

  const overlayRefs = useRef<
    (HTMLSpanElement | null)[]
  >([]);

  const posRef = useRef(0);

  const focusRef = useRef(0);

  const tweenRef =
    useRef<gsap.core.Tween | null>(null);

  const scaleRef = useRef(1);

  const cfgRef =
    useRef<CarouselConfig>(
      {} as CarouselConfig
    );

  const onChangeRef =
    useRef(onChange);

  const dragRef =
    useRef<DragState | null>(null);

  const wheelTimerRef =
    useRef<ReturnType<typeof setTimeout> | null>(
      null
    );

  const autoTimerRef =
    useRef<ReturnType<typeof setTimeout> | null>(
      null
    );

  const reducedMotionRef =
    useRef(false);

  const [active, setActive] =
    useState(0);

  onChangeRef.current = onChange;

  /*
   * Keep the complete configuration in one place.
   *
   * IMPORTANT:
   * cardHeight is included here.
   */
  cfgRef.current = {
    count,

    cardWidth,
    cardHeight,

    depth,
    spread,
    tilt,
    tiltDirection,

    perspective,

    visibleCards,
    falloff,
    blur,

    duration,
    ease,

    autoplayDelay,

    loop,
  };

  /*
   * ---------------------------------------------------------
   * RESPONSIVE SCALE
   * ---------------------------------------------------------
   *
   * Scale based on BOTH width and height.
   *
   * This prevents the carousel from becoming too large
   * inside a short hero section.
   */
  const updateScale = useCallback(() => {
    const root =
      rootRef.current;

    if (!root) return;

    const cfg =
      cfgRef.current;

    const width =
      root.clientWidth;

    const height =
      root.clientHeight;

    if (!width || !height) {
      scaleRef.current = 1;
      return;
    }

    /*
     * Horizontal space required.
     *
     * We don't need the entire theoretical stack width,
     * because the cards overlap.
     */
    const requiredWidth =
      cfg.cardWidth +
      Math.abs(cfg.spread) *
      Math.min(
        cfg.visibleCards,
        2.5
      ) +
      80;

    /*
     * Vertical space required.
     */
    const requiredHeight =
      cfg.cardHeight + 40;

    const widthScale =
      width / requiredWidth;

    const heightScale =
      height / requiredHeight;

    /*
     * Use the smaller scale so it always fits.
     */
    scaleRef.current = clamp(
      Math.min(
        widthScale,
        heightScale
      ),
      0.42,
      1
    );
  }, []);

  /*
   * ---------------------------------------------------------
   * LAYOUT
   * ---------------------------------------------------------
   */
  const layout = useCallback(
    (position: number) => {
      const cfg =
        cfgRef.current;

      if (!cfg.count) return;

      const direction =
        cfg.tiltDirection === "left"
          ? -1
          : 1;

      const scale =
        scaleRef.current;

      for (
        let index = 0;
        index < cfg.count;
        index++
      ) {
        const card =
          cardRefs.current[index];

        if (!card) continue;

        let distance =
          index - position;

        /*
         * Circular distance for looping.
         */
        if (
          cfg.loop &&
          cfg.count > 1
        ) {
          distance =
            ((distance % cfg.count) +
              cfg.count) %
            cfg.count;

          if (
            distance >
            cfg.count / 2
          ) {
            distance -=
              cfg.count;
          }
        }

        const behind =
          Math.max(0, distance);

        const absoluteDistance =
          Math.abs(distance);

        const visible =
          absoluteDistance <=
          cfg.visibleCards + 0.5;

        /*
         * Depth.
         */
        const translateZ =
          -cfg.depth * distance;

        /*
         * Horizontal spread.
         */
        const translateX =
          direction *
          cfg.spread *
          distance;

        /*
         * Tilt only cards behind.
         */
        const rotateY =
          direction *
          cfg.tilt *
          clamp(
            distance,
            0,
            1
          );

        /*
         * Fade cards that are moving behind.
         */
        let opacity =
          distance < 0
            ? Math.max(
              0,
              1 + distance
            )
            : 1;

        if (!visible) {
          opacity = 0;
        }

        /*
         * Darken cards behind.
         */
        const brightness =
          Math.max(
            0.15,
            1 -
            behind *
            cfg.falloff
          );

        /*
         * Blur cards behind.
         */
        const blurAmount =
          cfg.blur > 0
            ? Math.min(
              cfg.blur,
              (behind /
                Math.max(
                  1,
                  cfg.visibleCards
                )) *
              cfg.blur
            )
            : 0;

        /*
         * Active card gets highest z-index.
         */
        const zIndex = Math.round(
          2000 -
          distance * 20
        );

        card.style.transform = [
          "translate(-50%, -50%)",
          `scale(${scale})`,
          `translateX(${translateX}px)`,
          `translateZ(${translateZ}px)`,
          `rotateY(${rotateY}deg)`,
        ].join(" ");

        card.style.opacity =
          opacity.toString();

        card.style.filter = [
          `brightness(${brightness})`,
          `blur(${blurAmount}px)`,
        ].join(" ");

        card.style.zIndex =
          zIndex.toString();

        card.style.pointerEvents =
          visible &&
            opacity > 0.05
            ? "auto"
            : "none";

        /*
         * Dark overlay for cards behind.
         */
        const overlay =
          overlayRefs.current[
          index
          ];

        if (overlay) {
          overlay.style.opacity =
            clamp(
              behind *
              cfg.falloff *
              1.25,
              0,
              0.86
            ).toString();
        }
      }
    },
    []
  );

  /*
   * ---------------------------------------------------------
   * NOTIFY ACTIVE SLIDE
   * ---------------------------------------------------------
   */
  const notify = useCallback(
    (index: number) => {
      setActive(index);

      onChangeRef.current?.(
        index,
        data[index]
      );
    },
    [data]
  );

  /*
   * ---------------------------------------------------------
   * GSAP MOVE
   * ---------------------------------------------------------
   */
  const tweenTo = useCallback(
    (
      target: number,
      animate: boolean,
      customDuration?: number
    ) => {
      tweenRef.current?.kill();

      const cfg =
        cfgRef.current;

      const proxy = {
        position:
          posRef.current,
      };

      const tweenDuration =
        animate &&
          !reducedMotionRef.current
          ? customDuration ??
          cfg.duration
          : 0;

      tweenRef.current =
        gsap.to(proxy, {
          position: target,

          duration:
            tweenDuration / 1000,

          ease: cfg.ease,

          overwrite: true,

          onUpdate: () => {
            posRef.current =
              proxy.position;

            layout(
              proxy.position
            );
          },

          onComplete: () => {
            if (cfg.count > 0) {
              posRef.current =
                normalizeIndex(
                  posRef.current,
                  cfg.count
                );
            }

            layout(
              posRef.current
            );
          },
        });
    },
    [layout]
  );

  /*
   * ---------------------------------------------------------
   * SET FOCUS
   * ---------------------------------------------------------
   */
  const setFocus = useCallback(
    (
      rawIndex: number,
      animate = true,
      customDuration?: number
    ) => {
      const cfg =
        cfgRef.current;

      if (!cfg.count) return;

      const index =
        cfg.loop
          ? normalizeIndex(
            rawIndex,
            cfg.count
          )
          : clamp(
            rawIndex,
            0,
            cfg.count - 1
          );

      let delta =
        index -
        posRef.current;

      if (
        cfg.loop &&
        cfg.count > 1
      ) {
        delta =
          normalizeIndex(
            delta,
            cfg.count
          );

        if (
          delta >
          cfg.count / 2
        ) {
          delta -=
            cfg.count;
        }
      }

      tweenTo(
        posRef.current +
        delta,
        animate,
        customDuration
      );

      if (
        index !==
        focusRef.current
      ) {
        focusRef.current =
          index;

        notify(index);
      }
    },
    [notify, tweenTo]
  );

  /*
   * ---------------------------------------------------------
   * NAVIGATION
   * ---------------------------------------------------------
   */
  const navigateBy =
    useCallback(
      (
        step: number,
        customDuration?: number
      ) => {
        setFocus(
          focusRef.current +
          step,
          true,
          customDuration
        );
      },
      [setFocus]
    );

  /*
   * ---------------------------------------------------------
   * RESPONSIVE RESIZE
   * ---------------------------------------------------------
   */
  useEffect(() => {
    const root =
      rootRef.current;

    if (!root) return;

    const resizeObserver =
      new ResizeObserver(() => {
        updateScale();

        layout(
          posRef.current
        );
      });

    resizeObserver.observe(
      root
    );

    updateScale();

    layout(
      posRef.current
    );

    return () =>
      resizeObserver.disconnect();
  }, [
    layout,
    updateScale,
  ]);

  /*
   * ---------------------------------------------------------
   * MOUSE WHEEL
   * ---------------------------------------------------------
   */
  useEffect(() => {
    const root =
      rootRef.current;

    if (!root) return;

    const handleWheel = (
      event: WheelEvent
    ) => {
      const cfg =
        cfgRef.current;

      if (cfg.count < 2)
        return;

      event.preventDefault();

      tweenRef.current?.kill();

      const raw =
        Math.abs(
          event.deltaX
        ) >
          Math.abs(
            event.deltaY
          )
          ? event.deltaX
          : event.deltaY;

      const delta =
        event.deltaMode === 1
          ? raw * 24
          : raw;

      const step = clamp(
        delta /
        (cfg.cardWidth *
          0.9),
        -0.6,
        0.6
      );

      posRef.current +=
        step;

      layout(
        posRef.current
      );

      if (
        wheelTimerRef.current
      ) {
        clearTimeout(
          wheelTimerRef.current
        );
      }

      wheelTimerRef.current =
        setTimeout(() => {
          setFocus(
            Math.round(
              posRef.current
            ),
            true
          );
        }, 130);
    };

    root.addEventListener(
      "wheel",
      handleWheel,
      {
        passive: false,
      }
    );

    return () => {
      root.removeEventListener(
        "wheel",
        handleWheel
      );

      if (
        wheelTimerRef.current
      ) {
        clearTimeout(
          wheelTimerRef.current
        );
      }
    };
  }, [
    layout,
    setFocus,
  ]);

  /*
   * ---------------------------------------------------------
   * POINTER DOWN
   * ---------------------------------------------------------
   */
  const onPointerDown =
    useCallback(
      (
        event: ReactPointerEvent<HTMLDivElement>
      ) => {
        const cfg =
          cfgRef.current;

        if (cfg.count < 2)
          return;

        /*
         * Stop current GSAP animation.
         */
        tweenRef.current?.kill();

        dragRef.current = {
          x: event.clientX,

          startPos:
            posRef.current,

          lastX:
            event.clientX,

          lastT:
            performance.now(),

          v: 0,

          moved: false,

          id: event.pointerId,
        };
      },
      []
    );

  /*
   * ---------------------------------------------------------
   * POINTER MOVE / SWIPE
   * ---------------------------------------------------------
   */
  const onPointerMove =
    useCallback(
      (
        event: ReactPointerEvent<HTMLDivElement>
      ) => {
        const drag =
          dragRef.current;

        if (!drag) return;

        const cfg =
          cfgRef.current;

        const stepPx =
          Math.max(
            cfg.cardWidth *
            0.55 *
            scaleRef.current,
            40
          );

        const dx =
          event.clientX -
          drag.x;

        /*
         * Start actual dragging after 5px.
         */
        if (
          !drag.moved &&
          Math.abs(dx) > 5
        ) {
          drag.moved = true;

          try {
            rootRef.current?.setPointerCapture(
              drag.id
            );
          } catch {
            // Ignore capture errors.
          }
        }

        if (!drag.moved)
          return;

        const now =
          performance.now();

        const dt =
          Math.max(
            now -
            drag.lastT,
            1
          );

        drag.v =
          (event.clientX -
            drag.lastX) /
          dt;

        drag.lastX =
          event.clientX;

        drag.lastT = now;

        /*
         * Horizontal swipe.
         */
        posRef.current =
          drag.startPos -
          dx / stepPx;

        layout(
          posRef.current
        );
      },
      [layout]
    );

  /*
   * ---------------------------------------------------------
   * POINTER END
   * ---------------------------------------------------------
   */
  const onPointerEnd =
    useCallback(() => {
      const drag =
        dragRef.current;

      if (!drag) return;

      dragRef.current = null;

      if (!drag.moved)
        return;

      const cfg =
        cfgRef.current;

      const stepPx =
        Math.max(
          cfg.cardWidth *
          0.55 *
          scaleRef.current,
          40
        );

      /*
       * Add momentum based on swipe velocity.
       */
      const projected =
        posRef.current -
        (drag.v * 180) /
        stepPx;

      setFocus(
        Math.round(
          projected
        ),
        true
      );
    }, [setFocus]);

  /*
   * ---------------------------------------------------------
   * KEYBOARD
   * ---------------------------------------------------------
   */
  const onKeyDown =
    useCallback(
      (
        event: ReactKeyboardEvent<HTMLDivElement>
      ) => {
        if (
          event.key ===
          "ArrowLeft"
        ) {
          event.preventDefault();

          navigateBy(-1);
        }

        if (
          event.key ===
          "ArrowRight"
        ) {
          event.preventDefault();

          navigateBy(1);
        }
      },
      [navigateBy]
    );

  /*
   * ---------------------------------------------------------
   * CARD CLICK
   * ---------------------------------------------------------
   */
  const onCardClick =
    useCallback(
      (index: number) => {
        if (
          dragRef.current?.moved
        ) {
          return;
        }

        setFocus(
          index,
          true
        );
      },
      [setFocus]
    );

  /*
   * ---------------------------------------------------------
   * AUTOPLAY
   * ---------------------------------------------------------
   *
   * IMPORTANT:
   *
   * We use setTimeout instead of setInterval.
   *
   * Your requested autoplayDelay = 100ms.
   *
   * If we used:
   *
   * setInterval(..., 100)
   *
   * while the GSAP animation lasted 700ms,
   * every animation would cancel the previous one.
   *
   * Therefore autoplay uses a short animation duration
   * and schedules the next slide after each movement.
   */
  useEffect(() => {
    reducedMotionRef.current =
      typeof window !==
      "undefined" &&
      window
        .matchMedia(
          "(prefers-reduced-motion: reduce)"
        )
        .matches;

    if (
      !autoplay ||
      reducedMotionRef.current ||
      count < 2
    ) {
      return;
    }

    const root =
      rootRef.current;

    if (!root) return;

    let hovered = false;

    let focused = false;

    let dragging = false;

    const stop = () => {
      if (
        autoTimerRef.current
      ) {
        clearTimeout(
          autoTimerRef.current
        );
      }

      autoTimerRef.current =
        null;
    };

    const scheduleNext = () => {
      stop();

      autoTimerRef.current =
        setTimeout(() => {
          if (
            !hovered &&
            !focused &&
            !dragging
          ) {
            /*
             * Autoplay movement is fast.
             *
             * 100ms delay -> approximately 90ms
             * transition so the carousel actually
             * moves instead of constantly cancelling.
             */
            const autoDuration =
              Math.min(
                cfgRef.current
                  .duration,
                Math.max(
                  60,
                  cfgRef.current
                    .autoplayDelay *
                  0.9
                )
              );

            navigateBy(
              1,
              autoDuration
            );
          }

          scheduleNext();
        }, Math.max(
          1,
          cfgRef.current
            .autoplayDelay
        ));
    };

    const onEnter = () => {
      hovered = true;
    };

    const onLeave = () => {
      hovered = false;
    };

    const onFocusIn = () => {
      focused = true;
    };

    const onFocusOut = () => {
      focused = false;
    };

    const onPointerDownLocal =
      () => {
        dragging = true;
      };

    const onPointerUpLocal =
      () => {
        dragging = false;
      };

    root.addEventListener(
      "mouseenter",
      onEnter
    );

    root.addEventListener(
      "mouseleave",
      onLeave
    );

    root.addEventListener(
      "focusin",
      onFocusIn
    );

    root.addEventListener(
      "focusout",
      onFocusOut
    );

    root.addEventListener(
      "pointerdown",
      onPointerDownLocal
    );

    root.addEventListener(
      "pointerup",
      onPointerUpLocal
    );

    root.addEventListener(
      "pointercancel",
      onPointerUpLocal
    );

    scheduleNext();

    return () => {
      stop();

      root.removeEventListener(
        "mouseenter",
        onEnter
      );

      root.removeEventListener(
        "mouseleave",
        onLeave
      );

      root.removeEventListener(
        "focusin",
        onFocusIn
      );

      root.removeEventListener(
        "focusout",
        onFocusOut
      );

      root.removeEventListener(
        "pointerdown",
        onPointerDownLocal
      );

      root.removeEventListener(
        "pointerup",
        onPointerUpLocal
      );

      root.removeEventListener(
        "pointercancel",
        onPointerUpLocal
      );
    };
  }, [
    autoplay,
    autoplayDelay,
    count,
    navigateBy,
  ]);

  /*
   * ---------------------------------------------------------
   * RE-LAYOUT WHEN PROPS CHANGE
   * ---------------------------------------------------------
   */
  useEffect(() => {
    updateScale();

    layout(
      posRef.current
    );
  }, [
    layout,

    updateScale,

    depth,
    spread,
    tilt,
    tiltDirection,

    visibleCards,

    falloff,
    blur,

    cardWidth,
    cardHeight,

    radius,

    count,
  ]);

  /*
   * ---------------------------------------------------------
   * CLEANUP
   * ---------------------------------------------------------
   */
  useEffect(() => {
    return () => {
      tweenRef.current?.kill();

      if (
        wheelTimerRef.current
      ) {
        clearTimeout(
          wheelTimerRef.current
        );
      }

      if (
        autoTimerRef.current
      ) {
        clearTimeout(
          autoTimerRef.current
        );
      }
    };
  }, []);

  /*
   * ---------------------------------------------------------
   * EMPTY
   * ---------------------------------------------------------
   */
  if (count === 0) {
    return null;
  }

  /*
   * ---------------------------------------------------------
   * RENDER
   * ---------------------------------------------------------
   */
  return (
    <div
      ref={rootRef}
      className={`
        relative
        flex
        h-full
        min-h-[320px]
        w-full
        select-none
        items-center
        justify-center
        overflow-hidden
        outline-none
        cursor-grab
        active:cursor-grabbing
        touch-pan-y
        ${className}
      `.trim()}
      style={{
        perspective: `${perspective}px`,
        perspectiveOrigin:
          "50% 50%",
        touchAction:
          "pan-y",
      }}
      role="group"
      aria-roledescription="carousel"
      aria-label="Destination carousel"
      tabIndex={0}
      onPointerDown={
        onPointerDown
      }
      onPointerMove={
        onPointerMove
      }
      onPointerUp={
        onPointerEnd
      }
      onPointerCancel={
        onPointerEnd
      }
      onKeyDown={
        onKeyDown
      }
    >
      {/* 3D STAGE */}
      <div
        ref={stageRef}
        className="
          absolute
          inset-0
          overflow-visible
        "
        style={{
          transformStyle:
            "preserve-3d",
        }}
      >
        {data.map(
          (item, index) => (
            <div
              key={`${item.image}-${index}`}
              ref={(element) => {
                cardRefs.current[
                  index
                ] = element;
              }}
              className="
                absolute
                left-1/2
                top-1/2
                cursor-pointer
                overflow-hidden
                bg-[#0b0d12]
                shadow-[0_30px_60px_-20px_rgba(0,0,0,0.65),0_8px_20px_-10px_rgba(0,0,0,0.5)]
                will-change-transform
              "
              style={{
                width:
                  cardWidth,
                height:
                  cardHeight,

                borderRadius:
                  radius,

                transformOrigin:
                  "center",

                transformStyle:
                  "preserve-3d",

                backfaceVisibility:
                  "hidden",
              }}
              aria-roledescription="slide"
              aria-label={`${index + 1} of ${count}`}
              aria-hidden={
                active !== index
              }
              onClick={() =>
                onCardClick(
                  index
                )
              }
            >
              <img
                className="
                  pointer-events-none
                  block
                  h-full
                  w-full
                  select-none
                  object-cover
                "
                src={item.image}
                alt={
                  item.alt ||
                  item.name ||
                  ""
                }
                draggable={false}
                loading={
                  index === 0
                    ? "eager"
                    : "lazy"
                }
                decoding="async"
              />

              {/* DARK DEPTH OVERLAY */}
              <span
                ref={(element) => {
                  overlayRefs.current[
                    index
                  ] = element;
                }}
                className="
                  pointer-events-none
                  absolute
                  inset-0
                  opacity-0
                  mix-blend-multiply
                "
                style={{
                  background:
                    tint,
                }}
              />

              {/* CARD TEXT */}
              {(item.name ||
                item.country) && (
                  <div
                    className="
                    pointer-events-none
                    absolute
                    inset-x-0
                    bottom-0
                    bg-gradient-to-t
                    from-black/80
                    via-black/40
                    to-transparent
                    p-5
                    text-white
                  "
                  >
                    {item.country && (
                      <span
                        className="
                        block
                        text-xs
                        font-semibold
                        uppercase
                        tracking-wider
                        text-white/75
                      "
                      >
                        {
                          item.country
                        }
                      </span>
                    )}

                    {item.name && (
                      <h2
                        className="
                        text-xl
                        font-bold
                        leading-tight
                        drop-shadow-sm
                      "
                      >
                        {item.name}
                      </h2>
                    )}
                  </div>
                )}
            </div>
          )
        )}
      </div>

      {/* CONTROLS */}
      {showControls &&
        count > 1 && (
          <>
            <button
              type="button"
              className="
                absolute
                left-3
                top-1/2
                z-[3000]
                grid
                h-[42px]
                w-[42px]
                -translate-y-1/2
                place-items-center
                rounded-full
                border
                border-white/20
                bg-[rgba(18,20,26,0.55)]
                text-white
                backdrop-blur-md
                transition-all
                duration-200
                hover:border-white/40
                hover:bg-[rgba(28,31,40,0.85)]
                active:scale-95
              "
              aria-label="Previous slide"
              onClick={() =>
                navigateBy(-1)
              }
            >
              <svg
                viewBox="0 0 24 24"
                width="20"
                height="20"
                aria-hidden="true"
              >
                <path
                  d="M15 5l-7 7 7 7"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>

            <button
              type="button"
              className="
                absolute
                right-3
                top-1/2
                z-[3000]
                grid
                h-[42px]
                w-[42px]
                -translate-y-1/2
                place-items-center
                rounded-full
                border
                border-white/20
                bg-[rgba(18,20,26,0.55)]
                text-white
                backdrop-blur-md
                transition-all
                duration-200
                hover:border-white/40
                hover:bg-[rgba(28,31,40,0.85)]
                active:scale-95
              "
              aria-label="Next slide"
              onClick={() =>
                navigateBy(1)
              }
            >
              <svg
                viewBox="0 0 24 24"
                width="20"
                height="20"
                aria-hidden="true"
              >
                <path
                  d="M9 5l7 7-7 7"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </>
        )}

      {/* INDICATORS */}
      {showIndicators && count > 1 && (
        <div
          className="absolute bottom-3 left-1/2 z-[3000] flex -translate-x-1/2 gap-2 rounded-full bg-slate-900/40 px-3 py-2 backdrop-blur-sm"
          role="tablist"
          aria-label="Slides"
        >
          {data.map((_, index) => {
            const isActive = active === index;
            return (
              <button
                key={index}
                type="button"
                role="tab"
                aria-selected={isActive}
                aria-label={`Go to slide ${index + 1}`}
                className={`h-2 cursor-pointer rounded-full transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-white ${isActive ? "w-5 bg-white" : "w-2 bg-white/30 hover:bg-white/50"
                  }`}
                onClick={() => setFocus(index, true)}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};

export default DepthCarousel;