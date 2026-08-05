import React, { useState } from 'react';
import { User as UserIcon, CheckCircle, Upload, Trash2 } from 'lucide-react';
import { User as UserType, Business } from '../types';
import { getUserInitials, formatRoleLabel } from '../components/Header';
import { saveUserToFirestore } from '../lib/firestoreService';

interface Props {
  user: UserType;
  business: Business;
  onUpdateUser?: (updated: UserType) => void;
}

export const ProfileView: React.FC<Props> = ({ user, business, onUpdateUser }) => {
  const [name, setName] = useState(user.name);
  const [phone, setPhone] = useState(user.phone);
  const [avatar, setAvatar] = useState<string | undefined>(user.avatar);
  const [saved, setSaved] = useState(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatar(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemovePhoto = () => {
    setAvatar('');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const updatedUser: UserType = {
      ...user,
      name,
      phone,
      avatar: avatar || undefined,
    };

    // Save to Firestore
    await saveUserToFirestore(updatedUser);

    if (onUpdateUser) {
      onUpdateUser(updatedUser);
    }

    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-3xl animate-in fade-in duration-200">
      <div>
        <h2 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
          <UserIcon className="w-6 h-6 text-emerald-500" />
          User Account Profile
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Personal credentials, security settings & role attributes.
        </p>
      </div>

      {saved && (
        <div className="p-4 rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center gap-2 border border-emerald-500/20">
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span>Profile changes updated & synced with Firestore!</span>
        </div>
      )}

      <form onSubmit={handleSave} className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
        {/* Profile Avatar Section */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 pb-6 border-b border-slate-100 dark:border-slate-800">
          <div className="relative">
            {avatar ? (
              <img
                src={avatar}
                alt={name}
                referrerPolicy="no-referrer"
                className="w-20 h-20 rounded-2xl object-cover border-2 border-emerald-500 shadow-md"
              />
            ) : (
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white font-black text-2xl flex items-center justify-center border-2 border-emerald-500 shadow-md">
                {getUserInitials(name)}
              </div>
            )}
          </div>

          <div className="space-y-2 flex-1">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">{name}</h3>
              <div className="flex items-center gap-2 mt-1">
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-mono text-[10px] font-bold">
                  {formatRoleLabel(user.role)}
                </span>
                <span className="text-[11px] text-slate-400">Photo upload is optional</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <label className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-xl cursor-pointer transition flex items-center gap-1.5 border border-slate-200 dark:border-slate-700">
                <Upload className="w-3.5 h-3.5 text-emerald-500" />
                <span>Upload Profile Photo</span>
                <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
              </label>

              {avatar && (
                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  className="px-3 py-1.5 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 text-rose-600 dark:text-rose-400 text-xs font-semibold rounded-xl transition flex items-center gap-1.5 border border-rose-200 dark:border-rose-800"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Use Initials Avatar</span>
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Full Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Email Address (Firebase Auth)
            </label>
            <input
              type="text"
              readOnly
              value={user.email}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-200 dark:bg-slate-800 text-xs text-slate-500 cursor-not-allowed"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Phone Number
            </label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-mono text-xs outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Business Organization
            </label>
            <input
              type="text"
              readOnly
              value={business.name}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-200 dark:bg-slate-800 text-xs text-slate-500 cursor-not-allowed font-bold"
            />
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md transition"
          >
            Save Profile
          </button>
        </div>
      </form>
    </div>
  );
};
