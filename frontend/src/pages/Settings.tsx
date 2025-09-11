import { useEffect, useRef, useState } from "react";
import { Layout, Header, Card, Button, Badge, Dialog } from "../components";
import { useAuth } from "../contexts/AuthContext";
import { apiService } from "../services/api";

type ThemeOption = 'light' | 'dark' | 'system';

export default function Settings() {
  const { user, isLoading, refreshUser } = useAuth();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [department, setDepartment] = useState("");
  const [phone, setPhone] = useState("");
  const [timezone, setTimezone] = useState("UTC");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [selectedTheme, setSelectedTheme] = useState<ThemeOption>(() => (localStorage.getItem("theme") as ThemeOption) || "system");
  const [savedTheme, setSavedTheme] = useState<ThemeOption>(() => (localStorage.getItem("theme") as ThemeOption) || "system");
  const [notifications, setNotifications] = useState(true);
  const [language, setLanguage] = useState("en");

  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [showErrorDialog, setShowErrorDialog] = useState(false);

  const getFriendlyError = (msg?: string | null) => {
    if (!msg) return 'Something went wrong. Please try again.';
    const lower = msg.toLowerCase();

    if (lower.includes('failed to fetch') || lower.includes('network') || lower.includes('net::')) {
      return 'Cannot reach the server. Check your internet and try again.';
    }

    if (lower.includes('unauthorized') || lower.includes('authentication') || lower.includes('401')) {
      return 'Your session has expired. Please sign in again.';
    }
    if (lower.includes('forbidden') || lower.includes('permission') || lower.includes('403')) {
      return 'You do not have permission to perform this action.';
    }

    if (lower.includes('too many requests') || lower.includes('429')) {
      return 'You’ve hit a rate limit. Please wait a moment and try again.';
    }

    if (lower.includes('not found') || lower.includes('404')) {
      return 'The requested resource was not found.';
    }

    if (lower.includes('conflict') || lower.includes('duplicate') || lower.includes('already exists') || lower.includes('409')) {
      return 'This conflicts with an existing record. Please review and try again.';
    }

    if (lower.includes('payload too large') || lower.includes('413') || lower.includes('file too large')) {
      return 'That file is too large. Please upload a smaller file.';
    }

    if (lower.includes('validation') || lower.includes('invalid') || lower.includes('bad request') || lower.includes('400')) {
      return 'Some details look invalid. Please review your input and try again.';
    }

    if (lower.includes('timeout') || lower.includes('504') || lower.includes('gateway')) {
      return 'The request took too long. Please try again shortly.';
    }

    if (lower.includes('server') || lower.includes('500')) {
      return 'The server had an issue. Please try again later.';
    }

    return msg.length > 200 ? `${msg.substring(0, 200)}…` : msg;
  };

  useEffect(() => {
    if (error) setShowErrorDialog(true);
  }, [error]);

  useEffect(() => {
    if (!user) return;
    setFirstName(user.firstName || "");
    setLastName(user.lastName || "");
    setJobTitle(user.profile?.jobTitle || "");
    setDepartment(user.profile?.department || "");
    setPhone(user.profile?.phone || "");
    setTimezone(user.profile?.timezone || "UTC");
    if (user.preferences) {
      setSelectedTheme((user.preferences.theme as ThemeOption) || (localStorage.getItem("theme") as ThemeOption) || "system");
      setSavedTheme((user.preferences.theme as ThemeOption) || (localStorage.getItem("theme") as ThemeOption) || "system");
      setNotifications(user.preferences.notifications ?? true);
      setLanguage(user.preferences.language || "en");
    }
  }, [user]);

  const clearBanners = () => { setMessage(null); setError(null); };

  const handleSaveProfile = async () => {
    if (!user) return;
    clearBanners();
    setSavingProfile(true);
    try {
      const res = await apiService.updateMyProfile({
        firstName,
        lastName,
        profile: { jobTitle, department, phone, timezone }
      });
      if (!res.success) throw new Error(res.message || 'Failed to update profile');
      await refreshUser();
      setMessage('Profile updated successfully');
    } catch (e: any) {
      setError(e instanceof Error ? e.message : 'Failed to update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      setError('New password and confirmation do not match');
      return;
    }
    clearBanners();
    setChangingPassword(true);
    try {
      const res = await apiService.changeMyPassword(currentPassword, newPassword);
      if (!res.success) throw new Error(res.message || 'Failed to change password');
      setMessage('Password changed successfully');
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
    } catch (e: any) {
      setError(e instanceof Error ? e.message : 'Failed to change password');
    } finally {
      setChangingPassword(false);
    }
  };

  const handleUploadAvatar = async (file: File) => {
    clearBanners();
    setUploadingAvatar(true);
    try {
      const allowed = ['image/jpeg','image/png','image/gif'];
      if (!allowed.includes(file.type)) {
        throw new Error('Please upload a JPG, PNG, or GIF image');
      }
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('Image too large. Max size is 5MB');
      }
      const res = await apiService.uploadAvatar(file);
      if (!res.success) throw new Error(res.message || 'Failed to upload avatar');
      await refreshUser();
      setMessage('Avatar updated successfully');
    } catch (e: any) {
      setError(e instanceof Error ? e.message : 'Failed to upload avatar');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const applyTheme = (theme: ThemeOption) => {
    const root = window.document.documentElement;
    if (theme === "light") {
      root.classList.remove("dark");
    } else if (theme === "dark") {
      root.classList.add("dark");
    } else {
      const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      if (isDark) {
        root.classList.add("dark");
      } else {
        root.classList.remove("dark");
      }
    }
  };

  const isSelected = (value: ThemeOption) => selectedTheme === value;

  useEffect(() => {
    applyTheme(selectedTheme);
    try { localStorage.setItem("theme", selectedTheme); } catch {}
    setSavedTheme(selectedTheme);
    window.dispatchEvent(new Event('themechange'));
    apiService.updatePreferences({ theme: selectedTheme }).catch((e: any) => {
      const msg = e instanceof Error ? e.message : 'Failed to save theme preference';
      setError(msg);
    });
    setJustSaved(true);
    const t = setTimeout(() => setJustSaved(false), 1200);
    return () => clearTimeout(t);
  }, [selectedTheme]);

  const initials = (fn?: string, ln?: string) => `${(fn||' ').charAt(0)}${(ln||' ').charAt(0)}`.toUpperCase();
  const avatarUrl = user?.avatar ? apiService.buildPublicUrl(user.avatar) : '';

  return (
    <>
    <Layout>
      <Header 
        title="Settings" 
        subtitle="Manage profile, security, and preferences"
      />
      <div className="px-4 sm:px-8 py-6 sm:py-8">
        <div className="max-w-5xl mx-auto space-y-8">
          {message && (
            <div className={`rounded-xl border px-4 py-3 ${message ? 'border-green-200 bg-green-50 text-green-700' : 'border-red-200 bg-red-50 text-red-700'}`}>
              {message}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 space-y-6">
              <Card>
                <div className="flex items-center gap-4">
                  <div className="relative">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="Avatar" className="w-20 h-20 rounded-full object-cover border" />
                    ) : (
                      <div className="w-20 h-20 rounded-full bg-gradient-to-r from-[#40B1DF] to-[#40B1DF] flex items-center justify-center text-white font-semibold text-xl shadow">
                        {initials(user?.firstName, user?.lastName)}
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-[#313F4E]">{user?.firstName} {user?.lastName}</p>
                    <p className="text-sm text-[#64748b]">{user?.email}</p>
                  </div>
                </div>
                <div className="mt-4 flex gap-3">
                  <Button variant={uploadingAvatar ? 'disabled' : 'accent'} onClick={() => fileInputRef.current?.click()}>
                    {uploadingAvatar ? 'Uploading...' : 'Upload Avatar'}
                  </Button>
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleUploadAvatar(f);
                  }} />
                </div>
              </Card>

              <Card>
                <p className="text-sm text-[#64748b]">Account Status</p>
                <div className="mt-2">
                  <Badge variant={user?.status === 'active' ? 'primary' : 'gray'}>{user?.status || 'unknown'}</Badge>
                </div>
              </Card>
            </div>

            <div className="lg:col-span-2 space-y-6">
              <Card>
                <h2 className="text-lg font-semibold text-[#313F4E]">Profile</h2>
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-[#64748b] mb-1">First name</label>
                    <input className="w-full rounded-lg border border-[#e2e8f0] px-3 py-2" value={firstName} onChange={e => setFirstName(e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-sm text-[#64748b] mb-1">Last name</label>
                    <input className="w-full rounded-lg border border-[#e2e8f0] px-3 py-2" value={lastName} onChange={e => setLastName(e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-sm text-[#64748b] mb-1">Job title</label>
                    <input className="w-full rounded-lg border border-[#e2e8f0] px-3 py-2" value={jobTitle} onChange={e => setJobTitle(e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-sm text-[#64748b] mb-1">Department</label>
                    <input className="w-full rounded-lg border border-[#e2e8f0] px-3 py-2" value={department} onChange={e => setDepartment(e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-sm text-[#64748b] mb-1">Phone</label>
                    <input className="w-full rounded-lg border border-[#e2e8f0] px-3 py-2" value={phone} onChange={e => setPhone(e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-sm text-[#64748b] mb-1">Timezone</label>
                    <input className="w-full rounded-lg border border-[#e2e8f0] px-3 py-2" value={timezone} onChange={e => setTimezone(e.target.value)} />
                  </div>
                </div>
                <div className="mt-4">
                  <Button variant={(savingProfile || isLoading) ? 'disabled' : 'accent'} onClick={handleSaveProfile}>
                    {savingProfile ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </Card>

              <Card>
                <h2 className="text-lg font-semibold text-[#313F4E]">Password</h2>
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm text-[#64748b] mb-1">Current password</label>
                    <input type="password" className="w-full rounded-lg border border-[#e2e8f0] px-3 py-2" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-sm text-[#64748b] mb-1">New password</label>
                    <input type="password" className="w-full rounded-lg border border-[#e2e8f0] px-3 py-2" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-sm text-[#64748b] mb-1">Confirm new password</label>
                    <input type="password" className="w-full rounded-lg border border-[#e2e8f0] px-3 py-2" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
                  </div>
                </div>
                <div className="mt-4">
                  <Button variant={(changingPassword || isLoading) ? 'disabled' : 'primary'} onClick={handleChangePassword}>
                    {changingPassword ? 'Changing...' : 'Change Password'}
                  </Button>
                </div>
              </Card>

              <Card>
                <div className="mb-6">
                  <h2 className="text-xl font-bold text-[#313F4E]">Appearance</h2>
                  <p className="text-sm text-[#64748b] mt-1">Choose how Chat Train looks on your device.</p>
                  <div className="mt-3 text-xs text-[#64748b]">
                    Current theme: <span className="font-semibold text-[#313F4E]">{savedTheme}</span>
                    {justSaved && <span className="ml-2 text-[#40B1DF]">Preferences saved</span>}
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <label className={`border rounded-xl p-4 cursor-pointer transition-all duration-200 ${isSelected("light") ? 'border-[#40B1DF] ring-2 ring-[#40B1DF]/20 shadow-md' : 'border-[#e2e8f0] hover:border-[#cbd5e1] hover:shadow-sm'}`}>
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-semibold text-[#313F4E]">Light</div>
                        <div className="text-xs text-[#64748b] mt-1">Bright interface</div>
                      </div>
                      <input
                        type="radio"
                        className="mt-1"
                        value="light"
                        checked={selectedTheme === "light"}
                        onChange={(e) => setSelectedTheme(e.target.value as ThemeOption)}
                      />
                    </div>
                  </label>
                  <label className={`border rounded-xl p-4 cursor-pointer transition-all duration-200 ${isSelected("dark") ? 'border-[#40B1DF] ring-2 ring-[#40B1DF]/20 shadow-md' : 'border-[#e2e8f0] hover:border-[#cbd5e1] hover:shadow-sm'}`}>
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-semibold text-[#313F4E]">Dark</div>
                        <div className="text-xs text-[#64748b] mt-1">Low-light interface</div>
                      </div>
                      <input
                        type="radio"
                        className="mt-1"
                        value="dark"
                        checked={selectedTheme === "dark"}
                        onChange={(e) => setSelectedTheme(e.target.value as ThemeOption)}
                      />
                    </div>
                  </label>
                  <label className={`border rounded-xl p-4 cursor-pointer transition-all duration-200 ${isSelected("system") ? 'border-[#40B1DF] ring-2 ring-[#40B1DF]/20 shadow-md' : 'border-[#e2e8f0] hover:border-[#cbd5e1] hover:shadow-sm'}`}>
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-semibold text-[#313F4E]">System</div>
                        <div className="text-xs text-[#64748b] mt-1">Match device setting</div>
                      </div>
                      <input
                        type="radio"
                        className="mt-1"
                        value="system"
                        checked={selectedTheme === "system"}
                        onChange={(e) => setSelectedTheme(e.target.value as ThemeOption)}
                      />
                    </div>
                  </label>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </Layout>
    <Dialog
      isOpen={showErrorDialog}
      onClose={() => { setShowErrorDialog(false); setError(null); }}
      onConfirm={() => { setShowErrorDialog(false); setError(null); }}
      title="Oops, something went wrong"
      message={getFriendlyError(error)}
      confirmText="OK"
      cancelText="Close"
      variant="danger"
    />
    </>
  );
}