"use client";

import { useRef, useEffect, useCallback } from "react";
import gsap from "gsap";

// Hook for fade in animation on mount
export function useFadeIn(delay: number = 0, duration: number = 0.6) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current) {
      gsap.fromTo(
        ref.current,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration, delay, ease: "power2.out" }
      );
    }
  }, [delay, duration]);

  return ref;
}

// Hook for staggered children animation
export function useStaggerChildren(
  stagger: number = 0.1,
  delay: number = 0,
  duration: number = 0.5
) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      const children = containerRef.current.children;
      gsap.fromTo(
        children,
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration,
          stagger,
          delay,
          ease: "power2.out",
        }
      );
    }
  }, [stagger, delay, duration]);

  return containerRef;
}

// Hook for counter animation
export function useCountUp(
  endValue: number,
  duration: number = 1.5,
  delay: number = 0
) {
  const ref = useRef<HTMLSpanElement>(null);
  const countRef = useRef({ value: 0 });

  useEffect(() => {
    if (ref.current) {
      gsap.to(countRef.current, {
        value: endValue,
        duration,
        delay,
        ease: "power2.out",
        onUpdate: () => {
          if (ref.current) {
            const formatted = countRef.current.value >= 1000
              ? Math.round(countRef.current.value).toLocaleString()
              : Math.round(countRef.current.value).toString();
            ref.current.textContent = formatted;
          }
        },
      });
    }
  }, [endValue, duration, delay]);

  return ref;
}

// Hook for sidebar toggle animation
export function useSidebarToggle(isOpen: boolean, width: number = 300) {
  const sidebarRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (sidebarRef.current) {
      gsap.to(sidebarRef.current, {
        width: isOpen ? width : 0,
        opacity: isOpen ? 1 : 0,
        duration: 0.3,
        ease: "power2.inOut",
      });
    }
  }, [isOpen, width]);

  return sidebarRef;
}

// Hook for bar chart animation
export function useBarAnimation(heights: number[], delay: number = 0.3) {
  const barsRef = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    barsRef.current.forEach((bar, index) => {
      if (bar) {
        gsap.fromTo(
          bar,
          { height: 0 },
          {
            height: heights[index],
            duration: 0.8,
            delay: delay + index * 0.15,
            ease: "power2.out",
          }
        );
      }
    });
  }, [heights, delay]);

  const setBarRef = useCallback((el: HTMLDivElement | null, index: number) => {
    barsRef.current[index] = el;
  }, []);

  return setBarRef;
}

// Hook for message animation (chat)
export function useMessageAnimation() {
  const animate = useCallback((element: HTMLElement, isUser: boolean) => {
    gsap.fromTo(
      element,
      {
        opacity: 0,
        x: isUser ? 30 : -30,
        y: 10,
      },
      {
        opacity: 1,
        x: 0,
        y: 0,
        duration: 0.4,
        ease: "back.out(1.2)",
      }
    );
  }, []);

  return animate;
}

// Hook for scale on hover
export function useHoverScale(scale: number = 1.02) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const onEnter = () => {
      gsap.to(element, { scale, duration: 0.2, ease: "power2.out" });
    };

    const onLeave = () => {
      gsap.to(element, { scale: 1, duration: 0.2, ease: "power2.out" });
    };

    element.addEventListener("mouseenter", onEnter);
    element.addEventListener("mouseleave", onLeave);

    return () => {
      element.removeEventListener("mouseenter", onEnter);
      element.removeEventListener("mouseleave", onLeave);
    };
  }, [scale]);

  return ref;
}

// Donut chart animation
export function useDonutAnimation(percentages: number[], delay: number = 0.5) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current) {
      const [p1, p2, p3] = percentages;
      
      gsap.fromTo(
        ref.current,
        {
          background: `conic-gradient(
            #4797B1 0% 0%, 
            #C5ECBE 0% 0%, 
            #f1f5f9 0% 100%
          )`,
        },
        {
          background: `conic-gradient(
            #4797B1 0% ${p1}%, 
            #C5ECBE ${p1}% ${p1 + p2}%, 
            #f1f5f9 ${p1 + p2}% 100%
          )`,
          duration: 1.2,
          delay,
          ease: "power2.out",
        }
      );
    }
  }, [percentages, delay]);

  return ref;
}

// Typing indicator animation
export function useTypingAnimation() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current) {
      const dots = ref.current.children;
      gsap.to(dots, {
        y: -5,
        stagger: 0.15,
        repeat: -1,
        yoyo: true,
        duration: 0.4,
        ease: "power1.inOut",
      });
    }
  }, []);

  return ref;
}
