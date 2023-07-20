const arBtn = document.querySelector(".arBtn");
const arModel = document.querySelector(".arModel");

const toggleAr = () => {
	arModel.setAttribute("camera-controls", "");
	arModel.setAttribute("autoplay", "");
};

arBtn.addEventListener("click", toggleAr);
