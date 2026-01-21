import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { File, FolderUp } from 'lucide-react';

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
      // Reset input so the same files can be selected again
      e.target.value = '';
    }
  };

  const isDirectory = variant === 'directory';

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClick}
            disabled={disabled}
            className="h-7 w-7"
          >
            {isDirectory ? <FolderUp className="h-4 w-4" /> : <File className="h-4 w-4" />}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <p>{isDirectory ? 'Upload folder' : 'Upload files'}</p>
        </TooltipContent>
      </Tooltip>

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
    </TooltipProvider>
  );
};
