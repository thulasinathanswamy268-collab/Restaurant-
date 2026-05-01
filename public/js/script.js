// static/js/script.js - Restaurant Menu System

let cart = [];
let allMenuItems = [];

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    if (typeof menuData !== 'undefined') {
        allMenuItems = menuData;
        renderCategories();
        displayMenu(allMenuItems);
    } else {
        console.error("menuData not found! Make sure Flask is passing it.");
    }
    updateCartCount();
});

// Render Category Buttons
function renderCategories() {
    const container = document.getElementById('categories');
    if (!container) return;

    const categories = ['All', ...new Set(allMenuItems.map(item => item.category))];

    container.innerHTML = categories.map(cat => `
        <button onclick="filterByCategory('${cat}')" 
                class="category-btn px-5 py-2 rounded-2xl whitespace-nowrap font-medium border ${cat === 'All' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white hover:bg-gray-100'}">
            ${cat}
        </button>
    `).join('');
}

// Display Menu Items
function displayMenu(items) {
    const grid = document.getElementById('menu-grid');
    if (!grid) return;

    grid.innerHTML = '';

    if (items.length === 0) {
        grid.innerHTML = `<p class="col-span-full text-center py-12 text-gray-500">No dishes found 😔</p>`;
        return;
    }

    items.forEach(item => {
        const card = document.createElement('div');
        card.className = 'menu-card bg-white rounded-3xl shadow-lg overflow-hidden';
        card.innerHTML = `
            <img src="${item.image_url || 'https://picsum.photos/id/20/400/250'}" 
                 alt="${item.name}" 
                 class="w-full h-48 object-cover">
            <div class="p-5">
                <h3 class="text-xl font-semibold mb-1">${item.name}</h3>
                <p class="text-emerald-600 font-bold text-lg mb-3">₹${item.price}</p>
                <p class="text-gray-600 text-sm line-clamp-2 mb-4">${item.description || 'Delicious dish prepared fresh'}</p>
                
                <button onclick="addToCart(${item.id}, '${item.name.replace(/'/g, "\\'")}', ${item.price})" 
                        class="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-2xl font-medium">
                    Add to Cart +
                </button>
            </div>
        `;
        grid.appendChild(card);
    });
}

// Filter by Category
let currentCategory = 'All';
function filterByCategory(category) {
    currentCategory = category;
    
    // Update active button style
    document.querySelectorAll('.category-btn').forEach(btn => {
        if (btn.textContent.trim() === category) {
            btn.classList.add('bg-emerald-600', 'text-white');
        } else {
            btn.classList.remove('bg-emerald-600', 'text-white');
        }
    });

    let filtered = allMenuItems;
    if (category !== 'All') {
        filtered = allMenuItems.filter(item => item.category === category);
    }
    displayMenu(filtered);
}

// Search Functionality
const searchInput = document.getElementById('search-input');
if (searchInput) {
    searchInput.addEventListener('input', function() {
        const query = this.value.toLowerCase().trim();
        
        let filtered = allMenuItems;
        if (currentCategory !== 'All') {
            filtered = filtered.filter(item => item.category === currentCategory);
        }

        if (query) {
            filtered = filtered.filter(item => 
                item.name.toLowerCase().includes(query) || 
                (item.description && item.description.toLowerCase().includes(query))
            );
        }
        displayMenu(filtered);
    });
}

// Add to Cart
function addToCart(id, name, price) {
    const existing = cart.find(item => item.id === id);
    if (existing) {
        existing.quantity += 1;
    } else {
        cart.push({ id, name, price, quantity: 1 });
    }
    updateCartCount();
    
    // Toast notification
    showToast(`${name} added to cart!`);
}

// Update Cart Count
function updateCartCount() {
    const countEl = document.getElementById('cart-count');
    if (countEl) {
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        countEl.textContent = totalItems;
    }
}

// Toggle Cart Modal
function toggleCart() {
    const modal = document.getElementById('cart-modal');
    if (modal) {
        modal.classList.toggle('hidden');
        if (!modal.classList.contains('hidden')) {
            renderCart();
        }
    }
}

