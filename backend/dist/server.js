"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const trafficRoutes_1 = __importDefault(require("./routes/trafficRoutes"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3000;
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use(express_1.default.static('public')); // Serve frontend/public if needed
app.use('/api', trafficRoutes_1.default);
app.get('/', (req, res) => {
    res.send('AI Traffic Management System API is Running');
});
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
