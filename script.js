/* ==========================================================================
   MYNTRA COUPON REVEAL & LEAD CAPTURE SCRIPT
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

    const lockedView = document.getElementById('lockedView');
    const unlockedView = document.getElementById('unlockedView');
    const copyBtn = document.getElementById('copyBtn');
    const copyText = document.getElementById('copyText');
    const toast = document.getElementById('toast');
    const toastMsg = document.getElementById('toastMsg');
    const countdownEl = document.getElementById('countdown');

    // Admin Dashboard Elements
    const openAdminBtn = document.getElementById('open-admin-btn');
    const footerAdminBtn = document.getElementById('footerAdminBtn');
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
    const exportCsvBtn = document.getElementById('exportCsvBtn');
    const exportJsonBtn = document.getElementById('exportJsonBtn');
    const clearDataBtn = document.getElementById('clearDataBtn');

    // State Variables
    let isAdminAuthenticated = false;
    const STORAGE_KEY = 'myntra_captured_leads_v1';

    // ----------------------------------------------------------------------
    // 1. Mobile & Form Validation Functions
    // ----------------------------------------------------------------------

    /**
     * Checks if a mobile number is dummy / anonymous / fake.
     * Rejects:
     * - Numbers not starting with 6, 7, 8, 9
     * - Repetitive single digits (0000000000, 9999999999, etc.)
     * - Sequential digits (1234567890, 9876543210, etc.)
     * - Repeated block patterns (1231231234, 9876598765)
     */
    function isValidMobileNumber(phone) {
        const cleanPhone = phone.trim().replace(/\D/g, '');

        // 1. Must be exactly 10 digits
        if (cleanPhone.length !== 10) return false;

        // 2. Must start with 6, 7, 8, or 9
        if (!/^[6-9]/.test(cleanPhone)) return false;

        // 3. Reject all identical digits (e.g. 9999999999, 8888888888)
        if (/^(\d)\1{9}$/.test(cleanPhone)) return false;

        // 4. Reject common dummy sequences
        const dummySequences = [
            '1234567890', '0123456789', '9876543210', '8765432109',
            '9876543211', '1234512345', '9876598765', '0000000000',
            '9999900000', '1234567899'
        ];
        if (dummySequences.includes(cleanPhone)) return false;

        // 5. Reject if more than 7 digits are identical
        const counts = {};
        for (let char of cleanPhone) {
            counts[char] = (counts[char] || 0) + 1;
            if (counts[char] >= 8) return false;
        }

        return true;
    }

    // Input sanitization / filter mobile input to numbers only
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

        // Validate Full Name
        const nameVal = fullNameInput.value.trim();
        if (!nameVal || nameVal.length < 2 || !/^[a-zA-Z\s\.\'-]+$/.test(nameVal)) {
            showError(fullNameInput.closest('.form-group'), nameError, 'Please enter a valid full name (letters only)');
            isValid = false;
        }

        // Validate Age
        const ageVal = parseInt(ageInput.value, 10);
        if (isNaN(ageVal) || ageVal < 10 || ageVal > 120) {
            showError(ageInput.closest('.form-group'), ageError, 'Please enter valid age between 10 and 120');
            isValid = false;
        }

        // Validate Gender
        if (!genderSelect.value) {
            showError(genderSelect.closest('.form-group'), genderError, 'Please select your gender');
            isValid = false;
        }

        // Validate Source
        if (!sourceSelect.value) {
            showError(sourceSelect.closest('.form-group'), sourceError, 'Please select where you heard about us');
            isValid = false;
        }

        // Validate Mobile Number
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
    // 2. Form Submission & Storage Handling
    // ----------------------------------------------------------------------

    function getStoredLeads() {
        try {
            const data = localStorage.getItem(STORAGE_KEY);
            return data ? JSON.parse(data) : [];
        } catch (e) {
            console.error('Storage parse error:', e);
            return [];
        }
    }

    function saveLead(lead) {
        const leads = getStoredLeads();
        leads.unshift(lead); // add to top
        localStorage.setItem(STORAGE_KEY, JSON.stringify(leads));
    }

    couponForm.addEventListener('submit', (e) => {
        e.preventDefault();

        if (!validateForm()) {
            // Shake button on error
            const btn = document.getElementById('submitBtn');
            btn.style.animation = 'shake 0.4s ease';
            setTimeout(() => btn.style.animation = '', 400);
            return;
        }

        // Collect lead data
        const newLead = {
            id: 'LD-' + Date.now().toString(36).toUpperCase(),
            timestamp: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
            fullName: fullNameInput.value.trim(),
            age: ageInput.value.trim(),
            gender: genderSelect.value,
            source: sourceSelect.value,
            mobile: mobileInput.value.trim(),
            couponRevealed: 'NEW50'
        };

        // Save lead locally
        saveLead(newLead);

        // Switch card to Unlocked state
        lockedView.classList.add('hidden');
        unlockedView.classList.remove('hidden');

        // Launch Festive Confetti
        launchConfetti();

        // Show Toast
        showToast('🎉 Coupon Unlocked! Code: NEW50');
    });

    // ----------------------------------------------------------------------
    // 3. Copy Code & Store Interactivity
    // ----------------------------------------------------------------------

    copyBtn.addEventListener('click', () => {
        const code = 'NEW50';
        navigator.clipboard.writeText(code).then(() => {
            copyBtn.classList.add('copied');
            copyText.textContent = 'COPIED!';
            showToast('Code NEW50 copied to clipboard!');
            setTimeout(() => {
                copyBtn.classList.remove('copied');
                copyText.textContent = 'COPY CODE';
            }, 2500);
        }).catch(err => {
            showToast('Failed to copy. Code is: NEW50');
        });
    });

    // Add to Bag buttons
    document.querySelectorAll('.btn-add-bag').forEach(btn => {
        btn.addEventListener('click', () => {
            const card = btn.closest('.product-card');
            const title = card ? card.querySelector('.product-title').textContent : 'Item';
            showToast(`Added "${title}" to your Bag!`);
        });
    });

    // Wishlist buttons
    document.querySelectorAll('.wishlist-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const icon = btn.querySelector('i');
            if (icon.classList.contains('fa-regular')) {
                icon.classList.remove('fa-regular');
                icon.classList.add('fa-solid');
                icon.style.color = '#ff3f6c';
                showToast('Added to Wishlist!');
            } else {
                icon.classList.remove('fa-solid');
                icon.classList.add('fa-regular');
                icon.style.color = 'white';
                showToast('Removed from Wishlist');
            }
        });
    });

    // Category Pills
    document.querySelectorAll('.pill-btn').forEach(pill => {
        pill.addEventListener('click', () => {
            document.querySelectorAll('.pill-btn').forEach(p => p.classList.remove('active'));
            pill.classList.add('active');
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
    // 4. Urgency Countdown Timer (15:00)
    // ----------------------------------------------------------------------
    let durationSec = 15 * 60;
    function startTimer() {
        const timerInterval = setInterval(() => {
            const minutes = Math.floor(durationSec / 60);
            const seconds = durationSec % 60;
            countdownEl.textContent = `${minutes < 10 ? '0' : ''}${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
            if (durationSec <= 0) {
                clearInterval(timerInterval);
                countdownEl.textContent = 'EXPIRED';
            } else {
                durationSec--;
            }
        }, 1000);
    }
    startTimer();

    // ----------------------------------------------------------------------
    // 5. Admin Lead Management Dashboard
    // ----------------------------------------------------------------------

    function openModal() {
        adminModal.classList.remove('hidden');
        if (isAdminAuthenticated) {
            adminAuthSection.classList.add('hidden');
            adminDataSection.classList.remove('hidden');
            renderLeadsTable();
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
    footerAdminBtn.addEventListener('click', openModal);
    closeAdminBtn.addEventListener('click', closeModal);

    // Admin Auth - PIN: 887854
    adminLoginBtn.addEventListener('click', handleAdminAuth);
    adminPinInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleAdminAuth();
    });

    function handleAdminAuth() {
        const pin = adminPinInput.value.trim();
        if (pin === '887854') {
            isAdminAuthenticated = true;
            adminAuthSection.classList.add('hidden');
            adminDataSection.classList.remove('hidden');
            renderLeadsTable();
        } else {
            authError.classList.remove('hidden');
        }
    }

    // Render Table
    function renderLeadsTable(filterQuery = '') {
        const leads = getStoredLeads();
        const query = filterQuery.toLowerCase().trim();

        const filtered = leads.filter(item => {
            return (
                item.fullName.toLowerCase().includes(query) ||
                item.mobile.includes(query) ||
                item.source.toLowerCase().includes(query) ||
                item.gender.toLowerCase().includes(query)
            );
        });

        totalLeadsCount.textContent = leads.length;
        leadsTableBody.innerHTML = '';

        if (filtered.length === 0) {
            emptyLeadsState.classList.remove('hidden');
            return;
        }
        emptyLeadsState.classList.add('hidden');

        filtered.forEach((lead, idx) => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${filtered.length - idx}</td>
                <td><small>${lead.timestamp}</small></td>
                <td><strong>${escapeHtml(lead.fullName)}</strong></td>
                <td>${escapeHtml(lead.age)}</td>
                <td>${escapeHtml(lead.gender)}</td>
                <td><span class="badge-tag">${escapeHtml(lead.source)}</span></td>
                <td><code>+91 ${escapeHtml(lead.mobile)}</code></td>
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

    // Export to CSV
    exportCsvBtn.addEventListener('click', () => {
        const leads = getStoredLeads();
        if (leads.length === 0) {
            alert('No captured lead data available to export.');
            return;
        }

        let csvContent = '\uFEFF'; // UTF-8 BOM
        csvContent += 'ID,Date & Time,Full Name,Age,Gender,Heard From,Mobile Number,Coupon Code\n';

        leads.forEach(lead => {
            const row = [
                `"${lead.id}"`,
                `"${lead.timestamp}"`,
                `"${lead.fullName.replace(/"/g, '""')}"`,
                `"${lead.age}"`,
                `"${lead.gender}"`,
                `"${lead.source}"`,
                `"+91 ${lead.mobile}"`,
                `"${lead.couponRevealed}"`
            ].join(',');
            csvContent += row + '\n';
        });

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Myntra_Leads_${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        showToast('CSV downloaded successfully!');
    });

    // Export to JSON
    exportJsonBtn.addEventListener('click', () => {
        const leads = getStoredLeads();
        if (leads.length === 0) {
            alert('No captured lead data available to export.');
            return;
        }

        const blob = new Blob([JSON.stringify(leads, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Myntra_Leads_${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
        showToast('JSON downloaded successfully!');
    });

    // Clear All
    clearDataBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to delete all captured lead entries? This action cannot be undone.')) {
            localStorage.removeItem(STORAGE_KEY);
            renderLeadsTable();
            showToast('All lead records cleared.');
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
        const colors = ['#ff3f6c', '#f43397', '#ffb400', '#10b981', '#3b82f6', '#ffffff'];

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

// Keyframe animation for shake on error
const styleSheet = document.createElement('style');
styleSheet.textContent = `
@keyframes shake {
    0%, 100% { transform: translateX(0); }
    20%, 60% { transform: translateX(-8px); }
    40%, 80% { transform: translateX(8px); }
}
`;
document.head.appendChild(styleSheet);
