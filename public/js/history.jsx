const { useState } = React;

const data = window.__HISTORY_DATA__ || {};


// =====================================================
// HELPER
// =====================================================

function number(value) {
    return new Intl.NumberFormat("id-ID")
        .format(Number(value || 0));
}

// =====================================================
// TOAST NOTIFICATION
// =====================================================

function HandoverToast({ toast, onClose }) {
    if (!toast) {
        return null;
    }

    const isSuccess = toast.type === "success";

    return (
        <div
            style={{
                position: "fixed",
                top: "20px",
                right: "20px",
                zIndex: 9999,
                minWidth: "320px",
                maxWidth: "420px",
                background: "#fff",
                border: `1px solid ${
                    isSuccess ? "#198754" : "#dc3545"
                }`,
                borderRadius: "10px",
                boxShadow:
                    "0 8px 25px rgba(0,0,0,0.15)",
                padding: "14px 16px",
                display: "flex",
                alignItems: "flex-start",
                gap: "12px"
            }}
        >

            <div
                style={{
                    fontSize: "22px",
                    lineHeight: "1",
                    color: isSuccess
                        ? "#198754"
                        : "#dc3545"
                }}
            >
                <i
                    className={
                        isSuccess
                            ? "bi bi-check-circle-fill"
                            : "bi bi-exclamation-circle-fill"
                    }
                ></i>
            </div>

            <div
                style={{
                    flex: 1
                }}
            >
                <div
                    style={{
                        fontWeight: "700",
                        fontSize: "13px",
                        marginBottom: "3px"
                    }}
                >
                    {toast.title}
                </div>

                <div
                    style={{
                        fontSize: "12px",
                        color: "#6c757d",
                        lineHeight: "1.4"
                    }}
                >
                    {toast.message}
                </div>
            </div>

            <button
                type="button"
                onClick={onClose}
                style={{
                    border: "none",
                    background: "transparent",
                    color: "#6c757d",
                    fontSize: "18px",
                    lineHeight: "1",
                    padding: "0",
                    cursor: "pointer"
                }}
            >
                ×
            </button>

        </div>
    );
}


// =====================================================
// SIDEBAR
// =====================================================

function Sidebar({ company, activeBatch }) {

    const [darkTheme, setDarkTheme] =
        useState(() =>
            localStorage.getItem("pgi-theme") === "dark"
        );


    React.useEffect(() => {

        const theme =
            darkTheme ? "dark" : "light";

        document.documentElement
            .setAttribute("data-theme", theme);

        document.body
            .setAttribute("data-theme", theme);

        localStorage.setItem(
            "pgi-theme",
            theme
        );

    }, [darkTheme]);


    return (

        <aside className="history-sidebar dashboard-sidebar">

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

                <a
                    className="sidebar-link"
                    href="/"
                >
                    <i className="bi bi-house-fill"></i>
                    <span>Dashboard</span>
                </a>


                <a
                    className="sidebar-link"
                    href="/inventaris"
                >
                    <i className="bi bi-list-ul"></i>
                    <span>Inventaris</span>
                </a>


                <a
                    className="sidebar-link"
                    href="/batch"
                >
                    <i
                        className={`bi ${
                            activeBatch
                                ? "bi-upload"
                                : "bi-plus-circle"
                        }`}
                    ></i>

                    <span>
                        {activeBatch
                            ? "Import Tambahan"
                            : "Import Batch Baru"}
                    </span>

                </a>


                <a
                    className="sidebar-link active"
                    href="/batch/history"
                >
                    <i className="bi bi-clock-history"></i>
                    <span>Riwayat Batch</span>
                </a>


                <a
                    className="sidebar-link"
                    href="/kalender"
                >
                    <i className="bi bi-calendar3"></i>
                    <span>Kalender</span>
                </a>

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

                        <i
                            className={`bi ${
                                company === "PGI"
                                    ? "bi-check-lg"
                                    : "bi-arrow-right"
                            }`}
                        ></i>

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

                        <i
                            className={`bi ${
                                company === "PEI"
                                    ? "bi-check-lg"
                                    : "bi-arrow-right"
                            }`}
                        ></i>

                    </button>

                </form>

            </div>

        </aside>

    );
}


// =====================================================
// BATCH CARD
// =====================================================

function BatchCard({
    batch,
    onCreate,
    onDetail
}) {
    const itToGaState =
        batch.it_to_ga_state ||
        "NOT_CREATED";

    // ==========================================
    // CURRENT USER / ROLE
    // ==========================================

    const currentUser =
        window.__CURRENT_USER__ ||
        data.user ||
        {};

    const userRole =
        String(currentUser.role || "")
            .trim()
            .toUpperCase();

    const isIT = userRole === "IT";
    const isGA = userRole === "GA";


    // ==========================================
    // STATUS HANDOVER
    // ==========================================

    const isNotCreated =
        itToGaState === "NOT_CREATED";

    const isPending =
        itToGaState === "PENDING";

    const isApproved =
        itToGaState === "APPROVED";


    return (
        <article className="history-card">

            {/* =====================================
                HEADER
            ===================================== */}

            <div className="history-card-head">

                <div>

                    <h2>
                        <i className="bi bi-box-seam me-2"></i>
                        {batch.batch_code}
                    </h2>

                    <p>
                        <i className="bi bi-file-earmark-excel me-1"></i>
                        {batch.batch_name}
                    </p>

                    <small>
                        <i className="bi bi-calendar-event me-1"></i>
                        Ditutup: {batch.closed_at || "-"}
                    </small>

                </div>

                <span className="badge bg-success">
                    SELESAI
                </span>

            </div>


            {/* =====================================
                STATS
            ===================================== */}

            <div className="history-stats">

                <div>
                    <strong>
                        {number(batch.total)}
                    </strong>

                    <span>
                        Total
                    </span>
                </div>


                <div>
                    <strong className="text-success">
                        {number(batch.done)}
                    </strong>

                    <span>
                        Done
                    </span>
                </div>


                <div>
                    <strong className="text-danger">
                        {number(batch.reject)}
                    </strong>

                    <span>
                        Reject
                    </span>
                </div>


                <div>
                    <strong className="text-warning">
                        {number(batch.pending)}
                    </strong>

                    <span>
                        Pending
                    </span>
                </div>

            </div>


            {/* =====================================
                ACTIONS
            ===================================== */}

            <div className="history-actions">

                {/* =================================
                    DETAIL
                ================================= */}

                <a
                    href={`/batch/${batch.id}`}
                    className="btn btn-outline-primary btn-sm"
                >
                    <i className="bi bi-eye me-1"></i>
                    Detail
                </a>


                {/* =================================
                    EXCEL
                ================================= */}

                <a
                    href={`/export/batch/${batch.id}`}
                    className="btn btn-outline-success btn-sm"
                >
                    <i className="bi bi-file-earmark-excel me-1"></i>
                    Excel
                </a>


                {/* =====================================
                    IT → GA
                ===================================== */}

                {["PGI", "PEI"].includes(
                    String(batch.company || "")
                        .toUpperCase()
                ) && (

                    <>

                        {/* =================================
                            NOT CREATED

                            IT  → bisa membuat
                            GA  → menunggu IT
                        ================================= */}

                        {isNotCreated && (

                            <button
                                type="button"
                                className={
                                    isIT
                                        ? "btn btn-danger btn-sm"
                                        : "btn btn-secondary btn-sm"
                                }
                                onClick={() => {
                                    if (isIT) {
                                        onCreate(batch);
                                    }
                                }}
                                disabled={!isIT}
                            >

                                {isIT ? (
                                    <>
                                        <i className="bi bi-receipt me-1"></i>
                                        Buat Tanda Terima
                                    </>
                                ) : (
                                    <>
                                        <i className="bi bi-hourglass-split me-1"></i>
                                        Waiting IT
                                    </>
                                )}

                            </button>

                        )}


                        {/* =================================
                            PENDING

                            IT  → menunggu GA
                            GA  → bisa buka / approve
                        ================================= */}

                        {isPending && (

                            <button
                                type="button"
                                className="btn btn-warning btn-sm"
                                onClick={() => {
                                    if (isGA) {
                                        onDetail(batch);
                                    }
                                }}
                                disabled={!isGA}
                            >

                                <i className="bi bi-hourglass-split me-1"></i>
                                Waiting GA

                            </button>

                        )}


                        {/* =================================
                            APPROVED
                        ================================= */}

                        {isApproved && (

                            <button
                                type="button"
                                className="btn btn-success btn-sm"
                                onClick={() =>
                                    onDetail(batch)
                                }
                            >

                                <i className="bi bi-check-circle me-1"></i>
                                Approved

                            </button>

                        )}

                    </>

                )}

            </div>

        </article>
    );
}

