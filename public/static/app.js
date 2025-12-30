// ==================== STATE MANAGEMENT ====================
let currentUser = null;
let currentView = 'login';
let selectedFaculty = null;
let selectedPrivateChat = null;
let messagePolling = null;

// ==================== API CALLS ====================

async function apiCall(endpoint, method = 'GET', body = null) {
    const options = {
        method,
        headers: { 'Content-Type': 'application/json' }
    };
    if (body) options.body = JSON.stringify(body);
    
    const response = await fetch(endpoint, options);
    return response.json();
}

// ==================== AUTH FUNCTIONS ====================

async function showRegister() {
    currentView = 'register';
    const app = document.getElementById('app');
    app.innerHTML = `
        <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600 p-4">
            <div class="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
                <div class="text-center mb-6">
                    <i class="fas fa-graduation-cap text-5xl text-blue-600 mb-3"></i>
                    <h1 class="text-3xl font-bold text-gray-800">BSU Chat</h1>
                    <p class="text-gray-600 mt-2">Qeydiyyat</p>
                </div>
                
                <div id="register-step-1">
                    <input type="text" id="full_name" placeholder="Ad Soyad" class="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:outline-none mb-3">
                    
                    <input type="email" id="email" placeholder="email@bsu.edu.az" class="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:outline-none mb-3">
                    
                    <div class="relative mb-3">
                        <span class="absolute left-4 top-3 text-gray-500">+994</span>
                        <input type="tel" id="phone" placeholder="XXXXXXXXX" maxlength="9" class="w-full px-16 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:outline-none">
                    </div>
                    
                    <input type="password" id="password" placeholder="Şifrə" class="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:outline-none mb-3">
                    
                    <select id="faculty" class="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:outline-none mb-3">
                        <option value="">Fakültə seçin</option>
                    </select>
                    
                    <select id="course" class="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:outline-none mb-4">
                        <option value="">Kurs seçin</option>
                        <option value="1">1-ci kurs</option>
                        <option value="2">2-ci kurs</option>
                        <option value="3">3-cü kurs</option>
                        <option value="4">4-cü kurs</option>
                    </select>
                    
                    <button onclick="proceedToVerification()" class="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition">
                        Davam et
                    </button>
                </div>
                
                <div id="register-step-2" style="display: none;">
                    <h3 class="text-lg font-semibold mb-4 text-center">Yoxlama sualları</h3>
                    <p class="text-sm text-gray-600 mb-4 text-center">3 sualdan minimum 2-ni doğru cavablandırmalısınız</p>
                    <div id="verification-questions"></div>
                    <button onclick="submitRegistration()" class="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition mt-4">
                        Qeydiyyatı tamamla
                    </button>
                </div>
                
                <p class="text-center text-gray-600 mt-4">
                    Hesabınız var? <a href="#" onclick="showLogin()" class="text-blue-600 font-semibold">Daxil ol</a>
                </p>
            </div>
        </div>
    `;
    
    // Load faculties
    const facultiesData = await apiCall('/api/faculties');
    const facultySelect = document.getElementById('faculty');
    facultiesData.faculties.forEach(f => {
        const option = document.createElement('option');
        option.value = f.name;
        option.textContent = f.name;
        facultySelect.appendChild(option);
    });
}

async function proceedToVerification() {
    const full_name = document.getElementById('full_name').value;
    const email = document.getElementById('email').value;
    const phone = '+994' + document.getElementById('phone').value;
    const password = document.getElementById('password').value;
    const faculty = document.getElementById('faculty').value;
    const course = document.getElementById('course').value;
    
    if (!full_name || !email || !phone || !password || !faculty || !course) {
        alert('Bütün xanaları doldurun!');
        return;
    }
    
    if (!email.endsWith('@bsu.edu.az')) {
        alert('Email @bsu.edu.az ilə bitməlidir!');
        return;
    }
    
    if (phone.length !== 13) {
        alert('Telefon nömrəsi 9 rəqəm olmalıdır!');
        return;
    }
    
    // Store registration data temporarily
    window.registrationData = { email, phone, password, full_name, faculty, course: parseInt(course) };
    
    // Get verification questions
    const questionsData = await apiCall('/api/auth/verification-questions');
    window.verificationQuestions = questionsData.questions;
    
    const questionsHTML = questionsData.questions.map((q, idx) => `
        <div class="mb-4">
            <p class="font-medium mb-2">${idx + 1}. ${q.question}</p>
            <div class="space-y-2">
                <label class="flex items-center">
                    <input type="radio" name="question_${q.id}" value="1" class="mr-2">
                    <span>1</span>
                </label>
                <label class="flex items-center">
                    <input type="radio" name="question_${q.id}" value="2" class="mr-2">
                    <span>2</span>
                </label>
                <label class="flex items-center">
                    <input type="radio" name="question_${q.id}" value="3" class="mr-2">
                    <span>3</span>
                </label>
                <label class="flex items-center">
                    <input type="radio" name="question_${q.id}" value="əsas" class="mr-2">
                    <span>Əsas korpus</span>
                </label>
            </div>
        </div>
    `).join('');
    
    document.getElementById('verification-questions').innerHTML = questionsHTML;
    document.getElementById('register-step-1').style.display = 'none';
    document.getElementById('register-step-2').style.display = 'block';
}

