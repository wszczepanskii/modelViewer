const arBtn = document.querySelector(".arBtn");
const arModel = document.querySelector(".arModel");

const toggleAr = () => {
	arModel.setAttribute("autoplay", "");
	// arModel.scale = "0.1 0.1 0.1";
};

arBtn.addEventListener("click", toggleAr);