// =====================================================
// IT → GA MODAL
// =====================================================

function ItToGaModal({
    type,
    batch,
    loading,
    message,
    onClose,
    onCreate,
    onApprove
}) {

    const [signatures, setSignatures] =
        useState([]);

    const [senderName, setSenderName] =
        useState("");

    const [receiverName, setReceiverName] =
        useState("");

    const [loadingSignatures, setLoadingSignatures] =
        useState(false);


    // ==========================================
    // CURRENT USER / ROLE
    // ==========================================

    const currentUser =
        window.__CURRENT_USER__ ||
        data.user ||
        {};

    const userRole =
        String(currentUser.role || "")
            .trim()
            .toUpperCase();

    const isIT = userRole === "IT";
    const isGA = userRole === "GA";


    // ==========================================
    // LOAD ACTIVE SIGNATURES
    // ==========================================

    React.useEffect(() => {

        const loadSignatures = async () => {

            setLoadingSignatures(true);

            try {

                const response =
                    await fetch(
                        "/api/handover/signatures"
                    );

                const result =
                    await response.json();

                if (
                    !response.ok ||
                    !result.success
                ) {

                    throw new Error(
                        result.message ||
                        "Gagal mengambil daftar signature."
                    );

                }

                setSignatures(
                    Array.isArray(result.signatures)
                        ? result.signatures
                        : []
                );

            } catch (error) {

                console.error(
                    "LOAD SIGNATURE ERROR:",
                    error
                );

            } finally {

                setLoadingSignatures(false);

            }

        };

        loadSignatures();

    }, []);


    // ==========================================
    // FILTER STAFF IT
    // ==========================================

    const itStaff =
        signatures.filter(
            (signature) =>
                String(
                    signature.jabatan || ""
                )
                    .trim()
                    .toLowerCase() ===
                "it support"
        );

    // ==========================================
    // FILTER STAFF GA BERDASARKAN COMPANY
    // ==========================================

    const gaStaff = signatures.filter((signature) => {
        const jabatan = String(
            signature.jabatan || ""
        )
            .trim()
            .toLowerCase();

        const nama = String(
            signature.nama || ""
        )
            .trim()
            .toLowerCase();

        if (jabatan !== "general affairs") {
            return false;
        }

        // PEI → hanya Irgi
        if (data.company === "PEI") {
            return nama === "irgi";
        }

        // PGI → hanya Sabilal Ihza
        if (data.company === "PGI") {
            return nama === "sabilal ihza";
        }

        return false;
    });


    // ==========================================
    // EXISTING HANDOVER
    // ==========================================

    const handover =
        batch.it_to_ga || null;

    const isApproved =
        batch.it_to_ga_state ===
        "APPROVED";


    // ==========================================
    // CREATE IT → GA
    // HANYA IT
    // ==========================================

    const handleCreate = () => {

        if (!isIT) {
            return;
        }

        if (!senderName) {
            return;
        }

        onCreate(senderName);

    };


    // ==========================================
    // APPROVE IT → GA
    // HANYA GA
    // ==========================================

    const handleApprove = () => {

        if (!isGA) {
            return;
        }

        if (!receiverName) {
            return;
        }

        onApprove(receiverName);

    };


    // ==========================================
    // MODAL
    // ==========================================

    return (

        <div
            className="modal fade show"
            style={{
                display: "block",
                backgroundColor:
                    "rgba(0,0,0,0.55)"
            }}
            role="dialog"
            aria-modal="true"
        >

            <div
                className="modal-dialog modal-dialog-centered"
                style={{
                    maxWidth:
                        type === "DETAIL"
                            ? "680px"
                            : "520px",
                    width: "calc(100% - 28px)",
                    margin: "1rem auto"
                }}
            >

                <div
                    className="modal-content"
                    style={{
                        borderRadius: "12px",
                        overflow: "hidden"
                    }}
                >


                    {/* =================================
                        HEADER
                    ================================= */}

                    <div
                        className="modal-header"
                        style={{
                            padding: "12px 18px"
                        }}
                    >

                        <h5
                            className="modal-title"
                            style={{
                                fontSize: "17px",
                                fontWeight: "700"
                            }}
                        >

                            {type === "CREATE"
                                ? "Buat Tanda Terima"
                                : "Tanda Terima IT → GA"}

                        </h5>

                        <button
                            type="button"
                            className="btn-close"
                            onClick={onClose}
                            disabled={loading}
                        ></button>

                    </div>


                    {/* =================================
                        BODY
                    ================================= */}

                    <div
                        className="modal-body"
                        style={{
                            padding:
                                type === "DETAIL"
                                    ? "14px 18px 16px"
                                    : "16px 20px"
                        }}
                    >


                        {/* ==================================
                            CREATE
                            HANYA IT
                        ================================== */}

                        {type === "CREATE" && isIT && (

                            <>

                                {/* BATCH */}

                                <div className="mb-3">

                                    <label className="form-label fw-semibold">
                                        Batch
                                    </label>

                                    <input
                                        type="text"
                                        className="form-control"
                                        value={
                                            batch.batch_code ||
                                            ""
                                        }
                                        disabled
                                    />

                                </div>


                                {/* =================================
                                    MENYERAHKAN / STAFF IT
                                ================================= */}

                                <div className="mb-3">

                                    <label className="form-label fw-semibold">
                                        Menyerahkan
                                    </label>

                                    <select
                                        className="form-select"
                                        value={senderName}
                                        onChange={(e) =>
                                            setSenderName(
                                                e.target.value
                                            )
                                        }
                                        disabled={
                                            loading ||
                                            loadingSignatures
                                        }
                                    >

                                        <option value="">
                                            {loadingSignatures
                                                ? "Memuat Staff IT..."
                                                : "-- Pilih Staff IT --"}
                                        </option>

                                        {itStaff.map(
                                            (signature) => (

                                                <option
                                                    key={
                                                        signature.id ||
                                                        signature.nama
                                                    }
                                                    value={
                                                        signature.nama
                                                    }
                                                >

                                                    {signature.nama}

                                                    {signature.jabatan
                                                        ? ` - ${signature.jabatan}`
                                                        : ""}

                                                </option>

                                            )
                                        )}

                                    </select>

                                    <div className="form-text">
                                        Pilih Staff IT yang menyerahkan
                                        barang. Signature digital akan
                                        mengikuti nama yang dipilih.
                                    </div>

                                </div>


                                {/* INFO */}

                                <div
                                    className="alert alert-info mb-0"
                                    style={{
                                        fontSize: "13px",
                                        padding: "10px 12px"
                                    }}
                                >

                                    <i className="bi bi-info-circle me-2"></i>

                                    Setelah dibuat, Tanda Terima akan
                                    berstatus{" "}

                                    <strong>
                                        Waiting GA
                                    </strong>

                                    {" "}dengan nama dan signature
                                    penerima masih kosong.

                                </div>

                            </>

                        )}


                        {/* ==================================
                            DETAIL / APPROVAL
                        ================================== */}

                        {type === "DETAIL" && (

                            <>

                                {/* =================================
                                    STATUS HEADER COMPACT
                                ================================= */}

                                <div
                                    className="text-center"
                                    style={{
                                        marginBottom: "14px"
                                    }}
                                >

                                    <div
                                        className={
                                            isApproved
                                                ? "text-success"
                                                : "text-warning"
                                        }
                                        style={{
                                            fontSize: "30px",
                                            lineHeight: "1"
                                        }}
                                    >

                                        <i
                                            className={
                                                isApproved
                                                    ? "bi bi-check-circle-fill"
                                                    : "bi bi-hourglass-split"
                                            }
                                        ></i>

                                    </div>

                                    <div
                                        style={{
                                            fontWeight: "700",
                                            fontSize: "16px",
                                            marginTop: "5px",
                                            marginBottom: "4px"
                                        }}
                                    >
                                        Tanda Terima IT → GA
                                    </div>

                                    <span
                                        className={
                                            isApproved
                                                ? "badge bg-success"
                                                : "badge bg-warning text-dark"
                                        }
                                        style={{
                                            fontSize: "10px"
                                        }}
                                    >

                                        {isApproved
                                            ? "APPROVED"
                                            : "WAITING GA"}

                                    </span>

                                </div>


                                {/* =================================
                                    DATA LANDSCAPE
                                ================================= */}

                                <div
                                    style={{
                                        display: "grid",
                                        gridTemplateColumns:
                                            "1.2fr 0.85fr 1.25fr 0.7fr",
                                        gap: "10px",
                                        alignItems: "start"
                                    }}
                                >


                                    {/* =================================
                                        BATCH
                                    ================================= */}

                                    <div>

                                        <label
                                            className="form-label text-muted"
                                            style={{
                                                fontSize: "11px",
                                                marginBottom: "4px"
                                            }}
                                        >
                                            Batch
                                        </label>

                                        <div
                                            style={{
                                                background: "#f8f9fa",
                                                border: "1px solid #e9ecef",
                                                borderRadius: "7px",
                                                padding: "8px 9px",
                                                minHeight: "38px",
                                                display: "flex",
                                                alignItems: "center",
                                                fontWeight: "600",
                                                fontSize: "12px",
                                                whiteSpace: "nowrap",
                                                overflow: "hidden",
                                                textOverflow: "ellipsis"
                                            }}
                                            title={batch.batch_code}
                                        >
                                            {batch.batch_code}
                                        </div>

                                    </div>


                                    {/* =================================
                                        MENYERAHKAN
                                    ================================= */}

                                    <div>

                                        <label
                                            className="form-label text-muted"
                                            style={{
                                                fontSize: "11px",
                                                marginBottom: "4px"
                                            }}
                                        >
                                            Menyerahkan
                                        </label>

                                        <div
                                            style={{
                                                background: "#f8f9fa",
                                                border: "1px solid #e9ecef",
                                                borderRadius: "7px",
                                                padding: "8px 9px",
                                                minHeight: "38px",
                                                display: "flex",
                                                alignItems: "center",
                                                fontWeight: "600",
                                                fontSize: "12px"
                                            }}
                                        >
                                            {handover?.sender_name || "-"}
                                        </div>

                                    </div>


                                    {/* =================================
                                        MENERIMA
                                    ================================= */}

                                    <div>

                                        <label
                                            className="form-label text-muted"
                                            style={{
                                                fontSize: "11px",
                                                marginBottom: "4px"
                                            }}
                                        >
                                            Menerima
                                        </label>


                                        {/* SUDAH APPROVED */}

                                        {isApproved ? (

                                            <div
                                                style={{
                                                    background: "#f8f9fa",
                                                    border: "1px solid #e9ecef",
                                                    borderRadius: "7px",
                                                    padding: "8px 9px",
                                                    minHeight: "38px",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    fontWeight: "600",
                                                    fontSize: "12px"
                                                }}
                                            >
                                                {handover?.receiver_name || "-"}
                                            </div>

                                        ) : isGA ? (

                                            /* =================================
                                                GA PILIH PENERIMA
                                            ================================= */

                                            <>

                                                <select
                                                    className="form-select"
                                                    value={receiverName}
                                                    onChange={(e) =>
                                                        setReceiverName(
                                                            e.target.value
                                                        )
                                                    }
                                                    disabled={
                                                        loading ||
                                                        loadingSignatures
                                                    }
                                                    style={{
                                                        height: "38px",
                                                        minHeight: "38px",
                                                        padding: "5px 28px 5px 8px",
                                                        fontSize: "12px"
                                                    }}
                                                >

                                                    <option value="">
                                                        {loadingSignatures
                                                            ? "Memuat..."
                                                            : "-- Pilih Staff GA --"}
                                                    </option>

                                                    {gaStaff.map(
                                                        (signature) => (

                                                            <option
                                                                key={
                                                                    signature.id ||
                                                                    signature.nama
                                                                }
                                                                value={
                                                                    signature.nama
                                                                }
                                                            >

                                                                {signature.nama}

                                                                {signature.jabatan
                                                                    ? ` - ${signature.jabatan}`
                                                                    : ""}

                                                            </option>

                                                        )
                                                    )}

                                                </select>

                                                <div
                                                    style={{
                                                        fontSize: "9px",
                                                        color: "#6c757d",
                                                        marginTop: "3px",
                                                        lineHeight: "1.2"
                                                    }}
                                                >
                                                    Signature mengikuti nama yang dipilih.
                                                </div>

                                            </>

                                        ) : (

                                            /* =================================
                                                IT HANYA MELIHAT STATUS
                                            ================================= */

                                            <div
                                                style={{
                                                    background: "#f8f9fa",
                                                    border: "1px solid #e9ecef",
                                                    borderRadius: "7px",
                                                    padding: "8px 9px",
                                                    minHeight: "38px",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    color: "#6c757d",
                                                    fontSize: "11px"
                                                }}
                                            >
                                                Menunggu Staff GA
                                            </div>

                                        )}

                                    </div>


                                    {/* =================================
                                        STATUS
                                    ================================= */}

                                    <div>

                                        <label
                                            className="form-label text-muted"
                                            style={{
                                                fontSize: "11px",
                                                marginBottom: "4px"
                                            }}
                                        >
                                            Status
                                        </label>

                                        <div
                                            style={{
                                                background:
                                                    isApproved
                                                        ? "#ecfdf5"
                                                        : "#fff8e1",
                                                border:
                                                    isApproved
                                                        ? "1px solid #a7f3d0"
                                                        : "1px solid #ffe69c",
                                                borderRadius: "7px",
                                                padding: "8px",
                                                minHeight: "38px",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center"
                                            }}
                                        >

                                            <span
                                                className={
                                                    isApproved
                                                        ? "badge bg-success"
                                                        : "badge bg-warning text-dark"
                                                }
                                                style={{
                                                    fontSize: "10px"
                                                }}
                                            >

                                                {isApproved
                                                    ? "APPROVED"
                                                    : "PENDING"}

                                            </span>

                                        </div>

                                    </div>

                                </div>


                                {/* =================================
                                    APPROVED BY
                                ================================= */}

                                {handover?.approved_by && (

                                    <div
                                        style={{
                                            marginTop: "10px",
                                            fontSize: "11px",
                                            color: "#6c757d"
                                        }}
                                    >

                                        Approved By:{" "}

                                        <strong
                                            style={{
                                                color: "#212529"
                                            }}
                                        >
                                            {handover.approved_by}
                                        </strong>

                                    </div>

                                )}


                                {/* =================================
                                    ERROR
                                ================================= */}

                                {message && (

                                    <div
                                        className="alert alert-danger mb-0"
                                        style={{
                                            marginTop: "10px",
                                            padding: "8px 10px",
                                            fontSize: "12px"
                                        }}
                                    >

                                        <i className="bi bi-exclamation-circle me-2"></i>

                                        {message}

                                    </div>

                                )}

                            </>

                        )}


                        {/* ==================================
                            CREATE ERROR
                        ================================== */}

                        {message &&
                            type === "CREATE" && (

                                <div
                                    className="alert alert-danger mt-3 mb-0"
                                    style={{
                                        fontSize: "12px",
                                        padding: "8px 10px"
                                    }}
                                >

                                    <i className="bi bi-exclamation-circle me-2"></i>

                                    {message}

                                </div>

                            )}

                    </div>


                    {/* =================================
                        FOOTER
                    ================================= */}

                    <div
                        className="modal-footer"
                        style={{
                            padding: "10px 18px",
                            gap: "6px"
                        }}
                    >


                        <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            onClick={onClose}
                            disabled={loading}
                        >
                            Batal
                        </button>


                        {/* =================================
                            CREATE
                            HANYA IT
                        ================================= */}

                        {type === "CREATE" &&
                            isIT && (

                                <button
                                    type="button"
                                    className="btn btn-danger btn-sm"
                                    onClick={handleCreate}
                                    disabled={
                                        loading ||
                                        loadingSignatures ||
                                        !senderName
                                    }
                                >

                                    {loading ? (

                                        <>

                                            <span className="spinner-border spinner-border-sm me-2"></span>
                                            Membuat...

                                        </>

                                    ) : (

                                        <>

                                            <i className="bi bi-receipt me-1"></i>
                                            Buat Tanda Terima

                                        </>

                                    )}

                                </button>

                            )}


                        {/* =================================
                            VIEW PDF
                        ================================= */}

                        {type === "DETAIL" &&
                            handover?.id && (

                                <a
                                    href={`/api/handover/${handover.id}/pdf`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="btn btn-outline-primary btn-sm"
                                >

                                    <i className="bi bi-file-earmark-pdf me-1"></i>
                                    Lihat PDF

                                </a>

                            )}


                        {/* =================================
                            APPROVE
                            HANYA GA
                        ================================= */}

                        {type === "DETAIL" &&
                            isGA &&
                            !isApproved &&
                            handover?.id && (

                                <button
                                    type="button"
                                    className="btn btn-success btn-sm"
                                    onClick={handleApprove}
                                    disabled={
                                        loading ||
                                        loadingSignatures ||
                                        !receiverName
                                    }
                                >

                                    {loading ? (

                                        <>

                                            <span className="spinner-border spinner-border-sm me-2"></span>
                                            Memproses...

                                        </>

                                    ) : (

                                        <>

                                            <i className="bi bi-check-lg me-1"></i>
                                            APPROVED

                                        </>

                                    )}

                                </button>

                            )}

                    </div>

                </div>

            </div>

        </div>

    );
}
// =====================================================
// GLOBAL HISTORY SEARCH RESULT
// =====================================================

function SearchResultCard({ item }) {

    const status = String(item.status || "")
        .trim()
        .toUpperCase();

    const statusClass =
        status === "DONE"
            ? "bg-success"
            : status === "REJECT"
                ? "bg-secondary"
                : "bg-warning text-dark";

    const jenis = String(item.jenis || "")
        .trim()
        .toLowerCase();

    // Ringkasan QC hanya untuk Laptop yang sudah DONE
    const showLaptopQc =
        status === "DONE" &&
        jenis === "laptop";

    // Untuk REJECT tampilkan alasan reject + Last QC
    const showRejectInfo =
        status === "REJECT";

    const lastQc =
        item.last_qc || "-";

    return (
        <article
            style={{
                background: "#fff",
                border: "1px solid #e5e7eb",
                borderRadius: "12px",
                padding: "18px",
                boxShadow: "0 3px 12px rgba(15, 23, 42, 0.05)",
                marginBottom: "12px"
            }}
        >

            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    gap: "12px",
                    marginBottom: "14px",
                    flexWrap: "wrap"
                }}
            >

                <div>
                    <div
                        style={{
                            fontSize: "12px",
                            color: "#6b7280",
                            marginBottom: "4px"
                        }}
                    >
                        <i className="bi bi-box-seam me-1"></i>
                        {item.batch_code || "-"}
                    </div>

                    <h3
                        style={{
                            margin: 0,
                            fontSize: "16px",
                            fontWeight: 700,
                            color: "#111827"
                        }}
                    >
                        {item.merk || "Merk tidak tersedia"}
                        {item.type ? ` • ${item.type}` : ""}
                    </h3>

                    <div
                        style={{
                            marginTop: "4px",
                            fontSize: "12px",
                            color: "#6b7280"
                        }}
                    >
                        {item.batch_name || "Nama batch tidak tersedia"}
                    </div>
                </div>

                <span className={`badge ${statusClass}`}>
                    {status || "-"}
                </span>

            </div>

            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                    gap: "10px"
                }}
            >

                <div
                    style={{
                        background: "#f8fafc",
                        borderRadius: "8px",
                        padding: "10px 12px"
                    }}
                >
                    <div
                        style={{
                            fontSize: "10px",
                            color: "#6b7280",
                            textTransform: "uppercase",
                            letterSpacing: "0.04em"
                        }}
                    >
                        NF
                    </div>
                    <strong
                        style={{
                            display: "block",
                            marginTop: "3px",
                            fontSize: "13px",
                            wordBreak: "break-all"
                        }}
                    >
                        {item.nf || "-"}
                    </strong>
                </div>

                <div
                    style={{
                        background: "#f8fafc",
                        borderRadius: "8px",
                        padding: "10px 12px"
                    }}
                >
                    <div
                        style={{
                            fontSize: "10px",
                            color: "#6b7280",
                            textTransform: "uppercase",
                            letterSpacing: "0.04em"
                        }}
                    >
                        IMEI
                    </div>
                    <strong
                        style={{
                            display: "block",
                            marginTop: "3px",
                            fontSize: "13px",
                            wordBreak: "break-all"
                        }}
                    >
                        {item.imei || "-"}
                    </strong>
                </div>

                <div
                    style={{
                        background: "#f8fafc",
                        borderRadius: "8px",
                        padding: "10px 12px"
                    }}
                >
                    <div
                        style={{
                            fontSize: "10px",
                            color: "#6b7280",
                            textTransform: "uppercase",
                            letterSpacing: "0.04em"
                        }}
                    >
                        Jenis
                    </div>
                    <strong
                        style={{
                            display: "block",
                            marginTop: "3px",
                            fontSize: "13px"
                        }}
                    >
                        {item.jenis || "-"}
                    </strong>
                </div>

                <div
                    style={{
                        background: "#f8fafc",
                        borderRadius: "8px",
                        padding: "10px 12px"
                    }}
                >
                    <div
                        style={{
                            fontSize: "10px",
                            color: "#6b7280",
                            textTransform: "uppercase",
                            letterSpacing: "0.04em"
                        }}
                    >
                        Batch
                    </div>
                    <strong
                        style={{
                            display: "block",
                            marginTop: "3px",
                            fontSize: "13px"
                        }}
                    >
                        {item.batch_code || "-"}
                    </strong>
                </div>

            </div>

            {/* =====================================
                QC SUMMARY - LAPTOP DONE
            ===================================== */}

            {showLaptopQc && (

                <div
                    style={{
                        marginTop: "12px",
                        padding: "12px",
                        background: "#f8fafc",
                        border: "1px solid #e5e7eb",
                        borderRadius: "9px"
                    }}
                >

                    <div
                        style={{
                            fontSize: "12px",
                            fontWeight: 700,
                            color: "#111827",
                            marginBottom: "9px"
                        }}
                    >
                        <i className="bi bi-clipboard-check me-1"></i>
                        Ringkasan QC
                    </div>

                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
                            gap: "8px"
                        }}
                    >

                        <div
                            style={{
                                background: "#fff",
                                border: "1px solid #edf0f3",
                                borderRadius: "7px",
                                padding: "8px 10px"
                            }}
                        >
                            <div style={{ fontSize: "9px", color: "#6b7280", textTransform: "uppercase" }}>
                                Nama QC
                            </div>
                            <strong style={{ display: "block", marginTop: "2px", fontSize: "12px" }}>
                                {item.qc_name || "-"}
                            </strong>
                        </div>

                        <div
                            style={{
                                background: "#fff",
                                border: "1px solid #edf0f3",
                                borderRadius: "7px",
                                padding: "8px 10px"
                            }}
                        >
                            <div style={{ fontSize: "9px", color: "#6b7280", textTransform: "uppercase" }}>
                                SSD Storage
                            </div>
                            <strong style={{ display: "block", marginTop: "2px", fontSize: "12px" }}>
                                {item.ssd || "-"}
                            </strong>
                        </div>

                        <div
                            style={{
                                background: "#fff",
                                border: "1px solid #edf0f3",
                                borderRadius: "7px",
                                padding: "8px 10px"
                            }}
                        >
                            <div style={{ fontSize: "9px", color: "#6b7280", textTransform: "uppercase" }}>
                                SSD Health
                            </div>
                            <strong style={{ display: "block", marginTop: "2px", fontSize: "12px" }}>
                                {item.ssd_health || "-"}
                            </strong>
                        </div>

                        <div
                            style={{
                                background: "#fff",
                                border: "1px solid #edf0f3",
                                borderRadius: "7px",
                                padding: "8px 10px"
                            }}
                        >
                            <div style={{ fontSize: "9px", color: "#6b7280", textTransform: "uppercase" }}>
                                Battery Health (BH)
                            </div>
                            <strong style={{ display: "block", marginTop: "2px", fontSize: "12px" }}>
                                {item.bh || "-"}
                            </strong>
                        </div>

                    </div>

                    <div
                        style={{
                            marginTop: "8px",
                            paddingTop: "8px",
                            borderTop: "1px solid #e5e7eb",
                            fontSize: "10px",
                            color: "#6b7280"
                        }}
                    >
                        <i className="bi bi-clock-history me-1"></i>
                        Last QC: <strong style={{ color: "#374151" }}>{lastQc}</strong>
                    </div>

                </div>

            )}


            {/* =====================================
                REJECT INFO
            ===================================== */}

            {showRejectInfo && (

                <div
                    style={{
                        marginTop: "12px",
                        padding: "12px",
                        background: "#fff7f7",
                        border: "1px solid #f1d2d2",
                        borderRadius: "9px"
                    }}
                >

                    <div
                        style={{
                            fontSize: "12px",
                            fontWeight: 700,
                            color: "#b42318",
                            marginBottom: "7px"
                        }}
                    >
                        <i className="bi bi-exclamation-octagon-fill me-1"></i>
                        Alasan Reject
                    </div>

                    <div
                        style={{
                            fontSize: "12px",
                            color: "#7f1d1d",
                            lineHeight: "1.5"
                        }}
                    >
                        {item.reject_reason || "-"}
                    </div>

                    <div
                        style={{
                            marginTop: "8px",
                            paddingTop: "8px",
                            borderTop: "1px solid #f1d2d2",
                            fontSize: "10px",
                            color: "#6b7280"
                        }}
                    >
                        <i className="bi bi-clock-history me-1"></i>
                        Last QC: <strong style={{ color: "#374151" }}>{lastQc}</strong>
                    </div>

                </div>

            )}


            <div
                style={{
                    marginTop: "12px",
                    paddingTop: "10px",
                    borderTop: "1px solid #f0f2f5",
                    fontSize: "11px",
                    color: "#6b7280",
                    display: "flex",
                    gap: "16px",
                    flexWrap: "wrap"
                }}
            >
                <span>
                    <i className="bi bi-calendar-check me-1"></i>
                    Ditutup: {item.closed_at || "-"}
                </span>

                <span>
                    <i className="bi bi-building me-1"></i>
                    Company: {item.company || "-"}
                </span>
            </div>

        </article>
    );
}