async function submitRegistration() {
    // Collect answers
    const answers = {};
    window.verificationQuestions.forEach(q => {
        const selected = document.querySelector(`input[name="question_${q.id}"]:checked`);
        if (selected) {
            answers[q.id] = selected.value;
        }
    });
    
    if (Object.keys(answers).length < 3) {
        alert('Bütün suallara cavab verin!');
        return;
    }
    
    // Verify answers
    const verifyResult = await apiCall('/api/auth/verify-answers', 'POST', { answers });
    
    if (!verifyResult.success) {
        alert(`Təəssüf ki, ${verifyResult.correctCount}/3 doğru cavab verdiniz. Minimum 2 doğru cavab tələb olunur.`);
        return;
    }
    
    // Register user
    const result = await apiCall('/api/auth/register', 'POST', window.registrationData);
    
    if (result.error) {
        alert(result.error);
        return;
    }
    
    alert('Qeydiyyat uğurla tamamlandı! İndi daxil ola bilərsiniz.');
    showLogin();
}

async function showLogin() {
    currentView = 'login';
    const app = document.getElementById('app');
    app.innerHTML = `
        <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600 p-4">
            <div class="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
                <div class="text-center mb-6">
                    <i class="fas fa-graduation-cap text-5xl text-blue-600 mb-3"></i>
                    <h1 class="text-3xl font-bold text-gray-800">BSU Chat</h1>
                    <p class="text-gray-600 mt-2">Daxil ol</p>
                </div>
                
                <input type="email" id="login_email" placeholder="email@bsu.edu.az" class="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:outline-none mb-3">
                
                <input type="password" id="login_password" placeholder="Şifrə" class="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:outline-none mb-4">
                
                <button onclick="login()" class="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition mb-3">
                    Daxil ol
                </button>
                
                <button onclick="showAdminLogin()" class="w-full bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-300 transition">
                    <i class="fas fa-shield-alt mr-2"></i>Admin girişi
                </button>
                
                <p class="text-center text-gray-600 mt-4">
                    Hesabınız yoxdur? <a href="#" onclick="showRegister()" class="text-blue-600 font-semibold">Qeydiyyatdan keç</a>
                </p>
            </div>
        </div>
    `;
}

async function login() {
    const email = document.getElementById('login_email').value;
    const password = document.getElementById('login_password').value;
    
    if (!email || !password) {
        alert('Email və şifrə daxil edin!');
        return;
    }
    
    const result = await apiCall('/api/auth/login', 'POST', { email, password });
    
    if (result.error) {
        alert(result.error);
        return;
    }
    
    currentUser = result.user;
    
    if (currentUser.is_admin) {
        showAdminPanel();
    } else {
        showFacultyList();
    }
}

async function showAdminLogin() {
    const app = document.getElementById('app');
    app.innerHTML = `
        <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-500 to-purple-600 p-4">
            <div class="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
                <div class="text-center mb-6">
                    <i class="fas fa-shield-alt text-5xl text-red-600 mb-3"></i>
                    <h1 class="text-3xl font-bold text-gray-800">Admin Paneli</h1>
                </div>
                
                <input type="text" id="admin_username" placeholder="İstifadəçi adı" class="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-red-500 focus:outline-none mb-3">
                
                <input type="password" id="admin_password" placeholder="Şifrə" class="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-red-500 focus:outline-none mb-4">
                
                <button onclick="adminLogin()" class="w-full bg-red-600 text-white py-3 rounded-lg font-semibold hover:bg-red-700 transition mb-3">
                    Daxil ol
                </button>
                
                <button onclick="showLogin()" class="w-full bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-300 transition">
                    Geri
                </button>
            </div>
        </div>
    `;
}

async function adminLogin() {
    const username = document.getElementById('admin_username').value;
    const password = document.getElementById('admin_password').value;
    
    const result = await apiCall('/api/auth/admin-login', 'POST', { username, password });
    
    if (result.error) {
        alert('Yanlış məlumatlar!');
        return;
    }
    
    currentUser = result.admin;
    showAdminPanel();
}

// ==================== FACULTY LIST ====================

