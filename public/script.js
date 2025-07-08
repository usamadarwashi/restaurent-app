
// عناصر الـ DOM
const productsGrid = document.getElementById('products-grid');
const cartItemsContainer = document.getElementById('cart-items');
const cartTotalSpan = document.getElementById('cart-total');
const finishOrderBtn = document.getElementById('finish-order-btn');
const cancelOrderBtn = document.getElementById('cancel-order-btn');
const previousOrdersList = document.getElementById('previous-orders-list');
const receiptModal = document.getElementById('receipt-modal');
const receiptContent = document.getElementById('receipt-content');
const closeReceiptBtn = receiptModal.querySelector('.close-button');
const printReceiptBtn = document.getElementById('print-receipt-btn');
const dailySalesTotalSpan = document.getElementById('daily-sales-total');
const dailyOrdersCountSpan = document.getElementById('daily-orders-count');


// عناصر الآلة الحاسبة
const calculatorDisplay = document.getElementById('calculator-display');
const calculatorButtons = document.querySelector('.calculator-buttons');

// عناصر إدارة الأصناف
const addProductBtn = document.getElementById('add-product-btn');
const productManagementForm = document.getElementById('product-management-form');
const productIdInput = document.getElementById('product-id-input');
const productNameInput = document.getElementById('product-name-input');
const productPriceInput = document.getElementById('product-price-input');
const productImageInput = document.getElementById('product-image-input');
const saveProductBtn = document.getElementById('save-product-btn');
const cancelProductEditBtn = document.getElementById('cancel-product-edit-btn');
const currentProductsList = document.getElementById('current-products-list');

// عناصر التنقل السريع
const navButtons = document.querySelectorAll('.nav-button');
const viewSections = document.querySelectorAll('.view-section');

// Add date picker functionality
const datePicker = document.getElementById('report-date');
const loadReportBtn = document.getElementById('load-report-btn');
const reportTotalSales = document.getElementById('report-total-sales');
const reportOrdersCount = document.getElementById('report-orders-count');

// متغيرات الآلة الحاسبة
let currentInput = '0';
let firstOperand = null;
let operator = null;
let waitingForSecondOperand = false;
let reports = [];


// --- تحميل الأصناف من ملف CSV عند تحميل الصفحة ---
let products = [];
let cart = []; // السلة الحالية
let previousOrders = []; // لتخزين الطلبات السابقة في الذاكرة (مؤقتًا)
let dailySalesTotal = 0;
let dailyOrdersCount = 0;
let orderCounter = 0; // لإنشاء أرقام طلبات فريدة


// Function to load products from CSV
async function loadProductsFromCSV() {
    try {
        const response = await fetch('products.csv');
        if (!response.ok) {
            throw new Error('Failed to load products CSV');
        }
        const csvData = await response.text();
        return parseCSV(csvData);
    } catch (error) {
        console.error('Error loading products:', error);
    }
}

// Function to load previous orders from the server
async function loadOrdersFromCSV() {
    try {
        const response = await fetch('/api/orders');
        if (!response.ok) throw new Error('Failed to fetch orders');
        const data = await response.json();
        return data.orders || [];
    } catch (error) {
        console.error('Error loading orders:', error);
        return [];
    }
}

async function loadProductsFromCSV() {
    try {
        const response = await fetch('/api/products');
        if (!response.ok) throw new Error('Failed to fetch CSV');
        const csvData = await response.text();
        return parseCSV(csvData);
    } catch (err) {
        console.error('Error loading products:', err);
    }
}

// Function to parse CSV data
function parseCSV(csvData) {
    const lines = csvData.split('\n');
    const products = [];
    
    // Skip header row if exists
    const startLine = lines[0].includes('id,name,price,image') ? 1 : 0;
    
    for (let i = startLine; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line) {
            const [id, name, price, image] = line.split(',');
            products.push({
                id: parseInt(id),
                name: name.trim(),
                price: parseFloat(price),
                image: image.trim()
            });
        }
    }
    return products;
}