// =====================================================
// HISTORY APP
// =====================================================

function HistoryApp() {

    const [history, setHistory] =
        useState(data.history || []);


    const [page, setPage] =
        useState(1);


    const [modalType, setModalType] =
        useState(null);


    const [selectedBatch, setSelectedBatch] =
        useState(null);


    const [loading, setLoading] =
        useState(false);


    const [message, setMessage] =
        useState("");

    const [toast, setToast] =
        useState(null);


    // ==========================================
    // GLOBAL SEARCH
    // ==========================================

    const [searchKeyword, setSearchKeyword] =
        useState("");

    const [searchStatus, setSearchStatus] =
        useState("");

    const [searchJenis, setSearchJenis] =
        useState("");

    const [searchResults, setSearchResults] =
        useState([]);

    const [searchLoading, setSearchLoading] =
        useState(false);

    const [searchMode, setSearchMode] =
        useState(false);

    const [searchError, setSearchError] =
        useState("");


    const pageSize = 5;


    const pageCount =
        Math.max(
            1,
            Math.ceil(
                history.length / pageSize
            )
        );


    const currentPage =
        Math.min(
            page,
            pageCount
        );


    const visible =
        history.slice(
            (currentPage - 1) * pageSize,
            currentPage * pageSize
        );


    // ==========================================
    // GLOBAL SEARCH HANDLER
    // ==========================================

    const handleSearch = async () => {

        const keyword =
            String(searchKeyword || "").trim();

        if (!keyword) {

            setSearchError(
                "Masukkan NF, IMEI, Merk, atau Type terlebih dahulu."
            );

            setSearchMode(false);
            setSearchResults([]);

            return;

        }

        setSearchLoading(true);
        setSearchError("");

        try {

            const params =
                new URLSearchParams();

            params.set("q", keyword);

            if (searchStatus) {
                params.set(
                    "status",
                    searchStatus
                );
            }

            if (searchJenis) {
                params.set(
                    "jenis",
                    searchJenis
                );
            }

            const response =
                await fetch(
                    `/batch/history/search?${params.toString()}`,
                    {
                        headers: {
                            Accept: "application/json"
                        }
                    }
                );

            const result =
                await response.json();

            if (
                !response.ok ||
                !result.success
            ) {
                throw new Error(
                    result.message ||
                    "Gagal melakukan pencarian riwayat."
                );
            }

            setSearchResults(
                Array.isArray(result.data)
                    ? result.data
                    : []
            );

            setSearchMode(true);
            setPage(1);

        } catch (error) {

            setSearchResults([]);
            setSearchMode(true);
            setSearchError(
                error.message ||
                "Gagal melakukan pencarian riwayat."
            );

        } finally {

            setSearchLoading(false);

        }

    };


    // ==========================================
    // RESET GLOBAL SEARCH
    // ==========================================

    const handleResetSearch = () => {

        setSearchKeyword("");
        setSearchStatus("");
        setSearchJenis("");
        setSearchResults([]);
        setSearchMode(false);
        setSearchError("");
        setPage(1);

    };


    // ==========================================
    // SEARCH ENTER KEY
    // ==========================================

    const handleSearchKeyDown = (event) => {

        if (event.key === "Enter") {
            handleSearch();
        }

    };


    // ==========================================
    // OPEN CREATE
    // ==========================================

    const openCreateModal = (batch) => {

        setSelectedBatch(batch);

        setMessage("");

        setModalType("CREATE");

    };


    // ==========================================
    // OPEN DETAIL
    // ==========================================

    const openDetailModal = (batch) => {

        setSelectedBatch(batch);

        setMessage("");

        setModalType("DETAIL");

    };


    // ==========================================
    // CLOSE MODAL
    // ==========================================

    const closeModal = () => {

        if (loading) {
            return;
        }

        setModalType(null);

        setSelectedBatch(null);

        setMessage("");

    };


    // ==========================================
    // UPDATE LOCAL STATE
    // ==========================================

    const updateBatchState = (
        batchId,
        handover,
        state
    ) => {

        setHistory((prev) =>

            prev.map((batch) =>

                batch.id === batchId

                    ? {
                        ...batch,

                        it_to_ga:
                            handover,

                        it_to_ga_state:
                            state
                    }

                    : batch

            )

        );

    };


// ==========================================
// CREATE IT → GA
// ==========================================

const createItToGa = async (
    senderName
) => {

    if (!selectedBatch) {
        return;
    }


    if (!senderName) {

        setMessage(
            "Nama Staff IT yang menyerahkan wajib dipilih."
        );

        return;

    }


    setLoading(true);

    setMessage("");


    try {

        const response =
            await fetch(
                "/api/handover/it-to-ga",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({

                        batch_id:
                            selectedBatch.id,

                        sender_name:
                            senderName

                    })

                }
            );


        const result =
            await response.json();


        if (
            !response.ok ||
            !result.success
        ) {

            throw new Error(
                result.message ||
                "Gagal membuat Tanda Terima."
            );

        }


        // ==========================================
        // AMBIL DATA HANDOVER LENGKAP
        // ==========================================

        const handoverResponse =
            await fetch(
                `/api/handover/batch/${selectedBatch.id}`
            );


        const handoverResult =
            await handoverResponse.json();


        const createdHandover =
            (
                handoverResult.handovers ||
                []
            ).find(
                (item) =>
                    item.direction ===
                        "IT_TO_GA" &&
                    item.id ===
                        result.handover_id
            );

        const handoverData =
            createdHandover || {
                id: result.handover_id,
                status: "PENDING",
                pdf_path: result.pdf_path,
                sender_name: senderName,
                receiver_name: null
            };

        updateBatchState(
            selectedBatch.id,
            handoverData,
            "PENDING"
        );

        // ==========================================
        // TOAST SUCCESS CREATE
        // ==========================================

        setToast({
            type: "success",
            title: "Tanda Terima Berhasil Dibuat",
            message:
                `Tanda Terima IT → GA untuk ${selectedBatch.batch_code} berhasil dibuat. Menunggu approval Staff GA.`
        });

        setModalType(null);
        setSelectedBatch(null);


    } catch (error) {

        setMessage(
            error.message
        );


    } finally {

        setLoading(false);

    }

};


