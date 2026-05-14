/* 
    Aromatica - Premium Restaurant Website
    Shared JavaScript
*/

// --- Global Auth Functions ---
function toggleAuthMode() {
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');
    const toggleBtn = document.getElementById('auth-toggle-btn');

    if (loginForm && signupForm) {
        if (loginForm.classList.contains('hidden')) {
            loginForm.classList.remove('hidden');
            signupForm.classList.add('hidden');
            if (toggleBtn) toggleBtn.textContent = 'Sign Up';
        } else {
            loginForm.classList.add('hidden');
            signupForm.classList.remove('hidden');
            if (toggleBtn) toggleBtn.textContent = 'Log In';
        }
    }
}

function updateAuthUI() {
    const currentUser = JSON.parse(localStorage.getItem('aromatica_current_user'));
    const authBtnContainers = document.querySelectorAll('.nav-btns');
    
    authBtnContainers.forEach(container => {
        const loginBtn = container.querySelector('a[href="login.html"]');
        if (currentUser && loginBtn) {
            const initial = currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'U';
            const firstName = currentUser.name ? currentUser.name.split(' ')[0] : 'User';
            loginBtn.outerHTML = `
                <div class="user-profile-container" style="position: relative; display: inline-block;">
                    <div class="user-profile" style="display: flex; align-items: center; gap: 0.8rem; cursor: pointer; padding: 0.3rem 0;">
                        <div class="user-avatar-btn" style="width: 40px; height: 40px; border-radius: 50%; background: var(--primary-color); color: var(--bg-dark); display: flex; align-items: center; justify-content: center; font-size: 1.1rem; font-weight: 800; border: 2px solid var(--text-light); box-shadow: 0 2px 10px rgba(0,0,0,0.5); transition: var(--transition);" title="View Profile">
                            ${initial}
                        </div>
                        <span style="font-weight: 600; color: var(--text-light); font-size: 0.95rem;">${firstName}</span>
                    </div>
                    <div class="glass user-dropdown" style="position: absolute; top: 100%; right: 0; width: 160px; padding: 0.5rem; border-radius: 12px; z-index: 1100; text-align: center; border: 1px solid var(--glass-border); opacity: 0; visibility: hidden; transform: translateY(10px); transition: all 0.3s ease; pointer-events: none;">
                        <div style="padding: 0.5rem; font-size: 0.8rem; color: var(--text-muted); border-bottom: 1px solid rgba(255,255,255,0.05); margin-bottom: 0.5rem; word-break: break-all;">${currentUser.email || ''}</div>
                        <button onclick="logout()" class="btn btn-primary" style="width: 100%; padding: 0.5rem; font-size: 0.85rem; pointer-events: auto;">Logout</button>
                    </div>
                </div>
            `;
        }
    });
}

window.toggleUserDropdown = () => {
    const dropdown = document.getElementById('user-dropdown');
    if (dropdown) dropdown.classList.toggle('hidden');
};

function logout() {
    localStorage.removeItem('aromatica_current_user');
    window.location.reload();
}

// --- Active Nav Link Highlighting ---
function setActiveNavLink() {
    // Get the current page filename (e.g. "reservation.html")
    const path = window.location.pathname;
    const currentPage = path.split('/').pop() || 'index.html'; // root '/' → index.html

    document.querySelectorAll('.nav-links a').forEach(link => {
        // Clear any hardcoded active class first
        link.classList.remove('active');

        const linkPage = link.getAttribute('href').split('/').pop().split('#')[0]; // strip anchors

        if (linkPage === currentPage) {
            link.classList.add('active');
        }
    });
}

// Run immediately — no need to wait for DOMContentLoaded since script is deferred to body end
setActiveNavLink();