// وظيفة لعرض الأصناف
function displayProducts() {
    productsGrid.innerHTML = '';
    products.forEach(product => {
        const productItem = document.createElement('div');
        productItem.classList.add('product-item');
        productItem.innerHTML = `
            <div class="product-image">
                <img src="${product.image}" alt="${product.name}" class="product-img">
            </div>
            <div class="product-name">${product.name}</div>
            <div class="product-price">${product.price.toFixed(2)} د.ل</div>
            <input type="number" value="1" min="1" class="quantity-input" id="qty-${product.id}">
            <button class="add-to-cart-btn" data-product-id="${product.id}">أضف</button>
        `;
        productsGrid.appendChild(productItem);
    });

    document.querySelectorAll('.add-to-cart-btn').forEach(button => {
        button.addEventListener('click', (event) => {
            const productId = parseInt(event.target.dataset.productId);
            const quantityInput = document.getElementById(`qty-${productId}`);
            const quantity = parseInt(quantityInput.value);
            if (isNaN(quantity) || quantity <= 0) {
                alert('الرجاء إدخال كمية صحيحة.');
                return;
            }
            addToCart(productId, quantity);
            quantityInput.value = 1;
        });
    });
}

// وظيفة لإضافة صنف إلى السلة
function addToCart(productId, quantity) {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    const existingCartItem = cart.find(item => item.id === productId);

    if (existingCartItem) {
        existingCartItem.quantity += quantity;
    } else {
        cart.push({
            id: product.id,
            name: product.name,
            price: product.price,
            quantity: quantity
        });
    }
    updateCartDisplay();
}

// وظيفة لإزالة صنف من السلة
function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    updateCartDisplay();
}

// وظيفة لتحديث عرض السلة
function updateCartDisplay() {
    cartItemsContainer.innerHTML = '';
    let total = 0;

    if (cart.length === 0) {
        cartItemsContainer.innerHTML = '<p>السلة فارغة.</p>';
        cartTotalSpan.textContent = '0.00';
        return;
    }

    cart.forEach(item => {
        const itemTotal = item.price * item.quantity;
        total += itemTotal;

        const cartItemDiv = document.createElement('div');
        cartItemDiv.classList.add('cart-item');
        cartItemDiv.innerHTML = `
            <div class="cart-item-info">
                <span class="cart-item-name">${item.name}</span>
                <span class="cart-item-qty">x${item.quantity}</span>
                <span class="cart-item-price">${item.price.toFixed(2)} د.ل</span>
            </div>
            <span>${itemTotal.toFixed(2)} د.ل</span>
            <button class="cart-item-remove" data-product-id="${item.id}">إزالة</button>
        `;
        cartItemsContainer.appendChild(cartItemDiv);
    });

    cartTotalSpan.textContent = total.toFixed(2);

    document.querySelectorAll('.cart-item-remove').forEach(button => {
        button.addEventListener('click', (event) => {
            const productId = parseInt(event.target.dataset.productId);
            removeFromCart(productId);
        });
    });
}

function displayDailySummaryFromOrders() {
    const dateMap = {};

    previousOrders.forEach(order => {
        if (!dateMap[order.date]) {
            dateMap[order.date] = [];
        }
        dateMap[order.date].push(order);
    });

    const dailyDatesList = document.getElementById('daily-dates-list');
    const dailyOrdersList = document.getElementById('daily-orders-list');

    dailyDatesList.innerHTML = '';
    dailyOrdersList.innerHTML = '';

    const sortedDates = Object.keys(dateMap).sort((a, b) => {
        // Sort by date descending (newest first)
        const [d1, m1, y1] = a.split('/').map(Number);
        const [d2, m2, y2] = b.split('/').map(Number);
        return new Date(y2, m2 - 1, d2) - new Date(y1, m1 - 1, d1);
    });

    sortedDates.forEach(date => {
        const btn = document.createElement('button');
        btn.classList.add('action-button');
        btn.textContent = `📅 ${date} (${dateMap[date].length} طلب)`;
        btn.addEventListener('click', () => {
            displayOrdersForDay(dateMap[date], date);
        });
        dailyDatesList.appendChild(btn);
    });
}

