const { useMemo, useState, useEffect } = React;

const dashboardData = window.__DASHBOARD_DATA__ || {};

function formatNumber(value) {
    return new Intl.NumberFormat("id-ID").format(Number(value || 0));
}

function formatPercent(value, total) {
    if (!total) return "0.00";
    return ((Number(value || 0) / Number(total || 0)) * 100).toFixed(2);
}

function SummaryCard({ title, value, meta, icon, iconClass, valueClass }) {
    return (
        <div className="metric-card">
            <div className="metric-head">
                <div>
                    <div className="metric-label">{title}</div>
                    <div className={`metric-value ${valueClass || ""}`}>{formatNumber(value)}</div>
                    <div className="metric-meta">{meta}</div>
                </div>
                <div className={`metric-icon ${iconClass}`}>
                    <i className={icon}></i>
                </div>
            </div>
        </div>
    );
}

function SidebarLink({ href, icon, children, active, onClick }) {
    return (
        <a
            href={href}
            className={`sidebar-link ${active ? "active" : ""}`}
            onClick={onClick}
        >
            <i className={icon}></i>
            <span>{children}</span>
        </a>
    );
}

function StatusRow({ label, value, percent, dotClass }) {
    return (
        <div className="legend-row">
            <div className="legend-left">
                <span className={`dot ${dotClass}`}></span>
                <span>{label}</span>
            </div>
            <div className="legend-right">
                {formatNumber(value)} <span className="text-muted fw-semibold">({percent}%)</span>
            </div>
        </div>
    );
}

function DonutChart({ summary }) {
    const values = [
        { label: "Done", value: Number(summary.done || 0), color: "#22c55e" },
        { label: "Pending", value: Number(summary.pending || 0), color: "#f59e0b" },
        { label: "Reject", value: Number(summary.reject || 0), color: "#ef4444" }
    ];

    const total = values.reduce((acc, item) => acc + item.value, 0) || 1;
    const radius = 74;
    const stroke = 20;
    const circumference = 2 * Math.PI * radius;

    let runningOffset = 0;

    return (
        <div className="donut">
            <svg viewBox="0 0 210 210" aria-label="Status distribusi QC">
                <circle
                    className="donut-track"
                    cx="105"
                    cy="105"
                    r={radius}
                ></circle>
                {values.map((item, index) => {
                    const dash = (item.value / total) * circumference;
                    const offset = -runningOffset;
                    runningOffset += dash;

                    return (
                        <circle
                            key={item.label}
                            className="donut-segment"
                            cx="105"
                            cy="105"
                            r={radius}
                            stroke={item.color}
                            strokeWidth={stroke}
                            strokeDasharray={`${dash} ${circumference}`}
                            strokeDashoffset={offset}
                            style={{ filter: index === 0 ? "drop-shadow(0 4px 10px rgba(34,197,94,.12))" : "none" }}
                        ></circle>
                    );
                })}
            </svg>

            <div className="donut-center">
                <div className="donut-total">{formatNumber(summary.total)}</div>
                <div className="donut-label">Total</div>
            </div>
        </div>
    );
}

function Sidebar({ data, onClose }) {
    const company = data.company || "PGI";
    const currentPage = data.currentPage || "dashboard";
    const currentBatch = data.currentBatch;
    const importLabel = currentBatch ? "Import Tambahan" : "Import Batch Baru";

    return (
        <aside className="dashboard-sidebar">
            <div className="sidebar-brand">
                <img src="/images/mascot.png" alt="Maskot Monitoring QC" />
                <div>
                    <div className="sidebar-brand-title">Monitoring QC IT Support</div>
                    <div className="sidebar-brand-subtitle">Pusat Gadai Indonesia</div>
                </div>
            </div>

            <div className="sidebar-section-label">Menu Utama</div>
            <nav className="sidebar-nav">
                <SidebarLink href="/" icon="bi bi-house-fill" active={currentPage === "dashboard"} onClick={onClose}>
                    Dashboard
                </SidebarLink>
                <SidebarLink href="/inventaris" icon="bi bi-list-ul" active={currentPage === "inventaris"} onClick={onClose}>
                    Inventaris
                </SidebarLink>
                <SidebarLink href="/batch" icon={currentBatch ? "bi bi-upload" : "bi bi-plus-circle"} onClick={onClose}>
                    {importLabel}
                </SidebarLink>
                <SidebarLink href="/batch/history" icon="bi bi-clock-history" onClick={onClose}>
                    Riwayat Batch
                </SidebarLink>
                <SidebarLink href="/kalender" icon="bi bi-calendar3" active={currentPage === "calendar"} onClick={onClose}>
                    Kalender
                </SidebarLink>
            </nav>

            <div className="sidebar-card">
                <div className="sidebar-card-title">Pilih Perusahaan</div>
                <form action="/company" method="POST" className="company-switcher">
                    <input type="hidden" name="company" value="PGI" />
                    <button type="submit" className={`company-option ${company === "PGI" ? "active" : ""}`}>
                        <span>PGI - Pusat Gadai</span>
                        {company === "PGI" ? <i className="bi bi-check-lg"></i> : <i className="bi bi-arrow-right"></i>}
                    </button>
                </form>
                <form action="/company" method="POST" className="company-switcher">
                    <input type="hidden" name="company" value="PEI" />
                    <button type="submit" className={`company-option ${company === "PEI" ? "active" : ""}`}>
                        <span>PEI - Pusat Emas</span>
                        {company === "PEI" ? <i className="bi bi-check-lg"></i> : <i className="bi bi-arrow-right"></i>}
                    </button>
                </form>
            </div>

        </aside>
    );
}

