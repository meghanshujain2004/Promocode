/* ==========================================================================
   GRABON STYLE MYNTRA COUPONS SCRIPT (UNIQUE CODE PER CARD + MYSQL API)
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    // ----------------------------------------------------------------------
    // DOM Elements
    // ----------------------------------------------------------------------
    const couponForm = document.getElementById('couponForm');
    const fullNameInput = document.getElementById('fullName');
    const ageInput = document.getElementById('age');
    const genderSelect = document.getElementById('gender');
    const sourceSelect = document.getElementById('source');
    const mobileInput = document.getElementById('mobile');

    const nameError = document.getElementById('nameError');
    const ageError = document.getElementById('ageError');
    const genderError = document.getElementById('genderError');
    const sourceError = document.getElementById('sourceError');
    const mobileError = document.getElementById('mobileError');

    const leadCaptureModal = document.getElementById('leadCaptureModal');
    const closeLeadModalBtn = document.getElementById('closeLeadModalBtn');
    const leadFormState = document.getElementById('leadFormState');
    const unlockedCodeState = document.getElementById('unlockedCodeState');
    const modalOfferTitle = document.getElementById('modalOfferTitle');
    const couponCodeEl = document.getElementById('couponCode');

    const copyBtn = document.getElementById('copyBtn');
    const copyText = document.getElementById('copyText');
    const toast = document.getElementById('toast');
    const toastMsg = document.getElementById('toastMsg');

    // Admin Dashboard Elements
    const openAdminBtn = document.getElementById('open-admin-btn');
    const closeAdminBtn = document.getElementById('closeAdminBtn');
    const adminModal = document.getElementById('adminModal');
    const adminAuthSection = document.getElementById('adminAuthSection');
    const adminDataSection = document.getElementById('adminDataSection');
    const adminPinInput = document.getElementById('adminPinInput');
    const adminLoginBtn = document.getElementById('adminLoginBtn');
    const authError = document.getElementById('authError');
    const leadsTableBody = document.getElementById('leadsTableBody');
    const totalLeadsCount = document.getElementById('totalLeadsCount');
    const emptyLeadsState = document.getElementById('emptyLeadsState');
    const leadSearchInput = document.getElementById('leadSearchInput');
    const exportJsonBtn = document.getElementById('exportJsonBtn');
    const clearDataBtn = document.getElementById('clearDataBtn');

    // State Variables
    let isAdminAuthenticated = false;
    let currentSelectedCode = 'BFF50'; // default fallback

    // Helper: Get CSRF Token
    function getCsrfToken() {
        const tokenInput = document.querySelector('[name=csrfmiddlewaretoken]');
        return tokenInput ? tokenInput.value : '';
    }

    // ----------------------------------------------------------------------
    // 1. Open Lead Capture Modal with UNIQUE Card Code
    // ----------------------------------------------------------------------
    document.querySelectorAll('.trigger-lead-modal').forEach(btn => {
        btn.addEventListener('click', () => {
            const offerTitle = btn.getAttribute('data-offer') || 'Myntra 50% OFF Coupon';
            currentSelectedCode = btn.getAttribute('data-code') || 'BFF50';

            modalOfferTitle.innerHTML = `<i class="fa-solid fa-ticket-simple text-pink"></i> Fill details to unlock: <strong>${offerTitle}</strong>`;
            
            // Reset form view
            leadFormState.classList.remove('hidden');
            unlockedCodeState.classList.add('hidden');
            leadCaptureModal.classList.remove('hidden');
            fullNameInput.focus();
        });
    });

    closeLeadModalBtn.addEventListener('click', () => {
        leadCaptureModal.classList.add('hidden');
    });

    // ----------------------------------------------------------------------
    // 2. Mobile & Form Validation Functions
    // ----------------------------------------------------------------------

    function isValidMobileNumber(phone) {
        const cleanPhone = phone.trim().replace(/\D/g, '');
        if (cleanPhone.length !== 10) return false;
        if (!/^[6-9]/.test(cleanPhone)) return false;
        if (/^(\d)\1{9}$/.test(cleanPhone)) return false;
        const dummySequences = [
            '1234567890', '0123456789', '9876543210', '8765432109',
            '9876543211', '1234512345', '9876598765', '0000000000',
            '9999900000', '1234567899'
        ];
        if (dummySequences.includes(cleanPhone)) return false;
        return true;
    }

    mobileInput.addEventListener('input', (e) => {
        e.target.value = e.target.value.replace(/\D/g, '').slice(0, 10);
    });

    function clearErrors() {
        const groups = document.querySelectorAll('.form-group');
        groups.forEach(g => g.classList.remove('has-error'));
        const errors = document.querySelectorAll('.error-msg');
        errors.forEach(e => e.classList.remove('visible'));
    }

    function showError(groupEl, errorEl, msg) {
        groupEl.classList.add('has-error');
        if (msg) errorEl.textContent = msg;
        errorEl.classList.add('visible');
    }

    function validateForm() {
        clearErrors();
        let isValid = true;

        const nameVal = fullNameInput.value.trim();
        if (!nameVal || nameVal.length < 2 || !/^[a-zA-Z\s\.\'-]+$/.test(nameVal)) {
            showError(fullNameInput.closest('.form-group'), nameError, 'Please enter a valid full name (letters only)');
            isValid = false;
        }

        const ageVal = parseInt(ageInput.value, 10);
        if (isNaN(ageVal) || ageVal < 10 || ageVal > 120) {
            showError(ageInput.closest('.form-group'), ageError, 'Please enter valid age between 10 and 120');
            isValid = false;
        }

        if (!genderSelect.value) {
            showError(genderSelect.closest('.form-group'), genderError, 'Please select your gender');
            isValid = false;
        }

        if (!sourceSelect.value) {
            showError(sourceSelect.closest('.form-group'), sourceError, 'Please select where you heard about us');
            isValid = false;
        }

        const mobileVal = mobileInput.value.trim();
        if (!isValidMobileNumber(mobileVal)) {
            showError(
                mobileInput.closest('.form-group'),
                mobileError,
                'Invalid mobile number! Enter a valid 10-digit number (Starts with 6-9, no fake numbers)'
            );
            isValid = false;
        }

        return isValid;
    }

    // ----------------------------------------------------------------------
    // 3. Form Submission via Django Backend REST API
    // ----------------------------------------------------------------------

    couponForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            const btn = document.getElementById('submitBtn');
            btn.style.animation = 'shake 0.4s ease';
            setTimeout(() => btn.style.animation = '', 400);
            return;
        }

        const submitBtn = document.getElementById('submitBtn');
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span>Saving to MySQL...</span> <i class="fa-solid fa-spinner fa-spin"></i>';

        const payload = {
            fullName: fullNameInput.value.trim(),
            age: ageInput.value.trim(),
            gender: genderSelect.value,
            source: sourceSelect.value,
            mobile: mobileInput.value.trim(),
            couponCode: currentSelectedCode
        };

        try {
            const response = await fetch('/api/claim-coupon/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': getCsrfToken()
                },
                body: JSON.stringify(payload)
            });

            const data = await response.json();

            if (data.success) {
                // Set the unique code on the unlocked element
                couponCodeEl.textContent = data.code || currentSelectedCode;

                // Switch modal state to Unlocked Code
                leadFormState.classList.add('hidden');
                unlockedCodeState.classList.remove('hidden');

                // Launch Festive Confetti
                launchConfetti();

                // Show Toast
                showToast(`🎉 Saved to MySQL! Unlocked Code: ${data.code}`);
            } else {
                showToast('❌ Error: ' + (data.error || 'Failed to save details'));
                if (data.error && data.error.toLowerCase().includes('mobile')) {
                    showError(mobileInput.closest('.form-group'), mobileError, data.error);
                }
            }
        } catch (err) {
            console.error('API Error:', err);
            showToast('❌ Server error. Please try again.');
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<span>Submit & Show Code</span> <i class="fa-solid fa-unlock"></i>';
        }
    });

    // ----------------------------------------------------------------------
    // 4. Copy Code Functionality
    // ----------------------------------------------------------------------

    copyBtn.addEventListener('click', () => {
        const code = couponCodeEl.textContent.trim();
        navigator.clipboard.writeText(code).then(() => {
            copyBtn.classList.add('copied');
            copyText.textContent = 'COPIED!';
            showToast(`Code ${code} copied to clipboard!`);
            setTimeout(() => {
                copyBtn.classList.remove('copied');
                copyText.textContent = 'COPY CODE';
            }, 2500);
        }).catch(err => {
            showToast(`Failed to copy. Code is: ${code}`);
        });
    });

    function showToast(message) {
        toastMsg.textContent = message;
        toast.classList.remove('hidden');
        setTimeout(() => {
            toast.classList.add('hidden');
        }, 3000);
    }

    // ----------------------------------------------------------------------
    // 5. Admin Lead Management Dashboard (MySQL API)
    // ----------------------------------------------------------------------

    function openModal() {
        adminModal.classList.remove('hidden');
        if (isAdminAuthenticated) {
            adminAuthSection.classList.add('hidden');
            adminDataSection.classList.remove('hidden');
            fetchLeadsFromBackend();
        } else {
            adminAuthSection.classList.remove('hidden');
            adminDataSection.classList.add('hidden');
            adminPinInput.value = '';
            authError.classList.add('hidden');
            adminPinInput.focus();
        }
    }

    function closeModal() {
        adminModal.classList.add('hidden');
    }

    openAdminBtn.addEventListener('click', openModal);
    closeAdminBtn.addEventListener('click', closeModal);

    // Admin Auth - PIN: 887854
    adminLoginBtn.addEventListener('click', handleAdminAuth);
    adminPinInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleAdminAuth();
    });

    async function handleAdminAuth() {
        const pin = adminPinInput.value.trim();
        try {
            const res = await fetch('/api/admin-auth/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': getCsrfToken()
                },
                body: JSON.stringify({ pin: pin })
            });

            const data = await res.json();
            if (data.success) {
                isAdminAuthenticated = true;
                adminAuthSection.classList.add('hidden');
                adminDataSection.classList.remove('hidden');
                fetchLeadsFromBackend();
            } else {
                authError.classList.remove('hidden');
            }
        } catch (e) {
            authError.classList.remove('hidden');
        }
    }

    let fetchedLeads = [];
    async function fetchLeadsFromBackend() {
        try {
            const res = await fetch('/api/get-leads/');
            const data = await res.json();
            if (data.success) {
                fetchedLeads = data.leads;
                renderLeadsTable();
            }
        } catch (e) {
            console.error('Failed to fetch DB leads:', e);
        }
    }

    function renderLeadsTable(filterQuery = '') {
        const query = filterQuery.toLowerCase().trim();

        const filtered = fetchedLeads.filter(item => {
            return (
                item.fullName.toLowerCase().includes(query) ||
                item.mobile.includes(query) ||
                item.source.toLowerCase().includes(query) ||
                item.gender.toLowerCase().includes(query) ||
                (item.couponRevealed && item.couponRevealed.toLowerCase().includes(query))
            );
        });

        totalLeadsCount.textContent = fetchedLeads.length;
        leadsTableBody.innerHTML = '';

        if (filtered.length === 0) {
            emptyLeadsState.classList.remove('hidden');
            return;
        }
        emptyLeadsState.classList.add('hidden');

        filtered.forEach((lead, idx) => {
            const tr = document.createElement('tr');
            const genderClass = (lead.gender || 'other').toLowerCase();
            tr.innerHTML = `
                <td><span class="row-num-badge">${filtered.length - idx}</span></td>
                <td><span class="lead-time">${lead.timestamp}</span></td>
                <td><strong class="lead-name">${escapeHtml(lead.fullName)}</strong></td>
                <td><span class="age-badge">${escapeHtml(lead.age)} yrs</span></td>
                <td><span class="gender-pill ${genderClass}">${escapeHtml(lead.gender)}</span></td>
                <td><span class="source-tag">${escapeHtml(lead.source)}</span></td>
                <td><code class="mobile-code">+91 ${escapeHtml(lead.mobile)}</code></td>
                <td><span class="coupon-unlocked-tag">${escapeHtml(lead.couponRevealed || 'BFF50')}</span></td>
            `;
            leadsTableBody.appendChild(tr);
        });
    }

    leadSearchInput.addEventListener('input', (e) => {
        renderLeadsTable(e.target.value);
    });

    function escapeHtml(str) {
        return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    exportJsonBtn.addEventListener('click', () => {
        if (fetchedLeads.length === 0) {
            alert('No captured lead data available.');
            return;
        }
        const blob = new Blob([JSON.stringify(fetchedLeads, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Myntra_Leads_MySQL.json`;
        a.click();
        URL.revokeObjectURL(url);
        showToast('JSON exported from MySQL!');
    });

    clearDataBtn.addEventListener('click', async () => {
        if (confirm('Are you sure you want to delete all captured lead entries from MySQL database?')) {
            try {
                const res = await fetch('/api/clear-leads/', {
                    method: 'POST',
                    headers: { 'X-CSRFToken': getCsrfToken() }
                });
                const data = await res.json();
                if (data.success) {
                    fetchedLeads = [];
                    renderLeadsTable();
                    showToast('MySQL Database records cleared.');
                }
            } catch (e) {
                showToast('Failed to clear database records.');
            }
        }
    });

    // ----------------------------------------------------------------------
    // 6. Confetti Particle Animation
    // ----------------------------------------------------------------------
    function launchConfetti() {
        const canvas = document.getElementById('confetti-canvas');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        const particles = [];
        const colors = ['#ea2b33', '#ff5000', '#ff3f6c', '#03a685', '#3b82f6', '#ffffff'];

        for (let i = 0; i < 120; i++) {
            particles.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height - canvas.height,
                size: Math.random() * 8 + 4,
                color: colors[Math.floor(Math.random() * colors.length)],
                speedY: Math.random() * 5 + 3,
                speedX: Math.random() * 4 - 2,
                rotation: Math.random() * 360,
                rotSpeed: Math.random() * 10 - 5
            });
        }

        let animationFrame;
        let opacity = 1;
        const startTime = Date.now();

        function render() {
            const elapsed = Date.now() - startTime;
            if (elapsed > 4000) {
                opacity -= 0.02;
            }

            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.globalAlpha = Math.max(0, opacity);

            particles.forEach(p => {
                p.y += p.speedY;
                p.x += p.speedX;
                p.rotation += p.rotSpeed;

                ctx.save();
                ctx.translate(p.x, p.y);
                ctx.rotate((p.rotation * Math.PI) / 180);
                ctx.fillStyle = p.color;
                ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
                ctx.restore();
            });

            if (opacity > 0) {
                animationFrame = requestAnimationFrame(render);
            } else {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                cancelAnimationFrame(animationFrame);
            }
        }

        render();
    }
});
