import express from "express";
import dotenv from "dotenv";

dotenv.config(); // Charge les variables d'environnement

const app = express();
const PORT = process.env.PORT || 5000;

// Route principale
app.get("/", (req, res) => {
    res.send("✅ Serveur Node.js en TypeScript fonctionne !");
});

// Démarrage du serveur
app.listen(PORT, () => {
    console.log(`🚀 Serveur lancé sur http://localhost:${PORT}`);
});
