'use client';

import React, { forwardRef, useImperativeHandle, useState } from 'react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export interface MentionSuggestion {
  id: string;
  label: string;
  name: string | null;
  email: string;
  image: string | null;
}

export interface MentionListProps {
  items: MentionSuggestion[];
  command: (item: MentionSuggestion) => void;
}

export interface MentionListRef {
  onKeyDown: (props: { event: KeyboardEvent }) => boolean;
}

export const MentionList = forwardRef<MentionListRef, MentionListProps>((props, ref) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const itemsLength = props.items.length;
  const clampedIndex = itemsLength > 0 ? Math.min(selectedIndex, itemsLength - 1) : 0;

  const selectItem = (index: number) => {
    const item = props.items[index];
    if (item) {
      props.command(item);
    }
  };

  const upHandler = () => {
    if (itemsLength === 0) return;
    setSelectedIndex((clampedIndex + itemsLength - 1) % itemsLength);
  };

  const downHandler = () => {
    if (itemsLength === 0) return;
    setSelectedIndex((clampedIndex + 1) % itemsLength);
  };

  const enterHandler = () => {
    selectItem(clampedIndex);
  };

  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }) => {
      if (event.key === 'ArrowUp') {
        upHandler();
        return true;
      }

      if (event.key === 'ArrowDown') {
        downHandler();
        return true;
      }

      if (event.key === 'Enter') {
        enterHandler();
        return true;
      }

      return false;
    },
  }));

  if (props.items.length === 0) {
    return (
      <div className="bg-popover border-border text-muted-foreground rounded-md border p-2 text-sm shadow-lg">
        No users found
      </div>
    );
  }

  return (
    <div className="bg-popover border-border overflow-hidden rounded-md border shadow-lg">
      {props.items.map((item, index) => (
        <button
          type="button"
          key={item.id}
          className={cn(
            'flex w-full items-center gap-3 px-3 py-2 text-left transition-colors',
            'hover:bg-accent focus:bg-accent focus:outline-none',
            index === clampedIndex && 'bg-accent'
          )}
          onClick={() => selectItem(index)}
        >
          <Avatar className="h-8 w-8 flex-shrink-0">
            <AvatarImage src={item.image || undefined} alt={item.name || item.email} />
            <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
              {(item.name || item.email)[0].toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-medium">{item.name || item.email}</div>
            {item.name && (
              <div className="text-muted-foreground truncate text-xs">{item.email}</div>
            )}
          </div>
        </button>
      ))}
    </div>
  );
});

MentionList.displayName = 'MentionList';
