/* =========================================================
   K.S.G.C RECORDINGS - PUBLIC WEBSITE
   ========================================================= */

let loadedPublicRecordings = [];
let publicRecordingPage = 0;

const PUBLIC_RECORDINGS_PER_PAGE = 4;

function addPasswordVisibilityToggles(root = document) {

    root.querySelectorAll('input[type="password"]').forEach(function(input) {

        if (input.parentElement.classList.contains("password-visibility-wrap")) {
            return;
        }

        const wrapper = document.createElement("div");
        wrapper.className = "password-visibility-wrap";
        input.parentNode.insertBefore(wrapper, input);
        wrapper.appendChild(input);

        const toggle = document.createElement("button");
        toggle.type = "button";
        toggle.className = "password-visibility-toggle";
        toggle.textContent = "Show";
        toggle.setAttribute("aria-label", "Show password");
        toggle.setAttribute("aria-pressed", "false");

        toggle.addEventListener("click", function() {
            const isVisible = input.type === "text";
            input.type = isVisible ? "password" : "text";
            toggle.textContent = isVisible ? "Show" : "Hide";
            toggle.setAttribute(
                "aria-label",
                isVisible ? "Show password" : "Hide password"
            );
            toggle.setAttribute("aria-pressed", String(!isVisible));
        });

        wrapper.appendChild(toggle);
    });
}

addPasswordVisibilityToggles();


/* =========================================================
   SCROLL TO RECORDINGS
   ========================================================= */

function scrollToRecordings() {

    const recordingsSection =
        document.getElementById("recordings");

    if (recordingsSection) {

        recordingsSection.scrollIntoView({
            behavior: "smooth"
        });

    }

}


/* =========================================================
   LOAD RECORDINGS
   ========================================================= */

async function loadPublicRecordings() {

    const recordingGrid =
        document.getElementById("recordingGrid");

    if (!recordingGrid) {
        return;
    }


    try {

        const response =
            await fetch("/api/recordings");


        if (!response.ok) {

            throw new Error(
                "Unable to load recordings."
            );

        }


        const data =
            await response.json();


        const recordings =
            Array.isArray(data)
                ? data
                : data.recordings || [];

        loadedPublicRecordings = recordings;

        displayPublicRecordings(recordings);


    } catch (error) {

        console.error(
            "Error loading recordings:",
            error
        );


        recordingGrid.innerHTML = `

            <div class="empty-recordings">

                <div class="empty-icon">
                    ⚠️
                </div>

                <h3>
                    Unable to Load Recordings
                </h3>

                <p>
                    Please make sure the K.S.G.C Recordings
                    server is running and try again.
                </p>

            </div>

        `;

    }

}


/* =========================================================
   DISPLAY RECORDINGS
   ========================================================= */