function displayOrdersForDay(orders, date) {
    const container = document.getElementById('daily-orders-list');
    container.innerHTML = `<h3>الطلبات بتاريخ: ${date}</h3>`;

    if (orders.length === 0) {
        container.innerHTML += '<p>لا توجد طلبات لهذا اليوم.</p>';
        return;
    }
    let totalForDay = 0;
    orders.forEach(order => {
        const div = document.createElement('div');
        div.classList.add('previous-order-card');
        div.innerHTML = `
            <div class="order-header">
                <h3>طلب رقم: #${order.orderNumber}</h3>
                <span>${order.dateTime}</span>
            </div>
            <div class="order-details">
                <p><strong>الإجمالي:</strong> ${order.total.toFixed(2)} د.ل</p>
                ${order.notes ? `<p><strong>ملاحظات:</strong> ${order.notes}</p>` : ''}
            </div>
            <div class="order-items-list">
                <p><strong>الأصناف:</strong></p>
                ${order.items.map(i => `<p>- ${i.name} x${i.quantity} (${(i.price * i.quantity).toFixed(2)} د.ل)</p>`).join('')}
            </div>
        `;
        container.appendChild(div);
    });

}
// وظيفة لتحديث عرض الطلبات السابقة (لعرض طلبات اليوم فقط)
function displayPreviousOrders() {
    previousOrdersList.innerHTML = '';

    const today = new Date();
    const todayStr = today.toLocaleDateString('en-EG', { day: '2-digit', month: '2-digit', year: 'numeric' });

    const todayOrders = previousOrders.filter(order => order.date === todayStr);

    if (todayOrders.length === 0) {
        previousOrdersList.innerHTML = '<p>لا توجد طلبات اليوم.</p>';
        return;
    }

    todayOrders.slice().reverse().forEach(order => {
        const orderCard = document.createElement('div');
        orderCard.classList.add('previous-order-card');
        orderCard.innerHTML = `
            <div class="order-header">
                <h3>طلب رقم: #${order.orderNumber}</h3>
                <span>${order.dateTime}</span>
            </div>
            <div class="order-details">
                <p><strong>الإجمالي:</strong> ${order.total.toFixed(2)} د.ل</p>
                ${order.notes ? `<p><strong>ملاحظات:</strong> ${order.notes}</p>` : ''}
            </div>
            <div class="order-items-list">
                <p><strong>الأصناف:</strong></p>
                ${order.items.map(item => `<p>- ${item.name} x${item.quantity} (${(item.price * item.quantity).toFixed(2)} د.ل)</p>`).join('')}
            </div>
            <div class="order-actions">
                <button class="delete-order-btn" data-order-number="${order.orderNumber}">حذف</button>
            </div>
        `;
        previousOrdersList.appendChild(orderCard);

        orderCard.querySelector('.delete-order-btn').addEventListener('click', async (e) => {
            const number = parseInt(e.target.dataset.orderNumber);
            const orderToDelete = previousOrders.find(o => o.orderNumber === number); // Add this line
            
            if (confirm(`هل تريد حذف الطلب رقم ${number}؟`)) {
                previousOrders = previousOrders.filter(o => o.orderNumber !== number);
                await saveOrdersToCSV(previousOrders);
                
                // Add this to update report:
                await updateReportForDate(orderToDelete.date, -orderToDelete.total, -1);
                
                displayPreviousOrders();
                updateDailySummary();
                alert(`تم حذف الطلب رقم ${number}`);
            }
        });
    });
}

