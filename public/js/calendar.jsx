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
    WAITING_APPROVAL: "Menunggu Approval",
    APPROVED: "Approved",
    REJECTED: "Rejected",
    CANCELLED: "Dibatalkan"
};

const STATUS_CLASS = {
    WAITING_APPROVAL: "waiting-approval",
    APPROVED: "approved",
    REJECTED: "rejected",
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
    const [darkTheme, setDarkTheme] = useState(() => localStorage.getItem("pgi-theme") === "dark");

    useEffect(() => {
        const theme = darkTheme ? "dark" : "light";
        document.documentElement.setAttribute("data-theme", theme);
        document.body.setAttribute("data-theme", theme);
        localStorage.setItem("pgi-theme", theme);
    }, [darkTheme]);

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
                       className={`calendar-event ${
                        item.status === "CANCELLED"
                            ? "cancelled"
                            : item.batch_status === "FINISHED"
                                ? "completed"
                                : STATUS_CLASS[item.status] || ""
                    } company-${String(item.company || "").toLowerCase()}`}
                     style={
                        item.status === "CANCELLED"
                            ? {
                                background: "#fff1f3",
                                color: "#b42318",
                                borderLeft: "3px solid #f04438",
                                textDecoration: "none"
                            }
                            : undefined
                    }
                        title={`${item.company} - ${item.requester||"-"}`}
                        onClick={(e) => {
                        e.stopPropagation();
                        onClick(item);
                    }}
                    >
                        <span className="event-company">
                            {item.company}
                        </span>

                        <span className="event-text">
                            {item.asset_type || "Booking QC"}
                        </span>

                        {item.batch_status === "FINISHED" && (
                            <span className="event-completed">
                                Selesai
                            </span>
                        )}
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
                        <i
                            className="legend-dot"
                            style={{ background: "#f59e0b" }}
                        ></i>
                        Menunggu Approval
                    </span>

                    <span>
                        <i
                            className="legend-dot"
                            style={{ background: "#10b981" }}
                        ></i>
                        Approved
                    </span>

                    <span>
                        <i
                            className="legend-dot"
                            style={{ background: "#ef4444" }}
                        ></i>
                        Rejected
                    </span>

                    <span>
                        <i
                            className="legend-dot"
                            style={{ background: "#6b7280" }}
                        ></i>
                        Dibatalkan
                    </span>

                    <span>
                        <i
                            className="legend-dot"
                            style={{ background: "#3b82f6" }}
                        ></i>
                        Selesai
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

    const assetCount =
        Number(form.asset_count);

    const assetCountInvalid =
        !Number.isInteger(assetCount) ||
        assetCount < 1 ||
        assetCount > 50;

    const assetCountOverLimit =
        Number.isFinite(assetCount) &&
        assetCount > 50;

    const bookingFormInvalid =
    !form.asset_type ||
    !form.asset_count ||
    !Number.isInteger(assetCount) ||
    assetCount < 1 ||
    assetCount > 50 ||
    !String(form.requester || "").trim();

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
                        type="button"
                        className="modal-close-btn"
                        onClick={onClose}
                        disabled={saving}
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
                                    required
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
                                    min="1"
                                    max="50"
                                    value={form.asset_count}
                                    onChange={(e) =>
                                        updateField(
                                            "asset_count",
                                            e.target.value
                                        )
                                    }
                                    placeholder="Contoh: 25"
                                    required
                                    style={{
                                        borderColor:
                                            assetCountOverLimit
                                                ? "#dc3545"
                                                : undefined,
                                        color:
                                            assetCountOverLimit
                                                ? "#dc3545"
                                                : undefined
                                    }}
                                />

                                {assetCountOverLimit && (
                                    <div
                                        style={{
                                            color: "#dc3545",
                                            fontSize: "12px",
                                            marginTop: "5px",
                                            fontWeight: "600"
                                        }}
                                    >
                                        <i className="bi bi-exclamation-circle me-1"></i>
                                        Jumlah aset maksimal 50 unit.
                                    </div>
                                )}

                                {!assetCountOverLimit &&
                                    form.asset_count !== "" &&
                                    assetCount < 1 && (
                                        <div
                                            style={{
                                                color: "#dc3545",
                                                fontSize: "12px",
                                                marginTop: "5px",
                                                fontWeight: "600"
                                            }}
                                        >
                                            <i className="bi bi-exclamation-circle me-1"></i>
                                            Jumlah aset minimal 1 unit.
                                        </div>
                                    )}

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
                            disabled={
                                saving ||
                                bookingFormInvalid
                            }
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

function BookingExcelSection({
    booking,
    company,
    onUploaded,
    onToast
}) {
    const [uploading, setUploading] = useState(false);

    const [handoverLoading, setHandoverLoading] = useState(false);
    const [handoverStatus, setHandoverStatus] = useState(null);
    const [receiverName, setReceiverName] = useState("");

    const [signatures, setSignatures] = useState([]);
    const [loadingSignatures, setLoadingSignatures] = useState(false);

    const canManage =
        booking &&
        booking.company === company;

    const hasExcel =
        Boolean(booking?.excel_path);

    const hasBatch =
        Boolean(booking?.batch_id);

    async function handleUpload(e) {
        const file =
            e.target.files?.[0];

        if (!file) return;

        const extension =
            file.name
                .toLowerCase()
                .split(".")
                .pop();

        if (!["xlsx", "xls"].includes(extension)) {
            onToast(
                "File harus berformat .xlsx atau .xls.",
                "warning",
                "Format File Tidak Valid"
            );

            e.target.value = "";
            return;
        }

        setUploading(true);

        try {
            const formData =
                new FormData();

            formData.append(
                "excel",
                file
            );

            const response =
                await fetch(
                    `/api/calendar/${booking.id}/excel`,
                    {
                        method: "POST",
                        body: formData
                    }
                );

            const data =
                await response.json();

            if (!response.ok || !data.success) {
                throw new Error(
                    data.message ||
                    "Gagal mengupload file Excel."
                );
            }

            onToast(
                "File Excel berhasil disimpan sebagai preparation.",
                "success",
                "Upload Berhasil"
            );

            if (onUploaded) {
                await onUploaded(
                    data.booking
                );
            }

        } catch (error) {

            console.error(
                "Upload Excel error:",
                error
            );

            onToast(
                error.message ||
                "Gagal mengupload file Excel.",
                "error",
                "Upload Gagal"
            );

        } finally {

            setUploading(false);

            e.target.value = "";

        }
    }

    return (
        <div className="booking-excel-section">

            <div className="booking-excel-header">

                <div>
                    <div className="booking-excel-title">
                        <i className="bi bi-file-earmark-excel"></i>
                        File Excel
                    </div>

                    <div className="booking-excel-subtitle">
                        File preparation untuk proses QC Inventaris
                    </div>
                </div>

            </div>

            {!hasExcel &&
                booking.status === "WAITING_APPROVAL" && (
                    <div
                        style={{
                            padding: "12px 14px",
                            marginBottom: "12px",
                            borderRadius: "10px",
                            background: "#fff8e1",
                            color: "#856404",
                            fontSize: "13px",
                            fontWeight: "600"
                        }}
                    >
                        <i className="bi bi-hourglass-split me-2"></i>
                        Booking sedang menunggu approval Staff IT.
                        Upload Excel dapat dilakukan setelah booking disetujui.
                    </div>
                )}

            {!hasExcel &&
                booking.status === "REJECTED" && (
                    <div
                        style={{
                            padding: "12px 14px",
                            marginBottom: "12px",
                            borderRadius: "10px",
                            background: "#fee2e2",
                            color: "#b42318",
                            fontSize: "13px",
                            fontWeight: "600"
                        }}
                    >
                        <i className="bi bi-x-circle me-2"></i>
                        Booking ditolak karena tanggal tersebut telah
                        disetujui untuk company lain.
                    </div>
                )}


            {hasExcel ? (

                <div className="booking-excel-file">

                    <div className="booking-excel-file-icon">
                        <i className="bi bi-file-earmark-spreadsheet"></i>
                    </div>

                    <div className="booking-excel-file-info">

                        <strong>
                            {booking.excel_original_name ||
                                "File Excel"}
                        </strong>

                        <span>
                            File Excel sudah tersedia
                        </span>

                    </div>

                    {canManage &&
                        booking.status === "APPROVED" &&
                        !hasBatch && (
                            <label className="booking-excel-upload-again">

                                <input
                                    type="file"
                                    accept=".xlsx,.xls"
                                    onChange={handleUpload}
                                    disabled={uploading}
                                    hidden
                                />

                                {uploading ? (
                                    <>
                                        <span className="spinner-border spinner-border-sm"></span>
                                        Upload...
                                    </>
                                ) : (
                                    <>
                                        <i className="bi bi-arrow-repeat"></i>
                                        Ganti File
                                    </>
                                )}

                            </label>
                        )}

                </div>

            ) : (
                canManage &&
                booking.status === "APPROVED" && (

                    <label className="booking-excel-upload">

                        <input
                            type="file"
                            accept=".xlsx,.xls"
                            onChange={handleUpload}
                            disabled={uploading}
                            hidden
                        />

                        <i className="bi bi-cloud-arrow-up"></i>

                        <div>
                            <strong>
                                {uploading
                                    ? "Mengupload..."
                                    : "Upload File Excel"}
                            </strong>

                            <span>
                                Format .xlsx atau .xls
                            </span>
                        </div>

                    </label>

                )

            )}


            {hasBatch && (
                <div className="booking-batch-info">

                    <div className="booking-batch-icon">
                        <i className="bi bi-box-seam"></i>
                    </div>

                    <div className="booking-batch-text">

                        <strong>
                            Batch sudah dibuat
                        </strong>

                        <span>
                            {booking.batch_code ||
                                `Batch #${booking.batch_id}`}
                        </span>

                    </div>

                    <a
                        href={`/batch/${booking.batch_id}`}
                        className="booking-batch-button"
                    >
                        <i className="bi bi-box-arrow-up-right"></i>
                        Lihat Batch
                    </a>

                </div>
            )}

        </div>
    );
}

function GaToItHandoverSection({
    booking,
    company,
    onToast
}) {
    const [loading, setLoading] = useState(false);
    const [creating, setCreating] = useState(false);
    const [approving, setApproving] = useState(false);

    const [handoverStatus, setHandoverStatus] = useState(null);

    // ==========================================
    // CURRENT USER / ROLE
    // ==========================================
    const currentUser = window.__CURRENT_USER__ || {};

    const userRole = String(
        currentUser.role || ""
    )
        .trim()
        .toUpperCase();

    const isGA = userRole === "GA";
    const isIT = userRole === "IT";

    // ==========================================
    // DIGITAL SIGNATURE
    // ==========================================
    const [signatures, setSignatures] = useState([]);
    const [loadingSignatures, setLoadingSignatures] =
        useState(false);

    // Sender = Staff GA saat CREATE
    const [senderName, setSenderName] = useState("");

    // Receiver = Staff IT saat APPROVAL
    const [receiverName, setReceiverName] = useState("");

    // ==========================================
    // LOAD DIGITAL SIGNATURE
    // ==========================================
    async function loadSignatures() {
        try {
            setLoadingSignatures(true);

            const response = await fetch(
                "/api/handover/signatures"
            );

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(
                    data.message ||
                    "Gagal mengambil data digital signature."
                );
            }

            const list = Array.isArray(data.signatures)
                ? data.signatures
                : [];

            setSignatures(list);

        } catch (error) {
            console.error(
                "Load digital signature error:",
                error
            );

            onToast(
                error.message ||
                "Gagal mengambil data digital signature.",
                "error",
                "Gagal Memuat Signature"
            );

        } finally {
            setLoadingSignatures(false);
        }
    }

    // ==========================================
    // LOAD HANDOVER STATUS
    // ==========================================
    async function loadHandoverStatus() {
        if (!booking?.batch_id) return;

        setLoading(true);

        try {
            const response = await fetch(
                `/api/handover/batch/${booking.batch_id}/status`
            );

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(
                    data.message ||
                    "Gagal mengambil status tanda terima."
                );
            }

            setHandoverStatus(data);

            // Jika sudah ada receiver dari data sebelumnya
            if (data.ga_to_it?.receiver_name) {
                setReceiverName(
                    data.ga_to_it.receiver_name
                );
            }

            // Jika sudah ada sender dari data sebelumnya
            if (data.ga_to_it?.sender_name) {
                setSenderName(
                    data.ga_to_it.sender_name
                );
            }

        } catch (error) {
            console.error(
                "Load handover status error:",
                error
            );

            onToast(
                error.message ||
                "Gagal mengambil status tanda terima.",
                "error",
                "Gagal Memuat Handover"
            );

        } finally {
            setLoading(false);
        }
    }

    // ==========================================
    // LOAD SAAT BATCH TERSEDIA
    // ==========================================
    useEffect(() => {
        if (
            company === booking?.company &&
            booking?.batch_id
        ) {
            loadSignatures();
            loadHandoverStatus();
        }
    }, [booking?.batch_id, company]);

    // ==========================================
    // FILTER STAFF GA BERDASARKAN COMPANY
    // ==========================================

    const gaStaff = signatures.filter((item) => {
        const jabatan =
            String(item.jabatan || "")
                .trim()
                .toLowerCase();

        const nama =
            String(item.nama || "")
                .trim();

        if (jabatan !== "general affairs") {
            return false;
        }

        if (company === "PGI") {
            return nama === "Sabilal Ihza";
        }

        if (company === "PEI") {
            return nama === "Irgi";
        }

        return false;
    });

    // ==========================================
    // FILTER STAFF IT
    // ==========================================
    const itStaff = signatures.filter(
        (item) =>
            String(item.jabatan || "")
                .trim()
                .toLowerCase() === "it support"
    );

    // ==========================================
    // SELECTED SENDER
    // ==========================================
    const selectedSender = signatures.find(
        (item) =>
            String(item.nama || "").trim() ===
            String(senderName || "").trim()
    );

    // ==========================================
    // SELECTED RECEIVER
    // ==========================================
    const selectedReceiver = signatures.find(
        (item) =>
            String(item.nama || "").trim() ===
            String(receiverName || "").trim()
    );

    // ==========================================
    // CREATE GA → IT
    // ==========================================
    async function handleCreateHandover() {
        const name = String(
            senderName || ""
        ).trim();

        if (!name) {
            onToast(
                "Silakan pilih Staff GA yang menyerahkan.",
                "warning",
                "Data Belum Lengkap"
            );

            return;
        }

        if (!selectedSender) {
            onToast(
                "Digital signature Staff GA tidak ditemukan.",
                "warning",
                "Signature Tidak Ditemukan"
            );

            return;
        }

        setCreating(true);

        try {
            const response = await fetch(
                "/api/handover/ga-to-it",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({
                        batch_id:
                            booking.batch_id,

                        sender_name: name
                    })
                }
            );

            const data =
                await response.json();

            if (!response.ok || !data.success) {
                throw new Error(
                    data.message ||
                    "Gagal membuat tanda terima GA → IT."
                );
            }

            onToast(
                "Tanda terima GA → IT berhasil dibuat.",
                "success",
                "Berhasil"
            );

            // Receiver memang kosong saat CREATE
            setReceiverName("");

            await loadHandoverStatus();

        } catch (error) {
            console.error(
                "Create handover error:",
                error
            );

            onToast(
                error.message ||
                "Gagal membuat tanda terima GA → IT.",
                "error",
                "Gagal Membuat Handover"
            );

        } finally {
            setCreating(false);
        }
    }

    // ==========================================
    // APPROVE GA → IT
    // ==========================================
    async function handleApproveHandover() {
        const handoverId =
            handoverStatus?.ga_to_it?.id;

        const receiver =
            String(receiverName || "").trim();

        if (!handoverId) {
            return;
        }

        if (!receiver) {
            onToast(
                "Silakan pilih Staff IT yang menerima.",
                "warning",
                "Penerima Belum Dipilih"
            );

            return;
        }

        if (!selectedReceiver) {
            onToast(
                "Digital signature Staff IT tidak ditemukan.",
                "warning",
                "Signature Tidak Ditemukan"
            );

            return;
        }

        setApproving(true);

        try {
            const response = await fetch(
                `/api/handover/ga-to-it/${handoverId}/approve`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({
                        receiver_name: receiver
                    })
                }
            );

            const data =
                await response.json();

            if (!response.ok || !data.success) {
                throw new Error(
                    data.message ||
                    "Gagal melakukan approval."
                );
            }

            onToast(
                "Tanda terima GA → IT berhasil di-approve.",
                "success",
                "Approval Berhasil"
            );

            await loadHandoverStatus();

        } catch (error) {
            console.error(
                "Approve handover error:",
                error
            );

            onToast(
                error.message ||
                "Gagal melakukan approval.",
                "error",
                "Approval Gagal"
            );

        } finally {
            setApproving(false);
        }
    }

    // ==========================================
    // HANDOVER
    // ==========================================
    const handover =
        handoverStatus?.ga_to_it;

    const approved =
        handoverStatus?.ga_to_it_approved === true;

    // ==========================================
    // COMPANY MATCH
    // ==========================================
    if (
        company !== booking?.company ||
        !booking?.batch_id
    ) {
        return null;
    }

    return (
        <div
            style={{
                marginTop: "18px",
                padding: "16px",
                border: "1px solid #dee2e6",
                borderRadius: "12px",
                background: "#fff"
            }}
        >

            {/* =====================================
                HEADER
            ===================================== */}
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "12px",
                    marginBottom: "14px"
                }}
            >
                <div>

                    <div
                        style={{
                            fontWeight: "700",
                            fontSize: "15px",
                            color: "#212529"
                        }}
                    >
                        <i className="bi bi-file-earmark-check me-2"></i>
                        Tanda Terima GA → IT
                    </div>

                    <div
                        style={{
                            fontSize: "12px",
                            color: "#6c757d",
                            marginTop: "3px"
                        }}
                    >
                        Dokumen serah terima sebelum proses QC
                        Inventaris
                    </div>

                </div>

                {loading && (
                    <span
                        style={{
                            fontSize: "12px",
                            color: "#6c757d"
                        }}
                    >
                        <span className="spinner-border spinner-border-sm me-1"></span>
                        Memuat...
                    </span>
                )}

            </div>

            {/* =====================================
                BELUM ADA HANDOVER
            ===================================== */}
            {!loading && !handover && (
                <>
                    <div
                        style={{
                            padding: "12px",
                            borderRadius: "8px",
                            background: "#f8f9fa",
                            marginBottom: "12px"
                        }}
                    >
                        <div
                            style={{
                                fontSize: "12px",
                                color: "#6c757d",
                                marginBottom: "5px"
                            }}
                        >
                            Batch
                        </div>

                        <strong>
                            {booking.batch_code ||
                                `Batch #${booking.batch_id}`}
                        </strong>
                    </div>

                    {/* =================================
                        MENYERAHKAN / STAFF GA
                    ================================= */}
                    {isGA && (
                        <>
                            <div
                                className="form-group"
                                style={{
                                    marginBottom: "12px"
                                }}
                            >
                                <label>
                                    Menyerahkan / Staff GA
                                </label>

                                <select
                                    value={senderName}
                                    onChange={(e) =>
                                        setSenderName(
                                            e.target.value
                                        )
                                    }
                                    disabled={
                                        creating ||
                                        loadingSignatures
                                    }
                                    style={{
                                        width: "100%"
                                    }}
                                >
                                    <option value="">
                                        {loadingSignatures
                                            ? "Memuat Staff GA..."
                                            : "-- Pilih Staff GA --"}
                                    </option>

                                    {gaStaff.map(
                                        (staff) => (
                                            <option
                                                key={
                                                    staff.id ||
                                                    staff.nama
                                                }
                                                value={
                                                    staff.nama
                                                }
                                            >
                                                {staff.nama}
                                            </option>
                                        )
                                    )}

                                </select>

                                <div
                                    style={{
                                        fontSize: "11px",
                                        color: "#6c757d",
                                        marginTop: "5px"
                                    }}
                                >
                                    Pilih Staff GA yang menyerahkan
                                    inventaris. Digital signature akan
                                    mengikuti nama Staff GA yang dipilih.
                                </div>

                            </div>

                            {/* =================================
                                SIGNATURE PREVIEW SENDER
                            ================================= */}
                            {selectedSender && (
                                <div
                                    style={{
                                        padding: "10px",
                                        marginBottom: "12px",
                                        borderRadius: "8px",
                                        background: "#f8f9fa"
                                    }}
                                >
                                    <div
                                        style={{
                                            fontSize: "11px",
                                            color: "#6c757d",
                                            marginBottom: "4px"
                                        }}
                                    >
                                        Digital Signature
                                    </div>

                                    <strong>
                                        {selectedSender.nama}
                                    </strong>

                                    <div
                                        style={{
                                            fontSize: "11px",
                                            color: "#6c757d"
                                        }}
                                    >
                                        {selectedSender.jabatan}
                                    </div>
                                </div>
                            )}

                            <button
                                type="button"
                                className="btn-primary-custom"
                                onClick={
                                    handleCreateHandover
                                }
                                disabled={
                                    creating ||
                                    loadingSignatures ||
                                    !senderName
                                }
                                style={{
                                    marginTop: "10px"
                                }}
                            >
                                {creating ? (
                                    <>
                                        <span className="spinner-border spinner-border-sm me-1"></span>
                                        Membuat Dokumen...
                                    </>
                                ) : (
                                    <>
                                        <i className="bi bi-file-earmark-check me-1"></i>
                                        Buat Tanda Terima
                                    </>
                                )}
                            </button>
                        </>
                    )}

                    {/* =================================
                        INFO UNTUK IT
                    ================================= */}
                    {isIT && (
                        <div
                            style={{
                                marginTop: "12px",
                                padding: "10px 12px",
                                borderRadius: "8px",
                                background: "#fff8e1",
                                color: "#856404",
                                fontSize: "12px",
                                fontWeight: "600"
                            }}
                        >
                            <i className="bi bi-hourglass-split me-1"></i>
                            Menunggu Staff GA membuat tanda terima
                            GA → IT.
                        </div>
                    )}

                </>
            )}

            {/* =====================================
                HANDOVER SUDAH ADA
            ===================================== */}
            {!loading && handover && (
                <>

                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns:
                                approved
                                    ? "repeat(4, minmax(0, 1fr))"
                                    : "repeat(3, minmax(0, 1fr))",
                            gap: "10px",
                            marginBottom: "12px"
                        }}
                    >

                        {/* MENYERAHKAN */}
                        <div
                            style={{
                                padding: "10px",
                                background: "#f8f9fa",
                                borderRadius: "8px"
                            }}
                        >
                            <div
                                style={{
                                    fontSize: "11px",
                                    color: "#6c757d"
                                }}
                            >
                                Menyerahkan
                            </div>

                            <strong>
                                {handover.sender_name ||
                                    "-"}
                            </strong>
                        </div>

                        {/* PENERIMA */}
                        <div
                            style={{
                                padding: "10px",
                                background: "#f8f9fa",
                                borderRadius: "8px"
                            }}
                        >
                            <div
                                style={{
                                    fontSize: "11px",
                                    color: "#6c757d"
                                }}
                            >
                                Menerima
                            </div>

                            <strong>
                                {handover.receiver_name ||
                                    "Menunggu Staff IT"}
                            </strong>
                        </div>

                        {/* ASSET */}
                        <div
                            style={{
                                padding: "10px",
                                background: "#f8f9fa",
                                borderRadius: "8px"
                            }}
                        >
                            <div
                                style={{
                                    fontSize: "11px",
                                    color: "#6c757d"
                                }}
                            >
                                Asset
                            </div>

                            <strong>
                                {handover.asset_count || 0}
                            </strong>
                        </div>

                        {/* STATUS */}
                        <div
                            style={{
                                padding: "10px",
                                background:
                                    approved
                                        ? "#d1fae5"
                                        : "#fff3cd",
                                borderRadius: "8px"
                            }}
                        >
                            <div
                                style={{
                                    fontSize: "11px",
                                    color: "#6c757d"
                                }}
                            >
                                Status
                            </div>

                            <strong
                                style={{
                                    color:
                                        approved
                                            ? "#047857"
                                            : "#856404"
                                }}
                            >
                                {approved
                                    ? "APPROVED"
                                    : "WAITING IT"}
                            </strong>
                        </div>

                        {/* APPROVED BY */}
                        {approved && (
                            <div
                                style={{
                                    padding: "10px",
                                    background: "#ecfdf5",
                                    borderRadius: "8px"
                                }}
                            >
                                <div
                                    style={{
                                        fontSize: "11px",
                                        color: "#6c757d"
                                    }}
                                >
                                    Approved By
                                </div>

                                <strong>
                                    {handover.approved_by ||
                                        "SYSTEM"}
                                </strong>
                            </div>
                        )}

                    </div>

                    {/* =================================
                        RECEIVER / STAFF IT
                        HANYA MUNCUL UNTUK IT
                        ================================= */}
                    {isIT &&
                        !approved &&
                        handover.status === "PENDING" && (
                            <div
                                className="form-group"
                                style={{
                                    marginBottom: "12px"
                                }}
                            >
                                <label>
                                    Menerima / Staff IT
                                </label>

                                <select
                                    value={receiverName}
                                    onChange={(e) =>
                                        setReceiverName(
                                            e.target.value
                                        )
                                    }
                                    disabled={
                                        approving ||
                                        loadingSignatures
                                    }
                                    style={{
                                        width: "100%"
                                    }}
                                >
                                    <option value="">
                                        {loadingSignatures
                                            ? "Memuat Staff IT..."
                                            : "-- Pilih Staff IT --"}
                                    </option>

                                    {itStaff.map(
                                        (staff) => (
                                            <option
                                                key={
                                                    staff.id ||
                                                    staff.nama
                                                }
                                                value={
                                                    staff.nama
                                                }
                                            >
                                                {staff.nama}
                                            </option>
                                        )
                                    )}

                                </select>

                                <div
                                    style={{
                                        fontSize: "11px",
                                        color: "#6c757d",
                                        marginTop: "5px"
                                    }}
                                >
                                    Pilih Staff IT yang menerima
                                    inventaris. Digital signature akan
                                    mengikuti nama Staff IT yang dipilih.
                                </div>

                                {selectedReceiver && (
                                    <div
                                        style={{
                                            padding: "10px",
                                            marginTop: "8px",
                                            borderRadius: "8px",
                                            background: "#f8f9fa"
                                        }}
                                    >
                                        <div
                                            style={{
                                                fontSize: "11px",
                                                color: "#6c757d",
                                                marginBottom: "4px"
                                            }}
                                        >
                                            Digital Signature
                                        </div>

                                        <strong>
                                            {selectedReceiver.nama}
                                        </strong>

                                        <div
                                            style={{
                                                fontSize: "11px",
                                                color: "#6c757d"
                                            }}
                                        >
                                            {selectedReceiver.jabatan}
                                        </div>
                                    </div>
                                )}

                            </div>
                        )}

                    {/* =================================
                        ACTION BUTTON
                    ================================= */}
                    <div
                        style={{
                            display: "flex",
                            gap: "8px",
                            flexWrap: "wrap"
                        }}
                    >

                        {handover.id && (
                            <a
                                href={`/api/handover/${handover.id}/pdf`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn-secondary-custom"
                            >
                                <i className="bi bi-file-pdf me-1"></i>
                                Lihat PDF
                            </a>
                        )}

                        {/* APPROVE HANYA UNTUK IT */}
                        {isIT &&
                            !approved &&
                            handover.status === "PENDING" && (
                                <button
                                    type="button"
                                    className="btn-primary-custom"
                                    onClick={
                                        handleApproveHandover
                                    }
                                    disabled={
                                        approving ||
                                        loadingSignatures ||
                                        !receiverName
                                    }
                                >
                                    {approving ? (
                                        <>
                                            <span className="spinner-border spinner-border-sm me-1"></span>
                                            Approving...
                                        </>
                                    ) : (
                                        <>
                                            <i className="bi bi-check-circle me-1"></i>
                                            Approve IT
                                        </>
                                    )}
                                </button>
                            )}

                    </div>

                    {/* =================================
                        INFO
                    ================================= */}
                    <div
                        style={{
                            marginTop: "12px",
                            padding: "10px 12px",
                            borderRadius: "8px",
                            background: approved
                                ? "#ecfdf5"
                                : "#fff8e1",
                            color: approved
                                ? "#047857"
                                : "#856404",
                            fontSize: "12px",
                            fontWeight: "600"
                        }}
                    >
                        {approved ? (
                            <>
                                <i className="bi bi-check-circle-fill me-1"></i>
                                Tanda terima telah disetujui.
                                QC Inventaris dapat dimulai.
                            </>
                        ) : (
                            <>
                                <i className="bi bi-hourglass-split me-1"></i>
                                Dokumen telah dibuat oleh Staff GA.
                                Menunggu Staff IT memilih
                                penerima dan melakukan approval.
                            </>
                        )}
                    </div>

                </>
            )}

        </div>
    );
}

