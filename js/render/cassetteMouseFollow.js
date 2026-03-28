
const cassetteElement = document.getElementById("cassette-model");

// How much your mouse influences the rotation of the model
const maximumRotationDegrees = 10;

let currentRotationX = 0;
let currentRotationY = 0;

let targetRotationX = 0;
let targetRotationY = 0;

let rotationVelocityX = 0;
let rotationVelocityY = 0;

const springStiffness = 0.1;
const springDamping = 0.8;

window.addEventListener("mousemove", (event) => {
    const elementRect = cassetteElement.getBoundingClientRect();

    const elementCenterX = elementRect.left + elementRect.width / 2;
    const elementCenterY = elementRect.top + elementRect.height / 2;

    const deltaX = event.clientX - elementCenterX;
    const deltaY = event.clientY - elementCenterY;

    targetRotationY = (deltaX / (window.innerWidth / 2)) * maximumRotationDegrees;
    targetRotationX = -(deltaY / (window.innerHeight / 2)) * maximumRotationDegrees;
});

function animateRotation() {
    const rotationForceX = targetRotationX - currentRotationX;
    const rotationForceY = targetRotationY - currentRotationY;

    rotationVelocityX += rotationForceX * springStiffness;
    rotationVelocityY += rotationForceY * springStiffness;

    rotationVelocityX *= springDamping;
    rotationVelocityY *= springDamping;

    currentRotationX += rotationVelocityX;
    currentRotationY += rotationVelocityY;

    cassetteElement.style.transform = `
        rotateX(${currentRotationX}deg)
        rotateY(${currentRotationY}deg)
        translateZ(var(--cassette-preview-z-center))
    `;

    requestAnimationFrame(animateRotation);
}

animateRotation();