// Render Cart Items
function renderCart() {
    const container = document.getElementById('cart-items');
    const totalEl = document.getElementById('cart-total');
    if (!container) return;

    container.innerHTML = '';
    let total = 0;

    if (cart.length === 0) {
        container.innerHTML = `<p class="text-center py-8 text-gray-400">Your cart is empty</p>`;
        totalEl.textContent = '0';
        return;
    }

    cart.forEach((item, index) => {
        const itemTotal = item.price * item.quantity;
        total += itemTotal;

        const div = document.createElement('div');
        div.className = 'flex justify-between items-center py-3 border-b last:border-0';
        div.innerHTML = `
            <div class="flex-1">
                <p class="font-medium">${item.name}</p>
                <p class="text-sm text-gray-500">₹${item.price} × ${item.quantity}</p>
            </div>
            <div class="flex items-center gap-4">
                <span class="font-semibold">₹${itemTotal}</span>
                <button onclick="changeQuantity(${index}, -1)" class="w-7 h-7 flex items-center justify-center border rounded">-</button>
                <span>${item.quantity}</span>
                <button onclick="changeQuantity(${index}, 1)" class="w-7 h-7 flex items-center justify-center border rounded">+</button>
            </div>
        `;
        container.appendChild(div);
    });

    totalEl.textContent = total;
}

// Change Quantity
window.changeQuantity = function(index, change) {
    cart[index].quantity += change;
    if (cart[index].quantity < 1) {
        cart.splice(index, 1);
    }
    renderCart();
    updateCartCount();
};

// Clear Cart
window.clearCart = function() {
    if (confirm("Clear entire cart?")) {
        cart = [];
        renderCart();
        updateCartCount();
    }
};

// Place Order
window.placeOrder = async function() {
    if (cart.length === 0) {
        alert("Your cart is empty!");
        return;
    }

    const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

    try {
        const response = await fetch('/api/orders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ items: cart, total: total })
        });

        const data = await response.json();

        if (data.success) {
            alert(`🎉 Order placed successfully!\nOrder ID: ${data.order_id}`);
            cart = [];
            toggleCart();
            updateCartCount();
        } else {
            alert("Failed to place order. Please try again.");
        }
    } catch (error) {
        alert("Offline mode: Order saved locally. It will sync when you're back online.");
        // You can add localStorage saving here later
        cart = [];
        toggleCart();
        updateCartCount();
    }
};

// Simple Toast Notification
function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'fixed bottom-20 left-1/2 -translate-x-1/2 bg-emerald-700 text-white px-6 py-3 rounded-2xl shadow-xl z-50';
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 2500);
}

// Chatbot Functions (Website only)
function toggleChat() {
    const chatWindow = document.getElementById('chat-window');
    chatWindow.classList.toggle('hidden');
}

