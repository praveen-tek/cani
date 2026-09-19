"use client";

import React, { useEffect, useRef, useState } from "react";

interface MasonryProps<T> {
  items: T[];
  getKey: (item: T, index: number) => string;
  renderItem: (item: T, index: number) => React.ReactNode;
  className?: string;
}

export function Masonry<T>({
  items,
  getKey,
  renderItem,
  className,
}: MasonryProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [columnCount, setColumnCount] = useState<number>(3);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const updateColumns = (width: number) => {
      if (width < 640) {
        setColumnCount(1);
      } else if (width < 1024) {
        setColumnCount(2);
      } else if (width < 1536) {
        setColumnCount(3);
      } else {
        setColumnCount(4);
      }
    };

    updateColumns(el.getBoundingClientRect().width);

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentRect) {
          updateColumns(entry.contentRect.width);
        }
      }
    });

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const columns: Array<Array<{ item: T; originalIndex: number }>> = Array.from(
    { length: columnCount },
    () => []
  );

  items.forEach((item, index) => {
    const colIndex = index % columnCount;
    columns[colIndex].push({ item, originalIndex: index });
  });

  return (
    <div ref={containerRef} className={`flex items-start gap-4 w-full ${className || ""}`}>
      {columns.map((col, colIdx) => (
        <div key={colIdx} className="flex-1 flex flex-col gap-4 min-w-0">
          {col.map(({ item, originalIndex }) => (
            <React.Fragment key={getKey(item, originalIndex)}>
              {renderItem(item, originalIndex)}
            </React.Fragment>
          ))}
        </div>
      ))}
    </div>
  );
}
