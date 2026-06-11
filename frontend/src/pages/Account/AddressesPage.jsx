import { useEffect, useState } from "react";
import { toast } from "react-toastify";

import AccountLayout from "./AccountLayout";
import {
  createAccountAddress,
  deleteAccountAddress,
  getAccountAddresses,
  getAccountLocations,
  getAccountProfile,
  updateAccountAddress,
} from "../../lib/account";

const emptyAddressForm = {
  fullName: "",
  phone: "",
  line1: "",
  provinceId: "",
  wardId: "",
  ward: "",
  province: "",
  isDefault: false,
};

const phonePattern = "[0-9]{10}";

function normalizePhoneInput(value) {
  return String(value || "").replace(/\D/g, "").slice(0, 10);
}

function formatAddress(address) {
  return [address.line1, address.ward, address.province]
    .filter(Boolean)
    .join(", ");
}

function toAddressForm(address) {
  if (!address) return emptyAddressForm;

  return {
    fullName: address.fullName || "",
    phone: address.phone || "",
    line1: address.line1 || "",
    provinceId: address.provinceId ? String(address.provinceId) : "",
    wardId: address.wardId ? String(address.wardId) : "",
    ward: address.ward || "",
    province: address.province || "",
    isDefault: Boolean(address.isDefault),
  };
}

function getProfileContactForm(profile) {
  return {
    fullName: String(profile?.name || "").trim(),
    phone: String(profile?.phone || "").trim(),
  };
}

function hasProfileContact(profile) {
  const profileContact = getProfileContactForm(profile);
  return Boolean(profileContact.fullName && new RegExp(`^${phonePattern}$`).test(profileContact.phone));
}

function addressUsesProfileContact(address, profile) {
  if (!address || !profile) return false;
  const profileContact = getProfileContactForm(profile);
  return (
    String(address.fullName || "").trim() === profileContact.fullName &&
    String(address.phone || "").trim() === profileContact.phone
  );
}

