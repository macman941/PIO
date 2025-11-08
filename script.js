const headerTitle = document.querySelector('.page-header h1');
const headerSubtitle = document.querySelector('.page-header p');
const startActions = document.getElementById('startActions');
const loginPanel = document.getElementById('loginPanel');
const signupPanel = document.getElementById('signupPanel');
const appShell = document.getElementById('appShell');
const loginForm = document.getElementById('loginForm');
const signupForm = document.getElementById('signupForm');
const loginTrigger = document.querySelector('[data-action="show-login"]');
const signupTrigger = document.querySelector('[data-action="show-signup"]');
const authBackButtons = document.querySelectorAll('[data-action="auth-back"]');

loginTrigger?.addEventListener('click', () => openAuthPanel('login'));
signupTrigger?.addEventListener('click', () => openAuthPanel('signup'));
authBackButtons.forEach((button) => {
    button.addEventListener('click', () => {
        hideAuthPanels();
        resetHeader();
        startActions?.removeAttribute('hidden');
    });
});

loginForm?.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!loginForm.reportValidity()) {
        return;
    }

    const email = loginForm.loginEmail.value.trim();
    const displayName = deriveDisplayName('', email);

    completeAuthentication(displayName);
    loginForm.reset();
});

signupForm?.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!signupForm.reportValidity()) {
        return;
    }

    const name = signupForm.signupName.value.trim();
    const email = signupForm.signupEmail.value.trim();
    const displayName = deriveDisplayName(name, email);

    completeAuthentication(displayName);
    signupForm.reset();
});

function openAuthPanel(type) {
    startActions?.setAttribute('hidden', '');
    hideAuthPanels();

    const panel = type === 'login' ? loginPanel : signupPanel;
    if (!panel) return;

    panel.removeAttribute('hidden');

    if (headerSubtitle) {
        headerSubtitle.textContent =
            type === 'login'
                ? 'Log in to access your locate tickets.'
                : 'Create your account to start logging locate details.';
    }

    const firstInput = panel.querySelector('input');
    if (firstInput) {
        firstInput.focus();
    }
}

function hideAuthPanels() {
    loginPanel?.setAttribute('hidden', '');
    signupPanel?.setAttribute('hidden', '');
}

function resetHeader() {
    if (headerTitle) {
        headerTitle.textContent = 'Locate Ticket Portal';
    }
    if (headerSubtitle) {
        headerSubtitle.textContent = 'Choose how you’d like to get started.';
    }
    document.title = 'Locate Ticket Portal';
}

function deriveDisplayName(name, email) {
    if (name) {
        return name;
    }

    if (!email) {
        return 'User';
    }

    const localPart = email.split('@')[0] || '';
    if (!localPart) {
        return 'User';
    }

    return localPart.charAt(0).toUpperCase() + localPart.slice(1);
}

function completeAuthentication(name) {
    hideAuthPanels();
    startActions?.setAttribute('hidden', '');
    if (appShell) {
        appShell.removeAttribute('hidden');
    }
    if (headerTitle) {
        headerTitle.textContent = 'Locate Ticket Log';
    }
    if (headerSubtitle) {
        headerSubtitle.textContent = `Welcome${name ? `, ${name}` : ''}! Record locate details and keep everything in one place.`;
    }
    document.title = 'Locate Ticket Log';
    const ticketNumberField = form?.ticketNumber;
    if (ticketNumberField) {
        ticketNumberField.focus();
    }
}

const locatorOptions = [
    'Alex Johnson',
    'Brittany Lee',
    'Carlos Mendoza',
    'Danielle Chen',
    'Evan Porter'
];

const tickets = [];

const form = document.getElementById('ticketForm');
const locatorSelect = document.getElementById('locatorName');
const ticketList = document.getElementById('ticketList');
const ticketTemplate = document.getElementById('ticketTemplate');
const ticketCount = document.getElementById('ticketCount');
const ticketCountSuffix = document.getElementById('ticketCountSuffix');
const requiredFields = ['ticketNumber', 'jobAddress', 'locatorName', 'dateLocated'];

populateLocatorOptions();
attachValidationHandlers();
form.addEventListener('submit', handleSubmit);

function populateLocatorOptions() {
    const fragment = document.createDocumentFragment();
    locatorOptions.forEach((name) => {
        const option = document.createElement('option');
        option.value = name;
        option.textContent = name;
        fragment.appendChild(option);
    });
    locatorSelect.appendChild(fragment);
}

