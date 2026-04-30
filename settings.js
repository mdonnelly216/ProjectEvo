function setZoom(level) {
    document.body.style.zoom = level;
    localStorage.setItem("pageZoom", level);
}

function biggestZoom() { setZoom("200%"); }
function bigZoom() { setZoom("150%"); }
function normalZoom() { setZoom("100%"); }
function smallZoom() { setZoom("75%");}

// Apply saved zoom automatically on every page load
document.addEventListener("DOMContentLoaded", () => {
    const savedZoom = localStorage.getItem("pageZoom");
    if (savedZoom) {document.body.style.zoom = savedZoom;}
});
