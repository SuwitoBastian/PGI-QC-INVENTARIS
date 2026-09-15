const { useState } = React;


function LoginApp() {

    /* =========================================
       ERROR DARI SERVER
    ========================================= */

    const params =
        new URLSearchParams(
            window.location.search
        );

    const initialError =
        params.get("error") || "";


    /* =========================================
       STATE
    ========================================= */

    const [showPassword, setShowPassword] =
        useState(false);


    /* =========================================
       CLEAR ERROR SAAT USER MULAI MENGETIK
    ========================================= */

    const clearError = () => {

        if (window.history.replaceState) {

            window.history.replaceState(
                {},
                document.title,
                "/login"
            );

        }

    };


    return (

        <>

            {/* =====================================
                BRAND
            ====================================== */}

            <div className="login-brand">


                <img
                    src="/images/mascot.png"
                    alt="IT Support"
                    className="login-logo"
                />


                <div className="login-brand-label">

                    Monitoring QC IT SUPPORT

                </div>


                <h1 className="login-brand-title">

                    Pusat Gadai Indonesia

                </h1>


                <p className="login-brand-description">

                    Silakan masukkan kredensial Anda
                    untuk melanjutkan.

                </p>


            </div>


            {/* =====================================
                ERROR
            ====================================== */}

            {initialError && (

                <div className="login-error">

                    <i className="bi bi-exclamation-circle-fill"></i>

                    <span>

                        {initialError}

                    </span>

                </div>

            )}


            {/* =====================================
                LOGIN FORM
            ====================================== */}

            <form
                action="/login"
                method="POST"
                className="login-form"
            >


                {/* =================================
                    USERNAME
                ================================== */}

                <div className="login-field">


                    <label
                        htmlFor="username"
                        className="login-label"
                    >

                        Username

                    </label>


                    <div className="login-input-wrapper">


                        <i
                            className="
                                bi
                                bi-person
                                login-input-icon
                            "
                        ></i>


                        <input
                            id="username"
                            type="text"
                            name="username"
                            className="login-input"
                            placeholder="Masukkan username Anda"
                            autoComplete="username"
                            autoFocus
                            required
                            onInput={clearError}
                        />


                    </div>


                </div>


                {/* =================================
                    PASSWORD
                ================================== */}

                <div className="login-field">


                    <label
                        htmlFor="password"
                        className="login-label"
                    >

                        Password

                    </label>


                    <div className="login-input-wrapper">


                        <i
                            className="
                                bi
                                bi-lock
                                login-input-icon
                            "
                        ></i>


                        <input
                            id="password"
                            type={
                                showPassword
                                    ? "text"
                                    : "password"
                            }
                            name="password"
                            className="login-input"
                            placeholder="Masukkan password Anda"
                            autoComplete="current-password"
                            required
                            onInput={clearError}
                        />


                        <button
                            type="button"
                            className="login-password-toggle"
                            onClick={() =>
                                setShowPassword(
                                    value => !value
                                )
                            }
                            aria-label={
                                showPassword
                                    ? "Sembunyikan password"
                                    : "Tampilkan password"
                            }
                        >

                            <i
                                className={
                                    showPassword
                                        ? "bi bi-eye-slash"
                                        : "bi bi-eye"
                                }
                            ></i>

                        </button>


                    </div>


                </div>


                {/* =================================
                    LOGIN BUTTON
                ================================== */}

                <button
                    type="submit"
                    className="login-button"
                >

                    <i
                        className="
                            bi
                            bi-box-arrow-in-right
                        "
                    ></i>

                    Login

                </button>


            </form>


            {/* =====================================
                FOOTER
            ====================================== */}

            <div className="login-footer">

                © 2026 Pusat Gadai Indonesia.
                All rights reserved.

            </div>

        </>

    );

}


/* =========================================
   RENDER
========================================= */

const loginRoot =
    ReactDOM.createRoot(
        document.getElementById("login-root")
    );


loginRoot.render(
    <LoginApp />
);