// ============================================
// 🔥 SUPABASE CONFIG - ADHAM ELGAML
// ============================================
const SUPABASE_URL = 'https://rciswlelqiuxklffoals.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJjaXN3bGVscWl1eGtsZmZvYWxzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgyMDg4MzYsImV4cCI6MjEwMzc4NDgzNn0.LyhbehrOo2jTFjz14QGUaEtErbpKW9FtUtRKfQqqxYw';

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ===== متغيرات عامة =====
let videos = [];
let currentCategory = 'all';
let currentEditId = null;

// ===== DOM ELEMENTS =====
const grid = document.getElementById('videosGrid');
const videoCount = document.getElementById('videoCount');
const searchInput = document.getElementById('searchInput');
const searchBar = document.getElementById('searchBar');
const searchToggle = document.getElementById('searchToggle');
const clearSearch = document.getElementById('clearSearch');

// ============================================
// 🚀 FUNCTIONS
// ============================================

// ===== تحويل الرابط إلى Embed تلقائياً =====
function convertToEmbed(url) {
    url = url.trim();
    
    // لو الرابط أصلاً Embed
    if (url.includes('youtube.com/embed/') || 
        url.includes('dailymotion.com/embed/') || 
        url.includes('player.vimeo.com/video/')) {
        return url;
    }
    
    // يوتيوب - رابط المشاركة
    if (url.includes('youtube.com/watch?v=')) {
        let videoId = url.split('v=')[1].split('&')[0];
        return 'https://www.youtube.com/embed/' + videoId;
    }
    
    // يوتيوب - رابط مختصر
    if (url.includes('youtu.be/')) {
        let videoId = url.split('youtu.be/')[1].split('?')[0];
        return 'https://www.youtube.com/embed/' + videoId;
    }
    
    // دايليميشن - رابط مختصر
    if (url.includes('dai.ly/')) {
        let videoId = url.split('dai.ly/')[1].split('?')[0];
        return 'https://www.dailymotion.com/embed/video/' + videoId;
    }
    
    // دايليميشن - رابط كامل
    if (url.includes('dailymotion.com/video/')) {
        let videoId = url.split('dailymotion.com/video/')[1].split('_')[0];
        return 'https://www.dailymotion.com/embed/video/' + videoId;
    }
    
    // فيمو
    if (url.includes('vimeo.com/')) {
        let videoId = url.split('vimeo.com/')[1].split('?')[0];
        return 'https://player.vimeo.com/video/' + videoId;
    }
    
    return url;
}

// ===== استخراج ID الفيديو للثامبنيل =====
function getVideoId(embedUrl) {
    if (embedUrl.includes('youtube.com/embed/')) {
        return embedUrl.split('youtube.com/embed/')[1].split('?')[0];
    }
    if (embedUrl.includes('dailymotion.com/embed/')) {
        return embedUrl.split('dailymotion.com/embed/')[1].split('?')[0];
    }
    if (embedUrl.includes('player.vimeo.com/video/')) {
        return embedUrl.split('player.vimeo.com/video/')[1].split('?')[0];
    }
    return null;
}

// ===== بناء رابط الثامبنيل =====
function getThumbnail(embedUrl, title) {
    const videoId = getVideoId(embedUrl);
    
    if (embedUrl.includes('youtube.com/embed/') && videoId) {
        return 'https://img.youtube.com/vi/' + videoId + '/hqdefault.jpg';
    }
    if (embedUrl.includes('dailymotion.com/embed/') && videoId) {
        return 'https://www.dailymotion.com/thumbnail/video/' + videoId;
    }
    if (embedUrl.includes('player.vimeo.com/video/') && videoId) {
        return 'https://vumbnail.com/' + videoId + '.jpg';
    }
    
    // fallback
    return 'https://picsum.photos/seed/' + encodeURIComponent(title) + '/300/170';
}

// ===== تحميل الفيديوهات =====
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

// ===== عرض الفيديوهات =====
function renderVideos() {
    const searchTerm = searchInput.value.toLowerCase().trim();
    let filtered = videos;

    if (currentCategory !== 'all') {
        filtered = filtered.filter(v => v.category === currentCategory);
    }

    if (searchTerm) {
        filtered = filtered.filter(v => 
            v.title.toLowerCase().includes(searchTerm) || 
            v.description.toLowerCase().includes(searchTerm)
        );
    }

    if (filtered.length === 0) {
        grid.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-video-slash"></i>
                <h3>No Videos Found</h3>
                <p>${searchTerm ? 'No results matching your search' : 'Add your first video now!'}</p>
            </div>
        `;
    } else {
        grid.innerHTML = filtered.map(video => `
            <div class="video-card">
                <div class="video-thumbnail" onclick="playVideo('${video.url}', '${video.title}')">
                    <img src="${video.thumbnail}" alt="${video.title}" />
                    <div class="play-icon"><i class="fas fa-play-circle"></i></div>
                    <span class="category-tag">${video.category}</span>
                </div>
                <div class="video-info">
                    <h4>${video.title}</h4>
                    <p>${video.description || 'No description'}</p>
                    <div class="video-actions">
                        <button class="edit-btn" onclick="openEditModal(${video.id})">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        <button class="delete-btn" onclick="deleteVideo(${video.id})">
                            <i class="fas fa-trash-alt"></i> Delete
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    updateCount();
}

// ===== تحديث العدد =====
function updateCount() {
    const visibleCards = document.querySelectorAll('.video-card');
    videoCount.textContent = visibleCards.length + ' videos';
}

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

// ===== تصفية حسب التصنيف =====
document.querySelectorAll('.category-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
        document.querySelectorAll('.category-btn').forEach(function(b) {
            b.classList.remove('active');
        });
        this.classList.add('active');
        currentCategory = this.dataset.category;
        renderVideos();
    });
});

