class NoCodeShop {
  constructor() {
    this.config = {};
    this.cart = JSON.parse(localStorage.getItem('nc_cart')) || [];
    this.init();
  }

  async init() {
    try {
      await this.injectDependencies();
      await this.loadConfig();
      this.validateConfig();
      this.initShop();
    } catch (error) {
      this.showFatalError(error);
    }
  }

  async injectDependencies() {
    return new Promise((resolve) => {
      const dependencies = `
        <!-- Bootstrap 5 -->
        <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css" rel="stylesheet">
        <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/js/bootstrap.bundle.min.js"></script>
        
        <!-- Font Awesome -->
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css">
      `;
      
      document.head.insertAdjacentHTML('beforeend', dependencies);
      setTimeout(resolve, 500);
    });
  }

  async loadConfig() {
    const response = await fetch('config.json');
    if(!response.ok) throw new Error('File config.json tidak ditemukan');
    this.config = await response.json();
  }

  validateConfig() {
    if(!this.config.whatsapp) throw new Error('Nomor WhatsApp wajib diisi di config.json');
    if(!this.config.products) throw new Error('Daftar produk wajib diisi di config.json');
  }

  initShop() {
    this.setupTheme();
    this.setupUI();
    this.setupRouter();
    this.updateCart();
  }

  setupTheme() {
    const style = document.createElement('style');
    style.innerHTML = `
      :root {
        --primary: ${this.config.theme?.color || '#2ecc71'};
        --hover: ${this.config.theme?.hover || '#27ae60'};
      }
      
      .btn-primary {
        background: var(--primary)!important;
        border-color: var(--primary)!important;
      }
      
      .btn-primary:hover {
        background: var(--hover)!important;
        border-color: var(--hover)!important;
      }
      
      .navbar { background: var(--primary)!important; }
      
      .card { 
        transition: transform 0.2s; 
        border: 1px solid rgba(0,0,0,0.125);
      }
      
      .card:hover { transform: translateY(-5px); }
      
      footer {
        background: #2c3e50;
        color: #ecf0f1;
        margin-top: 3rem;
      }
      
      .price {
        color: var(--primary);
        font-weight: 600;
        font-size: 1.25rem;
      }
    `;
    document.head.appendChild(style);
  }

  setupUI() {
    document.body.innerHTML = `
      <nav class="navbar navbar-expand-lg navbar-dark shadow-lg">
        <div class="container">
          <a class="navbar-brand" href="#home">
            <i class="fas fa-store me-2"></i>${this.config.storeName || 'Toko Saya'}
          </a>
          <a href="#cart" class="btn btn-light">
            <i class="fas fa-shopping-cart"></i>
            <span class="badge bg-danger ms-2" id="cartCounter">${this.cart.length}</span>
          </a>
        </div>
      </nav>

      <main class="container my-5" id="mainContent"></main>

      <footer class="py-5">
        <div class="container">
          <div class="row g-4">
            <div class="col-md-4 mb-4">
              <h5 class="text-primary mb-3"><i class="fas fa-info-circle me-2"></i>Informasi</h5>
              <ul class="list-unstyled">
                <li><a href="#tentang" class="text-light"><i class="fas fa-chevron-right me-2"></i>Tentang Kami</a></li>
                <li class="mt-2"><a href="#syarat" class="text-light"><i class="fas fa-chevron-right me-2"></i>Syarat & Ketentuan</a></li>
              </ul>
            </div>
            
            <div class="col-md-4 mb-4">
              <h5 class="text-primary mb-3"><i class="fas fa-clock me-2"></i>Jam Operasional</h5>
              <ul class="list-unstyled">
                <li>Senin-Jumat: ${this.config.jamOprasional.seninJumat}</li>
                <li>Sabtu-Minggu: ${this.config.jamOprasional.sabtuMinggu}</li>
              </ul>
            </div>
            
            <div class="col-md-4 mb-4">
              <h5 class="text-primary mb-3"><i class="fas fa-phone me-2"></i>Kontak</h5>
              <ul class="list-unstyled">
                <li>WhatsApp: ${this.config.whatsapp}</li>
                <li class="mt-2">Email: ${this.config.email || 'info@tokoku.com'}</li>
              </ul>
            </div>
          </div>
          <div class="text-center mt-4 pt-3 border-top">
            <small>&copy ${new Date().getFullYear()} ${this.config.storeName || 'Toko Saya'}</small>
          </div>
        </div>
      </footer>
    `;
    
    this.renderPage();
  }

