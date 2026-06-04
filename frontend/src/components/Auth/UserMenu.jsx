import { Link } from "react-router-dom";

function UserMenuItem({ icon, label, to, onClick, danger = false }) {
  const className = `flex h-10 w-full items-center gap-3 rounded-md px-3 text-left text-label-md font-label-md transition-colors ${
    danger
      ? "text-error hover:bg-error-container hover:text-on-error-container"
      : "text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
  }`;

  if (to) {
    return (
      <Link className={className} to={to} onClick={onClick}>
        <span className="material-symbols-outlined text-[20px]">{icon}</span>
        {label}
      </Link>
    );
  }

  return (
    <button className={className} type="button" onClick={onClick}>
      <span className="material-symbols-outlined text-[20px]">{icon}</span>
      {label}
    </button>
  );
}

export default function UserMenu({ user, onClose, onLogout }) {
  return (
    <div className="absolute right-0 z-[120] mt-3 w-64 rounded-lg border border-outline-variant bg-surface-container-lowest p-3 shadow-[0px_12px_40px_rgba(0,0,0,0.18)]">
      <div className="min-w-0 border-b border-outline-variant pb-3">
        <div className="flex flex-col gap-1 items-center">
          <p className="text-sm font-bold text-orange-500 items-center">Xin chào !!</p>
          <p className="truncate text-title-sm font-title-sm text-on-surface">
            {user.name}
          </p>
        </div>
      </div>

      <div className="py-2">
        {user.role === "admin" ? (
          <UserMenuItem
            icon="admin_panel_settings"
            label="Dashboard Admin"
            to="/admin/dashboard"
            onClick={onClose}
          />
        ) : null}
        <UserMenuItem
          icon="person"
          label="Hồ sơ của tôi"
          to="/profile"
          onClick={onClose}
        />
        <UserMenuItem
          icon="receipt_long"
          label="Đơn mua"
          to="/orders"
          onClick={onClose}
        />
      </div>

      <div className="border-t border-outline-variant pt-2">
        <UserMenuItem
          icon="logout"
          label="Đăng xuất"
          onClick={onLogout}
          danger
        />
      </div>
    </div>
  );
}
