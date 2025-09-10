let jobPostings = [];
let applications = [];

// ----------------- Load Jobs -----------------
async function loadJobPostings() {
    try {
        const res = await fetch("http://localhost:5000/api/jobs");
        jobPostings = await res.json();
        setupJobPostingsTable();
        populateJobDropdown(); // For notifications
        populateApplicationsJobDropdown(); // For tracking applications
        await loadDashboardStats(); // <-- load dynamic counts after jobs/students are fetched
    } catch (err) {
        console.error("Failed to load jobs", err);
    }
}

// ----------------- Approve/Reject Jobs -----------------
async function approveJob(jobId) {
    try {
        await fetch(`http://localhost:5000/api/jobs/${jobId}/approve`, { method: "POST" });
        await loadJobPostings();
    } catch (err) {
        console.error("Failed to approve job:", err);
    }
}

async function rejectJob(jobId) {
    try {
        await fetch(`http://localhost:5000/api/jobs/${jobId}/reject`, { method: "POST" });
        await loadJobPostings();
    } catch (err) {
        console.error("Failed to reject job:", err);
    }
}

// ----------------- DOM Loaded -----------------
document.addEventListener("DOMContentLoaded", () => {
    lucide.createIcons();
    setupNavigation();
    loadJobPostings();
    setupNotificationForm();
    setupModal();
    setupApplicationsPage();
});

// ----------------- Navigation -----------------
function setupNavigation() {
    const navItems = document.querySelectorAll('.nav-item[data-page]');
    const actionCards = document.querySelectorAll('.action-card[data-page]');
    const pages = document.querySelectorAll('.page');

    navItems.forEach(item => {
        item.addEventListener('click', e => {
            e.preventDefault();
            navigateToPage(item.getAttribute('data-page'));
        });
    });

    actionCards.forEach(card => {
        card.addEventListener('click', () => {
            navigateToPage(card.getAttribute('data-page'));
        });
    });

    function navigateToPage(targetPage) {
        navItems.forEach(item => item.classList.remove('active'));
        pages.forEach(page => page.classList.remove('active'));

        const targetPageElement = document.getElementById(`${targetPage}-page`);
        if (targetPageElement) targetPageElement.classList.add('active');

        navItems.forEach(item => {
            if (item.getAttribute('data-page') === targetPage) item.classList.add('active');
        });
    }
}

