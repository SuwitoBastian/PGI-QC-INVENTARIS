const {
    useEffect,
    useMemo,
    useState
} = React;

const CALENDAR_CONFIG = window.__CALENDAR_DATA__ || {
    company: "PGI",
    currentPage: "calendar"
};

const STATUS_LABEL = {
    CONFIRMED: "Terjadwal",
    TENTATIVE: "Tentatif",
    CANCELLED: "Dibatalkan"
};

const STATUS_CLASS = {
    CONFIRMED: "confirmed",
    TENTATIVE: "tentative",
    CANCELLED: "cancelled"
};

const MONTH_NAMES = [
    "Januari",
    "Februari",
    "Maret",
    "April",
    "Mei",
    "Juni",
    "Juli",
    "Agustus",
    "September",
    "Oktober",
    "November",
    "Desember"
];

const DAY_NAMES = [
    "Sen",
    "Sel",
    "Rab",
    "Kam",
    "Jum",
    "Sab",
    "Min"
];

const HOLIDAYS_2026 = {"2026-01-01":"Tahun Baru 2026 Masehi","2026-01-16":"Isra Mikraj Nabi Muhammad SAW","2026-02-16":"Cuti Bersama Tahun Baru Imlek 2577 Kongzili","2026-02-17":"Tahun Baru Imlek 2577 Kongzili","2026-03-18":"Cuti Bersama Hari Suci Nyepi","2026-03-19":"Hari Suci Nyepi","2026-03-20":"Cuti Bersama Idulfitri 1447 H","2026-03-21":"Idulfitri 1447 H","2026-03-22":"Idulfitri 1447 H","2026-03-23":"Cuti Bersama Idulfitri 1447 H","2026-03-24":"Cuti Bersama Idulfitri 1447 H","2026-04-03":"Wafat Yesus Kristus","2026-04-05":"Kebangkitan Yesus Kristus (Paskah)","2026-05-01":"Hari Buruh Internasional","2026-05-14":"Kenaikan Yesus Kristus","2026-05-15":"Cuti Bersama Kenaikan Yesus Kristus","2026-05-27":"Iduladha 1447 H","2026-05-28":"Cuti Bersama Iduladha 1447 H","2026-05-31":"Hari Raya Waisak 2570 BE","2026-06-01":"Hari Lahir Pancasila","2026-06-16":"1 Muharam Tahun Baru Islam 1448 H","2026-08-17":"Proklamasi Kemerdekaan Republik Indonesia","2026-08-25":"Maulid Nabi Muhammad SAW","2026-12-24":"Cuti Bersama Kelahiran Yesus Kristus","2026-12-25":"Kelahiran Yesus Kristus"};
function getTodayKey(){return getDateKey(new Date());}
function isPastDate(k){return k<getTodayKey();}
function isSunday(d){return d.getDay()===0;}
function getHolidayName(d,k){return isSunday(d)?(HOLIDAYS_2026[k]||"Hari Minggu"):(HOLIDAYS_2026[k]||"");}
function isHoliday(d,k){return isSunday(d)||Boolean(HOLIDAYS_2026[k]);}

function formatDate(dateString) {
    if (!dateString) return "-";

    const date = new Date(`${dateString}T00:00:00`);

    return date.toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "long",
        year: "numeric"
    });
}

function getMonthString(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");

    return `${year}-${month}`;
}

