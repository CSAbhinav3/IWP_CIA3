// Global variables
let currentUser = null;
const API_BASE_URL = 'http://localhost:3000/api'; // should will be moved to env variable in production

// Authentication check
function checkAuth() {
    /*const token = localStorage.getItem('token');
    const userType = localStorage.getItem('userType');
    
    if (!token || userType !== 'company') {
        window.location.href = 'index.html';
        return false;
    }*/
   
    // will be implemented once we integrate login pages and mechanism.
    return true;
}

// Initialize auth check on page load
if (!window.location.pathname.includes('index.html')) {
    checkAuth();
}

// Logout function
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('userType');
    localStorage.removeItem('userId');
    window.location.href = 'index.html';
}

// API utility functions
async function makeAPICall(endpoint, method = 'GET', data = null) {
    const token = localStorage.getItem('token');
    const config = {
        method,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': token ? `Bearer ${token}` : ''
        }
    };
    
    if (data) {
        config.body = JSON.stringify(data);
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
        const result = await response.json();
        
        if (!response.ok) {
            throw new Error(result.message || 'API request failed');
        }
        
        return result;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

// Show alert messages
function showAlert(message, type = 'success') {
    const alertContainer = document.getElementById('alertContainer');
    if (!alertContainer) return;
    
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type}`;
    alertDiv.textContent = message;
    
    alertContainer.innerHTML = '';
    alertContainer.appendChild(alertDiv);
    
    setTimeout(() => {
        alertDiv.remove();
    }, 5000);
}

// Load company profile for header
async function loadCompanyProfile() {
    try {
        const profile = await makeAPICall('/company/profile');
        const companyNameElement = document.getElementById('companyName');
        if (companyNameElement) {
            companyNameElement.textContent = profile.companyName || 'Company';
        }
        currentUser = profile;
    } catch (error) {
        console.error('Error loading company profile:', error);
    }
}

// Dashboard functions
async function loadDashboardData() {
    try {
        const stats = await makeAPICall('/company/dashboard-stats');
        
        document.getElementById('totalJobs').textContent = stats.totalJobs || 0;
        document.getElementById('totalApplications').textContent = stats.totalApplications || 0;
        document.getElementById('totalHired').textContent = stats.totalHired || 0;
        
        // Load recent jobs
        const jobs = await makeAPICall('/company/jobs?limit=5');
        displayRecentJobs(jobs);
        
        // Load recent applications
        const applications = await makeAPICall('/company/applications?limit=5');
        displayRecentApplications(applications);
        
    } catch (error) {
        console.error('Error loading dashboard data:', error);
        showAlert('Error loading dashboard data', 'error');
    }
}

function displayRecentJobs(jobs) {
    const container = document.getElementById('recentJobs');
    if (!jobs || jobs.length === 0) {
        container.innerHTML = '<p>No job postings yet. <a href="create-job.html">Create your first job posting</a></p>';
        return;
    }
    
    container.innerHTML = jobs.map(job => `
        <div class="job-card">
            <h3 class="job-title">${job.jobTitle}</h3>
            <div class="job-meta">
                <span>📍 ${job.location}</span>
                <span>💼 ${job.jobType}</span>
                <span>📅 Posted: ${new Date(job.createdAt).toLocaleDateString()}</span>
            </div>
            <p class="job-description">${job.jobDescription.substring(0, 150)}...</p>
            <div class="job-actions">
                <span class="status-badge">${job.applicationsCount || 0} Applications</span>
            </div>
        </div>
    `).join('');
}

function displayRecentApplications(applications) {
    const container = document.getElementById('recentApplications');
    if (!applications || applications.length === 0) {
        container.innerHTML = '<p>No applications yet.</p>';
        return;
    }
    
    container.innerHTML = applications.map(app => `
        <div class="application-card">
            <div class="applicant-info">
                <div>
                    <div class="applicant-name">${app.studentName}</div>
                    <small>Applied for: ${app.jobTitle}</small>
                </div>
                <span class="application-status status-${app.status}">${app.status}</span>
            </div>
            <div class="job-actions">
                <button class="btn btn-outline" onclick="viewStudentDetails(${app.studentId})">View Details</button>
            </div>
        </div>
    `).join('');
}

// Profile functions
async function loadProfileData() {
    try {
        const profile = await makeAPICall('/company/profile');
        
        // Fill form fields
        const fields = ['companyName', 'industry', 'website', 'location', 'companySize', 
                       'description', 'contactPerson', 'contactEmail', 'contactPhone'];
        
        fields.forEach(field => {
            const element = document.getElementById(field === 'companyName' ? 'companyNameInput' : field);
            if (element && profile[field]) {
                element.value = profile[field];
            }
        });
    } catch (error) {
        console.error('Error loading profile data:', error);
    }
}

async function updateProfile(event) {
    event.preventDefault();
    
    const form = event.target;
    const formData = new FormData(form);
    const profileData = {};
    
    for (let [key, value] of formData.entries()) {
        profileData[key] = value;
    }
    
    const submitBtn = form.querySelector('button[type="submit"]');
    const btnText = submitBtn.querySelector('.btn-text');
    const loader = submitBtn.querySelector('.loading');
    
    btnText.style.display = 'none';
    loader.style.display = 'inline-block';
    submitBtn.disabled = true;
    
    try {
        await makeAPICall('/company/profile', 'PUT', profileData);
        showAlert('Profile updated successfully!', 'success');
    } catch (error) {
        showAlert(error.message, 'error');
    } finally {
        btnText.style.display = 'inline';
        loader.style.display = 'none';
        submitBtn.disabled = false;
    }
}

// Job creation functions
async function createJob(event) {
    event.preventDefault();
    
    const form = event.target;
    const formData = new FormData(form);
    const jobData = {};
    
    for (let [key, value] of formData.entries()) {
        jobData[key] = value;
    }
    
    const submitBtn = form.querySelector('button[type="submit"]');
    const btnText = submitBtn.querySelector('.btn-text');
    const loader = submitBtn.querySelector('.loading');
    
    btnText.style.display = 'none';
    loader.style.display = 'inline-block';
    submitBtn.disabled = true;
    
    try {
        await makeAPICall('/jobs', 'POST', jobData);
        showAlert('Job posted successfully!', 'success');
        form.reset();
        
        // Redirect to dashboard after 2 seconds
        setTimeout(() => {
            window.location.href = 'company-dashboard.html';
        }, 2000);
    } catch (error) {
        showAlert(error.message, 'error');
    } finally {
        btnText.style.display = 'inline';
        loader.style.display = 'none';
        submitBtn.disabled = false;
    }
}

// Applications management
async function loadApplications(jobId = null) {
    try {
        const endpoint = jobId ? `/company/applications?jobId=${jobId}` : '/company/applications';
        const applications = await makeAPICall(endpoint);
        displayApplications(applications);
    } catch (error) {
        console.error('Error loading applications:', error);
        showAlert('Error loading applications', 'error');
    }
}

function displayApplications(applications) {
    const container = document.getElementById('applicationsContainer');
    
    if (!applications || applications.length === 0) {
        container.innerHTML = '<div class="card"><p>No applications found.</p></div>';
        return;
    }
    
    container.innerHTML = applications.map(app => `
        <div class="card">
            <div class="application-card">
                <div class="applicant-info">
                    <div>
                        <div class="applicant-name">${app.studentName}</div>
                        <small>📧 ${app.studentEmail} | 📱 ${app.studentPhone || 'Not provided'}</small>
                        <br><small>Applied for: <strong>${app.jobTitle}</strong></small>
                        <br><small>Applied on: ${new Date(app.appliedAt).toLocaleDateString()}</small>
                    </div>
                    <span class="application-status status-${app.status}">${app.status}</span>
                </div>
                <div class="job-actions">
                    <button class="btn btn-outline" onclick="viewStudentDetails(${app.studentId}, ${app.jobId})">
                        View Details
                    </button>
                    ${app.resumeUrl ? `<a href="${app.resumeUrl}" target="_blank" class="btn btn-outline">View Resume</a>` : ''}
                    ${app.status === 'pending' ? `
                        <button class="btn btn-success" onclick="updateApplicationStatus(${app.id}, 'hired')">
                            Hire
                        </button>
                        <button class="btn btn-danger" onclick="updateApplicationStatus(${app.id}, 'rejected')">
                            Reject
                        </button>
                    ` : ''}
                </div>
            </div>
        </div>
    `).join('');
}

async function loadJobsForFilter() {
    try {
        const jobs = await makeAPICall('/company/jobs');
        const select = document.getElementById('jobFilter');
        
        select.innerHTML = '<option value="">All Jobs</option>';
        jobs.forEach(job => {
            const option = document.createElement('option');
            option.value = job.id;
            option.textContent = job.jobTitle;
            select.appendChild(option);
        });
    } catch (error) {
        console.error('Error loading jobs for filter:', error);
    }
}

function filterApplications() {
    const jobId = document.getElementById('jobFilter').value;
    loadApplications(jobId || null);
}

async function updateApplicationStatus(applicationId, status) {
    try {
        await makeAPICall(`/applications/${applicationId}/status`, 'PUT', { status });
        showAlert(`Application ${status} successfully!`, 'success');
        loadApplications();
    } catch (error) {
        showAlert(error.message, 'error');
    }
}

async function viewStudentDetails(studentId, jobId = null) {
    try {
        const student = await makeAPICall(`/students/${studentId}`);
        
        const modalContent = document.getElementById('studentDetails');
        modalContent.innerHTML = `
            <h3>Student Details</h3>
            <div class="form-group">
                <strong>Name:</strong> ${student.firstName} ${student.lastName}
            </div>
            <div class="form-group">
                <strong>Email:</strong> ${student.email}
            </div>
            <div class="form-group">
                <strong>Phone:</strong> ${student.phone || 'Not provided'}
            </div>
            <div class="form-group">
                <strong>Course:</strong> ${student.course || 'Not specified'}
            </div>
            <div class="form-group">
                <strong>Year:</strong> ${student.year || 'Not specified'}
            </div>
            <div class="form-group">
                <strong>CGPA:</strong> ${student.cgpa || 'Not provided'}
            </div>
            <div class="form-group">
                <strong>Skills:</strong> ${student.skills || 'Not provided'}
            </div>
            ${student.resumeUrl ? `
                <div class="form-group">
                    <a href="${student.resumeUrl}" target="_blank" class="btn btn-primary">Download Resume</a>
                </div>
            ` : ''}
        `;
        
        document.getElementById('studentModal').style.display = 'block';
    } catch (error) {
        showAlert('Error loading student details', 'error');
    }
}

function closeModal() {
    document.getElementById('studentModal').style.display = 'none';
}

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('studentModal');
    if (event.target === modal) {
        modal.style.display = 'none';
    }
}
