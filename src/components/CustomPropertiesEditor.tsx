'use client';

import React, { useState } from 'react';
import { Plus, X, Edit2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export type PropertyValue = string | number | boolean | Date | null;

export interface CustomProperty {
  key: string;
  value: PropertyValue;
  type: 'text' | 'number' | 'boolean' | 'date' | 'select';
  options?: string[]; // For select type
}

interface CustomPropertiesEditorProps {
  properties: Record<string, PropertyValue>;
  onPropertiesChange: (properties: Record<string, PropertyValue>) => void;
  disabled?: boolean;
}

export function CustomPropertiesEditor({
  properties = {},
  onPropertiesChange,
  disabled = false,
}: CustomPropertiesEditorProps) {
  const [isAddingProperty, setIsAddingProperty] = useState(false);
  const [newKey, setNewKey] = useState('');
  const [newType, setNewType] = useState<CustomProperty['type']>('text');
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>('');

  const propertyEntries = Object.entries(properties);

  const handleAddProperty = () => {
    if (!newKey.trim()) return;

    const defaultValue = getDefaultValueForType(newType);
    const updatedProperties = {
      ...properties,
      [newKey]: defaultValue,
    };

    onPropertiesChange(updatedProperties);
    setNewKey('');
    setNewType('text');
    setIsAddingProperty(false);
  };

  const handleUpdateProperty = (key: string) => {
    if (editValue.trim() === '') return;

    const updatedProperties = {
      ...properties,
      [key]: parseValueByType(editValue, typeof properties[key]),
    };

    onPropertiesChange(updatedProperties);
    setEditingKey(null);
    setEditValue('');
  };

  const handleDeleteProperty = (key: string) => {
    const { [key]: _, ...rest } = properties;
    onPropertiesChange(rest);
  };

  const startEditing = (key: string, value: PropertyValue) => {
    setEditingKey(key);
    if (value instanceof Date) {
      setEditValue(value.toISOString());
    } else {
      setEditValue(String(value || ''));
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Custom Properties</h3>
        {!disabled && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsAddingProperty(true)}
            className="h-7"
          >
            <Plus className="mr-1 h-3 w-3" />
            Add Property
          </Button>
        )}
      </div>

      {/* Existing Properties */}
      <div className="space-y-2">
        {propertyEntries.length === 0 && !isAddingProperty ? (
          <p className="text-muted-foreground py-4 text-center text-sm">No custom properties yet</p>
        ) : (
          propertyEntries.map(([key, value]) => (
            <div key={key} className="bg-card flex items-center gap-2 rounded-lg border p-2">
              <div className="min-w-0 flex-1">
                <div className="text-muted-foreground mb-0.5 text-xs font-medium">{key}</div>
                {editingKey === key ? (
                  <Input
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleUpdateProperty(key);
                      if (e.key === 'Escape') {
                        setEditingKey(null);
                        setEditValue('');
                      }
                    }}
                    className="h-7"
                    autoFocus
                  />
                ) : (
                  <div className="truncate text-sm">{formatPropertyValue(value)}</div>
                )}
              </div>

              {!disabled && (
                <div className="flex items-center gap-1">
                  {editingKey === key ? (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleUpdateProperty(key)}
                        className="h-7 w-7 p-0"
                      >
                        <Check className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingKey(null);
                          setEditValue('');
                        }}
                        className="h-7 w-7 p-0"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => startEditing(key, value)}
                        className="h-7 w-7 p-0"
                      >
                        <Edit2 className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteProperty(key)}
                        className="text-destructive h-7 w-7 p-0"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Add New Property Form */}
      {isAddingProperty && (
        <div className="bg-muted space-y-3 rounded-lg border p-3">
          <Input
            placeholder="Property name..."
            value={newKey}
            onChange={(e) => setNewKey(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddProperty()}
            autoFocus
          />

          <Select
            value={newType}
            onValueChange={(value) => setNewType(value as CustomProperty['type'])}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="text">Text</SelectItem>
              <SelectItem value="number">Number</SelectItem>
              <SelectItem value="boolean">Yes/No</SelectItem>
              <SelectItem value="date">Date</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setIsAddingProperty(false);
                setNewKey('');
              }}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleAddProperty}
              disabled={!newKey.trim()}
              className="flex-1"
            >
              Add
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// Compact view for displaying properties
export function CustomPropertiesDisplay({
  properties,
}: {
  properties: Record<string, PropertyValue>;
}) {
  const entries = Object.entries(properties);

  if (entries.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {entries.map(([key, value]) => (
        <Badge key={key} variant="outline" className="gap-1">
          <span className="text-muted-foreground text-xs">{key}:</span>
          <span className="text-xs">{formatPropertyValue(value)}</span>
        </Badge>
      ))}
    </div>
  );
}

// Helper functions
function getDefaultValueForType(type: CustomProperty['type']): PropertyValue {
  switch (type) {
    case 'text':
      return '';
    case 'number':
      return 0;
    case 'boolean':
      return false;
    case 'date':
      return new Date().toISOString();
    default:
      return '';
  }
}

function parseValueByType(value: string, currentType: string): PropertyValue {
  if (currentType === 'number') return Number(value) || 0;
  if (currentType === 'boolean') return value === 'true';
  return value;
}

function formatPropertyValue(value: PropertyValue): string {
  if (value === null || value === undefined) return '-';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (typeof value === 'number') return value.toLocaleString();
  if (value instanceof Date) {
    return value.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }
  // Check if value is a date string
  if (typeof value === 'string' && value.match(/^\d{4}-\d{2}-\d{2}/)) {
    return new Date(value).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }
  return String(value);
}