function displayPublicRecordings(recordings) {

    const recordingGrid =
        document.getElementById("recordingGrid");

    const searchInput =
        document.getElementById("searchPublicRecordings");

    const sortSelect =
        document.getElementById("sortPublicRecordings");

    const pagination =
        document.getElementById("recordingPagination");

    const previousButton =
        document.getElementById("previousRecordings");

    const nextButton =
        document.getElementById("nextRecordings");

    const pageInfo =
        document.getElementById("recordingPageInfo");


    if (!recordingGrid) {
        return;
    }

    const searchTerm =
        searchInput
            ? searchInput.value.trim().toLocaleLowerCase()
            : "";

    const matchingRecordings =
        Array.isArray(recordings)
            ? recordings.filter(function(recording) {
                return String(recording.title || "")
                    .toLocaleLowerCase()
                    .includes(searchTerm);
            })
            : [];

    if (
        Array.isArray(recordings) &&
        recordings.length > 0 &&
        matchingRecordings.length === 0
    ) {
        if (pagination) {
            pagination.hidden = true;
        }

        recordingGrid.innerHTML = `
            <div class="empty-recordings">
                <div class="empty-icon">⌕</div>
                <h3>No matching messages</h3>
                <p>Try another message name.</p>
            </div>
        `;
        return;
    }


    if (
        !Array.isArray(recordings) ||
        recordings.length === 0
    ) {
        if (pagination) {
            pagination.hidden = true;
        }

        recordingGrid.innerHTML = `

            <div class="empty-recordings">

                <div class="empty-icon">
                    🎥
                </div>

                <h3>
                    No Recordings Available Yet
                </h3>

                <p>
                    New K.S.G.C recordings will appear
                    here when they are uploaded from
                    the Admin Portal.
                </p>

            </div>

        `;

        return;

    }


    const sortOrder =
        sortSelect ? sortSelect.value : "recent";

    matchingRecordings.sort(function(a, b) {

        if (sortOrder === "name") {
            return String(a.title || "K.S.G.C Recording")
                .localeCompare(
                    String(b.title || "K.S.G.C Recording"),
                    undefined,
                    { sensitivity: "base" }
                );
        }

        const dateA = getRecordingTimestamp(a);
        const dateB = getRecordingTimestamp(b);

        if (Number.isNaN(dateA)) {
            return Number.isNaN(dateB) ? 0 : 1;
        }

        if (Number.isNaN(dateB)) {
            return -1;
        }

        return sortOrder === "oldest"
            ? dateA - dateB
            : dateB - dateA;

    });

    const pageCount =
        Math.ceil(matchingRecordings.length / PUBLIC_RECORDINGS_PER_PAGE);

    publicRecordingPage =
        Math.min(publicRecordingPage, pageCount - 1);

    const startIndex =
        publicRecordingPage * PUBLIC_RECORDINGS_PER_PAGE;

    const visibleRecordings =
        matchingRecordings.slice(
            startIndex,
            startIndex + PUBLIC_RECORDINGS_PER_PAGE
        );

    if (pagination && previousButton && nextButton && pageInfo) {
        pagination.hidden = pageCount <= 1;
        previousButton.disabled = publicRecordingPage === 0;
        nextButton.disabled = publicRecordingPage >= pageCount - 1;
        pageInfo.textContent =
            `${startIndex + 1}-${Math.min(startIndex + PUBLIC_RECORDINGS_PER_PAGE, matchingRecordings.length)} of ${matchingRecordings.length}`;
    }


    recordingGrid.innerHTML =
        visibleRecordings.map(function(recording) {

            const title =
                escapeHtml(
                    recording.title ||
                    "K.S.G.C Recording"
                );


            const description =
                escapeHtml(
                    recording.description ||
                    ""
                );


            const date =
                escapeHtml(
                    formatRecordingDate(recording.date)
                );


            const type =
                getRecordingType(recording);


            const thumbnailUrl =
                recording.thumbnailUrl ||
                "";


            const thumbnail =
                thumbnailUrl

                ? `

                    <img
                        src="${thumbnailUrl}"
                        alt="${title}"
                        loading="lazy"
                    >

                  `

                : `

                    <div class="thumbnail-placeholder">
                        ▶
                    </div>

                  `;


            return `

                <div class="recording-card">

                    <div class="thumbnail">
                        ${thumbnail}
                    </div>


                    <div class="card-content">

                        <h3>
                            ${title}
                        </h3>


                        <p>
                            ${type}
                            ${
                                date
                                    ? ` • ${date}`
                                    : ""
                            }
                        </p>


                        ${
                            description

                            ? `
                                <p>
                                    ${description}
                                </p>
                              `

                            : ""
                        }


                        <button
                            type="button"
                            onclick="openRecording('${recording.id}')"
                        >

                            ${
                                type === "Audio"
                                    ? "Listen"
                                    : "Watch"
                            }

                        </button>

                    </div>

                </div>

            `;

        }).join("");

}