window.initTableBooking = () => {
    // 1. URL parameter pre-filling for restaurant select
    const urlParams = new URLSearchParams(window.location.search);
    const requestedRes = urlParams.get('res');
    const resSelect = document.getElementById('reservation-restaurant-select');
    if (requestedRes && resSelect) {
        // Find option that matches
        for (let i = 0; i < resSelect.options.length; i++) {
            if (resSelect.options[i].value.toLowerCase() === requestedRes.toLowerCase()) {
                resSelect.selectedIndex = i;
                break;
            }
        }
    }

    // 2. Interactive table capacity tracking & click logic
    let selectedTable = null;
    const tableItems = document.querySelectorAll('.table-item');
    const tableInfo = document.getElementById('selected-table-info');
    const guestsSelect = document.getElementById('reservation-guests-select');

    const filterTablesByCapacity = () => {
        const requiredCapacity = guestsSelect ? parseInt(guestsSelect.value) || 0 : 0;
        tableItems.forEach(item => {
            if (item.classList.contains('reserved')) return; // Leave reserved intact
            
            const tableCapacity = parseInt(item.getAttribute('data-capacity')) || 0;
            if (tableCapacity < requiredCapacity) {
                item.classList.add('disabled-capacity');
                if (item.classList.contains('selected')) {
                    item.classList.remove('selected');
                    selectedTable = null;
                    if (tableInfo) tableInfo.textContent = 'Selected Table: None';
                }
            } else {
                item.classList.remove('disabled-capacity');
            }
        });
    };

    if (guestsSelect) {
        guestsSelect.addEventListener('change', filterTablesByCapacity);
    }

    tableItems.forEach(item => {
        item.addEventListener('click', () => {
            if (item.classList.contains('reserved')) {
                alert('This table is already reserved by another guest. Please choose an available table!');
                return;
            }
            if (item.classList.contains('disabled-capacity')) {
                alert("This table's seating capacity is smaller than your selected number of guests. Please choose a suitable, larger table!");
                return;
            }

            tableItems.forEach(t => t.classList.remove('selected'));
            item.classList.add('selected');
            selectedTable = item.getAttribute('data-table');
            
            let zone = 'Premium Dining Area';
            if (selectedTable.startsWith('T')) zone = 'Window Side';
            else if (selectedTable.startsWith('M')) zone = 'Main Dining Hall';
            else if (selectedTable.startsWith('V')) zone = 'VIP Lounge';

            if (tableInfo) {
                tableInfo.textContent = `Selected Table: ${zone} - Table ${selectedTable} (${item.getAttribute('data-capacity')}p)`;
            }
        });
    });

    // Initial filter pass
    filterTablesByCapacity();

    // 3. Form submission hook
    const form = document.getElementById('reservation-form');
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            if (!selectedTable) {
                alert('Please select a suitable available table from the floor plan first!');
                return;
            }

            const name = form.querySelector('input[type="text"]').value;
            const resOutlet = resSelect ? resSelect.value : 'Aromatica Premium Outlet';
            const dateVal = form.querySelector('input[type="date"]').value;
            const timeSelects = form.querySelectorAll('select');
            let timeVal = '20:00';
            for (const sel of timeSelects) {
                if (sel.options[0].text.includes('Time')) {
                    timeVal = sel.value;
                    break;
                }
            }
            const guestsVal = guestsSelect ? guestsSelect.options[guestsSelect.selectedIndex].text : '2 Guests';

            // Generate booking reference
            const orderId = 'RES-' + Math.floor(Math.random() * 900000 + 100000);
            const timestamp = new Date().toLocaleString();

            // --- Save to aromatica_reservations (structured, dedicated store) ---
            const reservations = JSON.parse(localStorage.getItem('aromatica_reservations') || '[]');
            const newReservation = {
                ref: orderId,
                outlet: resOutlet,
                table: selectedTable,
                date: dateVal,
                time: timeVal,
                guests: guestsVal,
                bookedAt: timestamp,
                status: 'Confirmed'
            };
            reservations.unshift(newReservation);
            localStorage.setItem('aromatica_reservations', JSON.stringify(reservations));

            // --- Also keep a mirror entry in aromatica_orders for backward-compat ---
            const orders = JSON.parse(localStorage.getItem('aromatica_orders') || '[]');
            orders.unshift({
                id: orderId,
                date: timestamp,
                items: [{ name: `Table ${selectedTable} — ${resOutlet}`, price: 0, quantity: 1, details: `Reserved for ${name} on ${dateVal} at ${timeVal} (${guestsVal})` }],
                total: 0,
                status: 'Reserved Table'
            });
            localStorage.setItem('aromatica_orders', JSON.stringify(orders));

            // --- Populate & show Success Modal ---
            const modal = document.getElementById('reservation-success-modal');
            if (modal) {
                document.getElementById('popup-res-id').textContent = orderId;
                document.getElementById('popup-res-outlet').textContent = resOutlet;
                document.getElementById('popup-res-table').textContent = selectedTable;
                document.getElementById('popup-res-timing').textContent = `${dateVal} at ${timeVal}`;
                const guestsEl = document.getElementById('popup-res-guests');
                if (guestsEl) guestsEl.textContent = guestsVal;
                modal.classList.remove('hidden');
            } else {
                alert(`Reservation Confirmed!\nRef: ${orderId}\nOutlet: ${resOutlet}\nTable: ${selectedTable}\nTiming: ${dateVal} at ${timeVal}`);
                window.location.href = 'orders.html';
            }
        });
    }
};

