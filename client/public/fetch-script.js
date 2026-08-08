function loadForm() {
  fetch("/motor-request.html")
    .then(response => response.text())
    .then(html => {
      const container = document.getElementById("motor-form-container");
      container.innerHTML = html;
      
      // Execute scripts inside the fetched HTML
      const scripts = container.querySelectorAll("script");
      scripts.forEach(oldScript => {
        const newScript = document.createElement("script");
        Array.from(oldScript.attributes).forEach(attr => newScript.setAttribute(attr.name, attr.value));
        newScript.appendChild(document.createTextNode(oldScript.innerHTML));
        oldScript.parentNode.replaceChild(newScript, oldScript);
      });
      
      if (typeof Load_CountryCode_Selector === "function") {
        Load_CountryCode_Selector();
      }
    })
    .catch(err => console.error("Failed to load form:", err));
}
loadForm();