async function updateReportForDate(date, salesDelta, countDelta) {
    try {
        // Find existing report for date
        const existingReport = reports.find(r => r.date === date);
        let newTotal = salesDelta;
        let newCount = countDelta;
        
        if (existingReport) {
            newTotal = existingReport.totalSales + salesDelta;
            newCount = existingReport.ordersCount + countDelta;
        }
        
        // Update server
        const response = await fetch('/api/reports/update', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                date, 
                totalSales: newTotal, 
                ordersCount: newCount 
            })
        });
        
        if (!response.ok) throw new Error('Failed to update report');
        
        // Update local reports array
        if (existingReport) {
            existingReport.totalSales = newTotal;
            existingReport.ordersCount = newCount;
        } else {
            reports.push({ 
                date, 
                totalSales: newTotal, 
                ordersCount: newCount 
            });
        }
        
        // Update UI if viewing today's report
        const today = new Date();
        const todayStr = today.toLocaleDateString('en-EG', { 
            day: '2-digit', 
            month: '2-digit', 
            year: 'numeric' 
        });
        
        if (date === todayStr) {
            updateDailySummary();
        }
    } catch (err) {
        console.error('Error updating report:', err);
    }
}
// وظيفة لتحديث إحصائيات المبيعات اليومية
function updateDailySummary() {
    const today = new Date();
    const todayStr = today.toLocaleDateString('en-EG', { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric' 
    });
    
    const todayReport = reports.find(r => r.date === todayStr) || {
        totalSales: 0,
        ordersCount: 0
    };
    
    dailySalesTotalSpan.textContent = todayReport.totalSales.toFixed(2);
    dailyOrdersCountSpan.textContent = todayReport.ordersCount;
}

// وظيفة لإنشاء إيصال
function generateReceipt(order) {
    let receiptText = `
${' '.repeat(Math.max(0, (30 - 'اسم المطعم: مطعم الأمل'.length) / 2))}اسم المطعم: مطعم الأمل
${'='.repeat(30)}
رقم الطلب: #${order.orderNumber}
التاريخ: ${order.date}
الوقت: ${order.time}
${'='.repeat(30)}
الأصناف:
`;

    order.items.forEach(item => {
        const itemLine = `${item.name} x${item.quantity} (${(item.price * item.quantity).toFixed(2)} د.ل)`;
        receiptText += itemLine + '\n';
    });

    receiptText += `${'='.repeat(30)}
الإجمالي: ${order.total.toFixed(2)} د.ل
${'='.repeat(30)}
`;
    if (order.notes) {
        receiptText += `ملاحظات: ${order.notes}\n`;
    }
    receiptText += `${'='.repeat(30)}\n
    شكرًا لزيارتكم!
    `;
    return receiptText;
}