// --- Tricity Restaurant Data ---
    const tricityRestaurants = [
        {
            name: "Dum Noorani",
            address: "SCO 188, Sector 7-C, Sector 7, Chandigarh, 160019, India",
            mobile: "+91 1724802008",
            directions: "https://www.google.com/maps/place/Dum+Noorani/",
            cuisine: "North Indian, Awadhi",
            rating: 4.8,
            hours: "11:00 - 23:00",
            image: "./images/restaurants/dum-noorani.png"
        },
        {
            name: "The Great Bear",
            address: "SCO 32, Sector 26, Chandigarh, 160019, India",
            mobile: "+91 1724026566",
            directions: "https://www.google.com/maps/search/The+Great+Bear+Chandigarh/",
            cuisine: "Brewery, Continental",
            rating: 4.7,
            hours: "12:00 - 00:00",
            image: "./images/restaurants/great-bear.png"
        },
        {
            name: "Virgin Courtyard",
            address: "SCO 1A, Sector 7-C, Chandigarh, 160007, India",
            mobile: "+91 8699457888",
            directions: "https://www.google.com/maps/search/Virgin+Courtyard+Chandigarh/",
            cuisine: "Italian, Mediterranean",
            rating: 4.9,
            hours: "11:30 - 23:30",
            image: "./images/restaurants/virgin-courtyard.png"
        },
        {
            name: "Swagath",
            address: "SCO 7, Sector 26, Chandigarh, 160019, India",
            mobile: "+91 1722700544",
            directions: "https://www.google.com/maps/search/Swagath+Chandigarh+Sector+26/",
            cuisine: "South Indian, Coastal",
            rating: 4.6,
            hours: "11:00 - 23:30",
            image: "./images/restaurants/swagath.png"
        },
        {
            name: "The Willow Cafe",
            address: "SCO 1, Sector 10, Chandigarh, 160010, India",
            mobile: "+91 1724011888",
            directions: "https://www.google.com/maps/search/The+Willow+Cafe+Chandigarh/",
            cuisine: "Continental, Cafe",
            rating: 4.5,
            hours: "09:00 - 23:00",
            image: "./images/restaurants/willow-cafe.png"
        },
        {
            name: "Hops n Grains",
            address: "SCO 357, Sector 9, Panchkula, 134109, India",
            mobile: "+91 8054923357",
            directions: "https://www.google.com/maps/search/Hops+n+Grains+Panchkula/",
            cuisine: "Brewery, Finger Food",
            rating: 4.6,
            hours: "12:00 - 00:00",
            image: "./images/restaurants/hops-grains.png"
        },
        {
            name: "Barbeque Nation",
            address: "SCO 39, Sector 26, Chandigarh, 160019, India",
            mobile: "+91 1726451515",
            directions: "https://www.google.com/maps/search/Barbeque+Nation+Chandigarh/",
            cuisine: "Buffet, North Indian",
            rating: 4.4,
            hours: "12:00 - 23:00",
            image: "./images/restaurants/bbq-nation.png"
        },
        {
            name: "Nik Baker's",
            address: "SCO 441, Sector 35-C, Chandigarh, 160035, India",
            mobile: "+91 1722604924",
            directions: "https://www.google.com/maps/search/Nik+Bakers+Chandigarh/",
            cuisine: "Bakery, Desserts",
            rating: 4.7,
            hours: "08:00 - 00:00",
            image: "./images/restaurants/nik-bakers.png"
        }
    ];

    window.renderTricityRestaurants = (filter = '', search = '') => {
        const grid = document.getElementById('restaurant-grid');
        if (!grid) return;

        let filtered = tricityRestaurants.filter(r => {
            const matchesSearch = r.name.toLowerCase().includes(search.toLowerCase()) || 
                                 r.address.toLowerCase().includes(search.toLowerCase());
            const matchesFilter = filter === '' || r.cuisine.includes(filter);
            return matchesSearch && matchesFilter;
        });

        grid.innerHTML = filtered.map(r => `
            <div class="glass outlet-card reveal active">
                <div style="overflow: hidden;">
                    <img src="${r.image}" alt="${r.name}" class="outlet-img">
                </div>
                <div class="outlet-info">
                    <div class="rating">
                        ${'<i class="fas fa-star"></i>'.repeat(Math.floor(r.rating))}
                        ${r.rating % 1 !== 0 ? '<i class="fas fa-star-half-alt"></i>' : ''}
                        <span style="color: var(--text-muted); margin-left: 5px;">(${r.rating})</span>
                    </div>
                    <h3>${r.name}</h3>
                    <p style="color: var(--text-muted); font-size: 0.9rem; margin: 0.5rem 0;">${r.address}</p>
                    <p style="color: var(--primary-color); font-size: 0.85rem;"><i class="fas fa-phone"></i> ${r.mobile}</p>
                    <div class="outlet-meta">
                        <span><i class="fas fa-utensils"></i> ${r.cuisine}</span>
                        <span><i class="fas fa-clock"></i> ${r.hours}</span>
                    </div>
                    <div class="outlet-btns">
                        <button class="btn btn-outline" onclick="openDetails('${r.name}')">Details</button>
                        <a href="reservation.html?res=${encodeURIComponent(r.name)}" class="btn btn-primary">Book Table</a>
                        <a href="${r.directions}" target="_blank" class="btn btn-outline">Directions</a>
                    </div>
                </div>
            </div>
        `).join('');
    };

    window.openDetails = (name) => {
        const r = tricityRestaurants.find(res => res.name === name);
        const modal = document.getElementById('detail-modal');
        const content = document.getElementById('detail-modal-content');
        if (!modal || !content) return;

        content.innerHTML = `
            <i class="fas fa-times close-modal" onclick="document.getElementById('detail-modal').classList.remove('active')"></i>
            <div class="detail-modal-grid">
                <div>
                    <img src="${r.image}" alt="${r.name}" style="width: 100%; border-radius: 20px; margin-bottom: 2rem;">
                    <div class="detail-modal-gallery">
                        <img src="./images/gallery/gallery1.png" style="width: 100%; height: 120px; object-fit: cover; border-radius: 10px;">
                        <img src="./images/gallery/gallery2.png" style="width: 100%; height: 120px; object-fit: cover; border-radius: 10px;">
                        <img src="./images/gallery/gallery3.png" style="width: 100%; height: 120px; object-fit: cover; border-radius: 10px;">
                    </div>
                </div>
                <div>
                    <h2 style="font-size: clamp(1.6rem, 4vw, 2.5rem); margin-bottom: 1rem; color: var(--primary-color);">${r.name}</h2>
                    <p style="color: var(--text-muted); margin-bottom: 2rem;">Experience the finest ${r.cuisine} cuisine in the heart of the Tricity area. Our outlet at ${r.address} offers a premium cinematic atmosphere with impeccable service.</p>
                    
                    <h3 style="margin-bottom: 1rem;">Popular Dishes</h3>
                    <ul class="detail-modal-dishes">
                        <li><i class="fas fa-check-circle" style="color: var(--primary-color);"></i> Signature Grill</li>
                        <li><i class="fas fa-check-circle" style="color: var(--primary-color);"></i> Truffle Risotto</li>
                        <li><i class="fas fa-check-circle" style="color: var(--primary-color);"></i> Saffron Infusion</li>
                        <li><i class="fas fa-check-circle" style="color: var(--primary-color);"></i> Artisan Platter</li>
                    </ul>

                    <div class="glass" style="padding: 1.5rem; border-radius: 15px; margin-bottom: 2rem;">
                        <div style="display: flex; justify-content: space-between; margin-bottom: 1rem;">
                            <span>Seating Capacity</span>
                            <span style="font-weight: 700; color: var(--primary-color);">120 Guests</span>
                        </div>
                        <div style="display: flex; justify-content: space-between;">
                            <span>Private Lounge</span>
                            <span style="font-weight: 700; color: var(--primary-color);">Available</span>
                        </div>
                    </div>

                    <h3 style="margin-bottom: 1rem;">Recent Reviews</h3>
                    <div style="border-left: 3px solid var(--primary-color); padding-left: 1rem; margin-bottom: 2rem;">
                        <p style="font-style: italic; font-size: 0.9rem;">"One of the best luxury dining experiences in Chandigarh. The ambience is truly cinematic!"</p>
                        <span style="font-size: 0.8rem; color: var(--text-muted);">- Rahul Sharma</span>
                    </div>

                    <div class="detail-modal-btns">
                        <a href="reservation.html" class="btn btn-primary">Book Table</a>
                        <a href="${r.directions}" target="_blank" class="btn btn-outline">Get Directions</a>
                    </div>
                </div>
            </div>
        `;
        modal.classList.add('active');
    };

    if (document.getElementById('restaurant-grid')) {
        window.renderTricityRestaurants();
    }

    // --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    // --- Navbar Scroll Effect ---
    const navbar = document.querySelector('.navbar');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });

    // --- Hero Parallax Effect (Desktop Only) ---
    const heroVisual = document.querySelector('.hero-visual');
    if (heroVisual && window.innerWidth > 992) {
        document.addEventListener('mousemove', (e) => {
            const moveX = (e.clientX - window.innerWidth / 2) * 0.01;
            const moveY = (e.clientY - window.innerHeight / 2) * 0.01;
            heroVisual.style.transform = `translate(${moveX}px, ${moveY}px)`;
        });
    }

    // --- Auth: Sign Up Logic ---
    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        registerForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const name = document.getElementById('signup-name').value;
            const email = document.getElementById('signup-email').value;
            const password = document.getElementById('signup-password').value;
            const confirmPassword = document.getElementById('signup-confirm-password').value;

            if (password !== confirmPassword) {
                alert('Passwords do not match!');
                return;
            }

            const users = JSON.parse(localStorage.getItem('aromatica_users') || '[]');
            if (users.find(u => u.email === email)) {
                alert('User with this email already exists!');
                return;
            }

            users.push({ name, email, password });
            localStorage.setItem('aromatica_users', JSON.stringify(users));
            
            // Auto-login
            localStorage.setItem('aromatica_current_user', JSON.stringify({ name, email }));
            alert('Account created successfully! Welcome to Aromatica.');
            window.location.href = 'index.html';
        });
    }

    // --- Auth: Sign In Logic ---
    const signinForm = document.getElementById('signin-form');
    if (signinForm) {
        signinForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('signin-email').value;
            const password = document.getElementById('signin-password').value;

            const users = JSON.parse(localStorage.getItem('aromatica_users') || '[]');
            const user = users.find(u => u.email === email && u.password === password);

            if (user) {
                localStorage.setItem('aromatica_current_user', JSON.stringify({ name: user.name, email: user.email }));
                alert(`Welcome back, ${user.name}!`);
                window.location.href = 'index.html';
            } else {
                alert('Invalid email or password!');
            }
        });
    }

    // --- Cart & Menu Logic ---
    // (Consolidated from previous implementation)
    let cart = JSON.parse(localStorage.getItem('aromatica_cart') || '[]');
    // Helper: format a number as Indian Rupee with commas (e.g. 1200 → ₹1,200)
    const formatINR = (amount) => '₹' + Math.round(amount).toLocaleString('en-IN');

    const menuData = [
        { id: 1, category: 'Coffee', name: 'Artisan Latte', price: 750, veg: true, image: './images/menu/artisan-latte.png', desc: 'Hand-poured luxury espresso with velvet foam.' },
        { id: 2, category: 'Espresso', name: 'Double Shot Reserve', price: 550, veg: true, image: './images/menu/double-shot.png', desc: 'Intense flavor from rare Arabica beans.' },
        { id: 3, category: 'Cappuccino', name: 'Classic Velvet', price: 650, veg: true, image: './images/menu/classic-velvet.png', desc: 'Perfectly balanced espresso and steamed milk.' },
        { id: 4, category: 'Cold Coffee', name: 'Iced Hazelnut Brew', price: 800, veg: true, image: './images/menu/iced-hazelnut.png', desc: 'Cold-pressed coffee with roasted hazelnut syrup.' },
        { id: 5, category: 'Mocktails', name: 'Sunrise Sparkle', price: 600, veg: true, image: './images/menu/sunrise-sparkle.png', desc: 'Citrus blend with organic honey and soda.' },
        { id: 6, category: 'Desserts', name: 'Gold Leaf Cheesecake', price: 850, veg: true, image: './images/menu/gold-cheesecake.png', desc: 'Rich New York style with 24k edible gold.' },
        { id: 7, category: 'Pizza', name: 'Truffle Mushroom Pizza', price: 1450, veg: true, image: './images/menu/truffle-pizza.png', desc: 'Hand-stretched dough with wild mushrooms.' },
        { id: 8, category: 'Pasta', name: 'Creamy Pesto Penne', price: 1200, veg: true, image: './images/menu/pesto-penne.png', desc: 'Fresh basil pesto with pine nuts and parmesan.' },
        { id: 9, category: 'Indian Cuisine', name: 'Butter Chicken Deluxe', price: 1600, veg: false, image: './images/menu/butter-chicken.png', desc: 'Classic makhani gravy with tender tandoori chicken.' },
        { id: 10, category: 'Chinese', name: 'Truffle Dim Sums', price: 950, veg: true, image: './images/menu/truffle-dimsums.png', desc: 'Hand-folded dumplings with black truffle.' },
        { id: 11, category: 'Starters', name: 'Crispy Lotus Stem', price: 700, veg: true, image: './images/menu/lotus-stem.png', desc: 'Honey glazed lotus stems with sesame seeds.' },
        { id: 12, category: 'Premium Specials', name: 'Lobster Thermidor', price: 3800, veg: false, image: './images/menu/lobster-thermidor.png', desc: 'Luxury lobster tail with cognac cream sauce.' }
    ];

    window.updateCartUI = () => {
        const cartItems = document.getElementById('cart-items');
        const cartCount = document.querySelector('.cart-count');
        if (!cartItems) return;

        cartItems.innerHTML = '';
        let subtotal = 0;

        cart.forEach((item, index) => {
            subtotal += item.price * item.quantity;
            cartItems.innerHTML += `
                <div class="cart-item">
                    <img src="${item.image}" alt="${item.name}">
                    <div class="cart-item-info">
                        <h4>${item.name}</h4>
                        <p>${formatINR(item.price)}</p>
                    </div>
                    <div class="cart-qty-controls">
                        <button onclick="updateQty(${index}, -1)"><i class="fas fa-minus"></i></button>
                        <span>${item.quantity}</span>
                        <button onclick="updateQty(${index}, 1)"><i class="fas fa-plus"></i></button>
                    </div>
                    <i class="fas fa-trash" onclick="removeFromCart(${index})" style="cursor: pointer; color: #e74c3c; margin-left: 10px;"></i>
                </div>
            `;
        });

        const tax = subtotal * 0.05;
        const total = subtotal + tax;

        if (document.getElementById('cart-subtotal')) document.getElementById('cart-subtotal').textContent = formatINR(subtotal);
        if (document.getElementById('cart-tax')) document.getElementById('cart-tax').textContent = formatINR(tax);
        if (document.getElementById('cart-total')) document.getElementById('cart-total').textContent = formatINR(total);
        if (cartCount) cartCount.textContent = cart.reduce((acc, item) => acc + item.quantity, 0);
        
        localStorage.setItem('aromatica_cart', JSON.stringify(cart));
    };

    window.updateQty = (index, delta) => {
        cart[index].quantity += delta;
        if (cart[index].quantity < 1) cart.splice(index, 1);
        window.updateCartUI();
    };

    window.removeFromCart = (index) => {
        cart.splice(index, 1);
        window.updateCartUI();
    };

    window.addToCart = (id) => {
        const item = menuData.find(m => m.id === id);
        const existing = cart.find(c => c.id === id);
        if (existing) {
            existing.quantity++;
        } else {
            cart.push({ ...item, quantity: 1 });
        }
        window.updateCartUI();
        document.getElementById('cart-sidebar').classList.add('active');
    };

    // --- Menu Handling ---
    window.renderMenu = (category) => {
        const grid = document.getElementById('menu-grid');
        const categoriesContainer = document.getElementById('menu-categories');
        if (!grid) return;

        const categories = [...new Set(menuData.map(m => m.category))];
        if (categoriesContainer) {
            categoriesContainer.innerHTML = categories.map(cat => `
                <button class="category-btn ${cat === category ? 'active' : ''}" onclick="renderMenu('${cat}')">${cat}</button>
            `).join('');
        }

        const filtered = menuData.filter(m => m.category === category);
        grid.innerHTML = filtered.map(item => `
            <div class="menu-item-card fade-in">
                <img src="${item.image}" alt="${item.name}" class="menu-item-img">
                <span class="veg-badge ${item.veg ? 'veg' : 'non-veg'}">${item.veg ? 'Veg' : 'Non-Veg'}</span>
                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 0.5rem;">
                    <h3>${item.name}</h3>
                    <span style="color: var(--primary-color); font-weight: 700;">${formatINR(item.price)}</span>
                </div>
                <p style="color: var(--text-muted); font-size: 0.85rem; margin-bottom: 1.5rem;">${item.desc}</p>
                <button class="btn btn-primary" style="width: 100%;" onclick="addToCart(${item.id})">Buy Now</button>
            </div>
        `).join('');

        // Re-observe new cards after render (fadeObserver is set up in DOMContentLoaded)
        if (typeof fadeObserver !== 'undefined') {
            grid.querySelectorAll('.fade-in').forEach(el => fadeObserver.observe(el));
        }
    };

    const menuModal = document.getElementById('menu-modal');
    document.querySelectorAll('a.btn-outline, .btn-primary').forEach(btn => {
        if (btn.textContent.includes('Explore Full Menu')) {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                if (menuModal) {
                    menuModal.classList.add('active');
                    window.renderMenu('Coffee');
                }
            });
        }
    });

    if (document.getElementById('close-menu-modal')) {
        document.getElementById('close-menu-modal').onclick = () => menuModal.classList.remove('active');
    }

    // --- Cart Sidebar Toggle ---
    const openCart = document.getElementById('open-cart');
    const closeCart = document.getElementById('close-cart');
    const cartSidebar = document.getElementById('cart-sidebar');

    if (openCart) openCart.onclick = () => cartSidebar.classList.add('active');
    if (closeCart) closeCart.onclick = () => cartSidebar.classList.remove('active');

    // --- Checkout Logic ---
    const checkoutBtn = document.getElementById('checkout-btn');
    if (checkoutBtn) {
        checkoutBtn.onclick = () => {
            if (cart.length === 0) {
                alert('Your cart is empty!');
                return;
            }
            
            const orderId = 'AR-' + Math.floor(Math.random() * 900000 + 100000);
            const timestamp = new Date().toLocaleString();
            
            // Save order to history
            const orders = JSON.parse(localStorage.getItem('aromatica_orders') || '[]');
            const subtotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
            const tax = subtotal * 0.05;
            const total = subtotal + tax;

            const newOrder = {
                id: orderId,
                date: timestamp,
                items: [...cart],
                total: total,          // store as number so formatINR works
                status: 'Preparing'
            };

            orders.unshift(newOrder);
            localStorage.setItem('aromatica_orders', JSON.stringify(orders));

            const orderIdSpan = document.getElementById('order-id');
            const successModal = document.getElementById('success-modal');
            if (orderIdSpan) orderIdSpan.textContent = orderId;
            if (successModal) successModal.classList.add('active');
            
            cart = [];
            window.updateCartUI();
            const cartSidebar = document.getElementById('cart-sidebar');
            if (cartSidebar) cartSidebar.classList.remove('active');
        };
    }

    // ================================================================
    // --- Render Orders Logic (orders.html) --------------------------
    // ================================================================
    const ordersList = document.getElementById('orders-list');
    if (ordersList) {
        const reservations = JSON.parse(localStorage.getItem('aromatica_reservations') || '[]');
        const cartOrders   = JSON.parse(localStorage.getItem('aromatica_orders') || '[]')
                               .filter(o => o.status !== 'Reserved Table'); // exclude mirrored res entries

        // ── helpers ──────────────────────────────────────────────────
        const zoneName = (tableId) => {
            if (!tableId) return 'Dining Area';
            if (tableId.startsWith('W')) return 'Window Side';
            if (tableId.startsWith('M')) return 'Main Dining Hall';
            if (tableId.startsWith('V')) return 'VIP Lounge';
            return 'Premium Area';
        };

        const renderReservationCard = (r) => `
            <div class="glass order-card reveal active" style="border-left: 3px solid #2ecc71;">
                <div class="order-header">
                    <div style="display: flex; align-items: center; gap: 1rem;">
                        <div style="width: 50px; height: 50px; border-radius: 12px; background: rgba(46,204,113,0.15); display: flex; align-items: center; justify-content: center; font-size: 1.4rem; color: #2ecc71; border: 1px solid rgba(46,204,113,0.3);">
                            <i class="fas fa-calendar-check"></i>
                        </div>
                        <div>
                            <span class="order-id" style="font-size: 1.05rem;"><i class="fas fa-bookmark" style="margin-right:6px; color:#2ecc71;"></i>Booking #${r.ref}</span>
                            <p style="color: var(--text-muted); font-size: 0.82rem; margin-top: 0.2rem;">Aromatica Luxury Dining &bull; Booked on ${r.bookedAt}</p>
                        </div>
                    </div>
                    <span class="order-status" style="background: rgba(46,204,113,0.15); color: #2ecc71; border: 1px solid #2ecc71;">${r.status}</span>
                </div>

                <!-- Reservation Detail Grid -->
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 1rem; background: rgba(0,0,0,0.25); padding: 1.25rem; border-radius: 14px; margin: 1.25rem 0;">
                    <div>
                        <span style="display:block; font-size:0.72rem; text-transform:uppercase; letter-spacing:1px; color:var(--text-muted); margin-bottom:0.3rem;"><i class="fas fa-map-marker-alt" style="color:#2ecc71; margin-right:4px;"></i>Outlet</span>
                        <span style="font-weight:700; color:var(--text-light); font-size:0.95rem;">${r.outlet}</span>
                    </div>
                    <div>
                        <span style="display:block; font-size:0.72rem; text-transform:uppercase; letter-spacing:1px; color:var(--text-muted); margin-bottom:0.3rem;"><i class="fas fa-chair" style="color:#2ecc71; margin-right:4px;"></i>Table</span>
                        <span style="font-weight:700; color:var(--text-light); font-size:0.95rem;">${r.table} &mdash; ${zoneName(r.table)}</span>
                    </div>
                    <div>
                        <span style="display:block; font-size:0.72rem; text-transform:uppercase; letter-spacing:1px; color:var(--text-muted); margin-bottom:0.3rem;"><i class="fas fa-calendar" style="color:#2ecc71; margin-right:4px;"></i>Date</span>
                        <span style="font-weight:700; color:var(--text-light); font-size:0.95rem;">${r.date}</span>
                    </div>
                    <div>
                        <span style="display:block; font-size:0.72rem; text-transform:uppercase; letter-spacing:1px; color:var(--text-muted); margin-bottom:0.3rem;"><i class="fas fa-clock" style="color:#2ecc71; margin-right:4px;"></i>Time</span>
                        <span style="font-weight:700; color:var(--text-light); font-size:0.95rem;">${r.time}</span>
                    </div>
                    <div>
                        <span style="display:block; font-size:0.72rem; text-transform:uppercase; letter-spacing:1px; color:var(--text-muted); margin-bottom:0.3rem;"><i class="fas fa-users" style="color:#2ecc71; margin-right:4px;"></i>Guests</span>
                        <span style="font-weight:700; color:var(--text-light); font-size:0.95rem;">${r.guests}</span>
                    </div>
                    <div>
                        <span style="display:block; font-size:0.72rem; text-transform:uppercase; letter-spacing:1px; color:var(--text-muted); margin-bottom:0.3rem;"><i class="fas fa-receipt" style="color:#2ecc71; margin-right:4px;"></i>Deposit</span>
                        <span style="font-weight:700; color:#2ecc71; font-size:0.95rem;">Paid</span>
                    </div>
                </div>

                <div style="margin-top: 0.5rem; display: flex; gap: 1rem; flex-wrap: wrap;">
                    <button class="btn btn-outline" style="flex:1; padding:0.75rem; font-size:0.9rem;" onclick="window.print()">
                        <i class="fas fa-ticket-alt"></i> Print Pass
                    </button>
                    <a href="reservation.html" class="btn btn-primary" style="flex:1; padding:0.75rem; font-size:0.9rem; text-align:center;">
                        <i class="fas fa-plus"></i> New Booking
                    </a>
                </div>
            </div>
        `;

        const renderCartOrderCard = (order) => {
            const totalDisplay = (typeof order.total === 'number') ? formatINR(order.total) : ('\u20b9' + order.total);
            return `
            <div class="glass order-card active-tracker-card reveal active">
                <div class="order-header" style="border-bottom: none; margin-bottom: 0; padding-bottom: 0;">
                    <div style="display: flex; align-items: center; gap: 1rem;">
                        <div style="width: 50px; height: 50px; border-radius: 12px; background: url('./images/orders/order1.jpg') center/cover;"></div>
                        <div>
                            <span class="order-id" style="font-size: 1.1rem;">Order #${order.id}</span>
                            <p style="color: var(--text-muted); font-size: 0.85rem; margin-top: 0.2rem;">Aromatica Luxury Dining &bull; ${order.date}</p>
                        </div>
                    </div>
                    <span class="order-status status-preparing">${order.status}</span>
                </div>

                <!-- Delivery Tracker -->
                <div class="tracker-status-bar">
                    <div class="tracker-progress-line" style="width: 35%;"></div>
                    <div class="tracker-step completed"><div class="tracker-icon"><i class="fas fa-check"></i></div><span>Received</span></div>
                    <div class="tracker-step active"><div class="tracker-icon"><i class="fas fa-fire"></i></div><span>Preparing</span></div>
                    <div class="tracker-step"><div class="tracker-icon"><i class="fas fa-motorcycle"></i></div><span>On The Way</span></div>
                    <div class="tracker-step"><div class="tracker-icon"><i class="fas fa-box-open"></i></div><span>Delivered</span></div>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; background: rgba(0,0,0,0.2); padding: 1rem; border-radius: 12px;">
                    <div>
                        <span style="display: block; color: var(--text-muted); font-size: 0.85rem; margin-bottom: 0.3rem;">Estimated Time</span>
                        <div class="eta-badge"><i class="fas fa-clock"></i> 24:59 mins</div>
                    </div>
                    <div style="text-align: right;">
                        <span style="display: block; color: var(--text-muted); font-size: 0.85rem; margin-bottom: 0.3rem;">Delivery Partner</span>
                        <span style="font-weight: 600; color: var(--text-light);"><i class="fas fa-user-circle" style="color: var(--primary-color);"></i> Assigning...</span>
                    </div>
                </div>

                <!-- Item Summary -->
                <div class="order-items-list" style="border-top: 1px solid var(--glass-border); padding-top: 1.5rem;">
                    <h4 style="font-size: 0.95rem; color: var(--text-muted); margin-bottom: 1rem; text-transform: uppercase; letter-spacing: 1px;">Order Summary</h4>
                    ${order.items.map(item => `
                        <div class="order-item-row" style="flex-direction: column; gap: 0.3rem;">
                            <div style="display: flex; justify-content: space-between; width: 100%; color: var(--text-light); font-weight: 600;">
                                <span>${item.quantity}x ${item.name}</span>
                                <span>${formatINR(item.price * item.quantity)}</span>
                            </div>
                        </div>
                    `).join('')}
                </div>
                <div class="order-footer">
                    <span style="color: var(--text-muted); font-weight: 600;">Total Amount</span>
                    <span class="order-total" style="color: var(--primary-color); font-size: 1.2rem;">${totalDisplay}</span>
                </div>
                <div style="margin-top: 1.5rem; display: flex; gap: 1rem; flex-wrap: wrap;">
                    <button class="btn btn-outline" style="flex:1; padding:0.8rem; font-size:0.9rem;" onclick="window.print()">
                        <i class="fas fa-file-invoice"></i> View Receipt
                    </button>
                    <button class="btn btn-primary" style="flex:1; padding:0.8rem; font-size:0.9rem;" onclick="alert('Live GPS tracking initiated...')">
                        <i class="fas fa-map-marker-alt"></i> Track Live
                    </button>
                </div>
            </div>
        `;};

        // ── Build the two sections ───────────────────────────────────
        let html = '';

        // — Section 1: Table Bookings —
        html += `<div style="margin-bottom: 3rem;">
            <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1.5rem;">
                <i class="fas fa-calendar-check" style="font-size: 1.2rem; color: #2ecc71;"></i>
                <h3 style="font-size: 1.4rem; margin: 0;">Table <span style="color:#2ecc71;">Bookings</span></h3>
                <span style="margin-left: auto; font-size: 0.8rem; background: rgba(46,204,113,0.15); color:#2ecc71; padding: 0.3rem 0.8rem; border-radius:50px; border:1px solid rgba(46,204,113,0.3);">${reservations.length} booking${reservations.length !== 1 ? 's' : ''}</span>
            </div>`;

        if (reservations.length === 0) {
            html += `<div class="glass empty-orders reveal active" style="padding: 3rem; text-align: center; border-radius: 20px;">
                <i class="fas fa-calendar-times" style="font-size: 3rem; color: var(--glass-border); margin-bottom: 1.5rem;"></i>
                <h3 style="margin-bottom: 0.75rem;">No Table Bookings Yet</h3>
                <p style="color: var(--text-muted); margin-bottom: 1.5rem;">Reserve your table for a premium luxury dining experience.</p>
                <a href="reservation.html" class="btn btn-primary"><i class="fas fa-calendar-plus" style="margin-right:6px;"></i>Book a Table</a>
            </div>`;
        } else {
            html += reservations.map(renderReservationCard).join('');
        }
        html += '</div>';

        // — Section 2: Cart Orders —
        html += `<div style="margin-bottom: 3rem;">
            <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1.5rem;">
                <i class="fas fa-shopping-bag" style="font-size: 1.2rem; color: var(--primary-color);"></i>
                <h3 style="font-size: 1.4rem; margin: 0;">Cart <span class="accent-text">Orders</span></h3>
                <span style="margin-left: auto; font-size: 0.8rem; background: rgba(212,163,115,0.15); color:var(--primary-color); padding: 0.3rem 0.8rem; border-radius:50px; border:1px solid rgba(212,163,115,0.3);">${cartOrders.length} order${cartOrders.length !== 1 ? 's' : ''}</span>
            </div>`;

        if (cartOrders.length === 0) {
            html += `<div class="glass empty-orders reveal active" style="padding: 3rem; text-align: center; border-radius: 20px;">
                <i class="fas fa-receipt" style="font-size: 3rem; color: var(--glass-border); margin-bottom: 1.5rem;"></i>
                <h3 style="margin-bottom: 0.75rem;">No Orders Placed Yet</h3>
                <p style="color: var(--text-muted); margin-bottom: 1.5rem;">Browse our artisan menu and start your luxury dining journey.</p>
                <a href="restaurant.html" class="btn btn-primary"><i class="fas fa-utensils" style="margin-right:6px;"></i>Explore Menu</a>
            </div>`;
        } else {
            html += cartOrders.map(renderCartOrderCard).join('');
        }
        html += '</div>';

        ordersList.innerHTML = html;
    }

    window.closeSuccessModal = () => {
        const successModal = document.getElementById('success-modal');
        if (successModal) successModal.classList.remove('active');
    };

    // --- Reveal Animations ---
    const revealOnScroll = () => {
        const revealElements = document.querySelectorAll('.reveal');
        revealElements.forEach(el => {
            const elementTop = el.getBoundingClientRect().top;
            if (elementTop < window.innerHeight - 100) {
                if (!el.classList.contains('active')) {
                    el.classList.add('active');
                    
                    // Trigger counters if they exist in this reveal block
                    const counters = el.querySelectorAll('.animated-counter');
                    if (counters.length > 0) {
                        counters.forEach(counter => {
                            const target = +counter.getAttribute('data-target');
                            const increment = target / 50; // Speed of counter
                            
                            const updateCount = () => {
                                const count = +counter.innerText;
                                if (count < target) {
                                    counter.innerText = Math.ceil(count + increment);
                                    setTimeout(updateCount, 40);
                                } else {
                                    counter.innerText = target;
                                }
                            };
                            updateCount();
                        });
                    }
                }
            }
        });
    };
    window.addEventListener('scroll', revealOnScroll);
    setTimeout(revealOnScroll, 100);

    // --- Mobile Menu (Fullscreen Slide-In) ---
    const hamburger = document.querySelector('.hamburger');
    const navLinks = document.querySelector('.nav-links');

    // Inject a styled mobile login section inside the nav
    if (navLinks && !navLinks.querySelector('.nav-mobile-login')) {
        const mobileLoginLi = document.createElement('li');
        mobileLoginLi.className = 'nav-mobile-login';
        const currentUser = JSON.parse(localStorage.getItem('aromatica_current_user'));

        if (currentUser) {
            const initial = currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'U';
            const firstName = currentUser.name ? currentUser.name.split(' ')[0] : 'Guest';
            mobileLoginLi.innerHTML = `
                <div class="nav-mobile-user-card">
                    <div class="nav-mobile-user-info">
                        <div class="nav-mobile-avatar">${initial}</div>
                        <div>
                            <div class="nav-mobile-username">${firstName}</div>
                            <div class="nav-mobile-useremail">${currentUser.email || 'Aromatica Member'}</div>
                        </div>
                    </div>
                    <a href="#" onclick="logout(); return false;" class="nav-mobile-logout-btn">
                        <i class="fas fa-sign-out-alt"></i> Logout
                    </a>
                </div>
            `;
        } else {
            mobileLoginLi.innerHTML = `
                <div class="nav-mobile-login-card">
                    <p class="nav-mobile-login-text">Sign in for exclusive reservations & order tracking</p>
                    <a href="login.html" class="btn btn-primary nav-mobile-login-btn">
                        <i class="fas fa-user"></i> Login / Sign Up
                    </a>
                </div>
            `;
        }
        navLinks.appendChild(mobileLoginLi);
    }

    const openMobileMenu = () => {
        navLinks.classList.add('active');
        hamburger.classList.add('active');
        document.body.classList.add('nav-open');
    };

    const closeMobileMenu = () => {
        navLinks.classList.remove('active');
        hamburger.classList.remove('active');
        document.body.classList.remove('nav-open');
    };

    if (hamburger) {
        hamburger.addEventListener('click', () => {
            if (navLinks.classList.contains('active')) {
                closeMobileMenu();
            } else {
                openMobileMenu();
            }
        });
    }

    // Close mobile menu when any nav link is clicked
    if (navLinks) {
        navLinks.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                closeMobileMenu();
            });
        });
    }

    // Close menu on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeMobileMenu();
    });

    // --- Custom Cursor & Cinematic Parallax (Desktop Only) ---
    const isTouchDevice = () => window.matchMedia('(max-width: 992px)').matches || window.innerWidth <= 992;
    
    if (!isTouchDevice()) {
        const cursor = document.createElement('div');
        cursor.classList.add('custom-cursor');
        document.body.appendChild(cursor);
        
        document.addEventListener('mousemove', (e) => {
            cursor.style.left = e.clientX + 'px';
            cursor.style.top = e.clientY + 'px';

            // Cinematic Parallax tracking
            const x = (window.innerWidth - e.pageX * 2) / 90;
            const y = (window.innerHeight - e.pageY * 2) / 90;
            
            const floatingWrappers = document.querySelectorAll('.floating-element-wrapper');
            floatingWrappers.forEach((wrapper, index) => {
                const speed = (index % 3) + 1;
                wrapper.style.transform = `translate(${x * speed}px, ${y * speed}px)`;
            });

            const coffeeParticles = document.querySelectorAll('.floating-coffee-particle');
            coffeeParticles.forEach((particle, index) => {
                const speed = ((index % 4) + 1) * 0.6;
                particle.style.transform = `translate(${x * speed * 2}px, ${y * speed * 2}px)`;
            });
        });
    }

    // --- Reservation Accordions ---
    const accordions = document.querySelectorAll('.accordion-header');
    accordions.forEach(acc => {
        acc.addEventListener('click', function() {
            const item = this.parentElement;
            const content = item.querySelector('.accordion-content');
            
            // Close all others
            document.querySelectorAll('.accordion-item').forEach(other => {
                if(other !== item) {
                    other.classList.remove('active');
                    other.querySelector('.accordion-content').style.maxHeight = null;
                }
            });
            
            item.classList.toggle('active');
            if (item.classList.contains('active')) {
                content.style.maxHeight = content.scrollHeight + "px";
            } else {
                content.style.maxHeight = null;
            }
        });
    });

    // --- Scroll Fade-In Observer ---
    const fadeObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                fadeObserver.unobserve(entry.target); // animate once only
            }
        });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

    document.querySelectorAll('.fade-in').forEach(el => fadeObserver.observe(el));

    // --- Initialize UI ---
    window.updateCartUI();
    updateAuthUI();
});