async function showFacultyList() {
    clearInterval(messagePolling);
    
    const facultiesData = await apiCall('/api/faculties');
    const topicData = await apiCall('/api/daily-topic');
    
    const app = document.getElementById('app');
    app.innerHTML = `
        <div class="min-h-screen bg-gray-50">
            <div class="bg-blue-600 text-white p-4 shadow-lg">
                <div class="max-w-4xl mx-auto flex justify-between items-center">
                    <div>
                        <h1 class="text-2xl font-bold">BSU Chat</h1>
                        <p class="text-sm text-blue-100">${currentUser.full_name} - ${currentUser.faculty}</p>
                    </div>
                    <div class="flex items-center space-x-4">
                        <button onclick="showProfile()" class="hover:bg-blue-700 px-4 py-2 rounded-lg transition">
                            <i class="fas fa-user-circle text-2xl"></i>
                        </button>
                        <button onclick="showPrivateChats()" class="hover:bg-blue-700 px-4 py-2 rounded-lg transition">
                            <i class="fas fa-envelope text-xl"></i>
                        </button>
                        <button onclick="showRules()" class="hover:bg-blue-700 px-4 py-2 rounded-lg transition">
                            <i class="fas fa-book text-xl"></i>
                        </button>
                        <button onclick="logout()" class="hover:bg-blue-700 px-4 py-2 rounded-lg transition">
                            <i class="fas fa-sign-out-alt text-xl"></i>
                        </button>
                    </div>
                </div>
            </div>
            
            <div class="max-w-4xl mx-auto p-4">
                ${topicData.topic ? `
                    <div class="bg-yellow-100 border-l-4 border-yellow-500 p-4 mb-4 rounded">
                        <p class="font-semibold text-yellow-800"><i class="fas fa-star mr-2"></i>Günün mövzusu:</p>
                        <p class="text-yellow-900">${topicData.topic}</p>
                    </div>
                ` : ''}
                
                <h2 class="text-2xl font-bold text-gray-800 mb-4">Fakültə otaqları</h2>
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    ${facultiesData.faculties.map(f => `
                        <div onclick="openFacultyChat(${f.id}, '${f.name}')" 
                             class="bg-white p-6 rounded-lg shadow hover:shadow-lg transition cursor-pointer border-l-4 border-blue-500">
                            <h3 class="font-bold text-lg text-gray-800">${f.name}</h3>
                            <p class="text-gray-600 text-sm mt-1"><i class="fas fa-users mr-2"></i>Chat otağı</p>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
    `;
}

// ==================== FACULTY CHAT ====================

async function openFacultyChat(facultyId, facultyName) {
    selectedFaculty = { id: facultyId, name: facultyName };
    await renderFacultyChat();
    startMessagePolling();
}

async function renderFacultyChat() {
    const messagesData = await apiCall(`/api/faculties/${selectedFaculty.id}/messages?userId=${currentUser.id}`);
    const topicData = await apiCall('/api/daily-topic');
    
    const app = document.getElementById('app');
    app.innerHTML = `
        <div class="flex flex-col h-screen bg-gray-50">
            <div class="bg-blue-600 text-white p-4 shadow-lg">
                <div class="flex items-center justify-between">
                    <div class="flex items-center">
                        <button onclick="showFacultyList()" class="mr-4 hover:bg-blue-700 p-2 rounded">
                            <i class="fas fa-arrow-left"></i>
                        </button>
                        <div>
                            <h2 class="font-bold text-lg">${selectedFaculty.name}</h2>
                            <p class="text-xs text-blue-100">Fakültə chat otağı</p>
                        </div>
                    </div>
                </div>
            </div>
            
            ${topicData.topic ? `
                <div class="bg-yellow-100 border-b-2 border-yellow-500 p-3 text-center">
                    <p class="font-semibold text-yellow-800 text-sm"><i class="fas fa-star mr-2"></i>${topicData.topic}</p>
                </div>
            ` : ''}
            
            <div id="chat-messages" class="flex-1 overflow-y-auto p-4 space-y-3 chat-container">
                ${messagesData.messages.map(m => renderMessage(m)).join('')}
            </div>
            
            <div class="bg-white border-t p-4">
                <div class="flex space-x-2">
                    <input type="text" id="message-input" placeholder="Mesaj yazın..." 
                           class="flex-1 px-4 py-3 rounded-full border border-gray-300 focus:border-blue-500 focus:outline-none"
                           onkeypress="if(event.key === 'Enter') sendFacultyMessage()">
                    <button onclick="sendFacultyMessage()" 
                            class="bg-blue-600 text-white px-6 py-3 rounded-full hover:bg-blue-700 transition">
                        <i class="fas fa-paper-plane"></i>
                    </button>
                </div>
            </div>
        </div>
    `;
    
    scrollToBottom();
}

function renderMessage(message) {
    const isMine = message.sender_id === currentUser.id;
    const time = new Date(message.created_at).toLocaleTimeString('az-AZ', { hour: '2-digit', minute: '2-digit' });
    
    if (isMine) {
        return `
            <div class="flex justify-end">
                <div class="message-bubble message-sent px-4 py-2">
                    <p class="text-sm">${message.message}</p>
                    <p class="text-xs opacity-75 mt-1">${time}</p>
                </div>
            </div>
        `;
    } else {
        return `
            <div class="flex items-start space-x-2">
                ${message.profile_image ? 
                    `<img src="${message.profile_image}" class="w-8 h-8 rounded-full">` :
                    `<div class="w-8 h-8 rounded-full bg-gray-400 flex items-center justify-center text-white text-xs">
                        ${message.full_name.charAt(0)}
                    </div>`
                }
                <div>
                    <div class="flex items-center space-x-2 mb-1">
                        <p class="text-xs font-semibold text-gray-700">${message.full_name}</p>
                        <button onclick="openUserActions(${message.sender_id}, '${message.full_name}')" 
                                class="text-gray-500 hover:text-blue-600">
                            <i class="fas fa-ellipsis-v text-xs"></i>
                        </button>
                    </div>
                    <div class="message-bubble message-received px-4 py-2">
                        <p class="text-sm text-gray-800">${message.message}</p>
                        <p class="text-xs text-gray-500 mt-1">${time}</p>
                    </div>
                </div>
            </div>
        `;
    }
}

async function sendFacultyMessage() {
    const input = document.getElementById('message-input');
    const message = input.value.trim();
    
    if (!message) return;
    
    await apiCall(`/api/faculties/${selectedFaculty.id}/messages`, 'POST', {
        sender_id: currentUser.id,
        message
    });
    
    input.value = '';
    await renderFacultyChat();
}

function scrollToBottom() {
    const chatContainer = document.getElementById('chat-messages');
    if (chatContainer) {
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }
}

function startMessagePolling() {
    clearInterval(messagePolling);
    messagePolling = setInterval(async () => {
        if (selectedFaculty) {
            const chatContainer = document.getElementById('chat-messages');
            const wasAtBottom = chatContainer && (chatContainer.scrollHeight - chatContainer.scrollTop - chatContainer.clientHeight < 50);
            
            await renderFacultyChat();
            
            if (wasAtBottom) {
                scrollToBottom();
            }
        } else if (selectedPrivateChat) {
            await renderPrivateChat();
        }
    }, 2000);
}

// ==================== USER ACTIONS ====================

function openUserActions(userId, userName) {
    const modal = document.createElement('div');
    modal.id = 'user-actions-modal';
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    modal.innerHTML = `
        <div class="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
            <h3 class="text-lg font-bold mb-4">${userName}</h3>
            <div class="space-y-2">
                <button onclick="openPrivateChat(${userId}, '${userName}')" 
                        class="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition">
                    <i class="fas fa-comment mr-2"></i>Şəxsi mesaj
                </button>
                <button onclick="blockUser(${userId})" 
                        class="w-full bg-orange-600 text-white py-2 rounded hover:bg-orange-700 transition">
                    <i class="fas fa-ban mr-2"></i>Bloklə
                </button>
                <button onclick="reportUser(${userId})" 
                        class="w-full bg-red-600 text-white py-2 rounded hover:bg-red-700 transition">
                    <i class="fas fa-flag mr-2"></i>Şikayət et
                </button>
                <button onclick="closeModal()" 
                        class="w-full bg-gray-300 text-gray-700 py-2 rounded hover:bg-gray-400 transition">
                    Ləğv et
                </button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

function closeModal() {
    const modal = document.getElementById('user-actions-modal');
    if (modal) modal.remove();
}

async function blockUser(userId) {
    await apiCall('/api/blocks', 'POST', {
        blocker_id: currentUser.id,
        blocked_id: userId
    });
    alert('İstifadəçi bloklandı!');
    closeModal();
}

async function reportUser(userId) {
    const reason = prompt('Şikayət səbəbinizi yazın:');
    if (!reason) return;
    
    const result = await apiCall('/api/reports', 'POST', {
        reporter_id: currentUser.id,
        reported_id: userId,
        reason
    });
    
    if (result.flagged) {
        alert('Şikayətiniz qeydə alındı. Bu istifadəçi 16+ şikayət topladı və təhlükəli hesablar siyahısına əlavə edildi.');
    } else {
        alert('Şikayətiniz qeydə alındı.');
    }
    closeModal();
}

// ==================== PRIVATE CHAT ====================

async function showPrivateChats() {
    clearInterval(messagePolling);
    
    const chatsData = await apiCall(`/api/users/${currentUser.id}/chats`);
    
    const app = document.getElementById('app');
    app.innerHTML = `
        <div class="min-h-screen bg-gray-50">
            <div class="bg-blue-600 text-white p-4 shadow-lg">
                <div class="flex items-center">
                    <button onclick="showFacultyList()" class="mr-4 hover:bg-blue-700 p-2 rounded">
                        <i class="fas fa-arrow-left"></i>
                    </button>
                    <h2 class="font-bold text-lg">Şəxsi söhbətlər</h2>
                </div>
            </div>
            
            <div class="max-w-4xl mx-auto p-4">
                ${chatsData.chats.length === 0 ? `
                    <div class="text-center py-12">
                        <i class="fas fa-comments text-6xl text-gray-300 mb-4"></i>
                        <p class="text-gray-500">Hələ heç bir şəxsi söhbətiniz yoxdur</p>
                    </div>
                ` : `
                    <div class="space-y-2">
                        ${chatsData.chats.map(chat => `
                            <div onclick="openPrivateChat(${chat.other_user_id}, '${chat.full_name}')" 
                                 class="bg-white p-4 rounded-lg shadow hover:shadow-lg transition cursor-pointer flex items-center space-x-3">
                                ${chat.profile_image ? 
                                    `<img src="${chat.profile_image}" class="w-12 h-12 rounded-full">` :
                                    `<div class="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">
                                        ${chat.full_name.charAt(0)}
                                    </div>`
                                }
                                <div>
                                    <h3 class="font-bold">${chat.full_name}</h3>
                                    <p class="text-xs text-gray-500">${new Date(chat.last_message_time).toLocaleString('az-AZ')}</p>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                `}
            </div>
        </div>
    `;
}

async function openPrivateChat(userId, userName) {
    selectedPrivateChat = { id: userId, name: userName };
    selectedFaculty = null;
    await renderPrivateChat();
    startMessagePolling();
}

async function renderPrivateChat() {
    const messagesData = await apiCall(`/api/private-chats?user1=${currentUser.id}&user2=${selectedPrivateChat.id}`);
    
    const app = document.getElementById('app');
    app.innerHTML = `
        <div class="flex flex-col h-screen bg-gray-50">
            <div class="bg-blue-600 text-white p-4 shadow-lg">
                <div class="flex items-center">
                    <button onclick="showPrivateChats()" class="mr-4 hover:bg-blue-700 p-2 rounded">
                        <i class="fas fa-arrow-left"></i>
                    </button>
                    <h2 class="font-bold text-lg">${selectedPrivateChat.name}</h2>
                </div>
            </div>
            
            <div id="chat-messages" class="flex-1 overflow-y-auto p-4 space-y-3 chat-container">
                ${messagesData.messages.map(m => renderMessage(m)).join('')}
            </div>
            
            <div class="bg-white border-t p-4">
                <div class="flex space-x-2">
                    <input type="text" id="message-input" placeholder="Mesaj yazın..." 
                           class="flex-1 px-4 py-3 rounded-full border border-gray-300 focus:border-blue-500 focus:outline-none"
                           onkeypress="if(event.key === 'Enter') sendPrivateMessage()">
                    <button onclick="sendPrivateMessage()" 
                            class="bg-blue-600 text-white px-6 py-3 rounded-full hover:bg-blue-700 transition">
                        <i class="fas fa-paper-plane"></i>
                    </button>
                </div>
            </div>
        </div>
    `;
    
    scrollToBottom();
}

async function sendPrivateMessage() {
    const input = document.getElementById('message-input');
    const message = input.value.trim();
    
    if (!message) return;
    
    await apiCall('/api/private-chats', 'POST', {
        sender_id: currentUser.id,
        receiver_id: selectedPrivateChat.id,
        message
    });
    
    input.value = '';
    await renderPrivateChat();
}

// ==================== PROFILE ====================

async function showProfile() {
    const app = document.getElementById('app');
    app.innerHTML = `
        <div class="min-h-screen bg-gray-50">
            <div class="bg-blue-600 text-white p-4 shadow-lg">
                <div class="flex items-center">
                    <button onclick="showFacultyList()" class="mr-4 hover:bg-blue-700 p-2 rounded">
                        <i class="fas fa-arrow-left"></i>
                    </button>
                    <h2 class="font-bold text-lg">Profil</h2>
                </div>
            </div>
            
            <div class="max-w-md mx-auto p-6">
                <div class="bg-white rounded-lg shadow-lg p-6 text-center">
                    ${currentUser.profile_image ? 
                        `<img src="${currentUser.profile_image}" class="w-32 h-32 rounded-full mx-auto mb-4">` :
                        `<div class="w-32 h-32 rounded-full bg-blue-500 flex items-center justify-center text-white text-4xl font-bold mx-auto mb-4">
                            ${currentUser.full_name.charAt(0)}
                        </div>`
                    }
                    
                    <h2 class="text-2xl font-bold text-gray-800">${currentUser.full_name}</h2>
                    <p class="text-gray-600 mt-1">${currentUser.email}</p>
                    <p class="text-gray-600">${currentUser.faculty}</p>
                    <p class="text-gray-600">${currentUser.course}-ci kurs</p>
                    
                    <div class="mt-6">
                        <label class="block text-sm font-semibold text-gray-700 mb-2">Profil şəkli URL</label>
                        <input type="text" id="profile_image_url" placeholder="https://example.com/image.jpg" 
                               class="w-full px-4 py-2 rounded-lg border border-gray-300 focus:border-blue-500 focus:outline-none mb-3">
                        <button onclick="updateProfileImage()" 
                                class="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition">
                            Şəkli yenilə
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

async function updateProfileImage() {
    const imageUrl = document.getElementById('profile_image_url').value;
    
    if (!imageUrl) {
        alert('URL daxil edin!');
        return;
    }
    
    await apiCall(`/api/users/${currentUser.id}/profile-image`, 'POST', {
        image_url: imageUrl
    });
    
    currentUser.profile_image = imageUrl;
    alert('Profil şəkli yeniləndi!');
    showProfile();
}

// ==================== RULES ====================

async function showRules() {
    const rulesData = await apiCall('/api/rules');
    
    const app = document.getElementById('app');
    app.innerHTML = `
        <div class="min-h-screen bg-gray-50">
            <div class="bg-blue-600 text-white p-4 shadow-lg">
                <div class="flex items-center">
                    <button onclick="showFacultyList()" class="mr-4 hover:bg-blue-700 p-2 rounded">
                        <i class="fas fa-arrow-left"></i>
                    </button>
                    <h2 class="font-bold text-lg">Sayt Qaydaları</h2>
                </div>
            </div>
            
            <div class="max-w-4xl mx-auto p-6">
                <div class="bg-white rounded-lg shadow-lg p-6">
                    <div class="prose max-w-none">
                        ${rulesData.rules || 'Qaydalar hələ əlavə edilməyib.'}
                    </div>
                </div>
            </div>
        </div>
    `;
}

// ==================== ADMIN PANEL ====================

async function showAdminPanel() {
    clearInterval(messagePolling);
    
    const app = document.getElementById('app');
    app.innerHTML = `
        <div class="min-h-screen bg-gray-50">
            <div class="bg-red-600 text-white p-4 shadow-lg">
                <div class="flex justify-between items-center">
                    <h1 class="text-2xl font-bold"><i class="fas fa-shield-alt mr-2"></i>Admin Paneli</h1>
                    <button onclick="logout()" class="hover:bg-red-700 px-4 py-2 rounded">
                        <i class="fas fa-sign-out-alt"></i> Çıxış
                    </button>
                </div>
            </div>
            
            <div class="max-w-6xl mx-auto p-6">
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <button onclick="showFlaggedUsers()" class="bg-white p-6 rounded-lg shadow hover:shadow-lg transition text-left">
                        <i class="fas fa-exclamation-triangle text-3xl text-red-600 mb-2"></i>
                        <h3 class="font-bold text-lg">Təhlükəli Hesablar</h3>
                        <p class="text-gray-600 text-sm">16+ şikayət alan istifadəçilər</p>
                    </button>
                    
                    <button onclick="showFilterWords()" class="bg-white p-6 rounded-lg shadow hover:shadow-lg transition text-left">
                        <i class="fas fa-filter text-3xl text-blue-600 mb-2"></i>
                        <h3 class="font-bold text-lg">Filtr Sözləri</h3>
                        <p class="text-gray-600 text-sm">Qadağan edilmiş sözlər</p>
                    </button>
                    
                    <button onclick="showAdminRules()" class="bg-white p-6 rounded-lg shadow hover:shadow-lg transition text-left">
                        <i class="fas fa-book text-3xl text-green-600 mb-2"></i>
                        <h3 class="font-bold text-lg">Qaydalar</h3>
                        <p class="text-gray-600 text-sm">Sayt qaydalarını redaktə et</p>
                    </button>
                </div>
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button onclick="showAdminDailyTopic()" class="bg-white p-6 rounded-lg shadow hover:shadow-lg transition text-left">
                        <i class="fas fa-star text-3xl text-yellow-600 mb-2"></i>
                        <h3 class="font-bold text-lg">Günün Mövzusu</h3>
                        <p class="text-gray-600 text-sm">Günün mövzusunu təyin et</p>
                    </button>
                    
                    <button onclick="showAllUsers()" class="bg-white p-6 rounded-lg shadow hover:shadow-lg transition text-left">
                        <i class="fas fa-users text-3xl text-purple-600 mb-2"></i>
                        <h3 class="font-bold text-lg">Bütün İstifadəçilər</h3>
                        <p class="text-gray-600 text-sm">İstifadəçi siyahısı</p>
                    </button>
                </div>
            </div>
        </div>
    `;
}

async function showFlaggedUsers() {
    const flaggedData = await apiCall('/api/admin/flagged-users');
    
    const app = document.getElementById('app');
    app.innerHTML = `
        <div class="min-h-screen bg-gray-50">
            <div class="bg-red-600 text-white p-4 shadow-lg">
                <div class="flex items-center">
                    <button onclick="showAdminPanel()" class="mr-4 hover:bg-red-700 p-2 rounded">
                        <i class="fas fa-arrow-left"></i>
                    </button>
                    <h2 class="font-bold text-lg">Təhlükəli Hesablar</h2>
                </div>
            </div>
            
            <div class="max-w-6xl mx-auto p-6">
                ${flaggedData.users.length === 0 ? `
                    <div class="text-center py-12">
                        <i class="fas fa-check-circle text-6xl text-green-400 mb-4"></i>
                        <p class="text-gray-500">Təhlükəli hesab yoxdur</p>
                    </div>
                ` : `
                    <div class="space-y-4">
                        ${flaggedData.users.map(user => `
                            <div class="bg-white p-4 rounded-lg shadow">
                                <div class="flex justify-between items-start">
                                    <div>
                                        <h3 class="font-bold text-lg">${user.full_name}</h3>
                                        <p class="text-gray-600">${user.email}</p>
                                        <p class="text-gray-600">${user.faculty} - ${user.course}-ci kurs</p>
                                        <p class="text-red-600 font-semibold mt-2">
                                            <i class="fas fa-flag mr-2"></i>${user.report_count} şikayət
                                        </p>
                                    </div>
                                    <div class="space-x-2">
                                        <button onclick="viewUserReports(${user.id})" 
                                                class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                                            Şikayətlərə bax
                                        </button>
                                        ${user.is_banned ? `
                                            <button onclick="unbanUser(${user.id})" 
                                                    class="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
                                                Ban-ı götür
                                            </button>
                                        ` : `
                                            <button onclick="banUser(${user.id})" 
                                                    class="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700">
                                                Ban et
                                            </button>
                                        `}
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                `}
            </div>
        </div>
    `;
}

async function viewUserReports(userId) {
    const reportsData = await apiCall(`/api/admin/users/${userId}/reports`);
    
    const modal = document.createElement('div');
    modal.id = 'reports-modal';
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4';
    modal.innerHTML = `
        <div class="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <h3 class="text-lg font-bold mb-4">Şikayətlər</h3>
            <div class="space-y-3">
                ${reportsData.reports.map(report => `
                    <div class="border-l-4 border-red-500 pl-4 py-2">
                        <p class="font-semibold">${report.reporter_name}</p>
                        <p class="text-gray-600 text-sm">${report.reason}</p>
                        <p class="text-xs text-gray-500 mt-1">${new Date(report.created_at).toLocaleString('az-AZ')}</p>
                    </div>
                `).join('')}
            </div>
            <button onclick="closeReportsModal()" 
                    class="w-full bg-gray-300 text-gray-700 py-2 rounded hover:bg-gray-400 transition mt-4">
                Bağla
            </button>
        </div>
    `;
    document.body.appendChild(modal);
}

function closeReportsModal() {
    const modal = document.getElementById('reports-modal');
    if (modal) modal.remove();
}

async function banUser(userId) {
    if (!confirm('Bu istifadəçini ban etmək istədiyinizdən əminsiniz?')) return;
    
    await apiCall(`/api/admin/users/${userId}/ban`, 'POST');
    alert('İstifadəçi ban edildi!');
    showFlaggedUsers();
}

async function unbanUser(userId) {
    await apiCall(`/api/admin/users/${userId}/unban`, 'POST');
    alert('Ban götürüldü!');
    showFlaggedUsers();
}

async function showFilterWords() {
    const wordsData = await apiCall('/api/admin/filter-words');
    
    const app = document.getElementById('app');
    app.innerHTML = `
        <div class="min-h-screen bg-gray-50">
            <div class="bg-blue-600 text-white p-4 shadow-lg">
                <div class="flex items-center">
                    <button onclick="showAdminPanel()" class="mr-4 hover:bg-blue-700 p-2 rounded">
                        <i class="fas fa-arrow-left"></i>
                    </button>
                    <h2 class="font-bold text-lg">Filtr Sözləri</h2>
                </div>
            </div>
            
            <div class="max-w-4xl mx-auto p-6">
                <div class="bg-white rounded-lg shadow-lg p-6 mb-6">
                    <h3 class="font-bold mb-4">Yeni söz əlavə et</h3>
                    <div class="flex space-x-2">
                        <input type="text" id="new-filter-word" placeholder="Qadağan ediləcək söz" 
                               class="flex-1 px-4 py-2 rounded border border-gray-300 focus:border-blue-500 focus:outline-none">
                        <button onclick="addFilterWord()" 
                                class="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700">
                            Əlavə et
                        </button>
                    </div>
                </div>
                
                <div class="bg-white rounded-lg shadow-lg p-6">
                    <h3 class="font-bold mb-4">Filtr edilən sözlər</h3>
                    ${wordsData.words.length === 0 ? `
                        <p class="text-gray-500 text-center py-6">Heç bir söz əlavə edilməyib</p>
                    ` : `
                        <div class="space-y-2">
                            ${wordsData.words.map(word => `
                                <div class="flex justify-between items-center p-3 bg-gray-50 rounded">
                                    <span class="font-mono">${word.word}</span>
                                    <button onclick="deleteFilterWord(${word.id})" 
                                            class="text-red-600 hover:text-red-800">
                                        <i class="fas fa-trash"></i>
                                    </button>
                                </div>
                            `).join('')}
                        </div>
                    `}
                </div>
            </div>
        </div>
    `;
}

async function addFilterWord() {
    const word = document.getElementById('new-filter-word').value.trim();
    if (!word) return;
    
    await apiCall('/api/admin/filter-words', 'POST', { word });
    showFilterWords();
}

async function deleteFilterWord(wordId) {
    await apiCall(`/api/admin/filter-words/${wordId}`, 'DELETE');
    showFilterWords();
}

async function showAdminRules() {
    const rulesData = await apiCall('/api/rules');
    
    const app = document.getElementById('app');
    app.innerHTML = `
        <div class="min-h-screen bg-gray-50">
            <div class="bg-green-600 text-white p-4 shadow-lg">
                <div class="flex items-center">
                    <button onclick="showAdminPanel()" class="mr-4 hover:bg-green-700 p-2 rounded">
                        <i class="fas fa-arrow-left"></i>
                    </button>
                    <h2 class="font-bold text-lg">Qaydaları Redaktə Et</h2>
                </div>
            </div>
            
            <div class="max-w-4xl mx-auto p-6">
                <div class="bg-white rounded-lg shadow-lg p-6">
                    <textarea id="rules-content" rows="15" 
                              class="w-full px-4 py-3 rounded border border-gray-300 focus:border-green-500 focus:outline-none"
                              placeholder="Sayt qaydalarını buraya yazın...">${rulesData.rules}</textarea>
                    <button onclick="updateRules()" 
                            class="w-full bg-green-600 text-white py-3 rounded hover:bg-green-700 mt-4">
                        Yadda saxla
                    </button>
                </div>
            </div>
        </div>
    `;
}

async function updateRules() {
    const content = document.getElementById('rules-content').value;
    await apiCall('/api/admin/rules', 'POST', { content });
    alert('Qaydalar yeniləndi!');
}

async function showAdminDailyTopic() {
    const topicData = await apiCall('/api/daily-topic');
    
    const app = document.getElementById('app');
    app.innerHTML = `
        <div class="min-h-screen bg-gray-50">
            <div class="bg-yellow-600 text-white p-4 shadow-lg">
                <div class="flex items-center">
                    <button onclick="showAdminPanel()" class="mr-4 hover:bg-yellow-700 p-2 rounded">
                        <i class="fas fa-arrow-left"></i>
                    </button>
                    <h2 class="font-bold text-lg">Günün Mövzusu</h2>
                </div>
            </div>
            
            <div class="max-w-4xl mx-auto p-6">
                <div class="bg-white rounded-lg shadow-lg p-6">
                    <h3 class="font-bold mb-4">Cari mövzu:</h3>
                    <p class="text-gray-700 mb-6 p-4 bg-yellow-50 rounded">${topicData.topic}</p>
                    
                    <h3 class="font-bold mb-4">Yeni mövzu əlavə et:</h3>
                    <textarea id="daily-topic-content" rows="4" 
                              class="w-full px-4 py-3 rounded border border-gray-300 focus:border-yellow-500 focus:outline-none mb-4"
                              placeholder="Günün mövzusunu buraya yazın..."></textarea>
                    <button onclick="updateDailyTopic()" 
                            class="w-full bg-yellow-600 text-white py-3 rounded hover:bg-yellow-700">
                        Yenilə
                    </button>
                </div>
            </div>
        </div>
    `;
}

async function updateDailyTopic() {
    const content = document.getElementById('daily-topic-content').value.trim();
    if (!content) return;
    
    await apiCall('/api/admin/daily-topic', 'POST', { content });
    alert('Günün mövzusu yeniləndi!');
    showAdminDailyTopic();
}

async function showAllUsers() {
    const usersData = await apiCall('/api/admin/users');
    
    const app = document.getElementById('app');
    app.innerHTML = `
        <div class="min-h-screen bg-gray-50">
            <div class="bg-purple-600 text-white p-4 shadow-lg">
                <div class="flex items-center">
                    <button onclick="showAdminPanel()" class="mr-4 hover:bg-purple-700 p-2 rounded">
                        <i class="fas fa-arrow-left"></i>
                    </button>
                    <h2 class="font-bold text-lg">Bütün İstifadəçilər</h2>
                </div>
            </div>
            
            <div class="max-w-6xl mx-auto p-6">
                <div class="bg-white rounded-lg shadow-lg overflow-hidden">
                    <table class="w-full">
                        <thead class="bg-gray-100">
                            <tr>
                                <th class="px-4 py-3 text-left">Ad Soyad</th>
                                <th class="px-4 py-3 text-left">Email</th>
                                <th class="px-4 py-3 text-left">Fakültə</th>
                                <th class="px-4 py-3 text-left">Kurs</th>
                                <th class="px-4 py-3 text-left">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${usersData.users.map(user => `
                                <tr class="border-t hover:bg-gray-50">
                                    <td class="px-4 py-3">${user.full_name}</td>
                                    <td class="px-4 py-3">${user.email}</td>
                                    <td class="px-4 py-3">${user.faculty}</td>
                                    <td class="px-4 py-3">${user.course}</td>
                                    <td class="px-4 py-3">
                                        ${user.is_banned ? 
                                            '<span class="text-red-600 font-semibold">Banlı</span>' : 
                                            '<span class="text-green-600 font-semibold">Aktiv</span>'
                                        }
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;
}

// ==================== LOGOUT ====================

function logout() {
    clearInterval(messagePolling);
    currentUser = null;
    currentView = 'login';
    selectedFaculty = null;
    selectedPrivateChat = null;
    showLogin();
}

// ==================== INITIALIZE ====================

showLogin();
