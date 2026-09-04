const { useState } = React;

const data = window.__HISTORY_DATA__ || {};

function number(value) {
    return new Intl.NumberFormat("id-ID").format(Number(value || 0));
}

function Sidebar({ company, activeBatch }) {
    return (
        <aside className="history-sidebar dashboard-sidebar">
            <div className="sidebar-brand">
                <img src="/images/mascot.png" alt="Maskot Monitoring QC" />
                <div>
                    <div className="sidebar-brand-title">Monitoring QC IT Support</div>
                    <div className="sidebar-brand-subtitle">Pusat Gadai Indonesia</div>
                </div>
            </div>
            <div className="sidebar-section-label">Menu Utama</div>
            <nav className="sidebar-nav">
                <a className="sidebar-link" href="/"><i className="bi bi-house-fill"></i><span>Dashboard</span></a>
                <a className="sidebar-link" href="/inventaris"><i className="bi bi-list-ul"></i><span>Inventaris</span></a>
                <a className="sidebar-link" href="/batch"><i className={`bi ${activeBatch ? "bi-upload" : "bi-plus-circle"}`}></i><span>{activeBatch ? "Import Tambahan" : "Import Batch Baru"}</span></a>
                <a className="sidebar-link active" href="/batch/history"><i className="bi bi-clock-history"></i><span>Riwayat Batch</span></a>
            </nav>
            <div className="sidebar-card">
                <div className="sidebar-card-title">Pilih Perusahaan</div>
                <form action="/company" method="POST" className="company-switcher">
                    <input type="hidden" name="company" value="PGI" />
                    <button type="submit" className={`company-option ${company === "PGI" ? "active" : ""}`}>
                        <span>PGI - Pusat Gadai</span><i className={`bi ${company === "PGI" ? "bi-check-lg" : "bi-arrow-right"}`}></i>
                    </button>
                </form>
                <form action="/company" method="POST" className="company-switcher">
                    <input type="hidden" name="company" value="PEI" />
                    <button type="submit" className={`company-option ${company === "PEI" ? "active" : ""}`}>
                        <span>PEI - Pusat Emas</span><i className={`bi ${company === "PEI" ? "bi-check-lg" : "bi-arrow-right"}`}></i>
                    </button>
                </form>
            </div>
        </aside>
    );
}

function BatchCard({ batch }) {
    return (
        <article className="history-card">
            <div className="history-card-head">
                <div>
                    <h2><i className="bi bi-box-seam me-2"></i>{batch.batch_code}</h2>
                    <p><i className="bi bi-file-earmark-excel me-1"></i>{batch.batch_name}</p>
                    <small><i className="bi bi-calendar-event me-1"></i>Ditutup: {batch.closed_at || "-"}</small>
                </div>
                <span className="badge bg-success">SELESAI</span>
            </div>
            <div className="history-stats">
                <div><strong>{number(batch.total)}</strong><span>Total</span></div>
                <div><strong className="text-success">{number(batch.done)}</strong><span>Done</span></div>
                <div><strong className="text-danger">{number(batch.reject)}</strong><span>Reject</span></div>
                <div><strong className="text-warning">{number(batch.pending)}</strong><span>Pending</span></div>
            </div>
            <div className="history-actions">
                <a href={`/batch/${batch.id}`} className="btn btn-outline-primary btn-sm"><i className="bi bi-eye me-1"></i>Detail</a>
                <a href={`/export/batch/${batch.id}`} className="btn btn-outline-success btn-sm"><i className="bi bi-file-earmark-excel me-1"></i>Excel</a>
            </div>
        </article>
    );
}

function HistoryApp() {
    const history = data.history || [];
    const [page, setPage] = useState(1);
    const pageSize = 5;
    const pageCount = Math.max(1, Math.ceil(history.length / pageSize));
    const currentPage = Math.min(page, pageCount);
    const visible = history.slice((currentPage - 1) * pageSize, currentPage * pageSize);

    return (
        <div className="history-shell">
            <Sidebar company={data.company || "PGI"} activeBatch={data.activeBatch} />
            <main className="history-main">
                <header className="history-hero">
                    <div>
                        <div className="history-eyebrow"><i className="bi bi-clock-history me-2"></i>Arsip Proses QC</div>
                        <h1>Riwayat Batch</h1>
                        <p>Daftar batch inventaris yang sudah selesai diproses.</p>
                    </div>
                    <a href="/batch" className="btn btn-primary"><i className="bi bi-upload me-2"></i>Menu Import</a>
                </header>
                {visible.length ? (
                    <>
                        <div className="history-list">{visible.map(batch => <BatchCard key={batch.id} batch={batch} />)}</div>
                        <div className="history-pagination">
                            <span>Menampilkan {(currentPage - 1) * pageSize + 1}-{Math.min(currentPage * pageSize, history.length)} dari {history.length} batch</span>
                            <div className="btn-group" role="group" aria-label="Pagination riwayat batch">
                                <button className="btn btn-outline-secondary" disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)}><i className="bi bi-chevron-left"></i></button>
                                {Array.from({ length: pageCount }, (_, index) => index + 1).map(item => <button key={item} className={`btn ${item === currentPage ? "btn-primary" : "btn-outline-secondary"}`} onClick={() => setPage(item)}>{item}</button>)}
                                <button className="btn btn-outline-secondary" disabled={currentPage === pageCount} onClick={() => setPage(currentPage + 1)}><i className="bi bi-chevron-right"></i></button>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="history-empty"><i className="bi bi-clock-history"></i><h2>Belum Ada Riwayat Batch</h2><p>Batch yang sudah selesai akan muncul di halaman ini.</p><a href="/batch" className="btn btn-primary">Buka Menu Import</a></div>
                )}
            </main>
        </div>
    );
}

ReactDOM.createRoot(document.getElementById("history-root")).render(<HistoryApp />);