// ===== البحث =====
searchToggle.addEventListener('click', function() {
    searchBar.classList.toggle('active');
    if (searchBar.classList.contains('active')) {
        searchInput.focus();
    }
});

searchInput.addEventListener('input', renderVideos);

clearSearch.addEventListener('click', function() {
    searchInput.value = '';
    renderVideos();
    searchBar.classList.remove('active');
});

// ===== إضافة فيديو =====
document.getElementById('openAddModal').addEventListener('click', function() {
    document.getElementById('addModal').classList.add('active');
});

document.getElementById('closeModal').addEventListener('click', function() {
    document.getElementById('addModal').classList.remove('active');
});

document.getElementById('addVideoForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const title = document.getElementById('addTitle').value;
    const url = document.getElementById('addUrl').value;
    const category = document.getElementById('addCategory').value;
    const description = document.getElementById('addDescription').value;

    if (!title || !url || !category) {
        alert('Please fill in all required fields');
        return;
    }

    // تحويل الرابط إلى Embed
    const embedUrl = convertToEmbed(url);
    
    // استخراج الثامبنيل
    const thumbnail = getThumbnail(embedUrl, title);

    const newVideo = {
        title: title,
        description: description || 'No description',
        category: category,
        url: embedUrl,
        thumbnail: thumbnail
    };

    const addedVideo = await addVideoToSupabase(newVideo);
    if (addedVideo) {
        videos.unshift(addedVideo);
        renderVideos();
        this.reset();
        document.getElementById('addModal').classList.remove('active');
        alert('✅ Video added successfully!');
    } else {
        alert('❌ Failed to add video. Please try again.');
    }
});

// ===== فتح مودال التعديل =====
function openEditModal(id) {
    const video = videos.find(v => v.id === id);
    if (!video) return;

    currentEditId = id;
    document.getElementById('editId').value = id;
    document.getElementById('editTitle').value = video.title;
    document.getElementById('editUrl').value = video.url;
    document.getElementById('editCategory').value = video.category;
    document.getElementById('editDescription').value = video.description || '';
    
    document.getElementById('editModal').classList.add('active');
}

document.getElementById('closeEditModal').addEventListener('click', function() {
    document.getElementById('editModal').classList.remove('active');
});

document.getElementById('editVideoForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const id = parseInt(document.getElementById('editId').value);
    const embedUrl = convertToEmbed(document.getElementById('editUrl').value);
    
    const updates = {
        title: document.getElementById('editTitle').value,
        url: embedUrl,
        category: document.getElementById('editCategory').value,
        description: document.getElementById('editDescription').value,
        thumbnail: getThumbnail(embedUrl, document.getElementById('editTitle').value)
    };

    const updatedVideo = await updateVideoInSupabase(id, updates);
    if (updatedVideo) {
        const index = videos.findIndex(v => v.id === id);
        if (index !== -1) videos[index] = updatedVideo;
        renderVideos();
        document.getElementById('editModal').classList.remove('active');
        alert('✅ Video updated successfully!');
    } else {
        alert('❌ Failed to update video. Please try again.');
    }
});

// ===== حذف فيديو =====
async function deleteVideo(id) {
    if (!confirm('Are you sure you want to delete this video?')) return;
    
    const success = await deleteVideoFromSupabase(id);
    if (success) {
        videos = videos.filter(v => v.id !== id);
        renderVideos();
        alert('✅ Video deleted successfully!');
    } else {
        alert('❌ Failed to delete video. Please try again.');
    }
}

// ===== إغلاق المودالات =====
window.addEventListener('click', function(e) {
    if (e.target.classList.contains('modal')) {
        document.querySelectorAll('.modal').forEach(function(modal) {
            modal.classList.remove('active');
        });
        const iframe = document.getElementById('videoIframe');
        if (iframe) iframe.src = '';
    }
});

document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        document.querySelectorAll('.modal').forEach(function(modal) {
            modal.classList.remove('active');
        });
        const iframe = document.getElementById('videoIframe');
        if (iframe) iframe.src = '';
    }
});

// ===== إضافة فيديو في Supabase =====
async function addVideoToSupabase(video) {
    try {
        const { data, error } = await supabaseClient
            .from('videos')
            .insert([video])
            .select();

        if (error) {
            console.log('⚠️ Error adding video:', error.message);
            return null;
        }
        console.log('✅ Video added successfully!');
        return data[0];
    } catch (err) {
        console.log('⚠️ Error:', err.message);
        return null;
    }
}

// ===== تحديث فيديو في Supabase =====
async function updateVideoInSupabase(id, updates) {
    try {
        const { data, error } = await supabaseClient
            .from('videos')
            .update(updates)
            .eq('id', id)
            .select();

        if (error) {
            console.log('⚠️ Error updating video:', error.message);
            return null;
        }
        console.log('✅ Video updated successfully!');
        return data[0];
    } catch (err) {
        console.log('⚠️ Error:', err.message);
        return null;
    }
}

// ===== حذف فيديو من Supabase =====
async function deleteVideoFromSupabase(id) {
    try {
        const { error } = await supabaseClient
            .from('videos')
            .delete()
            .eq('id', id);

        if (error) {
            console.log('⚠️ Error deleting video:', error.message);
            return false;
        }
        console.log('✅ Video deleted successfully!');
        return true;
    } catch (err) {
        console.log('⚠️ Error:', err.message);
        return false;
    }
}

// ===== INITIAL LOAD =====
async function init() {
    videos = await loadVideos();
    renderVideos();
    console.log('✅ Dashboard loaded successfully!');
}

init();