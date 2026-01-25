import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { FolderUp, FilePlus2 } from 'lucide-react';
import { TooltipButton } from '@/components/shared/ui/tooltip-button';

interface UploadButtonProps {
  variant: 'files' | 'directory';
  onUpload: (files: FileList) => void;
  disabled?: boolean;
}

export const UploadButton: React.FC<UploadButtonProps> = ({
  variant,
  onUpload,
  disabled = false,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleClick = () => {
    inputRef.current?.click();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      onUpload(files);
      e.target.value = '';
    }
  };

  const isDirectory = variant === 'directory';

  return (
    <TooltipButton
      button={
        <Button
          variant="ghost"
          size="icon"
          onClick={handleClick}
          disabled={disabled}
          className="h-7 w-7"
        >
          {isDirectory ? <FolderUp className="h-4 w-4" /> : <FilePlus2 className="h-4 w-4" />}
        </Button>
      }
      tooltipText={isDirectory ? 'Upload folder' : 'Upload files'}
    >
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        onChange={handleChange}
        multiple={!isDirectory}
        accept=".md,.markdown"
        {...(isDirectory && {
          webkitdirectory: '',
          directory: '',
        })}
      />
    </TooltipButton>
  );
};
