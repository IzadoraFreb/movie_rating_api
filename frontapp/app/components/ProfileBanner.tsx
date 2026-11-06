'use client';
/* eslint-disable @next/next/no-img-element */
import { useState } from 'react';

export function ProfileBanner({ src }: { src?: string | null }) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  return (
    <div className="profile-banner">
      {src && failedUrl !== src ? (
        <img
          src={src}
          alt="Banner do perfil"
          onError={() => setFailedUrl(src)}
        />
      ) : (
        <span>Seu perfil, do seu jeito.</span>
      )}
    </div>
  );
}
