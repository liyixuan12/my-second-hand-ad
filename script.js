// 全局变量
let currentItem = null;
let currentLanguage = window.currentLanguage || 'zh';

// 获取本地化文本
function getLocalizedText(textObj) {
    if (typeof textObj === 'string') {
        return textObj;
    }
    return textObj[currentLanguage] || textObj.zh || textObj.en || textObj.de || '';
}

// DOM 元素
const modal = document.getElementById('modal');
const modalTitle = document.getElementById('modal-title');
const modalPrice = document.getElementById('modal-price');
const modalDescription = document.getElementById('modal-description');
const closeBtn = document.querySelector('.close');
const galleryContainer = document.getElementById('gallery-container');
const modalImagesContainer = document.getElementById('modal-images-container');
const fullscreenOverlay = document.getElementById('fullscreen-overlay');
const fullscreenImage = document.getElementById('fullscreen-image');
const fullscreenClose = document.querySelector('.fullscreen-close');

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    loadItemsData();
    setupEventListeners();
});

// 设置事件监听器
function setupEventListeners() {
    closeBtn.addEventListener('click', closeModal);
    
    // 点击模态框背景关闭
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal();
        }
    });
    
    // 全屏查看器事件
    fullscreenClose.addEventListener('click', closeFullscreen);
    fullscreenOverlay.addEventListener('click', (e) => {
        if (e.target === fullscreenOverlay) {
            closeFullscreen();
        }
    });
    
    // 键盘事件
    document.addEventListener('keydown', (e) => {
        if (modal.style.display === 'block' && e.key === 'Escape') {
            closeModal();
        }
        if (fullscreenOverlay.style.display === 'block' && e.key === 'Escape') {
            closeFullscreen();
        }
    });
}

// 加载商品数据（使用JSON）
async function loadItemsData() {
    try {
        console.log('加载 items.json...');
        // 智能检测 JSON 文件路径
        const jsonPath = window.location.pathname.includes('/zh/') || 
                        window.location.pathname.includes('/en/') || 
                        window.location.pathname.includes('/de/') ? 
                        '../items.json' : 'items.json';
        // 添加时间戳参数避免缓存问题
        const timestamp = new Date().getTime();
        const jsonResponse = await fetch(`${jsonPath}?v=${timestamp}`);
        
        if (!jsonResponse.ok) {
            throw new Error(`HTTP error! status: ${jsonResponse.status}`);
        }
        
        const jsonData = await jsonResponse.json();
        console.log('从 JSON 获取的数据:', jsonData);
        
        if (jsonData && jsonData.items && jsonData.items.length > 0) {
            renderGallery(jsonData.items);
        } else {
            throw new Error('JSON 文件中没有找到商品数据');
        }
    } catch (error) {
        console.error('加载商品数据失败:', error);
        showError(`无法加载商品数据: ${error.message}`);
    }
}

// 使用 JSON 格式，不需要复杂的解析器

// 渲染画廊
function renderGallery(items) {
    galleryContainer.innerHTML = '';
    
    if (items.length === 0) {
        showError('没有找到商品数据');
        return;
    }
    
    items.forEach((item, index) => {
        const galleryItem = createGalleryItem(item, index);
        galleryContainer.appendChild(galleryItem);
    });
    
    // 添加渐入动画
    setTimeout(() => {
        const items = document.querySelectorAll('.gallery-item');
        items.forEach((item, index) => {
            setTimeout(() => {
                item.style.opacity = '1';
                item.style.transform = 'translateY(0)';
            }, index * 100);
        });
    }, 100);
}

// 创建单个画廊项目
function createGalleryItem(item, index) {
    const div = document.createElement('div');
    div.className = 'gallery-item';
    div.style.opacity = '0';
    div.style.transform = 'translateY(30px)';
    div.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    
    // 存储商品数据
    div.dataset.itemData = JSON.stringify(item);
    
    // 获取对应语言的文本
    const itemName = getLocalizedText(item.title) || getLocalizedText(item.item);
    const itemDescription = getLocalizedText(item.description);
    
    // 智能检测图片路径
    const imgPrefix = window.location.pathname.includes('/zh/') || 
                     window.location.pathname.includes('/en/') || 
                     window.location.pathname.includes('/de/') ? '../' : '';
    
    div.innerHTML = `
        <div class="image-container">
            <img src="${imgPrefix}${item.cover}" alt="${itemName}" loading="lazy" onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDMwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xNTAgMTAwTDEyNSA3NUgxNzVMMTUwIDEwMFoiIGZpbGw9IiNEMUQ1REIiLz4KPHR0ZXh0IHg9IjE1MCIgeT0iMTMwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM2QjczODAiPuWbvueJh+aXoOazleWKoOi9vTwvdGV4dD4KPC9zdmc+'">
        </div>
        <div class="item-info">
            <h3>${itemName}</h3>
            <p class="price">${item.price}</p>
            <p class="description">${itemDescription}</p>
        </div>
    `;
    
    // 添加点击事件
    div.addEventListener('click', () => {
        openModal(item);
    });
    
    return div;
}

// 打开模态框
function openModal(item) {
    currentItem = item;
    
    modalTitle.textContent = getLocalizedText(item.title) || getLocalizedText(item.item);
    modalPrice.textContent = item.price;
    modalDescription.textContent = getLocalizedText(item.description);
    
    // 清空并重新填充图片容器
    modalImagesContainer.innerHTML = '';
    const images = item.images || [item.cover];
    
    images.forEach((imageSrc, index) => {
        const imageDiv = document.createElement('div');
        imageDiv.className = 'modal-image';
        
        const img = document.createElement('img');
        // 智能检测图片路径
        const imgPrefix = window.location.pathname.includes('/zh/') || 
                         window.location.pathname.includes('/en/') || 
                         window.location.pathname.includes('/de/') ? '../' : '';
        img.src = imgPrefix + imageSrc;
        img.alt = `${getLocalizedText(item.title) || getLocalizedText(item.item)} - 图片 ${index + 1}`;
        img.loading = 'lazy';
        
        // 图片加载错误处理
        img.onerror = function() {
            this.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDMwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xNTAgMTAwTDEyNSA3NUgxNzVMMTUwIDEwMFoiIGZpbGw9IiNEMUQ1REIiLz4KPHR0ZXh0IHg9IjE1MCIgeT0iMTMwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM2QjczODAiPuWbvueJh+aXoOazleWKoOi9vTwvdGV4dD4KPC9zdmc+';
            this.alt = '图片无法加载';
        };
        
        // 添加点击事件以全屏查看
        img.addEventListener('click', (e) => {
            e.stopPropagation();
            openFullscreen(imgPrefix + imageSrc);
        });
        
        imageDiv.appendChild(img);
        modalImagesContainer.appendChild(imageDiv);
    });
    
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
}

// 关闭模态框
function closeModal() {
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
    currentItem = null;
}

// 显示错误信息
function showError(message) {
    galleryContainer.innerHTML = `<div class="error">${message}</div>`;
}

// 打开全屏图片查看
function openFullscreen(imageSrc) {
    fullscreenImage.src = imageSrc;
    fullscreenOverlay.style.display = 'block';
    document.body.style.overflow = 'hidden';
}

// 关闭全屏图片查看
function closeFullscreen() {
    fullscreenOverlay.style.display = 'none';
    document.body.style.overflow = 'auto';
}