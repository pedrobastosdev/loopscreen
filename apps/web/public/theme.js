// Aplica a classe "dark" seguindo o sistema. Arquivo externo (não inline) por causa da CSP.
(function () {
  var media = window.matchMedia('(prefers-color-scheme: dark)');
  function apply() {
    document.documentElement.classList.toggle('dark', media.matches);
  }
  apply();
  media.addEventListener('change', apply);
})();
