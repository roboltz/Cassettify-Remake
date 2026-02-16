function openPage(pageName) {
    let pageElement = document.getElementById(pageName + "-page");
    let pageButtonElement = document.getElementById(pageName + "-button");
    if (!pageElement.classList.contains("active")) {
        let pageNames = document.getElementsByClassName("page");
        let pageButtonNames = document.getElementsByClassName("page-button");
        for (let i = 0; i < pageNames.length; i++) {
            pageNames[i].classList.remove("active");
            pageButtonNames[i].classList.remove("active");
        };
        pageElement.classList.add("active")
        pageButtonElement.classList.add("active")
    }
};
