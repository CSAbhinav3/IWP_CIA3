// Enhanced script.js for CHRIST University Placement Cell
document.addEventListener("DOMContentLoaded", function () {
  // Global variables
  let currentTab = "Employer";
  let registeredUsers = {
    employer: [],
    candidate: [],
    faculty: [],
  };

  // Form configurations for different user types
  const formConfigs = {
    Employer: {
      fields: [
        {
          name: "fullName",
          type: "text",
          placeholder: "Ravi Kumar",
          required: true,
        },
        {
          name: "industry",
          type: "select",
          placeholder: "Choose Industry",
          required: true,
          options: [
            "IT",
            "Finance",
            "Education",
            "Healthcare",
            "Manufacturing",
            "Consulting",
            "Other",
          ],
        },
        {
          name: "companyName",
          type: "text",
          placeholder: "TechNova Solutions Pvt Ltd",
          required: true,
        },
        {
          name: "contactNumber",
          type: "tel",
          placeholder: "9876543210",
          required: true,
        },
        {
          name: "linkedinUrl",
          type: "url",
          placeholder: "https://www.linkedin.com/in/ravikumar",
          required: false,
        },
        {
          name: "companyEmail",
          type: "email",
          placeholder: "ravi.kumar@technova.com",
          required: true,
        },
      ],
    },
    Candidate: {
      fields: [
        {
          name: "fullName",
          type: "text",
          placeholder: "Ananya Sharma",
          required: true,
        },
        {
          name: "course",
          type: "select",
          placeholder: "B.Tech",
          required: true,
          options: ["B.Tech", "MBA", "MCA", "B.Com", "BBA", "M.Tech", "Other"],
        },
        {
          name: "studentId",
          type: "text",
          placeholder: "2360312",
          required: true,
        },
        {
          name: "contactNumber",
          type: "tel",
          placeholder: "+91 9123456789",
          required: true,
        },
        {
          name: "personalEmail",
          type: "email",
          placeholder: "ananya.sharma@gmail.com",
          required: true,
        },
        {
          name: "cgpa",
          type: "number",
          placeholder: "8.72",
          required: true,
          min: "0",
          max: "10",
          step: "0.01",
        },
      ],
    },
    Faculty: {
      fields: [
        {
          name: "fullName",
          type: "text",
          placeholder: "Dr. Meera Nair",
          required: true,
        },
        {
          name: "department",
          type: "select",
          placeholder: "Computer Science",
          required: true,
          options: [
            "Computer Science",
            "Business Administration",
            "Engineering",
            "Commerce",
            "Arts & Humanities",
            "Other",
          ],
        },
        {
          name: "employeeId",
          type: "text",
          placeholder: "FAC1029",
          required: true,
        },
        {
          name: "contactNumber",
          type: "tel",
          placeholder: "+91 9988776655",
          required: true,
        },
        {
          name: "officialEmail",
          type: "email",
          placeholder: "meera.nair@university.edu",
          required: true,
        },
        {
          name: "designation",
          type: "text",
          placeholder: "Associate Professor",
          required: true,
        },
      ],
    },
  };

  // Initialize the application
  function init() {
    setupTabFunctionality();
    setupFormHandling();
    setupNavigation();
    renderForm(currentTab);
    loadStoredData();
  }

  // Setup tab switching functionality
  function setupTabFunctionality() {
    const tabButtons = document.querySelectorAll(".tab");

    tabButtons.forEach(function (tab) {
      tab.addEventListener("click", function () {
        // Remove active class from all tabs
        tabButtons.forEach((t) => t.classList.remove("active"));

        // Add active class to clicked tab
        tab.classList.add("active");

        // Update current tab
        currentTab = tab.textContent.trim();

        // Re-render form for the selected tab
        renderForm(currentTab);

        // Clear any previous alerts
        hideAlert();
      });
    });
  }

  // Render form based on selected tab
  function renderForm(tabType) {
    const form = document.querySelector("form");
    const config = formConfigs[tabType];

    if (!config) return;

    // Clear existing form content
    form.innerHTML = "";

    // Create form rows
    const fields = config.fields;
    for (let i = 0; i < fields.length; i += 2) {
      const formRow = document.createElement("div");
      formRow.className = "form-row";

      // Add first field
      const field1 = createFormField(fields[i]);
      formRow.appendChild(field1);

      // Add second field if exists
      if (fields[i + 1]) {
        const field2 = createFormField(fields[i + 1]);
        formRow.appendChild(field2);
      }

      form.appendChild(formRow);
    }

    // Add submit button
    const submitBtn = document.createElement("button");
    submitBtn.type = "submit";
    submitBtn.className = "sign-up-btn";
    submitBtn.textContent = `Register as ${tabType}`;
    form.appendChild(submitBtn);

    // Add alert container if it doesn't exist
    if (!document.querySelector(".alert-container")) {
      const alertContainer = document.createElement("div");
      alertContainer.className = "alert-container";
      form.parentNode.insertBefore(alertContainer, form);
    }
  }

  // Create individual form fields
  function createFormField(fieldConfig) {
    let element;

    if (fieldConfig.type === "select") {
      element = document.createElement("select");
      element.required = fieldConfig.required;

      // Add default option
      const defaultOption = document.createElement("option");
      defaultOption.value = "";
      defaultOption.textContent = fieldConfig.placeholder;
      defaultOption.selected = true;
      defaultOption.disabled = true;
      element.appendChild(defaultOption);

      // Add other options
      fieldConfig.options.forEach((option) => {
        const optionElement = document.createElement("option");
        optionElement.value = option;
        optionElement.textContent = option;
        element.appendChild(optionElement);
      });
    } else {
      element = document.createElement("input");
      element.type = fieldConfig.type;
      element.placeholder = fieldConfig.placeholder;
      element.required = fieldConfig.required;

      if (fieldConfig.min) element.min = fieldConfig.min;
      if (fieldConfig.max) element.max = fieldConfig.max;
      if (fieldConfig.step) element.step = fieldConfig.step;
    }

    element.name = fieldConfig.name;
    return element;
  }

  // Setup form submission handling
  function setupFormHandling() {
    document.addEventListener("submit", function (event) {
      if (event.target.tagName === "FORM") {
        event.preventDefault();
        handleFormSubmission(event.target);
      }
    });
  }

  // Handle form submission
  function handleFormSubmission(form) {
    const formData = new FormData(form);
    const userData = {};

    // Extract form data
    for (let [key, value] of formData.entries()) {
      userData[key] = value.trim();
    }

    // Validate form data
    if (!validateFormData(userData)) {
      return;
    }

    // Add timestamp and user type
    userData.registrationDate = new Date().toLocaleDateString();
    userData.userType = currentTab.toLowerCase();
    userData.id = generateUniqueId();

    // Store user data
    registeredUsers[userData.userType].push(userData);
    saveToLocalStorage();

    // Show success message
    showAlert(
      `Registration successful! Welcome ${userData.fullName}`,
      "success"
    );

    // Reset form
    form.reset();

    // Log registration (in real app, this would be sent to server)
    console.log("New registration:", userData);
  }

  // Validate form data
  function validateFormData(data) {
    // Email validation
    const emailFields = ["companyEmail", "personalEmail", "officialEmail"];
    for (let field of emailFields) {
      if (data[field] && !isValidEmail(data[field])) {
        showAlert("Please enter a valid email address", "error");
        return false;
      }
    }

    // Phone number validation
    if (data.contactNumber && !isValidPhone(data.contactNumber)) {
      showAlert("Please enter a valid contact number (10 digits)", "error");
      return false;
    }

    // CGPA validation for candidates
    if (data.cgpa) {
      const cgpa = parseFloat(data.cgpa);
      if (cgpa < 0 || cgpa > 10) {
        showAlert("CGPA must be between 0 and 10", "error");
        return false;
      }
    }

    // LinkedIn URL validation
    if (data.linkedinUrl && !isValidLinkedInUrl(data.linkedinUrl)) {
      showAlert("Please enter a valid LinkedIn URL", "error");
      return false;
    }

    return true;
  }

  // Validation helper functions
  function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  function isValidPhone(phone) {
    const phoneRegex = /^\d{10}$/;
    return phoneRegex.test(phone.replace(/\D/g, ""));
  }

  function isValidLinkedInUrl(url) {
    const linkedinRegex = /^https?:\/\/(www\.)?linkedin\.com\/.*$/;
    return linkedinRegex.test(url);
  }

  // Generate unique ID
  function generateUniqueId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  // Alert system
  function showAlert(message, type) {
    hideAlert(); // Remove any existing alert

    const alertContainer = document.querySelector(".alert-container");
    const alert = document.createElement("div");
    alert.className = `alert alert-${type}`;
    alert.textContent = message;

    // Add styles for alerts
    alert.style.cssText = `
      padding: 12px 15px;
      margin-bottom: 15px;
      border-radius: 5px;
      font-weight: 500;
      animation: slideDown 0.3s ease;
    `;

    if (type === "success") {
      alert.style.background = "#d4edda";
      alert.style.color = "#155724";
      alert.style.border = "1px solid #c3e6cb";
    } else if (type === "error") {
      alert.style.background = "#f8d7da";
      alert.style.color = "#721c24";
      alert.style.border = "1px solid #f5c6cb";
    }

    alertContainer.appendChild(alert);

    // Auto-hide success messages after 5 seconds
    if (type === "success") {
      setTimeout(() => hideAlert(), 5000);
    }
  }

  function hideAlert() {
    const existingAlert = document.querySelector(".alert");
    if (existingAlert) {
      existingAlert.remove();
    }
  }

  // Navigation setup
  function setupNavigation() {
    const navLinks = document.querySelectorAll("nav a");

    navLinks.forEach((link) => {
      link.addEventListener("click", function (event) {
        event.preventDefault();
        const linkText = this.textContent.trim();

        switch (linkText) {
          case "Home":
            showAlert(
              "Welcome to CHRIST University Placement Cell!",
              "success"
            );
            break;
          case "Jobs":
            showJobsModal();
            break;
          case "Post Resume":
            showResumeModal();
            break;
          case "About us":
            showAboutModal();
            break;
          case "Login":
            showLoginModal();
            break;
        }
      });
    });
  }

  // Modal functions
  function showJobsModal() {
    const jobsData = [
      {
        company: "TCS",
        role: "Software Developer",
        package: "3.5 LPA",
        deadline: "2025-01-15",
      },
      {
        company: "Infosys",
        role: "System Engineer",
        package: "4.0 LPA",
        deadline: "2025-01-20",
      },
      {
        company: "Wipro",
        role: "Project Engineer",
        package: "3.8 LPA",
        deadline: "2025-01-25",
      },
    ];

    let jobsHtml = "<h3>Available Job Opportunities</h3>";
    jobsData.forEach((job) => {
      jobsHtml += `
        <div style="border: 1px solid #ddd; padding: 10px; margin: 10px 0; border-radius: 5px;">
          <strong>${job.company}</strong> - ${job.role}<br>
          Package: ${job.package}<br>
          Application Deadline: ${job.deadline}
        </div>
      `;
    });

    showModal(jobsHtml);
  }

  function showResumeModal() {
    const resumeHtml = `
      <h3>Post Your Resume</h3>
      <p>Upload your resume to be visible to recruiters.</p>
      <input type="file" accept=".pdf,.doc,.docx" style="margin: 10px 0; padding: 5px;">
      <button onclick="alert('Resume uploaded successfully!')" style="padding: 8px 15px; background: #007bff; color: white; border: none; border-radius: 3px;">Upload Resume</button>
    `;
    showModal(resumeHtml);
  }

  function showAboutModal() {
    const aboutHtml = `
      <h3>About CHRIST University Placement Cell</h3>
      <p>CHRIST University's Placement Cell is dedicated to bridging the gap between academia and industry. We facilitate campus recruitments, provide career guidance, and ensure students are well-prepared for their professional journey.</p>
      <h4>Our Services:</h4>
      <ul>
        <li>Campus Recruitment Drives</li>
        <li>Career Counseling</li>
        <li>Industry Interaction Programs</li>
        <li>Skill Development Workshops</li>
        <li>Placement Preparation Training</li>
      </ul>
    `;
    showModal(aboutHtml);
  }

  function showLoginModal() {
    const loginHtml = `
        <h3>Login to Your Account</h3>
        <p style="color: #666; margin-bottom: 15px;">For testing, use password: 123456</p>
        <form onsubmit="handleLogin(event)" style="text-align: left;">
            <div style="margin: 10px 0;">
                <label>Email:</label><br>
                <input type="email" name="email" required style="width: 100%; padding: 8px; margin-top: 5px;">
            </div>
            <div style="margin: 10px 0;">
                <label>Password:</label><br>
                <input type="password" name="password" required style="width: 100%; padding: 8px; margin-top: 5px;">
            </div>
            <div style="margin: 10px 0;">
                <label>User Type:</label><br>
                <select name="userType" required style="width: 100%; padding: 8px; margin-top: 5px;">
                    <option value="">Select Type</option>
                    <option value="employer">Employer</option>
                    <option value="candidate">Candidate</option>
                    <option value="faculty">Faculty</option>
                </select>
            </div>
            <button type="submit" style="width: 100%; padding: 10px; background: #007bff; color: white; border: none; border-radius: 5px; margin-top: 10px;">Login</button>
        </form>
    `;
    showModal(loginHtml);
  }

  function showModal(content) {
    // Remove existing modal
    const existingModal = document.querySelector(".custom-modal");
    if (existingModal) {
      existingModal.remove();
    }

    // Create modal
    const modal = document.createElement("div");
    modal.className = "custom-modal";
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 1000;
    `;

    const modalContent = document.createElement("div");
    modalContent.style.cssText = `
      background: white;
      padding: 30px;
      border-radius: 10px;
      max-width: 500px;
      width: 90%;
      max-height: 80vh;
      overflow-y: auto;
      position: relative;
      color: #333;
    `;

    const closeBtn = document.createElement("span");
    closeBtn.innerHTML = "&times;";
    closeBtn.style.cssText = `
      position: absolute;
      top: 10px;
      right: 15px;
      font-size: 25px;
      cursor: pointer;
      color: #999;
    `;

    closeBtn.addEventListener("click", () => modal.remove());
    modal.addEventListener("click", (e) => {
      if (e.target === modal) modal.remove();
    });

    modalContent.innerHTML = content;
    modalContent.appendChild(closeBtn);
    modal.appendChild(modalContent);
    document.body.appendChild(modal);
  }

  // Login handler (global function)
  window.handleLogin = function (event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    const email = formData.get("email");
    const password = formData.get("password"); // We'll use this for basic auth
    const userType = formData.get("userType");

    // Check if user exists
    const users = registeredUsers[userType] || [];
    const user = users.find(
      (u) =>
        u.companyEmail === email ||
        u.personalEmail === email ||
        u.officialEmail === email
    );

    if (user && password === "123456") {
      // Basic password check (in real app, use proper auth)
      // Store current user info
      localStorage.setItem(
        "currentUser",
        JSON.stringify({
          fullName: user.fullName,
          userType: userType,
          email: email,
        })
      );

      // Redirect to dashboard
      window.location.href = "dashboard.html";
    } else {
      alert("Invalid credentials. Please try again. (Use password: 123456)");
    }
  };

  // Local storage functions
  function saveToLocalStorage() {
    localStorage.setItem(
      "christPlacementUsers",
      JSON.stringify(registeredUsers)
    );
  }

  function loadStoredData() {
    const stored = localStorage.getItem("christPlacementUsers");
    if (stored) {
      registeredUsers = JSON.parse(stored);
    }
  }

  // Statistics function
  function showRegistrationStats() {
    const stats = {
      employers: registeredUsers.employer.length,
      candidates: registeredUsers.candidate.length,
      faculty: registeredUsers.faculty.length,
      total:
        registeredUsers.employer.length +
        registeredUsers.candidate.length +
        registeredUsers.faculty.length,
    };

    console.log("Registration Statistics:", stats);
    return stats;
  }

  // Make stats available globally
  window.getRegistrationStats = showRegistrationStats;

  // Add CSS animations
  const style = document.createElement("style");
  style.textContent = `
    @keyframes slideDown {
      from {
        opacity: 0;
        transform: translateY(-10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    
    .form-row input:focus,
    .form-row select:focus {
      outline: 2px solid #007bff;
      outline-offset: 2px;
    }
    
    .sign-up-btn:hover {
      transform: translateY(-1px);
      transition: transform 0.2s ease;
    }
    
    .tab {
      transition: all 0.3s ease;
    }
    
    .tab:hover {
      transform: translateY(-2px);
    }
  `;
  document.head.appendChild(style);

  // Initialize the application
  init();

  // Welcome message
  console.log("🎓 CHRIST University Placement Cell - Enhanced Version Loaded!");
  console.log(
    "💡 Features: Dynamic forms, validation, local storage, modals, and more!"
  );
  console.log(
    "📊 Type getRegistrationStats() in console to see registration statistics"
  );
});
