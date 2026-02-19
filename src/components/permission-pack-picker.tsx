'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronUp, Info, AlertTriangle } from 'lucide-react';
import {
  PERMISSION_PACK,
  PERMISSION_PACK_DEFINITIONS,
  expandPermissionPacks,
  getSelectedPacks,
  type PermissionPack,
  type WorkspacePermission,
  WORKSPACE_PERMISSION_OPTIONS,
} from '@/lib/workspace-permission-definitions';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface PermissionPackPickerProps {
  selectedPermissions: string[];
  onChange: (permissions: string[]) => void;
  availablePermissions?: WorkspacePermission[];
  isOwner?: boolean;
  className?: string;
}

const COLOR_CLASSES: Record<string, { border: string; bg: string; text: string; badge: string }> = {
  blue: {
    border: 'border-blue-500/30',
    bg: 'bg-blue-500/10 hover:bg-blue-500/20',
    text: 'text-blue-400',
    badge: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  },
  purple: {
    border: 'border-purple-500/30',
    bg: 'bg-purple-500/10 hover:bg-purple-500/20',
    text: 'text-purple-400',
    badge: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  },
  green: {
    border: 'border-green-500/30',
    bg: 'bg-green-500/10 hover:bg-green-500/20',
    text: 'text-green-400',
    badge: 'bg-green-500/20 text-green-400 border-green-500/30',
  },
  orange: {
    border: 'border-orange-500/30',
    bg: 'bg-orange-500/10 hover:bg-orange-500/20',
    text: 'text-orange-400',
    badge: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  },
  amber: {
    border: 'border-amber-500/30',
    bg: 'bg-amber-500/10 hover:bg-amber-500/20',
    text: 'text-amber-400',
    badge: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  },
  slate: {
    border: 'border-slate-500/30',
    bg: 'bg-slate-500/10 hover:bg-slate-500/20',
    text: 'text-slate-400',
    badge: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
  },
};

