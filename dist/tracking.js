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

        // Ping to keep active
        setInterval(() => {
            if (socket.connected) {
                socket.emit("visitor:ping");
            }
        }, 30000);
    };
    document.head.appendChild(script);
})();
