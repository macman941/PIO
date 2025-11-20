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
const viewTriggers = document.querySelectorAll('[data-view-target]');
const viewPanels = document.querySelectorAll('[data-view]');

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
        headerTitle.textContent = 'CFM Locate Ticket Log';
    }
    if (headerSubtitle) {
        headerSubtitle.textContent = 'Choose how you’d like to get started.';
    }
    document.title = 'CFM Locate Ticket Log';
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
        headerTitle.textContent = 'CFM Locate Ticket Log';
    }
    if (headerSubtitle) {
        headerSubtitle.textContent = `Welcome${name ? `, ${name}` : ''}! Record locate details and keep everything in one place.`;
    }
    document.title = 'CFM Locate Ticket Log';
    const ticketNumberField = form?.ticketNumber;
    if (ticketNumberField) {
        ticketNumberField.focus();
    }
}

function setActiveView(viewName) {
    viewPanels.forEach((panel) => {
        const isActive = panel.dataset.view === viewName;
        panel.toggleAttribute('hidden', !isActive);
        panel.setAttribute('aria-hidden', String(!isActive));
    });

    viewTriggers.forEach((trigger) => {
        const isActive = trigger.dataset.viewTarget === viewName;
        trigger.classList.toggle('is-active', isActive);
        trigger.setAttribute('aria-selected', String(isActive));
        trigger.setAttribute('tabindex', isActive ? '0' : '-1');
    });
}

const locatorOptions = [
    'Lance Schrimer',
    'Anthony Benza',
    'Joseph Juhasz',
    'Shane Lee',
    'Shaun McDonald',
    'Michel Lam'
];

const STORAGE_KEY = 'locateTickets';
let tickets = loadTickets();

const form = document.getElementById('ticketForm');
const locatorSelect = document.getElementById('locatorName');
const archiveFilter = document.getElementById('archiveLocatorFilter');
const archiveSearch = document.getElementById('archiveSearch');
const ticketList = document.getElementById('ticketList');
const ticketTemplate = document.getElementById('ticketTemplate');
const ticketCount = document.getElementById('ticketCount');
const ticketCountSuffix = document.getElementById('ticketCountSuffix');
const requiredFields = ['ticketNumber', 'jobAddress', 'locatorName', 'dateLocated'];

populateLocatorOptions();
attachValidationHandlers();
archiveFilter?.addEventListener('change', () => renderTickets());
archiveSearch?.addEventListener('input', () => renderTickets());
form?.addEventListener('submit', handleSubmit);
viewTriggers.forEach((trigger) => {
    trigger.addEventListener('click', () => {
        const target = trigger.dataset.viewTarget || 'record';
        setActiveView(target);
    });
});
setActiveView('record');
renderTickets();

function loadTickets() {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
        return [];
    }

    try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
            return parsed.map((ticket) => ({
                ticketNumber: ticket.ticketNumber || '',
                jobAddress: ticket.jobAddress || '',
                locatorName: ticket.locatorName || '',
                dateLocated: ticket.dateLocated || '',
                comments: ticket.comments || '',
                photos: Array.isArray(ticket.photos) ? ticket.photos : []
            }));
        }
    } catch (error) {
        console.warn('Unable to parse stored tickets', error);
    }

    return [];
}

function persistTickets() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tickets));
}

function populateLocatorOptions() {
    if (!locatorSelect) {
        return;
    }

    const previousSelection = locatorSelect.value;
    const previousFilter = archiveFilter?.value || 'all';

    locatorSelect.innerHTML = '';
    if (archiveFilter) {
        archiveFilter.innerHTML = '';
    }

    const formDefault = document.createElement('option');
    formDefault.value = '';
    formDefault.textContent = 'Select locator';
    locatorSelect.appendChild(formDefault);

    if (archiveFilter) {
        const filterDefault = document.createElement('option');
        filterDefault.value = 'all';
        filterDefault.textContent = 'All locators';
        archiveFilter.appendChild(filterDefault);
    }

    const locatorPool = new Set([...locatorOptions, ...tickets.map((ticket) => ticket.locatorName).filter(Boolean)]);
    const sortedLocators = [...locatorPool].sort((a, b) => a.localeCompare(b));

    sortedLocators.forEach((name) => {
        const formOption = document.createElement('option');
        formOption.value = name;
        formOption.textContent = name;
        locatorSelect.appendChild(formOption);

        if (archiveFilter) {
            const filterOption = document.createElement('option');
            filterOption.value = name;
            filterOption.textContent = name;
            archiveFilter.appendChild(filterOption);
        }
    });

    const hasPreviousFormSelection = sortedLocators.includes(previousSelection);
    locatorSelect.value = hasPreviousFormSelection ? previousSelection : '';

    if (archiveFilter) {
        const hasPreviousFilterSelection = previousFilter === 'all' || sortedLocators.includes(previousFilter);
        archiveFilter.value = hasPreviousFilterSelection ? previousFilter : 'all';
    }
}

function attachValidationHandlers() {
    if (!form) {
        return;
    }

    requiredFields.forEach((fieldName) => {
        const input = form[fieldName];
        if (!input) return;
        const eventType = input.tagName === 'SELECT' ? 'change' : 'input';
        input.addEventListener(eventType, () => clearFieldError(fieldName));
    });
}

function handleSubmit(event) {
    event.preventDefault();

    if (!form) {
        return;
    }

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
            populateLocatorOptions();
            renderTickets();
            persistTickets();
            form.reset();
            if (locatorSelect) {
                locatorSelect.value = '';
            }
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
    if (!form) {
        return;
    }

    const errorEl = form.querySelector(`[data-error-for="${fieldName}"]`);
    if (errorEl) {
        errorEl.textContent = message;
    }
}

function clearFieldError(fieldName) {
    if (!form) {
        return;
    }

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
    if (!ticketList || !ticketTemplate) {
        return;
    }

    ticketList.innerHTML = '';

    const selectedLocator = archiveFilter?.value || 'all';
    const visibleTickets =
        selectedLocator === 'all'
            ? tickets
            : tickets.filter((ticket) => ticket.locatorName === selectedLocator);

    const searchTerm = (archiveSearch?.value || '').trim().toLowerCase();
    const matchingTickets = searchTerm
        ? visibleTickets.filter((ticket) => {
              const haystack = `${ticket.ticketNumber} ${ticket.jobAddress}`.toLowerCase();
              return haystack.includes(searchTerm);
          })
        : visibleTickets;

    if (!matchingTickets.length) {
        const empty = document.createElement('p');
        empty.className = 'empty-state';
        const hasSearch = Boolean(searchTerm);
        const hasLocatorFilter = selectedLocator !== 'all';

        if (!tickets.length) {
            empty.textContent = 'No locates recorded yet. Add your first entry with the form.';
        } else if (hasSearch) {
            empty.textContent = 'No tickets match your search yet. Try a different ticket number or address.';
        } else if (hasLocatorFilter) {
            empty.textContent = 'No locates recorded for this locator yet.';
        } else {
            empty.textContent = 'No locates match the current filters.';
        }
        ticketList.appendChild(empty);
    } else {
        matchingTickets.forEach((ticket) => {
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

    if (ticketCount) {
        ticketCount.textContent = String(matchingTickets.length);
    }
    if (ticketCountSuffix) {
        ticketCountSuffix.textContent = matchingTickets.length === 1 ? '' : 's';
    }
}
