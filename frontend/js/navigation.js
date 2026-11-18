(() => {
  const links = document.querySelectorAll(".nav-link[data-page]");
  links.forEach((link) => {
    link.addEventListener("click", () => {
      links.forEach((item) => item.classList.remove("active"));
      link.classList.add("active");
    });
  });
})();
