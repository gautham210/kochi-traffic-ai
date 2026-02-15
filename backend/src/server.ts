import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import trafficRoutes from './routes/trafficRoutes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// 1. Serve static files from public
app.use(express.static(path.join(__dirname, "../public")));

app.use('/api', trafficRoutes);

// 2. Serve dashboard at root
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, "../public/dashboard.html"));
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
