import { EmptySellerNotice, StatusBadge } from './common'
import { formatDateTime } from '../sellerChannel.utils'

export function AdminApplicationsPanel({
  adminApplications,
  adminLoading,
  adminReviewingId,
  rejectReasons,
  setRejectReasons,
  loadAdminApplications,
  handleApplicationReview,
}) {
  return (
    <div className="mt-5 rounded-lg border border-outline-variant px-4 py-4">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-outline-variant pb-3">
        <div>
          <h2 className="text-title-sm font-title-sm text-on-surface">Đơn đăng ký chờ duyệt</h2>
          <p className="mt-1 text-body-sm text-on-surface-variant">
            {adminApplications.length ? `${adminApplications.length} đơn đang chờ xử lý` : 'Không có đơn đang chờ'}
          </p>
        </div>
        <button
          className="h-10 rounded-lg border border-outline-variant px-4 text-label-md font-label-md text-on-surface hover:border-primary hover:text-primary disabled:opacity-60"
          type="button"
          onClick={loadAdminApplications}
          disabled={adminLoading}
        >
          {adminLoading ? 'Đang tải...' : 'Tải lại'}
        </button>
      </div>

      <div className="mt-4 space-y-4">
        {adminApplications.map((item) => (
          <article key={item.id} className="rounded-lg bg-surface-container-low px-4 py-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-title-sm font-title-sm text-on-surface">{item.shopName}</h3>
                  <StatusBadge status={item.status} />
                </div>
                <p className="mt-2 text-body-sm text-on-surface-variant">
                  {item.user?.name} · {item.user?.email} · {item.contactPhone}
                </p>
                <p className="mt-1 text-body-sm text-on-surface-variant">
                  {item.addressLine1}, {item.province}
                </p>
                {item.description ? <p className="mt-2 max-w-2xl text-body-sm text-on-surface">{item.description}</p> : null}
              </div>
              <div className="text-body-sm text-on-surface-variant">{formatDateTime(item.createdAt)}</div>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-[minmax(0,1fr)_auto_auto] md:items-center">
              <input
                className="h-10 rounded-lg border-outline-variant bg-surface-container-lowest text-body-sm focus:border-primary focus:ring-primary"
                value={rejectReasons[item.id] || ''}
                onChange={(event) => setRejectReasons((current) => ({ ...current, [item.id]: event.target.value }))}
                placeholder="Lý do từ chối"
                disabled={adminReviewingId === item.id}
              />
              <button
                className="h-10 rounded-lg border border-outline-variant px-4 text-label-md font-label-md text-on-surface hover:border-error hover:text-error disabled:opacity-60"
                type="button"
                onClick={() => handleApplicationReview(item, 'reject')}
                disabled={adminReviewingId === item.id}
              >
                Từ chối
              </button>
              <button
                className="h-10 rounded-lg bg-primary px-4 text-label-md font-label-md text-on-primary hover:bg-primary/90 disabled:opacity-60"
                type="button"
                onClick={() => handleApplicationReview(item, 'approve')}
                disabled={adminReviewingId === item.id}
              >
                Duyệt
              </button>
            </div>
          </article>
        ))}

        {!adminApplications.length ? (
          <EmptySellerNotice icon="task_alt" title="Không có đơn chờ duyệt" message="Các đơn đăng ký mới sẽ xuất hiện tại đây." />
        ) : null}
      </div>
    </div>
  )
}