function getRecordingTimestamp(recording) {

    const value =
        recording.date ||
        recording.createdAt ||
        "";

    const dateParts =
        /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value));

    const date = dateParts
        ? new Date(
            Number(dateParts[1]),
            Number(dateParts[2]) - 1,
            Number(dateParts[3])
        )
        : new Date(value);

    return date.getTime();

}


function formatRecordingDate(value) {

    if (!value) {
        return "";
    }

    const dateParts =
        /^(\d{4})-(\d{2})-(\d{2})/.exec(String(value));

    const date = dateParts
        ? new Date(
            Number(dateParts[1]),
            Number(dateParts[2]) - 1,
            Number(dateParts[3])
        )
        : new Date(value);

    if (Number.isNaN(date.getTime())) {
        return String(value);
    }

    return date.toLocaleDateString("en-GB", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric"
    });

}


/* =========================================================
   GET RECORDING TYPE
   ========================================================= */

function getRecordingType(recording) {

    const mimeType =
        recording.type ||
        "";


    if (
        mimeType.startsWith("audio/")
    ) {

        return "Audio";

    }


    if (
        mimeType.startsWith("video/")
    ) {

        return "Video";

    }


    const file =
        recording.recordingUrl ||
        recording.recording ||
        recording.file ||
        "";


    const extension =
        file
            .split(".")
            .pop()
            .toLowerCase();


    const audioExtensions = [

        "mp3",
        "wav",
        "m4a",
        "aac",
        "ogg",
        "flac"

    ];


    if (
        audioExtensions.includes(extension)
    ) {

        return "Audio";

    }


    return "Video";

}


/* =========================================================
   OPEN RECORDING
   ========================================================= */

function openRecording(id) {

    const recording =
        loadedPublicRecordings.find(function(item) {
            return String(item.id) === String(id);
        });

    if (!recording) {
        alert("Recording could not be found. Refresh the page and try again.");
        return;
    }

    requestRecordingUnlock(recording);

}


function requestRecordingUnlock(recording) {

    const existingDialog =
        document.getElementById("recordingUnlockOverlay");

    if (existingDialog) {
        existingDialog.remove();
    }

    const title =
        recording.title || "K.S.G.C Recording";

    const dialog =
        document.createElement("div");

    dialog.id = "recordingUnlockOverlay";
    dialog.className = "recording-unlock-overlay";
    dialog.innerHTML = `
        <section
            class="recording-unlock-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="recordingUnlockTitle"
        >
            <button
                type="button"
                class="recording-unlock-close"
                aria-label="Close password dialog"
            >×</button>
            <div class="recording-unlock-icon" aria-hidden="true">🔒</div>
            <p class="recording-unlock-label">PASSWORD PROTECTED</p>
            <h2 id="recordingUnlockTitle">${escapeHtml(title)}</h2>
            <p class="recording-unlock-description">
                Enter the current password to play this recording.
            </p>
            <form class="recording-unlock-form">
                <label for="recordingAccessPassword">Recording password</label>
                <input
                    id="recordingAccessPassword"
                    name="password"
                    type="password"
                    inputmode="numeric"
                    autocomplete="one-time-code"
                    maxlength="8"
                    required
                >
                <p class="recording-unlock-error" role="alert" hidden></p>
                <button class="recording-unlock-submit" type="submit">
                    Unlock recording
                </button>
            </form>
            <p class="recording-unlock-help">
                Need the current password?
                <a
                    href="https://wa.me/2349030199016?text=${encodeURIComponent(`Hello, please send me the current password for "${title}".`)}"
                    target="_blank"
                    rel="noopener noreferrer"
                >Chat with us on WhatsApp</a>
            </p>
        </section>
    `;

    document.body.appendChild(dialog);
    addPasswordVisibilityToggles(dialog);

    const form =
        dialog.querySelector(".recording-unlock-form");

    const passwordInput =
        dialog.querySelector("#recordingAccessPassword");

    const errorMessage =
        dialog.querySelector(".recording-unlock-error");

    const submitButton =
        dialog.querySelector(".recording-unlock-submit");

    function closeDialog() {
        dialog.remove();
        document.removeEventListener("keydown", handleEscape);
    }

    function handleEscape(event) {
        if (event.key === "Escape") {
            closeDialog();
        }
    }

    dialog.querySelector(".recording-unlock-close")
        .addEventListener("click", closeDialog);

    dialog.addEventListener("click", function(event) {
        if (event.target === dialog) {
            closeDialog();
        }
    });

    document.addEventListener("keydown", handleEscape);

    form.addEventListener("submit", async function(event) {

        event.preventDefault();
        errorMessage.hidden = true;
        submitButton.disabled = true;
        submitButton.textContent = "Checking password...";

        try {

            const response = await fetch(
                `/api/recordings/${encodeURIComponent(recording.id)}/unlock`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        password: passwordInput.value
                    })
                }
            );

            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(
                    result.message || "Unable to unlock this recording."
                );
            }

            closeDialog();

            openPlayer(
                `/api/recordings/${encodeURIComponent(recording.id)}/media`,
                title,
                getRecordingType(recording)
            );

        } catch (error) {

            errorMessage.textContent =
                error.message || "Unable to unlock this recording.";
            errorMessage.hidden = false;
            submitButton.disabled = false;
            submitButton.textContent = "Unlock recording";

        }

    });

    passwordInput.focus();

}