export function PermissionPackPicker({
  selectedPermissions,
  onChange,
  availablePermissions,
  isOwner = false,
  className = '',
}: PermissionPackPickerProps) {
  const [expandedPack, setExpandedPack] = useState<PermissionPack | null>(null);

  // Convert permissions array to WorkspacePermission[] for comparison
  const currentPermissions = expandPermissionPacks(selectedPermissions);
  const selectedPacks = getSelectedPacks(currentPermissions);

  // Filter packs based on available permissions
  const availablePacks = isOwner
    ? PERMISSION_PACK_DEFINITIONS
    : (PERMISSION_PACK_DEFINITIONS.map((pack) => {
        if (!availablePermissions) return pack;

        // Filter pack permissions to only those available to current user
        const availablePerms = pack.permissions.filter((perm) =>
          availablePermissions.includes(perm)
        );

        return availablePerms.length > 0
          ? {
              ...pack,
              permissions: availablePerms,
              isPartial: availablePerms.length < pack.permissions.length,
            }
          : null;
      }).filter(Boolean) as typeof PERMISSION_PACK_DEFINITIONS);

  const handlePackToggle = (packId: PermissionPack) => {
    const pack = availablePacks.find((p) => p.id === packId);
    if (!pack) return;

    const currentSet = new Set(currentPermissions);
    const isSelected = selectedPacks.includes(packId);

    if (isSelected) {
      // Remove all permissions from this pack
      pack.permissions.forEach((perm) => currentSet.delete(perm));

      // If toggling off View Pack directly, allow it only when no non-view packs remain selected.
      if (packId === PERMISSION_PACK.VIEW) {
        const remainingNonViewSelected = selectedPacks.some(
          (selectedPackId) => selectedPackId !== PERMISSION_PACK.VIEW
        );

        if (remainingNonViewSelected) {
          const viewPack = PERMISSION_PACK_DEFINITIONS.find((p) => p.id === PERMISSION_PACK.VIEW);
          viewPack?.permissions.forEach((perm) => currentSet.add(perm));
        }
      }
    } else {
      // Add all permissions from this pack
      pack.permissions.forEach((perm) => currentSet.add(perm));

      // Professional dependency rule:
      // selecting any non-view pack auto-adds full View Pack permissions.
      if (packId !== PERMISSION_PACK.VIEW) {
        const viewPack = PERMISSION_PACK_DEFINITIONS.find((p) => p.id === PERMISSION_PACK.VIEW);
        viewPack?.permissions.forEach((perm) => currentSet.add(perm));
      }
    }

    onChange(Array.from(currentSet));
  };

  const toggleExpanded = (packId: PermissionPack) => {
    setExpandedPack(expandedPack === packId ? null : packId);
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center gap-2 rounded border border-purple-500/20 bg-purple-500/5 px-3 py-2 text-xs text-slate-400">
        <Info className="h-3.5 w-3.5 text-purple-400" />
        <span>Select permission packs. Click to expand details.</span>
      </div>

      {/* Grid Layout - Responsive with better spacing */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {availablePacks.map((pack) => {
          const isSelected = selectedPacks.includes(pack.id);
          const isExpanded = expandedPack === pack.id;
          const colors = COLOR_CLASSES[pack.color] || COLOR_CLASSES['slate'];
          const isPartial = 'isPartial' in pack && pack.isPartial;

          return (
            <div
              key={pack.id}
              className={`relative rounded-lg border transition-all ${
                isSelected
                  ? `${colors.border} ${colors.bg}`
                  : 'border-slate-700/40 bg-slate-900/30 hover:border-slate-600/60 hover:bg-slate-900/50'
              }`}
            >
              {/* Compact Card Content */}
              <div className="p-4">
                <div className="flex items-start gap-3">
                  {/* Icon */}
                  <span className="text-2xl leading-none">{pack.icon}</span>

                  {/* Title + Badge */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <h3
                        className={`text-sm leading-tight font-semibold ${
                          isSelected ? 'text-white' : 'text-slate-300'
                        }`}
                      >
                        {pack.name}
                      </h3>
                      <Checkbox
                        id={pack.id}
                        checked={isSelected}
                        onCheckedChange={() => handlePackToggle(pack.id)}
                        className="border-white/20 data-[state=checked]:border-purple-500 data-[state=checked]:bg-purple-500"
                      />
                    </div>

                    {/* Compact Badge Row */}
                    <div className="mt-2 flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className={`px-2 py-0.5 text-xs ${isSelected ? colors.badge : 'border-slate-600/50 bg-slate-800/30 text-slate-500'}`}
                      >
                        {pack.permissions.length} perm{pack.permissions.length !== 1 ? 's' : ''}
                      </Badge>
                      {isPartial ? (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Badge
                                variant="outline"
                                className="border-yellow-500/30 bg-yellow-500/10 px-2 py-0.5 text-xs text-yellow-400"
                              >
                                Limited
                              </Badge>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="max-w-xs text-xs">Limited by your permissions</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      ) : null}
                    </div>

                    {/* Brief description - only show when not selected */}
                    {!isSelected ? (
                      <p className="mt-2 text-xs leading-snug text-slate-500">{pack.description}</p>
                    ) : null}
                  </div>
                </div>
              </div>

              {/* Expandable Details - Compact */}
              {isSelected && (
                <div className="border-t border-white/5">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleExpanded(pack.id)}
                    className="h-8 w-full rounded-none text-xs text-slate-500 hover:bg-white/5 hover:text-slate-300"
                  >
                    {isExpanded ? (
                      <>
                        <ChevronUp className="mr-1 h-3 w-3" />
                        Hide Details
                      </>
                    ) : (
                      <>
                        <ChevronDown className="mr-1 h-3 w-3" />
                        View Details
                      </>
                    )}
                  </Button>
                  {isExpanded && (
                    <div className="max-h-48 space-y-2 overflow-y-auto border-t border-white/5 bg-black/20 p-3">
                      {pack.permissions.map((permId) => {
                        const permOption = WORKSPACE_PERMISSION_OPTIONS.find(
                          (p) => p.id === permId
                        );
                        if (!permOption) return null;

                        return (
                          <div key={permId} className="flex items-start gap-2 text-xs">
                            <div
                              className={`mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full ${colors.text.replace('text-', 'bg-')}`}
                            />
                            <div className="flex-1 leading-snug">
                              <span className="font-medium text-slate-200">{permOption.label}</span>
                              <p className="mt-0.5 text-slate-500">{permOption.description}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Warning */}
      {selectedPacks.length === 0 && (
        <div className="flex items-center gap-2 rounded border border-yellow-500/30 bg-yellow-500/5 px-3 py-2">
          <AlertTriangle className="h-4 w-4 text-yellow-400" />
          <p className="text-xs text-yellow-400">Select at least one pack</p>
        </div>
      )}

      {/* Summary */}
      {selectedPacks.length > 0 && (
        <div className="flex items-center justify-between gap-4 rounded border border-purple-500/20 bg-purple-500/5 px-3 py-2.5">
          <div className="flex flex-wrap items-center gap-2">
            {selectedPacks.map((packId) => {
              const pack = availablePacks.find((p) => p.id === packId);
              if (!pack) return null;
              const colors = COLOR_CLASSES[pack.color] || COLOR_CLASSES['slate'];

              return (
                <Badge
                  key={packId}
                  variant="outline"
                  className={`${colors.badge} px-2 py-0.5 text-xs`}
                >
                  {pack.icon} {pack.name}
                </Badge>
              );
            })}
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="font-semibold text-purple-400">{currentPermissions.length}</span>
            <span>total</span>
          </div>
        </div>
      )}
    </div>
  );
}
