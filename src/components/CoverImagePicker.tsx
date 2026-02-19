'use client';

import React, { useState } from 'react';
import { Image, X, Upload, Link as LinkIcon, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

interface CoverImagePickerProps {
  currentImage?: string | null;
  onImageChange: (imageUrl: string | null) => void;
  disabled?: boolean;
}

// Unsplash collection of beautiful images (would need API key in production)
const PRESET_IMAGES = [
  'https://images.unsplash.com/photo-1557683316-973673baf926',
  'https://images.unsplash.com/photo-1579546929518-9e396f3cc809',
  'https://images.unsplash.com/photo-1506905925346-21bda4d32df4',
  'https://images.unsplash.com/photo-1519681393784-d120267933ba',
  'https://images.unsplash.com/photo-1533460004989-cef01064af7e',
  'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b',
  'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05',
  'https://images.unsplash.com/photo-1441974231531-c6227db76b6e',
  'https://images.unsplash.com/photo-1472214103451-9374bd1c798e',
  'https://images.unsplash.com/photo-1469474968028-56623f02e42e',
  'https://images.unsplash.com/photo-1426604966848-d7adac402bff',
  'https://images.unsplash.com/photo-1475924156734-496f6cac6ec1',
];

export function CoverImagePicker({
  currentImage,
  onImageChange,
  disabled = false,
}: CoverImagePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleSelectPreset = (url: string) => {
    onImageChange(url);
    setIsOpen(false);
  };

  const handleUrlSubmit = () => {
    if (urlInput.trim()) {
      onImageChange(urlInput.trim());
      setUrlInput('');
      setIsOpen(false);
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onImageChange(null);
  };

  return (
    <div className="relative group">
      {currentImage ? (
        <div className="relative w-full h-48 rounded-lg overflow-hidden">
          <img
            src={currentImage}
            alt="Cover"
            className="w-full h-full object-cover"
          />
          {!disabled && (
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <Popover open={isOpen} onOpenChange={setIsOpen}>
                <PopoverTrigger asChild>
                  <Button variant="secondary" size="sm">
                    <Image className="h-4 w-4 mr-1" />
                    Change Cover
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-96" align="center">
                  <CoverPickerContent
                    onSelectPreset={handleSelectPreset}
                    urlInput={urlInput}
                    setUrlInput={setUrlInput}
                    handleUrlSubmit={handleUrlSubmit}
                    previewUrl={previewUrl}
                    setPreviewUrl={setPreviewUrl}
                  />
                </PopoverContent>
              </Popover>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleRemove}
              >
                <X className="h-4 w-4 mr-1" />
                Remove
              </Button>
            </div>
          )}
        </div>
      ) : (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="w-full h-12 border-dashed"
              disabled={disabled}
            >
              <Image className="h-4 w-4 mr-2" />
              Add Cover Image
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-96" align="start">
            <CoverPickerContent
              onSelectPreset={handleSelectPreset}
              urlInput={urlInput}
              setUrlInput={setUrlInput}
              handleUrlSubmit={handleUrlSubmit}
              previewUrl={previewUrl}
              setPreviewUrl={setPreviewUrl}
            />
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}

interface CoverPickerContentProps {
  onSelectPreset: (url: string) => void;
  urlInput: string;
  setUrlInput: (url: string) => void;
  handleUrlSubmit: () => void;
  previewUrl: string | null;
  setPreviewUrl: (url: string | null) => void;
}

function CoverPickerContent({
  onSelectPreset,
  urlInput,
  setUrlInput,
  handleUrlSubmit,
  previewUrl,
  setPreviewUrl,
}: CoverPickerContentProps) {
  return (
    <Tabs defaultValue="gallery" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="gallery">
          <Sparkles className="h-4 w-4 mr-1" />
          Gallery
        </TabsTrigger>
        <TabsTrigger value="url">
          <LinkIcon className="h-4 w-4 mr-1" />
          URL
        </TabsTrigger>
      </TabsList>

      <TabsContent value="gallery" className="space-y-3">
        <div className="grid grid-cols-3 gap-2 max-h-64 overflow-y-auto">
          {PRESET_IMAGES.map((url, index) => (
            <button
              key={index}
              onClick={() => onSelectPreset(url)}
              className={cn(
                'relative aspect-video rounded overflow-hidden',
                'border-2 border-transparent hover:border-primary',
                'transition-all focus:outline-none focus:ring-2 focus:ring-primary'
              )}
            >
              <img
                src={url}
                alt={`Preset ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          Images from Unsplash
        </p>
      </TabsContent>

      <TabsContent value="url" className="space-y-3">
        <div className="space-y-2">
          <Input
            placeholder="https://example.com/image.jpg"
            value={urlInput}
            onChange={(e) => {
              setUrlInput(e.target.value);
              setPreviewUrl(e.target.value);
            }}
            onKeyDown={(e) => e.key === 'Enter' && handleUrlSubmit()}
          />
          {previewUrl && (
            <div className="w-full aspect-video rounded overflow-hidden border">
              <img
                src={previewUrl}
                alt="Preview"
                className="w-full h-full object-cover"
                onError={() => setPreviewUrl(null)}
              />
            </div>
          )}
          <Button
            onClick={handleUrlSubmit}
            disabled={!urlInput.trim()}
            className="w-full"
          >
            Add Image
          </Button>
        </div>
      </TabsContent>
    </Tabs>
  );
}