// وظيفة إنهاء الطلب
finishOrderBtn.addEventListener('click', async () => {
    if (cart.length === 0) {
        alert('السلة فارغة. يرجى إضافة أصناف أولاً.');
        return;
    }

    
    const totalAmount = parseFloat(cartTotalSpan.textContent);

    orderCounter++;
    const now = new Date();
    const orderDate = now.toLocaleDateString('en-EG', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const orderTime = now.toLocaleTimeString('en-EG', { hour: '2-digit', minute: '2-digit', hour12: true });

    const newOrder = {
        orderNumber: orderCounter,
        items: [...cart],
        total: totalAmount,
        notes: '',
        date: orderDate,
        time: orderTime,
        dateTime: `${orderDate} ${orderTime}`
    };


    previousOrders.push(newOrder);
    await updateReportForDate(orderDate, totalAmount, 1);

    // dailySalesTotal += totalAmount;
    // dailyOrdersCount++;

    await appendOrderToCSV(newOrder);

    await saveOrdersToCSV(previousOrders); // ✅ Save orders after adding the new one

    displayPreviousOrders();
    updateDailySummary();

    const receipt = generateReceipt(newOrder);
    receiptContent.textContent = receipt;
    receiptModal.style.display = 'flex';

    cart = [];
    updateCartDisplay();
    alert(`تم إنهاء الطلب رقم #${newOrder.orderNumber} بنجاح!`);
});

// وظيفة إلغاء الطلب
cancelOrderBtn.addEventListener('click', () => {
    if (confirm('هل أنت متأكد من إلغاء الطلب الحالي؟ سيتم مسح السلة.')) {
        cart = [];
        updateCartDisplay();
        alert('تم إلغاء الطلب والسلة فارغة.');
    }
});

// وظيفة لطباعة الإيصال
printReceiptBtn.addEventListener('click', () => {
    const printContent = document.getElementById('receipt-content').innerHTML;
    const originalBody = document.body.innerHTML;

    const printWindow = window.open('', '_blank', 'height=600,width=800');
    printWindow.document.write('<html><head><title>إيصال المبيعات</title>');
    printWindow.document.write('<style>');
    printWindow.document.write(`
        body { font-family: 'Consolas', 'Courier New', monospace; text-align: center; margin: 20px; direction: rtl; }
        pre { text-align: right; white-space: pre-wrap; font-size: 1.2em; line-height: 1.6;}
    `);
    printWindow.document.write('</style></head><body>');
    printWindow.document.write('<pre>' + printContent + '</pre>');
    printWindow.document.close();
    printWindow.print();
});

// إغلاق نافذة الإيصال المنبثقة
closeReceiptBtn.addEventListener('click', () => {
    receiptModal.style.display = 'none';
});

// إغلاق النافذة عند النقر خارجها
window.addEventListener('click', (event) => {
    if (event.target === receiptModal) {
        receiptModal.style.display = 'none';
    }
});

// --- وظائف التنقل بين الواجهات ---
navButtons.forEach(button => {
    button.addEventListener('click', () => {
        navButtons.forEach(btn => btn.classList.remove('active'));
        viewSections.forEach(section => {
            section.classList.remove('active');
            section.style.display = 'none';
        });

        button.classList.add('active');
        const targetViewId = button.dataset.target;
        const targetView = document.getElementById(targetViewId);
        if (targetView) {
            targetView.classList.add('active');
            targetView.style.display = 'flex';
        }

        if (targetViewId === 'previous-orders-view') {
            displayPreviousOrders();
        }
        if (targetViewId === 'manage-products-view') {
            displayManageProductsView();
        }
        if (targetViewId === 'daily-summary-view') {
    displayDailySummaryFromOrders();
}

    });
});


// --- وظائف إدارة الأصناف ---
function displayManageProductsView() {
    currentProductsList.innerHTML = '';
    products.forEach(product => {
        const productListItem = document.createElement('div');
        productListItem.classList.add('product-list-item');
        productListItem.innerHTML = `
            <span>ID: ${product.id} | ${product.name} - ${product.price.toFixed(2)} د.ل</span>
            <div class="actions">
                <button class="edit-product-btn" data-product-id="${product.id}">تعديل</button>
                <button class="delete-product-btn" data-product-id="${product.id}">حذف</button>
            </div>
        `;
        currentProductsList.appendChild(productListItem);
    });

    document.querySelectorAll('.edit-product-btn').forEach(button => {
        button.addEventListener('click', (event) => {
            const productId = parseInt(event.target.dataset.productId);
            editProduct(productId);
        });
    });

    document.querySelectorAll('.delete-product-btn').forEach(button => {
        button.addEventListener('click', (event) => {
            const productId = parseInt(event.target.dataset.productId);
            deleteProduct(productId);
        });
    });

    productManagementForm.classList.add('hidden');
    productIdInput.value = '';
    productNameInput.value = '';
    productPriceInput.value = '';
    productImageInput.value = '';
}

addProductBtn.addEventListener('click', () => {
    productManagementForm.classList.remove('hidden');
    productIdInput.value = '';
    productNameInput.value = '';
    productPriceInput.value = '';
    productImageInput.value = '';
});

cancelProductEditBtn.addEventListener('click', () => {
    productManagementForm.classList.add('hidden');
});

// --- حفظ الأصناف للداتابيس---
async function saveProductsToCSV(products) {
    try {
        let csvContent = "id,name,price,image\n";
        products.forEach(product => {
            csvContent += `${product.id},${product.name},${product.price},${product.image}\n`;
        });

        const response = await fetch('/api/products', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ csv: csvContent })
        });

        if (!response.ok) throw new Error('Failed to save CSV');
        return true;
    } catch (error) {
        console.error('Error saving products:', error);
        return false;
    }
}

