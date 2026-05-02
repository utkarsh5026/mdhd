import { useState } from 'react';

import { cn } from '@/lib/utils';

export interface AvatarProps {
  name: string;
  src?: string | null;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  referrerPolicy?: React.ImgHTMLAttributes<HTMLImageElement>['referrerPolicy'];
}

const sizeClasses = {
  sm: 'h-6 w-6 text-[10px]',
  md: 'h-8 w-8 text-xs',
  lg: 'h-10 w-10 text-sm',
};

function getInitials(name: string): string {
  return name
    .split(/[\s@]/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0].toUpperCase())
    .join('');
}

const Avatar: React.FC<AvatarProps> = ({ name, src, size = 'sm', className, referrerPolicy }) => {
  const [imgFailed, setImgFailed] = useState(false);
  const initials = getInitials(name);
  const showImage = src && !imgFailed;

  return (
    <div
      className={cn(
        'rounded-full overflow-hidden shrink-0 bg-primary flex items-center justify-center',
        sizeClasses[size],
        className
      )}
    >
      {showImage ? (
        <img
          src={src}
          alt={name}
          className="h-full w-full object-cover"
          referrerPolicy={referrerPolicy}
          onError={() => setImgFailed(true)}
        />
      ) : (
        <span className="font-semibold text-primary-foreground select-none tracking-wide">
          {initials}
        </span>
      )}
    </div>
  );
};

Avatar.displayName = 'Avatar';
export default Avatar;
