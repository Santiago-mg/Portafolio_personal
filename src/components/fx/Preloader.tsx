'use client';

import { useEffect } from 'react';
import { useSite } from '@/components/site/SiteProvider';

/** STUB — the fx agent replaces it. Must call finishBoot() when the page is uncovered. */
export default function Preloader() {
  const { finishBoot } = useSite();
  useEffect(() => finishBoot(), [finishBoot]);
  return null;
}
