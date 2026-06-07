import { useEffect, useState } from "react";
import { toast } from "react-toastify";

import AccountLayout from "./AccountLayout";
import {
  createAccountAddress,
  deleteAccountAddress,
  getAccountAddresses,
  getAccountProfile,
  updateAccountAddress,
} from "../../lib/account";

const emptyAddressForm = {
  fullName: "",
  phone: "",
  line1: "",
  ward: "",
  province: "",
  latitude: "",
  longitude: "",
  isDefault: false,
};

function formatAddress(address) {
  return [address.line1, address.ward, address.province]
    .filter(Boolean)
    .join(", ");
}

function getMapUrl(latitude, longitude) {
  if (
    latitude === null ||
    latitude === undefined ||
    latitude === "" ||
    longitude === null ||
    longitude === undefined ||
    longitude === ""
  ) {
    return "";
  }

  return `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
}

async function reverseGeocodeLocation(latitude, longitude) {
  const url = new URL(
    "https://api.bigdatacloud.net/data/reverse-geocode-client",
  );
  url.searchParams.set("latitude", String(latitude));
  url.searchParams.set("longitude", String(longitude));
  url.searchParams.set("localityLanguage", "vi");

  const response = await fetch(url.toString());
  if (!response.ok)
    throw new Error("Không lấy được thông tin địa chỉ từ bản đồ");

  const data = await response.json();
  const province = String(data.principalSubdivision || data.city || "").trim();
  const ward = String(data.locality || "").trim();

  return {
    ward,
    province,
  };
}

function toAddressForm(address) {
  if (!address) return emptyAddressForm;

  return {
    fullName: address.fullName || "",
    phone: address.phone || "",
    line1: address.line1 || "",
    ward: address.ward || "",
    province: address.province || "",
    latitude: address.latitude ?? "",
    longitude: address.longitude ?? "",
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
  return Boolean(profileContact.fullName && profileContact.phone);
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
  const [form, setForm] = useState(emptyAddressForm);
  const [contactMode, setContactMode] = useState("profile");
  const [editingAddress, setEditingAddress] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [locating, setLocating] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const profileContactReady = hasProfileContact(profile);

  useEffect(() => {
    let active = true;

    async function loadAccountData() {
      try {
        const [nextAddresses, nextProfile] = await Promise.all([
          getAccountAddresses(),
          getAccountProfile(),
        ]);
        if (active) {
          setAddresses(nextAddresses);
          setProfile(nextProfile);
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

  function handleUseCurrentLocation() {
    if (!navigator.geolocation) {
      toast.error("Trình duyệt không hỗ trợ lấy vị trí hiện tại");
      return;
    }

    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const latitude = Number(position.coords.latitude.toFixed(8));
        const longitude = Number(position.coords.longitude.toFixed(8));

        try {
          const location = await reverseGeocodeLocation(latitude, longitude);
          setForm((current) => ({
            ...current,
            latitude,
            longitude,
            ward: location.ward || current.ward,
            province: location.province || current.province,
          }));
          toast.success(
            location.ward || location.province
              ? "Đã lấy vị trí hiện tại."
              : "Đã lấy tọa độ hiện tại.",
          );
        } catch (err) {
          setForm((current) => ({
            ...current,
            latitude,
            longitude,
          }));
          toast.warning(
            err.message || "Đã lấy tọa độ, nhưng chưa tự điền được địa chỉ",
          );
        } finally {
          setLocating(false);
        }
      },
      (error) => {
        setLocating(false);
        const message =
          error.code === error.PERMISSION_DENIED
            ? "Bạn cần cho phép truy cập vị trí để dùng chức năng này"
            : "Không lấy được vị trí hiện tại";
        toast.error(message);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    );
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
                   <div>
                    {getMapUrl(item.latitude, item.longitude) ? (
                    <a
                      className="mt-2 inline-flex items-center gap-1 text-label-md font-label-md text-primary hover:underline"
                      href={getMapUrl(item.latitude, item.longitude)}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <span className="material-symbols-outlined text-[18px]">
                        map
                      </span>
                      Xem trên bản đồ
                    </a>
                  ) : null}
                  </div>
                  <div>
                    {item.isDefault ? (
                      <span className=" inline-flex rounded-md border border-primary px-2 py-1 text-label-md text-primary">
                        Mặc định
                      </span>
                    ) : null}
                  </div>
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
                  value={form.phone}
                  onChange={(event) => updateField("phone", event.target.value)}
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

              <div className="grid gap-3 rounded-lg border border-outline-variant px-4 py-4 sm:col-span-2">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-label-lg font-label-lg text-on-surface">
                      Vị trí bản đồ
                    </p>
                    <p className="mt-1 text-body-sm text-on-surface-variant">
                      {getMapUrl(form.latitude, form.longitude)
                        ? `${form.latitude}, ${form.longitude}`
                        : "Chưa chọn vị trí bản đồ"}
                    </p>
                  </div>
                  <button
                    className="inline-flex h-10 items-center gap-2 rounded-lg border border-outline-variant px-4 text-label-md font-label-md text-on-surface hover:border-primary hover:text-primary disabled:opacity-60"
                    type="button"
                    onClick={handleUseCurrentLocation}
                    disabled={saving || locating}
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      my_location
                    </span>
                    {locating ? "Đang lấy vị trí..." : "Dùng vị trí hiện tại"}
                  </button>
                </div>

                {getMapUrl(form.latitude, form.longitude) ? (
                  <a
                    className="inline-flex w-fit items-center gap-1 text-label-md font-label-md text-primary hover:underline"
                    href={getMapUrl(form.latitude, form.longitude)}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      map
                    </span>
                    Mở vị trí trên Google Maps
                  </a>
                ) : null}
              </div>

              <label className="grid gap-2">
                <span className="text-body-sm text-on-surface-variant">
                  Phường/Xã
                </span>
                <input
                  className="h-10 rounded-lg border-outline-variant bg-surface-container-low text-body-sm focus:border-primary focus:ring-primary"
                  value={form.ward}
                  onChange={(event) => updateField("ward", event.target.value)}
                  disabled={saving}
                />
              </label>

              <label className="grid gap-2">
                <span className="text-body-sm text-on-surface-variant">
                  Tỉnh/Thành phố
                </span>
                <input
                  className="h-10 rounded-lg border-outline-variant bg-surface-container-low text-body-sm focus:border-primary focus:ring-primary"
                  value={form.province}
                  onChange={(event) =>
                    updateField("province", event.target.value)
                  }
                  disabled={saving}
                  required
                />
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
