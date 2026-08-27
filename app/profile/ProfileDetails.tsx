"use client";

import { useState } from "react";
import { Check, Edit2, KeyRound, LocateFixed, Mail, MapPin, MessageSquare, Phone, UserCircle2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { changePassword, updateProfile } from "./actions";

interface ProfileDetailsProps {
  user: {
    fullName: string;
    email: string;
    phone: string | null;
    whatsapp: string | null;
    state: string | null;
    city: string | null;
    pincode: string | null;
    timezone: string;
  };
}

export function ProfileDetails({ user }: ProfileDetailsProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [fullName, setFullName] = useState(user.fullName);
  const [phone, setPhone] = useState(user.phone || "");
  const [whatsapp, setWhatsapp] = useState(user.whatsapp || "");
  const [state, setState] = useState(user.state || "");
  const [city, setCity] = useState(user.city || "");
  const [pincode, setPincode] = useState(user.pincode || "");
  const [timezone, setTimezone] = useState(user.timezone);
  const [loading, setLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationMessage, setLocationMessage] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);

  const resetForm = () => {
    setFullName(user.fullName);
    setPhone(user.phone || "");
    setWhatsapp(user.whatsapp || "");
    setState(user.state || "");
    setCity(user.city || "");
    setPincode(user.pincode || "");
    setTimezone(user.timezone);
    setLocationMessage("");
  };

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationMessage("Location services are not available in this browser.");
      return;
    }

    setLocationLoading(true);
    setLocationMessage("");

    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          const response = await fetch(
            `/api/location/reverse?latitude=${coords.latitude}&longitude=${coords.longitude}`,
            { cache: "no-store" },
          );
          const result = await response.json() as { city?: string; state?: string; pincode?: string; message?: string };
          if (!response.ok) throw new Error(result.message || "Location lookup failed.");

          setCity(result.city || "");
          setState(result.state || "");
          setPincode(result.pincode || "");
          setTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone || timezone);
          setLocationMessage("Location details and timezone have been filled in. Please review and save.");
        } catch (error) {
          setLocationMessage(error instanceof Error ? error.message : "We could not identify this location.");
        } finally {
          setLocationLoading(false);
        }
      },
      () => {
        setLocationLoading(false);
        setLocationMessage("Location permission was not granted. You can enter the details manually.");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 },
    );
  };

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setLocationMessage("");
    try {
      await updateProfile({ fullName, phone, whatsapp, state, city, pincode, timezone });
      setIsEditing(false);
      router.refresh();
    } catch {
      setLocationMessage("We could not save these details. Please check your entries and try again.");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (event: React.FormEvent) => {
    event.preventDefault();
    setPasswordLoading(true);
    setPasswordMessage("");
    try {
      await changePassword({ currentPassword, password: newPassword, confirmPassword });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordMessage("Your password has been updated.");
    } catch (error) {
      setPasswordMessage(error instanceof Error ? error.message : "We could not update your password.");
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="profile-details">
      <div className="profile-details-header">
        <div><span className="eyebrow">Account details</span><h2>Your travel profile</h2></div>
        {!isEditing && <button type="button" className="profile-edit-btn" onClick={() => setIsEditing(true)}><Edit2 size={14} /> Edit details</button>}
      </div>

      {isEditing ? (
        <form onSubmit={handleSave} className="profile-edit-form">
          <dl>
            <div><dt><UserCircle2 size={17} /> Name</dt><dd><input value={fullName} onChange={(event) => setFullName(event.target.value)} required minLength={2} /></dd></div>
            <div><dt><Mail size={17} /> Email</dt><dd className="is-readonly">{user.email}</dd></div>
            <div><dt><Phone size={17} /> Phone</dt><dd><input type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="+91 00000 00000" /></dd></div>
            <div><dt><MessageSquare size={17} /> WhatsApp</dt><dd><input type="tel" value={whatsapp} onChange={(event) => setWhatsapp(event.target.value)} placeholder="+91 00000 00000" /></dd></div>
          </dl>

          <div className="profile-location-heading">
            <div><span className="eyebrow">Current location</span><p>Use your device location or update these fields manually.</p></div>
            <button type="button" className="profile-location-button" onClick={useCurrentLocation} disabled={locationLoading || loading}><LocateFixed size={15} /> {locationLoading ? "Finding location..." : "Use my location"}</button>
          </div>
          <div className="profile-location-grid">
            <label>State<input value={state} onChange={(event) => setState(event.target.value)} placeholder="State" /></label>
            <label>City<input value={city} onChange={(event) => setCity(event.target.value)} placeholder="City" /></label>
            <label>PIN code<input value={pincode} onChange={(event) => setPincode(event.target.value)} inputMode="numeric" placeholder="PIN code" /></label>
            <label>Timezone<input value={timezone} onChange={(event) => setTimezone(event.target.value)} placeholder="Asia/Kolkata" /></label>
          </div>
          {locationMessage ? <p className="profile-location-message" aria-live="polite">{locationMessage}</p> : null}

          <div className="profile-edit-actions">
            <button type="submit" disabled={loading || locationLoading} className="button-save"><Check size={15} /> {loading ? "Saving..." : "Save changes"}</button>
            <button type="button" disabled={loading || locationLoading} onClick={() => { resetForm(); setIsEditing(false); }} className="button-cancel"><X size={15} /> Cancel</button>
          </div>
        </form>
      ) : (
        <dl>
          <div><dt><UserCircle2 size={17} /> Name</dt><dd>{user.fullName}</dd></div>
          <div><dt><Mail size={17} /> Email</dt><dd>{user.email}</dd></div>
          <div><dt><Phone size={17} /> Phone</dt><dd>{user.phone || "Not added"}</dd></div>
          <div><dt><MessageSquare size={17} /> WhatsApp</dt><dd>{user.whatsapp || "Not added"}</dd></div>
          <div><dt><MapPin size={17} /> Current location</dt><dd>{[user.city, user.state, user.pincode].filter(Boolean).join(", ") || "Not added"}</dd></div>
          <div><dt><LocateFixed size={17} /> Timezone</dt><dd>{user.timezone}</dd></div>
        </dl>
      )}

      <form onSubmit={handlePasswordChange} className="profile-password-form">
        <div>
          <span className="eyebrow">Security</span>
          <h3><KeyRound size={18} /> Change password</h3>
          <p>Use at least 8 characters and keep your password unique.</p>
        </div>
        <div className="profile-password-fields">
          <label>Current password<input type="password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} autoComplete="current-password" required /></label>
          <label>New password<input type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} autoComplete="new-password" minLength={8} required /></label>
          <label>Confirm new password<input type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} autoComplete="new-password" minLength={8} required /></label>
        </div>
        <div className="profile-password-actions">
          <button type="submit" className="button-save" disabled={passwordLoading}>
            {passwordLoading ? "Updating..." : "Update password"}
          </button>
        </div>

        {passwordMessage && (
          <div
            className={`form-message ${passwordMessage.includes("updated") ? "form-message--success" : "form-message--error"
              }`}
            aria-live="polite"
          >
            {passwordMessage}
          </div>
        )}
      </form>
    </div>
  );
}
