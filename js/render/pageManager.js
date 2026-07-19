let currentActiveTab = 'home';

function openPage(pageName) {
    if (pageName === 'export') {
        const modal = document.getElementById("export-page");
        const btn = document.getElementById("export-button");
        if (modal) modal.classList.add("active");
        if (btn) btn.classList.add("active");
        
        if (typeof window.loadExportPage === 'function') {
            window.loadExportPage();
        }
        return;
    }
    
    currentActiveTab = pageName;
    let pageElement = document.getElementById(pageName + "-page");
    let pageButtonElement = document.getElementById(pageName + "-button");
    
    if (pageElement && !pageElement.classList.contains("active")) {
        let pages = document.getElementsByClassName("page");
        let pageButtons = document.getElementsByClassName("page-button");
        
        for (let i = 0; i < pages.length; i++) {
            if (pages[i].id === 'export-page') continue;
            pages[i].classList.remove("active");
        }
        for (let i = 0; i < pageButtons.length; i++) {
            if (pageButtons[i].id === 'export-button') continue;
            pageButtons[i].classList.remove("active");
        }
        
        pageElement.classList.add("active");
        if (pageButtonElement) pageButtonElement.classList.add("active");
        
        if (pageName === 'visuals' && typeof window.loadVisualsPage === 'function') {
            window.loadVisualsPage();
        }
        
        if (pageName === 'config' && typeof window.refreshConfigPage === 'function') {
            window.refreshConfigPage();
        }
        
        if (pageName === 'track' && typeof window.loadTrackPage === 'function') {
            window.loadTrackPage();
        }
    }
}

function closeExportModal() {
    const modal = document.getElementById("export-page");
    const btn = document.getElementById("export-button");
    if (modal) modal.classList.remove("active");
    if (btn) btn.classList.remove("active");
    
    const activeBtn = document.getElementById(currentActiveTab + "-button");
    if (activeBtn) activeBtn.classList.add("active");
}

