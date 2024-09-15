document.addEventListener('DOMContentLoaded', () => {
    const authForms = document.getElementById('auth-forms');
    const dataForm = document.getElementById('data-form');
    const loginForm = document.getElementById('login');
    const registerForm = document.getElementById('register');
    const storeDataForm = document.getElementById('store-data');
    const dataList = document.getElementById('data-list');
    const userId = 1; // This should be dynamically managed based on actual login session

    // Utility function for making fetch requests
    const fetchData = async (url, method = 'GET', body = null) => {
        const response = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });
        if (!response.ok) throw new Error(`Request failed: ${response.statusText}`);
        return response.json();
    };

    // Event listener for login form
    loginForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const username = event.target.querySelector('#login-username').value;
        const password = event.target.querySelector('#login-password').value;
        try {
            const { userId } = await fetchData('/login', 'POST', { username, password });
            authForms.classList.add('hidden');
            dataForm.classList.remove('hidden');
            await loadData(userId);
        } catch (error) {
            alert('Login failed: ' + error.message);
        }
    });

    // Event listener for register form
    registerForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const username = event.target.querySelector('#register-username').value;
        const password = event.target.querySelector('#register-password').value;
        try {
            await fetchData('/register', 'POST', { username, password });
            alert('Registration successful');
            toggleForms(false);
        } catch (error) {
            alert('Registration failed: ' + error.message);
        }
    });

    // Event listener for store data form
    storeDataForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const website = event.target.querySelector('#website').value;
        const username = event.target.querySelector('#data-username').value;
        const password = event.target.querySelector('#data-password').value;
        const notes = event.target.querySelector('#notes').value;
        try {
            await fetchData('/store', 'POST', { userId, website, username, password, notes });
            await loadData(userId);
        } catch (error) {
            alert('Failed to save data: ' + error.message);
        }
    });

    // Event delegation for data list
    dataList.addEventListener('click', async (event) => {
        if (event.target.classList.contains('delete-button')) {
            const id = event.target.dataset.id;
            try {
                await fetchData(`/delete/${id}`, 'DELETE');
                await loadData(userId);
            } catch (error) {
                alert('Failed to delete data: ' + error.message);
            }
        }
    });

    // Show/Hide forms
    document.getElementById('show-register').addEventListener('click', () => toggleForms(true));
    document.getElementById('cancel-register').addEventListener('click', () => toggleForms(false));

    function toggleForms(showRegister) {
        document.getElementById('login-form').classList.toggle('hidden', showRegister);
        document.getElementById('register-form').classList.toggle('hidden', !showRegister);
    }

    // Load user data
    async function loadData(userId) {
        try {
            const data = await fetchData(`/data?userId=${userId}`);
            dataList.innerHTML = data.map(item => `
                <li>
                    <strong>Website:</strong> ${item.website}<br>
                    <strong>Username:</strong> ${item.username}<br>
                    <strong>Notes:</strong> ${item.notes}<br>
                    <button class="delete-button" data-id="${item.id}">Delete</button>
                </li>
            `).join('');
        } catch (error) {
            alert('Failed to load data: ' + error.message);
        }
    }
});