function getDateKey(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

function getCalendarDays(year, month) {
    const firstDay = new Date(year, month, 1);

    let startDay = firstDay.getDay();

    // Ubah Minggu = 0 menjadi Senin = 0
    startDay = startDay === 0 ? 6 : startDay - 1;

    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const previousMonthDays = [];

    for (let i = startDay - 1; i >= 0; i--) {
        previousMonthDays.push(
            new Date(year, month, -i)
        );
    }

    const currentMonthDays = [];

    for (let day = 1; day <= daysInMonth; day++) {
        currentMonthDays.push(
            new Date(year, month, day)
        );
    }

    const totalCells = 42;

    const nextMonthDays = [];

    const currentLength =
        previousMonthDays.length +
        currentMonthDays.length;

    for (
        let i = 1;
        currentLength + nextMonthDays.length < totalCells;
        i++
    ) {
        nextMonthDays.push(
            new Date(year, month + 1, i)
        );
    }

    return [
        ...previousMonthDays,
        ...currentMonthDays,
        ...nextMonthDays
    ];
}

function SidebarLink({
    href,
    icon,
    active,
    children
}) {
    return (
        <a
            href={href}
            className={`sidebar-link ${active ? "active" : ""}`}
        >
            <i className={icon}></i>
            <span>{children}</span>
        </a>
    );
}

function Sidebar({
    company,
    currentPage
}) {
    return (
        <aside className="dashboard-sidebar">

            <div className="sidebar-brand">

                <img
                    src="/images/mascot.png"
                    alt="Maskot Monitoring QC"
                />

                <div>

                    <div className="sidebar-brand-title">
                        Monitoring QC IT Support
                    </div>

                    <div className="sidebar-brand-subtitle">
                        Pusat Gadai Indonesia
                    </div>

                </div>

            </div>

            <div className="sidebar-section-label">
                Menu Utama
            </div>

            <nav className="sidebar-nav">

                <SidebarLink
                    href="/"
                    icon="bi bi-house-fill"
                    active={currentPage === "dashboard"}
                >
                    Dashboard
                </SidebarLink>

                <SidebarLink
                    href="/inventaris"
                    icon="bi bi-list-ul"
                    active={currentPage === "inventaris"}
                >
                    Inventaris
                </SidebarLink>

                <SidebarLink
                    href="/batch"
                    icon="bi bi-plus-circle"
                    active={currentPage === "batch"}
                >
                    Import Batch Baru
                </SidebarLink>

                <SidebarLink
                    href="/batch/history"
                    icon="bi bi-clock-history"
                    active={currentPage === "batch-history"}
                >
                    Riwayat Batch
                </SidebarLink>

                <SidebarLink
                    href="/kalender"
                    icon="bi bi-calendar3"
                    active={currentPage === "calendar"}
                >
                    Kalender
                </SidebarLink>

            </nav>

            <div className="sidebar-card">

                <div className="sidebar-card-title">
                    Pilih Perusahaan
                </div>

                <form
                    action="/company"
                    method="POST"
                    className="company-switcher"
                >

                    <input
                        type="hidden"
                        name="company"
                        value="PGI"
                    />

                    <button
                        type="submit"
                        className={`company-option ${
                            company === "PGI"
                                ? "active"
                                : ""
                        }`}
                    >

                        <span>
                            PGI - Pusat Gadai
                        </span>

                        {company === "PGI" ? (
                            <i className="bi bi-check-lg"></i>
                        ) : (
                            <i className="bi bi-arrow-right"></i>
                        )}

                    </button>

                </form>

                <form
                    action="/company"
                    method="POST"
                    className="company-switcher"
                >

                    <input
                        type="hidden"
                        name="company"
                        value="PEI"
                    />

                    <button
                        type="submit"
                        className={`company-option ${
                            company === "PEI"
                                ? "active"
                                : ""
                        }`}
                    >

                        <span>
                            PEI - Pusat Emas
                        </span>

                        {company === "PEI" ? (
                            <i className="bi bi-check-lg"></i>
                        ) : (
                            <i className="bi bi-arrow-right"></i>
                        )}

                    </button>

                </form>

            </div>

        </aside>
    );
}

function Header({
    onAdd
}) {
    return (
        <header className="calendar-header">

            <div>
                <div className="page-title">
                    Kalender Booking
                </div>

                <div className="page-subtitle">
                    Jadwal orderan dan booking QC Inventaris
                </div>
            </div>

            <div className="header-actions">

                <button
                    className="btn-add-booking"
                    onClick={onAdd}
                >
                    <i className="bi bi-plus-lg"></i>
                    Tambah Orderan
                </button>

            </div>

        </header>
    );
}

function SummaryCard({
    icon,
    title,
    value,
    className
}) {
    return (
        <div className={`summary-card ${className || ""}`}>

            <div className="summary-icon">
                <i className={icon}></i>
            </div>

            <div className="summary-content">

                <div className="summary-title">
                    {title}
                </div>

                <div className="summary-value">
                    {value}
                </div>

            </div>

        </div>
    );
}

function Summary({
    summary
}) {
    return (
        <div className="summary-grid">

            <SummaryCard
                icon="bi bi-calendar-check"
                title="Total Orderan"
                value={summary.total || 0}
                className="summary-total"
            />

            <SummaryCard
                icon="bi bi-check-circle"
                title="Terjadwal"
                value={summary.confirmed || 0}
                className="summary-confirmed"
            />

            <SummaryCard
                icon="bi bi-x-circle"
                title="Dibatalkan"
                value={summary.cancelled || 0}
                className="summary-cancelled"
            />

        </div>
    );
}

function CalendarCell({ date, currentMonth, bookings, onClick }) {
    const dateKey = getDateKey(date);
    const isCurrentMonth = date.getMonth() === currentMonth;
    const isToday = getDateKey(new Date()) === dateKey;
    const isPast = isPastDate(dateKey);
    const holidayName = getHolidayName(date, dateKey);
    const holiday = isHoliday(date, dateKey);
    const dayBookings = bookings.filter(item => item.booking_date === dateKey);
    return (
        <div className={["calendar-cell",!isCurrentMonth?"other-month":"",isToday?"today":"",isPast?"past-date":"",holiday?"holiday":"",isSunday(date)?"sunday":"",dayBookings.length>0?"has-booking":""].join(" ")} onClick={() => { if (!isPast || dayBookings.length>0) onClick(dateKey); }} title={isPast?"Tanggal sudah lewat":holidayName}>
            <div className="calendar-date-number">{date.getDate()}</div>
            {holidayName && <div className="calendar-holiday-label">{holidayName}</div>}
            <div className="calendar-events">
                {dayBookings.slice(0,3).map(item => (
                    <div
                        key={item.id}
                        className={`calendar-event ${STATUS_CLASS[item.status]||""} company-${String(item.company || "").toLowerCase()}`}
                        title={`${item.company} - ${item.requester||"-"}`}
                    >
                        <span className="event-company">{item.company}</span>
                        <span className="event-text">{item.asset_type||"Booking QC"}</span>
                    </div>
                ))}

                {dayBookings.length>3 && (
                    <div className="event-more">
                        +{dayBookings.length-3} lainnya
                    </div>
                )}
            </div>
        </div>
    );
}

function Calendar({
    currentDate,
    bookings,
    onDateClick,
    onPrevious,
    onNext,
    onToday
}) {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const days = useMemo(
        () => getCalendarDays(year, month),
        [year, month]
    );

    return (
        <div className="calendar-card">

            <div className="calendar-toolbar">

                <div className="calendar-navigation">

                    <button
                        className="calendar-nav-btn"
                        onClick={onPrevious}
                        title="Bulan sebelumnya"
                    >
                        <i className="bi bi-chevron-left"></i>
                    </button>

                    <button
                        className="calendar-nav-btn"
                        onClick={onNext}
                        title="Bulan berikutnya"
                    >
                        <i className="bi bi-chevron-right"></i>
                    </button>

                    <button
                        className="calendar-today-btn"
                        onClick={onToday}
                    >
                        Hari Ini
                    </button>

                </div>

                <div className="calendar-month-title">
                    {MONTH_NAMES[month]} {year}
                </div>

                <div className="calendar-legend">

                    <span>
                        <i className="legend-dot confirmed"></i>
                        Terjadwal
                    </span>

                    <span>
                        <i className="legend-dot cancelled"></i>
                        Dibatalkan
                    </span>

                </div>

            </div>

            <div className="calendar-grid">

                {DAY_NAMES.map(day => (
                    <div
                        key={day}
                        className="calendar-day-header"
                    >
                        {day}
                    </div>
                ))}

                {days.map(date => (
                    <CalendarCell
                        key={getDateKey(date)}
                        date={date}
                        currentMonth={month}
                        bookings={bookings}
                        onClick={onDateClick}
                    />
                ))}

            </div>

        </div>
    );
}

function BookingModal({
    open,
    mode,
    form,
    setForm,
    onClose,
    onSubmit,
    saving
}) {
    if (!open) return null;

    const isEdit = mode === "edit";

    function updateField(field, value) {
        setForm(prev => ({
            ...prev,
            [field]: value
        }));
    }

    return (
        <div className="modal-backdrop-custom">

            <div className="booking-modal">

                <div className="modal-header-custom">

                    <div>
                        <div className="modal-title-custom">
                            {isEdit
                                ? "Edit Orderan"
                                : "Tambah Orderan"
                            }
                        </div>

                        <div className="modal-subtitle-custom">
                            Isi detail booking QC
                        </div>
                    </div>

                    <button
                        className="modal-close-btn"
                        onClick={onClose}
                    >
                        <i className="bi bi-x-lg"></i>
                    </button>

                </div>

                <form onSubmit={onSubmit}>

                    <div className="modal-body-custom">

                        <div className="form-row">

                            <div className="form-group">

                                <label>
                                    Company
                                </label>

                                <select
                                    value={form.company}
                                    disabled
                                    required
                                >
                                    <option value={form.company}>
                                        {form.company}
                                    </option>
                                </select>

                            </div>

                            <div className="form-group">

                                <label>
                                    Tanggal
                                </label>

                                <input
                                    type="date"
                                    min={getTodayKey()}
                                    value={form.booking_date}
                                    onChange={(e) =>
                                        updateField(
                                            "booking_date",
                                            e.target.value
                                        )
                                    }
                                    required
                                />

                            </div>

                        </div>

                        <div className="form-row">

                            <div className="form-group">

                                <label>
                                    Jenis Asset
                                </label>

                                <select
                                    value={form.asset_type}
                                    onChange={(e) =>
                                        updateField(
                                            "asset_type",
                                            e.target.value
                                        )
                                    }
                                >
                                    <option value="">
                                        Pilih jenis asset
                                    </option>

                                    <option value="Laptop">
                                        Laptop
                                    </option>

                                    <option value="Handphone">
                                        Handphone
                                    </option>

                                    <option value="Laptop & Handphone">
                                        Laptop & Handphone
                                    </option>

                                    <option value="Lainnya">
                                        Lainnya
                                    </option>
                                </select>

                            </div>

                            <div className="form-group">

                                <label>
                                    Jumlah Asset
                                </label>

                                <input
                                    type="number"
                                    min="0"
                                    value={form.asset_count}
                                    onChange={(e) =>
                                        updateField(
                                            "asset_count",
                                            e.target.value
                                        )
                                    }
                                    placeholder="Contoh: 25"
                                />

                            </div>

                        </div>

                        <div className="form-row">

                            <div className="form-group">

                                <label>
                                    Requester / PIC
                                </label>

                                <input
                                    type="text"
                                    value={form.requester}
                                    onChange={(e) =>
                                        updateField(
                                            "requester",
                                            e.target.value
                                        )
                                    }
                                    placeholder="Nama requester / PIC"
                                />

                            </div>

                            <div className="form-group">

                                <label>
                                    Lokasi
                                </label>

                                <input
                                    type="text"
                                    value={form.location}
                                    readOnly
                                />

                            </div>

                        </div>

                        <div className="form-group">

                            <label>
                                Status
                            </label>

                            <select
                                value={form.status}
                                onChange={(e) =>
                                    updateField(
                                        "status",
                                        e.target.value
                                    )
                                }
                            >
                                <option value="CONFIRMED">
                                    Terjadwal
                                </option>

                                <option value="CANCELLED">
                                    Dibatalkan
                                </option>
                            </select>

                        </div>

                        <div className="form-group">

                            <label>
                                Catatan
                            </label>

                            <textarea
                                rows="4"
                                value={form.notes}
                                onChange={(e) =>
                                    updateField(
                                        "notes",
                                        e.target.value
                                    )
                                }
                                placeholder="Tambahkan catatan jika diperlukan..."
                            />

                        </div>

                    </div>

                    <div className="modal-footer-custom">

                        <button
                            type="button"
                            className="btn-secondary-custom"
                            onClick={onClose}
                            disabled={saving}
                        >
                            Batal
                        </button>

                        <button
                            type="submit"
                            className="btn-primary-custom"
                            disabled={saving}
                        >
                            {saving ? (
                                <>
                                    <span className="spinner-border spinner-border-sm"></span>
                                    Menyimpan...
                                </>
                            ) : (
                                <>
                                    <i className="bi bi-check-lg"></i>
                                    {isEdit
                                        ? "Simpan Perubahan"
                                        : "Simpan Booking"
                                    }
                                </>
                            )}
                        </button>

                    </div>

                </form>

            </div>

        </div>
    );
}

function DetailModal({
    booking,
    company,
    onClose,
    onEdit,
    onCancel
}) {
    if (!booking) return null;

    const canManage =
        booking.company === company;

    return (
        <div className="modal-backdrop-custom">

            <div className="booking-modal detail-modal">

                <div className="modal-header-custom">

                    <div>
                        <div className="modal-title-custom">
                            Detail Orderan
                        </div>

                        <div className="modal-subtitle-custom">
                            {formatDate(booking.booking_date)}
                        </div>
                    </div>

                    <button
                        className="modal-close-btn"
                        onClick={onClose}
                    >
                        <i className="bi bi-x-lg"></i>
                    </button>

                </div>

                <div className="modal-body-custom">

                    <div className="detail-status">
                        <span
                            className={`status-badge ${STATUS_CLASS[booking.status] || ""}`}
                        >
                            {STATUS_LABEL[booking.status] || booking.status}
                        </span>

                        <span className="detail-company">
                            {booking.company}
                        </span>
                    </div>

                    <div className="detail-grid">

                        <div className="detail-item">
                            <span>Jenis Asset</span>
                            <strong>
                                {booking.asset_type || "-"}
                            </strong>
                        </div>

                        <div className="detail-item">
                            <span>Jumlah Asset</span>
                            <strong>
                                {booking.asset_count || 0}
                            </strong>
                        </div>

                        <div className="detail-item">
                            <span>Requester / PIC</span>
                            <strong>
                                {booking.requester || "-"}
                            </strong>
                        </div>

                        <div className="detail-item">
                            <span>Lokasi</span>
                            <strong>
                                {booking.location || "-"}
                            </strong>
                        </div>

                    </div>

                    <div className="detail-notes">

                        <span>
                            Catatan
                        </span>

                        <div>
                            {booking.notes || "Tidak ada catatan."}
                        </div>

                    </div>

                </div>

                <div className="modal-footer-custom">

                    {booking.status !== "CANCELLED" && canManage && (
                        <>
                            <button
                                className="btn-danger-custom"
                                onClick={onCancel}
                            >
                                <i className="bi bi-x-circle"></i>
                                Batalkan
                            </button>

                            <div className="detail-footer-spacer"></div>

                            <button
                                className="btn-secondary-custom"
                                onClick={onClose}
                            >
                                Tutup
                            </button>

                            <button
                                className="btn-primary-custom"
                                onClick={onEdit}
                            >
                                <i className="bi bi-pencil"></i>
                                Edit
                            </button>
                        </>
                    )}

                    {(booking.status === "CANCELLED" || !canManage) && (
                        <button
                            className="btn-secondary-custom"
                            onClick={onClose}
                        >
                            Tutup
                        </button>
                    )}

                </div>

            </div>

        </div>
    );
}

function UpcomingBookings({
    bookings,
    onOpen
}) {
    const today = getDateKey(new Date());

    const upcoming = bookings
        .filter(item =>
            item.booking_date >= today &&
            item.status !== "CANCELLED"
        )
        .sort((a, b) =>
            a.booking_date.localeCompare(b.booking_date)
        )
        .slice(0, 5);

    return (
        <div className="upcoming-card">

            <div className="section-header">

                <div>
                    <div className="section-title">
                        Upcoming Orderan
                    </div>

                    <div className="section-subtitle">
                        Jadwal booking terdekat
                    </div>
                </div>

                <i className="bi bi-calendar-event section-icon"></i>

            </div>

            {upcoming.length === 0 ? (

                <div className="empty-upcoming">

                    <i className="bi bi-calendar-x"></i>

                    <div>
                        Belum ada orderan terdekat
                    </div>

                </div>

            ) : (

                <div className="upcoming-list">

                    {upcoming.map(item => (

                        <div
                            key={item.id}
                            className="upcoming-item"
                            onClick={() => onOpen(item)}
                        >

                            <div className="upcoming-date">

                                <strong>
                                    {new Date(
                                        `${item.booking_date}T00:00:00`
                                    ).getDate()}
                                </strong>

                                <span>
                                    {MONTH_NAMES[
                                        new Date(
                                            `${item.booking_date}T00:00:00`
                                        ).getMonth()
                                    ].substring(0, 3)}
                                </span>

                            </div>

                            <div className="upcoming-info">

                                <div className="upcoming-title">
                                    {item.asset_type || "Booking QC"}
                                </div>

                                <div className="upcoming-meta">
                                    {item.company}
                                    {" • "}
                                    {item.asset_count || 0} asset
                                    {" • "}
                                    {item.location || "-"}
                                </div>

                                <div className="upcoming-requester">
                                    {item.requester || "Requester belum diisi"}
                                </div>

                            </div>

                            <span
                                className={`status-badge ${STATUS_CLASS[item.status] || ""}`}
                            >
                                {STATUS_LABEL[item.status] || item.status}
                            </span>

                        </div>

                    ))}

                </div>

            )}

        </div>
    );
}


function ToastNotification({ toast, onClose }) {
    if (!toast) return null;

    return (
        <div className={`calendar-toast ${toast.type || "error"}`} role="alert">
            <div className="calendar-toast-icon">
                <i className={
                    toast.type === "success"
                        ? "bi bi-check-circle-fill"
                        : toast.type === "warning"
                            ? "bi bi-exclamation-triangle-fill"
                            : "bi bi-x-circle-fill"
                }></i>
            </div>
            <div className="calendar-toast-content">
                {toast.title && <strong>{toast.title}</strong>}
                <span>{toast.message}</span>
            </div>
            <button type="button" className="calendar-toast-close" onClick={onClose} aria-label="Tutup notifikasi">
                <i className="bi bi-x-lg"></i>
            </button>
        </div>
    );
}

function ConfirmPopup({ confirm, onCancel, onConfirm }) {
    if (!confirm) return null;

    return (
        <div className="calendar-confirm-backdrop">
            <div className="calendar-confirm-popup" role="dialog" aria-modal="true">
                <div className="calendar-confirm-icon">
                    <i className="bi bi-question-lg"></i>
                </div>
                <div className="calendar-confirm-title">
                    {confirm.title || "Konfirmasi"}
                </div>
                <div className="calendar-confirm-message">
                    {confirm.message}
                </div>
                <div className="calendar-confirm-actions">
                    <button type="button" className="calendar-confirm-cancel" onClick={onCancel}>
                        Batal
                    </button>
                    <button type="button" className="calendar-confirm-ok" onClick={onConfirm}>
                        {confirm.confirmText || "Ya, Lanjutkan"}
                    </button>
                </div>
            </div>
        </div>
    );
}

function CalendarApp() {
    const initialCompany =
        CALENDAR_CONFIG.company || "PGI";

    const [company, setCompany] =
        useState(initialCompany);

    const [currentDate, setCurrentDate] =
        useState(new Date());

    const [bookings, setBookings] =
        useState([]);

    const [summary, setSummary] =
        useState({
            total: 0,
            confirmed: 0,
            tentative: 0,
            cancelled: 0
        });

    const [loading, setLoading] =
        useState(true);

    const [saving, setSaving] =
        useState(false);

    const [error, setError] =
        useState("");

    const [toast, setToast] =
        useState(null);

    const [confirmPopup, setConfirmPopup] =
        useState(null);

    function showToast(message, type = "error", title = null) {
        setToast({ message, type, title });
    }

    function closeToast() {
        setToast(null);
    }

    useEffect(() => {
        if (!toast) return;

        const timer = setTimeout(() => {
            setToast(null);
        }, 4500);

        return () => clearTimeout(timer);
    }, [toast]);

    function showConfirm(message, onConfirm, title = "Konfirmasi", confirmText = "Ya, Lanjutkan") {
        setConfirmPopup({ message, onConfirm, title, confirmText });
    }

    function closeConfirm() {
        setConfirmPopup(null);
    }

    const [formOpen, setFormOpen] =
        useState(false);

    const [detailBooking, setDetailBooking] =
        useState(null);

    const [formMode, setFormMode] =
        useState("create");

    const [form, setForm] =
        useState({
            company:
                initialCompany === "ALL"
                    ? "PGI"
                    : initialCompany,

            booking_date:
                getDateKey(new Date()),

            asset_type: "",

            asset_count: 0,

            requester: "",

            location: "Head Office Jl. Panjang Arteri",

            notes: "",

            status: "CONFIRMED"
        });

    const monthString =
        getMonthString(currentDate);

    async function loadCalendar() {
        setLoading(true);
        setError("");

        try {
            // Kalender GA selalu menampilkan booking PGI + PEI.
            // company tetap dipakai untuk identitas session/sidebar dan default company form.
            const response = await fetch(
                `/api/calendar?month=${encodeURIComponent(
                    monthString
                )}&company=ALL`
            );

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(
                    data.message ||
                    "Gagal mengambil data kalender."
                );
            }

            setBookings(data.bookings || []);

            setSummary(
                data.summary || {
                    total: 0,
                    confirmed: 0,
                    tentative: 0,
                    cancelled: 0
                }
            );

        } catch (err) {
            console.error(err);

            setError(
                err.message ||
                "Gagal mengambil data kalender."
            );

        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadCalendar();
    }, [monthString, company]);

    function goPreviousMonth() {
        setCurrentDate(
            new Date(
                currentDate.getFullYear(),
                currentDate.getMonth() - 1,
                1
            )
        );
    }

    function goNextMonth() {
        setCurrentDate(
            new Date(
                currentDate.getFullYear(),
                currentDate.getMonth() + 1,
                1
            )
        );
    }

    function goToday() {
        setCurrentDate(new Date());
    }

    function openCreateForm(date = null) {
        const selectedDate = date || getDateKey(new Date());
        const selectedDateObj = new Date(`${selectedDate}T00:00:00`);

        if (isPastDate(selectedDate)) {
            showToast(
                "Tanggal yang sudah lewat tidak dapat digunakan untuk booking.",
                "warning",
                "Tanggal Tidak Tersedia"
            );
            return;
        }

        if (isHoliday(selectedDateObj, selectedDate)) {
            showToast(
                `Tanggal ${formatDate(selectedDate)} tidak dapat dibooking karena merupakan hari libur/tanggal merah.`,
                "warning",
                "Tanggal Merah"
            );
            return;
        }

        setFormMode("create");

        setForm({
            company:
                company === "ALL"
                    ? "PGI"
                    : company,

            booking_date:
                selectedDate,

            asset_type: "",

            asset_count: 0,

            requester: "",

            location: "Head Office Jl. Panjang Arteri",

            notes: "",

            status: "CONFIRMED"
        });

        setFormOpen(true);
    }

    function openEditForm(booking) {
        if (booking.company !== company) {
            showToast(
                "Booking perusahaan lain hanya dapat dilihat.",
                "warning",
                "Akses Ditolak"
            );
            return;
        }

        setDetailBooking(null);

        setFormMode("edit");

        setForm({
            company: booking.company,
            booking_date: booking.booking_date,
            asset_type: booking.asset_type || "",
            asset_count: booking.asset_count || 0,
            requester: booking.requester || "",
            location: "Head Office Jl. Panjang Arteri",
            notes: booking.notes || "",
            status:
                booking.status === "CANCELLED"
                    ? "CANCELLED"
                    : "CONFIRMED"
        });

        setEditingId(booking.id);

        setFormOpen(true);
    }

    const [editingId, setEditingId] =
        useState(null);

    async function handleSubmit(e) {
        e.preventDefault();

        setSaving(true);
        setError("");

        try {
            const isEdit =
                formMode === "edit";

            if (isPastDate(form.booking_date)) {
                throw new Error("Tidak dapat membuat atau menyimpan booking pada tanggal yang sudah lewat.");
            }

            const bookingDateObj = new Date(`${form.booking_date}T00:00:00`);

            if (isHoliday(bookingDateObj, form.booking_date)) {
                throw new Error("Tidak dapat membuat atau menyimpan booking pada hari libur/tanggal merah.");
            }

            const url = isEdit
                ? `/api/calendar/${editingId}`
                : "/api/calendar";

            const method = isEdit
                ? "PUT"
                : "POST";

            const response = await fetch(url, {
                method,
                headers: {
                    "Content-Type":
                        "application/json"
                },
                body: JSON.stringify(form)
            });

            const data =
                await response.json();

            if (!response.ok || !data.success) {

                if (data.conflict) {
                    const existing =
                        data.existingBookings || [];

                    const companyNames =
                        existing
                            .map(item =>
                                `${item.company} (${STATUS_LABEL[item.status] || item.status})`
                            )
                            .join(", ");

                    throw new Error(
                        `Tanggal ${form.booking_date} sudah dibooking: ${companyNames}`
                    );
                }

                throw new Error(
                    data.message ||
                    "Gagal menyimpan booking."
                );
            }

            setFormOpen(false);
            setEditingId(null);

            await loadCalendar();

            showToast(
                isEdit
                    ? "Perubahan booking berhasil disimpan."
                    : "Booking berhasil dibuat.",
                "success",
                "Berhasil"
            );

        } catch (err) {
            console.error(err);

            showToast(
                err.message ||
                "Gagal menyimpan booking.",
                "error",
                "Gagal Menyimpan"
            );

        } finally {
            setSaving(false);
        }
    }

    function handleCancel() {
        if (!detailBooking) return;

        if (detailBooking.company !== company) {
            showToast(
                "Booking perusahaan lain hanya dapat dilihat.",
                "warning",
                "Akses Ditolak"
            );
            return;
        }

        showConfirm(
            `Batalkan booking tanggal ${formatDate(detailBooking.booking_date)}?`,
            async () => {
                try {
                    const response = await fetch(
                        `/api/calendar/${detailBooking.id}/cancel`,
                        { method: "PATCH" }
                    );

                    const data = await response.json();

                    if (!response.ok || !data.success) {
                        throw new Error(
                            data.message ||
                            "Gagal membatalkan booking."
                        );
                    }

                    setDetailBooking(null);
                    await loadCalendar();

                    showToast(
                        "Booking berhasil dibatalkan.",
                        "success",
                        "Berhasil"
                    );
                } catch (err) {
                    console.error(err);
                    showToast(
                        err.message ||
                        "Gagal membatalkan booking.",
                        "error",
                        "Gagal Membatalkan"
                    );
                }
            },
            "Batalkan Booking",
            "Ya, Batalkan"
        );
    }

    function handleDateClick(dateKey) {
        const date = new Date(`${dateKey}T00:00:00`);
        const dayBookings =
            bookings.filter(
                item =>
                    item.booking_date === dateKey
            );

        if (dayBookings.length === 0 && isHoliday(date, dateKey)) {
            showToast(
                `Tanggal ${formatDate(dateKey)} tidak dapat dibooking karena merupakan hari libur/tanggal merah.`,
                "warning",
                "Tanggal Merah"
            );
            return;
        }

        if (dayBookings.length > 0) {

            if (dayBookings.length === 1) {
                setDetailBooking(
                    dayBookings[0]
                );
            } else {
                setDetailBooking(
                    dayBookings[0]
                );
            }

            return;
        }

        openCreateForm(dateKey);
    }

    return (
        <>
            <ToastNotification toast={toast} onClose={closeToast} />

            <ConfirmPopup
                confirm={confirmPopup}
                onCancel={closeConfirm}
                onConfirm={async () => {
                    const action = confirmPopup?.onConfirm;
                    closeConfirm();
                    if (action) await action();
                }}
            />

            <div className="dashboard-shell">

            <Sidebar
                company={company}
                currentPage="calendar"
            />

            <main className="calendar-main">

                <Header
                    onAdd={() => openCreateForm()}
                />

                {error && (
                    <div className="calendar-error">
                        <i className="bi bi-exclamation-triangle"></i>
                        {error}
                    </div>
                )}

                <Summary
                    summary={summary}
                />

                <div className="calendar-content">

                    <Calendar
                        currentDate={currentDate}
                        bookings={bookings}
                        onDateClick={handleDateClick}
                        onPrevious={goPreviousMonth}
                        onNext={goNextMonth}
                        onToday={goToday}
                    />

                    <UpcomingBookings
                        bookings={bookings}
                        onOpen={setDetailBooking}
                    />

                </div>

                {loading && (
                    <div className="calendar-loading">
                        <div className="spinner-border"></div>
                        <span>
                            Memuat kalender...
                        </span>
                    </div>
                )}

            </main>

            <BookingModal
                open={formOpen}
                mode={formMode}
                form={form}
                setForm={setForm}
                onClose={() => {
                    if (!saving) {
                        setFormOpen(false);
                        setEditingId(null);
                    }
                }}
                onSubmit={handleSubmit}
                saving={saving}
            />

            <DetailModal
                booking={detailBooking}
                company={company}
                onClose={() =>
                    setDetailBooking(null)
                }
                onEdit={() =>
                    openEditForm(detailBooking)
                }
                onCancel={handleCancel}
            />

            </div>
        </>
    );
}

const rootElement =
    document.getElementById("calendar-root");

if (rootElement) {
    ReactDOM
        .createRoot(rootElement)
        .render(<CalendarApp />);
}