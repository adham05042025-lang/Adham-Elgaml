// ============================================
// 🔥 SUPABASE CONFIG - ADHAM ELGAML
// ============================================
const SUPABASE_URL = 'https://rciswlelqiuxklffoals.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJjaXN3bGVscWl1eGtsZmZvYWxzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgyMDg4MzYsImV4cCI6MjEwMzc4NDgzNn0.LyhbehrOo2jTFjz14QGUaEtErbpKW9FtUtRKfQqqxYw';

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ===== LOADING SCREEN =====
let progress = 0;
const interval = setInterval(function() {
    progress += Math.floor(Math.random() * 12) + 3;
    if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        setTimeout(function() {
            document.getElementById('loadingScreen').classList.add('hidden');
        }, 500);
    }
    document.getElementById('progressFill').style.width = progress + '%';
    document.getElementById('progressText').textContent = progress + '%';
}, 150);

// ===== المتغيرات =====
let videos = [];
let currentCategory = 'all';
let currentPage = 1;
const videosPerPage = 4;
const grid = document.getElementById('videosGrid');
const filterBtns = document.querySelectorAll('.filter-btn');

// ===== تحميل الفيديوهات من Supabase =====
async function loadVideos() {
    try {
        const { data, error } = await supabaseClient
            .from('videos')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.log('⚠️ Supabase error:', error.message);
            return [];
        }
        
        if (data && data.length > 0) {
            console.log('✅ Loaded ' + data.length + ' videos from Supabase');
            return data;
        }
        
        console.log('ℹ️ No videos found. Add your first video!');
        return [];
    } catch (err) {
        console.log('⚠️ Connection error:', err.message);
        return [];
    }
}

