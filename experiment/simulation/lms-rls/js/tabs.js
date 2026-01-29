document.addEventListener("DOMContentLoaded", function () {

  const algoBtns = document.querySelectorAll(".tab-btn[data-algo]");
  const appBtns  = document.querySelectorAll(".tab-btn[data-app]");

  const algo = document.body.dataset.algo;
  const app  = document.body.dataset.app;

  // set active
  algoBtns.forEach(btn => {
    if (btn.dataset.algo === algo) btn.classList.add("active");
  });

  appBtns.forEach(btn => {
    if (btn.dataset.app === app) btn.classList.add("active");
  });

  // algo switching
  algoBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      window.location.href =
        btn.dataset.algo.toLowerCase() + "-" + app.toLowerCase() + ".html";
    });
  });

  // app switching
  appBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      window.location.href =
        algo.toLowerCase() + "-" + btn.dataset.app.toLowerCase() + ".html";
    });
  });

});