// ==========================================
// APPROVE IT → GA
// ==========================================

const approveItToGa = async (
    receiverName
) => {

    if (
        !selectedBatch ||
        !selectedBatch.it_to_ga
    ) {
        return;
    }


    const handoverId =
        selectedBatch.it_to_ga.id;


    if (!handoverId) {

        setMessage(
            "Handover ID tidak ditemukan."
        );

        return;

    }


    if (!receiverName) {

        setMessage(
            "Nama Staff GA yang menerima wajib dipilih."
        );

        return;

    }


    setLoading(true);

    setMessage("");


    try {

        const response =
            await fetch(
                `/api/handover/it-to-ga/${handoverId}/approve`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({

                        receiver_name:
                            receiverName

                    })

                }
            );


        const result =
            await response.json();


        if (
            !response.ok ||
            !result.success
        ) {

            throw new Error(
                result.message ||
                "Gagal melakukan approval."
            );

        }


        updateBatchState(
            selectedBatch.id,
            result.handover,
            "APPROVED"
        );


        setSelectedBatch({

            ...selectedBatch,

            it_to_ga:
                result.handover,

            it_to_ga_state:
                "APPROVED"

        });

        // ==========================================
        // TOAST SUCCESS APPROVED
        // ==========================================

        setToast({
            type: "success",
            title: "Tanda Terima Berhasil Di-approve",
            message:
                `Tanda Terima IT → GA untuk ${selectedBatch.batch_code} sudah APPROVED oleh ${receiverName}.`
        });


    } catch (error) {

        setMessage(
            error.message
        );


    } finally {

        setLoading(false);

    }

};


    return (

        <div className="history-shell">

            <HandoverToast
                toast={toast}
                onClose={() => setToast(null)}
            />


            <Sidebar
                company={
                    data.company || "PGI"
                }
                activeBatch={
                    data.activeBatch
                }
            />


            <main className="history-main">


                <header className="history-hero">

                    <div>

                        <div className="history-eyebrow">

                            <i className="bi bi-clock-history me-2"></i>

                            Arsip Proses QC

                        </div>


                        <h1>
                            Riwayat Batch
                        </h1>


                        <p>
                            Daftar batch inventaris yang sudah selesai diproses.
                        </p>

                    </div>


                    <a
                        href="/batch"
                        className="btn btn-primary"
                    >

                        <i className="bi bi-upload me-2"></i>

                        Menu Import

                    </a>

                </header>


                {/* GLOBAL SEARCH */}

                <section
                    style={{
                        marginBottom: "18px"
                    }}
                >

                        <div
                            style={{
                                display: "grid",
                                gridTemplateColumns: "minmax(0, 1fr) 220px 220px 120px 120px",
                                alignItems: "center",
                                gap: "10px",
                                width: "100%"
                            }}
                        >

                        <div
                            style={{
                                minWidth: 0,
                                position: "relative"
                            }}
                        >

                            <i
                                className="bi bi-search"
                                style={{
                                    position: "absolute",
                                    left: "9px",
                                    top: "50%",
                                    transform: "translateY(-50%)",
                                    color: "#607080",
                                    fontSize: "12px",
                                    zIndex: 2
                                }}
                            ></i>

                            <input
                                type="text"
                                className="form-control"
                                value={searchKeyword}
                                onChange={(event) =>
                                    setSearchKeyword(
                                        event.target.value
                                    )
                                }
                                onKeyDown={handleSearchKeyDown}
                                placeholder="Cari NF / Merk / Type..."
                                style={{
                                    height: "50px",
                                    paddingLeft: "29px",
                                    fontSize: "14px",
                                    borderColor: "#d8dee7",
                                    borderRadius: "4px",
                                    boxShadow: "none"
                                }}
                            />

                        </div>


                        <select
                            className="form-select"
                            value={searchStatus}
                            onChange={(event) =>
                                setSearchStatus(
                                    event.target.value
                                )
                            }
                            style={{
                                width: "100%",
                                height: "50px",
                                fontSize: "14px",
                                borderColor: "#d8dee7",
                                borderRadius: "4px",
                                boxShadow: "none"
                            }}
                        >

                            <option value="">
                                Semua Status
                            </option>

                            <option value="PENDING">
                                Pending
                            </option>

                            <option value="DONE">
                                Done
                            </option>

                            <option value="REJECT">
                                Reject
                            </option>

                        </select>


                        <select
                            className="form-select"
                            value={searchJenis}
                            onChange={(event) =>
                                setSearchJenis(
                                    event.target.value
                                )
                            }
                            style={{
                                width: "100%",
                                height: "50px",
                                fontSize: "14px",
                                borderColor: "#d8dee7",
                                borderRadius: "4px",
                                boxShadow: "none"
                            }}
                        >

                            <option value="">
                                Semua Jenis
                            </option>

                            <option value="Laptop">
                                Laptop
                            </option>

                            <option value="Handphone">
                                Handphone
                            </option>

                            <option value="PC All in One">
                                PC All in One
                            </option>

                            <option value="Tablet">
                                Tablet
                            </option>

                        </select>


                        <button
                            type="button"
                            className="btn btn-primary"
                            onClick={handleSearch}
                            disabled={searchLoading}
                            style={{
                                height: "50px",
                                minWidth: "100%",
                                padding: "0 11px",
                                fontSize: "14px",
                                borderRadius: "4px",
                                whiteSpace: "nowrap"
                            }}
                        >

                            <i className="bi bi-funnel-fill me-1"></i>

                            {searchLoading
                                ? "..."
                                : "Filter"}

                        </button>


                        <button
                            type="button"
                            className="btn btn-light"
                            onClick={handleResetSearch}
                            disabled={searchLoading}
                            style={{
                                height: "50px",
                                minWidth: "100%",
                                padding: "0 11px",
                                fontSize: "14px",
                                borderRadius: "4px",
                                border: "1px solid #d8dee7",
                                whiteSpace: "nowrap"
                            }}
                        >

                            <i className="bi bi-arrow-counterclockwise me-1"></i>
                            Reset

                        </button>

                    </div>


                    {searchError && (
                        <div
                            className="alert alert-warning mt-2 mb-0 py-2"
                            style={{
                                fontSize: "12px"
                            }}
                        >
                            <i className="bi bi-exclamation-circle me-1"></i>
                            {searchError}
                        </div>
                    )}

                </section>


                {searchMode ? (

                    <section>

                        <div
                            style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                gap: "10px",
                                marginBottom: "12px",
                                flexWrap: "wrap"
                            }}
                        >

                            <div>
                                <strong
                                    style={{
                                        fontSize: "15px"
                                    }}
                                >
                                    Hasil Pencarian
                                </strong>

                                <span
                                    style={{
                                        color: "#6b7280",
                                        fontSize: "12px",
                                        marginLeft: "8px"
                                    }}
                                >
                                    {searchResults.length} data ditemukan
                                </span>
                            </div>

                            <small
                                style={{
                                    color: "#6b7280"
                                }}
                            >
                                Kata kunci: <strong>{searchKeyword.trim()}</strong>
                            </small>

                        </div>


                        {searchResults.length ? (

                            <div>
                                {searchResults.map(
                                    (item) => (
                                        <SearchResultCard
                                            key={`${item.batch_id}-${item.id}`}
                                            item={item}
                                        />
                                    )
                                )}
                            </div>

                        ) : (

                            <div
                                className="history-empty"
                                style={{
                                    marginTop: "0"
                                }}
                            >

                                <i className="bi bi-search"></i>

                                <h2>
                                    Data Tidak Ditemukan
                                </h2>

                                <p>
                                    Tidak ada inventaris yang cocok dengan pencarian dan filter yang dipilih.
                                </p>

                            </div>

                        )}

                    </section>

                ) : (

                visible.length ? (

                    <>

                        <div className="history-list">

                            {visible.map(
                                (batch) => (

                                    <BatchCard
                                        key={
                                            batch.id
                                        }

                                        batch={
                                            batch
                                        }

                                        onCreate={
                                            openCreateModal
                                        }

                                        onDetail={
                                            openDetailModal
                                        }
                                    />

                                )
                            )}

                        </div>


                        <div className="history-pagination">

                            <span>

                                Menampilkan{" "}

                                {(currentPage - 1) *
                                    pageSize + 1}

                                -

                                {Math.min(
                                    currentPage *
                                        pageSize,
                                    history.length
                                )}

                                {" "}dari{" "}

                                {history.length}
                                {" "}batch

                            </span>


                            <div
                                className="history-page-control"
                                role="group"
                                aria-label="Pagination riwayat batch"
                            >

                                <button
                                    className="history-page-btn"
                                    disabled={
                                        currentPage ===
                                        1
                                    }
                                    onClick={() =>
                                        setPage(
                                            currentPage -
                                                1
                                        )
                                    }
                                    aria-label="Halaman sebelumnya"
                                >

                                    <i className="bi bi-chevron-left"></i>

                                </button>


                                {Array.from(
                                    {
                                        length:
                                            pageCount
                                    },
                                    (_, index) =>
                                        index + 1
                                ).map(
                                    (item) => (

                                        <button
                                            key={
                                                item
                                            }
                                            className={`history-page-btn ${
                                                item ===
                                                currentPage
                                                    ? "active"
                                                    : ""
                                            }`}
                                            onClick={() =>
                                                setPage(
                                                    item
                                                )
                                            }
                                            aria-current={
                                                item ===
                                                currentPage
                                                    ? "page"
                                                    : undefined
                                            }
                                        >
                                            {item}
                                        </button>

                                    )
                                )}


                                <button
                                    className="history-page-btn"
                                    disabled={
                                        currentPage ===
                                        pageCount
                                    }
                                    onClick={() =>
                                        setPage(
                                            currentPage +
                                                1
                                        )
                                    }
                                    aria-label="Halaman berikutnya"
                                >

                                    <i className="bi bi-chevron-right"></i>

                                </button>

                            </div>

                        </div>

                    </>

                ) : (

                    <div className="history-empty">

                        <i className="bi bi-clock-history"></i>

                        <h2>
                            Belum Ada Riwayat Batch
                        </h2>

                        <p>
                            Batch yang sudah selesai akan muncul di halaman ini.
                        </p>


                        <a
                            href="/batch"
                            className="btn btn-primary"
                        >
                            Buka Menu Import
                        </a>

                    </div>

                )

                )}

            </main>


            {/* ==========================================
                IT → GA MODAL
            ========================================== */}

            {modalType &&
                selectedBatch && (

                    <ItToGaModal
                        type={
                            modalType
                        }

                        batch={
                            selectedBatch
                        }

                        loading={
                            loading
                        }

                        message={
                            message
                        }

                        onClose={
                            closeModal
                        }

                        onCreate={
                            createItToGa
                        }

                        onApprove={
                            approveItToGa
                        }
                    />

                )}

        </div>

    );

}


// =====================================================
// RENDER
// =====================================================

ReactDOM
    .createRoot(
        document.getElementById(
            "history-root"
        )
    )
    .render(
        <HistoryApp />
    );