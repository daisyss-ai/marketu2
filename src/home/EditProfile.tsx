'use client';
import { useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuthStore } from '../store/authStore';
import Header from '../components/layout/Header';
import { ChevronLeft, Camera, /* User, */ X } from 'lucide-react';
import { toast } from 'sonner';

interface UserProfile {
  id: string;
  full_name: string;
  avatar_url: string | null;
  banner_url: string | null;
  bio: string | null;
}

const EditProfile = () => {
  const router = useRouter();
  const authUser = useAuthStore((state) => state.user);
  const supabase = createClient();

  const [isHydrated, setIsHydrated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  // Form state
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [bannerRemoved, setBannerRemoved] = useState(false);

  // File input refs
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  // Initialize component
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // Fetch user profile on mount
  useEffect(() => {
    if (!isHydrated || !authUser?.id) return;

    const fetchUserProfile = async () => {
      try {
        const { data, error } = await supabase
          .from('users')
          .select('id, full_name, avatar_url, banner_url, bio')
          .eq('id', authUser.id)
          .single();

        if (error) throw error;

        if (data) {
          setUserProfile(data);
          setUsername(authUser.username || '');
          setBio(data.bio || '');
          setAvatarPreview(data.avatar_url);
          setBannerPreview(data.banner_url);
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
        toast.error('Erro ao carregar perfil');
      } finally {
        setFetching(false);
      }
    };

    fetchUserProfile();
  }, [isHydrated, authUser?.id, supabase]);

  // Handle avatar file change
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle banner file change
  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setBannerFile(file);
      setBannerRemoved(false);
      const reader = new FileReader();
      reader.onloadend = () => {
        setBannerPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Remove banner
  const handleRemoveBanner = () => {
    setBannerFile(null);
    setBannerRemoved(true);
    setBannerPreview(null);
    if (bannerInputRef.current) {
      bannerInputRef.current.value = '';
    }
  };

  // Get file extension
  const getFileExtension = (file: File): string => {
    return file.type.split('/')[1] || 'jpg';
  };

  // Upload file to Supabase Storage
  const uploadFile = async (
    file: File,
    bucket: string,
    path: string
  ): Promise<string | null> => {
    try {
      const { error } = await supabase.storage
        .from(bucket)
        .upload(path, file, { upsert: true });

      if (error) throw error;

      const {
        data: { publicUrl },
      } = supabase.storage.from(bucket).getPublicUrl(path);

      return publicUrl;
    } catch (error) {
      console.error('Upload error:', error);
      throw error;
    }
  };

  // Check if form has changes
  const hasChanges = (): boolean => {
    if (username !== (authUser?.username || '')) return true;
    if (bio !== (userProfile?.bio || '')) return true;
    if (avatarFile) return true;
    if (bannerFile) return true;
    if (bannerRemoved) return true;
    return false;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!authUser?.id) {
      toast.error('Usuário não autenticado');
      return;
    }

    if (!username.trim()) {
      toast.error('Username é obrigatório');
      return;
    }

    setLoading(true);

    try {
      let avatarUrl = userProfile?.avatar_url || null;
      let bannerUrl = userProfile?.banner_url || null;

      // Upload avatar if selected
      if (avatarFile) {
        const ext = getFileExtension(avatarFile);
        const path = `avatars/${authUser.id}/avatar.${ext}`;
        avatarUrl = await uploadFile(avatarFile, 'avatars', path);
      }

      // Upload banner if selected
      if (bannerFile) {
        const ext = getFileExtension(bannerFile);
        const path = `avatars/${authUser.id}/banner.${ext}`;
        bannerUrl = await uploadFile(bannerFile, 'avatars', path);
      }

      // Handle banner removal
      if (bannerRemoved) {
        bannerUrl = null;
      }

      // Update user profile
      const { error } = await supabase
        .from('users')
        .update({
          username: username.trim(),
          bio: bio.trim() || null,
          avatar_url: avatarUrl,
          banner_url: bannerUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('id', authUser.id);

      if (error) throw error;

      // Merge current user data with new values and update auth store
      const { login } = useAuthStore.getState();
      const currentUser = useAuthStore.getState().user;
      login({
        ...currentUser,
        id: currentUser?.id ?? authUser.id,
        username: username.trim() || null,
        avatar_url: avatarUrl ?? currentUser?.avatar_url ?? null,
        banner_url: bannerUrl ?? currentUser?.banner_url ?? null,
      });

      // Update localStorage directly to ensure profile page reads new values immediately
      if (typeof window !== 'undefined') {
        const updated = {
          ...currentUser,
          username: username.trim() || null,
          avatar_url: avatarUrl ?? currentUser?.avatar_url ?? null,
          banner_url: bannerUrl ?? currentUser?.banner_url ?? null,
        };
        window.localStorage.setItem('marketu_user', JSON.stringify(updated));
      }

      toast.success('Perfil atualizado!');
      router.push('/profile');
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast.error(error.message || 'Erro ao atualizar perfil');
    } finally {
      setLoading(false);
    }
  };

  if (!isHydrated) {
    return (
      <div className="bg-[#f8f7ff] min-h-screen">
        <Header />
        <div className="max-w-2xl mx-auto px-4 py-8 text-center text-gray-600">
          Carregando...
        </div>
      </div>
    );
  }

  if (!authUser) {
    return (
      <div>
        <Header />
        <div className="max-w-md mx-auto mt-12 p-6 bg-white rounded shadow text-center">
          <p className="text-gray-600 mb-4">Você não está autenticado.</p>
          <button
            onClick={() => router.push('/login')}
            className="bg-[#4B187C] text-white px-4 py-2 rounded hover:bg-[#3E1367]"
          >
            Fazer Login
          </button>
        </div>
      </div>
    );
  }

  if (fetching) {
    return (
      <div className="bg-[#f8f7ff] min-h-screen">
        <Header />
        <div className="max-w-2xl mx-auto px-4 py-8 text-center text-gray-600">
          Carregando perfil...
        </div>
      </div>
    );
  }

  // Get initials from full name
  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .slice(0, 2)
      .map((n) => n.charAt(0).toUpperCase())
      .join('');
  };

  return (
    <div className="bg-[#f8f7ff] min-h-screen">
      <Header />

      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Back button */}
        <button
          onClick={() => router.push('/profile')}
          className="flex items-center gap-2 text-[#4B187C] font-medium mb-6 hover:opacity-80 transition-opacity"
        >
          <ChevronLeft className="w-5 h-5" />
          Voltar ao Perfil
        </button>

        {/* Page title */}
        <h1 className="text-2xl font-bold text-gray-900 mb-8">Editar Perfil</h1>

        {/* Form container */}
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
        >
          {/* Banner section */}
          <div className="relative">
            {/* Banner image/gradient */}
            <div className="h-36 bg-gradient-to-r from-[#4B187C] to-[#6d28b0] overflow-hidden">
              {bannerPreview ? (
                <img
                  src={bannerPreview}
                  alt="Banner"
                  className="w-full h-full object-cover"
                />
              ) : null}
            </div>

            {/* Camera button — outside overflow-hidden div */}
            <button
              type="button"
              onClick={() => bannerInputRef.current?.click()}
              className="absolute bottom-2 right-2 z-20 bg-white/90 hover:bg-white p-2 rounded-full text-[#4B187C] transition-colors shadow-md"
              title="Alterar banner"
            >
              <Camera className="w-5 h-5" />
            </button>

            {/* Remove button — outside overflow-hidden div */}
            {(bannerPreview || userProfile?.banner_url) && !bannerRemoved && (
              <button
                type="button"
                onClick={handleRemoveBanner}
                className="absolute top-2 right-2 z-20 bg-white/90 hover:bg-white p-2 rounded-full text-red-500 transition-colors shadow-md"
                title="Remover banner"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Hidden file inputs */}
          <input
            ref={bannerInputRef}
            type="file"
            accept="image/*"
            onChange={handleBannerChange}
            className="hidden"
          />
          <input
            ref={avatarInputRef}
            type="file"
            accept="image/*"
            onChange={handleAvatarChange}
            className="hidden"
          />

          {/* Avatar section */}
          <div className="px-6 -mt-12 relative z-10 mb-6">
            <div className="relative w-fit">
              <div className="w-24 h-24 rounded-full border-4 border-white bg-[#EDE7FF] text-[#4B187C] flex items-center justify-center text-2xl font-bold overflow-hidden shadow-lg">
                {avatarPreview ? (
                  <img
                    src={avatarPreview}
                    alt="Avatar preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  getInitials(userProfile?.full_name || '')
                )}
              </div>

              {/* Camera button for avatar */}
              <button
                type="button"
                onClick={() => avatarInputRef.current?.click()}
                className="absolute bottom-0 right-0 bg-white/90 hover:bg-white p-2 rounded-full text-[#4B187C] transition-colors shadow-md"
                title="Alterar avatar"
              >
                <Camera className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Form fields */}
          <div className="px-6 pb-6">
            {/* Full name field (read-only) */}
            <div className="mb-6">
              <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-2">
                Nome Completo
              </label>
              <input
                id="fullName"
                type="text"
                value={userProfile?.full_name || ''}
                readOnly
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed"
              />
            </div>

            {/* Username field */}
            <div className="mb-6">
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                Username
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value.slice(0, 50))}
                maxLength={50}
                required
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4B187C] focus:border-transparent transition-all"
                placeholder="Seu username"
              />
              <p className="text-xs text-gray-500 mt-1">{username.length}/50</p>
            </div>

            {/* Bio field */}
            <div className="mb-6">
              <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-2">
                Biografia
              </label>
              <textarea
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value.slice(0, 300))}
                maxLength={300}
                rows={4}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4B187C] focus:border-transparent transition-all resize-none"
                placeholder="Conta algo sobre ti..."
              />
              <p className="text-xs text-gray-500 mt-1">{bio.length}/300</p>
            </div>

            {/* Save button */}
            <button
              type="submit"
              disabled={loading || !hasChanges()}
              className="w-full bg-[#4B187C] text-white py-3 rounded-xl font-semibold hover:bg-[#3E1367] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Guardando...
                </>
              ) : (
                'Guardar Alterações'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProfile;