// ===== عرض الفيديوهات مع Pagination =====
function renderVideos() {
    // تصفية الفيديوهات حسب التصنيف
    let filtered = videos;
    
    if (currentCategory !== 'all') {
        filtered = videos.filter(function(v) {
            return v.category === currentCategory;
        });
    }

    // حساب عدد الصفحات
    const totalPages = Math.ceil(filtered.length / videosPerPage);
    if (currentPage > totalPages) currentPage = totalPages || 1;
    
    // جلب فيديوهات الصفحة الحالية
    const startIndex = (currentPage - 1) * videosPerPage;
    const endIndex = startIndex + videosPerPage;
    const pageVideos = filtered.slice(startIndex, endIndex);

    // عرض الفيديوهات
    if (filtered.length === 0) {
        grid.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 60px 20px; color: #888;">
                <i class="fas fa-video-slash" style="font-size: 50px; margin-bottom: 20px; display: block; color: #E62429;"></i>
                <h3 style="color: #FFD700; margin-bottom: 10px;">No Videos Yet</h3>
                <p>${currentCategory !== 'all' ? 'No videos in this category' : 'Check back soon for new content'}</p>
            </div>
        `;
        return;
    }

    // بناء بطاقات الفيديوهات
    let videosHTML = pageVideos.map(function(video) {
        return `
            <div class="video-card" onclick="playVideo('${video.url}', '${video.title}')">
                <div class="video-thumbnail">
                    <img src="${video.thumbnail}" alt="${video.title}" />
                    <div class="play-icon"><i class="fas fa-play-circle"></i></div>
                    <span class="category-tag">${video.category}</span>
                </div>
                <div class="video-info">
                    <h4>${video.title}</h4>
                    <p>${video.description || 'No description'}</p>
                </div>
            </div>
        `;
    }).join('');

    // بناء أزرار الترقيم
    let paginationHTML = '';
    if (totalPages > 1) {
        paginationHTML = `
            <div class="pagination">
                ${currentPage > 1 ? `<button class="page-btn" onclick="goToPage(${currentPage - 1})">‹</button>` : ''}
                ${Array.from({length: totalPages}, function(_, i) {
                    const pageNum = i + 1;
                    return `<button class="page-btn ${pageNum === currentPage ? 'active' : ''}" onclick="goToPage(${pageNum})">${pageNum}</button>`;
                }).join('')}
                ${currentPage < totalPages ? `<button class="page-btn" onclick="goToPage(${currentPage + 1})">›</button>` : ''}
            </div>
        `;
    }

    grid.innerHTML = videosHTML + paginationHTML;
}

// ===== الانتقال إلى صفحة معينة =====
function goToPage(page) {
    currentPage = page;
    renderVideos();
    // تمرير إلى أعلى القسم
    document.getElementById('showreel').scrollIntoView({ behavior: 'smooth' });
}

// ===== التصفية حسب التصنيف =====
filterBtns.forEach(function(btn) {
    btn.addEventListener('click', function() {
        filterBtns.forEach(function(b) {
            b.classList.remove('active');
        });
        this.classList.add('active');
        currentCategory = this.dataset.category;
        currentPage = 1; // العودة للصفحة الأولى عند تغيير التصنيف
        renderVideos();
    });
});

// ===== تشغيل الفيديو =====
function playVideo(url, title) {
    const modal = document.getElementById('videoModal');
    const iframe = document.getElementById('videoIframe');
    const modalTitle = document.getElementById('videoModalTitle');
    
    modalTitle.textContent = '▶️ ' + title;
    iframe.src = url;
    modal.classList.add('active');
}

// ===== إغلاق مودال الفيديو =====
document.getElementById('closeVideoModal').addEventListener('click', function() {
    const modal = document.getElementById('videoModal');
    const iframe = document.getElementById('videoIframe');
    modal.classList.remove('active');
    iframe.src = '';
});

// ===== إغلاق المودال عند الضغط خارج المحتوى =====
window.addEventListener('click', function(e) {
    if (e.target.classList.contains('modal')) {
        const modal = document.getElementById('videoModal');
        const iframe = document.getElementById('videoIframe');
        modal.classList.remove('active');
        iframe.src = '';
    }
});

// ===== اختصار ESC =====
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        const modal = document.getElementById('videoModal');
        const iframe = document.getElementById('videoIframe');
        modal.classList.remove('active');
        iframe.src = '';
    }
});

// ===== نموذج الاتصال - واتساب + Supabase =====
document.getElementById('contactForm').addEventListener('submit', async function(e) {
    e.preventDefault();

    const name = document.getElementById('whatsappName').value.trim();
    const email = document.getElementById('whatsappEmail').value.trim();
    const subject = document.getElementById('whatsappSubject').value.trim();
    const message = document.getElementById('whatsappMessage').value.trim();

    if (!name || !email || !message) {
        alert('Please fill in all required fields.');
        return;
    }

    // حفظ في Supabase
    try {
        const { error } = await supabaseClient
            .from('messages')
            .insert([{ name, email, subject, message }]);
        
        if (error) {
            console.log('⚠️ Could not save to Supabase:', error.message);
        } else {
            console.log('✅ Message saved to Supabase');
        }
    } catch (err) {
        console.log('⚠️ Error saving to Supabase:', err.message);
    }

    // إرسال على واتساب
    const phoneNumber = '201220906218';

    let whatsappMessage = '📩 *New Message from Adham Elgaml Portfolio*%0A%0A';
    whatsappMessage += '*Name:* ' + name + '%0A';
    whatsappMessage += '*Email:* ' + email + '%0A';
    if (subject) {
        whatsappMessage += '*Subject:* ' + subject + '%0A';
    }
    whatsappMessage += '*Message:* ' + message;

    const whatsappUrl = 'https://wa.me/' + phoneNumber + '?text=' + whatsappMessage;
    window.open(whatsappUrl, '_blank');

    alert('✅ Message sent successfully! Check your WhatsApp.');
    this.reset();
});

// ===== تحميل الصفحة =====
async function init() {
    videos = await loadVideos();
    renderVideos();
    console.log('✅ Page loaded successfully!');
}

init();