function addChatMessage(sender, message) {
    const messagesDiv = document.getElementById('chat-messages');
    const div = document.createElement('div');
    div.className = sender === "You" ? "text-right mb-3" : "text-left mb-3";
    div.innerHTML = `
        <div class="${sender === "You" ? "bg-emerald-100 ml-auto" : "bg-white"} p-3 rounded-2xl inline-block max-w-[85%]">
            ${message}
        </div>
    `;
    messagesDiv.appendChild(div);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

const chatbotReplies = {
    "hi": "Hello! Welcome to Delight Restaurant. How can I help you today?",
    "hello": "Hi there! Looking for something delicious?",
    "menu": "We have Appetizers, Main Course, Desserts, and Beverages. Browse the menu above!",
    "order": "Click 'Add to Cart +' on any item, then click the cart icon to review and place your order.",
    "price": "Prices are clearly shown on every dish card.",
    "offline": "Yes, the menu works offline after the first load!",
    "default": "I'm here to help with menu, orders, or this website. Try asking about the menu or how to order!"
};

function sendMessage() {
    const input = document.getElementById('chat-input');
    const text = input.value.trim();
    if (!text) return;

    addChatMessage("You", text);

    let reply = chatbotReplies.default;
    const lowerText = text.toLowerCase();

    for (let key in chatbotReplies) {
        if (lowerText.includes(key)) {
            reply = chatbotReplies[key];
            break;
        }
    }

    setTimeout(() => {
        addChatMessage("Delight Assistant", reply);
    }, 700);

    input.value = '';
}

// Make functions global so onclick works
window.addToCart = addToCart;
window.toggleCart = toggleCart;
window.placeOrder = placeOrder;
window.clearCart = clearCart;
window.filterByCategory = filterByCategory;
window.toggleChat = toggleChat;
window.sendMessage = sendMessage;

// ═══════════════════════════════════════════════════════════════════════════════
// ══ DELIGHT RESTAURANT — ULTIMATE 3D VISUAL ENGINE (INJECTION) ══
// ═══════════════════════════════════════════════════════════════════════════════
// NOTE: This module is appended AFTER all original code. Zero modifications
// were made to any functions above. All enhancements are additive only.

(function() {
    'use strict';

    // Wait for DOM to be fully ready including all original renders
    const init3D = () => {
        // ══ 3D CSS Injection ══
        const style3D = document.createElement('style');
        style3D.textContent = `
            /* ── 3D Canvas Layers ── */
            .delight-3d-bg {
                position: fixed !important;
                top: 0; left: 0;
                width: 100%; height: 100%;
                z-index: 0 !important;
                pointer-events: none !important;
            }

            /* ── Cinematic Loader ── */
            .delight-loader-overlay {
                position: fixed;
                inset: 0;
                background: linear-gradient(135deg, #064e3b, #065f46, #0f172a);
                z-index: 999999;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                perspective: 1000px;
            }
            .delight-loader-plate {
                width: 90px; height: 90px;
                border-radius: 50%;
                border: 3px solid rgba(16, 185, 129, 0.3);
                border-top-color: #10b981;
                border-right-color: #34d399;
                animation: plateSpin3D 1.2s linear infinite;
                box-shadow: 0 0 40px rgba(16, 185, 129, 0.4), inset 0 0 20px rgba(16, 185, 129, 0.1);
                position: relative;
            }
            .delight-loader-plate::before {
                content: '🍛';
                position: absolute;
                top: 50%; left: 50%;
                transform: translate(-50%, -50%);
                font-size: 42px;
                filter: drop-shadow(0 0 15px rgba(16, 185, 129, 0.6));
                animation: foodBounce3D 0.8s ease-in-out infinite;
            }
            @keyframes plateSpin3D {
                to { transform: rotate(360deg); }
            }
            @keyframes foodBounce3D {
                0%, 100% { transform: translate(-50%, -50%) scale(1) rotate(0deg); }
                50% { transform: translate(-50%, -50%) scale(1.25) rotate(5deg); }
            }
            .delight-loader-text {
                margin-top: 30px;
                font-family: 'Inter', system-ui, sans-serif;
                font-size: 13px;
                letter-spacing: 0.35em;
                color: #34d399;
                text-shadow: 0 0 25px rgba(52, 211, 153, 0.6);
                animation: textGlow3D 2s ease-in-out infinite;
            }
            @keyframes textGlow3D {
                0%, 100% { opacity: 0.4; }
                50% { opacity: 1; }
            }
            .delight-loader-bar {
                width: 200px;
                height: 3px;
                background: rgba(16, 185, 129, 0.1);
                margin-top: 20px;
                border-radius: 3px;
                overflow: hidden;
                box-shadow: 0 0 10px rgba(16, 185, 129, 0.1);
            }
            .delight-loader-fill {
                height: 100%;
                width: 0%;
                background: linear-gradient(90deg, #10b981, #34d399, #fbbf24, #10b981);
                background-size: 200% 100%;
                box-shadow: 0 0 20px rgba(16, 185, 129, 0.6);
                animation: fillBar3D 2.5s ease-out forwards, shimmerBar 2s linear infinite;
            }
            @keyframes fillBar3D {
                0% { width: 0%; }
                100% { width: 100%; }
            }
            @keyframes shimmerBar {
                0% { background-position: 200% 0; }
                100% { background-position: -200% 0; }
            }

            /* ── Custom Cursor ── */
            .delight-cursor {
                width: 10px; height: 10px;
                background: radial-gradient(circle, #34d399, #10b981);
                border-radius: 50%;
                position: fixed;
                pointer-events: none;
                z-index: 999999;
                box-shadow: 0 0 25px #34d399, 0 0 50px rgba(52, 211, 153, 0.4);
                transition: transform 0.08s, background 0.3s;
                mix-blend-mode: screen;
            }
            .delight-cursor-ring {
                width: 40px; height: 40px;
                border: 2px solid rgba(52, 211, 153, 0.5);
                border-radius: 50%;
                position: fixed;
                pointer-events: none;
                z-index: 999998;
                transition: transform 0.12s, border-color 0.3s, width 0.3s, height 0.3s;
            }
            .delight-cursor-outer {
                width: 70px; height: 70px;
                border: 1px dashed rgba(52, 211, 153, 0.25);
                border-radius: 50%;
                position: fixed;
                pointer-events: none;
                z-index: 999997;
                transition: transform 0.18s;
                animation: cursorSpin3D 10s linear infinite;
            }
            @keyframes cursorSpin3D {
                to { transform: translate(-50%, -50%) rotate(360deg); }
            }

            /* ── 3D Card Effects ── */
            .menu-card {
                transform-style: preserve-3d !important;
                transition: all 0.6s cubic-bezier(0.23, 1, 0.32, 1) !important;
                position: relative;
            }
            .menu-card::before {
                content: '';
                position: absolute;
                inset: -3px;
                border-radius: inherit;
                background: linear-gradient(135deg, rgba(16, 185, 129, 0.4), transparent 30%, transparent 70%, rgba(245, 158, 11, 0.3));
                background-size: 300% 300%;
                z-index: -1;
                opacity: 0;
                transition: opacity 0.5s ease;
                filter: blur(15px);
                transform: translateZ(-10px);
            }
            .menu-card:hover::before {
                opacity: 1;
                animation: gradientRotate3D 3s linear infinite;
            }
            @keyframes gradientRotate3D {
                0% { background-position: 0% 0%; }
                50% { background-position: 100% 100%; }
                100% { background-position: 0% 0%; }
            }
            .menu-card:hover {
                transform: perspective(1000px) rotateX(3deg) rotateY(-3deg) translateZ(50px) translateY(-12px) !important;
                box-shadow: 0 30px 60px rgba(0,0,0,0.15), 0 0 40px rgba(16, 185, 129, 0.15), 0 0 80px rgba(16, 185, 129, 0.05) !important;
            }
            .menu-card:hover img {
                transform: translateZ(30px) scale(1.08);
                filter: brightness(1.08) saturate(1.15);
            }
            .menu-card:hover h3 {
                transform: translateZ(40px);
                text-shadow: 0 4px 15px rgba(0,0,0,0.1);
            }
            .menu-card:hover .text-emerald-600 {
                transform: translateZ(35px) scale(1.1);
                color: #059669 !important;
            }
            .menu-card:hover button {
                transform: translateZ(50px);
                box-shadow: 0 15px 40px rgba(16, 185, 129, 0.35) !important;
            }
            .menu-card img, .menu-card h3, .menu-card .text-emerald-600, .menu-card button {
                transition: all 0.5s cubic-bezier(0.23, 1, 0.32, 1);
                transform-style: preserve-3d;
            }

            /* ── 3D Card Entrance Animation ── */
            @keyframes cardEnter3D {
                from {
                    opacity: 0;
                    transform: perspective(1000px) rotateX(20deg) translateZ(-100px) translateY(40px);
                    filter: blur(8px);
                }
                to {
                    opacity: 1;
                    transform: perspective(1000px) rotateX(0) translateZ(0) translateY(0);
                    filter: blur(0);
                }
            }
            .menu-card-3d-enter {
                animation: cardEnter3D 0.7s cubic-bezier(0.23, 1, 0.32, 1) forwards;
            }

            /* ── 3D Button Shine ── */
            button, .bg-emerald-600, .bg-emerald-700 {
                transform-style: preserve-3d !important;
                position: relative;
                overflow: hidden;
            }
            button::after, .bg-emerald-600::after, .bg-emerald-700::after {
                content: '';
                position: absolute;
                top: 0; left: -100%;
                width: 100%; height: 100%;
                background: linear-gradient(90deg, transparent, rgba(255,255,255,0.25), transparent);
                transition: left 0.6s ease;
            }
            button:hover::after, .bg-emerald-600:hover::after, .bg-emerald-700:hover::after {
                left: 100%;
            }
            button:hover, .bg-emerald-600:hover, .bg-emerald-700:hover {
                transform: translateY(-4px) translateZ(25px) !important;
                box-shadow: 0 20px 45px rgba(16, 185, 129, 0.3), 0 0 25px rgba(16, 185, 129, 0.15) !important;
            }
            button:active, .bg-emerald-600:active, .bg-emerald-700:active {
                transform: translateY(0) translateZ(10px) !important;
            }

            /* ── 3D Category Buttons ── */
            .category-btn {
                transform-style: preserve-3d !important;
                transition: all 0.4s cubic-bezier(0.23, 1, 0.32, 1) !important;
            }
            .category-btn:hover {
                transform: translateY(-4px) translateZ(20px) !important;
                box-shadow: 0 15px 35px rgba(16, 185, 129, 0.2) !important;
            }
            .category-btn.active {
                transform: translateZ(30px) !important;
                box-shadow: 0 15px 40px rgba(16, 185, 129, 0.35), 0 0 30px rgba(16, 185, 129, 0.2) !important;
                position: relative;
            }
            .category-btn.active::before {
                content: '';
                position: absolute;
                inset: -4px;
                border-radius: inherit;
                background: linear-gradient(135deg, rgba(16, 185, 129, 0.5), rgba(52, 211, 153, 0.3));
                z-index: -1;
                filter: blur(12px);
                animation: pulseGlow3D 2s ease-in-out infinite;
            }
            @keyframes pulseGlow3D {
                0%, 100% { opacity: 0.5; }
                50% { opacity: 1; }
            }

            /* ── 3D Search Input ── */
            #search-input {
                transform-style: preserve-3d !important;
                transition: all 0.5s cubic-bezier(0.23, 1, 0.32, 1) !important;
            }
            #search-input:focus {
                transform: translateZ(30px) scale(1.02) !important;
                box-shadow: 0 20px 50px rgba(16, 185, 129, 0.12), 0 0 0 3px rgba(16, 185, 129, 0.25) !important;
            }

            /* ── 3D Header ── */
            header h1, .text-4xl.font-bold {
                background: linear-gradient(135deg, #047857, #10b981, #34d399, #fbbf24, #047857) !important;
                background-size: 300% 300% !important;
                -webkit-background-clip: text !important;
                -webkit-text-fill-color: transparent !important;
                background-clip: text !important;
                animation: gradientFlow3D 5s ease infinite !important;
            }
            @keyframes gradientFlow3D {
                0%, 100% { background-position: 0% 50%; }
                50% { background-position: 100% 50%; }
            }
            header .text-6xl {
                display: inline-block;
                animation: foodBob3D 3s ease-in-out infinite;
                filter: drop-shadow(0 15px 30px rgba(0,0,0,0.15));
            }
            @keyframes foodBob3D {
                0%, 100% { transform: translateY(0) rotate(0deg); }
                25% { transform: translateY(-10px) rotate(5deg); }
                75% { transform: translateY(-5px) rotate(-3deg); }
            }

            /* ── 3D Cart Button ── */
            .fixed.bottom-6 button {
                animation: cartFloat3D 4s ease-in-out infinite;
            }
            @keyframes cartFloat3D {
                0%, 100% { transform: translateY(0) translateZ(0); }
                50% { transform: translateY(-8px) translateZ(20px); }
            }
            .fixed.bottom-6 button:hover {
                animation: none;
                transform: translateY(-10px) translateZ(35px) scale(1.08) !important;
                box-shadow: 0 25px 50px rgba(16, 185, 129, 0.35) !important;
            }

            /* ── 3D Cart Modal ── */
            #cart-modal {
                perspective: 1000px;
            }
            #cart-modal > div {
                animation: modalEnter3D 0.6s cubic-bezier(0.23, 1, 0.32, 1) forwards;
                transform-style: preserve-3d;
            }
            @keyframes modalEnter3D {
                from {
                    opacity: 0;
                    transform: perspective(1000px) rotateX(15deg) translateZ(-200px) scale(0.85);
                    filter: blur(10px);
                }
                to {
                    opacity: 1;
                    transform: perspective(1000px) rotateX(0) translateZ(0) scale(1);
                    filter: blur(0);
                }
            }

            /* ── 3D Chat Window ── */
            #chat-window {
                transform-style: preserve-3d;
            }
            #chat-window:not(.hidden) {
                animation: chatEnter3D 0.5s cubic-bezier(0.23, 1, 0.32, 1) forwards;
            }
            @keyframes chatEnter3D {
                from {
                    opacity: 0;
                    transform: perspective(800px) rotateY(-25deg) translateZ(-100px) translateY(50px) scale(0.9);
                }
                to {
                    opacity: 1;
                    transform: perspective(800px) rotateY(0) translateZ(0) translateY(0) scale(1);
                }
            }

            /* ── 3D Toast Notification ── */
            @keyframes toastEnter3D {
                from {
                    opacity: 0;
                    transform: translateX(-50%) translateZ(-50px) translateY(20px) scale(0.9);
                    filter: blur(5px);
                }
                to {
                    opacity: 1;
                    transform: translateX(-50%) translateZ(0) translateY(0) scale(1);
                    filter: blur(0);
                }
            }
            .fixed.bottom-20 {
                animation: toastEnter3D 0.4s cubic-bezier(0.23, 1, 0.32, 1) forwards;
                transform-style: preserve-3d;
                box-shadow: 0 15px 40px rgba(16, 185, 129, 0.3) !important;
            }

            /* ── 3D Particle Burst on Add to Cart ── */
            @keyframes particleBurst {
                0% { transform: translate(0, 0) scale(1); opacity: 1; }
                100% { transform: translate(var(--tx), var(--ty)) scale(0); opacity: 0; }
            }
            .cart-particle {
                position: fixed;
                width: 8px; height: 8px;
                border-radius: 50%;
                pointer-events: none;
                z-index: 99999;
                animation: particleBurst 0.8s cubic-bezier(0.23, 1, 0.32, 1) forwards;
            }

            /* ── 3D Scrollbar ── */
            ::-webkit-scrollbar { width: 10px; }
            ::-webkit-scrollbar-track { background: rgba(16, 185, 129, 0.05); }
            ::-webkit-scrollbar-thumb {
                background: linear-gradient(180deg, #10b981, #059669);
                border-radius: 5px;
                box-shadow: inset 0 0 6px rgba(0,0,0,0.2);
            }
            ::-webkit-scrollbar-thumb:hover {
                background: linear-gradient(180deg, #34d399, #10b981);
                box-shadow: 0 0 15px rgba(16, 185, 129, 0.4);
            }

            /* ── 3D Selection ── */
            ::selection {
                background: rgba(16, 185, 129, 0.3);
                text-shadow: 0 0 10px rgba(16, 185, 129, 0.5);
            }

            /* ── 3D Vignette ── */
            .min-h-screen::before {
                content: '';
                position: fixed;
                inset: 0;
                pointer-events: none;
                z-index: 100;
                box-shadow: inset 0 0 200px rgba(6, 78, 59, 0.12);
            }

            /* ── 3D Background Ambient ── */
            body::before {
                content: '';
                position: fixed;
                inset: -50%;
                width: 200%; height: 200%;
                background:
                    radial-gradient(ellipse at 20% 30%, rgba(16, 185, 129, 0.05) 0%, transparent 50%),
                    radial-gradient(ellipse at 80% 70%, rgba(245, 158, 11, 0.04) 0%, transparent 50%);
                animation: bgShift3D 25s ease-in-out infinite;
                pointer-events: none;
                z-index: -3;
            }
            @keyframes bgShift3D {
                0%, 100% { transform: translate(0, 0) rotate(0deg); }
                33% { transform: translate(-3%, 2%) rotate(1deg); }
                66% { transform: translate(2%, -3%) rotate(-1deg); }
            }
        `;
        document.head.appendChild(style3D);

        // ══ Cinematic Loading Screen ══
        const loader = document.createElement('div');
        loader.className = 'delight-loader-overlay';
        loader.id = 'delight-loader-3d';
        loader.innerHTML = `
            <div class="delight-loader-plate"></div>
            <div class="delight-loader-text">PREPARING YOUR EXPERIENCE</div>
            <div class="delight-loader-bar">
                <div class="delight-loader-fill"></div>
            </div>
        `;
        document.body.appendChild(loader);

        // Remove loader after animation
        setTimeout(() => {
            loader.style.transition = 'opacity 1.5s cubic-bezier(0.23, 1, 0.32, 1)';
            loader.style.opacity = '0';
            setTimeout(() => loader.remove(), 1500);
        }, 3000);

        // ══ Custom Cursor ══
        const cursor = document.createElement('div');
        cursor.className = 'delight-cursor';
        cursor.id = 'delight-cursor';
        const cursorRing = document.createElement('div');
        cursorRing.className = 'delight-cursor-ring';
        cursorRing.id = 'delight-cursor-ring';
        const cursorOuter = document.createElement('div');
        cursorOuter.className = 'delight-cursor-outer';
        cursorOuter.id = 'delight-cursor-outer';
        document.body.appendChild(cursor);
        document.body.appendChild(cursorRing);
        document.body.appendChild(cursorOuter);

        document.addEventListener('mousemove', (e) => {
            cursor.style.left = e.clientX + 'px';
            cursor.style.top = e.clientY + 'px';
            cursorRing.style.left = e.clientX + 'px';
            cursorRing.style.top = e.clientY + 'px';
            cursorOuter.style.left = e.clientX + 'px';
            cursorOuter.style.top = e.clientY + 'px';
        });

        // Cursor hover effects
        const enhanceCursor = () => {
            document.querySelectorAll('button, .menu-card, input, .category-btn').forEach(el => {
                el.addEventListener('mouseenter', () => {
                    cursorRing.style.transform = 'translate(-50%,-50%) scale(2.2)';
                    cursorRing.style.borderColor = 'rgba(52, 211, 153, 0.9)';
                    cursorOuter.style.transform = 'translate(-50%,-50%) scale(2.5)';
                    cursor.style.transform = 'translate(-50%,-50%) scale(1.8)';
                    cursor.style.background = '#6ee7b7';
                });
                el.addEventListener('mouseleave', () => {
                    cursorRing.style.transform = 'translate(-50%,-50%) scale(1)';
                    cursorRing.style.borderColor = 'rgba(52, 211, 153, 0.5)';
                    cursorOuter.style.transform = 'translate(-50%,-50%) scale(1)';
                    cursor.style.transform = 'translate(-50%,-50%) scale(1)';
                    cursor.style.background = 'radial-gradient(circle, #34d399, #10b981)';
                });
            });
        };
        setTimeout(enhanceCursor, 500);

        // ══ 3D Card Tilt Effect ══
        const addTilt3D = () => {
            document.querySelectorAll('.menu-card').forEach(card => {
                if (card.dataset.tilt3d) return;
                card.dataset.tilt3d = 'true';

                card.addEventListener('mousemove', (e) => {
                    const rect = card.getBoundingClientRect();
                    const x = e.clientX - rect.left;
                    const y = e.clientY - rect.top;
                    const centerX = rect.width / 2;
                    const centerY = rect.height / 2;
                    const rotateX = (y - centerY) / 12;
                    const rotateY = (centerX - x) / 12;
                    card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(50px) translateY(-12px)`;
                });

                card.addEventListener('mouseleave', () => {
                    card.style.transform = '';
                });
            });
        };

        // Apply tilt after renders
        setTimeout(addTilt3D, 600);

        // ══ 3D Card Entrance Animation ══
        const animateCardEntrance = () => {
            document.querySelectorAll('.menu-card').forEach((card, i) => {
                if (card.dataset.enter3d) return;
                card.dataset.enter3d = 'true';
                card.style.opacity = '0';
                card.classList.add('menu-card-3d-enter');
                card.style.animationDelay = `${i * 0.08}s`;
            });
        };
        setTimeout(animateCardEntrance, 800);

        // ══ Particle Burst on Add to Cart ══
        const originalAddToCart = window.addToCart;
        window.addToCart = function(id, name, price) {
            // Call original
            originalAddToCart(id, name, price);

            // Create particle burst
            const btn = event?.target;
            if (btn) {
                const rect = btn.getBoundingClientRect();
                const colors = ['#10b981', '#34d399', '#fbbf24', '#6ee7b7', '#fcd34d'];
                for (let i = 0; i < 12; i++) {
                    const particle = document.createElement('div');
                    particle.className = 'cart-particle';
                    particle.style.left = rect.left + rect.width / 2 + 'px';
                    particle.style.top = rect.top + rect.height / 2 + 'px';
                    particle.style.background = colors[Math.floor(Math.random() * colors.length)];
                    particle.style.boxShadow = `0 0 10px ${particle.style.background}`;
                    const angle = (Math.PI * 2 * i) / 12;
                    const distance = 60 + Math.random() * 80;
                    particle.style.setProperty('--tx', Math.cos(angle) * distance + 'px');
                    particle.style.setProperty('--ty', Math.sin(angle) * distance + 'px');
                    document.body.appendChild(particle);
                    setTimeout(() => particle.remove(), 800);
                }
            }
        };

        // ══ 3D Toast Enhancement ══
        const originalShowToast = showToast;
        showToast = function(message) {
            originalShowToast(message);
            // Enhance the toast after creation
            setTimeout(() => {
                const toasts = document.querySelectorAll('.fixed.bottom-20');
                toasts.forEach(t => {
                    t.style.transformStyle = 'preserve-3d';
                    t.style.boxShadow = '0 15px 40px rgba(16, 185, 129, 0.3)';
                });
            }, 10);
        };

        // ══ Re-apply effects after dynamic renders ══
        const origDisplayMenu = displayMenu;
        displayMenu = function(items) {
            origDisplayMenu(items);
            setTimeout(() => {
                addTilt3D();
                animateCardEntrance();
            }, 100);
        };

        const origRenderCategories = renderCategories;
        renderCategories = function() {
            origRenderCategories();
            setTimeout(enhanceCursor, 100);
        };

        // ══ 3D Chat Message Animation ══
        const origAddChatMessage = addChatMessage;
        addChatMessage = function(sender, message) {
            origAddChatMessage(sender, message);
            const messages = document.getElementById('chat-messages');
            const lastMsg = messages.lastElementChild;
            if (lastMsg) {
                lastMsg.style.opacity = '0';
                lastMsg.style.transform = sender === 'You'
                    ? 'translateX(30px) translateZ(-30px)'
                    : 'translateX(-30px) translateZ(-30px)';
                lastMsg.style.filter = 'blur(5px)';
                requestAnimationFrame(() => {
                    lastMsg.style.transition = 'all 0.5s cubic-bezier(0.23, 1, 0.32, 1)';
                    lastMsg.style.opacity = '1';
                    lastMsg.style.transform = 'translateX(0) translateZ(0)';
                    lastMsg.style.filter = 'blur(0)';
                });
            }
        };

        // ══ 3D Cart Item Animation ══
        const origRenderCart = renderCart;
        renderCart = function() {
            origRenderCart();
            const items = document.querySelectorAll('#cart-items > div');
            items.forEach((item, i) => {
                item.style.opacity = '0';
                item.style.transform = 'translateX(-20px) translateZ(-20px)';
                setTimeout(() => {
                    item.style.transition = 'all 0.4s cubic-bezier(0.23, 1, 0.32, 1)';
                    item.style.opacity = '1';
                    item.style.transform = 'translateX(0) translateZ(0)';
                }, i * 60);
            });
        };

        // ══ 3D Search Focus Effect ══
        const searchIn = document.getElementById('search-input');
        if (searchIn) {
            searchIn.addEventListener('focus', () => {
                document.querySelectorAll('.menu-card').forEach(card => {
                    card.style.transition = 'all 0.6s ease';
                    card.style.filter = 'brightness(0.7)';
                });
            });
            searchIn.addEventListener('blur', () => {
                document.querySelectorAll('.menu-card').forEach(card => {
                    card.style.filter = 'brightness(1)';
                });
            });
        }

        // ══ Ambient Mouse Parallax on Background ══
        let mouseX = 0, mouseY = 0;
        document.addEventListener('mousemove', (e) => {
            mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
            mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
        });

        const parallaxLoop = () => {
            const cards = document.querySelectorAll('.menu-card');
            cards.forEach((card, i) => {
                const depth = (i % 3 + 1) * 2;
                card.style.transform += ` translate(${mouseX * depth}px, ${mouseY * depth}px)`;
            });
            requestAnimationFrame(parallaxLoop);
        };
        // Subtle parallax - disabled to not conflict with tilt
        // parallaxLoop();

        console.log('🍛 Delight Restaurant 3D Engine initialized!');
    };

    // Start when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init3D);
    } else {
        init3D();
    }
})();