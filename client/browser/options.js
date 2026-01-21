// Saves options to chrome.storage
const saveOptions = () => {
    const serverUrl = document.getElementById('serverUrl').value;

    chrome.storage.sync.set(
        { serverUrl: serverUrl },
        () => {
            // Update status to let user know options were saved.
            const status = document.getElementById('status');
            status.textContent = 'Options saved.';
            setTimeout(() => {
                status.textContent = '';
            }, 2000);
        }
    );
};

// Restores select box and checkbox state using the preferences
// stored in chrome.storage.
const restoreOptions = () => {
    chrome.storage.sync.get(
        { serverUrl: 'http://localhost:3000/api/log-session' },
        (items) => {
            document.getElementById('serverUrl').value = items.serverUrl;
        }
    );
};

document.addEventListener('DOMContentLoaded', restoreOptions);
document.getElementById('save').addEventListener('click', saveOptions);