/* =========================================================
   OPEN PLAYER
   ========================================================= */

function openPlayer(
    file,
    title,
    type
) {

    const existingPlayer =
        document.getElementById(
            "recordingPlayerOverlay"
        );


    if (existingPlayer) {
        existingPlayer.remove();
    }


    const overlay =
        document.createElement("div");


    overlay.id =
        "recordingPlayerOverlay";


    overlay.innerHTML = `

        <div class="recording-player-overlay">

            <div class="recording-player-box">


                <div class="recording-player-header">

                    <h2>
                        ${escapeHtml(title)}
                    </h2>


                    <button
                        type="button"
                        class="recording-player-close"
                        onclick="closePlayer()"
                    >
                        ✕
                    </button>

                </div>


                <div class="recording-player-content">


                    ${
                        type === "Audio"

                        ? `

                            <audio
                                controls
                                autoplay
                                controlsList="nodownload noplaybackrate"
                                oncontextmenu="return false"
                                class="recording-audio-player"
                            >

                                <source
                                    src="${file}"
                                >

                                Your browser cannot
                                play this audio file.

                            </audio>

                          `

                        : `

                            <video
                                controls
                                autoplay
                                playsinline
                                preload="metadata"
                                controlsList="nodownload noplaybackrate"
                                disablepictureinpicture
                                disableremoteplayback
                                oncontextmenu="return false"
                                class="recording-video-player"
                            >

                                <source
                                    src="${file}"
                                >

                                Your browser cannot
                                play this video file.

                            </video>

                          `

                    }


                </div>

            </div>

        </div>

    `;


    document.body.appendChild(overlay);


    overlay.addEventListener(
        "click",
        function(event) {

            const background =
                overlay.querySelector(
                    ".recording-player-overlay"
                );


            if (
                event.target === background
            ) {

                closePlayer();

            }

        }
    );


    document.addEventListener(
        "keydown",
        playerEscapeHandler
    );

}


/* =========================================================
   CLOSE PLAYER
   ========================================================= */

function closePlayer() {

    const player =
        document.getElementById(
            "recordingPlayerOverlay"
        );


    if (player) {

        player.remove();

    }


    document.removeEventListener(
        "keydown",
        playerEscapeHandler
    );

}


/* =========================================================
   ESCAPE KEY
   ========================================================= */

function playerEscapeHandler(event) {

    if (event.key === "Escape") {

        closePlayer();

    }

}


/* =========================================================
   ESCAPE HTML
   ========================================================= */