// وظيفة حفظ أو تعديل صنف
saveProductBtn.addEventListener('click', async () => {
    const id = productIdInput.value ? parseInt(productIdInput.value) : null;
    const name = productNameInput.value.trim();
    const price = parseFloat(productPriceInput.value);
    const imagePath = productImageInput.value.trim();

    if (!name || isNaN(price) || price < 0) {
        alert('يرجى إدخال اسم وسعر صحيحين للصنف. السعر لا يمكن أن يكون سالباً.');
        return;
    }

    if (id) {
        const productIndex = products.findIndex(p => p.id === id);
        if (productIndex !== -1) {
            products[productIndex].name = name;
            products[productIndex].price = price;
            if (imagePath) {
                products[productIndex].image = imagePath;
            } else if (!products[productIndex].image) {
                products[productIndex].image = 'images/default-item.png';
            }
            alert('تم تعديل الصنف بنجاح!');
        } else {
            alert('لم يتم العثور على صنف بهذا المعرف.');
            return;
        }
    } else {
        const newId = products.length > 0 ? Math.max(...products.map(p => p.id)) + 1 : 1;
        const finalImagePath = imagePath || 'images/default-item.png';
        products.push({ id: newId, name: name, price: price, image: finalImagePath });
        alert('تم إضافة صنف جديد بنجاح!');
    }

    // Save the updated products to CSV
    const success = await saveProductsToCSV(products);
    if (!success) {
        alert('تم حفظ التغييرات مؤقتاً، لكن هناك مشكلة في حفظها بشكل دائم.');
    }

    productManagementForm.classList.add('hidden');
    displayManageProductsView();
    displayProducts();
});

// وظيفة تعديل صنف
function editProduct(id) {
    const product = products.find(p => p.id === id);
    if (product) {
        productManagementForm.classList.remove('hidden');
        productIdInput.value = product.id;
        productNameInput.value = product.name;
        productPriceInput.value = product.price;
        productImageInput.value = product.image || '';
    }
}

// وظيفة حذف صنف
async function deleteProduct(id) {
    if (confirm(`هل أنت متأكد من حذف الصنف ذو المعرف ${id}؟`)) {
        products = products.filter(p => p.id !== id);
        const success = await saveProductsToCSV(products);
        if (!success) {
            alert('تم حذف الصنف مؤقتاً، لكن هناك مشكلة في حفظ التغيير بشكل دائم.');
        }
        alert('تم حذف الصنف بنجاح!');
        displayManageProductsView();
        displayProducts();
    }
}

// وظيفة لإضافة طلب إلى ملف CSV
async function appendOrderToCSV(order) {
    try {
        const response = await fetch('/api/orders/append', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ order })
        });
        if (!response.ok) throw new Error('Failed to append order');
    } catch (err) {
        console.error('Error appending order:', err);
    }
}

loadReportBtn.addEventListener('click', () => {
    const selectedDate = new Date(datePicker.value);
    if (isNaN(selectedDate)) {
        alert('الرجاء اختيار تاريخ صحيح');
        return;
    }
    
    const dateStr = selectedDate.toLocaleDateString('en-EG', { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric' 
    });
    
    const report = reports.find(r => r.date === dateStr);
    
    if (report) {
        reportTotalSales.textContent = report.totalSales.toFixed(2);
        reportOrdersCount.textContent = report.ordersCount;
    } else {
        reportTotalSales.textContent = '0.00';
        reportOrdersCount.textContent = '0';
        alert('لا توجد بيانات لهذا التاريخ');
    }
});


function ordersToCSV(orders) {
    const header = 'orderNumber,date,time,total,notes,items\n';
    const rows = orders.map(order => {
        const itemsStr = order.items.map(i => `${i.name} x${i.quantity} (${i.price})`).join('|');
        return `${order.orderNumber},${order.date},${order.time},${order.total},${order.notes || ''},"${itemsStr}"`;
    });
    return header + rows.join('\n');
}

async function saveOrdersToCSV(orders) {
    try {
        const csv = ordersToCSV(orders);
        const response = await fetch('/api/orders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ csv })
        });
        if (!response.ok) throw new Error('Failed to save orders');
    } catch (err) {
        console.error('Save order error:', err);
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    try {
        products = await loadProductsFromCSV();
        if (!products || products.length === 0) {
            console.warn('No products loaded');
        }

        previousOrders = await loadOrdersFromCSV(); // ✅ Load existing orders
        if (previousOrders.length > 0) {
            orderCounter = Math.max(...previousOrders.map(o => o.orderNumber));
        }
        await loadReportsFromServer();

        displayProducts();
        updateCartDisplay();
        updateDailySummary(); // so count & sales show
        displayPreviousOrders(); // optional
    } catch (error) {
        console.error('Initialization error:', error);
    }
});