function attachValidationHandlers() {
    requiredFields.forEach((fieldName) => {
        const input = form[fieldName];
        if (!input) return;
        const eventType = input.tagName === 'SELECT' ? 'change' : 'input';
        input.addEventListener(eventType, () => clearFieldError(fieldName));
    });
}

function handleSubmit(event) {
    event.preventDefault();

    const formElements = {
        ticketNumber: form.ticketNumber,
        jobAddress: form.jobAddress,
        locatorName: form.locatorName,
        dateLocated: form.dateLocated
    };

    const isValid = validateForm(formElements);
    if (!isValid) {
        return;
    }

    const comments = form.comments.value.trim();
    const files = Array.from(form.photos.files || []);

    Promise.all(files.map(readFileAsDataURL))
        .then((photos) => {
            const ticket = {
                ticketNumber: form.ticketNumber.value.trim(),
                jobAddress: form.jobAddress.value.trim(),
                locatorName: form.locatorName.value,
                dateLocated: form.dateLocated.value,
                comments,
                photos
            };

            tickets.unshift(ticket);
            renderTickets();
            form.reset();
            locatorSelect.value = '';
            requiredFields.forEach(clearFieldError);
        })
        .catch((error) => {
            console.error('Error reading photos', error);
        });
}

function validateForm(fields) {
    let allValid = true;

    Object.entries(fields).forEach(([name, input]) => {
        const value = input.value.trim();
        if (!value) {
            setFieldError(name, 'This field is required.');
            input.setAttribute('aria-invalid', 'true');
            allValid = false;
        } else {
            clearFieldError(name);
            input.removeAttribute('aria-invalid');
        }
    });

    return allValid;
}

function setFieldError(fieldName, message) {
    const errorEl = form.querySelector(`[data-error-for="${fieldName}"]`);
    if (errorEl) {
        errorEl.textContent = message;
    }
}

function clearFieldError(fieldName) {
    const input = form[fieldName];
    if (input) {
        input.removeAttribute('aria-invalid');
    }
    const errorEl = form.querySelector(`[data-error-for="${fieldName}"]`);
    if (errorEl) {
        errorEl.textContent = '';
    }
}

function readFileAsDataURL(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve({ name: file.name, url: reader.result });
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(file);
    });
}

function renderTickets() {
    ticketList.innerHTML = '';

    if (!tickets.length) {
        const empty = document.createElement('p');
        empty.className = 'empty-state';
        empty.textContent = 'No locates recorded yet. Add your first entry with the form.';
        ticketList.appendChild(empty);
    } else {
        tickets.forEach((ticket) => {
            const entry = ticketTemplate.content.firstElementChild.cloneNode(true);
            const numberEl = entry.querySelector('.ticket__number');
            const addressEl = entry.querySelector('.ticket__address');
            const locatorEl = entry.querySelector('.ticket__locator');
            const dateEl = entry.querySelector('.ticket__date');
            const commentsSection = entry.querySelector('.ticket__comments');
            const commentsParagraph = commentsSection.querySelector('p');
            const photosSection = entry.querySelector('.ticket__photos');
            const photoGrid = entry.querySelector('.ticket__photo-grid');

            numberEl.textContent = `Ticket ${ticket.ticketNumber}`;
            addressEl.textContent = ticket.jobAddress;
            locatorEl.textContent = ticket.locatorName;

            const date = ticket.dateLocated ? new Date(ticket.dateLocated) : null;
            if (date) {
                const formatted = date.toLocaleDateString(undefined, {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                });
                dateEl.dateTime = ticket.dateLocated;
                dateEl.textContent = formatted;
            }

            if (ticket.comments) {
                commentsSection.hidden = false;
                commentsParagraph.textContent = ticket.comments;
            }

            if (ticket.photos.length) {
                photosSection.hidden = false;
                ticket.photos.forEach((photo) => {
                    const img = document.createElement('img');
                    img.src = photo.url;
                    img.alt = photo.name;
                    photoGrid.appendChild(img);
                });
            }

            ticketList.appendChild(entry);
        });
    }

    ticketCount.textContent = String(tickets.length);
    ticketCountSuffix.textContent = tickets.length === 1 ? '' : 's';
}