  renderPage() {
  const hash = window.location.hash.substring(1) || 'home';
  const content = document.getElementById('mainContent');

  const pages = {
    home: this.renderHomePage(),
    cart: this.renderCartPage(),
    checkout: this.renderCheckoutPage(),
    tentang: this.renderTentangPage(),
    syarat: this.renderSyaratPage()
  };

  content.innerHTML = pages[hash] || this.render404();
  this.initEventHandlers();
}

  renderHomePage() {
    return `
      <h2 class="mb-4"><i class="fas fa-boxes me-2"></i>${this.config.productsTitle || 'Katalog Produk'}</h2>
      <div class="row g-4">
        ${(this.config.products || []).map(p => `
          <div class="col-md-4">
            <div class="card h-100 shadow">
              <img src="images/${p.image}" 
                class="card-img-top p-2 bg-white rounded" 
                style="height: 200px; object-fit: contain; box-shadow: 0 4px 8px rgba(0,0,0,0.1);" 
                alt="${p.name}"
                onerror="this.src='https://placehold.co/400x200?text=Gambar+Tidak+Tersedia'">
              
              <div class="card-body">
                <h5 class="card-title">${p.name}</h5>
                ${p.description ? `<p class="card-text text-muted">${p.description}</p>` : ''}
                <p class="price">Rp ${this.formatPrice(p.price)}</p>
                ${p.variants ? `
                  <select class="form-select mb-3">
                    ${p.variants.map(v => `<option>${v}</option>`).join('')}
                  </select>
                ` : ''}
                <button class="btn btn-primary w-100 add-to-cart" data-id="${p.id}">
                  <i class="fas fa-cart-plus me-2"></i>Tambah ke Keranjang
                </button>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  renderCartPage() {
    return `
      <div class="row">
        <div class="col-lg-8">
          <h2 class="mb-4"><i class="fas fa-shopping-basket me-2"></i>Keranjang Belanja</h2>
          ${this.cart.length ? this.cart.map(item => `
            <div class="card mb-3 shadow-sm">
              <div class="card-body d-flex justify-content-between align-items-center">
                <div>
                  <h5 class="mb-1">${item.name}</h5>
                  <p class="mb-0 text-muted">Rp ${this.formatPrice(item.price)}</p>
                </div>
                <button class="btn btn-danger btn-sm remove-item" data-id="${item.id}">
                  <i class="fas fa-trash"></i>
                </button>
              </div>
            </div>
          `).join('') : `
            <div class="alert alert-info">
              <i class="fas fa-info-circle me-2"></i>Keranjang belanja kosong
            </div>
          `}
        </div>
        
        <div class="col-lg-4">
          <div class="card shadow-lg sticky-top" style="top: 20px">
            <div class="card-body">
              <h4 class="card-title mb-3"><i class="fas fa-receipt me-2"></i>Ringkasan</h4>
              <div class="d-flex justify-content-between mb-2">
                <span>Total Item:</span>
                <span>${this.cart.length}</span>
              </div>
              <div class="d-flex justify-content-between mb-3">
                <span>Total Harga:</span>
                <span class="price">Rp ${this.formatPrice(this.cartTotal())}</span>
              </div>
              <a href="#checkout" class="btn btn-success w-100">
                <i class="fas fa-wallet me-2"></i>Checkout
              </a>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  renderCheckoutPage() {
    return `
      <div class="row justify-content-center">
        <div class="col-md-8 col-lg-6">
          <div class="card shadow">
            <div class="card-body">
              <h2 class="mb-4 text-center"><i class="fas fa-check-circle me-2"></i>Checkout</h2>
              <form id="checkoutForm">
                <div class="mb-3">
                  <label class="form-label"><i class="fas fa-user me-2"></i>Nama Lengkap</label>
                  <input type="text" name="name" class="form-control" required minlength="3">
                </div>
                
                <div class="mb-3">
                  <label class="form-label"><i class="fas fa-phone me-2"></i>Nomor WhatsApp</label>
                  <input type="tel" name="phone" class="form-control" 
                         pattern="08[0-9]{9,12}" 
                         title="Contoh: 081234567890" 
                         required>
                </div>
                
                <div class="mb-4">
                  <label class="form-label"><i class="fas fa-map-marker-alt me-2"></i>Alamat Pengiriman</label>
                  <textarea name="address" class="form-control" rows="3" required minlength="10"></textarea>
                </div>
                
                <button type="submit" class="btn btn-primary w-100">
                  <i class="fab fa-whatsapp me-2"></i>Kirim Pesanan
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    `;
  }
  
  renderTentangPage() {
  return `
    <div class="card shadow">
      <div class="card-body">
        <h2 class="mb-4 text-primary"><i class="fas fa-info-circle me-2"></i>${this.config.tentangKami.judul}</h2>
        <p>${this.config.tentangKami.deskripsi}</p>
      </div>
    </div>
  `;
}

  renderSyaratPage() {
  const syaratList = this.config.syaratKetentuan.konten.map(item => {
    return `<li>${item}</li>`;
  }).join('');

  return `
    <div class="card shadow">
      <div class="card-body">
        <h2 class="mb-4 text-primary"><i class="fas fa-file-contract me-2"></i>${this.config.syaratKetentuan.judul}</h2>
        <ul>${syaratList}</ul>
      </div>
    </div>
  `;
}

  processCheckout(formData) {
    const data = {
      name: formData.get('name') || 'Tidak diisi',
      phone: formData.get('phone') || 'Tidak diisi',
      address: formData.get('address') || 'Tidak diisi',
      items: this.cart,
      total: this.cartTotal()
    };

    const itemsList = data.items.map((i, index) => 
      `${index + 1}. ${i.name}${i.variant ? ` (${i.variant})` : ''} - Rp ${this.formatPrice(i.price)}`
    ).join('%0A');

    const message = `
📦 *Pesanan Baru dari ${this.config.storeName || 'Toko Online'}!*

🛍️ *Produk Dipesan:*
${itemsList}

💰 *Total Pembayaran:* Rp ${this.formatPrice(data.total)}

📇 *Data Pembeli:*
• Nama: ${data.name}
• WhatsApp: ${data.phone}
• Alamat:
${data.address}

_**Pesanan ini dikirim otomatis dari website toko.**_
`.trim();

    const whatsapp = this.config.whatsapp.replace(/[^0-9]/g, '');
    window.location.href = `https://wa.me/${whatsapp}?text=${encodeURIComponent(message)}`;
    this.clearCart();
  }

  // Helper Methods
  formatPrice(price) {
    return new Intl.NumberFormat('id-ID').format(price);
  }

  cartTotal() { return this.cart.reduce((sum, item) => sum + item.price, 0); }
  clearCart() { this.cart = []; this.saveCart(); this.updateCart(); }
  saveCart() { localStorage.setItem('nc_cart', JSON.stringify(this.cart)); }
  updateCart() { document.getElementById('cartCounter').textContent = this.cart.length; }
  setupRouter() { window.addEventListener('hashchange', () => this.renderPage()); }

  initEventHandlers() {
    // Add to Cart
    document.querySelectorAll('.add-to-cart').forEach(btn => {
      btn.addEventListener('click', () => {
        const product = this.config.products.find(p => p.id == btn.dataset.id);
        if(product) {
          this.cart.push({
            ...product,
            cartId: Date.now(),
            variant: btn.closest('.card-body').querySelector('select')?.value || null
          });
          this.saveCart();
          this.updateCart();
        }
      });
    });

    // Remove from Cart
    document.querySelectorAll('.remove-item').forEach(btn => {
      btn.addEventListener('click', () => {
        this.cart = this.cart.filter(item => item.id != btn.dataset.id);
        this.saveCart();
        this.renderPage();
      });
    });

    // Checkout Form
    document.getElementById('checkoutForm')?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.processCheckout(new FormData(e.target));
    });
  }

  render404() {
    return `
      <div class="text-center py-5">
        <h1 class="display-1 text-muted">404</h1>
        <p class="lead">Halaman tidak ditemukan</p>
        <a href="#home" class="btn btn-primary mt-3">
          <i class="fas fa-home me-2"></i>Kembali ke Beranda
        </a>
      </div>
    `;
  }

  showFatalError(error) {
    document.body.innerHTML = `
      <div class="container mt-5">
        <div class="alert alert-danger">
          <h4><i class="fas fa-exclamation-triangle me-2"></i>Kesalahan Sistem</h4>
          <p>${error.message}</p>
          <button class="btn btn-outline-danger mt-3" onclick="location.reload()">
            <i class="fas fa-sync me-2"></i>Coba Lagi
          </button>
        </div>
      </div>
    `;
  }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => new NoCodeShop());

// Export untuk penggunaan module
if (typeof module !== 'undefined' && module.exports) {
  module.exports = NoCodeShop;
} else if (typeof window !== 'undefined') {
  window.NoCodeShop = NoCodeShop;
}