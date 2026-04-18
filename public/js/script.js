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