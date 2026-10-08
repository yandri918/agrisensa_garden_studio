/**
 * AgriSensa Garden Studio — Dynamic Icon Renderer
 * Strictly renders Lucide SVG icons. No emojis anywhere in the UI.
 */

'use client';

import React from 'react';
import * as LucideIcons from 'lucide-react';

interface IconRendererProps {
  name: string;
  className?: string;
  size?: number;
  color?: string;
}

export function IconRenderer({ name, className = '', size = 18, color }: IconRendererProps) {
  // @ts-expect-error dynamic key indexing into LucideIcons
  const IconComponent = LucideIcons[name] || LucideIcons.Box;

  return <IconComponent className={className} size={size} color={color} />;
}
