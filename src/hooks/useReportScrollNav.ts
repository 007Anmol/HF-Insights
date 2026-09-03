import { useCallback, useEffect, useRef, useState } from 'react';
import { LayoutChangeEvent, NativeScrollEvent, NativeSyntheticEvent, ScrollView } from 'react-native';

const NAV_OFFSET = 128;

export function useReportScrollNav(sectionIds: string[], contentSectionPaddingTop = 16) {
  const scrollRef = useRef<ScrollView>(null);
  const offsets = useRef<Record<string, number>>({});
  const headerHeight = useRef(0);
  const sectionRelativeY = useRef<Record<string, number>>({});
  const [activeSection, setActiveSection] = useState(sectionIds[0] || 'findings');

  const recomputeOffsets = useCallback(() => {
    const base = headerHeight.current + contentSectionPaddingTop;
    sectionIds.forEach((id) => {
      const sectionY = sectionRelativeY.current[id];
      if (sectionY !== undefined) {
        offsets.current[id] = base + sectionY;
      }
    });
  }, [sectionIds, contentSectionPaddingTop]);

  const setHeaderHeight = useCallback(
    (height: number) => {
      headerHeight.current = height;
      recomputeOffsets();
    },
    [recomputeOffsets],
  );

  const registerSection = useCallback(
    (id: string) => (event: LayoutChangeEvent) => {
      sectionRelativeY.current[id] = event.nativeEvent.layout.y;
      recomputeOffsets();
    },
    [recomputeOffsets],
  );

  useEffect(() => {
    if (sectionIds.length === 0) return;
    if (!sectionIds.includes(activeSection)) {
      setActiveSection(sectionIds[0]);
    }
  }, [sectionIds, activeSection]);

  useEffect(() => {
    recomputeOffsets();
  }, [sectionIds, recomputeOffsets]);

  const scrollToSection = useCallback((id: string) => {
    setActiveSection(id);
    const y = offsets.current[id];
    if (y === undefined) return;
    scrollRef.current?.scrollTo({ y: Math.max(0, y - NAV_OFFSET), animated: true });
  }, []);

  const onScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (sectionIds.length === 0) return;
      const scrollY = event.nativeEvent.contentOffset.y;
      let current = sectionIds[0];
      for (const id of sectionIds) {
        const offset = offsets.current[id];
        if (offset !== undefined && scrollY >= offset - NAV_OFFSET - 28) {
          current = id;
        }
      }
      setActiveSection(current);
    },
    [sectionIds],
  );

  return {
    scrollRef,
    activeSection,
    setHeaderHeight,
    registerSection,
    scrollToSection,
    onScroll,
  };
}