async function loadReportsFromServer() {
    try {
        const response = await fetch('/api/reports');
        if (!response.ok) throw new Error('Failed to load reports');
        const data = await response.json();
        reports = data.reports || [];
        
        // Add this to update UI after loading reports
        updateDailySummary(); 
    } catch (err) {
        console.error('Error loading reports:', err);
    }
}

// --- وظائف الآلة الحاسبة -------------------------------------------------
function updateCalculatorDisplay() {
    calculatorDisplay.value = currentInput;
}
// --- وظائف الآلة الحاسبة ---
calculatorButtons.addEventListener('click', (event) => {
    const { target } = event;
    if (!target.matches('button')) return;

    const value = target.dataset.value;

    if (target.classList.contains('operator')) {
        handleOperator(value);
        updateCalculatorDisplay();
        return;
    }

    if (target.classList.contains('equals')) {
        performCalculation();
        updateCalculatorDisplay();
        return;
    }

    if (target.classList.contains('clear')) {
        resetCalculator();
        updateCalculatorDisplay();
        return;
    }

    if (target.classList.contains('backspace')) {
        backspace();
        updateCalculatorDisplay();
        return;
    }

    if (value === '.') {
        inputDecimal(value);
    } else {
        inputDigit(value);
    }
    updateCalculatorDisplay();
});
// --- وظائف الآلة الحاسبة ---
function inputDigit(digit) {
    if (waitingForSecondOperand === true) {
        currentInput = digit;
        waitingForSecondOperand = false;
    } else {
        currentInput = currentInput === '0' ? digit : currentInput + digit;
    }
}
// --- وظائف الآلة الحاسبة ---
function inputDecimal(dot) {
    if (waitingForSecondOperand === true) {
        currentInput = '0.';
        waitingForSecondOperand = false;
        return;
    }
    if (!currentInput.includes(dot)) {
        currentInput += dot;
    }
}
// --- وظائف الآلة الحاسبة ---
function handleOperator(nextOperator) {
    const inputValue = parseFloat(currentInput);

    if (firstOperand === null && !isNaN(inputValue)) {
        firstOperand = inputValue;
    } else if (operator) {
        if (waitingForSecondOperand) {
            operator = nextOperator;
            return;
        }
        const result = operate(firstOperand, inputValue, operator);
        currentInput = `${parseFloat(result.toFixed(7))}`;
        firstOperand = result;
    }

    waitingForSecondOperand = true;
    operator = nextOperator;
}
// --- وظائف الآلة الحاسبة ---
function performCalculation() {
    if (firstOperand === null || operator === null) {
        return;
    }

    let inputValue = parseFloat(currentInput);
    if (waitingForSecondOperand) {
        inputValue = firstOperand;
    }

    const result = operate(firstOperand, inputValue, operator);
    currentInput = `${parseFloat(result.toFixed(7))}`;
    firstOperand = null;
    operator = null;
    waitingForSecondOperand = false;
}
// --- وظائف الآلة الحاسبة ---
function operate(operand1, operand2, op) {
    switch (op) {
        case '+': return operand1 + operand2;
        case '-': return operand1 - operand2;
        case '*': return operand1 * operand2;
        case '/':
            if (operand2 === 0) {
                alert("لا يمكن القسمة على صفر!");
                return 0;
            }
            return operand1 / operand2;
        default: return operand2;
    }
}
// --- وظائف الآلة الحاسبة ---
function resetCalculator() {
    currentInput = '0';
    firstOperand = null;
    operator = null;
    waitingForSecondOperand = false;
}
// --- وظائف الآلة الحاسبة ---
function backspace() {
    if (waitingForSecondOperand) return;

    currentInput = currentInput.slice(0, -1);
    if (currentInput === '' || currentInput === '-') {
        currentInput = '0';
    }
}