function ActivityNotification() {
    const company = String(
        dashboardData?.company || "PGI"
    ).toUpperCase();

    const storageKey = `activity_last_seen_id_${company}`;

    const [activities, setActivities] = useState([]);
    const [open, setOpen] = useState(false);
    const [closing, setClosing] = useState(false);

    // Simpan last seen dalam ref supaya polling
    // selalu menggunakan nilai terbaru.
    const lastSeenRef = React.useRef(null);

    const [lastSeenId, setLastSeenId] = useState(() => {
        const saved = localStorage.getItem(storageKey);

        if (saved === null) {
            return null;
        }

        const value = Number(saved);

        return Number.isFinite(value) ? value : null;
    });

    // =====================================
    // FETCH ACTIVITY
    // =====================================

    const fetchActivities = async () => {
        try {
            const response = await fetch(
                "/api/activity?limit=10",
                {
                    cache: "no-store"
                }
            );

            if (!response.ok) {
                return;
            }

            const result = await response.json();

            if (
                !result.success ||
                !Array.isArray(result.activities)
            ) {
                return;
            }

            const latestActivities = result.activities
                .slice(0, 10)
                .sort(
                    (a, b) =>
                        Number(b.id) - Number(a.id)
                );

            setActivities(latestActivities);

            // =====================================
            // FIRST VISIT
            // =====================================
            // Kalau belum pernah membuka notification
            // untuk company ini, activity lama tidak
            // dihitung sebagai unread.
            if (
                lastSeenRef.current === null &&
                latestActivities.length > 0
            ) {
                const latestId = Number(
                    latestActivities[0].id
                );

                lastSeenRef.current = latestId;

                setLastSeenId(latestId);

                localStorage.setItem(
                    storageKey,
                    String(latestId)
                );
            }

        } catch (error) {
            console.error(
                "Gagal mengambil activity notification:",
                error
            );
        }
    };

    // =====================================
    // INITIAL LOAD + POLLING 10 DETIK
    // =====================================

    useEffect(() => {
        setOpen(false);

        const saved =
            localStorage.getItem(storageKey);

        let initialLastSeen = null;

        if (saved !== null) {
            const value = Number(saved);

            if (Number.isFinite(value)) {
                initialLastSeen = value;
            }
        }

        lastSeenRef.current = initialLastSeen;

        setLastSeenId(initialLastSeen);

        // Fetch pertama
        fetchActivities();

        // Polling setiap 10 detik
        const interval = setInterval(() => {
            fetchActivities();
        }, 10000);

        return () => {
            clearInterval(interval);
        };
    }, [company]);

    // =====================================
    // UNREAD COUNT
    // =====================================

    const unreadCount =
        lastSeenId === null
            ? 0
            : activities.filter(
                  activity =>
                      Number(activity.id) >
                      lastSeenId
              ).length;

    // =====================================
    // OPEN / MARK AS SEEN
    // =====================================

    const handleOpen = () => {
        const nextOpen = !open;

        setOpen(nextOpen);

        // Hanya ketika panel dibuka,
        // activity yang sedang tampil dianggap
        // sudah dilihat.
        if (
            nextOpen &&
            activities.length > 0
        ) {
            const latestId = Number(
                activities[0].id
            );

            lastSeenRef.current = latestId;

            setLastSeenId(latestId);

            localStorage.setItem(
                storageKey,
                String(latestId)
            );
        }
    };

    // =====================================
    // CLOSE ONLY
    // =====================================

    const handleClose = () => {
        if (!open || closing) return;

        setClosing(true);

        setTimeout(() => {
            setOpen(false);
            setClosing(false);
        }, 160);
    };

    // =====================================
    // FORMAT TIME
    // =====================================

    const formatTime = dateString => {
        if (!dateString) {
            return "-";
        }

        const normalized =
            String(dateString).replace(
                " ",
                "T"
            );

        const date =
            new Date(normalized);

        if (
            Number.isNaN(date.getTime())
        ) {
            return dateString;
        }

        return date.toLocaleString(
            "id-ID",
            {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit"
            }
        );
    };

    // =====================================
    // ICON ACTIVITY
    // =====================================

    const getIcon = type => {
        switch (type) {

            // QC
            case "QC_DONE":
                return "bi bi-check-circle-fill text-success";

            case "QC_REJECT":
                return "bi bi-x-circle-fill text-danger";

            case "QC_RESET":
                return "bi bi-arrow-counterclockwise text-warning";

            // BATCH
            case "BATCH_CREATED":
                return "bi bi-plus-circle-fill text-primary";

            case "BATCH_IMPORTED":
                return "bi bi-upload text-primary";

            case "BATCH_CLOSED":
                return "bi bi-box-arrow-down text-secondary";

            // BOOKING
            case "BOOKING_CREATED":
                return "bi bi-calendar-plus-fill text-primary";

            case "BOOKING_UPDATED":
                return "bi bi-calendar-event-fill text-warning";

            case "BOOKING_CANCELLED":
                return "bi bi-calendar-x-fill text-danger";

            case "BOOKING_DELETED":
                return "bi bi-trash-fill text-danger";

            default:
                return "bi bi-info-circle-fill text-primary";
        }
    };

    // =====================================
    // RENDER
    // =====================================

    return (
        <div className="activity-notification">

            {/* =====================================
                BELL
            ===================================== */}

            <button
                type="button"
                className="activity-bell"
                onClick={handleOpen}
                aria-label="Notifikasi aktivitas"
            >
                <i className="bi bi-bell-fill"></i>

                {unreadCount > 0 && (
                    <span className="activity-badge">
                        {unreadCount > 99
                            ? "99+"
                            : unreadCount}
                    </span>
                )}
            </button>

            {/* =====================================
                PANEL
            ===================================== */}

            {open && (
                <>
                    {/* AREA LUAR */}
                    <div
                        className="activity-overlay"
                        onClick={handleClose}
                    ></div>

                    {/* PANEL NOTIFICATION */}
                    <div className={`activity-panel ${closing ? "closing" : ""}`}>

                        {/* HEADER */}
                        <div className="activity-panel-header">

                            <div>
                                <div className="activity-panel-title">
                                    Notifikasi
                                </div>

                                <div className="activity-panel-subtitle">
                                    Aktivitas terbaru{" "}
                                    {company}
                                </div>
                            </div>

                            <button
                                type="button"
                                className="activity-close"
                                onClick={handleClose}
                                aria-label="Tutup notifikasi"
                            >
                                <i className="bi bi-x-lg"></i>
                            </button>

                        </div>

                        {/* LIST */}
                        <div className="activity-list">

                            {activities.length === 0 ? (

                                <div className="activity-empty">

                                    <i className="bi bi-bell-slash"></i>

                                    <div>
                                        Belum ada aktivitas
                                    </div>

                                </div>

                            ) : (

                                activities.map(
                                    activity => {

                                        const isUnread =
                                            lastSeenId !== null &&
                                            Number(
                                                activity.id
                                            ) >
                                                lastSeenId;

                                        return (
                                            <div
                                                key={
                                                    activity.id
                                                }
                                                className={`activity-item ${
                                                    isUnread
                                                        ? "unread"
                                                        : ""
                                                }`}
                                            >

                                                {/* ICON */}
                                                <div className="activity-icon">
                                                    <i
                                                        className={getIcon(
                                                            activity.type
                                                        )}
                                                    ></i>
                                                </div>

                                                {/* CONTENT */}
                                                <div className="activity-content">

                                                    <div className="activity-title-row">

                                                        <div className="activity-title">
                                                            {
                                                                activity.title ||
                                                                "Aktivitas"
                                                            }
                                                        </div>

                                                        <span
                                                            className={`activity-company ${company.toLowerCase()}`}
                                                        >
                                                            {
                                                                company
                                                            }
                                                        </span>

                                                    </div>

                                                    <div className="activity-message">
                                                        {
                                                            activity.message ||
                                                            "-"
                                                        }
                                                    </div>

                                                    <div className="activity-time">
                                                        {formatTime(
                                                            activity.created_at
                                                        )}
                                                    </div>

                                                </div>

                                            </div>
                                        );
                                    }
                                )

                            )}

                        </div>

                    </div>
                </>
            )}

        </div>
    );
}
function DashboardApp() {
    const data = dashboardData;
    const summary = data.summary;
    const totalInventarisKeseluruhan =
        data.totalInventarisKeseluruhan || 0;

    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [desktopSidebarHidden, setDesktopSidebarHidden] = useState(false);

    const batch = useMemo(
        () => summary?.batch || null,
        [summary]
    );

    const hasSummary = Boolean(summary);

    return (
        <div className={`dashboard-shell ${sidebarOpen ? "sidebar-open" : ""} ${desktopSidebarHidden ? "desktop-sidebar-hidden" : ""}`}>

            <div
                className="mobile-sidebar-backdrop"
                onClick={() => setSidebarOpen(false)}
            ></div>

            <Sidebar
                data={data}
                onClose={() => setSidebarOpen(false)}
            />

            <main className="dashboard-main">

                {/* =====================================
                    TOPBAR
                ===================================== */}
                <div className="dashboard-topbar">

                    <button
                        className="topbar-button"
                        type="button"
                        onClick={() => {
                            if (window.innerWidth > 991.98) {
                                setDesktopSidebarHidden(prev => !prev);
                            } else {
                                setSidebarOpen(true);
                            }
                        }}
                        aria-label="Buka/tutup sidebar"
                    >
                        <i className="bi bi-list"></i>
                    </button>

                    <div className="dashboard-topbar-title">
                        Monitoring QC IT Support
                    </div>
                    
                    <div className="dashboard-topbar-actions">

                        <a
                            href="/batch"
                            className="topbar-button d-inline-flex align-items-center justify-content-center text-decoration-none text-dark"
                            aria-label="Menu batch"
                        >
                            <i className="bi bi-box-arrow-up-right"></i>
                        </a>

                    </div>

                </div>


                {/* =====================================
                    DASHBOARD CONTENT
                ===================================== */}
                {hasSummary ? (
                    <>

                        {/* HERO */}
                        <div className="dashboard-hero">

                            <div>
                                <h1>Dashboard</h1>

                                <p>
                                    Ringkasan kondisi inventaris pada batch aktif.
                                </p>
                            </div>

                            <div className="hero-actions">

                                <ActivityNotification />

                                <div className="hero-chip">

                                    <i className="bi bi-buildings"></i>

                                    <span>
                                        {
                                            data.company === "PEI"
                                                ? "PEI - Pusat Emas Indonesia"
                                                : "PGI - Pusat Gadai Indonesia"
                                        }
                                    </span>

                                </div>

                            </div>

                        </div>


                        {/* SUMMARY CARDS */}
                        <section className="summary-grid dashboard-summary-grid">

                            <SummaryCard
                                title="Total Inventaris"
                                value={summary.total}
                                meta="Batch aktif"
                                icon="bi bi-box-seam"
                                iconClass="bg-primary"
                                valueClass="text-primary"
                            />

                            <SummaryCard
                                title="Done"
                                value={summary.done}
                                meta={`${formatPercent(summary.done, summary.total)} %`}
                                icon="bi bi-check-circle-fill"
                                iconClass="bg-success"
                                valueClass="text-success"
                            />

                            <SummaryCard
                                title="Pending"
                                value={summary.pending}
                                meta={`${formatPercent(summary.pending, summary.total)} %`}
                                icon="bi bi-hourglass-split"
                                iconClass="bg-warning"
                                valueClass="text-warning"
                            />

                            <SummaryCard
                                title="Reject"
                                value={summary.reject}
                                meta={`${formatPercent(summary.reject, summary.total)} %`}
                                icon="bi bi-x-circle-fill"
                                iconClass="bg-danger"
                                valueClass="text-danger"
                            />

                            <SummaryCard
                                title="Total Inventaris Keseluruhan"
                                value={totalInventarisKeseluruhan}
                                meta="Seluruh periode"
                                icon="bi bi-archive-fill"
                                iconClass="bg-info"
                                valueClass="text-info"
                            />

                        </section>


                        {/* CONTENT GRID */}
                        <section className="content-grid">

                            {/* BATCH ACTIVE */}
                            <div className="content-card">

                                <div className="batch-banner">

                                    <div>

                                        <span className="badge bg-primary px-3 py-2 rounded-pill">
                                            Batch Aktif
                                        </span>

                                        <h2 className="batch-code">
                                            {batch?.batch_code || "-"}
                                        </h2>

                                        <p className="batch-name">
                                            {batch?.batch_name || "-"}
                                        </p>

                                    </div>

                                    <div className="batch-icon">

                                        <i className="bi bi-box-seam"></i>

                                    </div>

                                </div>


                                {/* INFO ROW */}
                                <div className="info-row">

                                    <div className="info-box">

                                        <div className="info-icon blue">

                                            <i className="bi bi-calendar-event"></i>

                                        </div>

                                        <div>

                                            <small className="info-label">
                                                Tanggal Import
                                            </small>

                                            <div className="info-value">
                                                {batch?.created_at_formatted || "-"}
                                            </div>

                                        </div>

                                    </div>


                                    <div className="info-box">

                                        <div className="info-icon yellow">

                                            <i className="bi bi-box-seam"></i>

                                        </div>

                                        <div>

                                            <small className="info-label">
                                                Jumlah Asset
                                            </small>

                                            <div className="info-value">
                                                {formatNumber(summary.total)} Unit
                                            </div>

                                        </div>

                                    </div>

                                </div>


                                {/* PROGRESS */}
                                <div className="progress-block">

                                    <div className="progress-header">

                                        <span>
                                            Progress QC
                                        </span>

                                        <span>
                                            {Number(summary.progress || 0).toFixed(2)}%
                                        </span>

                                    </div>

                                    <div
                                        className="progress"
                                        role="progressbar"
                                        aria-valuenow={summary.progress}
                                        aria-valuemin="0"
                                        aria-valuemax="100"
                                    >

                                        <div
                                            className="progress-bar bg-success"
                                            style={{
                                                width: `${summary.progress}%`
                                            }}
                                        ></div>

                                    </div>

                                    <p className="text-muted mt-3 mb-0">

                                        {
                                            formatNumber(
                                                summary.done + summary.reject
                                            )
                                        }

                                        {" "}dari{" "}

                                        {
                                            formatNumber(
                                                summary.total
                                            )
                                        }

                                        {" "}inventaris telah selesai diproses.

                                    </p>

                                </div>

                            </div>


                            {/* STATUS DISTRIBUSI */}
                            <div className="content-card">

                                <h3 className="section-title">

                                    <i className="bi bi-pie-chart-fill text-primary"></i>

                                    {" "}Status Distribusi

                                </h3>


                                <div className="distribution-layout">

                                    <DonutChart
                                        summary={summary}
                                    />


                                    <div className="legend">

                                        <StatusRow
                                            label="Done"
                                            value={summary.done}
                                            percent={formatPercent(
                                                summary.done,
                                                summary.total
                                            )}
                                            dotClass="done"
                                        />

                                        <StatusRow
                                            label="Pending"
                                            value={summary.pending}
                                            percent={formatPercent(
                                                summary.pending,
                                                summary.total
                                            )}
                                            dotClass="pending"
                                        />

                                        <StatusRow
                                            label="Reject"
                                            value={summary.reject}
                                            percent={formatPercent(
                                                summary.reject,
                                                summary.total
                                            )}
                                            dotClass="reject"
                                        />

                                    </div>

                                </div>

                            </div>

                        </section>

                    </>

                ) : (

                    /* EMPTY STATE */
                    <div className="empty-state">

                        <div className="empty-card">

                            <div className="empty-icon">

                                <i className="bi bi-exclamation-triangle-fill"></i>

                            </div>

                            <h2>
                                Belum ada Batch Aktif
                            </h2>

                            <p>
                                Silakan import batch baru untuk memulai proses QC Inventaris.
                            </p>


                            <div className="action-row">

                                <a
                                    href="/batch"
                                    className="btn btn-primary btn-lg"
                                >

                                    <i className="bi bi-upload me-2"></i>

                                    Import Batch

                                </a>


                                <a
                                    href="/inventaris"
                                    className="btn btn-outline-secondary btn-lg"
                                >

                                    <i className="bi bi-list-ul me-2"></i>

                                    Lihat Inventaris

                                </a>

                            </div>

                        </div>

                    </div>

                )}

            </main>

        </div>
    );
}

const root = ReactDOM.createRoot(document.getElementById("dashboard-root"));
root.render(<DashboardApp />);