function DetailModal({
    booking,
    company,
    onClose,
    onEdit,
    onCancel,
    onApprove,
    onToast,
    onUploaded
}) {
    if (!booking) return null;

    const canManage =
        booking.company === company;

    const currentUser =
    window.__CURRENT_USER__ || {};

    const userRole =
        String(currentUser.role || "")
            .trim()
            .toUpperCase();

    const isIT =
        userRole === "IT";

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

                    <BookingExcelSection
                        booking={booking}
                        company={company}
                        onToast={onToast}
                        onUploaded={onUploaded}
                    />

                    <GaToItHandoverSection
                        booking={booking}
                        company={company}
                        onToast={onToast}
                    />

                </div>

                <div className="modal-footer-custom">

                    {isIT &&
                        booking.status === "WAITING_APPROVAL" && (
                            <>
                                <button
                                    type="button"
                                    className="btn-primary-custom"
                                    onClick={() =>
                                        onApprove(booking)
                                    }
                                >
                                    <i className="bi bi-check-circle me-1"></i>
                                    Approve Booking
                                </button>

                                <div className="detail-footer-spacer"></div>
                            </>
                    )}

                    {booking.status !== "CANCELLED" &&
                        canManage &&
                        !booking.batch_id && (
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
    const today = getTodayKey();

    const UPCOMING_PER_PAGE = 5;

    const [currentPage, setCurrentPage] = useState(1);

    const upcoming = bookings
        .filter(item =>
            item.booking_date >= today &&
            item.status !== "CANCELLED"
        )
        .sort((a, b) =>
            a.booking_date.localeCompare(b.booking_date)
        );

    const totalPages = Math.max(
        1,
        Math.ceil(
            upcoming.length / UPCOMING_PER_PAGE
        )
    );

    const startIndex =
        (currentPage - 1) * UPCOMING_PER_PAGE;

    const currentUpcoming =
        upcoming.slice(
            startIndex,
            startIndex + UPCOMING_PER_PAGE
        );

    useEffect(() => {
        if (currentPage > totalPages) {
            setCurrentPage(totalPages);
        }
    }, [currentPage, totalPages]);

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

                <>

                    <div className="upcoming-list">

                        {currentUpcoming.map(item => (

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
                                    className={`status-badge ${
                                        item.batch_status === "FINISHED"
                                            ? "completed"
                                            : STATUS_CLASS[item.status] || ""
                                    }`}
                                >
                                    {item.batch_status === "FINISHED"
                                        ? "Selesai"
                                        : STATUS_LABEL[item.status] || item.status}
                                </span>

                            </div>

                        ))}

                    </div>


                    {totalPages > 1 && (

                        <div className="upcoming-pagination">

                            <button
                                type="button"
                                className="upcoming-pagination-btn"
                                onClick={() =>
                                    setCurrentPage(prev =>
                                        Math.max(1, prev - 1)
                                    )
                                }
                                disabled={currentPage === 1}
                            >
                                <i className="bi bi-chevron-left"></i>
                            </button>


                            <span className="upcoming-pagination-info">
                                {currentPage} / {totalPages}
                            </span>


                            <button
                                type="button"
                                className="upcoming-pagination-btn"
                                onClick={() =>
                                    setCurrentPage(prev =>
                                        Math.min(totalPages, prev + 1)
                                    )
                                }
                                disabled={currentPage === totalPages}
                            >
                                <i className="bi bi-chevron-right"></i>
                            </button>

                        </div>

                    )}

                </>

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

    const currentUser =
    window.__CURRENT_USER__ || {};

    const userRole =
        String(currentUser.role || "")
            .trim()
            .toUpperCase();

    const isIT =
        userRole === "IT";

    const isGA =
        userRole === "GA";

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

            location: "HO Jl. Panjang Arteri",

            notes: "",

            status: "WAITING_APPROVAL"
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

    async function refreshBookingAfterUpload(updatedBooking) {
    if (!updatedBooking) return;

    setDetailBooking(updatedBooking);

    await loadCalendar();
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

            location: "HO Jl. Panjang Arteri",

            notes: "",

            status: "WAITING_APPROVAL"
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
            location: "HO Jl. Panjang Arteri",
            notes: booking.notes || "",
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

    async function handleApproveBooking(booking) {

    if (!isIT) {
        showToast(
            "Hanya Staff IT yang dapat melakukan approval booking.",
            "warning",
            "Akses Ditolak"
        );
        return;
    }

    if (!booking?.id) {
        return;
    }

    if (booking.status !== "WAITING_APPROVAL") {
        showToast(
            "Booking ini sudah tidak menunggu approval.",
            "warning",
            "Approval Tidak Tersedia"
        );
        return;
    }

    showConfirm(
        `Approve booking ${booking.company} untuk tanggal ${formatDate(booking.booking_date)}?`,
        async () => {

            try {

                const response = await fetch(
                    `/api/calendar/${booking.id}/approve`,
                    {
                        method: "POST"
                    }
                );

                const data =
                    await response.json();

                if (!response.ok || !data.success) {
                    throw new Error(
                        data.message ||
                        "Gagal melakukan approval booking."
                    );
                }

                // Refresh kalender supaya:
                // booking terpilih = APPROVED
                // booking lain di tanggal sama = REJECTED
                await loadCalendar();

                // Update detail yang sedang terbuka
                if (data.booking) {
                    setDetailBooking(
                        data.booking
                    );
                }

                showToast(
                    `${booking.company} berhasil di-approve. Booking lain pada tanggal yang sama otomatis ditolak.`,
                    "success",
                    "Booking Approved"
                );

            } catch (err) {

                console.error(
                    "Approve booking error:",
                    err
                );

                showToast(
                    err.message ||
                    "Gagal melakukan approval booking.",
                    "error",
                    "Approval Gagal"
                );

            }

        },
        "Approve Booking",
        "Ya, Approve"
    );
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

        // Jika yang diklik adalah booking/event
        if (
            typeof dateKey === "object" &&
            dateKey !== null &&
            dateKey.id
        ) {
            setDetailBooking(dateKey);
            return;
        }

    const dayBookings =
        bookings.filter(
            item =>
                item.booking_date === dateKey
        );

        if (
            dayBookings.length === 0 &&
            isHoliday(
                new Date(`${dateKey}T00:00:00`),
                dateKey
            )
        ) {
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
                onApprove={handleApproveBooking}
                onToast={showToast}
                onUploaded={refreshBookingAfterUpload}
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