// ----------------- Job Table -----------------
function setupJobPostingsTable() {
    const tableBody = document.getElementById('job-table-body');
    const statusFilter = document.getElementById('status-filter');

    function renderJobPostings(jobs = jobPostings) {
        tableBody.innerHTML = '';

        jobs.forEach(job => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>
                    <div class="company-info">
                        <div class="company-icon"><i data-lucide="building"></i></div>
                        <div>
                            <div class="company-name">${escapeHtml(job.company)}</div>
                            <div class="company-role">${escapeHtml(job.role)}</div>
                        </div>
                    </div>
                </td>
                <td>
                    <div class="job-details">
                        <div class="job-salary">${escapeHtml(job.salary || '')}</div>
                        <div class="job-location"><i data-lucide="map-pin"></i> ${escapeHtml(job.location)}</div>
                        <div class="job-description">${escapeHtml(job.description || '')}</div>
                    </div>
                </td>
                <td>
                    <div class="job-date"><i data-lucide="calendar"></i> ${job.postedOn ? new Date(job.postedOn).toLocaleDateString() : ''}</div>
                </td>
                <td>
                    <span class="status-badge ${job.status ? job.status.toLowerCase() : ''}">${escapeHtml(job.status)}</span>
                </td>
                <td>
                    ${job.status === 'Pending' ? `
                        <div class="action-buttons">
                            <button class="action-btn approve-btn" onclick="approveJob(${job.id})">
                                <i data-lucide="check"></i> Approve
                            </button>
                            <button class="action-btn reject-btn" onclick="rejectJob(${job.id})">
                                <i data-lucide="x"></i> Reject
                            </button>
                        </div>
                    ` : `
                        <div class="status-display">
                            <i data-lucide="${job.status === 'Approved' ? 'check' : 'x'}"></i> ${escapeHtml(job.status)}
                        </div>
                    `}
                </td>
            `;
            tableBody.appendChild(row);
        });

        lucide.createIcons();
        updateValidationStats();
    }

    statusFilter.addEventListener('change', e => {
        const filterValue = e.target.value;
        const filteredJobs = filterValue === 'All' ? jobPostings : jobPostings.filter(job => job.status === filterValue);
        renderJobPostings(filteredJobs);
    });

    renderJobPostings();
}

// ----------------- Validation Stats -----------------
function updateValidationStats() {
    const pendingCount = jobPostings.filter(job => job.status === 'Pending').length;
    const approvedCount = jobPostings.filter(job => job.status === 'Approved').length;
    const rejectedCount = jobPostings.filter(job => job.status === 'Rejected').length;
    const totalCount = jobPostings.length;

    const stats = document.querySelectorAll('.validation-stat');
    if (stats.length >= 4) {
        stats[0].querySelector('.validation-value').textContent = pendingCount;
        stats[1].querySelector('.validation-value').textContent = approvedCount;
        stats[2].querySelector('.validation-value').textContent = rejectedCount;
        stats[3].querySelector('.validation-value').textContent = totalCount;
    }
}

// ----------------- Populate Job Dropdown -----------------
function populateJobDropdown() {
    const jobSelect = document.getElementById('job-select');
    if (!jobSelect) return;
    jobSelect.innerHTML = '<option value="">Select Job</option>';
    jobPostings.filter(job => job.status === 'Approved').forEach(job => {
        const option = document.createElement('option');
        option.value = job.id;
        option.textContent = `${job.company} - ${job.role}`;
        jobSelect.appendChild(option);
    });
}

// ----------------- Notification Form -----------------
function setupNotificationForm() {
    const jobSelect = document.getElementById('job-select');
    const yearSelect = document.getElementById('year-select');
    const branchCheckboxes = document.querySelectorAll('.branch-checkbox input[type="checkbox"]');
    const notifyBtn = document.getElementById('notify-btn');

    function updateNotifyButton() {
        const jobSelected = jobSelect.value !== '';
        const yearSelected = yearSelect.value !== '';
        const branchSelected = Array.from(branchCheckboxes).some(cb => cb.checked);
        notifyBtn.disabled = !(jobSelected && yearSelected && branchSelected);
    }

    if (jobSelect) jobSelect.addEventListener('change', updateNotifyButton);
    if (yearSelect) yearSelect.addEventListener('change', updateNotifyButton);
    branchCheckboxes.forEach(cb => cb.addEventListener('change', updateNotifyButton));

    if (notifyBtn) {
        notifyBtn.addEventListener('click', async () => {
            if (!notifyBtn.disabled) {
                const selectedBranches = Array.from(branchCheckboxes)
                    .filter(cb => cb.checked)
                    .map(cb => cb.value);

                const payload = {
                    jobId: jobSelect.value,
                    year: yearSelect.value,
                    branches: selectedBranches,
                    message: `A new job posting is available!`
                };

                try {
                    const res = await fetch('http://localhost:5000/api/notify-students', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload)
                    });

                    const data = await res.json();
                    showNotificationModal(data.message);
                } catch (err) {
                    console.error('Failed to notify students:', err);
                }

                jobSelect.value = '';
                yearSelect.value = '';
                branchCheckboxes.forEach(cb => (cb.checked = false));
                updateNotifyButton();
            }
        });
    }
}

// ----------------- Modal -----------------
function setupModal() {
    const modal = document.getElementById('notification-modal');
    const closeBtn = document.getElementById('close-modal');

    if (!modal || !closeBtn) return;

    closeBtn.addEventListener('click', () => modal.classList.remove('show'));
    modal.addEventListener('click', e => {
        if (e.target === modal) modal.classList.remove('show');
    });
}

function showNotificationModal(message) {
    const modal = document.getElementById('notification-modal');
    const countElement = document.getElementById('notified-count');
    if (!modal || !countElement) return;
    countElement.textContent = message;
    modal.classList.add('show');
    lucide.createIcons();
}

// ----------------- Applications Tracking -----------------
function setupApplicationsPage() {
    const appJobSelect = document.getElementById('applications-job-select');
    const applicationsTableBody = document.getElementById('applications-table-body');

    if (!appJobSelect || !applicationsTableBody) return;

    // Load applications for selected job
    appJobSelect.addEventListener('change', async () => {
        const jobId = appJobSelect.value;
        applicationsTableBody.innerHTML = '<tr><td colspan="3">Loading...</td></tr>';

        if (!jobId) {
            applicationsTableBody.innerHTML = '';
            return;
        }

        try {
            const res = await fetch(`http://localhost:5000/api/applications/${jobId}`);
            if (!res.ok) {
                console.error('Failed to fetch applications:', res.statusText);
                applicationsTableBody.innerHTML = `<tr><td colspan="3">Error loading applications.</td></tr>`;
                return;
            }
            applications = await res.json();

            applicationsTableBody.innerHTML = '';
            if (applications.length === 0) {
                applicationsTableBody.innerHTML = '<tr><td colspan="3">No applications found.</td></tr>';
                return;
            }

            applications.forEach(app => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${escapeHtml(app.studentName)}</td>
                    <td>${app.applicationDate ? new Date(app.applicationDate).toLocaleDateString() : ''}</td>
                    <td>
                        <select onchange="updateApplicationStatus(${app.id}, this.value)">
                            <option value="Pending" ${app.status === 'Pending' ? 'selected' : ''}>Pending</option>
                            <option value="Reviewed" ${app.status === 'Reviewed' ? 'selected' : ''}>Reviewed</option>
                            <option value="Rejected" ${app.status === 'Rejected' ? 'selected' : ''}>Rejected</option>
                        </select>
                    </td>
                `;
                applicationsTableBody.appendChild(row);
            });
        } catch (err) {
            console.error('Failed to load applications:', err);
            applicationsTableBody.innerHTML = `<tr><td colspan="3">Error loading applications.</td></tr>`;
        }
    });
}

// Populate job dropdown for applications
function populateApplicationsJobDropdown() {
    const appJobSelect = document.getElementById('applications-job-select');
    if (!appJobSelect) return;
    appJobSelect.innerHTML = '<option value="">Select Job</option>';
    jobPostings.filter(job => job.status === 'Approved').forEach(job => {
        const option = document.createElement('option');
        option.value = job.id;
        option.textContent = `${job.company} - ${job.role}`;
        appJobSelect.appendChild(option);
    });

    // Auto-select first approved job (if present) and trigger change to load apps
    const firstApprovedOption = appJobSelect.querySelector('option[value]:not([value=""])');
    if (firstApprovedOption) {
        appJobSelect.value = firstApprovedOption.value;
        // Dispatch change event to load applications for this job
        appJobSelect.dispatchEvent(new Event('change'));
    }
}

// Update application status
async function updateApplicationStatus(applicationId, status) {
    try {
        await fetch(`http://localhost:5000/api/applications/${applicationId}/update`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status })
        });
    } catch (err) {
        console.error('Failed to update application status:', err);
    }
}

// ----------------- Dashboard Stats Fetch -----------------
async function loadDashboardStats() {
    try {
        const res = await fetch('http://localhost:5000/api/stats');
        if (!res.ok) {
            console.error('Failed to fetch stats:', res.statusText);
            return;
        }
        const stats = await res.json();

        // Your HTML has 3 stat-value elements in that order:
        // [0] Total Students, [1] Active Companies, [2] Pending Approvals
        const statEls = document.querySelectorAll('.stat-value');
        if (statEls.length >= 3) {
            statEls[0].textContent = stats.totalStudents ?? '0';
            statEls[1].textContent = stats.activeCompanies ?? '0';
            statEls[2].textContent = stats.pendingApprovals ?? '0';
        }
    } catch (err) {
        console.error('Error loading dashboard stats:', err);
    }
}

// ----------------- Utilities -----------------
// Escape basic HTML to avoid simple injection when rendering content from DB
function escapeHtml(unsafe) {
    if (unsafe === null || unsafe === undefined) return '';
    return String(unsafe)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// ----------------- Expose functions -----------------
window.approveJob = approveJob;
window.rejectJob = rejectJob;
window.updateApplicationStatus = updateApplicationStatus;
