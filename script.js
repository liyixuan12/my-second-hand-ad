// 全局变量
let currentItem = null;

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

// 加载商品数据（只支持YAML）
async function loadItemsData() {
    try {
        console.log('加载 main.yaml...');
        const yamlResponse = await fetch('main.yaml');
        
        if (!yamlResponse.ok) {
            throw new Error(`HTTP error! status: ${yamlResponse.status}`);
        }
        
        const yamlText = await yamlResponse.text();
        console.log('从 YAML 获取的文本:', yamlText);
        
        const yamlData = parseSimpleYAML(yamlText);
        console.log('从 YAML 解析的数据:', yamlData);
        
        if (yamlData && yamlData.items && yamlData.items.length > 0) {
            renderGallery(yamlData.items);
        } else {
            throw new Error('YAML 文件中没有找到商品数据');
        }
    } catch (error) {
        console.error('加载商品数据失败:', error);
        showError(`无法加载商品数据: ${error.message}`);
    }
}

// 删除了不需要的 Markdown 解析函数

// 简单的 YAML 解析器（针对我们的特定格式）
function parseSimpleYAML(yamlText) {
    console.log('开始解析YAML:', yamlText); // 调试信息
    
    const lines = yamlText.split('\n');
    const result = { items: [] };
    let currentItem = null;
    let currentArray = null;
    let currentArrayKey = null;
    let inItemsSection = false;
    
    for (let i = 0; i < lines.length; i++) {
        let line = lines[i];
        line = line.trimRight(); // 只去除右边的空格，保留左边的缩进
        
        if (!line || line.startsWith('#')) continue;
        
        // 检测是否进入 items 部分
        if (line.trim() === 'items:') {
            inItemsSection = true;
            console.log('找到 items 部分');
            continue;
        }
        
        if (!inItemsSection) continue;
        
        // 检测新商品（以 "  - item:" 开始，注意缩进）
        const itemMatch = line.match(/^\s*-\s+item:\s*(.+)$/);
        if (itemMatch) {
            // 保存上一个商品
            if (currentItem) {
                result.items.push(currentItem);
                console.log('添加商品:', currentItem); // 调试信息
            }
            
            currentItem = {};
            currentArray = null;
            currentArrayKey = null;
            
            const itemName = itemMatch[1].trim();
            currentItem.item = itemName;
            console.log('开始新商品:', itemName);
            
        } else if (currentItem) {
            // 商品的属性（检查缩进）
            const propMatch = line.match(/^\s{4,}(\w+):\s*(.*)$/);
            if (propMatch) {
                const key = propMatch[1];
                const value = propMatch[2].trim();
                
                console.log(`找到属性: ${key} = "${value}"`);
                
                if (key === 'images') {
                    // 开始图片数组
                    currentArray = [];
                    currentArrayKey = 'images';
                    currentItem[currentArrayKey] = currentArray;
                    console.log('开始图片数组');
                } else {
                    currentItem[key] = value;
                    currentArray = null;
                    currentArrayKey = null;
                }
            } else if (currentArray) {
                // 数组项（检查缩进）
                const arrayMatch = line.match(/^\s{6,}-\s+(.+)$/);
                if (arrayMatch) {
                    const arrayItem = arrayMatch[1].trim();
                    currentArray.push(arrayItem);
                    console.log('添加数组项:', arrayItem);
                }
            }
        }
    }
    
    // 添加最后一个商品
    if (currentItem) {
        result.items.push(currentItem);
        console.log('添加最后一个商品:', currentItem); // 调试信息
    }
    
    console.log('最终解析结果:', result); // 调试信息
    return result;
}

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
    
    div.innerHTML = `
        <div class="image-container">
            <img src="${item.cover}" alt="${item.item}" loading="lazy" onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDMwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xNTAgMTAwTDEyNSA3NUgxNzVMMTUwIDEwMFoiIGZpbGw9IiNEMUQ1REIiLz4KPHR0ZXh0IHg9IjE1MCIgeT0iMTMwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM2QjczODAiPuWbvueJh+aXoOazleWKoOi9vTwvdGV4dD4KPC9zdmc+'">
        </div>
        <div class="item-info">
            <h3>${item.item}</h3>
            <p class="price">${item.price}</p>
            <p class="description">${item.description}</p>
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
    
    modalTitle.textContent = item.item;
    modalPrice.textContent = item.price;
    modalDescription.textContent = item.description;
    
    // 清空并重新填充图片容器
    modalImagesContainer.innerHTML = '';
    const images = item.images || [item.cover];
    
    images.forEach((imageSrc, index) => {
        const imageDiv = document.createElement('div');
        imageDiv.className = 'modal-image';
        
        const img = document.createElement('img');
        img.src = imageSrc;
        img.alt = `${item.item} - 图片 ${index + 1}`;
        img.loading = 'lazy';
        
        // 图片加载错误处理
        img.onerror = function() {
            this.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDMwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xNTAgMTAwTDEyNSA3NUgxNzVMMTUwIDEwMFoiIGZpbGw9IiNEMUQ1REIiLz4KPHR0ZXh0IHg9IjE1MCIgeT0iMTMwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM2QjczODAiPuWbvueJh+aXoOazleWKoOi9vTwvdGV4dD4KPC9zdmc+';
            this.alt = '图片无法加载';
        };
        
        // 添加点击事件以全屏查看
        img.addEventListener('click', (e) => {
            e.stopPropagation();
            openFullscreen(imageSrc);
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