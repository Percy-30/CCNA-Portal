document.addEventListener('DOMContentLoaded', () => {
    const sidebarNav = document.querySelector('.sidebar-nav');
    const contentViewer = document.getElementById('content-viewer');
    let modulesData = [];

    async function init() {
        try {
            const response = await fetch('data/index.json');
            modulesData = await response.json();
            renderHome();
        } catch (error) { console.error(error); }
    }

    function renderHome() {
        sidebarNav.innerHTML = ''; 
        contentViewer.innerHTML = `
            <div class="welcome-screen">
                <h1>Módulos de CCNA 1 v7.0</h1>
                <div class="module-grid" id="module-grid"></div>
            </div>
        `;
        const grid = document.getElementById('module-grid');
        modulesData.forEach(mod => {
            const card = document.createElement('div');
            card.className = 'welcome-card';
            card.innerHTML = `<div class="circle-icon">≡</div><h3>Módulo ${mod.id}</h3><p>${mod.name}</p>`;
            card.onclick = () => loadModuleView(mod.id);
            grid.appendChild(card);
        });
    }

    async function downloadCurrentPDF() {
        const loadingDiv = document.createElement('div');
        loadingDiv.id = 'print-loader';
        loadingDiv.innerHTML = `<div style="position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.9); color:white; display:flex; flex-direction:column; align-items:center; justify-content:center; z-index:9999; text-align:center;">
            <i class="fas fa-sync fa-spin fa-4x" style="color:var(--cisco-green); margin-bottom:20px;"></i>
            <h2>Sincronizando Traducción Completa...</h2>
            <p>Estamos recorriendo el módulo para asegurar que todo esté en español.</p>
        </div>`;
        document.body.appendChild(loadingDiv);

        // BARRIDO AUTOMÁTICO: Scroll rápido hasta el final y regreso
        const totalHeight = contentViewer.scrollHeight;
        let currentPos = 0;
        const scrollStep = 800; // Paso de scroll

        const scrollInterval = setInterval(() => {
            currentPos += scrollStep;
            contentViewer.scrollTo(0, currentPos);
            
            if (currentPos >= totalHeight) {
                clearInterval(scrollInterval);
                // Esperar un momento a que Google procese la última parte
                setTimeout(() => {
                    contentViewer.scrollTo(0, 0); // Regresar al inicio
                    document.getElementById('print-loader')?.remove();
                    window.print();
                }, 1500);
            }
        }, 150);
    }

    async function loadModuleView(moduleId) {
        try {
            const response = await fetch(`data/module_${moduleId}.json`);
            const data = await response.json();
            contentViewer.innerHTML = `<div class="module-content entry-content">${data.html}</div>`;
            enableVideos();
            buildAccordion(data);
            contentViewer.scrollTop = 0;
        } catch (error) { console.error(error); }
    }

    function buildAccordion(moduleData) {
        sidebarNav.innerHTML = `<div class="module-accordion" id="accordion-root"></div>`;
        const root = document.getElementById('accordion-root');
        
        const card = document.createElement('div');
        card.className = 'accordion-card expanded';
        card.innerHTML = `
            <div class="accordion-header" id="module-toggle">
                <div class="circle-icon">≡</div>
                <div class="module-title">Módulo ${moduleData.id}: ${moduleData.title}</div>
                <i class="fas fa-chevron-down chevron"></i>
            </div>
            <div class="section-list" id="sections-container" style="display:block"></div>
        `;
        root.appendChild(card);
        document.getElementById('module-toggle').onclick = () => {
            const container = document.getElementById('sections-container');
            const isExpanded = card.classList.toggle('expanded');
            container.style.display = isExpanded ? 'block' : 'none';
        };
        
        const sectionsContainer = document.getElementById('sections-container');
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = moduleData.html;
        tempDiv.querySelectorAll('#ftwp-list > li').forEach((li, idx) => {
            const text = li.querySelector('.ftwp-text').textContent;
            const anchor = li.querySelector('a').getAttribute('href');
            const sectionWrapper = document.createElement('div');
            sectionWrapper.className = 'section-wrapper';
            sectionWrapper.innerHTML = `
                <div class="section-item" data-anchor="${anchor}">
                    <div class="small-circle"><i class="fas fa-chevron-right rotate-icon"></i></div>
                    <span>${text}</span>
                </div>
                <div class="sub-section-list" style="display:none"></div>
            `;
            sectionsContainer.appendChild(sectionWrapper);
            
            const subContainer = sectionWrapper.querySelector('.sub-section-list');
            li.querySelectorAll('.ftwp-sub li').forEach(subLi => {
                const subText = subLi.querySelector('.ftwp-text').textContent;
                const subAnchor = subLi.querySelector('a').getAttribute('href');
                const subItem = document.createElement('div');
                subItem.className = 'sub-section-item';
                subItem.textContent = subText;
                subItem.setAttribute('data-anchor', subAnchor);
                subItem.onclick = (e) => { e.stopPropagation(); const t = document.querySelector(subAnchor); if(t) t.scrollIntoView({behavior:'smooth'}); };
                subContainer.appendChild(subItem);
            });
            sectionWrapper.querySelector('.section-item').onclick = () => toggleSection(sectionWrapper, subContainer, anchor);
        });

        // AÑADIR PANEL DE DESCARGAS AL FINAL DEL SIDEBAR
        const downloadBox = document.createElement('div');
        downloadBox.className = 'sidebar-downloads';
        downloadBox.innerHTML = `
            <div class="download-label">RECURSOS DEL MÓDULO</div>
            <button class="btn-sidebar-download pdf-btn"><i class="fas fa-file-pdf"></i> Descargar PDF</button>
            <button class="btn-sidebar-download ppt-btn"><i class="fas fa-file-powerpoint"></i> Descargar PPT</button>
        `;
        sidebarNav.appendChild(downloadBox);

        downloadBox.querySelector('.pdf-btn').onclick = downloadCurrentPDF;
        downloadBox.querySelector('.ppt-btn').onclick = async () => {
            const fileName = `modulo_${moduleData.id}.pptx`;
            const fileUrl = `downloads/${fileName}`;
            
            try {
                const response = await fetch(fileUrl, { method: 'HEAD' });
                if (response.ok) {
                    window.location.href = fileUrl;
                } else {
                    alert(`¡Atención! Todavía no has guardado el archivo "${fileName}" en la carpeta /downloads de tu proyecto.`);
                }
            } catch (e) {
                alert("Error al intentar acceder a la carpeta de descargas.");
            }
        };

        initScrollSpy();
    }

    function toggleSection(w, c, a) {
        const o = c.style.display === 'block';
        c.style.display = o ? 'none' : 'block';
        const i = w.querySelector('.rotate-icon');
        if(i) i.style.transform = o ? 'rotate(0deg)' : 'rotate(90deg)';
        if(a) { const t = document.querySelector(a); if(t) t.scrollIntoView({behavior:'smooth'}); }
    }

    function initScrollSpy() {
        const obs = new IntersectionObserver((es) => {
            es.forEach(e => { if(e.isIntersecting) highlightSidebar(e.target.id); });
        }, { root: contentViewer, rootMargin: '0px 0px -70% 0px' });
        contentViewer.querySelectorAll('h2, h3').forEach(h => { if(h.id) obs.observe(h); });
    }

    function highlightSidebar(id) {
        const anchor = '#' + id;
        const link = document.querySelector(`[data-anchor="${anchor}"]`);
        document.querySelectorAll('.section-item, .sub-section-item').forEach(el => { el.style.color = ''; el.style.fontWeight = ''; });
        if(link) { 
            link.style.color = 'var(--cisco-green)'; link.style.fontWeight = '700'; 
            link.scrollIntoView({behavior:'smooth', block:'nearest'}); 
        }
    }

    function enableVideos() {
        contentViewer.querySelectorAll('.flying-press-youtube, [data-src*="youtube"]').forEach(span => {
            let src = span.getAttribute('data-src') || span.getAttribute('src');
            if (src) {
                if (src.startsWith('//')) src = 'https:' + src;
                const vId = src.match(/(?:embed\/|v=)([^?&]+)/)?.[1];
                if (vId) {
                    const c = span.closest('.youtube-video') || span.parentElement;
                    c.innerHTML = `<iframe src="https://www.youtube.com/embed/${vId}" style="position:absolute;top:0;left:0;width:100%;height:100%;border:0;" allowfullscreen></iframe>`;
                    c.style.position = 'relative'; c.style.paddingBottom = '56.25%'; c.style.height = '0';
                    c.style.background = '#000'; c.style.borderRadius = '12px';
                }
            }
        });
    }

    init();
});