export default function AddressesPage() {
  const [addresses, setAddresses] = useState([]);
  const [profile, setProfile] = useState(null);
  const [locations, setLocations] = useState([]);
  const [form, setForm] = useState(emptyAddressForm);
  const [contactMode, setContactMode] = useState("profile");
  const [editingAddress, setEditingAddress] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const profileContactReady = hasProfileContact(profile);

  useEffect(() => {
    let active = true;

    async function loadAccountData() {
      try {
        const [nextAddresses, nextProfile, nextLocations] = await Promise.all([
          getAccountAddresses(),
          getAccountProfile(),
          getAccountLocations(),
        ]);
        if (active) {
          setAddresses(nextAddresses);
          setProfile(nextProfile);
          setLocations(nextLocations);
        }
      } catch (err) {
        if (active)
          toast.error(err.message || "Không tải được thông tin địa chỉ");
      } finally {
        if (active) setLoading(false);
      }
    }

    loadAccountData();

    return () => {
      active = false;
    };
  }, []);

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  const selectedProvince = locations.find((item) => String(item.id) === String(form.provinceId));
  const wardOptions = selectedProvince?.wards || [];

  function updateProvince(value) {
    const province = locations.find((item) => String(item.id) === String(value));
    setForm((current) => ({
      ...current,
      provinceId: value,
      wardId: "",
      province: province?.name || "",
      ward: "",
    }));
  }

  function updateWard(value) {
    const ward = wardOptions.find((item) => String(item.id) === String(value));
    setForm((current) => ({
      ...current,
      wardId: value,
      ward: ward?.name || "",
    }));
  }

  function openCreateModal() {
    const profileContact = getProfileContactForm(profile);
    setEditingAddress(null);
    setContactMode(profileContactReady ? "profile" : "custom");
    setForm(
      profileContactReady
        ? { ...emptyAddressForm, ...profileContact }
        : emptyAddressForm,
    );
    setModalOpen(true);
  }

  function openEditModal(address) {
    setEditingAddress(address);
    setContactMode(
      profileContactReady && addressUsesProfileContact(address, profile)
        ? "profile"
        : "custom",
    );
    setForm(toAddressForm(address));
    setModalOpen(true);
  }

  function closeModal(force = false) {
    if (saving && !force) return;
    setModalOpen(false);
    setEditingAddress(null);
    setContactMode("profile");
    setForm(emptyAddressForm);
  }

  function handleContactModeChange(nextMode) {
    if (nextMode === "profile" && !profileContactReady) {
      toast.warning("Hồ sơ của bạn chưa có đủ tên và số điện thoại");
      return;
    }

    setContactMode(nextMode);

    if (nextMode === "profile") {
      const profileContact = getProfileContactForm(profile);
      setForm((current) => ({ ...current, ...profileContact }));
      return;
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);

    try {
      const nextAddresses = editingAddress
        ? await updateAccountAddress(editingAddress.id, form)
        : await createAccountAddress(form);

      setAddresses(nextAddresses);
      closeModal(true);
      toast.success(
        editingAddress ? "Đã cập nhật địa chỉ." : "Đã thêm địa chỉ mới.",
      );
    } catch (err) {
      toast.error(err.message || "Lưu địa chỉ thất bại");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(address) {
    if (!window.confirm("Xóa địa chỉ này?")) return;

    setDeletingId(address.id);
    try {
      const nextAddresses = await deleteAccountAddress(address.id);
      setAddresses(nextAddresses);
      toast.success("Đã xóa địa chỉ.");
    } catch (err) {
      toast.error(err.message || "Xóa địa chỉ thất bại");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <AccountLayout>
      <section className="rounded-lg bg-surface-container-lowest px-6 py-6 shadow-sm md:px-8">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-outline-variant pb-4">
          <div>
            <h1 className="text-title-md font-title-md text-on-surface">
              Địa chỉ của tôi
            </h1>
            <p className="mt-1 text-body-sm text-on-surface-variant">
              Quản lý địa chỉ giao hàng và nhận hàng
            </p>
          </div>
          <button
            className="h-10 rounded-lg bg-primary px-4 text-label-md font-label-md text-on-primary hover:bg-primary/90"
            type="button"
            onClick={openCreateModal}
          >
            Thêm địa chỉ mới
          </button>
        </div>

        {loading ? (
          <div className="mt-5 rounded-lg bg-surface-container px-4 py-4 text-body-sm text-on-surface-variant">
            Đang tải địa chỉ...
          </div>
        ) : null}

        {!loading && !addresses.length ? (
          <div className="mt-5 rounded-lg border border-dashed border-outline-variant px-6 py-10 text-center">
            <span className="material-symbols-outlined text-[36px] text-primary">
              location_on
            </span>
            <p className="mt-3 text-title-sm font-title-sm text-on-surface">
              Chưa có địa chỉ
            </p>
            <p className="mt-1 text-body-sm text-on-surface-variant">
              Cập nhật địa chỉ để hoàn thành hồ sơ và phục vụ giao hàng.
            </p>
          </div>
        ) : null}

        <div className="mt-5 space-y-4">
          {addresses.map((item) => (
            <article
              key={item.id}
              className="rounded-lg border border-outline-variant px-4 py-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-title-sm font-title-sm text-on-surface">
                      {item.fullName}
                    </p>
                    <span className="text-on-surface-variant">|</span>
                    <p className="text-body-sm text-on-surface-variant">
                      {item.phone}
                    </p>
                  </div>
                  <p className="mt-2 max-w-2xl text-body-sm text-on-surface-variant">
                    {formatAddress(item)}
                  </p>
                 <div className="mt-2 flex items-center gap-4">
                    {item.isDefault ? (
                      <span className=" inline-flex rounded-md border border-primary px-2 py-1 text-label-md text-primary">
                        Mặc định
                      </span>
                    ) : null}
                 </div>
                </div>
                <div className="flex gap-3 text-label-md">
                  <button
                    className="text-primary hover:underline"
                    type="button"
                    onClick={() => openEditModal(item)}
                  >
                    Cập nhật
                  </button>
                  <button
                    className="text-on-surface-variant hover:text-error disabled:opacity-60"
                    type="button"
                    onClick={() => handleDelete(item)}
                    disabled={deletingId === item.id}
                  >
                    {deletingId === item.id ? "Đang xóa..." : "Xóa"}
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {modalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">
          <form
            className="max-h-[calc(100vh-48px)] w-full max-w-2xl overflow-y-auto rounded-lg bg-surface-container-lowest p-6 shadow-xl"
            onSubmit={handleSubmit}
          >
            <div className="flex items-center justify-between gap-4 border-b border-outline-variant pb-4">
              <h2 className="text-title-md font-title-md text-on-surface">
                {editingAddress ? "Cập nhật địa chỉ" : "Thêm địa chỉ mới"}
              </h2>
              <button
                className="flex h-9 w-9 items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container"
                type="button"
                onClick={closeModal}
                disabled={saving}
                aria-label="Đóng"
              >
                <span className="material-symbols-outlined text-[20px]">
                  close
                </span>
              </button>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div className="grid gap-3 sm:col-span-2">
                <span className="text-body-sm text-on-surface-variant">
                  Thông tin người nhận
                </span>
                <div
                  className="grid gap-3 sm:grid-cols-2"
                  role="radiogroup"
                  aria-label="Thông tin người nhận"
                >
                  <button
                    className={`flex min-h-11 items-center gap-3 rounded-lg border px-4 text-left text-body-sm transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
                      contactMode === "profile"
                        ? "border-primary bg-primary-fixed text-primary"
                        : "border-outline-variant text-on-surface hover:border-primary hover:text-primary"
                    }`}
                    type="button"
                    role="radio"
                    aria-checked={contactMode === "profile"}
                    onClick={() => handleContactModeChange("profile")}
                    disabled={saving || !profileContactReady}
                  >
                    <span
                      className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
                        contactMode === "profile"
                          ? "border-primary"
                          : "border-outline"
                      }`}
                      aria-hidden="true"
                    >
                      {contactMode === "profile" ? (
                        <span className="h-2 w-2 rounded-full bg-primary" />
                      ) : null}
                    </span>
                    Dùng tên và SĐT trong hồ sơ
                  </button>

                  <button
                    className={`flex min-h-11 items-center gap-3 rounded-lg border px-4 text-left text-body-sm transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
                      contactMode === "custom"
                        ? "border-primary bg-primary-fixed text-primary"
                        : "border-outline-variant text-on-surface hover:border-primary hover:text-primary"
                    }`}
                    type="button"
                    role="radio"
                    aria-checked={contactMode === "custom"}
                    onClick={() => handleContactModeChange("custom")}
                    disabled={saving}
                  >
                    <span
                      className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
                        contactMode === "custom"
                          ? "border-primary"
                          : "border-outline"
                      }`}
                      aria-hidden="true"
                    >
                      {contactMode === "custom" ? (
                        <span className="h-2 w-2 rounded-full bg-primary" />
                      ) : null}
                    </span>
                    Nhập tên và SĐT khác
                  </button>
                </div>
              </div>

              <label className="grid gap-2">
                <span className="text-body-sm text-on-surface-variant">
                  Tên người nhận
                </span>
                <input
                  className="h-10 rounded-lg border-outline-variant bg-surface-container-low text-body-sm focus:border-primary focus:ring-primary disabled:text-on-surface-variant"
                  value={form.fullName}
                  onChange={(event) =>
                    updateField("fullName", event.target.value)
                  }
                  disabled={saving || contactMode === "profile"}
                  required
                />
              </label>

              <label className="grid gap-2">
                <span className="text-body-sm text-on-surface-variant">
                  Số điện thoại
                </span>
                <input
                  className="h-10 rounded-lg border-outline-variant bg-surface-container-low text-body-sm focus:border-primary focus:ring-primary disabled:text-on-surface-variant"
                  type="tel"
                  inputMode="numeric"
                  pattern={phonePattern}
                  maxLength={10}
                  title="Số điện thoại phải gồm đúng 10 chữ số"
                  value={form.phone}
                  onChange={(event) => updateField("phone", normalizePhoneInput(event.target.value))}
                  disabled={saving || contactMode === "profile"}
                  required
                />
              </label>

              <label className="grid gap-2 sm:col-span-2">
                <span className="text-body-sm text-on-surface-variant">
                  Địa chỉ cụ thể
                </span>
                <input
                  className="h-10 rounded-lg border-outline-variant bg-surface-container-low text-body-sm focus:border-primary focus:ring-primary"
                  value={form.line1}
                  onChange={(event) => updateField("line1", event.target.value)}
                  disabled={saving}
                  required
                />
              </label>

              <label className="grid gap-2">
                <span className="text-body-sm text-on-surface-variant">Tỉnh/Thành phố</span>
                <select
                  className="h-10 rounded-lg border-outline-variant bg-surface-container-low text-body-sm focus:border-primary focus:ring-primary"
                  value={form.provinceId}
                  onChange={(event) => updateProvince(event.target.value)}
                  disabled={saving}
                  required
                >
                  <option value="">Chọn tỉnh/thành phố</option>
                  {locations.map((item) => (
                    <option key={item.id} value={item.id}>{item.name}</option>
                  ))}
                </select>
              </label>

              <label className="grid gap-2">
                <span className="text-body-sm text-on-surface-variant">Phường/Xã</span>
                <select
                  className="h-10 rounded-lg border-outline-variant bg-surface-container-low text-body-sm focus:border-primary focus:ring-primary"
                  value={form.wardId}
                  onChange={(event) => updateWard(event.target.value)}
                  disabled={saving || !form.provinceId}
                  required
                >
                  <option value="">Chọn phường/xã</option>
                  {wardOptions.map((item) => (
                    <option key={item.id} value={item.id}>{item.name}</option>
                  ))}
                </select>
              </label>

              <label className="mt-7 flex min-h-10 items-center gap-3">
                <input
                  className="rounded border-outline-variant text-primary focus:ring-primary"
                  type="checkbox"
                  checked={form.isDefault}
                  onChange={(event) =>
                    updateField("isDefault", event.target.checked)
                  }
                  disabled={saving}
                />
                <span className="text-body-sm text-on-surface">
                  Đặt làm địa chỉ mặc định
                </span>
              </label>
            </div>

            <div className="mt-6 flex justify-end gap-3 border-t border-outline-variant pt-4">
              <button
                className="h-10 rounded-lg border border-outline-variant px-4 text-label-md font-label-md text-on-surface hover:border-primary hover:text-primary"
                type="button"
                onClick={closeModal}
                disabled={saving}
              >
                Hủy
              </button>
              <button
                className="h-10 rounded-lg bg-primary px-5 text-label-md font-label-md text-on-primary hover:bg-primary/90 disabled:opacity-60"
                type="submit"
                disabled={saving}
              >
                {saving ? "Đang lưu..." : "Lưu"}
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </AccountLayout>
  );
}
