'use client';

import Link from 'next/link';
import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { api, message } from '@/lib/api';
import { RequireAuth, useAuth } from '../components/AuthProvider';
import { SiteShell } from '../components/SiteShell';
import { ProfileBanner } from '../components/ProfileBanner';
import { Avatar, Back, Feedback, PageTitle } from '../components/ui';
import type { User } from '@/lib/types';
import styles from './ProfileEditor.module.css';

type ImageSelection = {
  file: File | null;
  url: string | null;
  removed: boolean;
};

function useProfileImage(initialUrl?: string | null) {
  const [image, setImage] = useState<ImageSelection>({
    file: null,
    url: initialUrl || null,
    removed: false,
  });
  useEffect(
    () => () => {
      if (image.file && image.url) URL.revokeObjectURL(image.url);
    },
    [image.file, image.url],
  );
  return [image, setImage] as const;
}

export default function ProfileEditor() {
  return (
    <SiteShell>
      <RequireAuth>
        <EditorContent />
      </RequireAuth>
    </SiteShell>
  );
}

function EditorContent() {
  const { user, refresh } = useAuth();
  const router = useRouter();
  const [name, setName] = useState(user!.displayName || user!.username);
  const [bio, setBio] = useState(user!.bio || '');
  const [avatar, setAvatar] = useProfileImage(user!.avatarUrl);
  const [banner, setBanner] = useProfileImage(user!.bannerUrl);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const preview: User = {
    ...user!,
    displayName: name.trim() || user!.username,
    bio,
    avatarUrl: avatar.url,
    bannerUrl: banner.url,
  };

  function chooseImage(
    event: ChangeEvent<HTMLInputElement>,
    setImage: (image: ImageSelection) => void,
  ) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
      setError('Escolha uma imagem PNG, JPG ou WebP.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Cada imagem deve ter até 5 MB.');
      return;
    }
    setError('');
    setImage({ file, url: URL.createObjectURL(file), removed: false });
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (name.trim().length < 2) {
      setError('Informe um nome com pelo menos 2 caracteres.');
      return;
    }
    const data = new FormData();
    data.set('displayName', name.trim());
    data.set('bio', bio.trim());
    if (avatar.file) data.set('avatar', avatar.file);
    if (banner.file) data.set('banner', banner.file);
    if (avatar.removed) data.set('removeAvatar', 'true');
    if (banner.removed) data.set('removeBanner', 'true');
    setBusy(true);
    setError('');
    try {
      await api('/users/me', { method: 'PATCH', body: data });
      await refresh();
      router.push('/minha-area');
    } catch (error) {
      setError(message(error));
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Back href="/minha-area">Voltar para minha área</Back>
      <PageTitle
        title="Editar perfil"
        description="Adicione sua foto, escolha um banner e conte um pouco sobre você."
      />
      <div className={styles.columns}>
        <form className="panel" onSubmit={submit}>
          <h2>Informações do perfil</h2>
          <Feedback error={error} />
          <fieldset className={styles.fields} disabled={busy}>
            <div className="field">
              <label htmlFor="profile-name">Nome de exibição *</label>
              <input
                id="profile-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                minLength={2}
                maxLength={80}
                autoComplete="name"
              />
            </div>
            <div className="field">
              <label htmlFor="profile-bio">Descrição</label>
              <textarea
                id="profile-bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                maxLength={500}
                rows={5}
                placeholder="Seus filmes favoritos, sua relação com o cinema…"
                aria-describedby="profile-bio-hint"
              />
              <small className="muted" id="profile-bio-hint">
                {bio.length}/500 caracteres
              </small>
            </div>
            <ImageControl
              kind="avatar"
              title="Foto de perfil"
              image={avatar}
              disabled={busy}
              onChange={(e) => chooseImage(e, setAvatar)}
              onRemove={() =>
                setAvatar({ file: null, url: null, removed: true })
              }
            />
            <ImageControl
              kind="banner"
              title="Banner"
              image={banner}
              disabled={busy}
              onChange={(e) => chooseImage(e, setBanner)}
              onRemove={() =>
                setBanner({ file: null, url: null, removed: true })
              }
            />
          </fieldset>
          <div className="form-actions">
            <button className="button primary" disabled={busy}>
              {busy ? 'Salvando…' : 'Salvar alterações'}
            </button>
            <Link className="button" href="/minha-area">
              Cancelar
            </Link>
          </div>
        </form>
        <aside className={styles.previewColumn} aria-label="Prévia do perfil">
          <h2>Prévia do seu perfil</h2>
          <div className={'panel ' + styles.preview}>
            <ProfileBanner src={banner.url} />
            <div className={styles.previewIdentity}>
              <Avatar user={preview} large />
              <h3>{preview.displayName}</h3>
              <small className="muted">@{user!.username}</small>
              <p className={styles.bio}>
                {bio || 'Sua descrição aparecerá aqui.'}
              </p>
            </div>
          </div>
          <p className="muted">
            Confira como suas alterações vão aparecer. Elas serão aplicadas ao
            salvar.
          </p>
        </aside>
      </div>
    </>
  );
}

function ImageControl({
  kind,
  title,
  image,
  disabled,
  onChange,
  onRemove,
}: {
  kind: 'avatar' | 'banner';
  title: string;
  image: ImageSelection;
  disabled: boolean;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onRemove: () => void;
}) {
  const label = kind === 'avatar' ? 'Escolher foto' : 'Escolher banner';
  return (
    <div className={styles.imageControl}>
      <h3>{title}</h3>
      <p className="muted">
        {kind === 'avatar'
          ? 'Sua foto será exibida em formato circular.'
          : 'Imagens horizontais ficam melhores como banner.'}{' '}
        PNG, JPG ou WebP, até 5 MB.
      </p>
      <div className={styles.imageActions}>
        <label className={'button ' + styles.fileButton}>
          {label}
          <input
            type="file"
            name={kind}
            aria-label={label}
            accept="image/png,image/jpeg,image/webp"
            disabled={disabled}
            onChange={onChange}
          />
        </label>
        {image.url && (
          <button
            type="button"
            className="text-button destructive"
            disabled={disabled}
            onClick={onRemove}
          >
            {kind === 'avatar' ? 'Remover foto' : 'Remover banner'}
          </button>
        )}
      </div>
      {image.file && (
        <small className={styles.filename}>{image.file.name}</small>
      )}
    </div>
  );
}