function escapeHtml(value) {

    return String(value)

        .replace(
            /&/g,
            "&amp;"
        )

        .replace(
            /</g,
            "&lt;"
        )

        .replace(
            />/g,
            "&gt;"
        )

        .replace(
            /"/g,
            "&quot;"
        )

        .replace(
            /'/g,
            "&#039;"
        );

}


/* =========================================================
   INITIAL LOAD
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    function() {

        initializeOfflineOverlay();
        initializeScrollReveal();
        initializePublicRecordingSearch();
        loadPublicRecordings();

    }
);


function initializePublicRecordingSearch() {

    const searchInput =
        document.getElementById("searchPublicRecordings");

    if (searchInput) {
        searchInput.addEventListener("input", function() {
            publicRecordingPage = 0;
            displayPublicRecordings(loadedPublicRecordings);
        });
    }

    const sortSelect =
        document.getElementById("sortPublicRecordings");

    if (sortSelect) {
        sortSelect.addEventListener("change", function() {
            publicRecordingPage = 0;
            displayPublicRecordings(loadedPublicRecordings);
        });
    }

    const previousButton =
        document.getElementById("previousRecordings");

    if (previousButton) {
        previousButton.addEventListener("click", function() {
            if (publicRecordingPage > 0) {
                publicRecordingPage -= 1;
                displayPublicRecordings(loadedPublicRecordings);
            }
        });
    }

    const nextButton =
        document.getElementById("nextRecordings");

    if (nextButton) {
        nextButton.addEventListener("click", function() {
            publicRecordingPage += 1;
            displayPublicRecordings(loadedPublicRecordings);
        });
    }

}


function initializeScrollReveal() {

    if (
        window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
        !("IntersectionObserver" in window)
    ) {
        return;
    }


    const revealSelector =
        "main > section, main > .login-card, .dashboard-stats > .stat-card, .recording-card, .management-card, footer";

    const observer =
        new IntersectionObserver(
            function(entries) {

                entries.forEach(function(entry) {

                    if (entry.isIntersecting) {
                        entry.target.classList.add("is-visible");
                        observer.unobserve(entry.target);
                    }

                });

            },
            {
                threshold: 0
            }
        );

    function observeRevealElements(root) {

        if (
            root.nodeType === Node.ELEMENT_NODE &&
            root.matches(revealSelector) &&
            !root.classList.contains("scroll-reveal")
        ) {
            root.classList.add("scroll-reveal");
            observer.observe(root);
        }

        if (root.querySelectorAll) {
            root.querySelectorAll(revealSelector).forEach(function(element) {

                if (!element.classList.contains("scroll-reveal")) {
                    element.classList.add("scroll-reveal");
                    observer.observe(element);
                }

            });
        }

    }

    observeRevealElements(document.body);
    document.body.classList.add("scroll-reveal-ready");

    const mutations =
        new MutationObserver(function(records) {

            records.forEach(function(record) {
                record.addedNodes.forEach(observeRevealElements);
            });

        });

    mutations.observe(document.body, {
        childList: true,
        subtree: true
    });

}


function initializeOfflineOverlay() {

    const overlay = document.createElement("div");
    overlay.className = "offline-overlay";
    overlay.hidden = navigator.onLine;
    overlay.setAttribute("role", "status");
    overlay.setAttribute("aria-live", "polite");
    overlay.innerHTML = `
        <div class="offline-message">
            <div class="offline-spinner" aria-hidden="true"></div>
            <span class="offline-eyebrow">CONNECTION STATUS</span>
            <h2 class="offline-title">Connection lost</h2>
            <p class="offline-description">
                Check your Wi-Fi or mobile data. We'll reconnect automatically
                when your connection is back.
            </p>
            <div class="offline-waiting">
                <span class="offline-status-dot" aria-hidden="true"></span>
                Waiting to reconnect
            </div>
        </div>
    `;

    document.body.appendChild(overlay);

    window.addEventListener("offline", function() {
        overlay.hidden = false;
    });

    window.addEventListener("online", function() {
        overlay.hidden = true;
    });

}